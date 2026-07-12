import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  listLoginHistory,
  listAuditLog,
  revokeOtherSessions,
  regenerateBackupCodes,
  countBackupCodes,
} from "@/lib/security/security.functions";
import { updateAiUserSettings } from "@/lib/ai/ai.functions";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Shield, Key, Monitor, ClipboardCheck, ShieldAlert, LogOut, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

export const Route = createFileRoute("/_authenticated/settings/security")({
  head: () => ({
    meta: [
      { title: "Security — Abroad Compass" },
      {
        name: "description",
        content: "Manage two-factor authentication, backup codes, sessions, and account activity.",
      },
    ],
  }),
  component: SecurityPage,
});

function SecurityPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const historyFn = useServerFn(listLoginHistory);
  const auditFn = useServerFn(listAuditLog);
  const revokeFn = useServerFn(revokeOtherSessions);
  const regenFn = useServerFn(regenerateBackupCodes);
  const countFn = useServerFn(countBackupCodes);

  const historyQ = useQuery({
    queryKey: ["login-history"],
    queryFn: () => historyFn(),
    enabled: !!user,
  });
  const auditQ = useQuery({ queryKey: ["audit-log"], queryFn: () => auditFn(), enabled: !!user });
  const codesQ = useQuery({
    queryKey: ["backup-codes-count"],
    queryFn: () => countFn(),
    enabled: !!user,
  });

  const [newCodes, setNewCodes] = useState<string[] | null>(null);
  const [pwd, setPwd] = useState("");
  const [pwdBusy, setPwdBusy] = useState(false);
  const [aiProvider, setAiProvider] = useState("google");
  const [aiKey, setAiKey] = useState("");

  const updateAiFn = useServerFn(updateAiUserSettings);
  const aiMut = useMutation({
    mutationFn: () =>
      updateAiFn({
        data: {
          provider: aiProvider,
          custom_api_key: aiKey || undefined,
        },
      }),
    onSuccess: () => toast.success("AI Configuration saved"),
    onError: (e: Error) => toast.error(e.message),
  });

  const revokeMut = useMutation({
    mutationFn: () => revokeFn(),
    onSuccess: () => {
      toast.success("Other sessions signed out");
      qc.invalidateQueries({ queryKey: ["login-history"] });
      qc.invalidateQueries({ queryKey: ["audit-log"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const regenMut = useMutation({
    mutationFn: () => regenFn(),
    onSuccess: (res) => {
      setNewCodes(res.codes);
      qc.invalidateQueries({ queryKey: ["backup-codes-count"] });
      qc.invalidateQueries({ queryKey: ["audit-log"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function changePassword() {
    if (pwd.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setPwdBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pwd });
    setPwdBusy(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Password updated");
      setPwd("");
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <header>
        <h1 className="font-display text-3xl font-bold tracking-tight">Security</h1>
        <p className="text-sm text-muted-foreground">
          Two-factor authentication, backup codes, active sessions, and account activity.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Key className="h-4 w-4 text-brand" /> Password
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Label htmlFor="new-pwd">New password</Label>
          <div className="flex gap-2">
            <Input
              id="new-pwd"
              type="password"
              value={pwd}
              onChange={(e) => setPwd(e.target.value)}
              placeholder="At least 8 characters"
              autoComplete="new-password"
            />
            <Button onClick={changePassword} disabled={pwdBusy || pwd.length < 8}>
              {pwdBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update"}
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Passwords are checked against known breaches before being accepted.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldAlert className="h-4 w-4 text-brand" /> Backup codes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            One-time codes for account recovery if you lose access to your device.
          </p>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{codesQ.data?.unused ?? 0} unused</Badge>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => regenMut.mutate()}
              disabled={regenMut.isPending}
            >
              {regenMut.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Generate 10 new codes
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Key className="h-4 w-4 text-brand" /> Bring Your Own Key (Optional)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Override the global AI provider with your own API key.
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1">
              <Label htmlFor="ai-provider">Provider</Label>
              <select
                id="ai-provider"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                value={aiProvider}
                onChange={(e) => setAiProvider(e.target.value)}
              >
                <option value="google">Google AI Studio</option>
                <option value="openrouter">OpenRouter</option>
              </select>
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="ai-key">API Key</Label>
              <div className="flex gap-2">
                <Input
                  id="ai-key"
                  type="password"
                  placeholder="Leave empty to use global key"
                  value={aiKey}
                  onChange={(e) => setAiKey(e.target.value)}
                />
                <Button onClick={() => aiMut.mutate()} disabled={aiMut.isPending}>
                  {aiMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Monitor className="h-4 w-4 text-brand" /> Sessions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Sign out all other browsers and devices. Your current session stays active.
          </p>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => revokeMut.mutate()}
            disabled={revokeMut.isPending}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign out other devices
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-4 w-4 text-brand" /> Recent sign-ins
          </CardTitle>
        </CardHeader>
        <CardContent>
          {historyQ.isLoading ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Loading…</p>
          ) : (historyQ.data ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No history yet.</p>
          ) : (
            <ul className="divide-y">
              {(historyQ.data ?? []).slice(0, 20).map((row) => (
                <li
                  key={row.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm"
                >
                  <div className="min-w-0">
                    <p className="font-medium">{prettyEvent(row.event)}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {row.user_agent ?? "unknown device"}
                      {row.ip ? ` · ${row.ip}` : ""}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {formatDistanceToNow(new Date(row.created_at), { addSuffix: true })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ClipboardCheck className="h-4 w-4 text-brand" /> Account activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {auditQ.isLoading ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Loading…</p>
          ) : (auditQ.data ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No activity yet.</p>
          ) : (
            <ul className="divide-y">
              {(auditQ.data ?? []).slice(0, 20).map((row) => (
                <li key={row.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                  <div className="min-w-0">
                    <p className="font-medium">{row.action}</p>
                    {row.entity ? (
                      <p className="text-xs text-muted-foreground">
                        {row.entity}
                        {row.entity_id ? ` · ${row.entity_id}` : ""}
                      </p>
                    ) : null}
                  </div>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {formatDistanceToNow(new Date(row.created_at), { addSuffix: true })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!newCodes} onOpenChange={(o) => !o && setNewCodes(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Your new backup codes</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Save these somewhere safe — they won't be shown again. Each code can be used once.
          </p>
          <div className="grid grid-cols-2 gap-2 rounded-md border bg-muted/30 p-3 font-mono text-sm">
            {(newCodes ?? []).map((c) => (
              <div key={c}>{c}</div>
            ))}
          </div>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => {
                navigator.clipboard.writeText((newCodes ?? []).join("\n"));
                toast.success("Copied");
              }}
            >
              Copy all
            </Button>
            <Button onClick={() => setNewCodes(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function prettyEvent(e: string) {
  return e.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
