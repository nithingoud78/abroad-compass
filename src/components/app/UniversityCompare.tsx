/* eslint-disable @typescript-eslint/no-explicit-any */
import { motion } from "framer-motion";
import {
  X,
  Trophy,
  Minus,
  Sparkles,
  Loader2,
  CheckCircle,
  XCircle,
  Info,
  ExternalLink,
  Building2,
  MapPin,
  CalendarDays,
  Globe2,
  GraduationCap,
  Banknote,
  Coins,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getUniversityComparison } from "@/lib/ai/ai.functions";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

type Uni = {
  id: string;
  name: string;
  city: string | null;
  state?: string | null;
  country: string | null;
  qs_ranking: number | null;
  course: string | null;
  course_duration_months: number | null;
  cgpa_required: number | null;
  ects_required: number | null;
  english_requirement: string | null;
  german_requirement: string | null;
  application_fee_eur: number | null;
  tuition_fee_eur: number | null;
  semester_fee_eur: number | null;
  living_cost_eur: number | null;
  estimated_earnings_eur: number | null;
  public_private: string | null;
  scholarship: boolean | null;
  internship: boolean | null;
  part_time: boolean | null;
  aps_required: boolean | null;
  uni_assist: boolean | null;
  deadline: string | null;
  acceptance_chance: string | null;
};

type Field = {
  key: keyof Uni;
  label: string;
  direction: "low" | "high" | "bool" | null;
  fmt?: (v: unknown) => string;
};

const eur = (v: unknown) => (v == null ? "—" : `€${Number(v).toLocaleString()}`);
const num = (v: unknown) => (v == null ? "—" : String(v));
const bool = (v: unknown) => (v ? "Yes" : "No");
const date = (v: unknown) => (v ? new Date(String(v)).toLocaleDateString() : "—");

// Fields not explicitly put in the header card
const FIELDS: Field[] = [
  { key: "course", label: "Course", direction: null, fmt: (v) => String(v ?? "—") },
  { key: "course_duration_months", label: "Duration (months)", direction: "low", fmt: num },
  { key: "cgpa_required", label: "CGPA required", direction: "low", fmt: num },
  { key: "ects_required", label: "ECTS required", direction: "low", fmt: num },
  { key: "application_fee_eur", label: "Application fee", direction: "low", fmt: eur },
  { key: "living_cost_eur", label: "Living cost / mo", direction: "low", fmt: eur },
  { key: "estimated_earnings_eur", label: "Est. earnings / mo", direction: "high", fmt: eur },
  { key: "scholarship", label: "Scholarship", direction: "bool", fmt: bool },
  { key: "internship", label: "Internship", direction: "bool", fmt: bool },
  { key: "part_time", label: "Part-time", direction: "bool", fmt: bool },
  { key: "aps_required", label: "APS required", direction: null, fmt: bool },
  { key: "uni_assist", label: "Uni-Assist", direction: null, fmt: bool },
  { key: "public_private", label: "Type", direction: null, fmt: (v) => String(v ?? "—") },
];

function bestIndices(values: (number | boolean | null)[], dir: Field["direction"]): Set<number> {
  if (!dir) return new Set();
  const filled = values.map((v, i) => ({ v, i })).filter((x) => x.v != null);
  if (filled.length < 2) return new Set();
  if (dir === "bool") {
    const trues = filled.filter((x) => x.v === true);
    return new Set(trues.map((x) => x.i));
  }
  const nums = filled.map((x) => ({ ...x, n: Number(x.v) })).filter((x) => !Number.isNaN(x.n));
  if (nums.length < 2) return new Set();
  const best =
    dir === "low" ? Math.min(...nums.map((x) => x.n)) : Math.max(...nums.map((x) => x.n));
  return new Set(nums.filter((x) => x.n === best).map((x) => x.i));
}

