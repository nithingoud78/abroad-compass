import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2, Upload, Trash2, QrCode, Save } from "lucide-react";
import { StandardPageLayout } from "@/components/app/StandardPageLayout";

export const Route = createFileRoute("/_authenticated/admin/support")({
  component: AdminSupport,
});

type SupportSettings = {
  title: string;
  subtitle: string;
  ownerMessage: string;
  contributionMessage: string;
  qrImageVisible: boolean;
};

const DEFAULT_SETTINGS: SupportSettings = {
  title: "Support Abroad Compass",
  subtitle: "Help keep the project free",
  ownerMessage:
    "I built Abroad Compass because I couldn't find a single tool that brought together all the pieces of moving to Germany. It's completely free, and it always will be. There are no paywalls, no ads, and no premium tiers. I want to help as many students as possible.",
  contributionMessage:
    "If this project has helped you, you can voluntarily contribute to help cover the server costs and keep development going. Exactly like Blender. Scan the QR code below to contribute.",
  qrImageVisible: true,
};

function AdminSupport() {
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [settings, setSettings] = useState<SupportSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadSupportData();
  }, []);

  async function loadSupportData() {
    setLoading(true);

    // Load Settings
    const { data: settingsData } = await supabase
      .from("system_settings")
      .select("value")
      .eq("key", "support_page")
      .maybeSingle();

    if (settingsData?.value) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setSettings({ ...DEFAULT_SETTINGS, ...(settingsData.value as any) });
    }

    // Load QR Image
    const { data } = supabase.storage.from("public-assets").getPublicUrl("support-qr.png");
    setQrUrl(`${data.publicUrl}?t=${Date.now()}`);
    setLoading(false);
  }

  async function handleSaveSettings() {
    setSaving(true);
    const { error } = await supabase
      .from("system_settings")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .upsert({ key: "support_page", value: settings as any });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Settings saved successfully");
    }
    setSaving(false);
  }

  async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      return toast.error("Must be an image file");
    }

    // Validate 1:1 aspect ratio
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = async () => {
      const isSquare = img.width === img.height;
      if (!isSquare) {
        toast.error("QR Code image must have a 1:1 aspect ratio (square).");
        return;
      }

      setUploading(true);
      const { error: uploadError } = await supabase.storage
        .from("public-assets")
        .upload("support-qr.png", file, { upsert: true, cacheControl: "3600" });

      if (uploadError) {
        toast.error(uploadError.message);
      } else {
        toast.success("QR Code uploaded successfully");
        loadSupportData();
      }
      setUploading(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    };
  }

  async function handleDelete() {
    if (!confirm("Remove the Support QR code? Users will see a 'Not Configured' state.")) return;

    setUploading(true);
    const { error } = await supabase.storage.from("public-assets").remove(["support-qr.png"]);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("QR Code removed");
      setQrUrl(null);
    }
    setUploading(false);
  }

  return (
    <StandardPageLayout
      title="Support Settings"
      subtitle="Manage the Support & Contribution page shown to users"
    >
      <div className="grid gap-6 lg:grid-cols-2 max-w-6xl">
        <Card>
          <CardHeader>
            <CardTitle>Page Content</CardTitle>
            <CardDescription>Update the text shown on the support page.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Page Title</Label>
              <Input
                value={settings.title}
                onChange={(e) => setSettings({ ...settings, title: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Page Subtitle</Label>
              <Input
                value={settings.subtitle}
                onChange={(e) => setSettings({ ...settings, subtitle: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Owner Message</Label>
              <Textarea
                rows={4}
                value={settings.ownerMessage}
                onChange={(e) => setSettings({ ...settings, ownerMessage: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                The message from the creator emphasizing the project is free.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label>Contribution Message</Label>
              <Textarea
                rows={3}
                value={settings.contributionMessage}
                onChange={(e) => setSettings({ ...settings, contributionMessage: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">The call to action for the QR code.</p>
            </div>

            <Button onClick={handleSaveSettings} disabled={saving} className="w-full">
              {saving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save Content
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>QR Code</CardTitle>
                <CardDescription>1:1 aspect ratio PNG or JPG.</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="qr-visible" className="text-xs cursor-pointer">
                  Visible
                </Label>
                <Switch
                  id="qr-visible"
                  checked={settings.qrImageVisible}
                  onCheckedChange={(c) => {
                    setSettings({ ...settings, qrImageVisible: c });
                    // Optionally auto-save here, but we let them press "Save Content"
                  }}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl bg-accent/20">
              {loading ? (
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              ) : qrUrl ? (
                <img
                  src={qrUrl}
                  alt="Support QR"
                  className="w-48 h-48 object-contain rounded-lg shadow-sm bg-white p-2"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                    e.currentTarget.parentElement!.innerHTML =
                      '<div class="w-48 h-48 flex items-center justify-center bg-gray-100 rounded-md text-gray-400 flex-col gap-2"><QrCode class="h-10 w-10"/><span class="text-xs text-center">No QR uploaded yet</span></div>';
                  }}
                />
              ) : (
                <div className="w-48 h-48 flex items-center justify-center bg-gray-100 rounded-md text-gray-400 flex-col gap-2">
                  <QrCode className="h-10 w-10" />
                  <span className="text-xs text-center">No QR uploaded yet</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileUpload}
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex-1"
              >
                {uploading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4 mr-2" />
                )}
                Upload New Image
              </Button>

              {qrUrl && (
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={handleDelete}
                  disabled={uploading}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </StandardPageLayout>
  );
}
