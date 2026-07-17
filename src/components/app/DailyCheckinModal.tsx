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
import { Checkbox } from "@/components/ui/checkbox";

// ─── Types ────────────────────────────────────────────────────────────────────

type LinkEntry = {
  title: string;
  url: string;
  source: string;
  duration: string; // HH:MM:SS
  userSummary: string;
};

const emptyLink = (): LinkEntry => ({
  title: "",
  url: "",
  source: "",
  duration: "00:00:00",
  userSummary: "",
});

const DMAT_TOPICS = [
  "Figure Sequence",
  "Mathematical Equations",
  "Latin Squares",
  "Subject Module",
] as const;

// ─── HH:MM:SS helpers ─────────────────────────────────────────────────────────

/** Convert a HH:MM:SS string to whole minutes. */
function hmsToMinutes(hms: string): number {
  const parts = hms.split(":").map(Number);
  if (parts.length === 3) return parts[0] * 60 + parts[1] + Math.round(parts[2] / 60);
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return Number(hms) || 0;
}

/** Validate & normalise a HH:MM:SS string on blur. */
function normaliseHms(raw: string): string {
  const stripped = raw.replace(/[^0-9:]/g, "");
  const parts = stripped.split(":");
  const h = Math.max(0, Number(parts[0] ?? 0));
  const m = Math.min(59, Math.max(0, Number(parts[1] ?? 0)));
  const s = Math.min(59, Math.max(0, Number(parts[2] ?? 0)));
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// ─── Sub-component: HmsInput ──────────────────────────────────────────────────

function HmsInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <Input
        placeholder="HH:MM:SS"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={(e) => onChange(normaliseHms(e.target.value))}
        style={{
          fontFamily: "'Inter', 'Geist Mono', ui-monospace, monospace",
          fontVariantNumeric: "tabular-nums",
          fontFeatureSettings: '"tnum"',
          letterSpacing: "0.04em",
        }}
      />
    </div>
  );
}

// ─── Sub-component: NumberField ───────────────────────────────────────────────

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
        value={value || ""}
        onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
        placeholder="0"
      />
    </div>
  );
}

// ─── Sub-component: LinksSection ─────────────────────────────────────────────

