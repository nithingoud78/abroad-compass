import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Lock, ExternalLink, Calendar as CalendarIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useServerFn } from "@tanstack/react-start";
import { getCheckinAnalysis } from "@/lib/ai/ai.functions";
import { Loader2, Sparkles } from "lucide-react";
import { StandardPageLayout } from "@/components/app/StandardPageLayout";

export const Route = createFileRoute("/_authenticated/check-in")({
  head: () => ({ meta: [{ title: "Daily Check-in — Abroad Compass" }] }),
  component: CheckInHistory,
});

// ─── Types ────────────────────────────────────────────────────────────────────

type Checkin = {
  id: string;
  checkin_date: string;
  learned: boolean;
  study_duration_minutes: number | null;
  words_learned: number | null;
  effort: number | null;
  reflection: string | null;
  ai_notes: string | null;
  skip_reason: string | null;
};

type DailyProgress = {
  checkin_date: string;
  // German
  german_listening_min: number | null;
  german_reading_min: number | null;
  german_writing_min: number | null;
  german_speaking_min: number | null;
  german_vocab: number | null;
  german_duolingo_lessons: number | null;
  // IELTS
  ielts_listening_hours: number | null;
  ielts_reading_hours: number | null;
  ielts_writing_hours: number | null;
  ielts_speaking_hours: number | null;
  ielts_vocab_count: number | null;
  ielts_mock_taken: boolean | null;
  ielts_mock_listening: number | null;
  ielts_mock_reading: number | null;
  ielts_mock_writing: number | null;
  ielts_mock_speaking: number | null;
  ielts_mock_overall: number | null;
  // dMAT
  dmat_figure_sequence_min: number | null;
  dmat_math_equations_min: number | null;
  dmat_latin_squares_min: number | null;
  dmat_subject_module_min: number | null;
  dmat_formula_count: number | null;
};

