// Deterministic insights engine. Reads aggregate state and returns a
// ranked list of human-readable insights for the dashboard + module pages.
import { differenceInDays } from "date-fns";

export type InsightTone = "info" | "success" | "warning" | "danger";
export type Insight = {
  id: string;
  tone: InsightTone;
  title: string;
  body: string;
  link?: string;
  score: number; // higher = more urgent
};

export type InsightInputs = {
  tasksOverdue: number;
  tasksDueSoon: number;
  upcomingDeadline: { name: string; date: string } | null;
  monthlyExpense: number;
  monthlyGoal: number | null;
  missingDocs: string[];
  profileScore: number;
  acceptanceTopBand: string | null;
  studyMinutes7d: number;
  germanLevel: string | null;
  journeyCompletionPct: number;
};

const TONE_RANK: Record<InsightTone, number> = { info: 0, success: 1, warning: 2, danger: 3 };

export function computeInsights(i: InsightInputs): Insight[] {
  const out: Insight[] = [];

  if (i.tasksOverdue > 0) {
    out.push({
      id: "overdue",
      tone: "danger",
      score: 90 + i.tasksOverdue,
      title: `${i.tasksOverdue} overdue task${i.tasksOverdue > 1 ? "s" : ""}`,
      body: "Clear these first — they're blocking momentum.",
      link: "/germany-journey",
    });
  }
  if (i.upcomingDeadline) {
    const days = differenceInDays(new Date(i.upcomingDeadline.date), new Date());
    if (days >= 0 && days <= 30) {
      out.push({
        id: "deadline-near",
        tone: days <= 7 ? "danger" : "warning",
        score: 80 - days,
        title: `${i.upcomingDeadline.name} in ${days} day${days === 1 ? "" : "s"}`,
        body: "Lock the checklist for this application now.",
        link: "/university",
      });
    }
  }
  if (i.monthlyGoal && i.monthlyExpense > i.monthlyGoal) {
    out.push({
      id: "budget-over",
      tone: "warning",
      score: 70,
      title: "Over monthly budget",
      body: `Spent ${Math.round(i.monthlyExpense)} of ${Math.round(i.monthlyGoal)}.`,
      link: "/budget",
    });
  }
  if (i.missingDocs.length > 0) {
    out.push({
      id: "docs-missing",
      tone: "warning",
      score: 60 + i.missingDocs.length,
      title: `${i.missingDocs.length} document${i.missingDocs.length > 1 ? "s" : ""} missing`,
      body: i.missingDocs.slice(0, 3).join(", "),
      link: "/germany-journey",
    });
  }
  if (i.profileScore < 50) {
    out.push({
      id: "profile-weak",
      tone: "warning",
      score: 65,
      title: "Profile under 50% complete",
      body: "Fill academic, portfolio and document sections to strengthen applications.",
      link: "/portfolio",
    });
  } else if (i.profileScore >= 80) {
    out.push({
      id: "profile-strong",
      tone: "success",
      score: 30,
      title: "Profile looks strong",
      body: `${i.profileScore}% complete — keep portfolio fresh with new projects.`,
    });
  }
  if (i.studyMinutes7d < 60) {
    out.push({
      id: "study-lag",
      tone: "warning",
      score: 55,
      title: "Study time is low this week",
      body: "Aim for at least 30 minutes a day to stay on track.",
      link: "/check-in",
    });
  } else if (i.studyMinutes7d > 600) {
    out.push({
      id: "study-strong",
      tone: "success",
      score: 25,
      title: "Great study consistency",
      body: `${Math.round(i.studyMinutes7d / 60)} h logged in the last 7 days.`,
    });
  }
  if (i.germanLevel && ["A1", "A2"].includes(i.germanLevel)) {
    out.push({
      id: "german-up",
      tone: "info",
      score: 40,
      title: `German at ${i.germanLevel} — push for B1`,
      body: "Most German-taught programs need B2; English-taught still ask for A1/A2.",
      link: "/german",
    });
  }
  if (i.acceptanceTopBand === "very_low" || i.acceptanceTopBand === "low") {
    out.push({
      id: "acceptance-low",
      tone: "warning",
      score: 75,
      title: "Top universities show low acceptance",
      body: "Strengthen weak areas or shortlist a couple of safety options.",
      link: "/university",
    });
  }
  if (i.journeyCompletionPct >= 80) {
    out.push({
      id: "journey-near",
      tone: "success",
      score: 20,
      title: `Germany journey ${i.journeyCompletionPct}% done`,
      body: "You're in the final stretch — review pre-departure tasks.",
      link: "/germany-journey",
    });
  }

  return out.sort((a, b) => TONE_RANK[b.tone] - TONE_RANK[a.tone] || b.score - a.score);
}
