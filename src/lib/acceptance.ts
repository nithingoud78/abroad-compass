// Rule-based Acceptance Chance engine for university applications.
// No AI — deterministic scoring from the user's academic profile vs the
// university's stated requirements. Returns a band + explanations.

export type AcceptanceBand = "very_high" | "high" | "medium" | "low" | "very_low";

export type StudentProfile = {
  cgpa: number | null; // 0–10
  totalCredits: number | null; // ECTS-equivalent estimate
  germanLevel: string | null; // e.g. "A1".."C2"
  englishScore: { test: "IELTS" | "TOEFL" | null; band: number | null } | null;
  apsDone: boolean;
  bachelorSubject: string | null;
  completedSubjects: string[]; // lowercase tokens
  certificates: number;
  projects: number;
  backlogs: number; // count of failed/active backlogs
};

export type UniversityForCheck = {
  name: string;
  course: string | null;
  cgpa_required: number | null;
  ects_required: number | null;
  english_requirement: string | null; // e.g. "IELTS 6.5"
  german_requirement: string | null; // e.g. "B2"
  aps_required: boolean | null;
  required_subjects: string[] | null;
};

export type AcceptanceResult = {
  band: AcceptanceBand;
  score: number; // 0–100
  strengths: string[];
  weaknesses: string[];
  missing: string[];
};

const GERMAN_ORDER = ["A1", "A2", "B1", "B2", "C1", "C2"];

function parseEnglishRequirement(req: string | null) {
  if (!req) return null;
  const m = req.match(/(IELTS|TOEFL)\s*([\d.]+)/i);
  if (!m) return null;
  return { test: m[1].toUpperCase() as "IELTS" | "TOEFL", band: parseFloat(m[2]) };
}

function parseGermanRequirement(req: string | null) {
  if (!req) return null;
  const m = req.match(/[ABC][12]/);
  return m ? m[0] : null;
}

export function scoreAcceptance(
  profile: StudentProfile,
  uni: UniversityForCheck,
): AcceptanceResult {
  let score = 50;
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const missing: string[] = [];

  // CGPA
  if (uni.cgpa_required != null && profile.cgpa != null) {
    const diff = profile.cgpa - uni.cgpa_required;
    if (diff >= 1) {
      score += 18;
      strengths.push(
        `CGPA ${profile.cgpa} comfortably exceeds the ${uni.cgpa_required} requirement`,
      );
    } else if (diff >= 0.3) {
      score += 12;
      strengths.push(`CGPA ${profile.cgpa} clears the ${uni.cgpa_required} requirement`);
    } else if (diff >= 0) {
      score += 4;
    } else if (diff >= -0.3) {
      score -= 8;
      weaknesses.push(`CGPA ${profile.cgpa} is just under the ${uni.cgpa_required} requirement`);
    } else {
      score -= 22;
      weaknesses.push(`CGPA ${profile.cgpa} is below the ${uni.cgpa_required} requirement`);
    }
  } else if (uni.cgpa_required != null) {
    missing.push("CGPA not set in your profile");
  }

  // ECTS / credits
  if (uni.ects_required != null && profile.totalCredits != null) {
    if (profile.totalCredits >= uni.ects_required) {
      score += 10;
      strengths.push(`${profile.totalCredits} ECTS meets the ${uni.ects_required} requirement`);
    } else {
      const gap = uni.ects_required - profile.totalCredits;
      score -= Math.min(20, gap / 6);
      weaknesses.push(`${gap} ECTS short of the ${uni.ects_required} requirement`);
    }
  }

  // German
  const reqGerman = parseGermanRequirement(uni.german_requirement);
  if (reqGerman) {
    const have =
      profile.germanLevel && GERMAN_ORDER.includes(profile.germanLevel)
        ? GERMAN_ORDER.indexOf(profile.germanLevel)
        : -1;
    const need = GERMAN_ORDER.indexOf(reqGerman);
    if (have < 0) {
      score -= 10;
      missing.push(`German level not set — needs ${reqGerman}`);
    } else if (have >= need) {
      score += 8;
      strengths.push(`German ${profile.germanLevel} meets ${reqGerman}`);
    } else {
      score -= (need - have) * 6;
      weaknesses.push(`German ${profile.germanLevel ?? "—"} below ${reqGerman}`);
    }
  }

  // English
  const reqEng = parseEnglishRequirement(uni.english_requirement);
  if (reqEng && profile.englishScore?.band != null) {
    if (profile.englishScore.band >= reqEng.band) {
      score += 6;
      strengths.push(
        `${profile.englishScore.test ?? "English"} ${profile.englishScore.band} meets ${reqEng.test} ${reqEng.band}`,
      );
    } else {
      score -= 10;
      weaknesses.push(`English ${profile.englishScore.band} below ${reqEng.test} ${reqEng.band}`);
    }
  } else if (reqEng) {
    missing.push(`English score not set — needs ${reqEng.test} ${reqEng.band}`);
  }

  // APS
  if (uni.aps_required) {
    if (profile.apsDone) {
      score += 6;
      strengths.push("APS certificate ready");
    } else {
      score -= 10;
      missing.push("APS certificate not yet obtained");
    }
  }

  // Subject prerequisites
  if (uni.required_subjects && uni.required_subjects.length > 0) {
    const have = new Set(profile.completedSubjects.map((s) => s.toLowerCase()));
    const lacking = uni.required_subjects.filter((s) => !have.has(s.toLowerCase()));
    if (lacking.length === 0) {
      score += 8;
      strengths.push("All prerequisite subjects covered");
    } else {
      score -= Math.min(18, lacking.length * 4);
      missing.push(`Missing prerequisite subjects: ${lacking.join(", ")}`);
    }
  }

  // Subject relevance (bachelor vs course)
  if (uni.course && profile.bachelorSubject) {
    const c = uni.course.toLowerCase();
    const b = profile.bachelorSubject.toLowerCase();
    const tokens = b.split(/\s+/).filter((t) => t.length > 3);
    if (tokens.some((t) => c.includes(t))) {
      score += 6;
      strengths.push("Bachelor subject aligns with target course");
    } else {
      score -= 4;
      weaknesses.push("Bachelor subject only loosely matches target course");
    }
  }

  // Portfolio
  if (profile.projects >= 3) {
    score += 4;
    strengths.push(`${profile.projects} projects strengthen your portfolio`);
  }
  if (profile.certificates >= 2) {
    score += 3;
    strengths.push(`${profile.certificates} certificates support your application`);
  }

  // Backlogs
  if (profile.backlogs > 0) {
    score -= Math.min(15, profile.backlogs * 4);
    weaknesses.push(`${profile.backlogs} backlog${profile.backlogs > 1 ? "s" : ""} on transcript`);
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  const band: AcceptanceBand =
    score >= 80
      ? "very_high"
      : score >= 65
        ? "high"
        : score >= 50
          ? "medium"
          : score >= 35
            ? "low"
            : "very_low";

  return { band, score, strengths, weaknesses, missing };
}

export const BAND_LABEL: Record<AcceptanceBand, string> = {
  very_high: "Very High",
  high: "High",
  medium: "Medium",
  low: "Low",
  very_low: "Very Low",
};

export const BAND_TONE: Record<AcceptanceBand, string> = {
  very_high: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  high: "bg-green-500/15 text-green-700 dark:text-green-300 border-green-500/30",
  medium: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
  low: "bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/30",
  very_low: "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30",
};
