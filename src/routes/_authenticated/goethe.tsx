import { createFileRoute } from "@tanstack/react-router";
import { format, differenceInDays } from "date-fns";
import {
  BookOpen,
  Calendar,
  CheckSquare,
  Flame,
  Headphones,
  Mic,
  PenTool,
  TrendingUp,
  Trophy,
  Loader2,
  Edit2,
  Type,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { SummaryCard } from "@/components/ui/summary-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAuth } from "@/hooks/use-auth";
import { useGoalsData } from "@/hooks/use-goals-data";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { supabase } from "@/integrations/supabase/client";
import { SectionTitle } from "@/components/app/SectionTitle";
import { StandardPageLayout } from "@/components/app/StandardPageLayout";

export const Route = createFileRoute("/_authenticated/goethe")({
  head: () => ({ meta: [{ title: "Goethe / TELC Tracker — Abroad Compass" }] }),
  component: GoethePage,
});

function GoethePage() {
  const { user } = useAuth();
  const { goetheSettings, loading: goalsLoading, reload: reloadGoals } = useGoalsData();

  const [practiceLoading, setPracticeLoading] = useState(true);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [progress, setProgress] = useState<any[]>([]);
  const { globalStreak: streak } = useDashboardData();

  const [localDate, setLocalDate] = useState("");
  const [datePopoverOpen, setDatePopoverOpen] = useState(false);

  const goals = goetheSettings;

  useEffect(() => {
    setLocalDate(goals?.exam_date || "");
  }, [goals?.exam_date]);

  useEffect(() => {
    if (!user) return;
    async function load() {
      const { data } = await supabase.from("daily_progress").select("*").eq("user_id", user!.id);

      setProgress(data ?? []);
      setPracticeLoading(false);
    }
    load();
  }, [user]);

  const loading = goalsLoading || practiceLoading;

  if (loading) {
    return (
      <div className="flex h-full min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  }

  const getSkillStats = (field: string, targetHours = 20) => {
    const hours = progress.reduce((acc, curr) => acc + (Number(curr[field]) || 0), 0);
    const prog = Math.min((hours / targetHours) * 100, 100);
    return { hours: hours.toFixed(1), progress: prog, resources: 0 };
  };

  const reading = getSkillStats("goethe_reading_hours", 20);
  const listening = getSkillStats("goethe_listening_hours", 20);
  const writing = getSkillStats("goethe_writing_hours", 15);
  const speaking = getSkillStats("goethe_speaking_hours", 15);
  const grammar = getSkillStats("goethe_grammar_hours", 10);
  const vocabulary = getSkillStats("goethe_vocab_hours", 10);

  const totalHours = (
    parseFloat(reading.hours) +
    parseFloat(listening.hours) +
    parseFloat(writing.hours) +
    parseFloat(speaking.hours) +
    parseFloat(grammar.hours) +
    parseFloat(vocabulary.hours)
  ).toFixed(1);
  const targetLevel = goals?.target_level ?? null;
  const overallReadiness = Math.round(
    (reading.progress +
      listening.progress +
      writing.progress +
      speaking.progress +
      grammar.progress +
      vocabulary.progress) /
      6,
  );

  const examDate = goals?.exam_date ? new Date(goals.exam_date) : null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  let isCompleted = false;
  if (examDate && examDate < now) {
    isCompleted = true;
  }

  const daysToNext = examDate && !isCompleted ? Math.max(0, differenceInDays(examDate, now)) : null;

  async function saveDates() {
    if (!user) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from("goethe_settings") as any).upsert(
      {
        user_id: user.id,
        exam_date: localDate || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );
    if (error) {
      toast.error(error.message);
    } else {
      reloadGoals();
      toast.success("Date updated");
      setDatePopoverOpen(false);
    }
  }

  return (
    <StandardPageLayout title="Goethe / TELC Tracker" subtitle="Exam Preparation">
      {/* Top Cards row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          accent
          icon={<Trophy className="h-4 w-4" />}
          title="Target Level"
          value={targetLevel ? targetLevel : "Not Set"}
          subtitle={<>Current goal</>}
        />

        <SummaryCard
          icon={<Calendar className="h-4 w-4" />}
          title={isCompleted ? "Exam Completed" : "Days to Exam"}
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
                    <Label className="text-xs mb-1.5 block text-muted-foreground">Exam Date</Label>
                    <Input
                      type="date"
                      value={localDate}
                      onChange={(e) => setLocalDate(e.target.value)}
                      className="h-8"
                    />
                  </div>
                  <button
                    onClick={saveDates}
                    className="w-full bg-brand/10 hover:bg-brand/20 text-brand text-xs font-semibold py-2 rounded-md transition-colors"
                  >
                    Save Date
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
            isCompleted && examDate ? (
              <>Completed on {format(examDate, "MMM d, yyyy")}</>
            ) : examDate ? (
              <>Exam Date: {format(examDate, "MMM d, yyyy")}</>
            ) : (
              "Click edit to configure"
            )
          }
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
          title="Weekly Goal"
          value={
            <div className="flex items-center gap-2">
              0{" "}
              <span className="text-sm font-normal text-muted-foreground">
                / {goals?.weekly_goal_hours || 5} hrs
              </span>
            </div>
          }
        />
      </div>

      {/* Overall Readiness */}
      <Card className="bg-card shadow-sm border">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-display text-lg font-semibold flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500" /> Overall Readiness
            </h3>
            <span className="font-bold text-lg">{Math.round(overallReadiness)}%</span>
          </div>
          <Progress value={overallReadiness} className="h-3" />
          <p className="text-xs text-muted-foreground mt-3">
            {targetLevel != null
              ? `Based on your target level ${targetLevel} and your recent section scores.`
              : "Set your target level in Goals to see readiness progress."}
          </p>
        </CardContent>
      </Card>

      {/* Sections Progress */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
          title="Listening"
          icon={<Headphones className="h-5 w-5 text-brand" />}
          stats={listening}
        />
        <SkillCard
          title="Speaking"
          icon={<Mic className="h-5 w-5 text-brand" />}
          stats={speaking}
        />
        <SkillCard
          title="Grammar"
          icon={<CheckSquare className="h-5 w-5 text-brand" />}
          stats={grammar}
        />
        <SkillCard
          title="Vocabulary"
          icon={<Type className="h-5 w-5 text-brand" />}
          stats={vocabulary}
        />
      </div>
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
    progress: number;
    resources: number;
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
            <span className="font-medium text-foreground">Progress</span>
            <span className="text-muted-foreground">{Math.round(stats.progress)}%</span>
          </div>
          <Progress value={stats.progress} className="h-2" />
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2 border-t text-sm">
          <div>
            <p className="text-muted-foreground">Completion</p>
            <p className="font-medium">{stats.progress}%</p>
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
