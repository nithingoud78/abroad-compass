import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { useGoalsData } from "@/hooks/use-goals-data";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { SummaryCard } from "@/components/ui/summary-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Loader2,
  Calendar,
  Target,
  Trophy,
  Clock,
  CheckCircle2,
  Flame,
  TrendingUp,
  Edit2,
  Edit3,
  CalendarDays,
  ExternalLink,
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { StandardPageLayout } from "@/components/app/StandardPageLayout";

export const Route = createFileRoute("/_authenticated/dmat")({
  head: () => ({ meta: [{ title: "dMAT / TestAS Tracker — Abroad Compass" }] }),
  component: DmatPage,
});

const TOPICS = ["Figure Sequences", "Latin Squares", "Mathematical Equations", "Subject Module"];

type ProgressRow = {
  id: string;
  topic?: string | null;
  subject?: string | null;
  progress_pct?: number | null;
  study_min?: number | null;
  updated_at?: string;
};

type RegistrationRow = {
  application_date?: string | null;
};

function DmatPage() {
  const { user } = useAuth();
  const {
    loading: goalsLoading,
    dmatSettings,
    adminSchedule,
    reload: reloadGoals,
  } = useGoalsData();
  const [progress, setProgress] = useState<ProgressRow[]>([]);
  const [registration, setRegistration] = useState<RegistrationRow | null>(null);
  const { globalStreak: streak } = useDashboardData();
  const [practiceLoading, setPracticeLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    loadPractice();
  }, [user]);

  async function loadPractice() {
    if (!user) return;
    setPracticeLoading(true);
    const [{ data: p }, { data: r }, { data: checkins }] = await Promise.all([
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase.from as any)("dmat_progress").select("*").eq("user_id", user.id),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase.from as any)("dmat_registration").select("*").eq("user_id", user.id).maybeSingle(),
      supabase
        .from("daily_progress")
        .select("checkin_date")
        .eq("user_id", user.id)
        .order("checkin_date", { ascending: false }),
    ]);
    setProgress(p ?? []);
    setRegistration(r);
    setPracticeLoading(false);
  }

  async function updateSetting(field: "user_exam_date" | "user_exam_session", val: string) {
    if (!user) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from("dmat_settings") as any).upsert(
      { user_id: user.id, [field]: val || null, updated_at: new Date().toISOString() },
      { onConflict: "user_id" },
    );
    if (error) {
      toast.error(error.message);
    } else {
      reloadGoals();
      toast.success("Override updated");
    }
  }

  const loading = goalsLoading || practiceLoading;

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  // Priority: user override → admin default → null (no hardcoded date)
  const examDate = dmatSettings?.user_exam_date ?? adminSchedule?.exam_date ?? null;
  const examSession = dmatSettings?.user_exam_session ?? "Morning";
  const regDeadline = adminSchedule?.registration_closes ?? null;
  const resultDate = adminSchedule?.result_date ?? null;

  const daysRemaining = examDate
    ? Math.max(0, differenceInDays(new Date(examDate), new Date()))
    : null;

  let totalStudyMin = 0;
  let totalPct = 0;

  const topicStats = TOPICS.map((t) => {
    const records = progress.filter(
      (p) =>
        p.topic?.toLowerCase() === t.toLowerCase() || p.subject?.toLowerCase() === t.toLowerCase(),
    );
    const pct = records.reduce((acc, curr) => Math.max(acc, curr.progress_pct ?? 0), 0);
    const mins = records.reduce((acc, curr) => acc + (curr.study_min ?? 0), 0);

    totalStudyMin += mins;
    totalPct += pct;

    let status = "Not Started";
    if (pct >= 100) {
      status = "Completed";
    } else if (pct > 0 || mins > 0) {
      status = "In Progress";
    }

    return { name: t, pct: Math.min(pct, 100), status, mins };
  });

  const overallPct = Math.round(totalPct / TOPICS.length) || 0;
  const totalHours = (totalStudyMin / 60).toFixed(1);

  return (
    <StandardPageLayout title="dMAT / TestAS Tracker" subtitle="Preparation">
      {!dmatSettings?.target_score && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-600 dark:text-amber-400">
          No target score set. Go to{" "}
          <a href="/goals" className="underline font-medium">
            Goals
          </a>{" "}
          to configure your dMAT / TestAS target.
        </div>
      )}
      {/* Top Banner Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          icon={<Calendar className="h-4 w-4" />}
          title="Exam Date"
          value={examDate ? daysRemaining : "—"}
          subtitle={
            examDate
              ? `Days remaining (${format(new Date(examDate), "MMM d")})`
              : "No exam date set"
          }
        />

        <SummaryCard
          icon={<Clock className="h-4 w-4" />}
          title="Study Hours"
          value={
            <div className="flex items-center gap-2">
              {totalHours} <span className="text-sm font-normal text-muted-foreground">hrs</span>
            </div>
          }
          subtitle={<>Total preparation time</>}
        />

        <SummaryCard
          icon={<Flame className="h-4 w-4 text-orange-500" />}
          title="Study Streak"
          value={
            <div className="flex items-center gap-2">
              {streak} <span className="text-sm font-normal text-muted-foreground">days</span>
            </div>
          }
          subtitle={<>Consistent practice pays off</>}
        />

        <SummaryCard
          icon={<TrendingUp className="h-4 w-4" />}
          title="Target Score"
          value={dmatSettings?.target_score ?? "—"}
          subtitle={<>Set in Goals</>}
        />
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        {/* Roadmap */}
        <div className="md:col-span-2 space-y-4">
          <Card className="shadow-sm border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Target className="h-5 w-5 text-brand" /> Preparation Roadmap
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topicStats.map((t) => (
                  <div key={t.name} className="border-b pb-4 last:border-0 last:pb-0">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{t.name}</p>
                        {t.status === "Completed" && (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge
                          variant={
                            t.status === "Completed"
                              ? "default"
                              : t.status === "In Progress"
                                ? "secondary"
                                : "outline"
                          }
                          className={
                            t.status === "Completed" ? "bg-emerald-500 hover:bg-emerald-600" : ""
                          }
                        >
                          {t.status}
                        </Badge>
                        <span className="text-sm font-bold w-10 text-right">{t.pct}%</span>
                      </div>
                    </div>
                    <Progress value={t.pct} className="h-1.5" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        {/* Sidebar Info */}
        <div className="space-y-6">
          <Card className="border-brand/30 bg-brand/5 shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-display text-lg font-semibold flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-amber-500" /> Overall Progress
                </h3>
                <span className="font-bold text-lg">{overallPct}%</span>
              </div>
              <Progress value={overallPct} className="h-3" />
              <p className="text-xs text-muted-foreground mt-3">
                Based on your syllabus completion across all topics.
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-sm border">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-lg">
                <span className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-brand" /> Key Dates
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {regDeadline && (
                <div className="flex justify-between items-center border-b pb-2">
                  <div>
                    <p className="font-medium text-sm">Registration Closes</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(regDeadline), "MMMM d, yyyy")}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center border-b pb-2">
                <div>
                  <p className="font-medium text-sm flex items-center gap-1">
                    Exam Date
                    <Popover>
                      <PopoverTrigger asChild>
                        <button className="text-muted-foreground hover:text-foreground">
                          <Edit2 className="h-3 w-3" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-56 p-3">
                        <Label className="text-xs mb-2 block">Override Exam Date</Label>
                        <Input
                          type="date"
                          defaultValue={dmatSettings?.user_exam_date ?? ""}
                          onChange={(e) => updateSetting("user_exam_date", e.target.value)}
                        />
                        {adminSchedule?.exam_date && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Admin default:{" "}
                            {format(new Date(adminSchedule.exam_date), "MMM d, yyyy")}
                          </p>
                        )}
                      </PopoverContent>
                    </Popover>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {examDate ? format(new Date(examDate), "MMMM d, yyyy") : "Not set"}
                  </p>
                </div>
              </div>

              <div className="flex justify-between items-center border-b pb-2">
                <div>
                  <p className="font-medium text-sm flex items-center gap-1">
                    Exam Session
                    <Popover>
                      <PopoverTrigger asChild>
                        <button className="text-muted-foreground hover:text-foreground">
                          <Edit2 className="h-3 w-3" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-56 p-3">
                        <Label className="text-xs mb-2 block">Set Session</Label>
                        <Select
                          defaultValue={examSession}
                          onValueChange={(val) => updateSetting("user_exam_session", val)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Morning">Morning</SelectItem>
                            <SelectItem value="Afternoon">Afternoon</SelectItem>
                          </SelectContent>
                        </Select>
                      </PopoverContent>
                    </Popover>
                  </p>
                  <p className="text-xs text-muted-foreground">{examSession}</p>
                </div>
              </div>

              {resultDate && (
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-sm">Expected Result Date</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(resultDate), "MMMM d, yyyy")}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>{" "}
        {/* end sidebar column */}
      </div>{" "}
      {/* end grid gap-6 md:grid-cols-3 */}
    </StandardPageLayout>
  );
}
