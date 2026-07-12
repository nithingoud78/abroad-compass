import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Sun, Moon, Monitor, LogOut } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/settings/")({
  head: () => ({ meta: [{ title: "Settings — Abroad Compass" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [originalUsername, setOriginalUsername] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [targetDate, setTargetDate] = useState("");
  const [level, setLevel] = useState("A1");

  // AI Settings
  const [aiProvider, setAiProvider] = useState<string>("default");
  const [aiModel, setAiModel] = useState("");
  const [aiApiKey, setAiApiKey] = useState("");
  const [aiBaseUrl, setAiBaseUrl] = useState("");
  const [testingAi, setTestingAi] = useState(false);

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return;
        setDisplayName(data.display_name ?? "");
        setUsername(data.username ?? "");
        setOriginalUsername(data.username ?? "");
        setTargetDate(data.germany_target_date ?? "");
        setLevel(data.current_german_level ?? "A1");
        if (
          data.theme &&
          (data.theme === "light" || data.theme === "dark" || data.theme === "system")
        ) {
          setTheme(data.theme);
        }
      });
  }, [user, setTheme]);

  useEffect(() => {
    if (!username || username === originalUsername) {
      setUsernameError("");
      return;
    }

    // validate format
    if (username.length < 3 || username.length > 30) {
      setUsernameError("Must be between 3 and 30 characters");
      return;
    }
    if (!/^[a-z0-9._]+$/.test(username)) {
      setUsernameError("Only lowercase letters, numbers, periods, and underscores allowed");
      return;
    }

    const checkAvailability = async () => {
      setUsernameChecking(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("username", username)
        .maybeSingle();

      setUsernameChecking(false);
      if (error) {
        setUsernameError("Error checking availability");
      } else if (data && data.user_id !== user?.id) {
        setUsernameError("Username is taken");
      } else {
        setUsernameError("");
      }
    };

    const timer = setTimeout(checkAvailability, 500);
    return () => clearTimeout(timer);
  }, [username, originalUsername, user?.id]);

  async function handleThemeChange(newTheme: "light" | "dark" | "system") {
    setTheme(newTheme);
    if (!user) return;
    await supabase.from("profiles").update({ theme: newTheme }).eq("user_id", user.id);
  }

  async function save() {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: displayName,
        username: username || null,
        germany_target_date: targetDate || null,
        current_german_level: level,
        theme,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);

    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Saved");
  }

  async function testConnection() {
    setTestingAi(true);
    // save first to make sure settings are updated in db
    await save();
    try {
      const { testAiConnection } = await import("@/lib/ai/ai.functions");
      const result = await testAiConnection();
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (e: unknown) {
      const err = e as Error;
      toast.error(err.message || "Failed to test connection");
    } finally {
      setTestingAi(false);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <p className="text-sm text-muted-foreground">Settings</p>
        <h1 className="font-display text-3xl font-bold tracking-tight">Account & preferences</h1>
      </header>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-base">Profile</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Display name</Label>
            <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Username</Label>
            <Input
              value={username}
              onChange={(e) =>
                setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, ""))
              }
              className={usernameError ? "border-red-500 focus-visible:ring-red-500" : ""}
            />
            {usernameChecking && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" /> Checking...
              </p>
            )}
            {usernameError && !usernameChecking && (
              <p className="text-xs text-red-500">{usernameError}</p>
            )}
            {!usernameError && !usernameChecking && username && username !== originalUsername && (
              <p className="text-xs text-green-500">Username available</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input value={user?.email ?? ""} disabled />
          </div>
          <div className="space-y-1.5">
            <Label>Germany target date</Label>
            <Input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>German level</Label>
            <Select value={level} onValueChange={setLevel}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["None", "A1", "A2", "B1", "B2", "C1", "C2"].map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-base">AI Configuration (BYOK)</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Override the global AI configuration with your own API key.
          </p>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label>AI Provider</Label>
            <Select value={aiProvider} onValueChange={setAiProvider}>
              <SelectTrigger>
                <SelectValue placeholder="System Default" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">System Default</SelectItem>
                <SelectItem value="google">Google Gemini</SelectItem>
                <SelectItem value="openai">OpenAI</SelectItem>
                <SelectItem value="openrouter">OpenRouter</SelectItem>
                <SelectItem value="custom">Custom (OpenAI Compatible)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {aiProvider !== "default" && (
            <>
              {aiProvider === "custom" && (
                <div className="space-y-1.5">
                  <Label>Base URL</Label>
                  <Input
                    value={aiBaseUrl}
                    onChange={(e) => setAiBaseUrl(e.target.value)}
                    placeholder="https://api.openai.com/v1"
                  />
                </div>
              )}
              <div className="space-y-1.5">
                <Label>Model ID</Label>
                <Input
                  value={aiModel}
                  onChange={(e) => setAiModel(e.target.value)}
                  placeholder="e.g. google/gemini-1.5-flash"
                />
              </div>
              <div className="space-y-1.5">
                <Label>API Key</Label>
                <Input
                  type="password"
                  value={aiApiKey}
                  onChange={(e) => setAiApiKey(e.target.value)}
                  placeholder="sk-..."
                />
              </div>
              <div className="pt-2">
                <Button variant="secondary" onClick={testConnection} disabled={testingAi}>
                  {testingAi && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Test Connection
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-base">Theme</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            <ThemeOption
              icon={<Sun className="h-4 w-4" />}
              label="Light"
              active={theme === "light"}
              onClick={() => handleThemeChange("light")}
            />
            <ThemeOption
              icon={<Moon className="h-4 w-4" />}
              label="Dark"
              active={theme === "dark"}
              onClick={() => handleThemeChange("dark")}
            />
            <ThemeOption
              icon={<Monitor className="h-4 w-4" />}
              label="System"
              active={theme === "system"}
              onClick={() => handleThemeChange("system")}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={signOut}>
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </Button>
        <Button onClick={save} disabled={saving || !!usernameError || usernameChecking}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save changes
        </Button>
      </div>
    </div>
  );
}

function ThemeOption({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center gap-2 rounded-xl border p-4 transition-colors ${active ? "border-brand bg-brand/10" : "hover:bg-muted/50"}`}
    >
      {icon}
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}
