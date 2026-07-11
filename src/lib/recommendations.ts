// University Recommendation Engine.
// Deterministic scoring based on user profile vs. university requirements.
// The AI layer (server function) adds natural-language reasoning on top of
// these scores — scoring stays testable and offline-safe.
import type { Database } from "@/integrations/supabase/types";

type University = Database["public"]["Tables"]["universities"]["Row"];

/** Consolidated profile context used by the ranking engine. Callers assemble
 *  it from `profiles`, `education`, and `certificates` — keeping the engine
 *  independent of any single DB table shape. */
export type ProfileContext = {
  current_german_level?: string | null;
  current_cgpa?: number | null;
  ielts_score?: number | null;
  toefl_score?: number | null;
  target_intake?: string | null;
};

export type RecBucket = "safe" | "moderate" | "dream" | "ambitious";

export type RecommendationScore = {
  university: University;
  matchScore: number; // 0-100 blended fit
  acceptanceProbability: number; // 0-100 estimated
  bucket: RecBucket;
  gaps: string[];
  strengths: string[];
};

// CGPA scale is 0-4. Assume anything > 4 uses the 10-scale and normalise.
function normaliseCgpa(cgpa: number | null | undefined): number | null {
  if (cgpa == null) return null;
  if (cgpa > 4 && cgpa <= 10) return (cgpa / 10) * 4;
  return cgpa;
}

const CEFR_ORDER = ["A1", "A2", "B1", "B2", "C1", "C2"];
function cefrIndex(level: string | null | undefined): number {
  if (!level) return -1;
  return CEFR_ORDER.indexOf(level.toUpperCase());
}

/** Extract a required CEFR level like B1/B2/C1 from a free-form requirement string. */
function requiredCefr(text: string | null | undefined): string | null {
  if (!text) return null;
  const m = text.toUpperCase().match(/\b(A1|A2|B1|B2|C1|C2)\b/);
  return m ? m[1] : null;
}

/** Extract IELTS/TOEFL threshold from an english_requirement string. */
function englishScore(text: string | null | undefined): { ielts?: number; toefl?: number } {
  if (!text) return {};
  const ielts = text.match(/IELTS\s*[:-]?\s*(\d+(?:\.\d+)?)/i);
  const toefl = text.match(/TOEFL\s*[:-]?\s*(\d+)/i);
  return {
    ielts: ielts ? Number(ielts[1]) : undefined,
    toefl: toefl ? Number(toefl[1]) : undefined,
  };
}

export function scoreUniversity(uni: University, profile: ProfileContext): RecommendationScore {
  const gaps: string[] = [];
  const strengths: string[] = [];
  let score = 50; // baseline

  // CGPA match (max +/- 25)
  const userCgpa = normaliseCgpa(profile.current_cgpa);
  const reqCgpa = normaliseCgpa(uni.cgpa_required);
  if (userCgpa != null && reqCgpa != null) {
    const diff = userCgpa - reqCgpa;
    score += Math.max(-25, Math.min(25, diff * 15));
    if (diff < -0.3)
      gaps.push(`CGPA below requirement (${userCgpa.toFixed(2)} < ${reqCgpa.toFixed(2)})`);
    else if (diff > 0.3)
      strengths.push(`Strong CGPA (${userCgpa.toFixed(2)} vs ${reqCgpa.toFixed(2)} required)`);
  }

  // German level match (max +/- 15)
  const userDe = cefrIndex(profile.current_german_level);
  const reqDe = cefrIndex(requiredCefr(uni.german_requirement));
  if (reqDe >= 0) {
    if (userDe < 0) {
      score -= 10;
      gaps.push("German level not recorded; requirement is " + CEFR_ORDER[reqDe]);
    } else if (userDe < reqDe) {
      score -= (reqDe - userDe) * 6;
      gaps.push(`German ${CEFR_ORDER[userDe]} < required ${CEFR_ORDER[reqDe]}`);
    } else {
      score += Math.min(10, (userDe - reqDe) * 5);
      strengths.push(`German ${CEFR_ORDER[userDe]} meets requirement`);
    }
  }

  // English score match (max +/- 10)
  const req = englishScore(uni.english_requirement);
  // We only have a text profile field for English score - light-touch heuristic.
  if (req.ielts) {
    const userIelts = Number(profile.ielts_score ?? NaN);
    if (Number.isFinite(userIelts)) {
      if (userIelts < req.ielts) {
        score -= 8;
        gaps.push(`IELTS ${userIelts} < ${req.ielts}`);
      } else strengths.push(`IELTS ${userIelts} meets ${req.ielts}`);
    }
  }

  // Ranking preference: lower QS ranking = harder
  const rank = uni.qs_ranking ?? null;
  if (rank != null) {
    if (rank <= 50) score -= 8;
    else if (rank <= 200) score -= 3;
    else if (rank >= 500) score += 5;
  }

  // Scholarship / part-time / internship perks — small bonuses
  if (uni.scholarship) {
    score += 3;
    strengths.push("Scholarship options available");
  }
  if (uni.part_time) score += 1;
  if (uni.internship) score += 1;

  // Tuition affordability
  const tuition = uni.tuition_fee_eur ?? 0;
  if (tuition === 0) {
    score += 4;
    strengths.push("Tuition-free");
  } else if (tuition > 15000) {
    score -= 4;
    gaps.push(`High tuition €${tuition}`);
  }

  // Missing critical requirements
  if (uni.aps_required) gaps.push("APS certificate required");
  if (uni.uni_assist) gaps.push("Applies via uni-assist");

  const matchScore = Math.max(0, Math.min(100, Math.round(score)));

  // Bucket by acceptance probability, which is a smoothed version of match.
  const acceptance = Math.round(
    Math.max(
      5,
      Math.min(95, matchScore * 0.85 + (uni.qs_ranking && uni.qs_ranking > 300 ? 10 : 0)),
    ),
  );
  const bucket: RecBucket =
    acceptance >= 75
      ? "safe"
      : acceptance >= 55
        ? "moderate"
        : acceptance >= 35
          ? "ambitious"
          : "dream";

  return {
    university: uni,
    matchScore,
    acceptanceProbability: acceptance,
    bucket,
    gaps,
    strengths,
  };
}

export function rankUniversities(
  list: University[],
  profile: ProfileContext,
): RecommendationScore[] {
  return list.map((u) => scoreUniversity(u, profile)).sort((a, b) => b.matchScore - a.matchScore);
}

export function bucketize(scores: RecommendationScore[]): Record<RecBucket, RecommendationScore[]> {
  const out: Record<RecBucket, RecommendationScore[]> = {
    safe: [],
    moderate: [],
    ambitious: [],
    dream: [],
  };
  for (const s of scores) out[s.bucket].push(s);
  return out;
}
