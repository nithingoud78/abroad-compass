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
  CheckCircle2,
  Building2,
  BarChart3,
  TrendingUp,
  MapPin,
  CheckCircle,
  Edit2,
} from "lucide-react";
import { differenceInDays, format } from "date-fns";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { DashboardWidget } from "@/components/app/DashboardWidget";
import { InsightsPanel } from "@/components/app/InsightsPanel";
import { SectionTitle } from "@/components/app/SectionTitle";
import { useCurrency } from "@/hooks/use-currency";
import { useServerFn } from "@tanstack/react-start";
import { StandardPageLayout } from "@/components/app/StandardPageLayout";
import { getDashboardSummary } from "@/lib/ai/ai.functions";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { SummaryCard } from "@/components/ui/summary-card";
import { useDashboardData, type DashboardData } from "@/hooks/use-dashboard-data";

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
  const [localTargetDate, setLocalTargetDate] = useState<string>("2026-10-01");
  const [datePopoverOpen, setDatePopoverOpen] = useState(false);

  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const analyzeFn = useServerFn(getDashboardSummary);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("display_name,germany_target_date")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        setDisplayName(data?.display_name ?? null);
        if (data?.germany_target_date) {
          setTargetDate(data.germany_target_date);
          setLocalTargetDate(data.germany_target_date);
        }
      });
  }, [user]);

  const daysToGermany = Math.max(0, differenceInDays(new Date(targetDate), new Date()));

  async function saveTargetDate() {
    if (!user) return;
    const { error } = await supabase
      .from("profiles")
      .update({ germany_target_date: localTargetDate || null })
      .eq("user_id", user.id);
    if (error) {
      toast.error(error.message);
    } else {
      setTargetDate(localTargetDate);
      toast.success("Target date updated");
      setDatePopoverOpen(false);
    }
  }

  async function handleAnalyze() {
    setAnalyzing(true);
    try {
      const res = await analyzeFn({
        data: {
          profileName: displayName,
          daysToGermany,
          insights: data.insights,
          tasks: [...data.todayPriorities, ...data.overdue],
        },
      });
      setAiSummary(res.summary);
    } catch (e) {
      console.error(e);
    } finally {
      setAnalyzing(false);
    }
  }

  return (
    <StandardPageLayout
      title={<span>{displayName ?? "Student"} 👋</span>}
      subtitle="Welcome back"
      actions={<QuickActions />}
    >
      <div className="flex justify-end gap-3">
        <Button
          variant="outline"
          className="gap-2 border-brand/20 bg-brand/5 text-brand hover:bg-brand/10 hover:text-brand"
          onClick={() => {}}
        >
          <Flame className="h-4 w-4" />
          {data.globalStreak} Day Streak
        </Button>
        <Button
          variant="outline"
          onClick={handleAnalyze}
          disabled={analyzing || aiSummary !== null}
          className="gap-2 border-brand/20 bg-brand/5 text-brand hover:bg-brand/10 hover:text-brand"
        >
          {analyzing ? (
            <Activity className="h-4 w-4 animate-spin text-brand" />
          ) : (
            <Sparkles className="h-4 w-4 text-brand" />
          )}
          {aiSummary ? "Summary Ready" : "Smart Daily Summary"}
        </Button>
      </div>

      {aiSummary && (
        <div className="rounded-xl border bg-brand/5 p-5 text-sm text-foreground">
          <div className="mb-3 flex items-center gap-2 font-display text-lg font-semibold text-brand">
            <Sparkles className="h-5 w-5" /> Smart Daily Summary
          </div>
          <p className="leading-relaxed">{aiSummary}</p>
        </div>
      )}

      {/* Top stats */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          icon={<Target className="h-4 w-4" />}
          label="Days to Germany"
          value={daysToGermany.toString()}
          hint={`Target: ${format(new Date(targetDate), "MMMM yyyy")}`}
          accent
          action={
            <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen}>
              <PopoverTrigger asChild>
                <button className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-muted/50 transition-colors">
                  <Edit2 className="h-3 w-3" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-4 shadow-lg border-brand/20">
                <div className="space-y-4">
                  <div>
                    <Label className="text-xs mb-1.5 block text-muted-foreground">
                      Target Arrival Date
                    </Label>
                    <Input
                      type="date"
                      value={localTargetDate}
                      onChange={(e) => setLocalTargetDate(e.target.value)}
                      className="h-8"
                    />
                  </div>
                  <button
                    onClick={saveTargetDate}
                    className="w-full bg-brand/10 hover:bg-brand/20 text-brand text-xs font-semibold py-2 rounded-md transition-colors"
                  >
                    Save
                  </button>
                </div>
              </PopoverContent>
            </Popover>
          }
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

      <section>
        <SectionTitle title="Daily Check-in" icon={<CheckCircle2 className="h-5 w-5" />} />
        <div className="grid gap-6 lg:grid-cols-3">
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
      </section>

      <section>
        <SectionTitle
          title="German Learning"
          icon={<GraduationCap className="h-5 w-5" />}
          action={
            <Link to="/german" className="text-xs text-muted-foreground hover:text-foreground">
              Open Tracker <ArrowRight className="ml-0.5 inline h-3 w-3" />
            </Link>
          }
        />
        <div className="grid gap-6 lg:grid-cols-2">
          <DashboardWidget
            icon={Languages}
            title="German level"
            loading={data.loading}
            action={
              <Link to="/german" className="text-xs text-muted-foreground hover:text-foreground">
                Tracker <ArrowRight className="ml-0.5 inline h-3 w-3" />
              </Link>
            }
          >
            <p className="mt-1 font-display text-2xl font-bold">{data.germanLevel ?? "—"}</p>
            <p className="text-xs text-muted-foreground">CEFR Target</p>
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
                      <stop offset="0%" stopColor="var(--color-brand)" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="var(--color-brand)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="minutes"
                    stroke="var(--color-brand)"
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
      </section>

      <section>
        <SectionTitle
          title="Goethe / TELC"
          icon={<BookOpen className="h-5 w-5" />}
          action={
            <Link to="/goethe" className="text-xs text-muted-foreground hover:text-foreground">
              Open Tracker <ArrowRight className="ml-0.5 inline h-3 w-3" />
            </Link>
          }
        />
        {data.loading ? (
          <div className="flex h-32 items-center justify-center border rounded-xl bg-card text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <GoetheWidget data={data} />
        )}
      </section>

      <section>
        <SectionTitle
          title="IELTS"
          icon={<Languages className="h-5 w-5" />}
          action={
            <Link to="/ielts" className="text-xs text-muted-foreground hover:text-foreground">
              Open Tracker <ArrowRight className="ml-0.5 inline h-3 w-3" />
            </Link>
          }
        />
        {data.loading ? (
          <div className="flex h-32 items-center justify-center border rounded-xl bg-card text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <IELTSWidget data={data} />
        )}
      </section>

      <section>
        <SectionTitle
          title="dMAT / TestAS"
          icon={<BookOpen className="h-5 w-5" />}
          action={
            <Link to="/dmat" className="text-xs text-muted-foreground hover:text-foreground">
              Open Tracker <ArrowRight className="ml-0.5 inline h-3 w-3" />
            </Link>
          }
        />
        {data.loading ? (
          <div className="flex h-32 items-center justify-center border rounded-xl bg-card text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <DMATWidget data={data} />
        )}
      </section>

      <section>
        <SectionTitle
          title="University"
          icon={<Building2 className="h-5 w-5" />}
          action={
            <Link to="/university" className="text-xs text-muted-foreground hover:text-foreground">
              Open Shortlisting <ArrowRight className="ml-0.5 inline h-3 w-3" />
            </Link>
          }
        />
        <div className="grid gap-6 lg:grid-cols-3">
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
          <div className="lg:col-span-2">
            <InsightsPanel insights={data.insights} />
          </div>
        </div>
      </section>

      <section>
        <SectionTitle title="Budget" icon={<Wallet className="h-5 w-5" />} />
        <div className="grid gap-6 lg:grid-cols-3">
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
        </div>
      </section>

      <section>
        <SectionTitle
          title="Analytics Overview"
          icon={<Activity className="h-5 w-5" />}
          action={
            <Link to="/analytics" className="text-xs text-muted-foreground hover:text-foreground">
              Open Analytics <ArrowRight className="ml-0.5 inline h-3 w-3" />
            </Link>
          }
        />
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
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
      </section>
    </StandardPageLayout>
  );
}