function LinksSection({
  subject,
  links,
  onChange,
}: {
  subject: string;
  links: LinkEntry[];
  onChange: (links: LinkEntry[]) => void;
}) {
  const add = () => onChange([...links, emptyLink()]);
  const remove = (i: number) => onChange(links.filter((_, idx) => idx !== i));
  const update = (i: number, patch: Partial<LinkEntry>) =>
    onChange(links.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>{subject} Learning Links (Optional)</Label>
        <Button size="sm" variant="outline" onClick={add}>
          <Plus className="mr-1 h-4 w-4" /> Add
        </Button>
      </div>
      {links.map((l, i) => (
        <div key={i} className="space-y-2 rounded-lg border p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Link {i + 1}</span>
            <button onClick={() => remove(i)}>
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
          <Input
            placeholder="Title"
            value={l.title}
            onChange={(e) => update(i, { title: e.target.value })}
          />
          <Input
            placeholder="https://..."
            value={l.url}
            onChange={(e) => update(i, { url: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-2">
            <Input
              placeholder="Source (YouTube, Article…)"
              value={l.source}
              onChange={(e) => update(i, { source: e.target.value })}
            />
            <div className="space-y-1.5">
              <Label className="text-xs">Duration (HH:MM:SS)</Label>
              <Input
                placeholder="HH:MM:SS"
                value={l.duration}
                onChange={(e) => update(i, { duration: e.target.value })}
                onBlur={(e) => update(i, { duration: normaliseHms(e.target.value) })}
                style={{
                  fontFamily: "'Inter', 'Geist Mono', ui-monospace, monospace",
                  fontVariantNumeric: "tabular-nums",
                  fontFeatureSettings: '"tnum"',
                  letterSpacing: "0.04em",
                }}
              />
            </div>
          </div>
          <Textarea
            placeholder="Your summary (what did you learn?)"
            value={l.userSummary}
            onChange={(e) => update(i, { userSummary: e.target.value })}
            rows={2}
          />
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function DailyCheckinModal() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  // Step-0: what did they study?
  const [didGerman, setDidGerman] = useState(false);
  const [didIelts, setDidIelts] = useState(false);
  const [didDmat, setDidDmat] = useState(false);
  const [didNothing, setDidNothing] = useState(false);

  // German (all durations as HH:MM:SS strings)
  const [gListening, setGListening] = useState("00:00:00");
  const [gReading, setGReading] = useState("00:00:00");
  const [gWriting, setGWriting] = useState("00:00:00");
  const [gSpeaking, setGSpeaking] = useState("00:00:00");
  const [gVocab, setGVocab] = useState(0);
  const [gDuolingo, setGDuolingo] = useState(0);
  const [gLinks, setGLinks] = useState<LinkEntry[]>([]);

  // IELTS
  const [iListening, setIListening] = useState("00:00:00");
  const [iReading, setIReading] = useState("00:00:00");
  const [iWriting, setIWriting] = useState("00:00:00");
  const [iSpeaking, setISpeaking] = useState("00:00:00");
  const [iVocab, setIVocab] = useState(0);
  // IELTS mock
  const [iMockTaken, setIMockTaken] = useState<boolean | null>(null); // null = not answered yet
  const [iMockListening, setIMockListening] = useState("");
  const [iMockReading, setIMockReading] = useState("");
  const [iMockWriting, setIMockWriting] = useState("");
  const [iMockSpeaking, setIMockSpeaking] = useState("");
  const [iMockOverall, setIMockOverall] = useState("");
  const [iLinks, setILinks] = useState<LinkEntry[]>([]);

  // dMAT (durations per topic HH:MM:SS)
  const [dFigureSeq, setDFigureSeq] = useState("00:00:00");
  const [dMathEq, setDMathEq] = useState("00:00:00");
  const [dLatinSq, setDLatinSq] = useState("00:00:00");
  const [dSubjMod, setDSubjMod] = useState("00:00:00");
  const [dFormulas, setDFormulas] = useState(0);
  const [dLinks, setDLinks] = useState<LinkEntry[]>([]);

  // Shared
  const [effort, setEffort] = useState(5);
  const [reflection, setReflection] = useState("");
  const [skipReason, setSkipReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [streak, setStreak] = useState(0);
  const [celebrate, setCelebrate] = useState(false);

  // Open once per day
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

  // ── Flow navigation ──────────────────────────────────────────────────────

  /**
   * Steps:
   *  0  – subject selection
   *  1  – German skills
   *  2  – German links
   *  3  – IELTS skills
   *  4  – IELTS mock
   *  5  – IELTS links
   *  6  – dMAT topics
   *  7  – dMAT links
   *  8  – Effort & Reflection / Skip reason
   */

  function getNextStep(cur: number): number {
    if (cur === 0) {
      if (didNothing) return 8;
      if (didGerman) return 1;
      if (didIelts) return 3;
      if (didDmat) return 6;
    }
    // German flow
    if (cur === 1) return 2; // German → German links
    if (cur === 2) {
      if (didIelts) return 3;
      if (didDmat) return 6;
      return 8;
    }
    // IELTS flow
    if (cur === 3) return 4; // IELTS skills → IELTS mock
    if (cur === 4) return 5; // mock → IELTS links
    if (cur === 5) {
      if (didDmat) return 6;
      return 8;
    }
    // dMAT flow
    if (cur === 6) return 7; // dMAT → dMAT links
    if (cur === 7) return 8;
    return 8;
  }

  function getPrevStep(cur: number): number {
    if (cur <= 0) return 0;
    if (cur === 1) return 0;
    if (cur === 2) return 1;
    if (cur === 3) return didGerman ? 2 : 0;
    if (cur === 4) return 3;
    if (cur === 5) return 4;
    if (cur === 6) return didIelts ? 5 : didGerman ? 2 : 0;
    if (cur === 7) return 6;
    if (cur === 8) {
      if (didNothing) return 0;
      if (didDmat) return 7;
      if (didIelts) return 5;
      if (didGerman) return 2;
      return 0;
    }
    return 0;
  }

  const handleNext = () => {
    if (step === 0 && !didGerman && !didIelts && !didDmat && !didNothing) return;
    setStep(getNextStep(step));
  };

  // ── Save ──────────────────────────────────────────────────────────────────

  async function submit() {
    if (!user) return;
    setSaving(true);
    const today = format(new Date(), "yyyy-MM-dd");

    // Convert all HH:MM:SS to minutes
    const gListMin = hmsToMinutes(gListening);
    const gReadMin = hmsToMinutes(gReading);
    const gWritMin = hmsToMinutes(gWriting);
    const gSpeakMin = hmsToMinutes(gSpeaking);
    const iListMin = hmsToMinutes(iListening);
    const iReadMin = hmsToMinutes(iReading);
    const iWritMin = hmsToMinutes(iWriting);
    const iSpeakMin = hmsToMinutes(iSpeaking);
    const dFigMin = hmsToMinutes(dFigureSeq);
    const dMathMin = hmsToMinutes(dMathEq);
    const dLatMin = hmsToMinutes(dLatinSq);
    const dSubMin = hmsToMinutes(dSubjMod);

    const totalMin =
      (didGerman ? gListMin + gReadMin + gWritMin + gSpeakMin : 0) +
      (didIelts ? iListMin + iReadMin + iWritMin + iSpeakMin : 0) +
      (didDmat ? dFigMin + dMathMin + dLatMin + dSubMin : 0);

    const totalWords = (didGerman ? gVocab : 0) + (didIelts ? iVocab : 0);

    try {
      // 1. Daily check-in summary row
      const { error: ceErr } = await supabase.from("daily_checkins").insert({
        user_id: user.id,
        checkin_date: today,
        skip_reason: didNothing ? skipReason : null,
        words_learned: totalWords,
        study_duration_minutes: totalMin,
        immersion_minutes: 0,
        effort: didNothing ? 0 : effort,
        reflection: didNothing ? null : reflection,
        ai_notes: didNothing ? "Took a break." : `Effort: ${effort}/10.`,
        learned: totalMin > 0 || totalWords > 0,
      });
      if (ceErr) throw ceErr;

      // 2. daily_progress — German + IELTS + dMAT (all in one row, isolated columns)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: dpErr } = await (supabase.from as any)("daily_progress").upsert(
        {
          user_id: user.id,
          checkin_date: today,
          // German columns — only set if user studied German
          german_minutes: didGerman ? gListMin + gReadMin + gWritMin + gSpeakMin : 0,
          german_vocab: didGerman ? gVocab : 0,
          german_listening_min: didGerman ? gListMin : 0,
          german_reading_min: didGerman ? gReadMin : 0,
          german_writing_min: didGerman ? gWritMin : 0,
          german_speaking_min: didGerman ? gSpeakMin : 0,
          german_duolingo_lessons: didGerman ? gDuolingo : 0,
          german_lesson_completed: false, // legacy column, kept as false
          // IELTS columns — only set if user studied IELTS
          ielts_listening_hours: didIelts ? iListMin / 60 : 0,
          ielts_reading_hours: didIelts ? iReadMin / 60 : 0,
          ielts_writing_hours: didIelts ? iWritMin / 60 : 0,
          ielts_speaking_hours: didIelts ? iSpeakMin / 60 : 0,
          ielts_vocab_count: didIelts ? iVocab : 0,
          ielts_mock_taken: didIelts ? iMockTaken === true : false,
          ielts_mock_listening: didIelts && iMockTaken ? Number(iMockListening) || null : null,
          ielts_mock_reading: didIelts && iMockTaken ? Number(iMockReading) || null : null,
          ielts_mock_writing: didIelts && iMockTaken ? Number(iMockWriting) || null : null,
          ielts_mock_speaking: didIelts && iMockTaken ? Number(iMockSpeaking) || null : null,
          ielts_mock_overall: didIelts && iMockTaken ? Number(iMockOverall) || null : null,
          // dMAT columns — only set if user studied dMAT
          dmat_figure_sequence_min: didDmat ? dFigMin : 0,
          dmat_math_equations_min: didDmat ? dMathMin : 0,
          dmat_latin_squares_min: didDmat ? dLatMin : 0,
          dmat_subject_module_min: didDmat ? dSubMin : 0,
          dmat_formula_count: didDmat ? dFormulas : 0,
          testas_topic: didDmat
            ? [
                dFigMin > 0 ? "Figure Sequence" : null,
                dMathMin > 0 ? "Mathematical Equations" : null,
                dLatMin > 0 ? "Latin Squares" : null,
                dSubMin > 0 ? "Subject Module" : null,
              ]
                .filter(Boolean)
                .join(", ") || null
            : null,
          testas_hours: didDmat ? (dFigMin + dMathMin + dLatMin + dSubMin) / 60 : 0,
        },
        { onConflict: "user_id,checkin_date" },
      );
      if (dpErr) throw dpErr;

      // 3. IELTS practice rows — each skill as its own row in ielts_practice
      if (didIelts) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const ieltsInserts: any[] = [];
        if (iListMin > 0)
          ieltsInserts.push({
            user_id: user.id,
            skill: "Listening",
            duration_min: iListMin,
            title: "Daily Listening",
          });
        if (iReadMin > 0)
          ieltsInserts.push({
            user_id: user.id,
            skill: "Reading",
            duration_min: iReadMin,
            title: "Daily Reading",
          });
        if (iWritMin > 0)
          ieltsInserts.push({
            user_id: user.id,
            skill: "Writing",
            duration_min: iWritMin,
            title: "Daily Writing",
          });
        if (iSpeakMin > 0)
          ieltsInserts.push({
            user_id: user.id,
            skill: "Speaking",
            duration_min: iSpeakMin,
            title: "Daily Speaking",
          });
        if (iVocab > 0)
          ieltsInserts.push({
            user_id: user.id,
            skill: "Vocabulary",
            duration_min: 15,
            words: iVocab,
            title: "Daily Vocab",
          });
        if (iMockTaken && iMockOverall) {
          ieltsInserts.push({
            user_id: user.id,
            skill: "Mock",
            duration_min: 180,
            band: Number(iMockOverall) || null,
            title: "Mock Test",
          });
        }
        if (ieltsInserts.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase.from as any)("ielts_practice").insert(ieltsInserts);
        }
      }

      // 4. dMAT progress rows — one row per topic studied
      if (didDmat) {
        const dmatRows = [
          { topic: "Figure Sequence", min: dFigMin },
          { topic: "Mathematical Equations", min: dMathMin },
          { topic: "Latin Squares", min: dLatMin },
          { topic: "Subject Module", min: dSubMin },
        ].filter((r) => r.min > 0);

        for (const r of dmatRows) {
          await supabase.from("dmat_progress").insert({
            user_id: user.id,
            topic: r.topic,
            subject: r.topic,
            study_min: r.min,
            progress_pct: Math.min(10, Math.round((r.min / 60) * 10)),
          });
        }
      }

      // 5. Learning links — scoped by subject
      const allLinks: Array<LinkEntry & { subject: string }> = [
        ...gLinks.map((l) => ({ ...l, subject: "german" })),
        ...iLinks.map((l) => ({ ...l, subject: "ielts" })),
        ...dLinks.map((l) => ({ ...l, subject: "dmat" })),
      ].filter((l) => l.url.trim() !== "");

      if (allLinks.length > 0) {
        const linkRows = allLinks.map((l) => ({
          user_id: user.id,
          link_date: today,
          title: l.title || l.url,
          url: l.url,
          source: l.source || null,
          duration_minutes: hmsToMinutes(l.duration) || null,
          subject: l.subject,
          user_summary: l.userSummary || null,
          topics: [l.subject],
        }));
        await supabase.from("learning_links").insert(linkRows);
      }

      // 6. Calculate streak
      const { data: allCheckins } = await supabase
        .from("daily_checkins")
        .select("checkin_date")
        .eq("user_id", user.id)
        .order("checkin_date", { ascending: false });

      setStreak(allCheckins?.length ?? 0);
      setOpen(false);
      setCelebrate(true);
    } catch (e: unknown) {
      toast.error((e as Error).message || "Failed to save check-in");
    } finally {
      setSaving(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Daily check-in</DialogTitle>
          </DialogHeader>

          {/* ── STEP 0: Subject selection ─────────────────────────────── */}
          {step === 0 && (
            <div className="space-y-4 pt-2">
              <p className="text-sm text-muted-foreground">What did you study today?</p>
              <div className="space-y-3">
                {[
                  { label: "German Language", state: didGerman, set: setDidGerman },
                  { label: "IELTS Preparation", state: didIelts, set: setDidIelts },
                  { label: "dMAT / TestAS Preparation", state: didDmat, set: setDidDmat },
                ].map(({ label, state, set }) => (
                  <div
                    key={label}
                    className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-muted/50"
                    onClick={() => {
                      set(!state);
                      setDidNothing(false);
                    }}
                  >
                    <Checkbox
                      checked={state}
                      onCheckedChange={(c) => {
                        set(!!c);
                        setDidNothing(false);
                      }}
                    />
                    <Label className="cursor-pointer font-medium text-base">{label}</Label>
                  </div>
                ))}

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

          {/* ── STEP 1: German skills ─────────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-4 pt-2">
              <Label className="text-lg text-brand font-display">German Progress</Label>
              <div className="grid grid-cols-2 gap-3">
                <HmsInput label="Listening" value={gListening} onChange={setGListening} />
                <HmsInput label="Reading" value={gReading} onChange={setGReading} />
                <HmsInput label="Writing" value={gWriting} onChange={setGWriting} />
                <HmsInput label="Speaking" value={gSpeaking} onChange={setGSpeaking} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <NumberField label="Vocabulary Words Learned" value={gVocab} onChange={setGVocab} />
                <NumberField
                  label="Duolingo Lessons Completed"
                  value={gDuolingo}
                  onChange={setGDuolingo}
                />
              </div>
              <div className="flex justify-between pt-4">
                <Button variant="ghost" onClick={() => setStep(getPrevStep(step))}>
                  Back
                </Button>
                <Button onClick={handleNext}>Next</Button>
              </div>
            </div>
          )}

          {/* ── STEP 2: German links ──────────────────────────────────── */}
          {step === 2 && (
            <div className="space-y-3 pt-2">
              <LinksSection subject="German" links={gLinks} onChange={setGLinks} />
              <div className="flex justify-between pt-4">
                <Button variant="ghost" onClick={() => setStep(getPrevStep(step))}>
                  Back
                </Button>
                <Button onClick={handleNext}>Next</Button>
              </div>
            </div>
          )}

          {/* ── STEP 3: IELTS skills ──────────────────────────────────── */}
          {step === 3 && (
            <div className="space-y-4 pt-2">
              <Label className="text-lg text-brand font-display">IELTS Progress</Label>
              <div className="grid grid-cols-2 gap-3">
                <HmsInput label="Listening" value={iListening} onChange={setIListening} />
                <HmsInput label="Reading" value={iReading} onChange={setIReading} />
                <HmsInput label="Writing" value={iWriting} onChange={setIWriting} />
                <HmsInput label="Speaking" value={iSpeaking} onChange={setISpeaking} />
              </div>
              <NumberField label="Vocabulary Words Learned" value={iVocab} onChange={setIVocab} />
              <div className="flex justify-between pt-4">
                <Button variant="ghost" onClick={() => setStep(getPrevStep(step))}>
                  Back
                </Button>
                <Button onClick={handleNext}>Next</Button>
              </div>
            </div>
          )}

          {/* ── STEP 4: IELTS mock ────────────────────────────────────── */}
          {step === 4 && (
            <div className="space-y-4 pt-2">
              <Label className="text-lg text-brand font-display">Mock Test</Label>
              <p className="text-sm text-muted-foreground">Did you take a mock test today?</p>
              <div className="flex gap-3">
                <Button
                  variant={iMockTaken === true ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setIMockTaken(true)}
                >
                  Yes
                </Button>
                <Button
                  variant={iMockTaken === false ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setIMockTaken(false)}
                >
                  No
                </Button>
              </div>

              {iMockTaken === true && (
                <div className="space-y-3 rounded-lg border p-3">
                  <p className="text-sm font-medium">Mock Scores (0–9 bands)</p>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Listening", val: iMockListening, set: setIMockListening },
                      { label: "Reading", val: iMockReading, set: setIMockReading },
                      { label: "Writing", val: iMockWriting, set: setIMockWriting },
                      { label: "Speaking", val: iMockSpeaking, set: setIMockSpeaking },
                    ].map(({ label, val, set }) => (
                      <div key={label} className="space-y-1.5">
                        <Label className="text-xs">{label}</Label>
                        <Input
                          type="number"
                          min={0}
                          max={9}
                          step={0.5}
                          placeholder="e.g. 7.5"
                          value={val}
                          onChange={(e) => set(e.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Overall Band</Label>
                    <Input
                      type="number"
                      min={0}
                      max={9}
                      step={0.5}
                      placeholder="e.g. 7.0"
                      value={iMockOverall}
                      onChange={(e) => setIMockOverall(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-between pt-4">
                <Button variant="ghost" onClick={() => setStep(getPrevStep(step))}>
                  Back
                </Button>
                <Button onClick={handleNext} disabled={iMockTaken === null}>
                  Next
                </Button>
              </div>
            </div>
          )}

          {/* ── STEP 5: IELTS links ───────────────────────────────────── */}
          {step === 5 && (
            <div className="space-y-3 pt-2">
              <LinksSection subject="IELTS" links={iLinks} onChange={setILinks} />
              <div className="flex justify-between pt-4">
                <Button variant="ghost" onClick={() => setStep(getPrevStep(step))}>
                  Back
                </Button>
                <Button onClick={handleNext}>Next</Button>
              </div>
            </div>
          )}

          {/* ── STEP 6: dMAT topics ───────────────────────────────────── */}
          {step === 6 && (
            <div className="space-y-4 pt-2">
              <Label className="text-lg text-brand font-display">dMAT / TestAS Progress</Label>
              <p className="text-sm text-muted-foreground">
                Enter time spent on each topic (leave 00:00:00 for topics not studied).
              </p>
              <div className="grid grid-cols-2 gap-3">
                <HmsInput label="Figure Sequence" value={dFigureSeq} onChange={setDFigureSeq} />
                <HmsInput label="Mathematical Equations" value={dMathEq} onChange={setDMathEq} />
                <HmsInput label="Latin Squares" value={dLatinSq} onChange={setDLatinSq} />
                <HmsInput label="Subject Module" value={dSubjMod} onChange={setDSubjMod} />
              </div>
              <NumberField
                label="Vocabulary / Formula Count (Optional)"
                value={dFormulas}
                onChange={setDFormulas}
              />
              <div className="flex justify-between pt-4">
                <Button variant="ghost" onClick={() => setStep(getPrevStep(step))}>
                  Back
                </Button>
                <Button onClick={handleNext}>Next</Button>
              </div>
            </div>
          )}

          {/* ── STEP 7: dMAT links ────────────────────────────────────── */}
          {step === 7 && (
            <div className="space-y-3 pt-2">
              <LinksSection subject="dMAT" links={dLinks} onChange={setDLinks} />
              <div className="flex justify-between pt-4">
                <Button variant="ghost" onClick={() => setStep(getPrevStep(step))}>
                  Back
                </Button>
                <Button onClick={handleNext}>Next</Button>
              </div>
            </div>
          )}

          {/* ── STEP 8: Effort & Reflection ───────────────────────────── */}
          {step === 8 && (
            <div className="space-y-4 pt-2">
              {didNothing ? (
                <>
                  <Label>What got in the way?</Label>
                  <Textarea
                    value={skipReason}
                    onChange={(e) => setSkipReason(e.target.value)}
                    rows={3}
                    placeholder="Optional — no pressure."
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
                <Button variant="ghost" onClick={() => setStep(getPrevStep(step))}>
                  Back
                </Button>
                <Button
                  onClick={submit}
                  disabled={saving}
                  className="bg-brand text-brand-foreground hover:bg-brand/90"
                >
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Complete check-in
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
