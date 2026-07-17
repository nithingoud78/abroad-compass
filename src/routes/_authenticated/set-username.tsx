import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Compass, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/set-username")({
  head: () => ({
    meta: [{ title: "Choose a Username — Abroad Compass" }],
  }),
  component: SetUsernamePage,
});

function SetUsernamePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [username, setUsername] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [checking, setChecking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("username")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.username) {
          navigate({ to: "/dashboard" });
        } else {
          setReady(true);
        }
      });
  }, [user, navigate]);

  useEffect(() => {
    if (!username) {
      setUsernameError("");
      return;
    }
    
    if (username.length < 3 || username.length > 30) {
      setUsernameError("Must be between 3 and 30 characters");
      return;
    }
    if (!/^[a-z0-9._]+$/.test(username)) {
      setUsernameError("Only lowercase letters, numbers, periods, and underscores allowed");
      return;
    }

    const checkAvailability = async () => {
      setChecking(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("username", username)
        .maybeSingle();

      setChecking(false);
      if (error) {
        setUsernameError("Error checking availability");
      } else if (data && data.user_id !== user?.id) {
        setUsernameError("Already taken");
      } else {
        setUsernameError("");
      }
    };

    const timer = setTimeout(checkAvailability, 500);
    return () => clearTimeout(timer);
  }, [username, user?.id]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (checking || usernameError || !username || !user) return;
    
    setSaving(true);
    try {
      const { error } = await supabase.from("profiles").update({ username }).eq("user_id", user.id);
      if (error) throw error;
      
      toast.success("Username saved!");
      // Send them to dashboard, or to onboarding if they haven't completed it
      const { data: profile } = await supabase.from("profiles").select("onboarding_completed").eq("user_id", user.id).single();
      if (!profile?.onboarding_completed) {
         navigate({ to: "/onboarding" });
      } else {
         navigate({ to: "/dashboard" });
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to save username");
    } finally {
      setSaving(false);
    }
  }

  if (!ready) return null;

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md space-y-6"
      >
        <div className="flex justify-center">
          <span className="grid h-12 w-12 place-items-center rounded-xl bg-foreground text-background">
            <Compass className="h-6 w-6" />
          </span>
        </div>
        
        <div className="text-center space-y-2">
          <h1 className="font-display text-2xl font-bold tracking-tight">Choose your username</h1>
          <p className="text-sm text-muted-foreground">
            Usernames are now required. Choose one to continue.
          </p>
        </div>

        <div className="rounded-2xl border bg-card p-6 shadow-card sm:p-8">
          <form onSubmit={handleSave} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                placeholder="e.g. johndoe"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, ""))}
                className={usernameError ? "border-destructive focus-visible:ring-destructive" : ""}
                required
              />
              <div className="flex items-center min-h-[20px]">
                {checking ? (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" /> Checking availability...
                  </p>
                ) : usernameError ? (
                  <p className="text-xs text-destructive">❌ {usernameError}</p>
                ) : username ? (
                  <p className="text-xs text-green-500">✅ Available</p>
                ) : null}
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={!username || !!usernameError || checking || saving}
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Continue
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
