import { useEffect, useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Plus, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { StreakCelebration } from "@/components/app/StreakCelebration";

type LinkRow = { title: string; url: string; source: string; duration: string };

export function DailyCheckinModal() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [learned, setLearned] = useState<boolean | null>(null);
  const [skipReason, setSkipReason] = useState("");
  const [duolingo, setDuolingo] = useState(0);
  const [words, setWords] = useState(0);
  const [studyMin, setStudyMin] = useState(0);
  const [immMin, setImmMin] = useState(0);
  const [effort, setEffort] = useState(5);
  const [reflection, setReflection] = useState("");
  const [links, setLinks] = useState<LinkRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [streak, setStreak] = useState(0);
  const [celebrate, setCelebrate] = useState(false);

  useEffect(() => {
    if (!user) return;
    const today = format(new Date(), "yyyy-MM-dd");
    supabase
      .from("daily_checkins")
      .select("id")
      .eq("user_id", user.id)
      .eq("checkin_date", today)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) setOpen(true);
      });
  }, [user]);

  function addLink() {
    setLinks((l) => [...l, { title: "", url: "", source: "YouTube", duration: "" }]);
  }
  function updateLink(i: number, patch: Partial<LinkRow>) {
    setLinks((l) => l.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));
  }
  function removeLink(i: number) {
    setLinks((l) => l.filter((_, idx) => idx !== i));
  }

  async function submit() {
    if (!user) return;
    setSaving(true);
    const today = format(new Date(), "yyyy-MM-dd");
    const payload = {
      user_id: user.id,
      checkin_date: today,
      learned: !!learned,
      skip_reason: learned ? null : skipReason,
      duolingo_levels: duolingo,
      words_learned: words,
      study_duration_minutes: studyMin,
      immersion_minutes: immMin,
      effort,
      reflection,
      ai_notes: learned ? generateAINotes({ words, studyMin, immMin, links, duolingo }) : null,
    };
    const { data: checkin, error } = await supabase
      .from("daily_checkins")
      .insert(payload)
      .select()
      .single();
    if (error) {
      toast.error(error.message);
      setSaving(false);
      return;
    }
    if (learned && links.length) {
      const rows = links
        .filter((l) => l.url.trim())
        .map((l) => ({
          user_id: user.id,
          checkin_id: checkin.id,
          link_date: today,
          title: l.title || l.url,
          url: l.url,
          source: l.source,
          duration_minutes: Number(l.duration) || null,
          ai_summary: summarizeLink(l),
          topics: deriveTopics(l),
          tags: [l.source.toLowerCase()],
        }));
      if (rows.length) await supabase.from("learning_links").insert(rows);
    }
    const { data: s } = await supabase.rpc("upsert_streak", { p_date: today });
    setStreak((s as { current_streak: number } | null)?.current_streak ?? 1);
    setSaving(false);
    setOpen(false);
    setCelebrate(true);
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Daily check-in</DialogTitle>
          </DialogHeader>
          {step === 0 && (
            <div className="space-y-4 pt-2">
              <p className="text-sm text-muted-foreground">Did you learn German today?</p>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant={learned === true ? "default" : "outline"}
                  className="h-20 text-base"
                  onClick={() => {
                    setLearned(true);
                    setStep(1);
                  }}
                >
                  Yes, I studied
                </Button>
                <Button
                  variant={learned === false ? "default" : "outline"}
                  className="h-20 text-base"
                  onClick={() => {
                    setLearned(false);
                    setStep(1);
                  }}
                >
                  Not today
                </Button>
              </div>
            </div>
          )}

          {step === 1 && learned === false && (
            <div className="space-y-4 pt-2">
              <Label>What got in the way?</Label>
              <Textarea
                value={skipReason}
                onChange={(e) => setSkipReason(e.target.value)}
                rows={3}
              />
              <div className="flex justify-between">
                <Button variant="ghost" onClick={() => setStep(0)}>
                  Back
                </Button>
                <Button onClick={submit} disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save
                </Button>
              </div>
            </div>
          )}

          {step === 1 && learned === true && (
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <NumberField label="Duolingo levels" value={duolingo} onChange={setDuolingo} />
                <NumberField label="Words learned" value={words} onChange={setWords} />
                <NumberField label="Study (min)" value={studyMin} onChange={setStudyMin} />
                <NumberField label="Immersion (min)" value={immMin} onChange={setImmMin} />
              </div>
              <div>
                <Label>Effort today: {effort}/10</Label>
                <Slider
                  value={[effort]}
                  min={1}
                  max={10}
                  step={1}
                  onValueChange={(v) => setEffort(v[0])}
                  className="mt-2"
                />
              </div>
              <div className="flex justify-between">
                <Button variant="ghost" onClick={() => setStep(0)}>
                  Back
                </Button>
                <Button onClick={() => setStep(2)}>Next: Learning links</Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3 pt-2 max-h-[60vh] overflow-y-auto">
              <div className="flex items-center justify-between">
                <Label>Learning links</Label>
                <Button size="sm" variant="outline" onClick={addLink}>
                  <Plus className="mr-1 h-4 w-4" />
                  Add
                </Button>
              </div>
              {links.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Add YouTube, DW, Goethe or any URL you learned from.
                </p>
              )}
              {links.map((l, i) => (
                <div key={i} className="space-y-2 rounded-lg border p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">Link {i + 1}</span>
                    <button onClick={() => removeLink(i)}>
                      <X className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </div>
                  <Input
                    placeholder="Title"
                    value={l.title}
                    onChange={(e) => updateLink(i, { title: e.target.value })}
                  />
                  <Input
                    placeholder="https://…"
                    value={l.url}
                    onChange={(e) => updateLink(i, { url: e.target.value })}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Source (YouTube, DW…)"
                      value={l.source}
                      onChange={(e) => updateLink(i, { source: e.target.value })}
                    />
                    <Input
                      placeholder="Minutes"
                      type="number"
                      value={l.duration}
                      onChange={(e) => updateLink(i, { duration: e.target.value })}
                    />
                  </div>
                </div>
              ))}
              <div className="flex justify-between pt-2">
                <Button variant="ghost" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button onClick={() => setStep(3)}>Next: Reflection</Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 pt-2">
              <Label>Reflection</Label>
              <Textarea
                value={reflection}
                onChange={(e) => setReflection(e.target.value)}
                rows={4}
                placeholder="What clicked? What was hard?"
              />
              <div className="flex justify-between">
                <Button variant="ghost" onClick={() => setStep(2)}>
                  Back
                </Button>
                <Button onClick={submit} disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Complete check-in
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <StreakCelebration open={celebrate} streak={streak} onDone={() => setCelebrate(false)} />
    </>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <Input
        type="number"
        min={0}
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
      />
    </div>
  );
}

