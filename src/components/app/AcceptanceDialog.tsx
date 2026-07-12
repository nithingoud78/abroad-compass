import { motion } from "framer-motion";
import { Sparkles, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useStudentProfile } from "@/hooks/use-student-profile";
import { scoreAcceptance, BAND_LABEL, BAND_TONE, type UniversityForCheck } from "@/lib/acceptance";
import { useState, useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getUniversityRecommendation } from "@/lib/ai/ai.functions";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export function AcceptanceDialog({
  open,
  onOpenChange,
  university,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  university: UniversityForCheck | null;
}) {
  const { profile, loading } = useStudentProfile();
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const getRecommendation = useServerFn(getUniversityRecommendation);

  const result = university && profile ? scoreAcceptance(profile, university) : null;

  useEffect(() => {
    if (!open) {
      setAiAnalysis(null);
      setAnalyzing(false);
    }
  }, [open]);

  async function handleAnalyze() {
    if (!university) return;
    setAnalyzing(true);
    try {
      const res = await getRecommendation({
        data: {
          universityName: university.name,
          course: university.course ?? "",
          cgpa: university.cgpa_required?.toString(),
          userProfile: profile,
        },
      });
      setAiAnalysis(res.recommendation);
    } catch (e) {
      console.error(e);
    } finally {
      setAnalyzing(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-xl flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-brand" />
            Acceptance Chance
          </DialogTitle>
        </DialogHeader>
        {loading || !university || !profile || !result ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Crunching your profile…</p>
        ) : (
          <div className="space-y-5 pt-2">
            <div>
              <p className="text-sm text-muted-foreground">{university.name}</p>
              <p className="font-display text-base">{university.course ?? "—"}</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Badge
                  className={`border ${BAND_TONE[result.band]} px-3 py-1 text-sm font-semibold`}
                  variant="outline"
                >
                  {BAND_LABEL[result.band]}
                </Badge>
                <span className="font-display text-2xl font-bold">
                  {result.score}
                  <span className="text-sm text-muted-foreground">/100</span>
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${result.score}%` }}
                  transition={{ duration: 0.7, ease: "easeOut" }}
                  className="h-full bg-brand"
                />
              </div>
            </div>

            {result.strengths.length > 0 && (
              <Section
                icon={<CheckCircle2 className="h-4 w-4 text-emerald-600" />}
                title="Strengths"
              >
                {result.strengths.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </Section>
            )}
            {result.weaknesses.length > 0 && (
              <Section
                icon={<AlertTriangle className="h-4 w-4 text-amber-600" />}
                title="Weak areas"
              >
                {result.weaknesses.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </Section>
            )}
            {result.missing.length > 0 && (
              <Section
                icon={<XCircle className="h-4 w-4 text-rose-600" />}
                title="Missing requirements"
              >
                {result.missing.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </Section>
            )}

            <div className="pt-2">
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={handleAnalyze}
                disabled={analyzing || aiAnalysis !== null}
              >
                {analyzing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4 text-brand" />
                )}
                {aiAnalysis ? "Analysis Completed" : "Admission Analysis"}
              </Button>
            </div>

            {aiAnalysis && (
              <div className="rounded-xl border bg-brand/5 p-4 text-sm text-foreground">
                <div className="mb-2 flex items-center gap-2 font-semibold text-brand">
                  <Sparkles className="h-4 w-4" /> Smart Insight
                </div>
                <p className="leading-relaxed">{aiAnalysis}</p>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border bg-muted/30 p-3">
      <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
        {icon}
        {title}
      </div>
      <ul className="ml-6 list-disc space-y-1 text-sm text-muted-foreground">{children}</ul>
    </div>
  );
}
