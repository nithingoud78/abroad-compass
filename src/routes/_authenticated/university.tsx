import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  Star,
  Pin,
  Trash2,
  Edit3,
  Loader2,
  Download,
  Upload,
  GitCompare,
  ExternalLink,
  Sparkles,
  Filter,
  ArrowUpDown,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
import { UniversityCompare } from "@/components/app/UniversityCompare";
import { AcceptanceDialog } from "@/components/app/AcceptanceDialog";
import type { Database } from "@/integrations/supabase/types";

export const Route = createFileRoute("/_authenticated/university")({
  head: () => ({ meta: [{ title: "University Shortlisting — Abroad Compass" }] }),
  component: UniversityPage,
});

type University = Database["public"]["Tables"]["universities"]["Row"];
type Insert = Database["public"]["Tables"]["universities"]["Insert"];

const STATUS_TONE: Record<string, string> = {
  planning: "bg-muted text-foreground",
  preparing: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  applied: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
  accepted: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  rejected: "bg-rose-500/15 text-rose-700 dark:text-rose-300",
  waitlisted: "bg-purple-500/15 text-purple-700 dark:text-purple-300",
  withdrawn: "bg-muted text-muted-foreground line-through",
};

const PRIORITY_TONE: Record<string, string> = {
  high: "bg-rose-500/15 text-rose-700 dark:text-rose-300",
  medium: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  low: "bg-muted text-muted-foreground",
};

const EMPTY_FORM = {
  name: "",
  country: "Germany",
  state: "",
  city: "",
  qs_ranking: "",
  course: "",
  course_duration_months: "",
  ects_required: "",
  cgpa_required: "",
  english_requirement: "",
  german_requirement: "",
  application_fee_eur: "",
  tuition_fee_eur: "",
  semester_fee_eur: "",
  living_cost_eur: "",
  estimated_earnings_eur: "",
  public_private: "Public",
  internship: false,
  part_time: false,
  scholarship: false,
  aps_required: true,
  uni_assist: false,
  winter: true,
  summer: false,
  deadline: "",
  website: "",
  notes: "",
  application_status: "planning",
  priority: "medium",
  required_subjects: "",
};

type FormState = typeof EMPTY_FORM;

function toFormState(u: University): FormState {
  return {
    name: u.name,
    country: u.country ?? "Germany",
    state: u.state ?? "",
    city: u.city ?? "",
    qs_ranking: u.qs_ranking?.toString() ?? "",
    course: u.course ?? "",
    course_duration_months: u.course_duration_months?.toString() ?? "",
    ects_required: u.ects_required?.toString() ?? "",
    cgpa_required: u.cgpa_required?.toString() ?? "",
    english_requirement: u.english_requirement ?? "",
    german_requirement: u.german_requirement ?? "",
    application_fee_eur: u.application_fee_eur?.toString() ?? "",
    tuition_fee_eur: u.tuition_fee_eur?.toString() ?? "",
    semester_fee_eur: u.semester_fee_eur?.toString() ?? "",
    living_cost_eur: u.living_cost_eur?.toString() ?? "",
    estimated_earnings_eur: u.estimated_earnings_eur?.toString() ?? "",
    public_private: u.public_private ?? "Public",
    internship: !!u.internship,
    part_time: !!u.part_time,
    scholarship: !!u.scholarship,
    aps_required: u.aps_required ?? true,
    uni_assist: !!u.uni_assist,
    winter: u.winter ?? true,
    summer: !!u.summer,
    deadline: u.deadline ?? "",
    website: u.website ?? "",
    notes: u.notes ?? "",
    application_status: u.application_status ?? "planning",
    priority: u.priority ?? "medium",
    required_subjects: (u.required_subjects ?? []).join(", "),
  };
}

function fromFormState(f: FormState, userId: string): Insert {
  const num = (v: string) => (v.trim() === "" ? null : Number(v));
  return {
    user_id: userId,
    name: f.name.trim(),
    country: f.country || null,
    state: f.state || null,
    city: f.city || null,
    qs_ranking: num(f.qs_ranking),
    course: f.course || null,
    course_duration_months: num(f.course_duration_months),
    ects_required: num(f.ects_required),
    cgpa_required: num(f.cgpa_required),
    english_requirement: f.english_requirement || null,
    german_requirement: f.german_requirement || null,
    application_fee_eur: num(f.application_fee_eur),
    tuition_fee_eur: num(f.tuition_fee_eur),
    semester_fee_eur: num(f.semester_fee_eur),
    living_cost_eur: num(f.living_cost_eur),
    estimated_earnings_eur: num(f.estimated_earnings_eur),
    public_private: f.public_private,
    internship: f.internship,
    part_time: f.part_time,
    scholarship: f.scholarship,
    aps_required: f.aps_required,
    uni_assist: f.uni_assist,
    winter: f.winter,
    summer: f.summer,
    deadline: f.deadline || null,
    website: f.website || null,
    notes: f.notes || null,
    application_status: f.application_status,
    priority: f.priority,
    required_subjects: f.required_subjects
      ? f.required_subjects
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : null,
  };
}

