import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { reviewDocumentText } from "@/lib/ai/ai.functions";
import { AI_MODELS } from "@/lib/ai/models";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/app/EmptyState";
import { FileText, Sparkles, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";

export const Route = createFileRoute("/_authenticated/assistant/review")({
  head: () => ({
    meta: [
      { title: "Document Review — Abroad Compass" },
      {
        name: "description",
        content: "AI-powered review for SOP, LOR, CV and academic documents.",
      },
    ],
  }),
  component: DocReviewPage,
});

const KINDS = [
  { key: "cv", label: "CV / Resume" },
  { key: "sop", label: "SOP" },
  { key: "lor", label: "LOR" },
  { key: "motivation", label: "Motivation letter" },
  { key: "transcript", label: "Transcript" },
  { key: "project", label: "Project report" },
  { key: "certificate", label: "Certificate" },
  { key: "research", label: "Research paper" },
] as const;

type Kind = (typeof KINDS)[number]["key"];

type ReviewFeedback = {
  score?: number;
  summary?: string;
  grammar?: string[];
  ats?: string[];
  missing?: string[];
  suggestions?: string[];
};

type ReviewRow = {
  id: string;
  document_id: string | null;
  score: number | null;
  summary: string | null;
  feedback: ReviewFeedback | null;
  model: string | null;
  created_at: string;
};

function DocReviewPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const reviewFn = useServerFn(reviewDocumentText);

  const [kind, setKind] = useState<Kind>("cv");
  const [text, setText] = useState("");
  const [model, setModel] = useState<string>(AI_MODELS.balanced);

  const docsQ = useQuery({
    queryKey: ["documents-for-review", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("documents")
        .select("id, name, category")
        .order("created_at", { ascending: false })
        .limit(50);
      return (data ?? []) as Array<{ id: string; name: string; category: string }>;
    },
  });

  const reviewsQ = useQuery({
    queryKey: ["document-reviews", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("document_reviews")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      return (data ?? []) as unknown as ReviewRow[];
    },
  });

  const [documentId, setDocumentId] = useState<string>("");

  const reviewMut = useMutation({
    mutationFn: async () => {
      if (!documentId) {
        // Create a placeholder document so the review has a target.
        const { data, error } = await supabase
          .from("documents")
          .insert({
            user_id: user!.id,
            name: `${kind.toUpperCase()} draft ${new Date().toLocaleDateString()}`,
            category: kind,
          })
          .select("id")
          .single();
        if (error) throw error;
        return reviewFn({ data: { documentId: data.id, text, kind, model } });
      }
      return reviewFn({ data: { documentId, text, kind, model } });
    },

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["document-reviews"] });
      qc.invalidateQueries({ queryKey: ["documents-for-review"] });
      toast.success("Review complete");
      setText("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <header>
        <h1 className="font-display text-3xl font-bold tracking-tight flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-brand" /> Document Review
        </h1>
        <p className="text-sm text-muted-foreground">
          Paste an SOP, LOR, CV or research abstract to get an AI review with score, grammar issues,
          ATS tips, and missing sections.
        </p>
      </header>

      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" /> Submit for review
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <Label>Document type</Label>
                <Select value={kind} onValueChange={(v) => setKind(v as Kind)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {KINDS.map((k) => (
                      <SelectItem key={k.key} value={k.key}>
                        {k.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2">
                <Label>Existing document (optional)</Label>
                <Select
                  value={documentId || "__new"}
                  onValueChange={(v) => setDocumentId(v === "__new" ? "" : v)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__new">— Create new document —</SelectItem>
                    {(docsQ.data ?? []).map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name} · {d.category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="review-text">Content</Label>
              <Textarea
                id="review-text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={16}
                placeholder="Paste your document text (minimum 20 characters, max 50 000 characters)…"
                className="mt-1 font-mono text-xs"
                maxLength={50000}
              />
              <p className="mt-1 text-[11px] text-muted-foreground">
                {text.length.toLocaleString()} / 50 000 characters
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Select value={model} onValueChange={setModel}>
                <SelectTrigger className="w-[240px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={AI_MODELS.fast}>Gemini 3 Flash</SelectItem>
                  <SelectItem value={AI_MODELS.balanced}>Gemini 2.5 Flash</SelectItem>
                  <SelectItem value={AI_MODELS.pro}>Gemini 2.5 Pro (recommended)</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={() => reviewMut.mutate()}
                disabled={text.trim().length < 20 || reviewMut.isPending}
              >
                {reviewMut.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-4 w-4" />
                )}
                Review document
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent reviews</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {reviewsQ.isLoading ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Loading…</p>
            ) : (reviewsQ.data ?? []).length === 0 ? (
              <EmptyState
                icon={FileText}
                title="No reviews yet"
                description="Your reviews will appear here."
              />
            ) : (
              reviewsQ.data!.map((r) => <ReviewCard key={r.id} row={r} />)
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ReviewCard({ row }: { row: ReviewRow }) {
  const fb = row.feedback ?? {};
  const score = row.score ?? fb.score ?? null;
  const tone =
    score == null
      ? "text-muted-foreground"
      : score >= 80
        ? "text-emerald-600"
        : score >= 60
          ? "text-amber-600"
          : "text-rose-600";
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-md border p-3 text-xs"
    >
      <div className="mb-1 flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
          {formatDistanceToNow(new Date(row.created_at), { addSuffix: true })}
        </span>
        {score != null && (
          <Badge variant="outline" className={`text-[10px] ${tone}`}>
            {score}/100
          </Badge>
        )}
      </div>
      {score != null && <Progress value={score} className="mb-2 h-1" />}
      {row.summary && <p className="mb-2 text-foreground/80">{row.summary}</p>}
      <FeedbackList label="Grammar" icon={AlertCircle} items={fb.grammar} tone="warn" />
      <FeedbackList label="ATS" icon={CheckCircle2} items={fb.ats} tone="info" />
      <FeedbackList label="Missing" icon={AlertCircle} items={fb.missing} tone="warn" />
      <FeedbackList label="Suggestions" icon={Sparkles} items={fb.suggestions} tone="info" />
    </motion.div>
  );
}

function FeedbackList({
  label,
  icon: Icon,
  items,
  tone,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  items?: string[];
  tone: "warn" | "info";
}) {
  if (!items || items.length === 0) return null;
  const cls = tone === "warn" ? "text-amber-700 dark:text-amber-300" : "text-brand";
  return (
    <div className="mt-2">
      <p className={`mb-1 flex items-center gap-1 font-medium ${cls}`}>
        <Icon className="h-3 w-3" /> {label}
      </p>
      <ul className="ml-4 list-disc space-y-0.5 text-foreground/80">
        {items.slice(0, 5).map((it, i) => (
          <li key={i}>{it}</li>
        ))}
      </ul>
    </div>
  );
}
