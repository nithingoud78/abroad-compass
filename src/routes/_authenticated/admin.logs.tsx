import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminLogs } from "@/lib/admin/admin.functions";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  Loader2,
  ScrollText,
  ChevronLeft,
  ChevronRight,
  Download,
  Shield,
  Sparkles,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/logs")({
  head: () => ({ meta: [{ title: "Logs — Admin — Abroad Compass" }] }),
  component: AdminLogsPage,
});

type LogType = "audit" | "auth" | "ai";

const TAB_CONFIG: {
  id: LogType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: "audit", label: "Audit", icon: ScrollText },
  { id: "auth", label: "Auth", icon: Shield },
  { id: "ai", label: "AI", icon: Sparkles },
];

function AdminLogsPage() {
  const logsFn = useServerFn(adminLogs);
  const [type, setType] = useState<LogType>("audit");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "logs", { type, q, page }],
    queryFn: () => logsFn({ data: { type, q: q || undefined, page } }),
  });

  const totalPages = data ? Math.ceil(data.total / 50) : 0;

  function exportCsv() {
    if (!data) return;
    const rows = data.rows as Record<string, unknown>[];
    if (!rows.length) {
      toast.error("No data to export");
      return;
    }
    const headers = Object.keys(rows[0]);
    const csv = [
      headers.join(","),
      ...rows.map((r) => headers.map((h) => JSON.stringify(r[h] ?? "")).join(",")),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${type}_logs_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV downloaded");
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold">Logs</h1>
          <p className="text-sm text-muted-foreground">
            {data?.total ?? 0} entries · Page {page + 1}
            {totalPages > 1 ? ` of ${totalPages}` : ""}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={exportCsv}>
          <Download className="mr-2 h-3.5 w-3.5" /> Export CSV
        </Button>
      </div>

      {/* Log type tabs */}
      <div className="flex gap-1 rounded-lg border bg-muted/30 p-1 w-fit">
        {TAB_CONFIG.map((t) => (
          <button
            key={t.id}
            onClick={() => {
              setType(t.id);
              setPage(0);
              setQ("");
            }}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              type === t.id
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <t.icon className="h-3.5 w-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <Input
        placeholder={`Search ${type} logs…`}
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setPage(0);
        }}
        className="max-w-xs"
      />

      {isLoading && (
        <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading {type} logs…
        </div>
      )}

      {/* Table — narrow the union via data.type discriminant */}
      {!isLoading && data && (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            {data.type === "audit" && <AuditTable rows={data.rows} />}
            {data.type === "auth" && <AuthTable rows={data.rows} />}
            {data.type === "ai" && <AiLogTable rows={data.rows} />}
          </div>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{data?.total} entries</span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="flex items-center px-2">
              {page + 1} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

type AuditRow = {
  id: string;
  action: string;
  entity: string | null;
  entity_id: string | null;
  user_id: string;
  created_at: string;
  details: string;
};

function AuditTable({ rows }: { rows: AuditRow[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Action</TableHead>
          <TableHead>Entity</TableHead>
          <TableHead className="hidden sm:table-cell">User ID</TableHead>
          <TableHead>Timestamp</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length === 0 && (
          <TableRow>
            <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
              No audit entries
            </TableCell>
          </TableRow>
        )}
        {rows.map((r) => (
          <TableRow key={r.id}>
            <TableCell>
              <Badge variant="outline" className="font-mono text-[10px]">
                {r.action}
              </Badge>
            </TableCell>
            <TableCell className="text-sm">{r.entity}</TableCell>
            <TableCell className="hidden font-mono text-xs text-muted-foreground sm:table-cell">
              {r.user_id.slice(0, 8)}…
            </TableCell>
            <TableCell className="text-xs text-muted-foreground">
              {format(new Date(r.created_at), "PP HH:mm:ss")}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

type AuthRow = {
  id: string;
  event: string;
  user_id: string;
  ip: unknown;
  user_agent: string | null;
  created_at: string;
};

function AuthTable({ rows }: { rows: AuthRow[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Event</TableHead>
          <TableHead className="hidden sm:table-cell">User ID</TableHead>
          <TableHead className="hidden md:table-cell">IP</TableHead>
          <TableHead>Timestamp</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length === 0 && (
          <TableRow>
            <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
              No auth events
            </TableCell>
          </TableRow>
        )}
        {rows.map((r) => (
          <TableRow key={r.id}>
            <TableCell>
              <Badge
                variant="outline"
                className={`font-mono text-[10px] ${
                  String(r.event).includes("fail") || String(r.event).includes("error")
                    ? "border-destructive/50 text-destructive"
                    : ""
                }`}
              >
                {r.event}
              </Badge>
            </TableCell>
            <TableCell className="hidden font-mono text-xs text-muted-foreground sm:table-cell">
              {r.user_id.slice(0, 8)}…
            </TableCell>
            <TableCell className="hidden text-xs text-muted-foreground md:table-cell">
              {String(r.ip ?? "—")}
            </TableCell>
            <TableCell className="text-xs text-muted-foreground">
              {format(new Date(r.created_at), "PP HH:mm:ss")}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

type AiLogRow = {
  id: string;
  model: string;
  capability: string | null;
  status: string;
  tokens_in: number | null;
  tokens_out: number | null;
  latency_ms: number | null;
  error: string | null;
  user_id: string;
  created_at: string;
};

function AiLogTable({ rows }: { rows: AiLogRow[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Model</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="hidden sm:table-cell">Tokens</TableHead>
          <TableHead className="hidden md:table-cell">Latency</TableHead>
          <TableHead>Timestamp</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length === 0 && (
          <TableRow>
            <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
              No AI usage records
            </TableCell>
          </TableRow>
        )}
        {rows.map((r) => (
          <TableRow key={r.id}>
            <TableCell className="font-mono text-xs">{r.model}</TableCell>
            <TableCell>
              <Badge
                variant="outline"
                className={`text-[10px] ${
                  r.status === "error"
                    ? "border-destructive/50 text-destructive"
                    : "text-green-700 dark:text-green-400"
                }`}
              >
                {r.status}
              </Badge>
            </TableCell>
            <TableCell className="hidden text-xs text-muted-foreground sm:table-cell">
              {((r.tokens_in ?? 0) + (r.tokens_out ?? 0)).toLocaleString()}
            </TableCell>
            <TableCell className="hidden text-xs text-muted-foreground md:table-cell">
              {r.latency_ms ? `${r.latency_ms}ms` : "—"}
            </TableCell>
            <TableCell className="text-xs text-muted-foreground">
              {format(new Date(r.created_at), "PP HH:mm:ss")}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