function worstIndices(values: (number | boolean | null)[], dir: Field["direction"]): Set<number> {
  if (!dir || dir === "bool") return new Set();
  const nums = values
    .map((v, i) => ({ v, i, n: Number(v) }))
    .filter((x) => x.v != null && !Number.isNaN(x.n));
  if (nums.length < 2) return new Set();
  const worst =
    dir === "low" ? Math.max(...nums.map((x) => x.n)) : Math.min(...nums.map((x) => x.n));
  return new Set(nums.filter((x) => x.n === worst).map((x) => x.i));
}

export function UniversityCompare({
  open,
  onOpenChange,
  universities,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  universities: Uni[];
}) {
  const [aiData, setAiData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const compareFn = useServerFn(getUniversityComparison);
  const dash = useDashboardData();

  async function generateSmartComparison() {
    if (universities.length < 2) return;
    setLoading(true);
    try {
      const res = await compareFn({
        data: {
          universities: universities.slice(0, 2),
          userProfile: dash.profile,
        },
      });
      if (res.error) {
        toast.error(res.error);
      } else {
        setAiData(res.analysis);
      }
    } catch (error: unknown) {
      console.error(error);
      toast.error("Failed to generate AI comparison. Check configuration.");
    } finally {
      setLoading(false);
    }
  }

  const formatLocation = (u: Uni) => {
    const parts = [u.city, u.state, u.country].filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : "—";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[92vw] 2xl:max-w-[1400px] w-full max-h-[90vh] flex flex-col overflow-hidden p-0 gap-0">
        <DialogHeader className="px-6 py-5 border-b shrink-0 flex flex-row items-center justify-between">
          <div>
            <DialogTitle className="font-display text-2xl mb-1">University Comparison</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Compare your selected universities side-by-side to find your best fit.
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            className="rounded-full shrink-0 h-8 w-8"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
        </DialogHeader>

        {universities.length < 2 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
              <Building2 className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-lg font-medium">Not enough selections</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              Please select at least two universities from your shortlist to compare them
              side-by-side.
            </p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto bg-muted/10">
            <div className="p-6 space-y-8 max-w-full mx-auto">
              {/* Header Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:flex lg:flex-row gap-6">
                {universities.map((u) => (
                  <Card
                    key={u.id}
                    className="flex-1 shadow-sm overflow-hidden flex flex-col h-full border-border/60"
                  >
                    <div className="h-16 bg-gradient-to-r from-brand/10 to-transparent w-full" />
                    <CardContent className="pt-0 px-6 pb-6 flex-1 flex flex-col">
                      <div className="-mt-8 h-16 w-16 bg-background border rounded-xl shadow-sm flex items-center justify-center mb-4">
                        <Building2 className="h-8 w-8 text-brand/60" />
                      </div>

                      <div className="mb-4">
                        <h3 className="font-display text-xl font-semibold leading-tight mb-1.5">
                          {u.name}
                        </h3>
                        <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 shrink-0" />
                          {formatLocation(u)}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-sm mt-auto border-t pt-4">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                            <Trophy className="h-3 w-3" /> QS Ranking
                          </p>
                          <p className="font-medium">{u.qs_ranking ?? "—"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                            <CalendarDays className="h-3 w-3" /> Deadline
                          </p>
                          <p className="font-medium">{date(u.deadline)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                            <Banknote className="h-3 w-3" /> Tuition / yr
                          </p>
                          <p className="font-medium">{eur(u.tuition_fee_eur)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                            <Coins className="h-3 w-3" /> Semester fee
                          </p>
                          <p className="font-medium">{eur(u.semester_fee_eur)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                            <Globe2 className="h-3 w-3" /> English Req
                          </p>
                          <p className="font-medium">{u.english_requirement ?? "—"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                            <GraduationCap className="h-3 w-3" /> German Req
                          </p>
                          <p className="font-medium">{u.german_requirement ?? "—"}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Legend */}
              <div className="flex items-center gap-3">
                <Badge
                  variant="secondary"
                  className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10 shadow-none border-emerald-500/20"
                >
                  <Trophy className="h-3 w-3 mr-1.5 text-emerald-600" /> Best Value
                </Badge>
                <Badge
                  variant="secondary"
                  className="bg-amber-500/10 text-amber-700 dark:text-amber-500 hover:bg-amber-500/10 shadow-none border-amber-500/20"
                >
                  Neutral
                </Badge>
                <Badge
                  variant="secondary"
                  className="bg-rose-500/10 text-rose-700 dark:text-rose-300 hover:bg-rose-500/10 shadow-none border-rose-500/20"
                >
                  <Minus className="h-3 w-3 mr-1.5 text-rose-600" /> Weakest
                </Badge>
              </div>

              {/* Comparison Table */}
              <div className="border rounded-xl shadow-sm overflow-x-auto bg-card">
                <table className="w-full text-sm">
                  <tbody>
                    {FIELDS.map((f, rowIdx) => {
                      const raw = universities.map((u) => u[f.key] as number | boolean | null);
                      const best = bestIndices(raw, f.direction);
                      const worst = worstIndices(raw, f.direction);
                      const isEven = rowIdx % 2 === 0;

                      return (
                        <motion.tr
                          key={f.key}
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2, delay: rowIdx * 0.02 }}
                          className={`group ${isEven ? "bg-muted/30" : "bg-transparent"} hover:bg-muted/60 transition-colors border-b last:border-0`}
                        >
                          <td className="sticky left-0 z-10 px-6 py-4 font-medium text-muted-foreground w-48 shrink-0 bg-inherit whitespace-nowrap border-r">
                            {f.label}
                          </td>
                          {universities.map((u, i) => {
                            const value = f.fmt ? f.fmt(u[f.key]) : String(u[f.key] ?? "—");
                            const isBest = best.has(i);
                            const isWorst = worst.has(i);

                            const tone = isBest
                              ? "bg-emerald-500/5 text-emerald-800 dark:text-emerald-200"
                              : isWorst
                                ? "bg-rose-500/5 text-rose-800 dark:text-rose-200"
                                : f.direction
                                  ? "bg-amber-500/5 text-foreground"
                                  : "text-foreground";

                            return (
                              <td
                                key={u.id}
                                className={`px-6 py-4 border-r last:border-r-0 min-w-[200px] lg:min-w-[300px] ${tone}`}
                              >
                                <div className="flex items-center gap-2">
                                  {isBest && (
                                    <Trophy className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                                  )}
                                  {isWorst && (
                                    <Minus className="h-3.5 w-3.5 shrink-0 text-rose-600" />
                                  )}
                                  <span className={isBest || isWorst ? "font-medium" : ""}>
                                    {value}
                                  </span>
                                </div>
                              </td>
                            );
                          })}
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* AI Comparison */}
              {aiData && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6 pt-4"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <Sparkles className="h-6 w-6 text-brand" />
                    <h3 className="font-display text-2xl font-semibold">Smart AI Comparison</h3>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Overview */}
                    <Card className="md:col-span-2 border-brand/20 bg-brand/5 shadow-sm">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center justify-between">
                          <span>Profile Match & Recommendation</span>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground font-normal">
                            <span>Confidence</span>
                            <Progress value={aiData.confidence} className="w-24 h-2" />
                            <span className="font-medium text-foreground">
                              {aiData.confidence}%
                            </span>
                          </div>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <p className="font-medium text-brand mb-1">Better Match</p>
                          <p className="text-sm leading-relaxed">{aiData.betterMatch}</p>
                        </div>
                        <div>
                          <p className="font-medium text-brand mb-1">Final Recommendation</p>
                          <p className="text-sm leading-relaxed">{aiData.recommendation}</p>
                        </div>
                      </CardContent>
                    </Card>

                    {/* University A */}
                    <Card>
                      <CardHeader className="pb-3 border-b">
                        <CardTitle className="text-base truncate">
                          {universities[0]?.name}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4 space-y-4">
                        <div>
                          <p className="text-sm font-semibold flex items-center gap-1.5 text-emerald-600 mb-2">
                            <CheckCircle className="h-4 w-4" /> Pros
                          </p>
                          <ul className="space-y-1">
                            {aiData.prosA?.map((p: string, i: number) => (
                              <li key={i} className="text-xs text-muted-foreground flex gap-1.5">
                                <span className="text-emerald-500">•</span> {p}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p className="text-sm font-semibold flex items-center gap-1.5 text-rose-600 mb-2">
                            <XCircle className="h-4 w-4" /> Cons
                          </p>
                          <ul className="space-y-1">
                            {aiData.consA?.map((c: string, i: number) => (
                              <li key={i} className="text-xs text-muted-foreground flex gap-1.5">
                                <span className="text-rose-500">•</span> {c}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="pt-2 border-t">
                          <p className="text-xs font-semibold text-muted-foreground mb-1">
                            Ideal Candidate
                          </p>
                          <p className="text-xs leading-relaxed">{aiData.studentAProfile}</p>
                        </div>
                      </CardContent>
                    </Card>

                    {/* University B */}
                    <Card>
                      <CardHeader className="pb-3 border-b">
                        <CardTitle className="text-base truncate">
                          {universities[1]?.name}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4 space-y-4">
                        <div>
                          <p className="text-sm font-semibold flex items-center gap-1.5 text-emerald-600 mb-2">
                            <CheckCircle className="h-4 w-4" /> Pros
                          </p>
                          <ul className="space-y-1">
                            {aiData.prosB?.map((p: string, i: number) => (
                              <li key={i} className="text-xs text-muted-foreground flex gap-1.5">
                                <span className="text-emerald-500">•</span> {p}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p className="text-sm font-semibold flex items-center gap-1.5 text-rose-600 mb-2">
                            <XCircle className="h-4 w-4" /> Cons
                          </p>
                          <ul className="space-y-1">
                            {aiData.consB?.map((c: string, i: number) => (
                              <li key={i} className="text-xs text-muted-foreground flex gap-1.5">
                                <span className="text-rose-500">•</span> {c}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="pt-2 border-t">
                          <p className="text-xs font-semibold text-muted-foreground mb-1">
                            Ideal Candidate
                          </p>
                          <p className="text-xs leading-relaxed">{aiData.studentBProfile}</p>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Detailed Differences */}
                    <Card className="md:col-span-2">
                      <CardHeader>
                        <CardTitle className="text-lg">Detailed Differences</CardTitle>
                      </CardHeader>
                      <CardContent className="grid sm:grid-cols-2 gap-x-8 gap-y-6">
                        <div>
                          <p className="text-sm font-medium mb-1">Admission Competitiveness</p>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {aiData.competitiveness}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium mb-1">Curriculum</p>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {aiData.curriculum}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium mb-1">Research Opportunities</p>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {aiData.research}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium mb-1">Internship Ecosystem</p>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {aiData.internship}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium mb-1">Cost & Budget</p>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {aiData.cost}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium mb-1">Living & Job Opportunities</p>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {aiData.living} {aiData.jobs}
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Sources */}
                    <div className="md:col-span-2 bg-muted/30 p-4 rounded-lg flex gap-3 items-start border">
                      <Info className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium mb-2">Sources & Verification</p>
                        <div className="flex flex-wrap gap-2">
                          {aiData.sources?.map((s: string, i: number) => (
                            <Badge key={i} variant="outline" className="text-[10px] bg-background">
                              <ExternalLink className="h-3 w-3 mr-1" />
                              {s}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="shrink-0 p-4 border-t bg-card/95 backdrop-blur flex justify-end gap-3 z-20">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={generateSmartComparison}
            disabled={loading || universities.length < 2}
            className="bg-brand text-brand-foreground hover:bg-brand/90 gap-2 shadow-sm"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Generate Smart AI Comparison
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
