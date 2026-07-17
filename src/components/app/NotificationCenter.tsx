import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Check, Archive, Trash2, Inbox } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useNotifications } from "@/hooks/use-notifications";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  PRIORITY_TONE,
  NOTIFICATION_LABEL,
  type NotificationType,
  type NotificationPriority,
} from "@/lib/notifications";

type N = {
  id: string;
  type: string;
  is_read: boolean;
  created_at: string;
  sender_profile?: {
    username: string;
    display_name: string;
    avatar_url: string;
  };
};

export function NotificationCenter() {
  const { notifications: items, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"unread" | "all" | "archived">("unread");

  const view = items.filter((i) => {
    if (tab === "unread") return !i.is_read;
    return true; // We don't have archived_at anymore, so all and archived are the same.
  });

  function openItem(n: N) {
    if (!n.is_read) markAsRead(n.id);
    let link = "";
    if (n.type === "buddy_request" || n.type === "buddy_accepted") {
      link = n.sender_profile?.username ? `/profile/${n.sender_profile.username}` : "";
    }
    if (link) {
      setOpen(false);
      navigate({ to: link as never });
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Notifications (${unreadCount} unread)`}
          className="relative"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-brand px-1 text-[10px] font-semibold text-brand-foreground"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </motion.span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(380px,calc(100vw-1rem))] p-0">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <p className="font-display text-sm font-semibold">Notifications</p>
          {unreadCount > 0 && (
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={markAllAsRead}>
              <Check className="mr-1 h-3 w-3" /> Mark all read
            </Button>
          )}
        </div>
        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
          <TabsList className="mx-3 mt-2 grid w-auto grid-cols-3">
            <TabsTrigger value="unread" className="text-xs">
              Unread{unreadCount > 0 && ` (${unreadCount})`}
            </TabsTrigger>
            <TabsTrigger value="all" className="text-xs">
              All
            </TabsTrigger>
            <TabsTrigger value="archived" className="text-xs">
              Archived
            </TabsTrigger>
          </TabsList>
          <TabsContent value={tab} className="mt-2">
            <ScrollArea className="h-[420px]">
              {view.length === 0 ? (
                <div className="grid place-items-center gap-2 px-6 py-12 text-center text-sm text-muted-foreground">
                  <Inbox className="h-6 w-6" />
                  <p>You're all caught up.</p>
                </div>
              ) : (
                <ul className="divide-y">
                  <AnimatePresence initial={false}>
                    {view.map((n) => {
                      const displayName = n.sender_profile?.display_name || "Someone";
                      let title = "Notification";
                      let body = "";
                      
                      if (n.type === "buddy_request") {
                        title = "New Buddy Request";
                        body = `${displayName} sent you a buddy request.`;
                      } else if (n.type === "buddy_accepted") {
                        title = "Request Accepted";
                        body = `${displayName} accepted your buddy request.`;
                      } else if (n.type === "streak_reminder_18") {
                        title = "🔥 Daily Check-in Reminder";
                        body = "You haven't completed today's check-in.";
                      } else if (n.type === "streak_reminder_21") {
                        title = "⏰ Friendly Reminder";
                        body = "Your streak is still waiting.";
                      } else if (n.type === "streak_reminder_23") {
                        title = "⚠ Final Reminder";
                        body = "Complete today's check-in before midnight to keep your streak alive.";
                      }

                      return (
                      <motion.li
                        key={n.id}
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: 8 }}
                        className="group flex gap-2 px-3 py-2.5 hover:bg-accent/40"
                      >
                        <button onClick={() => openItem(n)} className="flex-1 text-left">
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className={`border px-1.5 py-0 text-[10px] bg-brand/10 text-brand`}
                            >
                              {n.type === "buddy_request" ? "Request" : "Accepted"}
                            </Badge>
                            {!n.is_read && (
                              <span
                                className="h-1.5 w-1.5 rounded-full bg-brand"
                                aria-label="unread"
                              />
                            )}
                            <span className="ml-auto text-[10px] text-muted-foreground">
                              {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                            </span>
                          </div>
                          <p className="mt-1 text-sm font-medium leading-snug">{title}</p>
                          {body && (
                            <p className="text-xs text-muted-foreground line-clamp-2">{body}</p>
                          )}
                        </button>
                        <div className="flex flex-col gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            aria-label="Mark as read"
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(n.id);
                            }}
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            aria-label="Delete"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(n.id);
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </motion.li>
                    )})}
                  </AnimatePresence>
                </ul>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
}
