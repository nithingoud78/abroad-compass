import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useNotifications } from "@/hooks/use-notifications";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, Loader2, CheckCircle, Clock, Settings, Trash2 } from "lucide-react";
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

function NotificationsInbox() {
  const { notifications, loading, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications();

  if (loading) {
    return (
      <StandardPageLayout title="Notifications">
        <div className="flex items-center gap-2 py-16 text-sm text-muted-foreground justify-center">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading notifications…
        </div>
      </StandardPageLayout>
    );
  }

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
            {notifications.map((n) => {
              const displayName = n.sender_profile?.display_name || "Someone";
              let title = "Notification";
              let body = "";
              let link = "";
              
              if (n.type === "buddy_request") {
                title = "New Study Buddy Request";
                body = `${displayName} sent you a buddy request.`;
                link = n.sender_profile?.username ? `/profile/${n.sender_profile.username}` : "";
              } else if (n.type === "buddy_accepted") {
                title = "Request Accepted";
                body = `${displayName} accepted your buddy request.`;
                link = n.sender_profile?.username ? `/profile/${n.sender_profile.username}` : "";
              } else if (n.type === "streak_reminder_18") {
                title = "🔥 Daily Check-in Reminder";
                body = "You haven't completed today's check-in.";
              } else if (n.type === "streak_reminder_21") {
                title = "⏰ Friendly Reminder";
                body = "Your streak is still waiting.";
              } else if (n.type === "streak_reminder_23") {
                title = "⚠ Final Reminder";
                body = "Complete today's check-in before midnight to keep your streak alive.";
              } else {
                title = "Notification";
                body = "You have a new notification.";
              }

              return (
              <div
                key={n.id}
                className={cn(
                  "flex items-start gap-4 p-4 rounded-lg border",
                  !n.is_read ? "bg-muted/30 border-brand/20" : "bg-card border-border",
                )}
              >
                <div
                  className={cn(
                    "rounded-full p-2 mt-1",
                    !n.is_read ? "bg-brand/20 text-brand" : "bg-muted text-muted-foreground",
                  )}
                >
                  <Bell className="h-4 w-4" />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <h4
                      className={cn(
                        "text-sm font-semibold",
                        !n.is_read ? "text-foreground" : "text-muted-foreground",
                      )}
                    >
                      {title}
                    </h4>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <p
                    className={cn(
                      "text-sm mt-1",
                      !n.is_read ? "text-foreground" : "text-muted-foreground",
                    )}
                  >
                    {body}
                  </p>

                  {link && (
                    <Button variant="link" size="sm" asChild className="p-0 h-auto mt-2 text-brand">
                      <Link to={link}>View Details</Link>
                    </Button>
                  )}
                </div>

                <div className="flex flex-col gap-2 shrink-0 ml-4">
                  {!n.is_read && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs text-brand hover:text-brand hover:bg-brand/10"
                      onClick={() => markAsRead(n.id)}
                    >
                      Mark read
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 self-end"
                    onClick={() => deleteNotification(n.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )})}
          </div>
        )}
      </div>
    </StandardPageLayout>
  );
}
