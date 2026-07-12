import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Plus, Trash2, Loader2, ExternalLink, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { getDocumentAnalysis } from "@/lib/ai/ai.functions";
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
import { EmptyState } from "@/components/app/EmptyState";

type Doc = {
  id: string;
  name: string;
  category: string;
  status: "pending" | "in_progress" | "ready" | "expired" | "submitted";
  file_path: string | null;
  link_url: string | null;
  expiry_date: string | null;
  notes: string | null;
};

const CATEGORIES = [
  "passport",
  "aps",
  "transcripts",
  "ielts",
  "toefl",
  "german",
  "sop",
  "lor",
  "cv",
  "visa",
  "blocked",
  "insurance",
  "other",
];
const STATUSES: Doc["status"][] = ["pending", "in_progress", "ready", "submitted", "expired"];

const STATUS_TONE: Record<Doc["status"], string> = {
  pending: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  in_progress: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
  ready: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  submitted: "bg-violet-500/15 text-violet-700 dark:text-violet-300",
  expired: "bg-rose-500/15 text-rose-700 dark:text-rose-300",
};

export function DocumentVault({ compact = false }: { compact?: boolean }) {
  const { user } = useAuth();
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    category: "passport",
    status: "pending" as Doc["status"],
    link_url: "",
    expiry_date: "",
    notes: "",
  });

  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const analyzeFn = useServerFn(getDocumentAnalysis);

  async function load() {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("documents")
      .select("id, name, category, status, file_path, link_url, expiry_date, notes")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setDocs((data ?? []) as Doc[]);
    setLoading(false);
  }
  useEffect(() => {
    load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [user]);

  async function save() {
    if (!user) return;
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("documents").insert({
      user_id: user.id,
      name: form.name.trim(),
      category: form.category,
      status: form.status,
      link_url: form.link_url || null,
      expiry_date: form.expiry_date || null,
      notes: form.notes || null,
    });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Document added");
    setForm({
      name: "",
      category: "passport",
      status: "pending",
      link_url: "",
      expiry_date: "",
      notes: "",
    });
    setOpen(false);
    load();
  }

  async function updateStatus(d: Doc, status: Doc["status"]) {
    await supabase.from("documents").update({ status }).eq("id", d.id);
    setDocs((arr) => arr.map((x) => (x.id === d.id ? { ...x, status } : x)));
  }
  async function remove(d: Doc) {
    await supabase.from("documents").delete().eq("id", d.id);
    setDocs((arr) => arr.filter((x) => x.id !== d.id));
  }

  const list = compact ? docs.slice(0, 5) : docs;

  async function handleAnalyze() {
    setAnalyzing(true);
    try {
      const res = await analyzeFn({ data: { documents: docs } });
      setAiAnalysis(res.analysis);
    } catch (e) {
      console.error(e);
    } finally {
      setAnalyzing(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="font-display text-base font-semibold">Document Vault</p>
        <div className="flex gap-2">
          {!compact && (
            <Button
              variant="secondary"
              size="sm"
              className="gap-2 bg-brand/10 text-brand hover:bg-brand/20"
              onClick={handleAnalyze}
              disabled={analyzing || aiAnalysis !== null}
            >
              {analyzing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {aiAnalysis ? "AI Review Complete" : "AI Review"}
            </Button>
          )}
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Add
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add document</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 pt-2">
                <Field label="Name">
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. APS certificate"
                  />
                </Field>
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
                        {CATEGORIES.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Status">
                    <Select
                      value={form.status}
                      onValueChange={(v) => setForm({ ...form, status: v as Doc["status"] })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s.replace("_", " ")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
                <Field label="Link (optional)">
                  <Input
                    value={form.link_url}
                    onChange={(e) => setForm({ ...form, link_url: e.target.value })}
                    placeholder="https://…"
                  />
                </Field>
                <Field label="Expiry">
                  <Input
                    type="date"
                    value={form.expiry_date}
                    onChange={(e) => setForm({ ...form, expiry_date: e.target.value })}
                  />
                </Field>
                <Field label="Notes">
                  <Input
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
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
      </div>

      {!compact && aiAnalysis && (
        <div className="rounded-xl border bg-brand/5 p-4 text-sm text-foreground mb-3">
          <div className="mb-2 flex items-center gap-2 font-display text-base font-semibold text-brand">
            <Sparkles className="h-4 w-4" /> AI Document Review
          </div>
          <div className="space-y-2 leading-relaxed">
            {aiAnalysis.split("\n").map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : list.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No documents yet"
          description="Track APS, transcripts, SOP, LOR, visa appointments and more."
        />
      ) : (
        <div className="space-y-2">
          <AnimatePresence initial={false}>
            {list.map((d) => (
              <motion.div
                key={d.id}
                layout
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <Card className="shadow-card">
                  <CardContent className="flex flex-wrap items-center gap-3 p-3">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <div className="grid h-9 w-9 place-items-center rounded-md bg-muted">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{d.name}</p>
                        <div className="flex flex-wrap gap-1 pt-0.5">
                          <Badge variant="secondary" className="text-[10px]">
                            {d.category}
                          </Badge>
                          {d.expiry_date && (
                            <Badge variant="secondary" className="text-[10px]">
                              exp {new Date(d.expiry_date).toLocaleDateString()}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <Select
                      value={d.status}
                      onValueChange={(v) => updateStatus(d, v as Doc["status"])}
                    >
                      <SelectTrigger className={`h-7 w-32 text-xs ${STATUS_TONE[d.status]}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s.replace("_", " ")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {d.link_url && (
                      <a
                        href={d.link_url}
                        target="_blank"
                        rel="noreferrer"
                        className="grid h-7 w-7 place-items-center rounded-md bg-muted hover:bg-accent"
                        aria-label="Open link"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                    <button
                      onClick={() => remove(d)}
                      className="grid h-7 w-7 place-items-center rounded-md bg-muted text-destructive hover:bg-destructive/10"
                      aria-label="Delete document"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
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
