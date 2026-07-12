import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminFeedbackList, adminFeedbackUpdate } from "@/lib/admin/admin.functions";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  ThumbsUp,
  AlertCircle,
  Lightbulb,
  MessageCircle,
  Filter,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/feedback")({
  head: () => ({ meta: [{ title: "Feedback — Admin — Abroad Compass" }] }),
  component: AdminFeedbackPage,
});

const STATUS_OPTIONS = [
  "open",
  "planned",
  "in_progress",
  "completed",
  "rejected",
  "duplicate",
] as const;
const KIND_OPTIONS = ["feature", "bug", "suggestion", "general"] as const;
const PRIORITY_OPTIONS = ["low", "medium", "high", "critical"] as const;

const STATUS_COLORS: Record<string, string> = {
  open: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  planned: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  in_progress: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  completed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  duplicate: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

const PRIORITY_COLORS: Record<string, string> = {
  low: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  medium: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  high: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  critical: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};

const KIND_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  feature: Lightbulb,
  bug: AlertCircle,
  suggestion: MessageCircle,
  general: MessageSquare,
};

type FeedbackItem = {
  id: string;
  title: string;
  description: string;
  kind: string;
  status: string;
  priority: string;
  vote_count: number;
  created_at: string;
  user_id: string;
  internal_notes: string | null;
  developer_notes: string | null;
  assignee: string | null;
};

function AdminFeedbackPage() {
  const listFn = useServerFn(adminFeedbackList);
  const updateFn = useServerFn(adminFeedbackUpdate);
  const qc = useQueryClient();

  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [kind, setKind] = useState("all");
  const [priority, setPriority] = useState("all");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<FeedbackItem | null>(null);
  const [internalNotes, setInternalNotes] = useState("");
  const [devNotes, setDevNotes] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "feedback", { q, status, kind, priority, page }],
    queryFn: () =>
      listFn({
        data: {
          q: q || undefined,
          status: status !== "all" ? status : undefined,
          kind: kind !== "all" ? kind : undefined,
          priority: priority !== "all" ? priority : undefined,
          page,
        },
      }),
  });

  const updateMut = useMutation({
    mutationFn: (v: {
      id: string;
      status?: string;
      priority?: string;
      internal_notes?: string;
      developer_notes?: string;
      assignee?: string;
    }) => updateFn({ data: v }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "feedback"] });
      toast.success("Feedback updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function openDetail(item: FeedbackItem) {
    setSelected(item);
    setInternalNotes(item.internal_notes ?? "");
    setDevNotes(item.developer_notes ?? "");
  }

  const totalPages = data ? Math.ceil(data.total / data.pageSize) : 0;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-semibold">Feedback Management</h1>
        <p className="text-sm text-muted-foreground">
          {data?.total ?? 0} total items · Review, triage and close feedback.
        </p>
      </div>

      {/* Filters */}
      <Card className="p-3">
        <div className="flex flex-wrap gap-2">
          <Input
            placeholder="Search by title…"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(0);
            }}
            className="max-w-xs"
          />
          <Select
            value={status}
            onValueChange={(v) => {
              setStatus(v);
              setPage(0);
            }}
          >
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s} value={s}>
                  {s.replace("_", " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={kind}
            onValueChange={(v) => {
              setKind(v);
              setPage(0);
            }}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Kind" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All kinds</SelectItem>
              {KIND_OPTIONS.map((k) => (
                <SelectItem key={k} value={k}>
                  {k}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={priority}
            onValueChange={(v) => {
              setPriority(v);
              setPage(0);
            }}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All priorities</SelectItem>
              {PRIORITY_OPTIONS.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setQ("");
              setStatus("all");
              setKind("all");
              setPriority("all");
              setPage(0);
            }}
          >
            <Filter className="mr-1 h-3.5 w-3.5" /> Reset
          </Button>
        </div>
      </Card>

      {isLoading && (
        <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      )}

      {/* List */}
      <div className="space-y-2">
        {(data?.items ?? []).map((item) => {
          const KindIcon = KIND_ICON[item.kind] ?? MessageSquare;
          return (
            <Card
              key={item.id}
              className="cursor-pointer p-4 transition-shadow hover:shadow-soft"
              onClick={() => openDetail(item)}
            >
              <div className="flex flex-wrap items-start gap-3">
                <KindIcon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{item.title}</p>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[11px] font-medium",
                        STATUS_COLORS[item.status] ?? "bg-muted text-muted-foreground",
                      )}
                    >
                      {item.status.replace("_", " ")}
                    </span>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[11px] font-medium",
                        PRIORITY_COLORS[item.priority] ?? "bg-muted",
                      )}
                    >
                      {item.priority}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {item.description}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                    <span>
                      {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                    </span>
                    <Badge variant="outline" className="text-[10px]">
                      {item.kind}
                    </Badge>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}

        {!isLoading && (data?.items ?? []).length === 0 && (
          <Card className="flex items-center gap-2 p-8 text-sm text-muted-foreground">
            <MessageSquare className="h-4 w-4" /> No feedback matched your filters.
          </Card>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Page {page + 1} of {totalPages} · {data?.total} items
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Detail Sheet */}
      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-full max-w-lg overflow-y-auto sm:max-w-xl">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle className="text-left">{selected.title}</SheetTitle>
              </SheetHeader>
              <div className="mt-4 space-y-4">
                <p className="text-sm text-muted-foreground">{selected.description}</p>

                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{selected.kind}</Badge>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[11px] font-medium",
                      STATUS_COLORS[selected.status],
                    )}
                  >
                    {selected.status.replace("_", " ")}
                  </span>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[11px] font-medium",
                      PRIORITY_COLORS[selected.priority],
                    )}
                  >
                    {selected.priority}
                  </span>
                </div>

                {/* Change status */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Status</label>
                  <Select
                    value={selected.status}
                    onValueChange={(v) => {
                      updateMut.mutate({ id: selected.id, status: v });
                      setSelected((prev) => (prev ? { ...prev, status: v } : null));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s.replace("_", " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Change priority */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Priority</label>
                  <Select
                    value={selected.priority}
                    onValueChange={(v) => {
                      updateMut.mutate({ id: selected.id, priority: v });
                      setSelected((prev) => (prev ? { ...prev, priority: v } : null));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIORITY_OPTIONS.map((p) => (
                        <SelectItem key={p} value={p}>
                          {p}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Internal notes */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">
                    Internal Notes (admin only)
                  </label>
                  <Textarea
                    value={internalNotes}
                    onChange={(e) => setInternalNotes(e.target.value)}
                    rows={3}
                    placeholder="Add internal notes…"
                  />
                </div>

                {/* Developer notes */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">
                    Developer Notes
                  </label>
                  <Textarea
                    value={devNotes}
                    onChange={(e) => setDevNotes(e.target.value)}
                    rows={3}
                    placeholder="Technical notes, PR links, etc…"
                  />
                </div>

                <Button
                  className="w-full"
                  disabled={updateMut.isPending}
                  onClick={() =>
                    updateMut.mutate({
                      id: selected.id,
                      internal_notes: internalNotes,
                      developer_notes: devNotes,
                    })
                  }
                >
                  {updateMut.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Save Notes
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

// cn utility inline to avoid extra import confusion
function cn(...classes: (string | undefined | false | null)[]) {
  return classes.filter(Boolean).join(" ");
}