function generateAINotes(d: {
  words: number;
  studyMin: number;
  immMin: number;
  links: LinkRow[];
  duolingo: number;
}) {
  const parts: string[] = [];
  if (d.studyMin) parts.push(`${d.studyMin} min focused study`);
  if (d.immMin) parts.push(`${d.immMin} min immersion`);
  if (d.words) parts.push(`${d.words} new words`);
  if (d.duolingo) parts.push(`${d.duolingo} Duolingo level${d.duolingo > 1 ? "s" : ""}`);
  if (d.links.length) parts.push(`${d.links.length} learning link${d.links.length > 1 ? "s" : ""}`);
  return parts.length ? `Today: ${parts.join(" · ")}.` : "Logged a quiet study day.";
}
function summarizeLink(l: LinkRow) {
  return `${l.source} — ${l.title || l.url}. Review key vocabulary and structures encountered.`;
}
function deriveTopics(l: LinkRow) {
  const lower = (l.title + " " + l.source).toLowerCase();
  const topics: string[] = [];
  if (lower.includes("grammar")) topics.push("grammar");
  if (lower.includes("dw") || lower.includes("news")) topics.push("listening");
  if (lower.includes("goethe")) topics.push("exam-prep");
  if (lower.includes("wiki")) topics.push("reading");
  return topics.length ? topics : ["general"];
}
