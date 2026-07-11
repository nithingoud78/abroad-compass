import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/app/EmptyState";
import { ChevronUp, MessageSquare, Plus, Bug, Sparkles, Star, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { format, formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { z } from "zod";

export const Route = createFileRoute("/_authenticated/feedback")({
  head: () => ({
    meta: [
      { title: "Feedback — Abroad Compass" },
      {
        name: "description",
        content: "Feature requests, bug reports and roadmap voting — community-driven roadmap.",
      },
    ],
  }),
  component: FeedbackPage,
});

type FeedbackItem = {
  id: string;
  user_id: string;
  kind: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  rating: number | null;
  vote_count: number;
  created_at: string;
};

const feedbackSchema = z.object({
  kind: z.enum(["feature", "bug", "suggestion", "rating"]),
  title: z.string().trim().min(3, "Title too short").max(120),
  description: z.string().trim().min(10, "Add more detail").max(2000),
  rating: z.number().int().min(1).max(5).optional(),
});

const KINDS = [
  { key: "feature", label: "Feature", icon: Sparkles },
  { key: "bug", label: "Bug", icon: Bug },
  { key: "suggestion", label: "Suggestion", icon: MessageSquare },
  { key: "rating", label: "Rating", icon: Star },
] as const;

const STATUSES = ["all", "open", "planned", "in_progress", "shipped", "wont_do"];

function FeedbackPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [status, setStatus] = useState<string>("all");
  const [kind, setKind] = useState<string>("all");
  const [open, setOpen] = useState(false);

  const itemsQ = useQuery({
    queryKey: ["feedback", status, kind],
    queryFn: async () => {
      let q = supabase
        .from("feedback_items" as never)
        .select("*")
        .order("vote_count", { ascending: false })
        .order("created_at", { ascending: false });
      if (status !== "all") q = q.eq("status", status);
      if (kind !== "all") q = q.eq("kind", kind);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as FeedbackItem[];
    },
  });

  const myVotesQ = useQuery({
    queryKey: ["feedback-my-votes", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("feedback_votes" as never)
        .select("item_id")
        .eq("user_id", user!.id);
      return new Set(((data ?? []) as Array<{ item_id: string }>).map((r) => r.item_id));
    },
  });

  const create = useMutation({
    mutationFn: async (input: z.infer<typeof feedbackSchema>) => {
      const parsed = feedbackSchema.parse(input);
      const { error } = await supabase.from("feedback_items" as never).insert({
        ...parsed,
        user_id: user!.id,
      } as never);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["feedback"] });
      toast.success("Thanks for the feedback!");
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleVote = useMutation({
    mutationFn: async (item: FeedbackItem) => {
      const has = myVotesQ.data?.has(item.id) ?? false;
      if (has) {
        await supabase
          .from("feedback_votes" as never)
          .delete()
          .eq("user_id", user!.id)
          .eq("item_id", item.id);
      } else {
        await supabase
          .from("feedback_votes" as never)
          .insert({ user_id: user!.id, item_id: item.id } as never);
      }
    },
    onMutate: async (item) => {
      await qc.cancelQueries({ queryKey: ["feedback"] });
      const prev = qc.getQueryData<FeedbackItem[]>(["feedback", status, kind]);
      const prevVotes = qc.getQueryData<Set<string>>(["feedback-my-votes", user?.id]);
      const has = prevVotes?.has(item.id) ?? false;
      qc.setQueryData<FeedbackItem[]>(["feedback", status, kind], (rows) =>
        (rows ?? []).map((r) =>
          r.id === item.id ? { ...r, vote_count: r.vote_count + (has ? -1 : 1) } : r,
        ),
      );
      const nextVotes = new Set(prevVotes ?? []);
      if (has) nextVotes.delete(item.id);
      else nextVotes.add(item.id);
      qc.setQueryData(["feedback-my-votes", user?.id], nextVotes);
      return { prev, prevVotes };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(["feedback", status, kind], ctx.prev);
      if (ctx?.prevVotes) qc.setQueryData(["feedback-my-votes", user?.id], ctx.prevVotes);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["feedback"] });
      qc.invalidateQueries({ queryKey: ["feedback-my-votes", user?.id] });
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("feedback_items" as never)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["feedback"] }),
  });

  const items = itemsQ.data ?? [];

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Feedback & Roadmap</h1>
          <p className="text-sm text-muted-foreground">
            Tell us what to build next. Vote on ideas and follow their status.
          </p>
        </div>
        <FeedbackDialog
          open={open}
          setOpen={setOpen}
          onSubmit={(v) => create.mutate(v)}
          pending={create.isPending}
        />
      </header>

      <div className="flex flex-wrap gap-3">
        <Tabs value={status} onValueChange={setStatus}>
          <TabsList>
            {STATUSES.map((s) => (
              <TabsTrigger key={s} value={s} className="capitalize">
                {s.replace("_", " ")}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <Select value={kind} onValueChange={setKind}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {KINDS.map((k) => (
              <SelectItem key={k.key} value={k.key}>
                {k.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {itemsQ.isLoading ? (
        <p className="py-12 text-center text-sm text-muted-foreground">Loading…</p>
      ) : items.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No feedback yet"
          description="Be the first to suggest a feature or report a bug."
          action={{ label: "Submit feedback", onClick: () => setOpen(true) }}
        />
      ) : (
        <div className="space-y-2">
          {items.map((it) => (
            <FeedbackRow
              key={it.id}
              item={it}
              voted={myVotesQ.data?.has(it.id) ?? false}
              isOwn={it.user_id === user?.id}
              onVote={() => toggleVote.mutate(it)}
              onDelete={() => remove.mutate(it.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function FeedbackRow({
  item,
  voted,
  isOwn,
  onVote,
  onDelete,
}: {
  item: FeedbackItem;
  voted: boolean;
  isOwn: boolean;
  onVote: () => void;
  onDelete: () => void;
}) {
  const kind = KINDS.find((k) => k.key === item.kind) ?? KINDS[2];
  const KindIcon = kind.icon;
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="shadow-card">
        <CardContent className="flex items-start gap-4 py-4">
          <button
            onClick={onVote}
            className={`flex w-14 shrink-0 flex-col items-center rounded-md border py-2 transition-colors ${voted ? "border-brand bg-brand/10 text-brand" : "hover:bg-accent"}`}
            aria-label={voted ? "Remove vote" : "Vote"}
          >
            <ChevronUp className="h-4 w-4" />
            <span className="font-display text-sm font-bold tabular-nums">{item.vote_count}</span>
          </button>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <KindIcon className="h-3.5 w-3.5 text-muted-foreground" />
              <h3 className="font-medium">{item.title}</h3>
              <StatusBadge status={item.status} />
              {item.kind === "rating" && item.rating && (
                <span className="flex items-center gap-0.5 text-amber-500">
                  {Array.from({ length: item.rating }).map((_, i) => (
                    <Star key={i} className="h-3 w-3 fill-current" />
                  ))}
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{item.description}</p>
            <p className="mt-2 text-[11px] text-muted-foreground">
              {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
            </p>
          </div>
          {isOwn && (
            <Button size="icon" variant="ghost" onClick={onDelete} aria-label="Delete">
              <Trash2 className="h-4 w-4 text-muted-foreground" />
            </Button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<
    string,
    { label: string; variant: "default" | "outline" | "secondary" | "destructive" }
  > = {
    open: { label: "Open", variant: "outline" },
    planned: { label: "Planned", variant: "secondary" },
    in_progress: { label: "In progress", variant: "default" },
    shipped: { label: "Shipped", variant: "default" },
    wont_do: { label: "Won't do", variant: "destructive" },
  };
  const m = map[status] ?? map.open;
  return (
    <Badge variant={m.variant} className="text-[10px]">
      {m.label}
    </Badge>
  );
}

function FeedbackDialog({
  open,
  setOpen,
  onSubmit,
  pending,
}: {
  open: boolean;
  setOpen: (o: boolean) => void;
  onSubmit: (v: z.infer<typeof feedbackSchema>) => void;
  pending: boolean;
}) {
  const [kind, setKind] = useState<z.infer<typeof feedbackSchema>["kind"]>("feature");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [rating, setRating] = useState(5);
  const disabled = title.trim().length < 3 || description.trim().length < 10 || pending;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Submit feedback
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Submit feedback</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Type</Label>
            <div className="mt-1 grid grid-cols-4 gap-1.5">
              {KINDS.map((k) => (
                <Button
                  key={k.key}
                  type="button"
                  size="sm"
                  variant={kind === k.key ? "default" : "outline"}
                  onClick={() => setKind(k.key)}
                  className="text-xs"
                >
                  <k.icon className="mr-1 h-3.5 w-3.5" />
                  {k.label}
                </Button>
              ))}
            </div>
          </div>
          <div>
            <Label htmlFor="fb-title">Title</Label>
            <Input
              id="fb-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Short summary"
              maxLength={120}
            />
          </div>
          <div>
            <Label htmlFor="fb-desc">Details</Label>
            <Textarea
              id="fb-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              placeholder="What did you expect? What happened?"
              maxLength={2000}
            />
          </div>
          {kind === "rating" && (
            <div>
              <Label>Rating</Label>
              <div className="mt-1 flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} onClick={() => setRating(n)} aria-label={`Rate ${n}`}>
                    <Star
                      className={`h-6 w-6 ${n <= rating ? "fill-amber-500 text-amber-500" : "text-muted-foreground"}`}
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            disabled={disabled}
            onClick={() =>
              onSubmit({
                kind,
                title: title.trim(),
                description: description.trim(),
                rating: kind === "rating" ? rating : undefined,
              })
            }
          >
            Submit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