function GoetheWidget({ data }: { data: DashboardData }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      <Stat
        icon={<Languages className="h-4 w-4" />}
        label="German Target"
        value={data.goetheTargetLevel || "—"}
        hint="CEFR Goal"
        accent
      />
      <Stat
        icon={<Flame className="h-4 w-4 text-orange-500" />}
        label="Study Streak"
        value={data.globalStreak.toString()}
        hint="Days in a row"
      />
      <Stat
        icon={<Clock className="h-4 w-4" />}
        label="Weekly Log"
        value={`${Math.round(data.weeklyStudyMin / 60)} hrs`}
        hint="Total study time"
      />
      <Stat
        icon={<BookOpen className="h-4 w-4" />}
        label="Vocabulary"
        value={data.vocabCount.toString()}
        hint="Saved words"
      />
    </div>
  );
}

function IELTSWidget({ data }: { data: DashboardData }) {
  const daysRemaining = data.ieltsExamDate
    ? Math.max(0, differenceInDays(new Date(data.ieltsExamDate), new Date()))
    : 0;
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      <Stat
        icon={<Target className="h-4 w-4" />}
        label="Target Band"
        value={data.ieltsTargetBand?.toFixed(1) || "7.0"}
        hint="Current Goal"
        accent
      />
      <Stat
        icon={<Flame className="h-4 w-4 text-orange-500" />}
        label="Study Streak"
        value={data.globalStreak.toString()}
        hint="Days in a row"
      />
      <Stat
        icon={<TrendingUp className="h-4 w-4" />}
        label="Weekly Goal"
        value={`${Math.round(data.ieltsWeeklyHours)} hrs`}
        hint={`of 5 hrs goal`}
      />
      <Stat
        icon={<Activity className="h-4 w-4" />}
        label="Overall Readiness"
        value={`${data.ieltsOverallPct}%`}
        hint={`${daysRemaining} days left`}
      />
    </div>
  );
}

function DMATWidget({ data }: { data: DashboardData }) {
  const daysRemaining = data.dmatExamDate
    ? Math.max(0, differenceInDays(new Date(data.dmatExamDate), new Date()))
    : 0;
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      <Stat
        icon={<CheckCircle className="h-4 w-4" />}
        label="Overall Prep"
        value={`${data.dmatOverallPct}%`}
        hint="Syllabus Completion"
        accent
      />
      <Stat
        icon={<Flame className="h-4 w-4 text-orange-500" />}
        label="Study Streak"
        value={data.globalStreak.toString()}
        hint="Days in a row"
      />
      <Stat
        icon={<MapPin className="h-4 w-4" />}
        label="Curriculum"
        value={data.dmatCurrentTopic || "None"}
        hint="Current topic"
      />
      <Stat
        icon={<TrendingUp className="h-4 w-4" />}
        label="Weekly Goal"
        value={`${Math.round(data.dmatWeeklyHours)} hrs`}
        hint="of 15 hrs goal"
      />
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  hint,
  accent,
  action,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
  accent?: boolean;
  action?: React.ReactNode;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="h-full">
      <SummaryCard
        icon={icon}
        title={label}
        value={value}
        subtitle={hint}
        accent={accent}
        action={action}
      />
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
