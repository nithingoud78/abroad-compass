import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Bell, BellRing, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/settings/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — Abroad Compass" },
      { name: "description", content: "Manage in-app, browser, and reminder notifications." },
    ],
  }),
  component: NotificationsSettings,
});

type Prefs = {
  notify_push_enabled: boolean;
  notify_email_digest: boolean;
  notify_deadline_reminders: boolean;
  notify_study_reminders: boolean;
};

const DEFAULTS: Prefs = {
  notify_push_enabled: false,
  notify_email_digest: false,
  notify_deadline_reminders: true,
  notify_study_reminders: true,
};

function NotificationsSettings() {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState<Prefs>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== "undefined" ? Notification.permission : "default",
  );

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("user_preferences")
        .select(
          "notify_push_enabled, notify_email_digest, notify_deadline_reminders, notify_study_reminders",
        )
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) {
        setPrefs({
          notify_push_enabled: !!data.notify_push_enabled,
          notify_email_digest: !!data.notify_email_digest,
          notify_deadline_reminders: data.notify_deadline_reminders ?? true,
          notify_study_reminders: data.notify_study_reminders ?? true,
        });
      }
      setLoading(false);
    })();
  }, [user]);

  async function save(next: Partial<Prefs>) {
    if (!user) return;
    const merged = { ...prefs, ...next };
    setPrefs(merged);
    setSaving(true);
    const { error } = await supabase
      .from("user_preferences")
      .upsert({ user_id: user.id, ...merged }, { onConflict: "user_id" });
    setSaving(false);
    if (error) toast.error(error.message);
  }

  async function requestBrowserPermission() {
    if (typeof Notification === "undefined") {
      toast.error("Your browser does not support notifications");
      return;
    }
    const p = await Notification.requestPermission();
    setPermission(p);
    if (p === "granted") {
      new Notification("Abroad Compass", { body: "You'll get reminders here." });
      await save({ notify_push_enabled: true });
      toast.success("Browser notifications enabled");
    } else {
      toast.error("Permission denied");
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl py-10 text-center text-sm text-muted-foreground">
        <Loader2 className="mx-auto h-4 w-4 animate-spin" /> Loading preferences…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <header>
        <h1 className="font-display text-3xl font-bold tracking-tight">Notifications</h1>
        <p className="text-sm text-muted-foreground">
          Choose which reminders you want. All notifications are in-app or in your browser — never
          marketing email.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BellRing className="h-4 w-4 text-brand" /> Browser notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-md border bg-muted/20 p-3">
            <div className="min-w-0">
              <p className="text-sm font-medium">Show desktop / mobile alerts</p>
              <p className="text-xs text-muted-foreground">Permission: {permission}</p>
            </div>
            {permission !== "granted" ? (
              <Button size="sm" onClick={requestBrowserPermission}>
                Enable
              </Button>
            ) : (
              <Switch
                checked={prefs.notify_push_enabled}
                onCheckedChange={(v) => save({ notify_push_enabled: v })}
                aria-label="Toggle push notifications"
              />
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Bell className="h-4 w-4 text-brand" /> Reminder types
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Row
            label="Deadline reminders"
            hint="Application, visa, and document deadlines coming up."
            checked={prefs.notify_deadline_reminders}
            onChange={(v) => save({ notify_deadline_reminders: v })}
          />
          <Row
            label="Study reminders"
            hint="Daily German practice and streak nudges."
            checked={prefs.notify_study_reminders}
            onChange={(v) => save({ notify_study_reminders: v })}
          />
          <Row
            label="Weekly summary in inbox (in-app)"
            hint="A recap card on your dashboard every Monday."
            checked={prefs.notify_email_digest}
            onChange={(v) => save({ notify_email_digest: v })}
          />
        </CardContent>
      </Card>

      {saving ? (
        <p className="text-center text-xs text-muted-foreground">
          <Loader2 className="mr-1 inline h-3 w-3 animate-spin" /> Saving…
        </p>
      ) : null}
    </div>
  );
}

function Row({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border p-3">
      <div className="min-w-0">
        <Label className="text-sm font-medium">{label}</Label>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} aria-label={label} />
    </div>
  );
}
