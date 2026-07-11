import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useHabits, type Habit } from "@/hooks/use-habits";
import { differenceInDays, format, startOfDay, subDays } from "date-fns";
import { motion } from "framer-motion";
import {
  Timer,
  Play,
  Pause,
  RotateCcw,
  Target,
  Trophy,
  Flame,
  Plus,
  Trash2,
  CheckSquare,
  CalendarClock,
  BookOpen,
  Focus,
  ListChecks,
  Coffee,
  Sparkles,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { EmptyState } from "@/components/app/EmptyState";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/tools")({
  head: () => ({
    meta: [
      { title: "Productivity Tools — Abroad Compass" },
      {
        name: "description",
        content:
          "Focus timer, habit tracker, goal tracker, application checklists and deadline countdowns.",
      },
    ],
  }),
  component: ToolsPage,
});

function ToolsPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold tracking-tight">Productivity Tools</h1>
        <p className="text-sm text-muted-foreground">
          Focus sessions, habits, goals and checklists — everything you need to ship your Germany
          plan.
        </p>
      </header>

      <Tabs defaultValue="focus" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-5">
          <TabsTrigger value="focus">
            <Focus className="mr-2 h-4 w-4" />
            Focus
          </TabsTrigger>
          <TabsTrigger value="habits">
            <Flame className="mr-2 h-4 w-4" />
            Habits
          </TabsTrigger>
          <TabsTrigger value="goals">
            <Target className="mr-2 h-4 w-4" />
            Goals
          </TabsTrigger>
          <TabsTrigger value="deadlines">
            <CalendarClock className="mr-2 h-4 w-4" />
            Deadlines
          </TabsTrigger>
          <TabsTrigger value="checklists">
            <ListChecks className="mr-2 h-4 w-4" />
            Checklists
          </TabsTrigger>
        </TabsList>

        <TabsContent value="focus">
          <FocusPanel />
        </TabsContent>
        <TabsContent value="habits">
          <HabitsPanel />
        </TabsContent>
        <TabsContent value="goals">
          <GoalsPanel />
        </TabsContent>
        <TabsContent value="deadlines">
          <DeadlinesPanel />
        </TabsContent>
        <TabsContent value="checklists">
          <ChecklistsPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ============ FOCUS / POMODORO ============ */

type FocusMode = {
  key: string;
  label: string;
  work: number;
  break: number;
  icon: React.ComponentType<{ className?: string }>;
};
const MODES: FocusMode[] = [
  { key: "pomodoro", label: "Pomodoro", work: 25, break: 5, icon: Timer },
  { key: "deep", label: "Deep Work", work: 50, break: 10, icon: Focus },
  { key: "german", label: "German Practice", work: 30, break: 5, icon: BookOpen },
  { key: "short", label: "Sprint", work: 15, break: 3, icon: Sparkles },
];

