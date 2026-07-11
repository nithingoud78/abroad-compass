import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Plus, Search, Trash2, Check, Edit3, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

export const Route = createFileRoute("/_authenticated/vocabulary")({
  head: () => ({ meta: [{ title: "Vocabulary — Abroad Compass" }] }),
  component: VocabularyPage,
});

type Word = {
  id: string;
  german: string;
  english: string;
  sentence: string | null;
  category: string | null;
  difficulty: string | null;
  mastered: boolean;
  revision_count: number;
};

const PAGE_SIZE = 12;

function VocabularyPage() {
  const { user } = useAuth();
  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "mastered" | "learning">("all");
  const [diff, setDiff] = useState<"all" | "easy" | "medium" | "hard">("all");
  const [page, setPage] = useState(0);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Word | null>(null);
  const [form, setForm] = useState({
    german: "",
    english: "",
    sentence: "",
    category: "",
    difficulty: "medium",
  });
  const [saving, setSaving] = useState(false);

  async function load() {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("vocabulary")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setWords(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [user]);

  const filtered = useMemo(() => {
    return words.filter((w) => {
      if (filter === "mastered" && !w.mastered) return false;
      if (filter === "learning" && w.mastered) return false;
      if (diff !== "all" && w.difficulty !== diff) return false;
      if (
        q &&
        !`${w.german} ${w.english} ${w.category ?? ""}`.toLowerCase().includes(q.toLowerCase())
      )
        return false;
      return true;
    });
  }, [words, q, filter, diff]);

  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  function openCreate() {
    setEditing(null);
    setForm({ german: "", english: "", sentence: "", category: "", difficulty: "medium" });
    setOpen(true);
  }
  function openEdit(w: Word) {
    setEditing(w);
    setForm({
      german: w.german,
      english: w.english,
      sentence: w.sentence ?? "",
      category: w.category ?? "",
      difficulty: w.difficulty ?? "medium",
    });
    setOpen(true);
  }

  async function save() {
    if (!user) return;
    if (!form.german.trim() || !form.english.trim()) {
      toast.error("German and English are required");
      return;
    }
    setSaving(true);
    if (editing) {
      const { error } = await supabase
        .from("vocabulary")
        .update({
          german: form.german,
          english: form.english,
          sentence: form.sentence || null,
          category: form.category || null,
          difficulty: form.difficulty,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editing.id);
      if (error) toast.error(error.message);
      else toast.success("Word updated");
    } else {
      const { error } = await supabase.from("vocabulary").insert({
        user_id: user.id,
        german: form.german,
        english: form.english,
        sentence: form.sentence || null,
        category: form.category || null,
        difficulty: form.difficulty,
      });
      if (error) toast.error(error.message);
      else toast.success("Word added");
    }
    setSaving(false);
    setOpen(false);
    load();
  }

  async function toggleMastered(w: Word) {
    await supabase
      .from("vocabulary")
      .update({
        mastered: !w.mastered,
        revision_count: w.revision_count + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", w.id);
    load();
  }
  async function remove(w: Word) {
    await supabase.from("vocabulary").delete().eq("id", w.id);
    load();
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Vocabulary</p>
          <h1 className="font-display text-3xl font-bold tracking-tight">Your German wordbook</h1>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Add word
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Edit word" : "Add word"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 pt-2">
              <Field label="German">
                <Input
                  value={form.german}
                  onChange={(e) => setForm({ ...form, german: e.target.value })}
                />
              </Field>
              <Field label="English">
                <Input
                  value={form.english}
                  onChange={(e) => setForm({ ...form, english: e.target.value })}
                />
              </Field>
              <Field label="Example sentence">
                <Textarea
                  rows={2}
                  value={form.sentence}
                  onChange={(e) => setForm({ ...form, sentence: e.target.value })}
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Category">
                  <Input
                    placeholder="e.g. travel"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                  />
                </Field>
                <Field label="Difficulty">
                  <Select
                    value={form.difficulty}
                    onValueChange={(v) => setForm({ ...form, difficulty: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["easy", "medium", "hard"].map((d) => (
                        <SelectItem key={d} value={d}>
                          {d}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
              <div className="flex justify-end gap-2 pt-2">
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
      </header>

      <Card className="shadow-card">
        <CardContent className="flex flex-wrap items-center gap-3 p-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search words"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(0);
              }}
              className="pl-9"
            />
          </div>
          <Select
            value={filter}
            onValueChange={(v) => {
              setFilter(v as "all" | "mastered" | "learning");
              setPage(0);
            }}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="mastered">Mastered</SelectItem>
              <SelectItem value="learning">Still learning</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={diff}
            onValueChange={(v) => {
              setDiff(v as "all" | "easy" | "medium" | "hard");
              setPage(0);
            }}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All levels</SelectItem>
              <SelectItem value="easy">Easy</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="hard">Hard</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : paged.length === 0 ? (
        <Card className="shadow-card">
          <CardContent className="p-10 text-center text-sm text-muted-foreground">
            No words match. Add your first word above.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {paged.map((w) => (
            <Card key={w.id} className="shadow-card">
              <CardContent className="space-y-2 p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-display text-xl font-bold">{w.german}</p>
                    <p className="text-sm text-muted-foreground">{w.english}</p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => toggleMastered(w)}
                      title="Toggle mastered"
                      className={`grid h-7 w-7 place-items-center rounded-md ${w.mastered ? "bg-brand text-brand-foreground" : "bg-muted"}`}
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => openEdit(w)}
                      className="grid h-7 w-7 place-items-center rounded-md bg-muted"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => remove(w)}
                      className="grid h-7 w-7 place-items-center rounded-md bg-muted text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                {w.sentence && (
                  <p className="text-sm italic text-muted-foreground">“{w.sentence}”</p>
                )}
                <div className="flex flex-wrap gap-1">
                  {w.category && <Badge variant="secondary">{w.category}</Badge>}
                  {w.difficulty && <Badge variant="secondary">{w.difficulty}</Badge>}
                  <Badge variant="secondary">×{w.revision_count}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {pageCount > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{filtered.length} words</span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <span className="self-center text-sm">
              {page + 1} / {pageCount}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page + 1 >= pageCount}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
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
