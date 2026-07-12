import { useEffect, useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Plus, X, Loader2, BookOpen, Headphones, PenTool, Mic, Brain } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { StreakCelebration } from "@/components/app/StreakCelebration";
import { Checkbox } from "@/components/ui/checkbox";

type LinkRow = { title: string; url: string; source: string; duration: string };

const DMAT_TOPICS = [
  "Mathematics",
  "Logical Reasoning",
  "Pattern Recognition",
  "Quantitative Analysis",
  "Problem Solving",
  "Analytical Thinking",
  "Data Interpretation",
  "Critical Thinking",
];

export function DailyCheckinModal() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  // What did they study?
  const [didGerman, setDidGerman] = useState(false);
  const [didIelts, setDidIelts] = useState(false);
  const [didDmat, setDidDmat] = useState(false);
  const [didNothing, setDidNothing] = useState(false);

  const [skipReason, setSkipReason] = useState("");

  // German
  const [words, setWords] = useState(0);
  const [studyMin, setStudyMin] = useState(0);
  const [lessonCompleted, setLessonCompleted] = useState(false);
  const [links, setLinks] = useState<LinkRow[]>([]);

  // IELTS
  const [ieltsListen, setIeltsListen] = useState(0);
  const [ieltsRead, setIeltsRead] = useState(0);
  const [ieltsWrite, setIeltsWrite] = useState(0);
  const [ieltsSpeak, setIeltsSpeak] = useState(0);
  const [ieltsVocab, setIeltsVocab] = useState(0);

  // dMAT
  const [dmatTopic, setDmatTopic] = useState("");
  const [dmatMins, setDmatMins] = useState(0);

  const [effort, setEffort] = useState(5);
  const [reflection, setReflection] = useState("");
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

  function updateLink(idx: number, patch: Partial<LinkRow>) {
    setLinks((l) => l.map((item, i) => (i === idx ? { ...item, ...patch } : item)));
  }

  function removeLink(idx: number) {
    setLinks((l) => l.filter((_, i) => i !== idx));
  }

  // Navigation helpers
  const getNextStep = (currentStep: number) => {
    if (currentStep === 0) {
      if (didNothing) return 5; // Reflection/Skip Reason
      if (didGerman) return 1;
      if (didIelts) return 2;
      if (didDmat) return 3;
      return 0; // Must select something
    }
    if (currentStep === 1) {
      // Finished German
      if (didIelts) return 2;
      if (didDmat) return 3;
      return 4; // Links
    }
    if (currentStep === 2) {
      // Finished IELTS
      if (didDmat) return 3;
      return didGerman ? 4 : 5; // Links only if German was selected, else Reflection
    }
    if (currentStep === 3) {
      // Finished dMAT
      return didGerman ? 4 : 5;
    }
    if (currentStep === 4) {
      // Finished Links
      return 5; // Reflection
    }
    return 5;
  };

  const handleNext = () => {
    if (step === 0 && !didGerman && !didIelts && !didDmat && !didNothing) return;
    setStep(getNextStep(step));
  };

  async function submit() {
    if (!user) return;
    setSaving(true);
    const today = format(new Date(), "yyyy-MM-dd");

    try {
      // 1. Daily Checkin entry
      const summaryText = didNothing ? "Took a break." : `Effort: ${effort}/10. `;

      const { error: ce } = await supabase.from("daily_checkins").insert({
        user_id: user.id,
        checkin_date: today,
        skip_reason: skipReason,
        words_learned: words + ieltsVocab,
        study_duration_minutes:
          studyMin + ieltsListen + ieltsRead + ieltsWrite + ieltsSpeak + dmatMins,
        immersion_minutes: 0,
        effort: effort,
        reflection: reflection,
        ai_notes: summaryText,
        learned:
          words + ieltsVocab > 0 ||
          studyMin + ieltsListen + ieltsRead + ieltsWrite + ieltsSpeak + dmatMins > 0 ||
          lessonCompleted,
      });
      if (ce) throw ce;

      // 1.5 daily_progress insert
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: dpErr } = await supabase.from("daily_progress" as any).insert({
        user_id: user.id,
        checkin_date: today,
        german_minutes: didGerman ? studyMin : 0,
        german_vocab: didGerman ? words : 0,
        german_lesson_completed: didGerman ? lessonCompleted : false,
        ielts_listening_hours: didIelts ? ieltsListen / 60 : 0,
        ielts_reading_hours: didIelts ? ieltsRead / 60 : 0,
        ielts_writing_hours: didIelts ? ieltsWrite / 60 : 0,
        ielts_speaking_hours: didIelts ? ieltsSpeak / 60 : 0,
        testas_topic: didDmat ? dmatTopic : null,
        testas_hours: didDmat ? dmatMins / 60 : 0,
      });
      if (dpErr) throw dpErr;

      // 2. German Links/Resources (Skipped - no learning_history table)
      // if (didGerman && links.length > 0) {
      //   const inserts = links.map((l) => {
      //     const topics = deriveTopics(l);
      //     return {
      //       user_id: user.id,
      //       resource_type: l.source.toLowerCase().includes("youtube") ? "video" : "article",
      //       title: l.title || l.url,
      //       url: l.url,
      //       provider: l.source,
      //       duration_minutes: Number(l.duration) || 15,
      //       topics: topics,
      //     };
      //   });
      //   await supabase.from("learning_history").insert(inserts);
      // }

      // 3. IELTS Practice
      if (didIelts) {
        /* eslint-disable @typescript-eslint/no-explicit-any */
        const ieltsInserts: any[] = [];
        if (ieltsListen > 0)
          ieltsInserts.push({
            user_id: user.id,
            skill: "Listening",
            duration_min: ieltsListen,
            title: "Daily Listening",
          });
        if (ieltsRead > 0)
          ieltsInserts.push({
            user_id: user.id,
            skill: "Reading",
            duration_min: ieltsRead,
            title: "Daily Reading",
          });
        if (ieltsWrite > 0)
          ieltsInserts.push({
            user_id: user.id,
            skill: "Writing",
            duration_min: ieltsWrite,
            title: "Daily Writing",
          });
        if (ieltsSpeak > 0)
          ieltsInserts.push({
            user_id: user.id,
            skill: "Speaking",
            duration_min: ieltsSpeak,
            title: "Daily Speaking",
          });
        if (ieltsVocab > 0)
          ieltsInserts.push({
            user_id: user.id,
            skill: "Vocabulary",
            words: ieltsVocab,
            title: "Daily Vocab",
            duration_min: 15,
          });

        if (ieltsInserts.length > 0) {
          await supabase.from("ielts_practice").insert(ieltsInserts);
        }
      }

      // 4. dMAT Progress
      if (didDmat && dmatTopic && dmatMins > 0) {
        await supabase.from("dmat_progress").insert({
          user_id: user.id,
          topic: dmatTopic,
          subject: dmatTopic,
          study_min: dmatMins,
          progress_pct: 10,
        });
      }

      // Calculate streak
      const { data: all } = await supabase
        .from("daily_checkins")
        .select("checkin_date")
        .eq("user_id", user.id)
        .order("checkin_date", { ascending: false });

      let curr = 0;
      if (all) {
        curr = all.length;
      }
      setStreak(curr);
      setOpen(false);
      setCelebrate(true);
    } catch (e: unknown) {
      toast.error((e as Error).message || "Failed to save check-in");
    } finally {
      setSaving(false);
    }
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
              <p className="text-sm text-muted-foreground">What did you study today?</p>
              <div className="space-y-3">
                <div
                  className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-muted/50"
                  onClick={() => {
                    setDidGerman(!didGerman);
                    setDidNothing(false);
                  }}
                >
                  <Checkbox
                    checked={didGerman}
                    onCheckedChange={(c) => {
                      setDidGerman(!!c);
                      setDidNothing(false);
                    }}
                  />
                  <Label className="cursor-pointer font-medium text-base">German Language</Label>
                </div>
                <div
                  className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-muted/50"
                  onClick={() => {
                    setDidIelts(!didIelts);
                    setDidNothing(false);
                  }}
                >
                  <Checkbox
                    checked={didIelts}
                    onCheckedChange={(c) => {
                      setDidIelts(!!c);
                      setDidNothing(false);
                    }}
                  />
                  <Label className="cursor-pointer font-medium text-base">IELTS Preparation</Label>
                </div>
                <div
                  className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-muted/50"
                  onClick={() => {
                    setDidDmat(!didDmat);
                    setDidNothing(false);
                  }}
                >
                  <Checkbox
                    checked={didDmat}
                    onCheckedChange={(c) => {
                      setDidDmat(!!c);
                      setDidNothing(false);
                    }}
                  />
                  <Label className="cursor-pointer font-medium text-base">
                    dMAT / TestAS Preparation
                  </Label>
                </div>

                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or</span>
                  </div>
                </div>

                <Button
                  variant={didNothing ? "default" : "outline"}
                  className="w-full h-12"
                  onClick={() => {
                    setDidNothing(true);
                    setDidGerman(false);
                    setDidIelts(false);
                    setDidDmat(false);
                  }}
                >
                  I took a break today
                </Button>
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  onClick={handleNext}
                  disabled={!didGerman && !didIelts && !didDmat && !didNothing}
                >
                  Next
                </Button>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4 pt-2">
              <Label className="text-lg text-brand font-display">German Progress</Label>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <NumberField label="Study (min)" value={studyMin} onChange={setStudyMin} />
                <NumberField label="Words learned" value={words} onChange={setWords} />
              </div>
              <div
                className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-muted/50"
                onClick={() => setLessonCompleted(!lessonCompleted)}
              >
                <Checkbox
                  checked={lessonCompleted}
                  onCheckedChange={(c) => setLessonCompleted(!!c)}
                />
                <Label className="cursor-pointer font-medium">Lesson Completed?</Label>
              </div>
              <div className="flex justify-between pt-4">
                <Button variant="ghost" onClick={() => setStep(0)}>
                  Back
                </Button>
                <Button onClick={handleNext}>Next</Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 pt-2">
              <Label className="text-lg text-brand font-display">IELTS Progress</Label>
              <div className="grid grid-cols-2 gap-3">
                <NumberField
                  label="Listening (min)"
                  value={ieltsListen}
                  onChange={setIeltsListen}
                />
                <NumberField label="Reading (min)" value={ieltsRead} onChange={setIeltsRead} />
                <NumberField label="Writing (min)" value={ieltsWrite} onChange={setIeltsWrite} />
                <NumberField label="Speaking (min)" value={ieltsSpeak} onChange={setIeltsSpeak} />
              </div>
              <div className="pt-2">
                <NumberField
                  label="Vocabulary Words Learned"
                  value={ieltsVocab}
                  onChange={setIeltsVocab}
                />
              </div>
              <div className="flex justify-between pt-4">
                <Button variant="ghost" onClick={() => setStep(0)}>
                  Back
                </Button>
                <Button onClick={handleNext}>Next</Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 pt-2">
              <Label className="text-lg text-brand font-display">dMAT / TestAS Progress</Label>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Which topic did you study?</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    value={dmatTopic}
                    onChange={(e) => setDmatTopic(e.target.value)}
                  >
                    <option value="" disabled>
                      Select a topic
                    </option>
                    {DMAT_TOPICS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <NumberField label="Study duration (min)" value={dmatMins} onChange={setDmatMins} />
              </div>
              <div className="flex justify-between pt-4">
                <Button variant="ghost" onClick={() => setStep(0)}>
                  Back
                </Button>
                <Button onClick={handleNext}>Next</Button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-3 pt-2 max-h-[60vh] overflow-y-auto">
              <div className="flex items-center justify-between">
                <Label>German Learning Links (Optional)</Label>
                <Button size="sm" variant="outline" onClick={addLink}>
                  <Plus className="mr-1 h-4 w-4" /> Add
                </Button>
              </div>
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
                    placeholder="https://..."
                    value={l.url}
                    onChange={(e) => updateLink(i, { url: e.target.value })}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Source"
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
              <div className="flex justify-between pt-4">
                <Button variant="ghost" onClick={() => setStep(0)}>
                  Back
                </Button>
                <Button onClick={handleNext}>Next</Button>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4 pt-2">
              {didNothing ? (
                <>
                  <Label>What got in the way?</Label>
                  <Textarea
                    value={skipReason}
                    onChange={(e) => setSkipReason(e.target.value)}
                    rows={3}
                  />
                </>
              ) : (
                <>
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
                  <Label>Reflection</Label>
                  <Textarea
                    value={reflection}
                    onChange={(e) => setReflection(e.target.value)}
                    rows={3}
                    placeholder="What clicked? What was hard?"
                  />
                </>
              )}
              <div className="flex justify-between pt-4">
                <Button variant="ghost" onClick={() => setStep(0)}>
                  Start Over
                </Button>
                <Button
                  onClick={submit}
                  disabled={saving}
                  className="bg-brand text-brand-foreground hover:bg-brand/90"
                >
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

function deriveTopics(l: LinkRow) {
  const lower = (l.title + " " + l.source).toLowerCase();
  const topics: string[] = [];
  if (lower.includes("grammar")) topics.push("grammar");
  if (lower.includes("dw") || lower.includes("news")) topics.push("listening");
  if (lower.includes("goethe")) topics.push("exam-prep");
  if (lower.includes("wiki")) topics.push("reading");
  return topics.length ? topics : ["general"];
}
