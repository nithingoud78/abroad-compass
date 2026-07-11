import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Download, Calendar as CalendarIcon } from "lucide-react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/calendar")({
  head: () => ({
    meta: [
      { title: "Calendar — Abroad Compass" },
      {
        name: "description",
        content: "Deadlines, study sessions, and reminders in one internal calendar.",
      },
    ],
  }),
  component: CalendarPage,
});

type CalItem = {
  id: string;
  title: string;
  date: string;
  kind: "task" | "deadline";
  priority?: string | null;
  status?: string | null;
  module?: string | null;
};

function CalendarPage() {
  const { user } = useAuth();
  const [cursor, setCursor] = useState<Date>(() => new Date());

  const eventsQ = useQuery({
    queryKey: ["calendar", format(cursor, "yyyy-MM"), user?.id],
    queryFn: async (): Promise<CalItem[]> => {
      if (!user) return [];
      const from = format(startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 }), "yyyy-MM-dd");
      const to = format(endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 }), "yyyy-MM-dd");
      const { data, error } = await supabase
        .from("tasks")
        .select("id,title,due_date,priority,status,module")
        .eq("user_id", user.id)
        .not("due_date", "is", null)
        .gte("due_date", from)
        .lte("due_date", to)
        .order("due_date", { ascending: true });
      if (error) throw error;
      return (data ?? []).map((r) => ({
        id: r.id as string,
        title: r.title as string,
        date: r.due_date as string,
        kind: r.module === "deadline" ? "deadline" : "task",
        priority: r.priority as string | null,
        status: r.status as string | null,
        module: r.module as string | null,
      }));
    },
    enabled: !!user,
  });

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [cursor]);

  const eventsByDay = useMemo(() => {
    const m = new Map<string, CalItem[]>();
    for (const e of eventsQ.data ?? []) {
      const key = e.date;
      if (!m.has(key)) m.set(key, []);
      m.get(key)!.push(e);
    }
    return m;
  }, [eventsQ.data]);

  function exportIcs() {
    const items = eventsQ.data ?? [];
    if (items.length === 0) {
      toast.error("Nothing to export in this month");
      return;
    }
    const lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Abroad Compass//Calendar//EN",
      "CALSCALE:GREGORIAN",
    ];
    for (const e of items) {
      const dt = e.date.replace(/-/g, "");
      lines.push(
        "BEGIN:VEVENT",
        `UID:${e.id}@abroad-compass`,
        `DTSTAMP:${format(new Date(), "yyyyMMdd'T'HHmmss'Z'")}`,
        `DTSTART;VALUE=DATE:${dt}`,
        `DTEND;VALUE=DATE:${dt}`,
        `SUMMARY:${escapeIcs(e.title)}`,
        `CATEGORIES:${e.kind}`,
        "END:VEVENT",
      );
    }
    lines.push("END:VCALENDAR");
    const blob = new Blob([lines.join("\r\n")], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `abroad-compass-${format(cursor, "yyyy-MM")}.ics`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Downloaded .ics");
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Calendar</h1>
          <p className="text-sm text-muted-foreground">
            All tasks and deadlines with a due date. Add items from Tasks or Germany Journey.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportIcs} aria-label="Export month as ICS">
            <Download className="mr-2 h-4 w-4" /> Export .ics
          </Button>
        </div>
      </header>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <CalendarIcon className="h-4 w-4 text-brand" />
            {format(cursor, "MMMM yyyy")}
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCursor((d) => addMonths(d, -1))}
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setCursor(new Date())}>
              Today
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCursor((d) => addMonths(d, 1))}
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 border-t border-l text-xs">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
              <div
                key={d}
                className="border-r border-b bg-muted/40 px-2 py-1 font-medium text-muted-foreground"
              >
                {d}
              </div>
            ))}
            {days.map((day) => {
              const key = format(day, "yyyy-MM-dd");
              const items = eventsByDay.get(key) ?? [];
              const muted = !isSameMonth(day, cursor);
              return (
                <div
                  key={key}
                  className={`min-h-24 border-r border-b p-1.5 ${muted ? "bg-muted/20 text-muted-foreground" : ""}`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs ${isToday(day) ? "rounded-full bg-brand px-1.5 text-brand-foreground" : ""}`}
                    >
                      {format(day, "d")}
                    </span>
                    {items.length > 0 && !muted ? (
                      <Badge variant="secondary" className="h-4 text-[10px]">
                        {items.length}
                      </Badge>
                    ) : null}
                  </div>
                  <ul className="mt-1 space-y-1">
                    {items.slice(0, 3).map((it) => (
                      <li
                        key={it.id}
                        className={`truncate rounded px-1 text-[11px] ${
                          it.kind === "deadline"
                            ? "bg-rose-500/15 text-rose-700 dark:text-rose-300"
                            : "bg-sky-500/15 text-sky-700 dark:text-sky-300"
                        }`}
                        title={it.title}
                      >
                        {it.title}
                      </li>
                    ))}
                    {items.length > 3 ? (
                      <li className="text-[10px] text-muted-foreground">
                        +{items.length - 3} more
                      </li>
                    ) : null}
                  </ul>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Upcoming (next 14 days)</CardTitle>
        </CardHeader>
        <CardContent>
          <Upcoming items={eventsQ.data ?? []} />
        </CardContent>
      </Card>
    </div>
  );
}

function Upcoming({ items }: { items: CalItem[] }) {
  const now = new Date();
  const in14 = new Date(now.getTime() + 14 * 86400 * 1000);
  const upcoming = items
    .filter((i) => {
      const d = parseISO(i.date);
      return d >= now || isSameDay(d, now);
    })
    .filter((i) => parseISO(i.date) <= in14)
    .slice(0, 12);

  if (upcoming.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-muted-foreground">
        Nothing coming up.{" "}
        <Link to="/germany-journey" className="text-brand underline">
          Add a deadline
        </Link>
        .
      </p>
    );
  }

  return (
    <ul className="divide-y">
      {upcoming.map((it) => (
        <li key={it.id} className="flex items-center justify-between py-2 text-sm">
          <div className="min-w-0">
            <p className="truncate font-medium">{it.title}</p>
            <p className="text-xs text-muted-foreground">{it.module ?? "task"}</p>
          </div>
          <span className="text-xs tabular-nums text-muted-foreground">
            {format(parseISO(it.date), "EEE d MMM")}
          </span>
        </li>
      ))}
    </ul>
  );
}

function escapeIcs(s: string) {
  return s.replace(/([,;])/g, "\\$1").replace(/\n/g, "\\n");
}
