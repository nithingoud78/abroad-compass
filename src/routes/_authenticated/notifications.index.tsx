import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, Loader2, CheckCircle, Clock, Settings } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { StandardPageLayout } from "@/components/app/StandardPageLayout";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/notifications/")({
  head: () => ({
    meta: [
      { title: "Notifications Inbox — Abroad Compass" },
      { name: "description", content: "View your latest notifications and alerts." },
    ],
  }),
  component: NotificationsInbox,
});

type NotificationRow = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
};

function NotificationsInbox() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchNotifications();

    const channel = supabase
      .channel("notifications_changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchNotifications();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  async function fetchNotifications() {
    if (!user) return;
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error(error);
      toast.error("Failed to load notifications");
    } else {
      setNotifications(data || []);
    }
    setLoading(false);
  }

  async function markAsRead(id: string) {
    const { error } = await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", id);
    if (!error) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n)),
      );
    }
  }

  async function markAllAsRead() {
    if (!user) return;
    const unreadIds = notifications.filter((n) => !n.read_at).map((n) => n.id);
    if (unreadIds.length === 0) return;

    const { error } = await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .in("id", unreadIds);

    if (!error) {
      setNotifications((prev) => prev.map((n) => ({ ...n, read_at: new Date().toISOString() })));
      toast.success("All notifications marked as read");
    }
  }

  if (loading) {
    return (
      <StandardPageLayout title="Notifications">
        <div className="flex items-center gap-2 py-16 text-sm text-muted-foreground justify-center">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading notifications…
        </div>
      </StandardPageLayout>
    );
  }

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  return (
    <StandardPageLayout
      title="Notifications"
      subtitle="Inbox"
      actions={
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllAsRead}>
              Mark all as read
            </Button>
          )}
          <Button variant="outline" size="sm" asChild>
            <Link to="/notifications/settings">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Link>
          </Button>
        </div>
      }
    >
      <div className="space-y-4 max-w-3xl mx-auto w-full">
        {notifications.length === 0 ? (
          <Card className="shadow-none border-dashed bg-muted/20">
            <CardContent className="flex flex-col items-center justify-center p-12 text-center">
              <div className="rounded-full bg-muted p-4 mb-4">
                <CheckCircle className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-lg">You're all caught up!</h3>
              <p className="text-sm text-muted-foreground mt-2 max-w-sm">
                There are no new notifications. We'll let you know when something needs your
                attention.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={cn(
                  "flex items-start gap-4 p-4 rounded-lg border",
                  !n.read_at ? "bg-muted/30 border-brand/20" : "bg-card border-border",
                )}
              >
                <div
                  className={cn(
                    "rounded-full p-2 mt-1",
                    !n.read_at ? "bg-brand/20 text-brand" : "bg-muted text-muted-foreground",
                  )}
                >
                  <Bell className="h-4 w-4" />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <h4
                      className={cn(
                        "text-sm font-semibold",
                        !n.read_at ? "text-foreground" : "text-muted-foreground",
                      )}
                    >
                      {n.title}
                    </h4>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <p
                    className={cn(
                      "text-sm mt-1",
                      !n.read_at ? "text-foreground" : "text-muted-foreground",
                    )}
                  >
                    {n.body}
                  </p>

                  {n.link && (
                    <Button variant="link" size="sm" asChild className="p-0 h-auto mt-2 text-brand">
                      <a href={n.link}>View Details</a>
                    </Button>
                  )}
                </div>

                {!n.read_at && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="shrink-0 h-8 text-xs text-brand hover:text-brand hover:bg-brand/10"
                    onClick={() => markAsRead(n.id)}
                  >
                    Mark read
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </StandardPageLayout>
  );
}
