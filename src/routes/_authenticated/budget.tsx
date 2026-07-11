import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Trash2,
  Loader2,
  Wallet,
  TrendingUp,
  TrendingDown,
  Upload,
  Download,
  Target,
} from "lucide-react";
import { toast } from "sonner";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useCurrency, type Currency } from "@/hooks/use-currency";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
import { EmptyState } from "@/components/app/EmptyState";
import { downloadCsv, fromCsv, toCsv } from "@/lib/csv";

export const Route = createFileRoute("/_authenticated/budget")({
  head: () => ({ meta: [{ title: "Budget — Abroad Compass" }] }),
  component: BudgetPage,
});

type Entry = {
  id: string;
  kind: "income" | "expense";
  category: string;
  subcategory: string | null;
  description: string | null;
  amount: number;
  currency: Currency;
  occurred_on: string;
  recurrence: "once" | "weekly" | "monthly" | "yearly";
  notes: string | null;
};

type Goal = {
  id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  currency: Currency;
  deadline: string | null;
};

const INCOME_CATS = ["Savings", "Parents", "Scholarship", "Part-time", "Loan", "Other"];
const EXPENSE_CATS = [
  "University Fee",
  "APS",
  "Visa",
  "Insurance",
  "Blocked Account",
  "Accommodation",
  "Food",
  "Transport",
  "Shopping",
  "Emergency",
  "Miscellaneous",
];
const COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#84cc16",
  "#f97316",
  "#6366f1",
  "#14b8a6",
];

