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
  CheckCircle2,
  Clock,
  Info,
  Zap,
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";
import { SummaryCard } from "@/components/ui/summary-card";
import { StandardPageLayout } from "@/components/app/StandardPageLayout";

export const Route = createFileRoute("/_authenticated/ielts")({
  head: () => ({ meta: [{ title: "IELTS Tracker — Abroad Compass" }] }),
  component: IeltsPage,
});

type PracticeRow = {
  id: string;
  skill: string | null;
  band: number | null;
  duration_min: number | null;
  words?: number | null;
  created_at: string;
};

function IeltsPage() {
  const { user } = useAuth();
  const { loading: goalsLoading, ieltsSettings: goalsIelts, reload: reloadGoals } = useGoalsData();
  const [practice, setPractice] = useState<PracticeRow[]>([]);
  const [practiceLoading, setPracticeLoading] = useState(true);
  const { globalStreak: streak } = useDashboardData();

  const [localLrw, setLocalLrw] = useState("");
  const [localSpeaking, setLocalSpeaking] = useState("");
  const [datePopoverOpen, setDatePopoverOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadPractice();
  }, [user]);

  async function loadPractice() {
    if (!user) return;
    setPracticeLoading(true);
    const [{ data: p }, { data: checkins }] = await Promise.all([
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase.from as any)("ielts_practice")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("daily_progress")
        .select("checkin_date")
        .eq("user_id", user.id)
        .order("checkin_date", { ascending: false }),
    ]);

    setPractice(p ?? []);

    setPracticeLoading(false);
  }

  // The goals data already reloads via realtime. We use it directly.
  // Derive the goals object: use goalsIelts (from DB), with null-safe fallbacks for display.
  const goals = goalsIelts;

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

  // Target band — only from DB, no hardcoded fallback
  const targetBand = goals?.target_overall ?? null;

  const getSkillStats = (skill: string) => {
    let target = targetBand;
    if (skill === "listening" && goals?.target_listening) target = goals.target_listening;
    if (skill === "reading" && goals?.target_reading) target = goals.target_reading;
    if (skill === "writing" && goals?.target_writing) target = goals.target_writing;
    if (skill === "speaking" && goals?.target_speaking) target = goals.target_speaking;

    const p = practice.filter((x) => x.skill?.toLowerCase() === skill.toLowerCase());
    const hours = p.reduce((acc, curr) => acc + (curr.duration_min ?? 0), 0) / 60;
    const latestBand = p.length > 0 && p[0].band ? p[0].band : 0;
    let progress = 0;
    if (target && target > 0) {
      progress =
        latestBand > 0
          ? Math.min((latestBand / target) * 100, 100)
          : hours > 0
            ? Math.min((hours / 10) * 100, 100)
            : 0;
    }
    const resources = p.length;
    return { hours: hours.toFixed(1), latestBand, progress, resources, target };
  };

  const listening = getSkillStats("listening");
  const reading = getSkillStats("reading");
  const writing = getSkillStats("writing");
  const speaking = getSkillStats("speaking");

  const vocabPractice = practice.filter((x) => x.skill?.toLowerCase() === "vocabulary");
  const wordsLearned = vocabPractice.reduce((acc, curr) => acc + (curr.words ?? 0), 0);

  const totalHours = (
    parseFloat(listening.hours) +
    parseFloat(reading.hours) +
    parseFloat(writing.hours) +
    parseFloat(speaking.hours)
  ).toFixed(1);

  const overallReadiness =
    targetBand != null
      ? Math.min(
          (listening.progress + reading.progress + writing.progress + speaking.progress) / 4,
          100,
        )
      : 0;

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
      nextExamLabel = "Speaking";
      nextExamDate = speakingDate;
    } else if (speakingPassed) {
      nextExamLabel = "LRW";
      nextExamDate = lrwDate;
    } else {
      if (lrwDate <= speakingDate) {
        nextExamLabel = "LRW";
        nextExamDate = lrwDate;
      } else {
        nextExamLabel = "Speaking";
        nextExamDate = speakingDate;
      }
    }
  } else if (lrwDate) {
    if (lrwPassed) {
      isCompleted = true;
      nextExamDate = lrwDate;
    } else {
      nextExamLabel = "LRW";
      nextExamDate = lrwDate;
    }
  } else if (speakingDate) {
    if (speakingPassed) {
      isCompleted = true;
      nextExamDate = speakingDate;
    } else {
      nextExamLabel = "Speaking";
      nextExamDate = speakingDate;
    }
  }

  const daysToNext = nextExamDate ? Math.max(0, differenceInDays(nextExamDate, now)) : null;

  async function saveDates() {
    if (!user) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from("ielts_settings") as any).upsert(
      {
        user_id: user.id,
        exam_date_lrw: localLrw || null,
        exam_date_speaking: localSpeaking || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );
    if (error) {
      toast.error(error.message);
    } else {
      reloadGoals();
      toast.success("Dates updated");
      setDatePopoverOpen(false);
    }
  }

  return (
    <StandardPageLayout title="IELTS Tracker" subtitle="Preparation">
      {!targetBand && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-600 dark:text-amber-400">
          No target band set. Go to{" "}
          <a href="/goals" className="underline font-medium">
            Goals
          </a>{" "}
          to configure your IELTS targets.
        </div>
      )}

      {/* Top Banner Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          accent
          icon={<Target className="h-4 w-4" />}
          title="Target Band"
          value={targetBand != null ? targetBand.toFixed(1) : "—"}
          subtitle={
            <>
              Current Average:{" "}
              {(
                (listening.latestBand +
                  reading.latestBand +
                  writing.latestBand +
                  speaking.latestBand) /
                  4 || 0
              ).toFixed(1)}
            </>
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
                    <Input
                      type="date"
                      value={localLrw}
                      onChange={(e) => setLocalLrw(e.target.value)}
                      className="h-8"
                    />
                  </div>
                  <div>
                    <Label className="text-xs mb-1.5 block text-muted-foreground">
                      Speaking Date
                    </Label>
                    <Input
                      type="date"
                      value={localSpeaking}
                      onChange={(e) => setLocalSpeaking(e.target.value)}
                      className="h-8"
                    />
                  </div>
                  <button
                    onClick={saveDates}
                    className="w-full bg-brand/10 hover:bg-brand/20 text-brand text-xs font-semibold py-2 rounded-md transition-colors"
                  >
                    Save Dates
                  </button>
                </div>
              </PopoverContent>
            </Popover>
          }
          value={
            isCompleted ? (
              "Completed"
            ) : daysToNext !== null ? (
              <div className="flex items-center gap-2">
                {daysToNext} <span className="text-sm font-normal text-muted-foreground">days</span>
              </div>
            ) : (
              "—"
            )
          }
          subtitle={
            isCompleted && nextExamDate ? (
              <>Completed on {format(nextExamDate, "MMM d, yyyy")}</>
            ) : nextExamDate ? (
              <>
                Next Exam: <span className="font-medium text-foreground">{nextExamLabel}</span> •{" "}
                {format(nextExamDate, "dd MMM yyyy")}
              </>
            ) : (
              "Target Date Not Set"
            )
          }
        />

        <SummaryCard
          icon={<Clock className="h-4 w-4" />}
          title="Study Time"
          value={
            <div className="flex items-center gap-2">
              {parseFloat(totalHours).toFixed(1)}{" "}
              <span className="text-sm font-normal text-muted-foreground">hrs</span>
            </div>
          }
          subtitle={<>Active preparation time</>}
        />

        <SummaryCard
          icon={<Zap className="h-4 w-4 text-orange-500" />}
          title="Readiness"
          value={`${Math.round(overallReadiness)}%`}
          subtitle={<>Based on target bands and hours</>}
        />
      </div>

      {/* Overall Readiness */}
      <Card className="bg-card shadow-sm border">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-display text-lg font-semibold flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500" /> Overall IELTS Readiness
            </h3>
            <span className="font-bold text-lg">{Math.round(overallReadiness)}%</span>
          </div>
          <Progress value={overallReadiness} className="h-3" />
          <p className="text-xs text-muted-foreground mt-3">
            {targetBand != null
              ? `Based on your target band ${targetBand.toFixed(1)} and your recent section scores.`
              : "Set your target band in Goals to see readiness progress."}
          </p>
        </CardContent>
      </Card>

      {/* Sections Progress */}
      <div className="grid gap-6 md:grid-cols-2">
        <SkillCard
          title="Listening"
          icon={<Headphones className="h-5 w-5 text-brand" />}
          stats={listening}
        />
        <SkillCard
          title="Reading"
          icon={<BookOpen className="h-5 w-5 text-brand" />}
          stats={reading}
        />
        <SkillCard
          title="Writing"
          icon={<PenTool className="h-5 w-5 text-brand" />}
          stats={writing}
        />
        <SkillCard
          title="Speaking"
          icon={<Mic className="h-5 w-5 text-brand" />}
          stats={speaking}
        />
      </div>

      {/* Vocabulary Tracker */}
      {wordsLearned > 0 && (
        <Card className="shadow-sm border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-brand" /> Vocabulary Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <p className="text-3xl font-display font-bold">{wordsLearned}</p>
                <p className="text-sm text-muted-foreground">Words Logged</p>
              </div>
              <div>
                <p className="text-3xl font-display font-bold">{Math.round(wordsLearned / 5)}</p>
                <p className="text-sm text-muted-foreground">Idioms</p>
              </div>
              <div>
                <p className="text-3xl font-display font-bold">{Math.round(wordsLearned / 4)}</p>
                <p className="text-sm text-muted-foreground">Phrases</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </StandardPageLayout>
  );
}

function SkillCard({
  title,
  icon,
  stats,
}: {
  title: string;
  icon: React.ReactNode;
  stats: {
    hours: string;
    latestBand: number;
    progress: number;
    resources: number;
    target: number | null;
  };
}) {
  return (
    <Card className="shadow-sm border">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          {icon} {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-1.5">
            <span className="font-medium text-foreground">
              Progress to Target{stats.target != null ? ` (${stats.target})` : ""}
            </span>
            <span className="text-muted-foreground">{Math.round(stats.progress)}%</span>
          </div>
          <Progress value={stats.progress} className="h-2" />
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2 border-t text-sm">
          <div>
            <p className="text-muted-foreground">Sessions Logged</p>
            <p className="font-medium">{stats.resources}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Hours Studied</p>
            <p className="font-medium">{stats.hours} hrs</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