function FocusPanel() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [modeKey, setModeKey] = useLocalStorage("tools.focus.mode", "pomodoro");
  const [label, setLabel] = useLocalStorage("tools.focus.label", "");
  const mode = MODES.find((m) => m.key === modeKey) ?? MODES[0];
  const [phase, setPhase] = useState<"work" | "break" | "idle">("idle");
  const [remaining, setRemaining] = useState(mode.work * 60);
  const [running, setRunning] = useState(false);
  const startedRef = useRef<Date | null>(null);
  const total = phase === "break" ? mode.break * 60 : mode.work * 60;

  useEffect(() => {
    if (!running) setRemaining(total);
  }, [modeKey, phase, total, running]);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          window.clearInterval(id);
          onPhaseEnd();
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  async function logSession(actualMinutes: number, interrupted: boolean) {
    if (!user || actualMinutes <= 0) return;
    await supabase.from("focus_sessions" as never).insert({
      user_id: user.id,
      mode: mode.key,
      label: label || null,
      planned_minutes: mode.work,
      actual_minutes: actualMinutes,
      started_at: startedRef.current?.toISOString() ?? new Date().toISOString(),
      ended_at: new Date().toISOString(),
      interrupted,
    } as never);
    qc.invalidateQueries({ queryKey: ["focus-sessions"] });
  }

  function start() {
    startedRef.current = new Date();
    setPhase("work");
    setRemaining(mode.work * 60);
    setRunning(true);
  }
  function pause() {
    setRunning(false);
  }
  function resume() {
    setRunning(true);
  }
  function reset() {
    if (running && phase === "work" && startedRef.current) {
      const mins = Math.round((Date.now() - startedRef.current.getTime()) / 60000);
      void logSession(mins, true);
    }
    setRunning(false);
    setPhase("idle");
    setRemaining(mode.work * 60);
  }
  function onPhaseEnd() {
    if (phase === "work") {
      void logSession(mode.work, false);
      toast.success(`Nice work — ${mode.work}m done. Time for a ${mode.break}m break.`);
      setPhase("break");
      setRemaining(mode.break * 60);
      setRunning(true);
    } else {
      toast("Break over — start another session?");
      setRunning(false);
      setPhase("idle");
      setRemaining(mode.work * 60);
    }
  }

  const mm = Math.floor(remaining / 60)
    .toString()
    .padStart(2, "0");
  const ss = (remaining % 60).toString().padStart(2, "0");
  const pct = total ? ((total - remaining) / total) * 100 : 0;

  const sessionsQ = useQuery({
    queryKey: ["focus-sessions", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const since = format(subDays(new Date(), 6), "yyyy-MM-dd");
      const { data } = await supabase
        .from("focus_sessions" as never)
        .select("actual_minutes,mode,started_at,label")
        .gte("started_at", since)
        .order("started_at", { ascending: false });
      return (data ?? []) as Array<{
        actual_minutes: number;
        mode: string;
        started_at: string;
        label: string | null;
      }>;
    },
  });
  const totalMin = (sessionsQ.data ?? []).reduce((s, r) => s + (r.actual_minutes ?? 0), 0);

  return (
    <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
      <Card className="shadow-card">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <mode.icon className="h-5 w-5 text-brand" />
              <CardTitle className="font-display">{mode.label}</CardTitle>
            </div>
            <div className="flex gap-2">
              {MODES.map((m) => (
                <Button
                  key={m.key}
                  size="sm"
                  variant={m.key === mode.key ? "default" : "outline"}
                  disabled={running}
                  onClick={() => setModeKey(m.key)}
                >
                  {m.label}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid place-items-center py-8">
            <motion.div
              key={`${phase}-${modeKey}`}
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="relative grid h-56 w-56 place-items-center rounded-full border-8 border-muted"
              style={{
                background: `conic-gradient(hsl(var(--brand)) ${pct * 3.6}deg, transparent 0deg)`,
              }}
            >
              <div className="absolute inset-3 grid place-items-center rounded-full bg-background">
                <div className="text-center">
                  <div className="font-display text-5xl font-bold tabular-nums">
                    {mm}:{ss}
                  </div>
                  <div className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">
                    {phase === "break" ? (
                      <>
                        <Coffee className="mr-1 inline h-3 w-3" />
                        break
                      </>
                    ) : phase === "work" ? (
                      "focus"
                    ) : (
                      "ready"
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          <div>
            <Label htmlFor="focus-label">What are you working on?</Label>
            <Input
              id="focus-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="SOP draft, German B1 chapter 4…"
              className="mt-1"
            />
          </div>

          <div className="flex flex-wrap justify-center gap-2">
            {phase === "idle" && (
              <Button onClick={start} size="lg" className="gap-2">
                <Play className="h-4 w-4" />
                Start
              </Button>
            )}
            {phase !== "idle" && running && (
              <Button onClick={pause} size="lg" variant="outline" className="gap-2">
                <Pause className="h-4 w-4" />
                Pause
              </Button>
            )}
            {phase !== "idle" && !running && (
              <Button onClick={resume} size="lg" className="gap-2">
                <Play className="h-4 w-4" />
                Resume
              </Button>
            )}
            <Button onClick={reset} size="lg" variant="ghost" className="gap-2">
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="font-display text-base">Last 7 days</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-lg border p-4">
            <p className="text-xs text-muted-foreground">Focused time</p>
            <p className="font-display text-3xl font-bold">
              {Math.floor(totalMin / 60)}h {totalMin % 60}m
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {(sessionsQ.data ?? []).length} sessions
            </p>
          </div>
          <div className="space-y-2">
            {(sessionsQ.data ?? []).slice(0, 8).map((s, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
              >
                <div className="flex items-center gap-2 truncate">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="truncate">{s.label || s.mode}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {s.actual_minutes}m · {format(new Date(s.started_at), "EEE p")}
                </span>
              </div>
            ))}
            {(sessionsQ.data ?? []).length === 0 && (
              <p className="py-6 text-center text-xs text-muted-foreground">
                No focus sessions yet.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ============ HABITS ============ */

function HabitsPanel() {
  const { habits, completions, complete, create, archive, loading } = useHabits();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "study",
    cadence: "daily",
    target: 1,
  });

  const today = format(new Date(), "yyyy-MM-dd");
  const completionsByHabit = useMemo(() => {
    const m = new Map<string, Set<string>>();
    for (const c of completions) {
      if (!m.has(c.habit_id)) m.set(c.habit_id, new Set());
      m.get(c.habit_id)!.add(c.completed_on);
    }
    return m;
  }, [completions]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {habits.length} active {habits.length === 1 ? "habit" : "habits"}
        </p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              New habit
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New habit</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Name</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Practice German 30 min"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Input
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Optional"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Category</Label>
                  <Select
                    value={form.category}
                    onValueChange={(v) => setForm({ ...form, category: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="language">Language</SelectItem>
                      <SelectItem value="study">Study</SelectItem>
                      <SelectItem value="wellness">Wellness</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Cadence</Label>
                  <Select
                    value={form.cadence}
                    onValueChange={(v) => setForm({ ...form, cadence: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                disabled={!form.name.trim() || create.isPending}
                onClick={async () => {
                  await create.mutateAsync({
                    name: form.name.trim(),
                    description: form.description.trim() || null,
                    category: form.category,
                    cadence: form.cadence,
                    target_per_period: form.target,
                  });
                  setForm({
                    name: "",
                    description: "",
                    category: "study",
                    cadence: "daily",
                    target: 1,
                  });
                  setOpen(false);
                }}
              >
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <p className="text-center text-sm text-muted-foreground py-8">Loading…</p>
      ) : habits.length === 0 ? (
        <EmptyState
          icon={Flame}
          title="Track your first habit"
          description="Small daily wins compound. Add a habit like 'German 30 min' or 'Vocabulary review'."
          action={{ label: "New habit", onClick: () => setOpen(true) }}
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {habits.map((h) => {
            const done = completionsByHabit.get(h.id)?.has(today) ?? false;
            const last7 = Array.from({ length: 7 }, (_, i) => {
              const d = format(subDays(new Date(), 6 - i), "yyyy-MM-dd");
              return { d, done: completionsByHabit.get(h.id)?.has(d) ?? false };
            });
            return (
              <HabitCard
                key={h.id}
                habit={h}
                done={done}
                last7={last7}
                onComplete={() => complete.mutate(h)}
                onArchive={() => archive.mutate(h.id)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

function HabitCard({
  habit,
  done,
  last7,
  onComplete,
  onArchive,
}: {
  habit: Habit;
  done: boolean;
  last7: { d: string; done: boolean }[];
  onComplete: () => void;
  onArchive: () => void;
}) {
  return (
    <Card className="shadow-card">
      <CardContent className="pt-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-medium truncate">{habit.name}</h3>
              {habit.category && (
                <Badge variant="secondary" className="text-[10px]">
                  {habit.category}
                </Badge>
              )}
            </div>
            {habit.description && (
              <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                {habit.description}
              </p>
            )}
          </div>
          <Button size="icon" variant="ghost" onClick={onArchive} aria-label="Archive">
            <Trash2 className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>

        <div className="mt-4 flex items-center gap-4">
          <div className="text-center">
            <div className="flex items-center gap-1">
              <Flame className="h-4 w-4 text-orange-500" />
              <span className="font-display text-xl font-bold">{habit.current_streak}</span>
            </div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">streak</p>
          </div>
          <div className="text-center">
            <div className="flex items-center gap-1">
              <Trophy className="h-4 w-4 text-amber-500" />
              <span className="font-display text-xl font-bold">{habit.longest_streak}</span>
            </div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">best</p>
          </div>
          <div className="ml-auto flex gap-1">
            {last7.map((d) => (
              <div
                key={d.d}
                className={`h-6 w-3 rounded-sm ${d.done ? "bg-brand" : "bg-muted"}`}
                title={d.d}
              />
            ))}
          </div>
        </div>

        <Button
          className="mt-4 w-full gap-2"
          variant={done ? "outline" : "default"}
          onClick={onComplete}
          disabled={done}
        >
          <CheckSquare className="h-4 w-4" />
          {done ? "Done today" : "Mark done"}
        </Button>
      </CardContent>
    </Card>
  );
}

/* ============ GOALS (savings + application) ============ */

function GoalsPanel() {
  const { user } = useAuth();
  const goalQ = useQuery({
    queryKey: ["savings-goal", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("savings_goals")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
  });
  const budgetQ = useQuery({
    queryKey: ["budget-sum", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("budget_entries")
        .select("amount,kind")
        .eq("user_id", user!.id);
      return data ?? [];
    },
  });
  const netSaved = useMemo(() => {
    const rows = budgetQ.data ?? [];
    return rows.reduce(
      (s, r) => s + (r.kind === "income" ? Number(r.amount) : -Number(r.amount)),
      0,
    );
  }, [budgetQ.data]);
  const target = goalQ.data?.target_amount ? Number(goalQ.data.target_amount) : 0;
  const pct = target > 0 ? Math.min(100, Math.round((netSaved / target) * 100)) : 0;

  const journeyQ = useQuery({
    queryKey: ["journey-tasks-goals", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("tasks")
        .select("id,title,status,module,priority,due_date")
        .eq("user_id", user!.id)
        .eq("module", "journey")
        .order("due_date", { ascending: true, nullsFirst: false });
      return data ?? [];
    },
  });
  const doneCount = (journeyQ.data ?? []).filter((t) => t.status === "done").length;
  const totalCount = (journeyQ.data ?? []).length;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="font-display text-base">Blocked account goal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {target > 0 ? (
            <>
              <div className="flex items-baseline justify-between">
                <span className="font-display text-2xl font-bold">
                  {Math.max(0, netSaved).toLocaleString()}{" "}
                  <span className="text-sm text-muted-foreground">/ {target.toLocaleString()}</span>
                </span>
                <Badge>{pct}%</Badge>
              </div>
              <Progress value={pct} />
              <p className="text-xs text-muted-foreground">
                Based on your budget income minus expenses across the app.
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Set a savings target in the Budget page to see progress here.
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="font-display text-base">Germany Journey</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {totalCount === 0 ? (
            <p className="text-sm text-muted-foreground">
              No journey tasks yet — visit the Germany Journey page to generate your roadmap.
            </p>
          ) : (
            <>
              <div className="flex items-baseline justify-between">
                <span className="font-display text-2xl font-bold">
                  {doneCount}
                  <span className="text-sm text-muted-foreground"> / {totalCount}</span>
                </span>
                <Badge>{Math.round((doneCount / totalCount) * 100)}%</Badge>
              </div>
              <Progress value={(doneCount / totalCount) * 100} />
              <div className="space-y-1 pt-2">
                {(journeyQ.data ?? [])
                  .filter((t) => t.status !== "done")
                  .slice(0, 4)
                  .map((t) => (
                    <div key={t.id} className="flex items-center gap-2 text-sm">
                      <CheckSquare className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="truncate">{t.title}</span>
                      {t.due_date && (
                        <span className="ml-auto text-xs text-muted-foreground">
                          {format(new Date(t.due_date), "MMM d")}
                        </span>
                      )}
                    </div>
                  ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ============ DEADLINES / COUNTDOWNS ============ */

function DeadlinesPanel() {
  const { user } = useAuth();
  const q = useQuery({
    queryKey: ["deadlines", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const [unis, tasks, profile] = await Promise.all([
        supabase
          .from("universities")
          .select("id,name,deadline,application_stage")
          .eq("user_id", user!.id)
          .not("deadline", "is", null),
        supabase
          .from("tasks")
          .select("id,title,due_date,priority,module")
          .eq("user_id", user!.id)
          .not("due_date", "is", null)
          .neq("status", "done"),
        supabase
          .from("profiles")
          .select("germany_target_date")
          .eq("user_id", user!.id)
          .maybeSingle(),
      ]);
      const items: { id: string; label: string; date: string; kind: string }[] = [];
      (unis.data ?? []).forEach((u) =>
        items.push({
          id: `u-${u.id}`,
          label: `${u.name} — application deadline`,
          date: u.deadline!,
          kind: "university",
        }),
      );
      (tasks.data ?? []).forEach((t) =>
        items.push({ id: `t-${t.id}`, label: t.title, date: t.due_date!, kind: t.module }),
      );
      if (profile.data?.germany_target_date)
        items.push({
          id: "target",
          label: "Depart for Germany",
          date: profile.data.germany_target_date,
          kind: "milestone",
        });
      return items.sort((a, b) => (a.date < b.date ? -1 : 1));
    },
  });

  const items = q.data ?? [];
  return (
    <div className="space-y-3">
      {items.length === 0 && (
        <EmptyState
          icon={CalendarClock}
          title="No deadlines yet"
          description="Add university deadlines or task due dates to see countdowns here."
        />
      )}
      {items.map((it) => {
        const days = differenceInDays(startOfDay(new Date(it.date)), startOfDay(new Date()));
        const tone =
          days < 0 ? "text-destructive" : days <= 7 ? "text-amber-600" : "text-emerald-600";
        return (
          <Card key={it.id} className="shadow-card">
            <CardContent className="flex items-center justify-between py-4">
              <div className="min-w-0">
                <p className="font-medium truncate">{it.label}</p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(it.date), "PPP")} · {it.kind}
                </p>
              </div>
              <div className={`text-right ${tone}`}>
                <p className="font-display text-2xl font-bold tabular-nums">{Math.abs(days)}</p>
                <p className="text-[10px] uppercase tracking-wider">
                  {days < 0 ? "days ago" : "days left"}
                </p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

/* ============ CHECKLISTS (application + document) ============ */

const APP_CHECKLIST = [
  "Shortlist 6–10 universities",
  "Register on uni-assist",
  "Prepare Europass CV",
  "Draft SOP",
  "Request 2 LORs",
  "Take IELTS / TOEFL",
  "APS certification (if required)",
  "Certified transcripts",
  "Submit applications",
  "Track admissions",
];
const DOC_CHECKLIST = [
  "Valid passport",
  "10th / 12th marksheets",
  "Bachelor transcripts (all semesters)",
  "Degree / provisional certificate",
  "APS certificate",
  "IELTS / TOEFL / German language proof",
  "Motivation letter",
  "CV",
  "2 LORs",
  "Blocked account confirmation",
  "Health insurance",
  "Visa application form",
];

function ChecklistsPanel() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <ChecklistCard
        title="Application checklist"
        storageKey="tools.checklist.app"
        items={APP_CHECKLIST}
      />
      <ChecklistCard
        title="Visa & document checklist"
        storageKey="tools.checklist.doc"
        items={DOC_CHECKLIST}
      />
    </div>
  );
}

function ChecklistCard({
  title,
  storageKey,
  items,
}: {
  title: string;
  storageKey: string;
  items: string[];
}) {
  const [checked, setChecked] = useLocalStorage<string[]>(storageKey, []);
  const set = new Set(checked);
  const pct = Math.round((set.size / items.length) * 100);
  return (
    <Card className="shadow-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="font-display text-base">{title}</CardTitle>
          <Badge variant="outline">
            {set.size}/{items.length}
          </Badge>
        </div>
        <Progress value={pct} className="mt-2" />
      </CardHeader>
      <CardContent className="space-y-2">
        {items.map((it) => {
          const on = set.has(it);
          return (
            <label
              key={it}
              className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-1.5 hover:bg-accent"
            >
              <Checkbox
                checked={on}
                onCheckedChange={(v) => {
                  const next = new Set(set);
                  if (v) next.add(it);
                  else next.delete(it);
                  setChecked(Array.from(next));
                }}
              />
              <span className={`text-sm ${on ? "line-through text-muted-foreground" : ""}`}>
                {it}
              </span>
            </label>
          );
        })}
      </CardContent>
    </Card>
  );
}
