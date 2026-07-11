import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Circle, Plus, Loader2, Trash2, Calendar, Trophy } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { DocumentVault } from "@/components/app/DocumentVault";

export const Route = createFileRoute("/_authenticated/germany-journey")({
  head: () => ({ meta: [{ title: "Germany Journey — Abroad Compass" }] }),
  component: JourneyPage,
});

type Task = {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  priority: "low" | "medium" | "high" | "urgent";
  status: "todo" | "in_progress" | "done" | "blocked";
  module: string;
};

type Phase = {
  key: string;
  title: string;
  description: string;
  seed: { title: string; priority: Task["priority"] }[];
};

const PHASES: Phase[] = [
  {
    key: "prep",
    title: "Preparation",
    description: "Profile + language + APS basics.",
    seed: [
      { title: "Decide target intake (Winter / Summer)", priority: "high" },
      { title: "Reach A2 German", priority: "medium" },
      { title: "Take IELTS / TOEFL", priority: "high" },
      { title: "Start APS process", priority: "urgent" },
    ],
  },
  {
    key: "applications",
    title: "Applications",
    description: "Shortlist, SOP, LOR, submissions.",
    seed: [
      { title: "Shortlist 8–10 universities", priority: "high" },
      { title: "Draft SOP", priority: "high" },
      { title: "Request 2× LORs", priority: "medium" },
      { title: "Submit via uni-assist / direct portals", priority: "urgent" },
    ],
  },
  {
    key: "visa",
    title: "Visa",
    description: "Blocked account, insurance, embassy appointment.",
    seed: [
      { title: "Open blocked account (€11,904)", priority: "urgent" },
      { title: "Travel + health insurance", priority: "high" },
      { title: "Book embassy appointment", priority: "urgent" },
      { title: "Visa interview prep", priority: "high" },
    ],
  },
  {
    key: "pre_arrival",
    title: "Pre-arrival",
    description: "Flights, accommodation, packing.",
    seed: [
      { title: "Book flight", priority: "high" },
      { title: "Find first-month accommodation", priority: "urgent" },
      { title: "Forex card + travel insurance", priority: "medium" },
      { title: "Pack essentials list", priority: "low" },
    ],
  },
  {
    key: "arrival",
    title: "Arrival",
    description: "Anmeldung, bank, insurance, enrolment.",
    seed: [
      { title: "Anmeldung (city registration)", priority: "urgent" },
      { title: "Open German bank account", priority: "high" },
      { title: "Public health insurance switch", priority: "high" },
      { title: "University enrolment & semester ticket", priority: "high" },
    ],
  },
];

const PRIO_TONE: Record<Task["priority"], string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
  high: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  urgent: "bg-rose-500/15 text-rose-700 dark:text-rose-300",
};

function JourneyPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<string>("prep");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    priority: "medium" as Task["priority"],
    due_date: "",
  });

  async function load() {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("tasks")
      .select("id, title, description, due_date, priority, status, module")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });
    setTasks((data ?? []) as Task[]);
    setLoading(false);
  }
  useEffect(() => {
    load(); /* eslint-disable-next-line */
  }, [user]);

  async function seedPhase(p: Phase) {
    if (!user) return;
    const have = new Set(tasks.filter((t) => t.module === `journey:${p.key}`).map((t) => t.title));
    const toInsert = p.seed
      .filter((s) => !have.has(s.title))
      .map((s) => ({
        user_id: user.id,
        title: s.title,
        priority: s.priority,
        status: "todo" as const,
        module: `journey:${p.key}`,
      }));
    if (!toInsert.length) {
      toast.info("Phase already seeded");
      return;
    }
    const { error } = await supabase.from("tasks").insert(toInsert);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Added ${toInsert.length} tasks`);
    load();
  }

  async function toggle(t: Task) {
    const next = t.status === "done" ? "todo" : "done";
    await supabase.from("tasks").update({ status: next }).eq("id", t.id);
    setTasks((arr) => arr.map((x) => (x.id === t.id ? { ...x, status: next } : x)));
  }
  async function remove(t: Task) {
    await supabase.from("tasks").delete().eq("id", t.id);
    setTasks((arr) => arr.filter((x) => x.id !== t.id));
  }
  async function addTask() {
    if (!user || !form.title.trim()) {
      toast.error("Title required");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("tasks").insert({
      user_id: user.id,
      title: form.title.trim(),
      priority: form.priority,
      due_date: form.due_date || null,
      module: `journey:${phase}`,
      status: "todo",
    });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setOpen(false);
    setForm({ title: "", priority: "medium", due_date: "" });
    load();
  }

  const grouped = useMemo(() => {
    const m = new Map<string, Task[]>();
    for (const t of tasks) {
      if (!t.module.startsWith("journey:")) continue;
      const key = t.module.split(":")[1];
      const list = m.get(key) ?? [];
      list.push(t);
      m.set(key, list);
    }
    return m;
  }, [tasks]);

  const overall = useMemo(() => {
    const all = tasks.filter((t) => t.module.startsWith("journey:"));
    if (all.length === 0) return 0;
    return Math.round((all.filter((t) => t.status === "done").length / all.length) * 100);
  }, [tasks]);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Germany Journey</p>
          <h1 className="font-display text-3xl font-bold tracking-tight">
            Your end-to-end roadmap
          </h1>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add task
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add a task</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 pt-2">
              <Field label="Title">
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </Field>
              <div className="grid grid-cols-3 gap-3">
                <Field label="Phase">
                  <Select value={phase} onValueChange={setPhase}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PHASES.map((p) => (
                        <SelectItem key={p.key} value={p.key}>
                          {p.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Priority">
                  <Select
                    value={form.priority}
                    onValueChange={(v) => setForm({ ...form, priority: v as Task["priority"] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(["low", "medium", "high", "urgent"] as const).map((p) => (
                        <SelectItem key={p} value={p}>
                          {p}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Due">
                  <Input
                    type="date"
                    value={form.due_date}
                    onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                  />
                </Field>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <Button variant="ghost" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={addTask} disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </header>

      <Card className="shadow-card">
        <CardContent className="space-y-2 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Overall progress</p>
              <p className="font-display text-2xl font-bold">{overall}%</p>
            </div>
            <Trophy className="h-6 w-6 text-amber-500" />
          </div>
          <Progress value={overall} />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : (
            PHASES.map((p, idx) => {
              const items = grouped.get(p.key) ?? [];
              const done = items.filter((t) => t.status === "done").length;
              const pct = items.length === 0 ? 0 : Math.round((done / items.length) * 100);
              return (
                <motion.div
                  key={p.key}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                >
                  <Card className="shadow-card">
                    <CardContent className="space-y-3 p-5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="font-display text-base font-semibold">{p.title}</p>
                          <p className="text-xs text-muted-foreground">{p.description}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">
                            {done}/{items.length}
                          </Badge>
                          <Button size="sm" variant="outline" onClick={() => seedPhase(p)}>
                            Use template
                          </Button>
                        </div>
                      </div>
                      <Progress value={pct} />
                      {items.length === 0 ? (
                        <p className="text-xs text-muted-foreground">
                          No tasks yet. Click <strong>Use template</strong> to seed this phase.
                        </p>
                      ) : (
                        <ul className="space-y-1.5">
                          {items.map((t) => (
                            <li
                              key={t.id}
                              className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/50"
                            >
                              <button
                                onClick={() => toggle(t)}
                                aria-label="Toggle done"
                                className="text-muted-foreground hover:text-foreground"
                              >
                                {t.status === "done" ? (
                                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                ) : (
                                  <Circle className="h-4 w-4" />
                                )}
                              </button>
                              <span
                                className={`flex-1 text-sm ${t.status === "done" ? "line-through text-muted-foreground" : ""}`}
                              >
                                {t.title}
                              </span>
                              {t.due_date && (
                                <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                                  <Calendar className="h-3 w-3" />
                                  {new Date(t.due_date).toLocaleDateString()}
                                </span>
                              )}
                              <Badge
                                className={`text-[10px] ${PRIO_TONE[t.priority]}`}
                                variant="secondary"
                              >
                                {t.priority}
                              </Badge>
                              <button
                                onClick={() => remove(t)}
                                className="text-muted-foreground hover:text-destructive"
                                aria-label="Delete"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })
          )}
        </div>
        <Card className="shadow-card lg:sticky lg:top-20 h-fit">
          <CardContent className="space-y-3 p-5">
            <DocumentVault />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}
