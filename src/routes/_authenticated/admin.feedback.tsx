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
import { formatDistanceToNow, format } from "date-fns";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Filter,
  Trash2,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/feedback")({
  head: () => ({ meta: [{ title: "Feedback Inbox — Admin — Abroad Compass" }] }),
  component: AdminFeedbackPage,
});

const STATUS_OPTIONS = ["open", "read", "archived"] as const;

const STATUS_COLORS: Record<string, string> = {
  open: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  read: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
  archived: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
};

type FeedbackItem = {
  id: string;
  title: string;
  description: string;
  status: string;
  created_at: string;
  user_id: string;
  name?: string;
  email?: string;
  internal_notes: string | null;
};

function AdminFeedbackPage() {
  const listFn = useServerFn(adminFeedbackList);
  const updateFn = useServerFn(adminFeedbackUpdate);
  const qc = useQueryClient();

  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<FeedbackItem | null>(null);
  const [internalNotes, setInternalNotes] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "feedback", { q, status, page }],
    queryFn: () =>
      listFn({
        data: {
          q: q || undefined,
          status: status !== "all" ? status : undefined,
          page,
        },
      }),
  });

  const updateMut = useMutation({
    mutationFn: (v: {
      id: string;
      status?: string;
      internal_notes?: string;
    }) => updateFn({ data: v }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "feedback"] });
      toast.success("Updated successfully");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("feedback_items" as never).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "feedback"] });
      setSelected(null);
      toast.success("Feedback deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function openDetail(item: FeedbackItem) {
    setSelected(item);
    setInternalNotes(item.internal_notes ?? "");
    // auto-mark as read if open
    if (item.status === "open") {
      updateMut.mutate({ id: item.id, status: "read" });
    }
  }

  const totalPages = data ? Math.ceil(data.total / data.pageSize) : 0;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-semibold">Feedback Inbox</h1>
        <p className="text-sm text-muted-foreground">
          {data?.total ?? 0} total submissions · Review user feedback and messages.
        </p>
      </div>

      {/* Filters */}
      <Card className="p-3">
        <div className="flex flex-wrap gap-2">
          <Input
            placeholder="Search subject…"
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
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setQ("");
              setStatus("all");
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
          return (
            <Card
              key={item.id}
              className="cursor-pointer p-4 transition-shadow hover:shadow-soft"
              onClick={() => openDetail(item)}
            >
              <div className="flex flex-wrap items-start gap-3">
                <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{item.title || "No Subject"}</p>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[11px] font-medium",
                        STATUS_COLORS[item.status] ?? "bg-muted text-muted-foreground",
                      )}
                    >
                      {item.status === "open" ? "New" : item.status.replace("_", " ")}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
                    {item.description}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                    <span>{item.name || "Unknown Sender"}</span>
                    <span>·</span>
                    <span>
                      {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}

        {!isLoading && (data?.items ?? []).length === 0 && (
          <Card className="flex items-center gap-2 p-8 text-sm text-muted-foreground">
            <MessageSquare className="h-4 w-4" /> No feedback submissions found.
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
                <SheetTitle className="text-left">{selected.title || "No Subject"}</SheetTitle>
              </SheetHeader>
              <div className="mt-4 space-y-6">
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span className="font-medium text-foreground">{selected.name || "Unknown"}</span>
                    {selected.email && <span>&lt;{selected.email}&gt;</span>}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {format(new Date(selected.created_at), "PPpp")}
                  </div>
                </div>

                <div className="rounded-md border p-4 text-sm text-foreground bg-muted/20 whitespace-pre-wrap">
                  {selected.description}
                </div>

                <div className="flex flex-wrap gap-2">
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[11px] font-medium",
                      STATUS_COLORS[selected.status],
                    )}
                  >
                    {selected.status.replace("_", " ")}
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

                {/* Internal notes */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">
                    Internal Notes
                  </label>
                  <Textarea
                    value={internalNotes}
                    onChange={(e) => setInternalNotes(e.target.value)}
                    rows={3}
                    placeholder="Add internal notes…"
                  />
                  <div className="flex justify-end pt-2">
                    <Button
                      size="sm"
                      disabled={updateMut.isPending}
                      onClick={() =>
                        updateMut.mutate({
                          id: selected.id,
                          internal_notes: internalNotes,
                        })
                      }
                    >
                      {updateMut.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Save Notes
                    </Button>
                  </div>
                </div>

                <hr />
                
                <div className="pt-2">
                   <Button 
                    variant="destructive" 
                    className="w-full"
                    onClick={() => {
                      if (confirm("Are you sure you want to delete this submission?")) {
                        deleteMut.mutate(selected.id);
                      }
                    }}
                    disabled={deleteMut.isPending}
                   >
                     <Trash2 className="mr-2 h-4 w-4" /> Delete Submission
                   </Button>
                </div>
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
