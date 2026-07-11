import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Lock, ExternalLink, Calendar as CalendarIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/check-in")({
  head: () => ({ meta: [{ title: "Daily Check-in — Abroad Compass" }] }),
  component: CheckInHistory,
});

type Checkin = {
  id: string;
  checkin_date: string;
  learned: boolean;
  study_duration_minutes: number | null;
  words_learned: number | null;
  effort: number | null;
  reflection: string | null;
  ai_notes: string | null;
};
type LinkRow = {
  id: string;
  checkin_id: string | null;
  title: string;
  url: string;
  source: string | null;
  link_date: string;
};

function CheckInHistory() {
  const { user } = useAuth();
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [links, setLinks] = useState<LinkRow[]>([]);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase
        .from("daily_checkins")
        .select("*")
        .eq("user_id", user.id)
        .order("checkin_date", { ascending: false })
        .limit(30),
      supabase
        .from("learning_links")
        .select("id,checkin_id,title,url,source,link_date")
        .eq("user_id", user.id)
        .order("link_date", { ascending: false })
        .limit(100),
    ]).then(([c, l]) => {
      setCheckins(c.data ?? []);
      setLinks(l.data ?? []);
    });
  }, [user]);

  const today = format(new Date(), "yyyy-MM-dd");

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm text-muted-foreground">Your German learning trail</p>
        <h1 className="font-display text-3xl font-bold tracking-tight">Daily Check-in</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Past entries are locked but always visible.
        </p>
      </header>

      {checkins.length === 0 && (
        <Card className="shadow-card">
          <CardContent className="p-10 text-center text-sm text-muted-foreground">
            No check-ins yet. The daily check-in opens automatically once per day.{" "}
            <Link to="/dashboard" className="text-foreground underline">
              Back to dashboard
            </Link>
            .
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {checkins.map((c) => {
          const dayLinks = links.filter((l) => l.checkin_id === c.id);
          const locked = c.checkin_date !== today;
          return (
            <Card key={c.id} className="shadow-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4" />{" "}
                    {format(new Date(c.checkin_date), "EEEE, MMM d, yyyy")}
                  </CardTitle>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {c.learned ? "Studied" : "Skipped"}
                  </p>
                </div>
                {locked && (
                  <Badge variant="secondary" className="gap-1">
                    <Lock className="h-3 w-3" />
                    Locked
                  </Badge>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                {c.learned ? (
                  <>
                    <div className="flex flex-wrap gap-2 text-xs">
                      {c.study_duration_minutes ? (
                        <Badge variant="secondary">{c.study_duration_minutes} min focus</Badge>
                      ) : null}
                      {c.words_learned ? (
                        <Badge variant="secondary">{c.words_learned} words</Badge>
                      ) : null}
                      {c.effort ? <Badge variant="secondary">Effort {c.effort}/10</Badge> : null}
                    </div>
                    {c.ai_notes && <p className="text-sm">{c.ai_notes}</p>}
                    {c.reflection && (
                      <p className="text-sm text-muted-foreground italic">“{c.reflection}”</p>
                    )}
                    {dayLinks.length > 0 && (
                      <div className="space-y-2">
                        {dayLinks.map((l) => (
                          <a
                            key={l.id}
                            href={l.url}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center justify-between rounded-md border p-2 text-sm hover:bg-muted/40"
                          >
                            <div className="truncate">
                              <span className="font-medium">{l.title}</span>
                              <span className="ml-2 text-xs text-muted-foreground">{l.source}</span>
                            </div>
                            <ExternalLink className="h-3 w-3 text-muted-foreground" />
                          </a>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">Logged as a rest day.</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
