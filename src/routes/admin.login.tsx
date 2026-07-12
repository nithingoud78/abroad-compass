import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Loader2 } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

export const Route = createFileRoute("/admin/login")({
  head: () => ({
    meta: [
      { title: "Admin Sign in — Abroad Compass" },
      { name: "description", content: "Sign in to the Abroad Compass Admin Portal." },
    ],
  }),
  component: AdminAuthPage,
});

const emailSchema = z.string().trim().email().max(255);
const passwordSchema = z.string().min(8).max(128);

function AdminAuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "forgot">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/admin/dashboard" });
    });
  }, [navigate]);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      emailSchema.parse(email);
      passwordSchema.parse(password);
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      if (data.user) {
        const { data: roles, error: rolesError } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", data.user.id);

        if (rolesError) throw rolesError;

        const isAdmin = (roles ?? []).some((r) => r.role === "admin" || r.role === "super_admin");

        if (!isAdmin) {
          await supabase.auth.signOut();
          toast.error("You are not authorized to access the Admin Portal.");
          setBusy(false);
          return;
        }
      }

      if (!remember) {
        sessionStorage.setItem("ac-ephemeral", "1");
      }
      toast.success("Welcome to the Admin Portal.");
      navigate({ to: "/admin/dashboard" });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      emailSchema.parse(email);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast.success("Reset email sent.");
      setMode("signin");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Reset failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-elegant sm:p-8"
      >
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 rounded-full bg-brand/10 p-3 text-brand">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Admin Portal</h1>
          <p className="mt-1 text-sm text-muted-foreground">Sign in to manage Abroad Compass</p>
        </div>

        {mode === "forgot" ? (
          <form onSubmit={handleForgot} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={busy} className="w-full">
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Send reset email
            </Button>
            <button
              type="button"
              onClick={() => setMode("signin")}
              className="block w-full text-center text-sm text-muted-foreground hover:text-foreground"
            >
              Back to sign in
            </button>
          </form>
        ) : (
          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email-in">Email</Label>
              <Input
                id="email-in"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pw-in">Password</Label>
              <Input
                id="pw-in"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-muted-foreground">
                <Checkbox checked={remember} onCheckedChange={(v) => setRemember(Boolean(v))} />{" "}
                Remember me
              </label>
              <button
                type="button"
                onClick={() => setMode("forgot")}
                className="text-muted-foreground hover:text-foreground"
              >
                Forgot password?
              </button>
            </div>
            <Button type="submit" disabled={busy} className="w-full">
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Sign in
            </Button>
          </form>
        )}
      </motion.div>
    </div>
  );
}
