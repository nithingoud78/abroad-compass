import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminProfile } from "@/lib/admin/admin.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useIsSuperAdmin } from "@/hooks/use-role";
import { toast } from "sonner";
import { useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { Loader2, UserCircle, Clock, ShieldCheck, LogOut } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/admin/profile")({
  head: () => ({ meta: [{ title: "Profile — Admin — Abroad Compass" }] }),
  component: AdminProfilePage,
});

function AdminProfilePage() {
  const profileFn = useServerFn(adminProfile);
  const { user } = useAuth();
  const { isSuperAdmin } = useIsSuperAdmin();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "profile"],
    queryFn: () => profileFn(),
  });

  const [displayName, setDisplayName] = useState<string | null>(null);
  const [savingName, setSavingName] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [savingPw, setSavingPw] = useState(false);

  const profile = data?.profile;
  const activity = data?.activity ?? [];
  const initials =
    (user?.user_metadata?.display_name as string | undefined)?.slice(0, 2).toUpperCase() ??
    user?.email?.slice(0, 2).toUpperCase() ??
    "AD";

  async function saveName() {
    const name = displayName ?? profile?.display_name ?? "";
    if (!name.trim()) return;
    setSavingName(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ display_name: name.trim(), updated_at: new Date().toISOString() })
        .eq("user_id", user!.id);
      if (error) throw error;
      await supabase.auth.updateUser({ data: { display_name: name.trim() } });
      qc.invalidateQueries({ queryKey: ["admin", "profile"] });
      toast.success("Display name updated");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSavingName(false);
    }
  }

  async function changePassword() {
    if (newPw !== confirmPw) {
      toast.error("Passwords do not match");
      return;
    }
    if (newPw.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setSavingPw(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPw });
      if (error) throw error;
      toast.success("Password changed successfully");
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSavingPw(false);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-16 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading profile…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Admin Profile</h1>
        <p className="text-sm text-muted-foreground">
          Manage your admin account and review your activity history.
        </p>
      </div>

      {/* Profile card */}
      <Card className="p-6">
        <div className="flex flex-wrap items-start gap-5">
          <Avatar className="h-16 w-16 shrink-0">
            <AvatarFallback className="bg-brand text-brand-foreground text-xl font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-display text-lg font-semibold">
                {profile?.display_name ?? user?.email?.split("@")[0]}
              </p>
              <Badge className="text-[10px]">
                <ShieldCheck className="mr-1 h-3 w-3" /> {isSuperAdmin ? "Super Admin" : "Admin"}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            {profile?.created_at && (
              <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                Member since {format(new Date(profile.created_at), "PP")}
              </p>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={signOut}>
            <LogOut className="mr-2 h-3.5 w-3.5" /> Sign out
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Edit display name */}
        <Card className="p-5">
          <h2 className="mb-4 flex items-center gap-2 font-medium">
            <UserCircle className="h-4 w-4 text-brand" /> Display Name
          </h2>
          <div className="flex gap-2">
            <Input
              value={displayName ?? profile?.display_name ?? ""}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your display name"
              className="flex-1"
            />
            <Button disabled={savingName} onClick={saveName}>
              {savingName ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
            </Button>
          </div>
        </Card>

        {/* Change password */}
        <Card className="p-5">
          <h2 className="mb-4 font-medium">Change Password</h2>
          <div className="space-y-3">
            <Input
              type="password"
              placeholder="New password"
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              autoComplete="new-password"
            />
            <Input
              type="password"
              placeholder="Confirm new password"
              value={confirmPw}
              onChange={(e) => setConfirmPw(e.target.value)}
              autoComplete="new-password"
            />
            <Button
              className="w-full"
              disabled={savingPw || !newPw || !confirmPw}
              onClick={changePassword}
            >
              {savingPw ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Update Password
            </Button>
          </div>
        </Card>
      </div>

      {/* Activity history */}
      <Card className="p-5">
        <h2 className="mb-4 font-medium">My Admin Activity (last 30)</h2>
        {activity.length === 0 && (
          <p className="text-sm text-muted-foreground">No admin actions recorded yet.</p>
        )}
        <div className="space-y-2">
          {activity.map((a) => (
            <div
              key={a.id}
              className="flex flex-wrap items-center gap-2 rounded-md border px-3 py-2"
            >
              <Badge variant="outline" className="font-mono text-[10px] shrink-0">
                {a.action}
              </Badge>
              <span className="text-sm text-muted-foreground">{a.entity}</span>
              <span className="ml-auto text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
