import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Flame,
  Target,
  BookOpen,
  Clock,
  Sparkles,
  Languages,
  Trophy,
  Calendar,
  Wallet,
  GraduationCap,
  FolderKanban,
  FileBadge,
  Plus,
  ArrowRight,
  CheckSquare,
  AlertTriangle,
  Activity,
  ListTodo,
  FileText,
  Receipt,
  FolderPlus,
} from "lucide-react";
import { differenceInDays, format } from "date-fns";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { DashboardWidget } from "@/components/app/DashboardWidget";
import { InsightsPanel } from "@/components/app/InsightsPanel";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { useCurrency } from "@/hooks/use-currency";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Abroad Compass" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { user } = useAuth();
  const data = useDashboardData();
  const { format: fmt } = useCurrency();
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [targetDate, setTargetDate] = useState<string>("2026-10-01");

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("display_name,germany_target_date")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        setDisplayName(data?.display_name ?? null);
        if (data?.germany_target_date) setTargetDate(data.germany_target_date);
      });
  }, [user]);

  const daysToGermany = Math.max(0, differenceInDays(new Date(targetDate), new Date()));

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Welcome back</p>
          <h1 className="font-display text-3xl font-bold tracking-tight">
            {displayName ?? "Student"} 👋
          </h1>
        </div>
        <QuickActions />
      </header>

      {/* Top stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          icon={<Target className="h-4 w-4" />}
          label="Days to Germany"
          value={daysToGermany.toString()}
          hint={format(new Date(targetDate), "MMM yyyy")}
          accent
        />
        <Stat
          icon={<Trophy className="h-4 w-4" />}
          label="Profile score"
          value={`${data.profile?.score ?? 0}%`}
          hint={`${data.profile?.missing.length ?? 0} items missing`}
        />
        <Stat
          icon={<GraduationCap className="h-4 w-4" />}
          label="Applications"
          value={data.applicationsCount.toString()}
          hint={`${data.applicationsSubmitted} submitted`}
        />
        <Stat
          icon={<Languages className="h-4 w-4" />}
          label="German level"
          value={data.germanLevel ?? "—"}
          hint="CEFR"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Today / Overdue / Upcoming */}
        <DashboardWidget
          icon={CheckSquare}
          title="Today's priorities"
          loading={data.loading}
          action={
            <Link
              to="/germany-journey"
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              View all <ArrowRight className="ml-0.5 inline h-3 w-3" />
            </Link>
          }
        >
          {data.todayPriorities.length === 0 ? (
            <p className="text-muted-foreground">
              Nothing urgent. Take a study break or add a task.
            </p>
          ) : (
            <ul className="space-y-1.5">
              {data.todayPriorities.map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-2">
                  <span className="truncate">{t.title}</span>
                  {t.priority === "high" && (
                    <Badge
                      variant="outline"
                      className="border-amber-500/30 bg-amber-500/10 px-1.5 py-0 text-[10px] text-amber-700 dark:text-amber-300"
                    >
                      High
                    </Badge>
                  )}
                </li>
              ))}
            </ul>
          )}
        </DashboardWidget>

        <DashboardWidget icon={AlertTriangle} title="Overdue" loading={data.loading}>
          {data.overdue.length === 0 ? (
            <p className="text-muted-foreground">Nothing overdue — well done.</p>
          ) : (
            <ul className="space-y-1.5">
              {data.overdue.slice(0, 5).map((t) => (
                <li key={t.id} className="flex justify-between">
                  <span className="truncate">{t.title}</span>
                  <span className="ml-2 flex-shrink-0 text-xs text-rose-600">
                    {t.due_date && format(new Date(t.due_date), "MMM d")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </DashboardWidget>

        <DashboardWidget icon={Calendar} title="Upcoming deadlines" loading={data.loading}>
          {data.upcoming.length === 0 ? (
            <p className="text-muted-foreground">No upcoming items.</p>
          ) : (
            <ul className="space-y-1.5">
              {data.upcoming.slice(0, 5).map((t) => (
                <li key={t.id} className="flex justify-between">
                  <span className="truncate">{t.title}</span>
                  <span className="ml-2 flex-shrink-0 text-xs text-muted-foreground">
                    {t.due_date && format(new Date(t.due_date), "MMM d")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </DashboardWidget>
      </div>

      {/* Insights + profile breakdown */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <InsightsPanel insights={data.insights} />
        </div>
        <DashboardWidget icon={Trophy} title="Profile breakdown" loading={data.loading}>
          <div className="space-y-2">
            {data.profile &&
              Object.entries(data.profile.breakdown).map(([k, v]) => (
                <div key={k}>
                  <div className="mb-0.5 flex justify-between text-xs">
                    <span>{v.label}</span>
                    <span className="text-muted-foreground">
                      {Math.round((v.score / v.max) * 100)}%
                    </span>
                  </div>
                  <Progress value={(v.score / v.max) * 100} className="h-1.5" />
                </div>
              ))}
          </div>
        </DashboardWidget>
      </div>

      {/* Budget / Documents / Study */}
      <div className="grid gap-4 lg:grid-cols-3">
        <DashboardWidget
          icon={Wallet}
          title="Budget this month"
          loading={data.loading}
          action={
            <Link to="/budget" className="text-xs text-muted-foreground hover:text-foreground">
              Open <ArrowRight className="ml-0.5 inline h-3 w-3" />
            </Link>
          }
        >
          <p className="font-display text-2xl font-bold">{fmt(data.budget.month, "EUR")}</p>
          {data.budget.goal && (
            <>
              <p className="text-xs text-muted-foreground">
                of {fmt(data.budget.goal, "EUR")} goal
              </p>
              <Progress
                value={Math.min(100, (data.budget.month / data.budget.goal) * 100)}
                className="mt-2 h-1.5"
              />
            </>
          )}
        </DashboardWidget>

        <DashboardWidget
          icon={FileText}
          title="Missing documents"
          loading={data.loading}
          action={
            <Link
              to="/germany-journey"
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Upload <ArrowRight className="ml-0.5 inline h-3 w-3" />
            </Link>
          }
        >
          {data.missingDocs.length === 0 ? (
            <p className="text-muted-foreground">All core documents on file.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {data.missingDocs.map((d) => (
                <Badge key={d} variant="outline" className="text-xs">
                  {d}
                </Badge>
              ))}
            </div>
          )}
        </DashboardWidget>

        <DashboardWidget
          icon={Clock}
          title="Study (7 days)"
          loading={data.loading}
          action={
            <Link to="/check-in" className="text-xs text-muted-foreground hover:text-foreground">
              Log <ArrowRight className="ml-0.5 inline h-3 w-3" />
            </Link>
          }
        >
          <p className="font-display text-2xl font-bold">
            {data.weeklyStudyMin}
            <span className="ml-1 text-sm font-normal text-muted-foreground">min</span>
          </p>
          <div className="mt-2 h-14">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.studyChart}>
                <defs>
                  <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--brand))" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="hsl(var(--brand))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="minutes"
                  stroke="hsl(var(--brand))"
                  fill="url(#g)"
                  strokeWidth={2}
                />
                <XAxis dataKey="day" hide />
                <YAxis hide />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </DashboardWidget>
      </div>

      {/* Activity + recommendations */}
      <div className="grid gap-4 lg:grid-cols-2">
        <DashboardWidget icon={Activity} title="Recent activity" loading={data.loading}>
          {data.recentActivity.length === 0 ? (
            <p className="text-muted-foreground">No activity yet.</p>
          ) : (
            <ul className="space-y-1.5">
              {data.recentActivity.map((a) => (
                <li key={a.id} className="flex justify-between text-sm">
                  <span className="truncate">{a.label}</span>
                  <span className="ml-2 flex-shrink-0 text-xs text-muted-foreground">
                    {format(new Date(a.at), "MMM d")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </DashboardWidget>

        <DashboardWidget icon={Sparkles} title="Recommendations" loading={data.loading}>
          {data.profile && data.profile.suggestions.length === 0 ? (
            <p className="text-muted-foreground">Looking great. Keep momentum on weekly goals.</p>
          ) : (
            <ul className="space-y-1.5">
              {data.profile?.suggestions.map((s, i) => (
                <li key={i} className="flex gap-2">
                  <ArrowRight className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-brand" />
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          )}
        </DashboardWidget>
      </div>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  hint,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
  accent?: boolean;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
      <Card className={`shadow-card ${accent ? "border-brand/30 bg-brand/5" : ""}`}>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
            {icon}
            {label}
          </div>
          <p className="mt-1 font-display text-2xl font-bold">{value}</p>
          {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function QuickActions() {
  const actions = [
    { to: "/germany-journey", icon: ListTodo, label: "Task" },
    { to: "/germany-journey", icon: FileText, label: "Document" },
    { to: "/budget", icon: Receipt, label: "Expense" },
    { to: "/portfolio", icon: FolderPlus, label: "Project" },
  ] as const;
  return (
    <div className="flex flex-wrap gap-1.5">
      {actions.map((a) => (
        <Button key={a.label} asChild size="sm" variant="outline">
          <Link to={a.to}>
            <a.icon className="mr-1 h-3.5 w-3.5" />
            <Plus className="h-3 w-3" /> {a.label}
          </Link>
        </Button>
      ))}
    </div>
  );
}