function BudgetPage() {
  const { user } = useAuth();
  const { convert, format } = useCurrency();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [displayCurrency, setDisplayCurrency] = useState<Currency>("EUR");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    kind: "expense" as "income" | "expense",
    category: "Accommodation",
    subcategory: "",
    description: "",
    amount: "",
    currency: "EUR" as Currency,
    occurred_on: new Date().toISOString().slice(0, 10),
    recurrence: "once" as Entry["recurrence"],
  });
  const [goalOpen, setGoalOpen] = useState(false);
  const [goalForm, setGoalForm] = useState({
    name: "Blocked Account",
    target_amount: "11904",
    current_amount: "0",
    currency: "EUR" as Currency,
    deadline: "",
  });

  async function load() {
    if (!user) return;
    setLoading(true);
    const [e, g] = await Promise.all([
      supabase
        .from("budget_entries")
        .select("*")
        .eq("user_id", user.id)
        .order("occurred_on", { ascending: false }),
      supabase
        .from("savings_goals")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
    ]);
    setEntries((e.data ?? []) as Entry[]);
    setGoals((g.data ?? []) as Goal[]);
    setLoading(false);
  }
  useEffect(() => {
    load(); /* eslint-disable-next-line */
  }, [user]);

  const totals = useMemo(() => {
    const inc = entries
      .filter((x) => x.kind === "income")
      .reduce((s, x) => s + convert(Number(x.amount), x.currency, displayCurrency), 0);
    const exp = entries
      .filter((x) => x.kind === "expense")
      .reduce((s, x) => s + convert(Number(x.amount), x.currency, displayCurrency), 0);
    return { inc, exp, net: inc - exp };
  }, [entries, displayCurrency, convert]);

  const monthAgg = useMemo(() => {
    const byMonth = new Map<string, { month: string; income: number; expense: number }>();
    for (const e of entries) {
      const m = e.occurred_on.slice(0, 7);
      const row = byMonth.get(m) ?? { month: m, income: 0, expense: 0 };
      const v = convert(Number(e.amount), e.currency, displayCurrency);
      if (e.kind === "income") row.income += v;
      else row.expense += v;
      byMonth.set(m, row);
    }
    return Array.from(byMonth.values()).sort((a, b) => a.month.localeCompare(b.month));
  }, [entries, displayCurrency, convert]);

  const expenseByCategory = useMemo(() => {
    const m = new Map<string, number>();
    for (const e of entries.filter((x) => x.kind === "expense")) {
      const v = convert(Number(e.amount), e.currency, displayCurrency);
      m.set(e.category, (m.get(e.category) ?? 0) + v);
    }
    return Array.from(m.entries()).map(([name, value]) => ({ name, value }));
  }, [entries, displayCurrency, convert]);

  async function save() {
    if (!user) return;
    const amt = Number(form.amount);
    if (!amt || amt <= 0) {
      toast.error("Amount must be > 0");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("budget_entries").insert({
      user_id: user.id,
      kind: form.kind,
      category: form.category,
      subcategory: form.subcategory || null,
      description: form.description || null,
      amount: amt,
      currency: form.currency,
      occurred_on: form.occurred_on,
      recurrence: form.recurrence,
    });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Entry saved");
    setOpen(false);
    setForm({ ...form, amount: "", description: "", subcategory: "" });
    load();
  }

  async function remove(e: Entry) {
    await supabase.from("budget_entries").delete().eq("id", e.id);
    setEntries((arr) => arr.filter((x) => x.id !== e.id));
  }

  async function saveGoal() {
    if (!user) return;
    const t = Number(goalForm.target_amount);
    if (!goalForm.name.trim() || !t) {
      toast.error("Name and target required");
      return;
    }
    const { error } = await supabase.from("savings_goals").insert({
      user_id: user.id,
      name: goalForm.name.trim(),
      target_amount: t,
      current_amount: Number(goalForm.current_amount) || 0,
      currency: goalForm.currency,
      deadline: goalForm.deadline || null,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    setGoalOpen(false);
    load();
  }
  async function updateGoal(g: Goal, current: number) {
    await supabase.from("savings_goals").update({ current_amount: current }).eq("id", g.id);
    setGoals((arr) => arr.map((x) => (x.id === g.id ? { ...x, current_amount: current } : x)));
  }
  async function deleteGoal(g: Goal) {
    await supabase.from("savings_goals").delete().eq("id", g.id);
    setGoals((arr) => arr.filter((x) => x.id !== g.id));
  }

  function exportCsv() {
    const csv = toCsv(
      entries.map((e) => ({
        date: e.occurred_on,
        kind: e.kind,
        category: e.category,
        subcategory: e.subcategory ?? "",
        description: e.description ?? "",
        amount: e.amount,
        currency: e.currency,
        recurrence: e.recurrence,
      })),
    );
    downloadCsv("abroad-compass-budget.csv", csv);
  }

  async function importCsv(file: File) {
    if (!user) return;
    const text = await file.text();
    const rows = fromCsv(text);
    if (rows.length === 0) {
      toast.error("Empty CSV");
      return;
    }
    const payload = rows.map((r) => ({
      user_id: user.id,
      kind: (r.kind === "income" ? "income" : "expense") as "income" | "expense",
      category: r.category || "Miscellaneous",
      subcategory: r.subcategory || null,
      description: r.description || null,
      amount: Number(r.amount) || 0,
      currency: (["INR", "EUR", "USD"].includes(r.currency) ? r.currency : "EUR") as Currency,
      occurred_on: r.date || new Date().toISOString().slice(0, 10),
      recurrence: (["once", "weekly", "monthly", "yearly"].includes(r.recurrence)
        ? r.recurrence
        : "once") as Entry["recurrence"],
    }));
    const { error } = await supabase.from("budget_entries").insert(payload);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Imported ${payload.length} entries`);
    load();
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Budget</p>
          <h1 className="font-display text-3xl font-bold tracking-tight">Money toward Germany</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={displayCurrency} onValueChange={(v) => setDisplayCurrency(v as Currency)}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="EUR">EUR</SelectItem>
              <SelectItem value="INR">INR</SelectItem>
              <SelectItem value="USD">USD</SelectItem>
            </SelectContent>
          </Select>
          <label className="cursor-pointer">
            <input
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && importCsv(e.target.files[0])}
            />
            <span className="inline-flex h-9 items-center gap-2 rounded-md border bg-background px-3 text-sm font-medium shadow-sm hover:bg-accent">
              <Upload className="h-3.5 w-3.5" />
              Import
            </span>
          </label>
          <Button variant="outline" size="sm" onClick={exportCsv}>
            <Download className="mr-1.5 h-3.5 w-3.5" />
            Export
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New entry
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add a {form.kind}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 pt-2">
                <Tabs
                  value={form.kind}
                  onValueChange={(v) =>
                    setForm({
                      ...form,
                      kind: v as "income" | "expense",
                      category: v === "income" ? "Savings" : "Accommodation",
                    })
                  }
                >
                  <TabsList className="w-full">
                    <TabsTrigger value="expense" className="flex-1">
                      Expense
                    </TabsTrigger>
                    <TabsTrigger value="income" className="flex-1">
                      Income
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Category">
                    <Select
                      value={form.category}
                      onValueChange={(v) => setForm({ ...form, category: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(form.kind === "income" ? INCOME_CATS : EXPENSE_CATS).map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Subcategory">
                    <Input
                      value={form.subcategory}
                      onChange={(e) => setForm({ ...form, subcategory: e.target.value })}
                    />
                  </Field>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <Field label="Amount">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.amount}
                      onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    />
                  </Field>
                  <Field label="Currency">
                    <Select
                      value={form.currency}
                      onValueChange={(v) => setForm({ ...form, currency: v as Currency })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(["EUR", "INR", "USD"] as Currency[]).map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Recurrence">
                    <Select
                      value={form.recurrence}
                      onValueChange={(v) =>
                        setForm({ ...form, recurrence: v as Entry["recurrence"] })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(["once", "weekly", "monthly", "yearly"] as const).map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
                <Field label="Date">
                  <Input
                    type="date"
                    value={form.occurred_on}
                    onChange={(e) => setForm({ ...form, occurred_on: e.target.value })}
                  />
                </Field>
                <Field label="Description">
                  <Input
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="optional"
                  />
                </Field>
                <div className="flex justify-end gap-2 pt-1">
                  <Button variant="ghost" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={save} disabled={saving}>
                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <div className="grid gap-3 md:grid-cols-3">
        <StatCard
          icon={TrendingUp}
          label="Income"
          value={format(totals.inc, displayCurrency)}
          tone="text-emerald-600"
        />
        <StatCard
          icon={TrendingDown}
          label="Expenses"
          value={format(totals.exp, displayCurrency)}
          tone="text-rose-600"
        />
        <StatCard
          icon={Wallet}
          label="Projected balance"
          value={format(totals.net, displayCurrency)}
          tone={totals.net >= 0 ? "text-emerald-600" : "text-rose-600"}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="shadow-card">
          <CardContent className="space-y-3 p-5">
            <div className="flex items-center justify-between">
              <p className="font-display text-base font-semibold">Monthly trend</p>
              <Badge variant="secondary">{displayCurrency}</Badge>
            </div>
            {monthAgg.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Add entries to see your trend.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={monthAgg}>
                  <defs>
                    <linearGradient id="bg-i" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="bg-e" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                  <Area type="monotone" dataKey="income" stroke="#10b981" fill="url(#bg-i)" />
                  <Area type="monotone" dataKey="expense" stroke="#ef4444" fill="url(#bg-e)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="space-y-3 p-5">
            <p className="font-display text-base font-semibold">Expenses by category</p>
            {expenseByCategory.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No expenses yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={expenseByCategory}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={2}
                  >
                    {expenseByCategory.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: 8, fontSize: 12 }}
                    formatter={(v: number) => format(v, displayCurrency)}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-card">
        <CardContent className="space-y-3 p-5">
          <div className="flex items-center justify-between">
            <p className="font-display text-base font-semibold">Savings goals</p>
            <Dialog open={goalOpen} onOpenChange={setGoalOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <Target className="mr-1.5 h-3.5 w-3.5" />
                  New goal
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create a savings goal</DialogTitle>
                </DialogHeader>
                <div className="space-y-3 pt-2">
                  <Field label="Name">
                    <Input
                      value={goalForm.name}
                      onChange={(e) => setGoalForm({ ...goalForm, name: e.target.value })}
                    />
                  </Field>
                  <div className="grid grid-cols-3 gap-3">
                    <Field label="Target">
                      <Input
                        type="number"
                        value={goalForm.target_amount}
                        onChange={(e) =>
                          setGoalForm({ ...goalForm, target_amount: e.target.value })
                        }
                      />
                    </Field>
                    <Field label="Saved">
                      <Input
                        type="number"
                        value={goalForm.current_amount}
                        onChange={(e) =>
                          setGoalForm({ ...goalForm, current_amount: e.target.value })
                        }
                      />
                    </Field>
                    <Field label="Currency">
                      <Select
                        value={goalForm.currency}
                        onValueChange={(v) => setGoalForm({ ...goalForm, currency: v as Currency })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(["EUR", "INR", "USD"] as Currency[]).map((c) => (
                            <SelectItem key={c} value={c}>
                              {c}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                  </div>
                  <Field label="Deadline">
                    <Input
                      type="date"
                      value={goalForm.deadline}
                      onChange={(e) => setGoalForm({ ...goalForm, deadline: e.target.value })}
                    />
                  </Field>
                  <div className="flex justify-end gap-2 pt-1">
                    <Button variant="ghost" onClick={() => setGoalOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={saveGoal}>Save</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          {goals.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No goals yet. Try a Blocked Account goal of €11,904.
            </p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {goals.map((g) => {
                const pct = Math.min(
                  100,
                  Math.round(
                    (Number(g.current_amount) / Math.max(1, Number(g.target_amount))) * 100,
                  ),
                );
                return (
                  <div key={g.id} className="rounded-lg border p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium">{g.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(Number(g.current_amount), g.currency)} of{" "}
                          {format(Number(g.target_amount), g.currency)}
                          {g.deadline && ` · by ${new Date(g.deadline).toLocaleDateString()}`}
                        </p>
                      </div>
                      <button
                        onClick={() => deleteGoal(g)}
                        className="text-muted-foreground hover:text-destructive"
                        aria-label="Delete goal"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <Progress value={pct} className="mt-3" />
                    <div className="mt-2 flex items-center gap-2">
                      <Input
                        type="number"
                        defaultValue={g.current_amount}
                        onBlur={(e) => updateGoal(g, Number(e.target.value))}
                        className="h-8"
                      />
                      <Badge variant="secondary">{pct}%</Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardContent className="space-y-2 p-5">
          <p className="font-display text-base font-semibold">Recent entries</p>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : entries.length === 0 ? (
            <EmptyState
              icon={Wallet}
              title="No entries yet"
              description="Track tuition, blocked account, rent and parents' support all in one place."
            />
          ) : (
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-muted-foreground">
                    <th className="px-2 py-2">Date</th>
                    <th>Type</th>
                    <th>Category</th>
                    <th>Description</th>
                    <th className="text-right">Amount</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence initial={false}>
                    {entries.slice(0, 50).map((e) => (
                      <motion.tr
                        key={e.id}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="border-t"
                      >
                        <td className="px-2 py-2 text-muted-foreground">
                          {new Date(e.occurred_on).toLocaleDateString()}
                        </td>
                        <td>
                          <Badge variant={e.kind === "income" ? "secondary" : "outline"}>
                            {e.kind}
                          </Badge>
                        </td>
                        <td>
                          {e.category}
                          {e.subcategory && (
                            <span className="text-xs text-muted-foreground">
                              {" "}
                              · {e.subcategory}
                            </span>
                          )}
                        </td>
                        <td className="text-muted-foreground">{e.description}</td>
                        <td
                          className={`text-right tabular-nums ${e.kind === "income" ? "text-emerald-600" : "text-rose-600"}`}
                        >
                          {e.kind === "income" ? "+" : "−"}
                          {format(Number(e.amount), e.currency)}
                        </td>
                        <td className="text-right">
                          <button
                            onClick={() => remove(e)}
                            className="text-muted-foreground hover:text-destructive"
                            aria-label="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Wallet;
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <Card className="shadow-card">
      <CardContent className="flex items-center gap-3 p-5">
        <div className={`grid h-10 w-10 place-items-center rounded-md bg-muted ${tone}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="font-display text-xl font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
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
