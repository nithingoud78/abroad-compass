import { motion } from "framer-motion";
import { X, Trophy, Minus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type Uni = {
  id: string;
  name: string;
  city: string | null;
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
  // direction: best is "low" (smaller wins), "high" (bigger wins), or "bool" (true wins), or null (no compare)
  direction: "low" | "high" | "bool" | null;
  fmt?: (v: unknown) => string;
};

const eur = (v: unknown) => (v == null ? "—" : `€${Number(v).toLocaleString()}`);
const num = (v: unknown) => (v == null ? "—" : String(v));
const bool = (v: unknown) => (v ? "Yes" : "No");
const date = (v: unknown) => (v ? new Date(String(v)).toLocaleDateString() : "—");

const FIELDS: Field[] = [
  { key: "city", label: "Location", direction: null, fmt: (v) => String(v ?? "—") },
  { key: "qs_ranking", label: "QS Ranking", direction: "low", fmt: num },
  { key: "course", label: "Course", direction: null, fmt: (v) => String(v ?? "—") },
  { key: "course_duration_months", label: "Duration (months)", direction: "low", fmt: num },
  { key: "cgpa_required", label: "CGPA required", direction: "low", fmt: num },
  { key: "ects_required", label: "ECTS required", direction: "low", fmt: num },
  {
    key: "english_requirement",
    label: "English req.",
    direction: null,
    fmt: (v) => String(v ?? "—"),
  },
  {
    key: "german_requirement",
    label: "German req.",
    direction: null,
    fmt: (v) => String(v ?? "—"),
  },
  { key: "tuition_fee_eur", label: "Tuition / yr", direction: "low", fmt: eur },
  { key: "semester_fee_eur", label: "Semester fee", direction: "low", fmt: eur },
  { key: "application_fee_eur", label: "Application fee", direction: "low", fmt: eur },
  { key: "living_cost_eur", label: "Living cost / mo", direction: "low", fmt: eur },
  { key: "estimated_earnings_eur", label: "Est. earnings / mo", direction: "high", fmt: eur },
  { key: "scholarship", label: "Scholarship", direction: "bool", fmt: bool },
  { key: "internship", label: "Internship", direction: "bool", fmt: bool },
  { key: "part_time", label: "Part-time", direction: "bool", fmt: bool },
  { key: "aps_required", label: "APS required", direction: null, fmt: bool },
  { key: "uni_assist", label: "Uni-Assist", direction: null, fmt: bool },
  { key: "public_private", label: "Type", direction: null, fmt: (v) => String(v ?? "—") },
  { key: "deadline", label: "Deadline", direction: null, fmt: date },
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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Side-by-side comparison</DialogTitle>
        </DialogHeader>
        {universities.length < 2 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Select at least two universities to compare.
          </p>
        ) : (
          <div className="max-h-[70vh] overflow-auto">
            <table className="w-full border-separate border-spacing-0 text-sm">
              <thead className="sticky top-0 z-10 bg-card">
                <tr>
                  <th className="border-b p-3 text-left font-medium text-muted-foreground">
                    Field
                  </th>
                  {universities.map((u) => (
                    <th key={u.id} className="border-b p-3 text-left">
                      <div className="font-display text-base font-semibold">{u.name}</div>
                      <div className="text-xs text-muted-foreground">{u.country ?? "—"}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {FIELDS.map((f) => {
                  const raw = universities.map((u) => u[f.key] as number | boolean | null);
                  const best = bestIndices(raw, f.direction);
                  const worst = worstIndices(raw, f.direction);
                  return (
                    <motion.tr
                      key={f.key}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <td className="border-b p-3 font-medium text-muted-foreground">{f.label}</td>
                      {universities.map((u, i) => {
                        const value = f.fmt ? f.fmt(u[f.key]) : String(u[f.key] ?? "—");
                        const tone = best.has(i)
                          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                          : worst.has(i)
                            ? "bg-rose-500/10 text-rose-700 dark:text-rose-300"
                            : f.direction
                              ? "bg-amber-500/5"
                              : "";
                        return (
                          <td key={u.id} className={`border-b p-3 ${tone}`}>
                            <div className="flex items-center gap-1.5">
                              {best.has(i) && <Trophy className="h-3.5 w-3.5 text-emerald-600" />}
                              {worst.has(i) && <Minus className="h-3.5 w-3.5 text-rose-600" />}
                              <span>{value}</span>
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
        )}
        <div className="flex justify-end pt-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            <X className="mr-2 h-4 w-4" />
            Close
          </Button>
        </div>
        {universities.length >= 2 && (
          <p className="text-xs text-muted-foreground">
            <Badge variant="secondary" className="mr-2">
              Green
            </Badge>
            best value
            <Badge variant="secondary" className="mx-2">
              Amber
            </Badge>
            middle
            <Badge variant="secondary" className="ml-2">
              Red
            </Badge>
            weakest
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
