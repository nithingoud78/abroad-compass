import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminStats } from "@/lib/admin/admin.functions";
import { useRealtimeDashboard } from "@/hooks/use-realtime-dashboard";
import { Card } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import {
  Users,
  Sparkles,
  ScanText,
  GraduationCap,
  BookA,
  Brain,
  Search,
  MessageSquare,
  Newspaper,
  Bell,
  Activity,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/dashboard")({
  head: () => ({ meta: [{ title: "Admin Dashboard — Abroad Compass" }] }),
  component: AdminDashboard,
});

function AdminDashboard() {
  useRealtimeDashboard();
  const call = useServerFn(adminStats);
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: () => call(),
  });

  if (isLoading)
    return <div className="py-10 text-center text-sm text-muted-foreground">Loading…</div>;
  if (error)
    return (
      <div className="py-10 text-center text-sm text-destructive">{(error as Error).message}</div>
    );
  if (!data) return null;

  const cards = [
    { label: "Total users", value: data.totalUsers, icon: Users },
    { label: "Active today", value: data.dau, icon: Activity },
    { label: "Active this week", value: data.wau, icon: Activity },
    { label: "Active this month", value: data.mau, icon: Activity },
    { label: "AI requests", value: data.aiRequests, icon: Sparkles },
    { label: "OCR runs", value: data.ocrRequests, icon: ScanText },
    { label: "German check-ins", value: data.germanChecks, icon: GraduationCap },
    { label: "IELTS sessions", value: data.ieltsSessions, icon: BookA },
    { label: "dMAT mock tests", value: data.dmatSessions, icon: Brain },
    { label: "University searches", value: data.uniSearches, icon: Search },
    { label: "Feedback items", value: data.feedbackCount, icon: MessageSquare },
    { label: "Blog posts published", value: data.blogPublished, icon: Newspaper },
    { label: "Notifications sent", value: data.notificationsSent, icon: Bell },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Admin overview</h1>
        <p className="text-sm text-muted-foreground">
          Live health and usage across Abroad Compass.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label} className="p-4">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs uppercase tracking-wider">{c.label}</span>
              <c.icon className="h-4 w-4" />
            </div>
            <div className="mt-2 font-display text-2xl font-semibold">
              {c.value === 0 ? (
                <span className="text-sm text-muted-foreground font-normal">No data yet</span>
              ) : (
                c.value.toLocaleString()
              )}
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="mb-3 font-medium">Latest registrations</h2>
          <ul className="space-y-2 text-sm">
            {data.recentRegistrations.length === 0 && (
              <li className="text-muted-foreground">No users yet.</li>
            )}
            {data.recentRegistrations.map((r) => (
              <li
                key={r.user_id}
                className="flex items-center justify-between rounded-md border px-3 py-2"
              >
                <span className="truncate">{r.display_name || "Unnamed user"}</span>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-4">
            <Link to="/admin/users" className="text-xs font-medium text-brand hover:underline">
              Manage users →
            </Link>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="mb-3 font-medium">Recent activity</h2>
          <ul className="space-y-2 text-sm">
            {data.recentActivity.length === 0 && (
              <li className="text-muted-foreground">No activity yet.</li>
            )}
            {data.recentActivity.map((a) => (
              <li
                key={a.id}
                className="flex items-center justify-between rounded-md border px-3 py-2"
              >
                <span className="truncate">
                  <span className="font-medium">{a.action}</span>
                  {a.entity && <span className="text-muted-foreground"> · {a.entity}</span>}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
