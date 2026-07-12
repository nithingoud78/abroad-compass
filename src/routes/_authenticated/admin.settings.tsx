import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminSystemHealth, adminSystemSettingUpsert } from "@/lib/admin/admin.functions";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Settings2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/settings")({
  head: () => ({ meta: [{ title: "Settings — Admin — Abroad Compass" }] }),
  component: AdminSettingsPage,
});

const TIMEZONES = [
  "UTC",
  "Asia/Kolkata",
  "Europe/Berlin",
  "America/New_York",
  "Asia/Tokyo",
  "America/Los_Angeles",
];

function AdminSettingsPage() {
  const healthFn = useServerFn(adminSystemHealth);
  const upsertFn = useServerFn(adminSystemSettingUpsert);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "system"],
    queryFn: () => healthFn(),
    staleTime: 60_000,
  });

  const upsertMut = useMutation({
    mutationFn: (v: { key: string; value: unknown }) => upsertFn({ data: v }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "system"] });
      toast.success("Setting saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const settings: Array<{ key: string; value: string }> =
    (data as { settings?: Array<{ key: string; value: string }> } | undefined)?.settings ?? [];
  const get = (key: string, fallback: string): string => {
    const s = settings.find((x: { key: string; value: string }) => x.key === key);
    if (!s) return fallback;
    return s.value.replace(/^"|"$/g, "");
  };

  const [appName, setAppName] = useState<string | null>(null);
  const [timezone, setTimezone] = useState<string | null>(null);
  const [socials, setSocials] = useState<Record<string, string> | null>(null);

  const getJson = (key: string, fallback: unknown) => {
    const s = settings.find((x: { key: string; value: string }) => x.key === key);
    if (!s) return fallback;
    try {
      return JSON.parse(s.value);
    } catch {
      return fallback;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-16 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading settings…
      </div>
    );
  }

  const displayAppName = appName ?? get("app_name", "Abroad Compass");
  const displayTimezone = timezone ?? get("timezone", "UTC");
  const displaySocials = socials ?? getJson("site_socials", {});

  function save(key: string, value: unknown) {
    upsertMut.mutate({ key, value });
  }

  function updateSocial(field: string, val: string) {
    setSocials((prev) => ({ ...(prev ?? displaySocials), [field]: val }));
  }

  function saveSocials() {
    save("site_socials", displaySocials);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">General Settings</h1>
        <p className="text-sm text-muted-foreground">
          Application-wide configuration. Changes take effect immediately.
        </p>
      </div>

      <Card className="divide-y">
        {/* App Name */}
        <SettingRow label="Application Name" description="Displayed across the app and in emails">
          <div className="flex gap-2">
            <Input
              value={displayAppName}
              onChange={(e) => setAppName(e.target.value)}
              className="max-w-xs"
            />
            <Button
              size="sm"
              variant="outline"
              disabled={upsertMut.isPending}
              onClick={() => save("app_name", displayAppName)}
            >
              {upsertMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
            </Button>
          </div>
        </SettingRow>

        {/* Timezone */}
        <SettingRow
          label="Default Timezone"
          description="Used for scheduled posts and notifications"
        >
          <div className="flex gap-2">
            <Select value={displayTimezone} onValueChange={(v) => setTimezone(v)}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIMEZONES.map((tz) => (
                  <SelectItem key={tz} value={tz}>
                    {tz}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              variant="outline"
              disabled={upsertMut.isPending}
              onClick={() => save("timezone", displayTimezone)}
            >
              {upsertMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
            </Button>
          </div>
        </SettingRow>

        {/* Maintenance Mode */}
        <SettingRow
          label="Maintenance Mode"
          description="When enabled, non-admin users will be redirected to the maintenance page."
        >
          <div className="flex gap-2">
            <Select
              value={get("maintenance_mode", "false")}
              onValueChange={(v) => save("maintenance_mode", v)}
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="false">Disabled (Live)</SelectItem>
                <SelectItem value="true">Enabled (Maintenance)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </SettingRow>
      </Card>

      <Card className="divide-y">
        {/* Social Links */}
        <SettingRow
          label="Social Links"
          description="These links appear in the landing page footer. Leave a field empty to hide the icon."
        >
          <div className="flex flex-col gap-3 sm:w-80">
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">Twitter / X</span>
              <Input
                value={displaySocials.twitter || ""}
                onChange={(e) => updateSocial("twitter", e.target.value)}
                placeholder="https://twitter.com/..."
              />
            </div>
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">GitHub</span>
              <Input
                value={displaySocials.github || ""}
                onChange={(e) => updateSocial("github", e.target.value)}
                placeholder="https://github.com/..."
              />
            </div>
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">LinkedIn</span>
              <Input
                value={displaySocials.linkedin || ""}
                onChange={(e) => updateSocial("linkedin", e.target.value)}
                placeholder="https://linkedin.com/in/..."
              />
            </div>
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">Website</span>
              <Input
                value={displaySocials.website || ""}
                onChange={(e) => updateSocial("website", e.target.value)}
                placeholder="https://yourwebsite.com"
              />
            </div>
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">Email</span>
              <Input
                value={displaySocials.email || ""}
                onChange={(e) => updateSocial("email", e.target.value)}
                placeholder="hello@example.com"
              />
            </div>
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">Support Email</span>
              <Input
                value={displaySocials.support_email || ""}
                onChange={(e) => updateSocial("support_email", e.target.value)}
                placeholder="support@example.com"
              />
            </div>
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">Discord</span>
              <Input
                value={displaySocials.discord || ""}
                onChange={(e) => updateSocial("discord", e.target.value)}
                placeholder="https://discord.gg/..."
              />
            </div>
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">YouTube</span>
              <Input
                value={displaySocials.youtube || ""}
                onChange={(e) => updateSocial("youtube", e.target.value)}
                placeholder="https://youtube.com/..."
              />
            </div>
            <Button
              className="mt-2 w-fit"
              size="sm"
              disabled={upsertMut.isPending}
              onClick={saveSocials}
            >
              {upsertMut.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Save Social Links"
              )}
            </Button>
          </div>
        </SettingRow>
      </Card>

      {/* Raw settings viewer */}
      <Card className="p-5">
        <h2 className="mb-3 flex items-center gap-2 font-medium">
          <Settings2 className="h-4 w-4 text-brand" /> All Settings
        </h2>
        <div className="space-y-2">
          {settings.map((s) => (
            <div
              key={s.key}
              className="flex flex-wrap items-center gap-2 rounded-md bg-muted/40 px-3 py-2"
            >
              <span className="font-mono text-xs text-muted-foreground">{s.key}</span>
              <span className="flex-1 font-mono text-xs">
                {s.key.includes("key") ? "••••••••" : s.value}
              </span>
            </div>
          ))}
          {settings.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No settings found. Run the migration to seed defaults.
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}

function SettingRow({
  label,
  description,
  children,
}: {
  label: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-medium">{label}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}
