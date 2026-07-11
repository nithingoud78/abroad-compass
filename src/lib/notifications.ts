// Centralised notification creators. All cross-module automation funnels
// through here so the topbar bell, dashboard widget and any future channel
// see one consistent shape.
import { supabase } from "@/integrations/supabase/client";

export type NotificationType =
  | "task"
  | "deadline"
  | "visa"
  | "budget"
  | "document"
  | "application"
  | "portfolio"
  | "study"
  | "german"
  | "announcement";

export type NotificationPriority = "low" | "normal" | "high" | "urgent";

export type NewNotification = {
  user_id: string;
  type: NotificationType;
  title: string;
  body?: string | null;
  link?: string | null;
  priority?: NotificationPriority;
  metadata?: Record<string, unknown>;
};

// Insert a notification, swallowing duplicate-key-style soft errors so the
// caller mutation never breaks just because a heads-up couldn't be queued.
export async function notify(n: NewNotification) {
  const { error } = await supabase.from("notifications").insert({
    user_id: n.user_id,
    type: n.type,
    title: n.title,
    body: n.body ?? null,
    link: n.link ?? null,
    priority: n.priority ?? "normal",
    metadata: (n.metadata ?? {}) as never,
  });
  if (error) console.warn("notify failed", error.message);
}

export const NOTIFICATION_LABEL: Record<NotificationType, string> = {
  task: "Task",
  deadline: "Deadline",
  visa: "Visa",
  budget: "Budget",
  document: "Document",
  application: "Application",
  portfolio: "Portfolio",
  study: "Study",
  german: "German",
  announcement: "Announcement",
};

export const PRIORITY_TONE: Record<NotificationPriority, string> = {
  low: "bg-muted text-muted-foreground border-border",
  normal: "bg-brand/10 text-brand border-brand/30",
  high: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
  urgent: "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30",
};
