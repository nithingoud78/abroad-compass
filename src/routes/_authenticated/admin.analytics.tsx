import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminAnalytics } from "@/lib/admin/admin.functions";
import { Card } from "@/components/ui/card";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Loader2, TrendingUp, Users, Sparkles, GraduationCap } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/analytics")({
  head: () => ({ meta: [{ title: "Analytics — Admin — Abroad Compass" }] }),
  component: AdminAnalyticsPage,
});

const CHART_COLORS = [
  "var(--color-brand)",
  "oklch(0.6 0.2 220)",
  "oklch(0.65 0.18 130)",
  "oklch(0.65 0.2 50)",
  "oklch(0.55 0.22 310)",
  "oklch(0.7 0.15 175)",
];

function AdminAnalyticsPage() {
  const analyticsFn = useServerFn(adminAnalytics);
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "analytics"],
    queryFn: () => analyticsFn(),
    staleTime: 5 * 60_000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-16 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading analytics…
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8 text-center text-sm text-destructive">{(error as Error).message}</div>
    );
  }

  if (!data) return null;

  const feedbackPieData = Object.entries(data.feedbackByStatus).map(([name, value]) => ({
    name: name.replace("_", " "),
    value,
  }));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-semibold">Analytics</h1>
        <p className="text-sm text-muted-foreground">
          30-day platform usage overview. Refreshes every 5 minutes.
        </p>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="Weekly Active Users"
          value={data.wauUnique.toLocaleString()}
          icon={Users}
          sub="unique users (7d)"
        />
        <StatCard
          label="Blog Posts"
          value={`${data.blogPublished} / ${data.blogTotal}`}
          icon={TrendingUp}
          sub="published / total"
        />
        <StatCard
          label="German Checkins (30d)"
          value={data.germanDaily.reduce((s, d) => s + d.count, 0).toLocaleString()}
          icon={GraduationCap}
          sub="active learners"
        />
        <StatCard
          label="AI Requests (30d)"
          value={data.aiDaily.reduce((s, d) => s + d.requests, 0).toLocaleString()}
          icon={Sparkles}
          sub="total requests"
        />
      </div>

      {/* DAU Chart */}
      {data.dau.length > 0 && (
        <Card className="p-4">
          <h2 className="mb-3 font-medium">Daily Active Users (30d)</h2>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data.dau}>
              <defs>
                <linearGradient id="dauGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-brand)" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="var(--color-brand)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(d) => d.slice(5)} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="users"
                stroke="var(--color-brand)"
                fill="url(#dauGrad)"
                strokeWidth={2}
                name="Active Users"
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* New Users */}
        {data.newUsers.length > 0 && (
          <Card className="p-4">
            <h2 className="mb-3 font-medium">New Registrations (30d)</h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.newUsers}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(d) => d.slice(5)} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar
                  dataKey="count"
                  fill="var(--color-brand)"
                  radius={[4, 4, 0, 0]}
                  name="New Users"
                />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* Feedback by Status Pie */}
        {feedbackPieData.length > 0 && (
          <Card className="p-4">
            <h2 className="mb-3 font-medium">Feedback by Status</h2>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={feedbackPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {feedbackPieData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        )}
      </div>

      {/* AI Usage */}
      {data.aiDaily.length > 0 && (
        <Card className="p-4">
          <h2 className="mb-3 font-medium">AI Usage — Tokens (30d)</h2>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={data.aiDaily}>
              <defs>
                <linearGradient id="aiGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHART_COLORS[1]} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={CHART_COLORS[1]} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(d) => d.slice(5)} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="tokens"
                stroke={CHART_COLORS[1]}
                fill="url(#aiGrad)"
                strokeWidth={1.5}
                name="Tokens"
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* German Checkins */}
      {data.germanDaily.length > 0 && (
        <Card className="p-4">
          <h2 className="mb-3 font-medium">German Study Checkins (30d)</h2>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={data.germanDaily}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(d) => d.slice(5)} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill={CHART_COLORS[2]} radius={[4, 4, 0, 0]} name="Checkins" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  sub,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  sub: string;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between text-muted-foreground">
        <span className="text-xs uppercase tracking-wider">{label}</span>
        <Icon className="h-4 w-4" />
      </div>
      <p className="mt-2 font-display text-2xl font-semibold">{value}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>
    </Card>
  );
}