type SortKey = "name" | "qs_ranking" | "tuition_fee_eur" | "deadline" | "priority";

function UniversityPage() {
  const { user } = useAuth();
  const fileInput = useRef<HTMLInputElement>(null);

  const [rows, setRows] = useState<University[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [country, setCountry] = useState<string>("all");
  const [pinnedOnly, setPinnedOnly] = useState(false);
  const [favOnly, setFavOnly] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [compareOpen, setCompareOpen] = useState(false);
  const [acceptanceFor, setAcceptanceFor] = useState<University | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<University | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  async function load() {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase.from("universities").select("*").eq("user_id", user.id);
    if (error) toast.error(error.message);
    setRows(data ?? []);
    setLoading(false);
  }
  useEffect(() => {
    load(); /* eslint-disable-next-line */
  }, [user]);

  const filtered = useMemo(() => {
    let arr = rows.slice();
    if (status !== "all") arr = arr.filter((r) => r.application_status === status);
    if (country !== "all") arr = arr.filter((r) => r.country === country);
    if (pinnedOnly) arr = arr.filter((r) => r.pinned);
    if (favOnly) arr = arr.filter((r) => r.favourite);
    if (q) {
      const k = q.toLowerCase();
      arr = arr.filter((r) =>
        `${r.name} ${r.course ?? ""} ${r.city ?? ""} ${r.country ?? ""}`.toLowerCase().includes(k),
      );
    }
    arr.sort((a, b) => {
      // Pinned float to top regardless of sort.
      if (!!a.pinned !== !!b.pinned) return a.pinned ? -1 : 1;
      const av = a[sortKey];
      const bv = b[sortKey];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      const cmp =
        typeof av === "number" && typeof bv === "number"
          ? av - bv
          : String(av).localeCompare(String(bv));
      return sortDir === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [rows, status, country, pinnedOnly, favOnly, q, sortKey, sortDir]);

  const countries = useMemo(
    () => Array.from(new Set(rows.map((r) => r.country).filter(Boolean))) as string[],
    [rows],
  );

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }
  function openEdit(u: University) {
    setEditing(u);
    setForm(toFormState(u));
    setDialogOpen(true);
  }
  async function save() {
    if (!user) return;
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    setSaving(true);
    const payload = fromFormState(form, user.id);
    const op = editing
      ? supabase.from("universities").update(payload).eq("id", editing.id)
      : supabase.from("universities").insert(payload);
    const { error } = await op;
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(editing ? "University updated" : "University added");
    setDialogOpen(false);
    load();
  }
  async function patch(id: string, partial: Partial<University>) {
    setRows((cur) => cur.map((r) => (r.id === id ? { ...r, ...partial } : r)));
    const { error } = await supabase.from("universities").update(partial).eq("id", id);
    if (error) {
      toast.error(error.message);
      load();
    }
  }
  async function remove(u: University) {
    if (!confirm(`Remove ${u.name}?`)) return;
    setRows((cur) => cur.filter((r) => r.id !== u.id));
    setSelected((s) => {
      const n = new Set(s);
      n.delete(u.id);
      return n;
    });
    await supabase.from("universities").delete().eq("id", u.id);
  }

  function toggleSelect(id: string) {
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  // ---- CSV ----
  function exportCsv() {
    const cols: (keyof University)[] = [
      "name",
      "country",
      "state",
      "city",
      "qs_ranking",
      "course",
      "course_duration_months",
      "ects_required",
      "cgpa_required",
      "english_requirement",
      "german_requirement",
      "application_fee_eur",
      "tuition_fee_eur",
      "semester_fee_eur",
      "living_cost_eur",
      "estimated_earnings_eur",
      "public_private",
      "internship",
      "part_time",
      "scholarship",
      "aps_required",
      "uni_assist",
      "winter",
      "summer",
      "deadline",
      "website",
      "application_status",
      "priority",
      "notes",
    ];
    const esc = (v: unknown) => {
      if (v == null) return "";
      const s = String(v).replace(/"/g, '""');
      return /[,"\n]/.test(s) ? `"${s}"` : s;
    };
    const lines = [cols.join(",")];
    rows.forEach((r) => lines.push(cols.map((c) => esc(r[c])).join(",")));
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `universities-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
  async function importCsv(file: File) {
    if (!user) return;
    const text = await file.text();
    const lines = text.trim().split(/\r?\n/);
    if (lines.length < 2) {
      toast.error("CSV is empty");
      return;
    }
    const header = parseCsvLine(lines[0]);
    const records: Insert[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cells = parseCsvLine(lines[i]);
      const obj: Record<string, string> = {};
      header.forEach((h, idx) => {
        obj[h] = cells[idx] ?? "";
      });
      if (!obj.name) continue;
      const f: FormState = { ...EMPTY_FORM };
      (Object.keys(EMPTY_FORM) as (keyof FormState)[]).forEach((k) => {
        const v = obj[k as string];
        if (v == null) return;
        if (typeof EMPTY_FORM[k] === "boolean") {
          (f as Record<string, unknown>)[k] = /^(true|yes|1)$/i.test(v);
        } else {
          (f as Record<string, unknown>)[k] = v;
        }
      });
      records.push(fromFormState(f, user.id));
    }
    if (records.length === 0) {
      toast.error("No rows to import");
      return;
    }
    const { error } = await supabase.from("universities").insert(records);
    if (error) toast.error(error.message);
    else toast.success(`Imported ${records.length} universities`);
    load();
  }

  const selectedRows = filtered.filter((r) => selected.has(r.id));

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">University Shortlisting</p>
          <h1 className="font-display text-3xl font-bold tracking-tight">Your target programs</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={exportCsv} disabled={rows.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <input
            ref={fileInput}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) importCsv(f);
              e.target.value = "";
            }}
          />
          <Button variant="outline" size="sm" onClick={() => fileInput.current?.click()}>
            <Upload className="mr-2 h-4 w-4" />
            Import CSV
          </Button>
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Add university
          </Button>
        </div>
      </header>

      <Card className="shadow-card">
        <CardContent className="flex flex-wrap items-center gap-3 p-4">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search universities, courses, cities…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All status</SelectItem>
                {[
                  "planning",
                  "preparing",
                  "applied",
                  "accepted",
                  "rejected",
                  "waitlisted",
                  "withdrawn",
                ].map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {countries.length > 1 && (
              <Select value={country} onValueChange={setCountry}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All countries</SelectItem>
                  {countries.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="qs_ranking">QS Ranking</SelectItem>
                <SelectItem value="tuition_fee_eur">Tuition</SelectItem>
                <SelectItem value="deadline">Deadline</SelectItem>
                <SelectItem value="priority">Priority</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
            >
              {sortDir === "asc" ? "↑" : "↓"}
            </Button>
          </div>
          <Button
            variant={pinnedOnly ? "default" : "outline"}
            size="sm"
            onClick={() => setPinnedOnly((v) => !v)}
          >
            <Pin className="mr-2 h-4 w-4" />
            Pinned
          </Button>
          <Button
            variant={favOnly ? "default" : "outline"}
            size="sm"
            onClick={() => setFavOnly((v) => !v)}
          >
            <Star className="mr-2 h-4 w-4" />
            Favourite
          </Button>
        </CardContent>
      </Card>

      <AnimatePresence>
        {selected.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="sticky top-16 z-20"
          >
            <Card className="shadow-elegant border-brand/40">
              <CardContent className="flex flex-wrap items-center justify-between gap-3 p-3">
                <span className="text-sm font-medium">{selected.size} selected</span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => setCompareOpen(true)}
                    disabled={selected.size < 2}
                  >
                    <GitCompare className="mr-2 h-4 w-4" />
                    Compare
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>
                    Clear
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <Card className="shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="w-10 p-3"></th>
                <th className="w-8 p-3"></th>
                <th className="p-3 text-left">University</th>
                <th className="p-3 text-left">Course</th>
                <th className="p-3 text-left">QS</th>
                <th className="p-3 text-left">CGPA</th>
                <th className="p-3 text-left">German</th>
                <th className="p-3 text-left">Tuition / yr</th>
                <th className="p-3 text-left">Deadline</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Priority</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={12} className="p-10 text-center text-muted-foreground">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={12} className="p-10 text-center text-muted-foreground">
                    No universities yet. Click <span className="font-medium">Add university</span>{" "}
                    to start your shortlist.
                  </td>
                </tr>
              ) : (
                filtered.map((u) => (
                  <motion.tr
                    key={u.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="border-t hover:bg-muted/30"
                  >
                    <td className="p-3">
                      <Checkbox
                        checked={selected.has(u.id)}
                        onCheckedChange={() => toggleSelect(u.id)}
                      />
                    </td>
                    <td className="p-3">
                      <div className="flex flex-col items-center gap-1">
                        <button
                          onClick={() => patch(u.id, { pinned: !u.pinned })}
                          title="Pin"
                          className={
                            u.pinned ? "text-brand" : "text-muted-foreground hover:text-foreground"
                          }
                        >
                          <Pin className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => patch(u.id, { favourite: !u.favourite })}
                          title="Favourite"
                          className={
                            u.favourite
                              ? "text-amber-500"
                              : "text-muted-foreground hover:text-foreground"
                          }
                        >
                          <Star
                            className="h-3.5 w-3.5"
                            fill={u.favourite ? "currentColor" : "none"}
                          />
                        </button>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="font-display font-semibold">{u.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {[u.city, u.country].filter(Boolean).join(", ")}
                      </div>
                    </td>
                    <td className="p-3 max-w-[14rem] truncate">{u.course ?? "—"}</td>
                    <td className="p-3">{u.qs_ranking ?? "—"}</td>
                    <td className="p-3">{u.cgpa_required ?? "—"}</td>
                    <td className="p-3">{u.german_requirement ?? "—"}</td>
                    <td className="p-3">
                      {u.tuition_fee_eur != null
                        ? `€${Number(u.tuition_fee_eur).toLocaleString()}`
                        : "—"}
                    </td>
                    <td className="p-3">
                      {u.deadline ? new Date(u.deadline).toLocaleDateString() : "—"}
                    </td>
                    <td className="p-3">
                      <Select
                        value={u.application_status ?? "planning"}
                        onValueChange={(v) => patch(u.id, { application_status: v })}
                      >
                        <SelectTrigger
                          className={`h-7 px-2 text-xs ${STATUS_TONE[u.application_status ?? "planning"]}`}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.keys(STATUS_TONE).map((s) => (
                            <SelectItem key={s} value={s}>
                              {s}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="p-3">
                      <Badge variant="outline" className={PRIORITY_TONE[u.priority ?? "medium"]}>
                        {u.priority ?? "medium"}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setAcceptanceFor(u)}
                          title="Acceptance chance"
                          className="grid h-7 w-7 place-items-center rounded-md hover:bg-muted"
                        >
                          <Sparkles className="h-3.5 w-3.5 text-brand" />
                        </button>
                        {u.website && (
                          <a
                            href={u.website}
                            target="_blank"
                            rel="noreferrer"
                            title="Website"
                            className="grid h-7 w-7 place-items-center rounded-md hover:bg-muted"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        )}
                        <button
                          onClick={() => openEdit(u)}
                          title="Edit"
                          className="grid h-7 w-7 place-items-center rounded-md hover:bg-muted"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => remove(u)}
                          title="Delete"
                          className="grid h-7 w-7 place-items-center rounded-md text-destructive hover:bg-muted"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <span />
        </DialogTrigger>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              {editing ? "Edit university" : "Add university"}
            </DialogTitle>
          </DialogHeader>
          <UniversityForm form={form} setForm={setForm} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <UniversityCompare
        open={compareOpen}
        onOpenChange={setCompareOpen}
        universities={selectedRows}
      />
      <AcceptanceDialog
        open={!!acceptanceFor}
        onOpenChange={(o) => !o && setAcceptanceFor(null)}
        university={acceptanceFor}
      />
    </div>
  );
}

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQ) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (ch === '"') inQ = false;
      else cur += ch;
    } else {
      if (ch === ",") {
        out.push(cur);
        cur = "";
      } else if (ch === '"') inQ = true;
      else cur += ch;
    }
  }
  out.push(cur);
  return out;
}

function UniversityForm({ form, setForm }: { form: FormState; setForm: (f: FormState) => void }) {
  const set = (k: keyof FormState, v: string | boolean) => setForm({ ...form, [k]: v });
  return (
    <div className="space-y-4 pt-2">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="University name *">
          <Input value={form.name} onChange={(e) => set("name", e.target.value)} />
        </Field>
        <Field label="Course">
          <Input value={form.course} onChange={(e) => set("course", e.target.value)} />
        </Field>
        <Field label="Country">
          <Input value={form.country} onChange={(e) => set("country", e.target.value)} />
        </Field>
        <Field label="State">
          <Input value={form.state} onChange={(e) => set("state", e.target.value)} />
        </Field>
        <Field label="City">
          <Input value={form.city} onChange={(e) => set("city", e.target.value)} />
        </Field>
        <Field label="QS Ranking">
          <Input
            type="number"
            value={form.qs_ranking}
            onChange={(e) => set("qs_ranking", e.target.value)}
          />
        </Field>
        <Field label="Duration (months)">
          <Input
            type="number"
            value={form.course_duration_months}
            onChange={(e) => set("course_duration_months", e.target.value)}
          />
        </Field>
        <Field label="ECTS required">
          <Input
            type="number"
            value={form.ects_required}
            onChange={(e) => set("ects_required", e.target.value)}
          />
        </Field>
        <Field label="CGPA required">
          <Input
            type="number"
            step="0.01"
            value={form.cgpa_required}
            onChange={(e) => set("cgpa_required", e.target.value)}
          />
        </Field>
        <Field label="English requirement">
          <Input
            placeholder="IELTS 6.5"
            value={form.english_requirement}
            onChange={(e) => set("english_requirement", e.target.value)}
          />
        </Field>
        <Field label="German requirement">
          <Input
            placeholder="B2"
            value={form.german_requirement}
            onChange={(e) => set("german_requirement", e.target.value)}
          />
        </Field>
        <Field label="Tuition fee / yr (€)">
          <Input
            type="number"
            value={form.tuition_fee_eur}
            onChange={(e) => set("tuition_fee_eur", e.target.value)}
          />
        </Field>
        <Field label="Semester fee (€)">
          <Input
            type="number"
            value={form.semester_fee_eur}
            onChange={(e) => set("semester_fee_eur", e.target.value)}
          />
        </Field>
        <Field label="Application fee (€)">
          <Input
            type="number"
            value={form.application_fee_eur}
            onChange={(e) => set("application_fee_eur", e.target.value)}
          />
        </Field>
        <Field label="Living cost / mo (€)">
          <Input
            type="number"
            value={form.living_cost_eur}
            onChange={(e) => set("living_cost_eur", e.target.value)}
          />
        </Field>
        <Field label="Est. earnings / mo (€)">
          <Input
            type="number"
            value={form.estimated_earnings_eur}
            onChange={(e) => set("estimated_earnings_eur", e.target.value)}
          />
        </Field>
        <Field label="Type">
          <Select value={form.public_private} onValueChange={(v) => set("public_private", v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Public">Public</SelectItem>
              <SelectItem value="Private">Private</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Status">
          <Select
            value={form.application_status}
            onValueChange={(v) => set("application_status", v)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.keys(STATUS_TONE).map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Priority">
          <Select value={form.priority} onValueChange={(v) => set("priority", v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["high", "medium", "low"].map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Deadline">
          <Input
            type="date"
            value={form.deadline}
            onChange={(e) => set("deadline", e.target.value)}
          />
        </Field>
        <Field label="Website">
          <Input value={form.website} onChange={(e) => set("website", e.target.value)} />
        </Field>
      </div>

      <Field label="Required prerequisite subjects (comma-separated)">
        <Input
          placeholder="Linear Algebra, Calculus, Statistics"
          value={form.required_subjects}
          onChange={(e) => set("required_subjects", e.target.value)}
        />
      </Field>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Toggle label="Winter intake" v={form.winter} on={(b) => set("winter", b)} />
        <Toggle label="Summer intake" v={form.summer} on={(b) => set("summer", b)} />
        <Toggle label="APS required" v={form.aps_required} on={(b) => set("aps_required", b)} />
        <Toggle label="Uni-Assist" v={form.uni_assist} on={(b) => set("uni_assist", b)} />
        <Toggle label="Scholarship" v={form.scholarship} on={(b) => set("scholarship", b)} />
        <Toggle label="Internship" v={form.internship} on={(b) => set("internship", b)} />
        <Toggle label="Part-time" v={form.part_time} on={(b) => set("part_time", b)} />
      </div>

      <Field label="Notes">
        <Textarea rows={3} value={form.notes} onChange={(e) => set("notes", e.target.value)} />
      </Field>
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

function Toggle({ label, v, on }: { label: string; v: boolean; on: (b: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2 text-sm cursor-pointer">
      <Checkbox checked={v} onCheckedChange={(c) => on(!!c)} />
      <span>{label}</span>
    </label>
  );
}
