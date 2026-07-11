import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { format, subDays } from "date-fns";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Download,
  TrendingUp,
  Wallet,
  GraduationCap,
  BookA,
  BarChart3,
  Trophy,
  Flame,
} from "lucide-react";
import { useCurrency } from "@/hooks/use-currency";
import { downloadPdfReport } from "@/lib/pdf-report";
import { EmptyState } from "@/components/app/EmptyState";

export const Route = createFileRoute("/_authenticated/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — Abroad Compass" },
      {
        name: "description",
        content: "Long-term progress metrics across learning, applications, budget and habits.",
      },
    ],
  }),
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const { user } = useAuth();
  const cur = useCurrency();
  const fmt = (n: number) => cur.format(n, "EUR");

  const q = useQuery({
    queryKey: ["analytics", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const since90 = format(subDays(new Date(), 89), "yyyy-MM-dd");
      const [checkins, vocab, budget, tasks, unis, focus, streak, projects, docs] =
        await Promise.all([
          supabase
            .from("daily_checkins")
            .select("checkin_date,study_duration_minutes")
            .eq("user_id", user!.id)
            .gte("checkin_date", since90),
          supabase.from("vocabulary").select("id,mastered,created_at").eq("user_id", user!.id),
          supabase
            .from("budget_entries")
            .select("amount,kind,category,occurred_on")
            .eq("user_id", user!.id)
            .gte("occurred_on", since90),
          supabase
            .from("tasks")
            .select("id,status,module,priority,due_date,completed_at,created_at")
            .eq("user_id", user!.id),
          supabase
            .from("universities")
            .select("id,name,application_stage,application_status,acceptance_chance,deadline")
            .eq("user_id", user!.id),
          supabase
            .from("focus_sessions" as never)
            .select("actual_minutes,mode,started_at")
            .gte("started_at", since90),
          supabase.from("streaks").select("*").eq("user_id", user!.id).maybeSingle(),
          supabase.from("projects").select("id,status,created_at").eq("user_id", user!.id),
          supabase
            .from("documents")
            .select("id,category,status,updated_at")
            .eq("user_id", user!.id),
        ]);
      return {
        checkins: checkins.data ?? [],
        vocab: vocab.data ?? [],
        budget: budget.data ?? [],
        tasks: tasks.data ?? [],
        unis: unis.data ?? [],
        focus: (focus.data ?? []) as Array<{
          actual_minutes: number;
          mode: string;
          started_at: string;
        }>,
        streak: streak.data,
        projects: projects.data ?? [],
        docs: docs.data ?? [],
      };
    },
  });

  const d = q.data;

  // Aggregations
  const studyByDay = useMemo(() => {
    if (!d) return [];
    const buckets: Record<string, number> = {};
    for (let i = 29; i >= 0; i--) buckets[format(subDays(new Date(), i), "yyyy-MM-dd")] = 0;
    d.checkins.forEach((c) => {
      if (buckets[c.checkin_date] != null) buckets[c.checkin_date] += c.study_duration_minutes ?? 0;
    });
    d.focus.forEach((f) => {
      const day = format(new Date(f.started_at), "yyyy-MM-dd");
      if (buckets[day] != null) buckets[day] += f.actual_minutes ?? 0;
    });
    return Object.entries(buckets).map(([day, minutes]) => ({
      day: format(new Date(day), "MMM d"),
      minutes,
    }));
  }, [d]);

  const budgetBySeries = useMemo(() => {
    if (!d) return [];
    const map: Record<string, { month: string; income: number; expense: number }> = {};
    d.budget.forEach((b) => {
      const m = format(new Date(b.occurred_on), "MMM");
      if (!map[m]) map[m] = { month: m, income: 0, expense: 0 };
      if (b.kind === "income") map[m].income += Number(b.amount);
      else map[m].expense += Number(b.amount);
    });
    return Object.values(map);
  }, [d]);

  const expenseByCategory = useMemo(() => {
    if (!d) return [];
    const map: Record<string, number> = {};
    d.budget
      .filter((b) => b.kind === "expense")
      .forEach((b) => {
        const k = b.category ?? "other";
        map[k] = (map[k] ?? 0) + Number(b.amount);
      });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [d]);

  const vocabByMastery = useMemo(() => {
    if (!d) return [];
    const mastered = d.vocab.filter((v) => v.mastered).length;
    const learning = d.vocab.length - mastered;
    return [
      { name: "mastered", value: mastered },
      { name: "learning", value: learning },
    ];
  }, [d]);

  const tasksByModule = useMemo(() => {
    if (!d) return [];
    const map: Record<string, { module: string; done: number; open: number }> = {};
    d.tasks.forEach((t) => {
      const m = t.module ?? "general";
      if (!map[m]) map[m] = { module: m, done: 0, open: 0 };
      if (t.status === "done") map[m].done++;
      else map[m].open++;
    });
    return Object.values(map);
  }, [d]);

  const applicationsFunnel = useMemo(() => {
    if (!d) return [];
    const stages = ["planning", "in_progress", "submitted", "interview", "offer", "accepted"];
    return stages.map((s) => ({
      stage: s.replace("_", " "),
      count: d.unis.filter((u) => u.application_stage === s).length,
    }));
  }, [d]);

  const totalStudyMin = studyByDay.reduce((s, r) => s + r.minutes, 0);
  const totalExpense = d
    ? d.budget.filter((b) => b.kind === "expense").reduce((s, r) => s + Number(r.amount), 0)
    : 0;
  const totalIncome = d
    ? d.budget.filter((b) => b.kind === "income").reduce((s, r) => s + Number(r.amount), 0)
    : 0;
  const netSaved = totalIncome - totalExpense;
  const tasksDone = d ? d.tasks.filter((t) => t.status === "done").length : 0;
  const streak = d?.streak?.current_streak ?? 0;
  const longest = d?.streak?.longest_streak ?? 0;

  function exportPdf() {
    downloadPdfReport("Abroad Compass — 90-day report", [
      {
        heading: "Overview",
        lines: [
          `Study minutes (30d): ${totalStudyMin}`,
          `Current streak: ${streak} days (longest ${longest})`,
          `Tasks completed: ${tasksDone}`,
          `Universities tracked: ${d?.unis.length ?? 0}`,
        ],
      },
      {
        heading: "Budget",
        lines: [
          `Income: ${fmt(totalIncome)}`,
          `Expense: ${fmt(totalExpense)}`,
          `Net saved: ${fmt(netSaved)}`,
          ...expenseByCategory.map((e) => `— ${e.name}: ${fmt(e.value)}`),
        ],
      },
      {
        heading: "Learning",
        lines: [
          `Vocabulary total: ${d?.vocab.length ?? 0}`,
          ...vocabByMastery.map((v) => `— ${v.name}: ${v.value}`),
        ],
      },
      { heading: "Applications", lines: applicationsFunnel.map((f) => `— ${f.stage}: ${f.count}`) },
    ]);
  }

  if (
    !q.isLoading &&
    d &&
    d.checkins.length === 0 &&
    d.tasks.length === 0 &&
    d.budget.length === 0
  ) {
    return (
      <div className="mx-auto max-w-4xl">
        <EmptyState
          icon={BarChart3}
          title="No analytics yet"
          description="Log a daily check-in, add a task or track a budget entry — this dashboard will fill in automatically."
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-sm text-muted-foreground">
            Progress across learning, applications, budget and habits — last 90 days.
          </p>
        </div>
        <Button variant="outline" onClick={exportPdf}>
          <Download className="mr-2 h-4 w-4" />
          Export PDF
        </Button>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<TrendingUp />}
          label="Study minutes (30d)"
          value={`${totalStudyMin}m`}
          sub={`${Math.round(totalStudyMin / 60)}h`}
        />
        <StatCard
          icon={<Flame />}
          label="Current streak"
          value={`${streak}d`}
          sub={`best ${longest}`}
        />
        <StatCard
          icon={<Wallet />}
          label="Net saved (90d)"
          value={fmt(netSaved)}
          sub={`income ${fmt(totalIncome)}`}
        />
        <StatCard
          icon={<Trophy />}
          label="Tasks completed"
          value={String(tasksDone)}
          sub={`${d?.tasks.length ?? 0} total`}
        />
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="learning">
            <GraduationCap className="mr-1.5 h-4 w-4" />
            Learning
          </TabsTrigger>
          <TabsTrigger value="apps">
            <BarChart3 className="mr-1.5 h-4 w-4" />
            Applications
          </TabsTrigger>
          <TabsTrigger value="budget">
            <Wallet className="mr-1.5 h-4 w-4" />
            Budget
          </TabsTrigger>
          <TabsTrigger value="vocab">
            <BookA className="mr-1.5 h-4 w-4" />
            Vocabulary
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-base">Study minutes / day</CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={studyByDay}>
                  <defs>
                    <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--brand))" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="hsl(var(--brand))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} interval={4} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="minutes"
                    stroke="hsl(var(--brand))"
                    fill="url(#g1)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="font-display text-base">Tasks by module</CardTitle>
              </CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={tasksByModule}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="module" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="done" stackId="a" fill="hsl(var(--brand))" name="Done" />
                    <Bar
                      dataKey="open"
                      stackId="a"
                      fill="hsl(var(--muted-foreground))"
                      name="Open"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="font-display text-base">Applications funnel</CardTitle>
              </CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={applicationsFunnel} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis dataKey="stage" type="category" tick={{ fontSize: 11 }} width={100} />
                    <Tooltip />
                    <Bar dataKey="count" fill="hsl(var(--brand))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="learning">
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-base">Daily study consistency</CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={studyByDay}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} interval={2} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="minutes" fill="hsl(var(--brand))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="apps">
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-base">University pipeline</CardTitle>
            </CardHeader>
            <CardContent>
              {(d?.unis ?? []).length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No universities tracked yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {(d?.unis ?? []).map((u) => (
                    <div
                      key={u.id}
                      className="flex items-center justify-between rounded-md border px-3 py-2"
                    >
                      <div>
                        <p className="font-medium">{u.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Stage: {u.application_stage ?? "planning"} · Status:{" "}
                          {u.application_status ?? "—"}
                        </p>
                      </div>
                      <div className="text-right">
                        {u.acceptance_chance && (
                          <Badge variant="outline">{u.acceptance_chance}</Badge>
                        )}
                        {u.deadline && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            Due {format(new Date(u.deadline), "MMM d, yyyy")}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="budget" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-base">Income vs expense</CardTitle>
            </CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={budgetBySeries}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="income" fill="hsl(var(--brand))" />
                  <Bar dataKey="expense" fill="hsl(var(--destructive))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-base">Expense by category</CardTitle>
            </CardHeader>
            <CardContent className="h-64">
              {expenseByCategory.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No expenses logged.
                </p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expenseByCategory}
                      dataKey="value"
                      nameKey="name"
                      outerRadius={80}
                      label
                    >
                      {expenseByCategory.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vocab">
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-base">Vocabulary by mastery</CardTitle>
            </CardHeader>
            <CardContent className="h-64">
              {vocabByMastery.every((v) => v.value === 0) ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No vocabulary yet.</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={vocabByMastery}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="value" fill="hsl(var(--brand))" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

const PIE_COLORS = [
  "hsl(var(--brand))",
  "#f59e0b",
  "#10b981",
  "#8b5cf6",
  "#ef4444",
  "#06b6d4",
  "#ec4899",
  "#84cc16",
];

function StatCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <Card className="shadow-card">
      <CardContent className="pt-5">
        <div className="flex items-center gap-2 text-muted-foreground">
          <div className="grid h-8 w-8 place-items-center rounded-md bg-muted [&>svg]:h-4 [&>svg]:w-4">
            {icon}
          </div>
          <span className="text-xs uppercase tracking-wider">{label}</span>
        </div>
        <p className="mt-2 font-display text-2xl font-bold">{value}</p>
        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
      </CardContent>
    </Card>
  );
}
