// Aggregates every signal the smart dashboard needs in one pass and keeps
// itself live via Supabase realtime channels for tasks, budget entries,
// documents and notifications.
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { format, subDays } from "date-fns";
import { computeProfileScore, type ProfileScoreResult } from "@/lib/profile-score";
import { computeInsights, type Insight } from "@/lib/insights";

export type DashboardData = {
  loading: boolean;
  todayPriorities: TaskRow[];
  overdue: TaskRow[];
  upcoming: TaskRow[];
  recentActivity: ActivityItem[];
  budget: { month: number; goal: number | null };
  missingDocs: string[];
  weeklyStudyMin: number;
  studyChart: { day: string; minutes: number }[];
  vocabCount: number;
  applicationsCount: number;
  applicationsSubmitted: number;
  germanLevel: string | null;
  profile: ProfileScoreResult | null;
  insights: Insight[];
  journeyCompletionPct: number;
  acceptanceTopBand: string | null;
};

type TaskRow = {
  id: string;
  title: string;
  due_date: string | null;
  priority: string;
  status: string;
  module: string;
};
type ActivityItem = { id: string; label: string; at: string; kind: string };

const DEFAULT: DashboardData = {
  loading: true,
  todayPriorities: [],
  overdue: [],
  upcoming: [],
  recentActivity: [],
  budget: { month: 0, goal: null },
  missingDocs: [],
  weeklyStudyMin: 0,
  studyChart: [],
  vocabCount: 0,
  applicationsCount: 0,
  applicationsSubmitted: 0,
  germanLevel: null,
  profile: null,
  insights: [],
  journeyCompletionPct: 0,
  acceptanceTopBand: null,
};

const CORE_DOCS = [
  "APS",
  "IELTS",
  "Passport",
  "Visa",
  "Bachelor Degree",
  "Transcripts",
  "SOP",
  "CV",
  "Blocked Account",
];

