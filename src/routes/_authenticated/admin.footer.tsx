/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/footer")({
  component: AdminFooter,
});

type FooterSettings = {
  copyright_text: string;
  contact_email: string;
  twitter_url: string;
  linkedin_url: string;
  github_url: string;
  instagram_url: string;
};

const DEFAULT_SETTINGS: FooterSettings = {
  copyright_text: "© 2026 AbroadCompass. All rights reserved.",
  contact_email: "support@abroadcompass.com",
  twitter_url: "",
  linkedin_url: "",
  github_url: "",
  instagram_url: "",
};

function AdminFooter() {
  const [settings, setSettings] = useState<FooterSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    setLoading(true);
    // Suppress TS error by casting
    const { data, error } = await (supabase.from as any)("system_settings")
      .select("value")
      .eq("key", "footer_settings")
      .maybeSingle();

    if (error) {
      console.error("Error loading footer settings:", error);
      toast.error(`Error loading settings: ${error.message}`);
    } else if (data && data.value) {
      setSettings({ ...DEFAULT_SETTINGS, ...data.value });
    }
    setLoading(false);
  }

  async function handleSave() {
    setSaving(true);
    const { error } = await (supabase.from as any)("system_settings").upsert({
      key: "footer_settings",
      value: settings,
      updated_at: new Date().toISOString(),
    });

    setSaving(false);
    if (error) {
      console.error(error);
      toast.error(`Failed to save settings: ${error.message}`);
    } else {
      toast.success("Footer settings saved successfully");
    }
  }

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Footer Settings</h2>
        <p className="text-muted-foreground">Manage global footer links and content.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>General Info</CardTitle>
          <CardDescription>
            Main text and contact information displayed in the footer.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Copyright Text</label>
            <Input
              value={settings.copyright_text}
              onChange={(e) => setSettings({ ...settings, copyright_text: e.target.value })}
              placeholder="© 2026 AbroadCompass. All rights reserved."
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Contact Email</label>
            <Input
              value={settings.contact_email}
              onChange={(e) => setSettings({ ...settings, contact_email: e.target.value })}
              placeholder="support@abroadcompass.com"
              type="email"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Social Links</CardTitle>
          <CardDescription>Leave empty to hide the icon.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Twitter / X URL</label>
              <Input
                value={settings.twitter_url}
                onChange={(e) => setSettings({ ...settings, twitter_url: e.target.value })}
                placeholder="https://twitter.com/abroadcompass"
                type="url"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">LinkedIn URL</label>
              <Input
                value={settings.linkedin_url}
                onChange={(e) => setSettings({ ...settings, linkedin_url: e.target.value })}
                placeholder="https://linkedin.com/company/..."
                type="url"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">GitHub URL</label>
              <Input
                value={settings.github_url}
                onChange={(e) => setSettings({ ...settings, github_url: e.target.value })}
                placeholder="https://github.com/..."
                type="url"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Instagram URL</label>
              <Input
                value={settings.instagram_url}
                onChange={(e) => setSettings({ ...settings, instagram_url: e.target.value })}
                placeholder="https://instagram.com/..."
                type="url"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Save Settings
        </Button>
      </div>
    </div>
  );
}
