import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { useGoalsData } from "@/hooks/use-goals-data";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Loader2,
  Headphones,
  BookOpen,
  PenTool,
  Mic,
  Calendar,
  Target,
  Trophy,
  CheckSquare,
  Flame,
  TrendingUp,
  Edit2,
  Clock,
  BarChart3,
  AlertCircle,
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { calculateTrackerAnalytics } from "@/lib/analytics";import { SummaryCard } from "@/components/ui/summary-card";
import { StandardPageLayout } from "@/components/app/StandardPageLayout";

export const Route = createFileRoute("/_authenticated/ielts")({
  head: () => ({ meta: [{ title: "IELTS Tracker — Abroad Compass" }] }),
  component: IeltsPage,
});

// Columns exactly as they exist in the database (confirmed in types.ts and migration)
// IELTS skill time is stored as fractional HOURS (e.g. 50 min → 0.833)
// The modal saves: ielts_listening_hours = iListMin / 60
type DailyProgressRow = {
  checkin_date: string;
  ielts_listening_hours: number | null;  // fractional hours
  ielts_reading_hours: number | null;    // fractional hours
  ielts_writing_hours: number | null;    // fractional hours
  ielts_speaking_hours: number | null;   // fractional hours
  ielts_vocab_count: number | null;      // word count
  ielts_mock_taken: boolean | null;
  ielts_mock_listening: number | null;
  ielts_mock_reading: number | null;
  ielts_mock_writing: number | null;
  ielts_mock_speaking: number | null;
  ielts_mock_overall: number | null;
};

