// Weighted profile completion score across every module.
// Inputs are raw counts/flags so the function stays pure and testable.

export type ProfileSection =
  | "academic"
  | "portfolio"
  | "documents"
  | "study"
  | "german"
  | "applications"
  | "journey"
  | "budget";

export type ProfileSignals = {
  hasCgpa: boolean;
  hasCredits: boolean;
  hasBachelorSubject: boolean;
  projects: number;
  certificates: number;
  documents: number;
  documentsRequired: number;
  studyMinutes7d: number;
  germanLevel: string | null;
  hasIeltsOrToefl: boolean;
  apsDone: boolean;
  universities: number;
  applicationsSubmitted: number;
  journeyCompletionPct: number;
  hasBudgetEntries: boolean;
  hasSavingsGoal: boolean;
};

export type ProfileBreakdown = Record<
  ProfileSection,
  { score: number; max: number; label: string }
>;

export type ProfileScoreResult = {
  score: number; // 0–100
  breakdown: ProfileBreakdown;
  missing: string[];
  suggestions: string[];
};

const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];

export function computeProfileScore(s: ProfileSignals): ProfileScoreResult {
  const sec: ProfileBreakdown = {
    academic: {
      label: "Academic",
      max: 15,
      score: (s.hasCgpa ? 6 : 0) + (s.hasCredits ? 5 : 0) + (s.hasBachelorSubject ? 4 : 0),
    },
    portfolio: {
      label: "Portfolio",
      max: 15,
      score: Math.min(15, s.projects * 3 + s.certificates * 2),
    },
    documents: {
      label: "Documents",
      max: 15,
      score:
        s.documentsRequired > 0
          ? Math.round((Math.min(s.documents, s.documentsRequired) / s.documentsRequired) * 15)
          : Math.min(15, s.documents * 2),
    },
    study: {
      label: "Study",
      max: 10,
      score: Math.min(10, Math.round(s.studyMinutes7d / 60)),
    },
    german: {
      label: "German",
      max: 15,
      score: s.germanLevel ? Math.min(15, (LEVELS.indexOf(s.germanLevel) + 1) * 3) : 0,
    },
    applications: {
      label: "Applications",
      max: 15,
      score:
        (s.hasIeltsOrToefl ? 4 : 0) +
        (s.apsDone ? 4 : 0) +
        Math.min(4, s.universities) +
        Math.min(3, s.applicationsSubmitted * 1.5),
    },
    journey: {
      label: "Journey",
      max: 10,
      score: Math.round((s.journeyCompletionPct / 100) * 10),
    },
    budget: {
      label: "Budget",
      max: 5,
      score: (s.hasBudgetEntries ? 3 : 0) + (s.hasSavingsGoal ? 2 : 0),
    },
  };

  const total = Object.values(sec).reduce((a, b) => a + b.score, 0);
  const max = Object.values(sec).reduce((a, b) => a + b.max, 0);
  const score = Math.round((total / max) * 100);

  const missing: string[] = [];
  if (!s.hasCgpa) missing.push("CGPA");
  if (!s.hasCredits) missing.push("Total ECTS/credits");
  if (!s.hasBachelorSubject) missing.push("Bachelor subject");
  if (s.projects < 2) missing.push("More portfolio projects");
  if (s.certificates < 1) missing.push("At least one certificate");
  if (!s.germanLevel) missing.push("German level");
  if (!s.hasIeltsOrToefl) missing.push("English test score");
  if (!s.apsDone) missing.push("APS certificate");
  if (!s.hasSavingsGoal) missing.push("Savings goal");

  const suggestions: string[] = [];
  const ranked = Object.entries(sec)
    .map(([k, v]) => ({ k: k as ProfileSection, pct: v.score / v.max }))
    .sort((a, b) => a.pct - b.pct);
  for (const r of ranked.slice(0, 3)) {
    if (r.pct >= 0.9) continue;
    suggestions.push(SUGGESTION[r.k]);
  }

  return { score, breakdown: sec, missing, suggestions };
}

const SUGGESTION: Record<ProfileSection, string> = {
  academic: "Complete CGPA, total credits and bachelor subject in your profile.",
  portfolio: "Add 1–2 strong projects with GitHub or demo links.",
  documents: "Upload the missing documents on the Germany Journey page.",
  study: "Log a daily study session — even 30 minutes counts.",
  german: "Move to the next CEFR level on the German Learning module.",
  applications: "Add an IELTS/TOEFL score and start the APS process.",
  journey: "Tick off pre-application tasks on the Germany Journey.",
  budget: "Set a monthly savings goal and log your first entries.",
};
