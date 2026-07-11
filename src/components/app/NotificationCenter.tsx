import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Check, Archive, Trash2, Inbox } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
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
  title: string;
  body: string | null;
  link: string | null;
  type: NotificationType;
  priority: NotificationPriority;
  read_at: string | null;
  archived_at: string | null;
  created_at: string;
};

export function NotificationCenter() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<N[]>([]);
  const [tab, setTab] = useState<"unread" | "all" | "archived">("unread");

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    async function load() {
      const { data } = await supabase
        .from("notifications")
        .select("id,title,body,link,type,priority,read_at,archived_at,created_at")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (!cancelled) setItems((data ?? []) as N[]);
    }
    load();
    const ch = supabase
      .channel(`notif-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        load,
      )
      .subscribe();
    return () => {
      cancelled = true;
      supabase.removeChannel(ch);
    };
  }, [user]);

  const unreadCount = items.filter((i) => !i.read_at && !i.archived_at).length;

  const view = items.filter((i) => {
    if (tab === "unread") return !i.read_at && !i.archived_at;
    if (tab === "archived") return !!i.archived_at;
    return !i.archived_at;
  });

  async function markRead(id: string) {
    await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id);
  }
  async function markAllRead() {
    if (!user) return;
    await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .is("read_at", null);
  }
  async function archive(id: string) {
    await supabase
      .from("notifications")
      .update({ archived_at: new Date().toISOString() })
      .eq("id", id);
  }
  async function remove(id: string) {
    await supabase.from("notifications").delete().eq("id", id);
  }

  function openItem(n: N) {
    if (!n.read_at) markRead(n.id);
    if (n.link) {
      setOpen(false);
      navigate({ to: n.link as never });
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
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={markAllRead}>
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
                    {view.map((n) => (
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
                              className={`border px-1.5 py-0 text-[10px] ${PRIORITY_TONE[n.priority]}`}
                            >
                              {NOTIFICATION_LABEL[n.type]}
                            </Badge>
                            {!n.read_at && (
                              <span
                                className="h-1.5 w-1.5 rounded-full bg-brand"
                                aria-label="unread"
                              />
                            )}
                            <span className="ml-auto text-[10px] text-muted-foreground">
                              {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                            </span>
                          </div>
                          <p className="mt-1 text-sm font-medium leading-snug">{n.title}</p>
                          {n.body && (
                            <p className="text-xs text-muted-foreground line-clamp-2">{n.body}</p>
                          )}
                        </button>
                        <div className="flex flex-col gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                          {!n.archived_at && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6"
                              aria-label="Archive"
                              onClick={() => archive(n.id)}
                            >
                              <Archive className="h-3 w-3" />
                            </Button>
                          )}
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            aria-label="Delete"
                            onClick={() => remove(n.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </motion.li>
                    ))}
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