function IeltsPage() {
  const { user } = useAuth();
  const { loading: goalsLoading, ieltsSettings: goalsIelts, reload: reloadGoals } = useGoalsData();
  const [progress, setProgress] = useState<DailyProgressRow[]>([]);
  const [practiceLoading, setPracticeLoading] = useState(true);
  const { globalStreak: streak } = useDashboardData();

  const [localLrw, setLocalLrw] = useState("");
  const [localSpeaking, setLocalSpeaking] = useState("");
  const [datePopoverOpen, setDatePopoverOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadProgress();
  }, [user]);

  async function loadProgress() {
    if (!user) return;
    setPracticeLoading(true);
    // Columns confirmed in DB: ielts_*_hours (fractional), NOT ielts_*_min
    const { data, error } = await (supabase.from as any)("daily_progress")
      .select(
        "checkin_date,ielts_listening_hours,ielts_reading_hours,ielts_writing_hours,ielts_speaking_hours,ielts_vocab_count,ielts_mock_taken,ielts_mock_listening,ielts_mock_reading,ielts_mock_writing,ielts_mock_speaking,ielts_mock_overall",
      )
      .eq("user_id", user.id)
      .order("checkin_date", { ascending: false });

    // ── DEBUG: Full pipeline trace ──────────────────────────────────────────
    console.group("[IELTS Tracker] loadProgress pipeline");
    console.log("Supabase error:", error);
    console.log("Raw daily_progress rows:", data);
    if (data && data.length > 0) {
      const sample = data[0];
      console.log("Sample row column values:", {
        checkin_date: sample.checkin_date,
        ielts_listening_hours: sample.ielts_listening_hours,
        ielts_reading_hours: sample.ielts_reading_hours,
        ielts_writing_hours: sample.ielts_writing_hours,
        ielts_speaking_hours: sample.ielts_speaking_hours,
        ielts_vocab_count: sample.ielts_vocab_count,
        ielts_mock_taken: sample.ielts_mock_taken,
        ielts_mock_overall: sample.ielts_mock_overall,
      });
    }
    console.groupEnd();
    // ────────────────────────────────────────────────────────────────────────

    setProgress(data ?? []);
    setPracticeLoading(false);
  }

  const goals = goalsIelts;

  // ─── Pure analytics functions ──────────────────────────────────────────────
  // All operate only on real data. No constants serve as band proxies.

  /** Sum a numeric column across all rows, treating null/undefined as 0. */
  function sumCol(col: keyof DailyProgressRow): number {
    return progress.reduce((acc, r) => acc + (Number(r[col]) || 0), 0);
  }

  /** Mock rows sorted most-recent-first, only rows where overall band exists. */
  function getMockRows(): DailyProgressRow[] {
    return progress
      .filter((r) => r.ielts_mock_taken && r.ielts_mock_overall != null)
      .sort((a, b) => b.checkin_date.localeCompare(a.checkin_date));
  }

  /** Population standard deviation. */
  function stddev(values: number[]): number {
    if (values.length < 2) return 0;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    return Math.sqrt(values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // SHARED ANALYTICS ENGINE
  // ──────────────────────────────────────────────────────────────────────────

  const totalHours = sumCol("ielts_listening_hours") + sumCol("ielts_reading_hours") + sumCol("ielts_writing_hours") + sumCol("ielts_speaking_hours");
  const sessionCount = progress.filter(
    (r) => (Number(r.ielts_listening_hours) || 0) + (Number(r.ielts_reading_hours) || 0) + (Number(r.ielts_writing_hours) || 0) + (Number(r.ielts_speaking_hours) || 0) > 0,
  ).length;
  const vocabWords = sumCol("ielts_vocab_count");

  const skillHours = {
    listening: sumCol("ielts_listening_hours"),
    reading:   sumCol("ielts_reading_hours"),
    writing:   sumCol("ielts_writing_hours"),
    speaking:  sumCol("ielts_speaking_hours"),
  };

  const skillsCovered = [
    sumCol("ielts_listening_hours") >= 5,
    sumCol("ielts_reading_hours") >= 5,
    sumCol("ielts_writing_hours") >= 5,
    sumCol("ielts_speaking_hours") >= 5,
  ].filter(Boolean).length;

  const mockRows = getMockRows();
  const hasMocks = mockRows.length > 0;
  const mockTrend = mockRows.length >= 2
    ? (Number(mockRows[0].ielts_mock_overall) || 0) - (Number(mockRows[1].ielts_mock_overall) || 0)
    : null;
  const allMocksChronological = [...mockRows].reverse().map((r) => ({ date: r.checkin_date, band: Number(r.ielts_mock_overall) }));
  const bands = allMocksChronological.map((r) => r.band);

  const latestMock = mockRows[0] ?? null;
  const latestSkillsRaw = {
    listening: latestMock?.ielts_mock_listening != null ? Number(latestMock.ielts_mock_listening) : null,
    reading:   latestMock?.ielts_mock_reading   != null ? Number(latestMock.ielts_mock_reading)   : null,
    writing:   latestMock?.ielts_mock_writing   != null ? Number(latestMock.ielts_mock_writing)   : null,
    speaking:  latestMock?.ielts_mock_speaking  != null ? Number(latestMock.ielts_mock_speaking)  : null,
  };
  const latestSkills = [
    latestSkillsRaw.listening,
    latestSkillsRaw.reading,
    latestSkillsRaw.writing,
    latestSkillsRaw.speaking,
  ].filter(v => v !== null) as number[];

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 14);
  const cutoffStr = format(cutoff, "yyyy-MM-dd");
  const recentActiveDays = progress.filter((r) => r.checkin_date >= cutoffStr && (Number(r.ielts_listening_hours) || 0) + (Number(r.ielts_reading_hours) || 0) + (Number(r.ielts_writing_hours) || 0) + (Number(r.ielts_speaking_hours) || 0) > 0).length;

  const targetBand = goals?.target_overall ?? null;

  const {
    prepScore,
    prepBreakdown,
    confScore,
    confBreakdown,
    latestOverall,
    avg3Overall,
  } = calculateTrackerAnalytics({
    totalStudyHours: totalHours,
    sessionCount,
    vocabWords,
    skillHours: Object.values(skillHours),
    recentActiveDays,
    mockScoresChronological: bands,
    latestSkillScores: latestSkills,
    targetScore: targetBand,
  });

  // ── Exam countdown (unchanged) ───────────────────────────────────────────

  useEffect(() => {
    setLocalLrw(goals?.exam_date_lrw || "");
    setLocalSpeaking(goals?.exam_date_speaking || "");
  }, [goals?.exam_date_lrw, goals?.exam_date_speaking]);

  const loading = goalsLoading || practiceLoading;

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  const lrwDate = goals?.exam_date_lrw ? new Date(goals.exam_date_lrw) : null;
  const speakingDate = goals?.exam_date_speaking ? new Date(goals.exam_date_speaking) : null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  let nextExamLabel = "";
  let nextExamDate: Date | null = null;
  let isCompleted = false;

  const lrwPassed = lrwDate && lrwDate < now;
  const speakingPassed = speakingDate && speakingDate < now;

  if (lrwDate && speakingDate) {
    if (lrwPassed && speakingPassed) {
      isCompleted = true;
      nextExamDate = lrwDate > speakingDate ? lrwDate : speakingDate;
    } else if (lrwPassed) {
      nextExamLabel = "Speaking"; nextExamDate = speakingDate;
    } else if (speakingPassed) {
      nextExamLabel = "LRW"; nextExamDate = lrwDate;
    } else {
      if (lrwDate <= speakingDate) { nextExamLabel = "LRW"; nextExamDate = lrwDate; }
      else { nextExamLabel = "Speaking"; nextExamDate = speakingDate; }
    }
  } else if (lrwDate) {
    if (lrwPassed) { isCompleted = true; nextExamDate = lrwDate; }
    else { nextExamLabel = "LRW"; nextExamDate = lrwDate; }
  } else if (speakingDate) {
    if (speakingPassed) { isCompleted = true; nextExamDate = speakingDate; }
    else { nextExamLabel = "Speaking"; nextExamDate = speakingDate; }
  }

  const daysToNext = nextExamDate ? Math.max(0, differenceInDays(nextExamDate, now)) : null;

  async function saveDates() {
    if (!user) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from("ielts_settings") as any).upsert(
      { user_id: user.id, exam_date_lrw: localLrw || null, exam_date_speaking: localSpeaking || null, updated_at: new Date().toISOString() },
      { onConflict: "user_id" },
    );
    if (error) toast.error(error.message);
    else { reloadGoals(); toast.success("Dates updated"); setDatePopoverOpen(false); }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <StandardPageLayout title="IELTS Tracker" subtitle="Preparation">
      {!targetBand && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-600 dark:text-amber-400">
          No target band set. Go to{" "}
          <a href="/goals" className="underline font-medium">Goals</a>{" "}
          to configure your IELTS targets.
        </div>
      )}

      {/* ── Summary strip ─────────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          accent
          icon={<Target className="h-4 w-4" />}
          title="Target Band"
          value={targetBand != null ? targetBand.toFixed(1) : "—"}
          subtitle={
            latestOverall != null
              ? <>Latest mock: <span className="font-semibold text-foreground">{latestOverall.toFixed(1)}</span></>
              : <>No mock results yet</>
          }
        />
        <SummaryCard
          icon={<Calendar className="h-4 w-4" />}
          title={isCompleted ? "IELTS Completed" : "Days to IELTS"}
          action={
            <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen}>
              <PopoverTrigger asChild>
                <button className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-muted/50 transition-colors">
                  <Edit2 className="h-3 w-3" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-4 shadow-lg border-brand/20">
                <div className="space-y-4">
                  <div>
                    <Label className="text-xs mb-1.5 block text-muted-foreground">LRW Date</Label>
                    <Input type="date" value={localLrw} onChange={(e) => setLocalLrw(e.target.value)} className="h-8" />
                  </div>
                  <div>
                    <Label className="text-xs mb-1.5 block text-muted-foreground">Speaking Date</Label>
                    <Input type="date" value={localSpeaking} onChange={(e) => setLocalSpeaking(e.target.value)} className="h-8" />
                  </div>
                  <button onClick={saveDates} className="w-full bg-brand/10 hover:bg-brand/20 text-brand text-xs font-semibold py-2 rounded-md transition-colors">
                    Save Dates
                  </button>
                </div>
              </PopoverContent>
            </Popover>
          }
          value={
            isCompleted ? "Completed" :
            daysToNext !== null ? (<div className="flex items-center gap-2">{daysToNext} <span className="text-sm font-normal text-muted-foreground">days</span></div>) : "—"
          }
          subtitle={
            isCompleted && nextExamDate ? <>Completed on {format(nextExamDate, "MMM d, yyyy")}</> :
            nextExamDate ? <>Next: <span className="font-medium text-foreground">{nextExamLabel}</span> · {format(nextExamDate, "dd MMM yyyy")}</> :
            "Target Date Not Set"
          }
        />
        <SummaryCard
          icon={<Clock className="h-4 w-4" />}
          title="Total Study Time"
          value={<div className="flex items-center gap-2">{totalHours.toFixed(1)} <span className="text-sm font-normal text-muted-foreground">hrs</span></div>}
          subtitle={<>{sessionCount} sessions · {sessionCount} active days</>}
        />
        <SummaryCard
          icon={<Flame className="h-4 w-4 text-orange-500" />}
          title="Study Streak"
          value={<div className="flex items-center gap-2">{streak} <span className="text-sm font-normal text-muted-foreground">days</span></div>}
          subtitle={<>Consistent practice pays off</>}
        />
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
           PANEL 1 — PREPARATION PROGRESS (effort metrics only)
      ═══════════════════════════════════════════════════════════════════ */}
      <Card className="shadow-sm border">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4 text-brand" /> Preparation Progress
            <span className="ml-auto text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              Effort metric — not a band estimate
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1.5">
              <span className="font-medium">Overall preparation effort</span>
              <span className="font-bold text-foreground">{prepScore}%</span>
            </div>
            <Progress value={prepScore} className="h-2.5" />
            <p className="text-xs text-muted-foreground mt-2">
              Measures how much you've prepared — not your current English proficiency.
              100% means you've hit the preparation benchmarks across all effort dimensions.
            </p>
          </div>
          <div className="grid gap-2 pt-2 border-t">
            {Object.entries(prepBreakdown).map(([label, val]) => (
              <div key={label} className="space-y-0.5">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{label}</span><span>{val}%</span>
                </div>
                <Progress value={val} className="h-1" />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t">
            {[
              { label: "Study Hours", value: totalHours.toFixed(1) + " h" },
              { label: "Sessions", value: String(sessionCount) },
              { label: "Vocab Words", value: String(vocabWords) },
              { label: "Skills Covered", value: `${skillsCovered} / 4` },
            ].map(({ label, value }) => (
              <div key={label} className="text-center rounded-md bg-muted/40 p-2">
                <p className="text-lg font-bold font-display">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Per-skill effort cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {(["listening", "reading", "writing", "speaking"] as const).map((skill) => {
          const icons = {
            listening: <Headphones className="h-4 w-4 text-brand" />,
            reading:   <BookOpen   className="h-4 w-4 text-brand" />,
            writing:   <PenTool    className="h-4 w-4 text-brand" />,
            speaking:  <Mic        className="h-4 w-4 text-brand" />,
          };
          const hrs = skillHours[skill];
          // Effort bar: 50 h per skill = 100% — a reasonable per-skill benchmark,
          // NOT a band estimate.
          const effortPct = Math.min(Math.round((hrs / 50) * 100), 100);
          const sessions = progress.filter((r) => (Number(r[`ielts_${skill}_hours` as keyof DailyProgressRow]) || 0) > 0).length;
          const mockColKey = `ielts_mock_${skill}` as keyof DailyProgressRow;
          const latestSkillBand = mockRows.find((r) => r[mockColKey] != null);
          const skillBandVal = latestSkillBand ? Number(latestSkillBand[mockColKey]) : null;
          return (
            <Card key={skill} className="shadow-sm border">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium capitalize">
                  {icons[skill]} {skill}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Hours studied (effort)</span>
                    <span>{hrs.toFixed(1)} h</span>
                  </div>
                  <Progress value={effortPct} className="h-1.5" />
                </div>
                <div className="flex justify-between text-xs border-t pt-2">
                  <span className="text-muted-foreground">Sessions logged</span>
                  <span className="font-medium">{sessions}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Latest mock band</span>
                  <span className="font-medium">{skillBandVal != null ? skillBandVal.toFixed(1) : "—"}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
           PANEL 2 — CURRENT PERFORMANCE (mock results only, zero inference)
      ═══════════════════════════════════════════════════════════════════ */}
      <Card className="shadow-sm border">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="h-4 w-4 text-brand" /> Current Performance
            <span className="ml-auto text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              Based on mock tests only
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!hasMocks ? (
            <div className="flex flex-col items-center justify-center py-8 text-center gap-3">
              <AlertCircle className="h-8 w-8 text-muted-foreground/50" />
              <div>
                <p className="font-medium text-sm">No mock test results yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Take a mock IELTS test and log it in your Daily Check-in to see your performance data.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Latest Overall Band</p>
                  <p className="text-3xl font-display font-bold">{latestOverall != null ? latestOverall.toFixed(1) : "—"}</p>
                  {avg3Overall != null && (
                    <p className="text-xs text-muted-foreground">
                      Avg of last {Math.min(mockRows.length, 3)} mocks: {avg3Overall.toFixed(2)}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  {mockTrend != null && (
                    <div className={`text-sm font-semibold ${
                      mockTrend > 0 ? "text-emerald-600" : mockTrend < 0 ? "text-rose-600" : "text-muted-foreground"
                    }`}>
                      {mockTrend > 0 ? "↑" : mockTrend < 0 ? "↓" : "→"} {Math.abs(mockTrend).toFixed(1)} vs previous
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">{mockRows.length} mock{mockRows.length !== 1 ? "s" : ""} taken</p>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t">
                {([
                  { label: "Listening", val: latestSkillsRaw.listening },
                  { label: "Reading",   val: latestSkillsRaw.reading   },
                  { label: "Writing",   val: latestSkillsRaw.writing   },
                  { label: "Speaking",  val: latestSkillsRaw.speaking  },
                ] as const).map(({ label, val }) => (
                  <div key={label} className="text-center rounded-md bg-muted/40 p-2">
                    <p className="text-xl font-bold font-display">{val != null ? val.toFixed(1) : "—"}</p>
                    <p className="text-xs text-muted-foreground">{label}</p>
                  </div>
                ))}
              </div>
              {allMocksChronological.length >= 2 && (
                <div className="pt-3 border-t">
                  <p className="text-xs text-muted-foreground mb-2">Mock test history (overall band)</p>
                  <div className="flex items-end gap-2 h-12">
                    {allMocksChronological.map((m) => (
                      <div key={m.date} className="flex flex-col items-center gap-0.5 flex-1 min-w-0">
                        <span className="text-[10px] text-muted-foreground font-medium">{m.band}</span>
                        <div className="w-full rounded-t bg-brand/60" style={{ height: `${Math.round((m.band / 9) * 100)}%` }} />
                        <span className="text-[9px] text-muted-foreground truncate w-full text-center">{format(new Date(m.date), "d/M")}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ═══════════════════════════════════════════════════════════════════
           PANEL 3 — TARGET CONFIDENCE SIGNAL (requires ≥ 2 mocks)
      ═══════════════════════════════════════════════════════════════════ */}
      {targetBand != null && (
        <Card className="shadow-sm border">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Trophy className="h-4 w-4 text-amber-500" /> Target Confidence Signal
              <span className="ml-auto text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                Not a prediction
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {confScore == null ? (
              <div className="flex flex-col items-center justify-center py-8 text-center gap-3">
                <AlertCircle className="h-8 w-8 text-muted-foreground/50" />
                <div>
                  <p className="font-medium text-sm">Insufficient data</p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                    At least 2 mock test results are required to generate a confidence signal.
                    Take a second IELTS mock test and log it in your Daily Check-in.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <div className="flex items-baseline justify-between mb-1.5">
                    <span className="text-sm font-medium">Confidence signal for Band {targetBand.toFixed(1)}</span>
                    <span className="text-2xl font-bold font-display">{confScore}%</span>
                  </div>
                  <Progress value={confScore} className="h-2.5" />
                  <p className="text-xs text-muted-foreground mt-2">
                    A composite signal based on your mock scores vs target, score trend, skill balance, and recent study activity.
                    This is <span className="font-medium">not</span> a statistical prediction of your exam outcome.
                  </p>
                </div>
                <div className="grid gap-2 pt-3 border-t">
                  {Object.entries(confBreakdown).map(([label, val]) => (
                    <div key={label} className="space-y-0.5">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{label}</span><span>{val}%</span>
                      </div>
                      <Progress value={val} className="h-1" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Vocabulary ─────────────────────────────────────────────────────── */}
      {vocabWords > 0 && (
        <Card className="shadow-sm border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckSquare className="h-4 w-4 text-brand" /> Vocabulary Logged
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <p className="text-3xl font-display font-bold">{vocabWords}</p>
              <p className="text-sm text-muted-foreground">words logged across all sessions</p>
            </div>
          </CardContent>
        </Card>
      )}
    </StandardPageLayout>
  );
}
