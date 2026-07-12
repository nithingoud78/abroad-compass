import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { HeartHandshake, QrCode, Quote } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { StandardPageLayout } from "@/components/app/StandardPageLayout";

export const Route = createFileRoute("/_authenticated/support")({
  component: SupportPage,
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
  subtitle: "Open, free, and community-driven",
  ownerMessage:
    "Abroad Compass was built to solve a specific problem: navigating the complex process of moving to Germany. The project is and always will be completely free, open, and without premium tiers. Our goal is to provide a comprehensive, accessible tool for all international students.",
  contributionMessage:
    "Like many independent tools, Abroad Compass relies on voluntary community support to cover infrastructure and development costs. If you find the tool valuable, consider contributing via the QR code below.",
  qrImageVisible: true,
};

function SupportPage() {
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [settings, setSettings] = useState<SupportSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSupportData() {
      // Fetch settings
      const { data: settingsData } = await supabase
        .from("system_settings")
        .select("value")
        .eq("key", "support_page")
        .maybeSingle();

      if (settingsData?.value) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setSettings({ ...DEFAULT_SETTINGS, ...(settingsData.value as any) });
      }

      // Fetch the QR code image from the public-assets bucket.
      const { data } = supabase.storage.from("public-assets").getPublicUrl("support-qr.png");
      setQrUrl(data.publicUrl);

      setLoading(false);
    }

    loadSupportData();
  }, []);

  if (loading) {
    return (
      <StandardPageLayout title="Loading..." subtitle="Support">
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </StandardPageLayout>
    );
  }

  return (
    <StandardPageLayout title={settings.title} subtitle={settings.subtitle}>
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-card border flex flex-col bg-brand/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Quote className="h-5 w-5 text-brand" />A message from the creator
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-center py-6 text-muted-foreground leading-relaxed">
            {settings.ownerMessage}
          </CardContent>
        </Card>

        <Card className="shadow-card border flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <HeartHandshake className="h-5 w-5 text-brand" />
              Voluntary Contribution
            </CardTitle>
            <CardDescription>{settings.contributionMessage}</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col items-center justify-center py-6">
            {settings.qrImageVisible && (
              <div className="bg-white p-4 rounded-xl shadow-sm mb-2">
                {qrUrl ? (
                  <img
                    src={qrUrl}
                    alt="Contribution QR Code"
                    className="w-48 h-48 object-contain"
                    onError={(e) => {
                      // Fallback if the image doesn't exist
                      e.currentTarget.style.display = "none";
                      e.currentTarget.parentElement!.innerHTML =
                        '<div class="w-48 h-48 flex items-center justify-center bg-gray-100 rounded-md text-gray-400 flex-col gap-2"><QrCode class="h-10 w-10"/><span class="text-xs text-center">QR Code not configured</span></div>';
                    }}
                  />
                ) : (
                  <div className="w-48 h-48 flex items-center justify-center bg-gray-100 rounded-md text-gray-400 flex-col gap-2">
                    <QrCode className="h-10 w-10" />
                    <span className="text-xs text-center">QR Code not configured</span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </StandardPageLayout>
  );
}
