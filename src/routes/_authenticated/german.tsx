import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { format, subDays, eachDayOfInterval } from "date-fns";
import { Headphones, BookOpen, PenTool, Mic, Languages } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { StandardPageLayout } from "@/components/app/StandardPageLayout";

export const Route = createFileRoute("/_authenticated/german")({
  head: () => ({ meta: [{ title: "German Learning — Abroad Compass" }] }),
  component: GermanLearning,
});

type GermanProgress = {
  checkin_date: string;
  german_minutes: number | null;
  german_listening_min: number | null;
  german_reading_min: number | null;
  german_writing_min: number | null;
  german_speaking_min: number | null;
  german_vocab: number | null;
  german_duolingo_lessons: number | null;
};

function GermanLearning() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<{ current_german_level?: string | null } | null>(null);
  const [progress, setProgress] = useState<GermanProgress[]>([]);
  const [links, setLinks] = useState<
    {
      id: string;
      title: string;
      url: string;
      source: string | null;
      link_date: string;
      user_summary: string | null;
      topics: string[] | null;
    }[]
  >([]);
  const [vocabCount, setVocabCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    const since30 = format(subDays(new Date(), 29), "yyyy-MM-dd");
    Promise.all([
      supabase.from("profiles").select("current_german_level").eq("user_id", user.id).maybeSingle(),
      // Read German-only columns from daily_progress (NOT daily_checkins)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase.from as any)("daily_progress")
        .select(
          "checkin_date,german_minutes,german_listening_min,german_reading_min,german_writing_min,german_speaking_min,german_vocab,german_duolingo_lessons",
        )
        .eq("user_id", user.id)
        .gte("checkin_date", since30)
        .gt("german_minutes", 0), // only rows where German was actually studied
      supabase
        .from("learning_links")
        .select("id,title,url,source,link_date,user_summary,topics")
        .eq("user_id", user.id)
        .eq("subject", "german") // ← ONLY German-scoped links
        .order("link_date", { ascending: false })
        .limit(20),
      supabase
        .from("vocabulary")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id),
    ]).then(([p, prog, l, v]) => {
      setProfile(p.data);
      setProgress(prog.data ?? []);
      setLinks(l.data ?? []);
      setVocabCount(v.count ?? 0);
    });
  }, [user]);

  // 30-day totals — German only
  const totalListening = progress.reduce((s, c) => s + (c.german_listening_min ?? 0), 0);
  const totalReading = progress.reduce((s, c) => s + (c.german_reading_min ?? 0), 0);
  const totalWriting = progress.reduce((s, c) => s + (c.german_writing_min ?? 0), 0);
  const totalSpeaking = progress.reduce((s, c) => s + (c.german_speaking_min ?? 0), 0);
  const totalStudy = totalListening + totalReading + totalWriting + totalSpeaking;
  const totalWords = progress.reduce((s, c) => s + (c.german_vocab ?? 0), 0);
  const totalDuolingo = progress.reduce((s, c) => s + (c.german_duolingo_lessons ?? 0), 0);

  // 7-day chart data — German study minutes only
  const weekData = (() => {
    const map: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const d = format(subDays(new Date(), i), "yyyy-MM-dd");
      map[d] = 0;
    }
    progress.forEach((c) => {
      if (map[c.checkin_date] !== undefined) map[c.checkin_date] += c.german_minutes ?? 0;
    });
    return Object.entries(map).map(([d, m]) => ({ day: format(new Date(d), "EEE"), minutes: m }));
  })();

  // 12-week heatmap — German minutes
  const heatmap = eachDayOfInterval({ start: subDays(new Date(), 83), end: new Date() }).map(
    (d) => {
      const key = format(d, "yyyy-MM-dd");
      const row = progress.find((c) => c.checkin_date === key);
      return { date: key, minutes: row?.german_minutes ?? 0 };
    },
  );

  return (
    <StandardPageLayout
      title="Your CEFR journey"
      subtitle="German Learning"
      headerBadge={
        <Badge className="bg-brand text-brand-foreground">
          <Languages className="mr-1 h-3 w-3" />
          {profile?.current_german_level ?? "—"}
        </Badge>
      }
    >
      {/* Skill progress cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Skill
          icon={<Headphones className="h-4 w-4" />}
          label="Listening"
          pct={Math.min(100, Math.round((totalListening / Math.max(totalStudy, 1)) * 100))}
          hint={`${totalListening} min last 30d`}
        />
        <Skill
          icon={<BookOpen className="h-4 w-4" />}
          label="Reading"
          pct={Math.min(100, Math.round((totalReading / Math.max(totalStudy, 1)) * 100))}
          hint={`${totalReading} min last 30d`}
        />
        <Skill
          icon={<PenTool className="h-4 w-4" />}
          label="Writing"
          pct={Math.min(100, Math.round((totalWriting / Math.max(totalStudy, 1)) * 100))}
          hint={`${totalWriting} min last 30d`}
        />
        <Skill
          icon={<Mic className="h-4 w-4" />}
          label="Speaking"
          pct={Math.min(100, Math.round((totalSpeaking / Math.max(totalStudy, 1)) * 100))}
          hint={`${totalSpeaking} min last 30d`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 shadow-card">
          <CardHeader>
            <CardTitle className="text-base">German study minutes (7 days)</CardTitle>
          </CardHeader>
          <CardContent className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis tickLine={false} axisLine={false} fontSize={12} width={28} />
                <Tooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                  }}
                />
                <Bar dataKey="minutes" fill="var(--brand)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-base">Totals (last 30d)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row label="Total study" value={`${totalStudy} min`} />
            <Row label="Listening" value={`${totalListening} min`} />
            <Row label="Reading" value={`${totalReading} min`} />
            <Row label="Writing" value={`${totalWriting} min`} />
            <Row label="Speaking" value={`${totalSpeaking} min`} />
            <Row label="New words" value={`${totalWords}`} />
            <Row label="Vocabulary stored" value={`${vocabCount}`} />
            <Row label="Duolingo lessons" value={`${totalDuolingo}`} />
          </CardContent>
        </Card>
      </div>

      {/* 12-week heatmap */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-base">12-week heatmap (German)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-flow-col grid-rows-7 gap-1">
            <TooltipProvider>
              {heatmap.map((d) => {
                const intensity = Math.min(4, Math.floor((d.minutes ?? 0) / 15));
                const bg = [
                  "bg-muted",
                  "bg-warm-peach/60",
                  "bg-warm-rose/70",
                  "bg-brand/70",
                  "bg-brand",
                ][intensity];
                return (
                  <UITooltip key={d.date}>
                    <TooltipTrigger>
                      <span className={`h-3 w-3 block rounded-[3px] ${bg}`} />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">
                        {d.date}: {d.minutes} min
                      </p>
                    </TooltipContent>
                  </UITooltip>
                );
              })}
            </TooltipProvider>
          </div>
        </CardContent>
      </Card>

      {/* Recent German learning links */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-base">Recent German learning links</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {links.length === 0 && (
            <p className="text-sm text-muted-foreground">No German learning links yet.</p>
          )}
          {links.map((l) => (
            <div key={l.id} className="rounded-lg border p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <a
                  className="text-sm font-medium hover:underline"
                  href={l.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  {l.title}
                </a>
                <div className="flex gap-1">
                  {(l.topics ?? []).slice(0, 3).map((t) => (
                    <Badge key={t} variant="secondary" className="text-[10px]">
                      {t}
                    </Badge>
                  ))}
                </div>
              </div>
              {l.user_summary && (
                <p className="mt-1 text-sm text-muted-foreground">{l.user_summary}</p>
              )}
              <p className="mt-1 text-xs text-muted-foreground">
                {l.source} · {format(new Date(l.link_date), "MMM d")}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </StandardPageLayout>
  );
}

function Skill({
  icon,
  label,
  pct,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  pct: number;
  hint: string;
}) {
  return (
    <Card className="shadow-card">
      <CardContent className="p-5">
        <div className="flex items-center gap-2 text-sm font-medium">
          <span className="grid h-7 w-7 place-items-center rounded-md bg-muted">{icon}</span>
          {label}
        </div>
        <Progress value={pct} className="mt-3 h-1.5" />
        <p className="mt-2 text-xs text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