export function useDashboardData(): DashboardData {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData>(DEFAULT);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    async function load() {
      const today = format(new Date(), "yyyy-MM-dd");
      const since = format(subDays(new Date(), 6), "yyyy-MM-dd");
      const monthStart = format(
        new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        "yyyy-MM-dd",
      );

      const [tasks, budget, docs, checkins, vocab, unis, profile, edu, certs, projects, goal] =
        await Promise.all([
          supabase
            .from("tasks")
            .select("id,title,due_date,priority,status,module")
            .eq("user_id", user!.id)
            .neq("status", "done")
            .order("due_date", { ascending: true, nullsFirst: false })
            .limit(50),
          supabase
            .from("budget_entries")
            .select("amount,kind,occurred_on,description")
            .eq("user_id", user!.id)
            .gte("occurred_on", monthStart),
          supabase
            .from("documents")
            .select("id,name,category,status,updated_at")
            .eq("user_id", user!.id),
          supabase
            .from("daily_checkins")
            .select("checkin_date,study_duration_minutes")
            .eq("user_id", user!.id)
            .gte("checkin_date", since),
          supabase
            .from("vocabulary")
            .select("id", { count: "exact", head: true })
            .eq("user_id", user!.id),
          supabase
            .from("universities")
            .select("id,name,application_stage,application_status,acceptance_chance,deadline")
            .eq("user_id", user!.id),
          supabase
            .from("profiles")
            .select("current_german_level,target_degree")
            .eq("user_id", user!.id)
            .maybeSingle(),
          supabase
            .from("education")
            .select("ug_cgpa,total_credits,intermediate")
            .eq("user_id", user!.id)
            .maybeSingle(),
          supabase.from("certificates").select("id,cert_type").eq("user_id", user!.id),
          supabase.from("projects").select("id").eq("user_id", user!.id),
          supabase
            .from("savings_goals")
            .select("target_amount")
            .eq("user_id", user!.id)
            .maybeSingle(),
        ]);

      if (cancelled) return;

      const taskRows = (tasks.data ?? []) as TaskRow[];
      const overdue = taskRows.filter((t) => t.due_date && t.due_date < today);
      const todayPriorities = taskRows
        .filter((t) => !t.due_date || t.due_date === today || t.priority === "high")
        .slice(0, 6);
      const upcoming = taskRows.filter((t) => t.due_date && t.due_date > today).slice(0, 6);

      const monthExpense = (budget.data ?? [])
        .filter((b) => b.kind === "expense")
        .reduce((s, r) => s + Number(r.amount), 0);

      const docNames = new Set(
        (docs.data ?? []).map((d) => (d.name + " " + d.category).toLowerCase()),
      );
      const missingDocs = CORE_DOCS.filter(
        (c) => ![...docNames].some((n) => n.includes(c.toLowerCase())),
      );

      const buckets: Record<string, number> = {};
      for (let i = 6; i >= 0; i--) buckets[format(subDays(new Date(), i), "yyyy-MM-dd")] = 0;
      (checkins.data ?? []).forEach((r) => {
        if (buckets[r.checkin_date] != null)
          buckets[r.checkin_date] += r.study_duration_minutes ?? 0;
      });
      const studyChart = Object.entries(buckets).map(([d, m]) => ({
        day: format(new Date(d), "EEE"),
        minutes: m,
      }));
      const weeklyStudyMin = studyChart.reduce((s, d) => s + d.minutes, 0);

      const uniRows = unis.data ?? [];
      const submittedStages = new Set(["submitted", "interview", "offer", "rejected", "accepted"]);
      const submitted = uniRows.filter((u) =>
        submittedStages.has(u.application_stage ?? ""),
      ).length;
      const acceptanceTopBand = uniRows.map((u) => u.acceptance_chance).find((b) => b) ?? null;

      const recentActivity: ActivityItem[] = [];
      (docs.data ?? []).slice(0, 4).forEach((d) =>
        recentActivity.push({
          id: d.id,
          label: `Document: ${d.name}`,
          at: d.updated_at,
          kind: "document",
        }),
      );
      (budget.data ?? []).slice(0, 4).forEach((b, idx) =>
        recentActivity.push({
          id: `b-${idx}`,
          label: `${b.kind === "income" ? "Income" : "Spent"}: ${b.description ?? Number(b.amount)}`,
          at: b.occurred_on,
          kind: "budget",
        }),
      );
      recentActivity.sort((a, b) => (a.at < b.at ? 1 : -1));

      const journeyTotal = 20; // canonical phase task count baseline
      const journeyDone = taskRows.filter(
        (t) => t.module === "journey" && t.status === "done",
      ).length;
      const journeyCompletionPct = Math.min(100, Math.round((journeyDone / journeyTotal) * 100));

      const certTypes = (certs.data ?? []).map((c) => (c.cert_type ?? "").toLowerCase());
      const hasIelts = certTypes.some((c) => /ielts|toefl/.test(c));
      const apsDone = certTypes.some((c) => /aps/.test(c));

      const profileScore = computeProfileScore({
        hasCgpa: !!edu.data?.ug_cgpa,
        hasCredits: !!edu.data?.total_credits,
        hasBachelorSubject: !!(profile.data?.target_degree || edu.data?.intermediate),
        projects: (projects.data ?? []).length,
        certificates: (certs.data ?? []).length,
        documents: (docs.data ?? []).length,
        documentsRequired: CORE_DOCS.length,
        studyMinutes7d: weeklyStudyMin,
        germanLevel: profile.data?.current_german_level ?? null,
        hasIeltsOrToefl: hasIelts,
        apsDone,
        universities: uniRows.length,
        applicationsSubmitted: submitted,
        journeyCompletionPct,
        hasBudgetEntries: (budget.data ?? []).length > 0,
        hasSavingsGoal: !!goal.data?.target_amount,
      });

      const nextDeadlineUni = uniRows
        .filter((u) => u.deadline)
        .sort((a, b) => (a.deadline! < b.deadline! ? -1 : 1))[0];

      const insights = computeInsights({
        tasksOverdue: overdue.length,
        tasksDueSoon: upcoming.length,
        upcomingDeadline: nextDeadlineUni
          ? { name: nextDeadlineUni.name, date: nextDeadlineUni.deadline! }
          : null,
        monthlyExpense: monthExpense,
        monthlyGoal: goal.data?.target_amount ? Number(goal.data.target_amount) : null,
        missingDocs,
        profileScore: profileScore.score,
        acceptanceTopBand,
        studyMinutes7d: weeklyStudyMin,
        germanLevel: profile.data?.current_german_level ?? null,
        journeyCompletionPct,
      });

      setData({
        loading: false,
        todayPriorities,
        overdue,
        upcoming,
        recentActivity: recentActivity.slice(0, 8),
        budget: {
          month: monthExpense,
          goal: goal.data?.target_amount ? Number(goal.data.target_amount) : null,
        },
        missingDocs,
        weeklyStudyMin,
        studyChart,
        vocabCount: vocab.count ?? 0,
        applicationsCount: uniRows.length,
        applicationsSubmitted: submitted,
        germanLevel: profile.data?.current_german_level ?? null,
        profile: profileScore,
        insights,
        journeyCompletionPct,
        acceptanceTopBand,
      });
    }

    load();

    const channel = supabase
      .channel(`dashboard-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks", filter: `user_id=eq.${user.id}` },
        load,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "budget_entries", filter: `user_id=eq.${user.id}` },
        load,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "documents", filter: `user_id=eq.${user.id}` },
        load,
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [user]);

  return data;
}
