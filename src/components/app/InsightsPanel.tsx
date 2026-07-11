import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { Lightbulb, AlertTriangle, AlertOctagon, CheckCircle2, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Insight, InsightTone } from "@/lib/insights";

const TONE: Record<InsightTone, { icon: typeof Lightbulb; cls: string }> = {
  info: { icon: Lightbulb, cls: "text-brand" },
  success: { icon: CheckCircle2, cls: "text-emerald-600 dark:text-emerald-400" },
  warning: { icon: AlertTriangle, cls: "text-amber-600 dark:text-amber-400" },
  danger: { icon: AlertOctagon, cls: "text-rose-600 dark:text-rose-400" },
};

export function InsightsPanel({ insights }: { insights: Insight[] }) {
  return (
    <Card className="shadow-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 font-display text-base">
          <Lightbulb className="h-4 w-4 text-brand" /> Smart insights
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {insights.length === 0 ? (
          <p className="py-2 text-sm text-muted-foreground">
            No insights yet — keep using the app and check back.
          </p>
        ) : (
          insights.slice(0, 6).map((i, idx) => {
            const Icon = TONE[i.tone].icon;
            const body = (
              <div className="flex items-start gap-2.5 rounded-xl border bg-muted/30 p-3">
                <Icon className={`mt-0.5 h-4 w-4 flex-shrink-0 ${TONE[i.tone].cls}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium leading-snug">{i.title}</p>
                  <p className="text-xs text-muted-foreground">{i.body}</p>
                </div>
                {i.link && (
                  <ArrowRight className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
                )}
              </div>
            );
            return (
              <motion.div
                key={i.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
              >
                {i.link ? <Link to={i.link}>{body}</Link> : body}
              </motion.div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