type LinkRow = {
  id: string;
  checkin_id: string | null;
  title: string;
  url: string;
  source: string | null;
  link_date: string;
  subject: string | null;
  user_summary: string | null;
  duration_minutes: number | null;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function minToHms(totalMin: number | null): string {
  if (!totalMin || totalMin <= 0) return "—";
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function hoursToHms(hours: number | null): string {
  if (!hours || hours <= 0) return "—";
  return minToHms(Math.round(hours * 60));
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ProgressRow({ label, value }: { label: string; value: string }) {
  if (value === "—") return null;
  return (
    <div className="flex justify-between text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function SectionBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-md border p-3 space-y-1.5">
      <p className="text-xs font-semibold text-brand uppercase tracking-wide">{title}</p>
      {children}
    </div>
  );
}

function LinksBlock({ links }: { links: LinkRow[] }) {
  if (links.length === 0) return null;
  return (
    <div className="space-y-1.5">
      {links.map((l) => (
        <a
          key={l.id}
          href={l.url}
          target="_blank"
          rel="noreferrer"
          className="flex items-start justify-between rounded-md border p-2 text-sm hover:bg-muted/40 gap-2"
        >
          <div className="min-w-0">
            <p className="font-medium truncate">{l.title || l.url}</p>
            {l.source && (
              <p className="text-xs text-muted-foreground">
                {l.source}
                {l.duration_minutes ? ` · ${l.duration_minutes}m` : ""}
              </p>
            )}
            {l.user_summary && (
              <p className="text-xs text-muted-foreground mt-0.5 italic">{l.user_summary}</p>
            )}
          </div>
          <ExternalLink className="h-3 w-3 text-muted-foreground shrink-0 mt-0.5" />
        </a>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

function CheckInHistory() {
  const { user } = useAuth();
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [progress, setProgress] = useState<DailyProgress[]>([]);
  const [links, setLinks] = useState<LinkRow[]>([]);

  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const analyzeFn = useServerFn(getCheckinAnalysis);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase
        .from("daily_checkins")
        .select("*")
        .eq("user_id", user.id)
        .order("checkin_date", { ascending: false })
        .limit(30),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase.from as any)("daily_progress")
        .select("*")
        .eq("user_id", user.id)
        .order("checkin_date", { ascending: false })
        .limit(30),
      supabase
        .from("learning_links")
        .select("id,checkin_id,title,url,source,link_date,subject,user_summary,duration_minutes")
        .eq("user_id", user.id)
        .order("link_date", { ascending: false })
        .limit(200),
    ]).then(([c, p, l]) => {
      setCheckins(c.data ?? []);
      setProgress(p.data ?? []);
      setLinks(l.data ?? []);
    });
  }, [user]);

  const today = format(new Date(), "yyyy-MM-dd");

  async function handleAnalyze() {
    setAnalyzing(true);
    try {
      const res = await analyzeFn({ data: { checkins: checkins.slice(0, 7) } });
      setAiAnalysis(res.analysis);
    } catch (e) {
      console.error(e);
    } finally {
      setAnalyzing(false);
    }
  }

  return (
    <StandardPageLayout title="Daily Check-in" subtitle="Your learning trail">
      <div className="-mt-4 text-sm text-muted-foreground">
        Past entries are locked and read-only. Links remain clickable.
      </div>

      {checkins.length > 0 && (
        <div className="flex justify-end">
          <Button
            variant="secondary"
            className="gap-2 bg-brand/10 text-brand hover:bg-brand/20"
            onClick={handleAnalyze}
            disabled={analyzing || aiAnalysis !== null}
          >
            {analyzing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {aiAnalysis ? "AI Coach Feedback Ready" : "Get AI Coach Feedback"}
          </Button>
        </div>
      )}

      {aiAnalysis && (
        <div className="rounded-xl border bg-brand/5 p-5 text-sm text-foreground">
          <div className="mb-3 flex items-center gap-2 font-display text-lg font-semibold text-brand">
            <Sparkles className="h-5 w-5" /> Your AI Language Coach
          </div>
          <p className="leading-relaxed">{aiAnalysis}</p>
        </div>
      )}

      {checkins.length === 0 && (
        <Card className="shadow-card">
          <CardContent className="p-10 text-center text-sm text-muted-foreground">
            No check-ins yet. The daily check-in opens automatically once per day.{" "}
            <Link to="/dashboard" className="text-foreground underline">
              Back to dashboard
            </Link>
            .
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {checkins.map((c) => {
          const locked = c.checkin_date !== today;
          const prog = progress.find((p) => p.checkin_date === c.checkin_date);
          const dateLinks = links.filter(
            (l) => l.link_date === c.checkin_date || l.checkin_id === c.id,
          );

          const germanLinks = dateLinks.filter(
            (l) => l.subject === "german" || (!l.subject && l.link_date === c.checkin_date),
          );
          const ieltsLinks = dateLinks.filter((l) => l.subject === "ielts");
          const dmatLinks = dateLinks.filter((l) => l.subject === "dmat");

          // Detect what was studied
          const hasGerman = prog
            ? (prog.german_listening_min ?? 0) +
                (prog.german_reading_min ?? 0) +
                (prog.german_writing_min ?? 0) +
                (prog.german_speaking_min ?? 0) >
                0 || (prog.german_vocab ?? 0) > 0
            : false;
          const hasIelts = prog
            ? (prog.ielts_listening_hours ?? 0) +
                (prog.ielts_reading_hours ?? 0) +
                (prog.ielts_writing_hours ?? 0) +
                (prog.ielts_speaking_hours ?? 0) >
              0
            : false;
          const hasDmat = prog
            ? (prog.dmat_figure_sequence_min ?? 0) +
                (prog.dmat_math_equations_min ?? 0) +
                (prog.dmat_latin_squares_min ?? 0) +
                (prog.dmat_subject_module_min ?? 0) >
              0
            : false;

          return (
            <Card key={c.id} className="shadow-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4" />{" "}
                    {format(new Date(c.checkin_date), "EEEE, MMM d, yyyy")}
                  </CardTitle>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {c.learned ? "Studied" : "Rest Day"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {c.effort ? <Badge variant="secondary">Effort {c.effort}/10</Badge> : null}
                  {locked && (
                    <Badge variant="secondary" className="gap-1">
                      <Lock className="h-3 w-3" /> Locked
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                {c.learned ? (
                  <>
                    {/* ── German ─────────────────────────────────────── */}
                    {(hasGerman || germanLinks.length > 0) && (
                      <SectionBlock title="German">
                        {prog && (
                          <>
                            <ProgressRow
                              label="Listening"
                              value={minToHms(prog.german_listening_min)}
                            />
                            <ProgressRow
                              label="Reading"
                              value={minToHms(prog.german_reading_min)}
                            />
                            <ProgressRow
                              label="Writing"
                              value={minToHms(prog.german_writing_min)}
                            />
                            <ProgressRow
                              label="Speaking"
                              value={minToHms(prog.german_speaking_min)}
                            />
                            <ProgressRow
                              label="Vocabulary learned"
                              value={prog.german_vocab ? `${prog.german_vocab} words` : "—"}
                            />
                            <ProgressRow
                              label="Duolingo lessons"
                              value={
                                prog.german_duolingo_lessons
                                  ? `${prog.german_duolingo_lessons}`
                                  : "—"
                              }
                            />
                          </>
                        )}
                        {germanLinks.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs text-muted-foreground mb-1">Links</p>
                            <LinksBlock links={germanLinks} />
                          </div>
                        )}
                      </SectionBlock>
                    )}

                    {/* ── IELTS ──────────────────────────────────────── */}
                    {(hasIelts || ieltsLinks.length > 0) && (
                      <SectionBlock title="IELTS">
                        {prog && (
                          <>
                            <ProgressRow
                              label="Listening"
                              value={hoursToHms(prog.ielts_listening_hours)}
                            />
                            <ProgressRow
                              label="Reading"
                              value={hoursToHms(prog.ielts_reading_hours)}
                            />
                            <ProgressRow
                              label="Writing"
                              value={hoursToHms(prog.ielts_writing_hours)}
                            />
                            <ProgressRow
                              label="Speaking"
                              value={hoursToHms(prog.ielts_speaking_hours)}
                            />
                            <ProgressRow
                              label="Vocabulary learned"
                              value={
                                prog.ielts_vocab_count ? `${prog.ielts_vocab_count} words` : "—"
                              }
                            />
                            {prog.ielts_mock_taken && (
                              <div className="mt-1 space-y-0.5">
                                <p className="text-xs font-medium">Mock Test</p>
                                <ProgressRow
                                  label="Listening"
                                  value={
                                    prog.ielts_mock_listening != null
                                      ? `${prog.ielts_mock_listening}`
                                      : "—"
                                  }
                                />
                                <ProgressRow
                                  label="Reading"
                                  value={
                                    prog.ielts_mock_reading != null
                                      ? `${prog.ielts_mock_reading}`
                                      : "—"
                                  }
                                />
                                <ProgressRow
                                  label="Writing"
                                  value={
                                    prog.ielts_mock_writing != null
                                      ? `${prog.ielts_mock_writing}`
                                      : "—"
                                  }
                                />
                                <ProgressRow
                                  label="Speaking"
                                  value={
                                    prog.ielts_mock_speaking != null
                                      ? `${prog.ielts_mock_speaking}`
                                      : "—"
                                  }
                                />
                                <ProgressRow
                                  label="Overall Band"
                                  value={
                                    prog.ielts_mock_overall != null
                                      ? `${prog.ielts_mock_overall}`
                                      : "—"
                                  }
                                />
                              </div>
                            )}
                          </>
                        )}
                        {ieltsLinks.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs text-muted-foreground mb-1">Links</p>
                            <LinksBlock links={ieltsLinks} />
                          </div>
                        )}
                      </SectionBlock>
                    )}

                    {/* ── dMAT ───────────────────────────────────────── */}
                    {(hasDmat || dmatLinks.length > 0) && (
                      <SectionBlock title="dMAT / TestAS">
                        {prog && (
                          <>
                            <ProgressRow
                              label="Figure Sequence"
                              value={minToHms(prog.dmat_figure_sequence_min)}
                            />
                            <ProgressRow
                              label="Mathematical Equations"
                              value={minToHms(prog.dmat_math_equations_min)}
                            />
                            <ProgressRow
                              label="Latin Squares"
                              value={minToHms(prog.dmat_latin_squares_min)}
                            />
                            <ProgressRow
                              label="Subject Module"
                              value={minToHms(prog.dmat_subject_module_min)}
                            />
                            <ProgressRow
                              label="Formulas reviewed"
                              value={prog.dmat_formula_count ? `${prog.dmat_formula_count}` : "—"}
                            />
                          </>
                        )}
                        {dmatLinks.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs text-muted-foreground mb-1">Links</p>
                            <LinksBlock links={dmatLinks} />
                          </div>
                        )}
                      </SectionBlock>
                    )}

                    {/* ── Reflection ─────────────────────────────────── */}
                    {c.reflection && (
                      <p className="text-sm text-muted-foreground italic">"{c.reflection}"</p>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Logged as a rest day.{c.skip_reason ? ` "${c.skip_reason}"` : ""}
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </StandardPageLayout>
  );
}
