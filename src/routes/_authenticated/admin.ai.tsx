import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  adminSystemHealth,
  adminSystemSettingUpsert,
  testAiConnection,
} from "@/lib/admin/admin.functions";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useState } from "react";
import { Loader2, Bot, Eye, EyeOff, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/ai")({
  head: () => ({ meta: [{ title: "AI API — Admin — Abroad Compass" }] }),
  component: AdminAiPage,
});

const AI_PROVIDERS = ["google", "openrouter", "openai", "custom"] as const;

const PROVIDER_BASE_URLS: Record<string, string> = {
  google: "https://generativelanguage.googleapis.com/v1beta/openai",
  openrouter: "https://openrouter.ai/api/v1",
  openai: "https://api.openai.com/v1",
};

function AdminAiPage() {
  const healthFn = useServerFn(adminSystemHealth);
  const upsertFn = useServerFn(adminSystemSettingUpsert);
  const testAiFn = useServerFn(testAiConnection);
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
      toast.success("AI Settings saved");
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

  const [aiProvider, setAiProvider] = useState<string | null>(null);
  const [aiModel, setAiModel] = useState<string | null>(null);
  const [googleKey, setGoogleKey] = useState<string | null>(null);
  const [openRouterKey, setOpenRouterKey] = useState<string | null>(null);
  const [openAiKey, setOpenAiKey] = useState<string | null>(null);
  const [customKey, setCustomKey] = useState<string | null>(null);
  const [customUrl, setCustomUrl] = useState<string | null>(null);

  const [testingAi, setTestingAi] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "connected" | "failed">("idle");
  const [showKey, setShowKey] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-16 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading AI configuration…
      </div>
    );
  }

  const displayProvider = aiProvider ?? get("ai_provider_default", "google");
  const displayModel = aiModel ?? get("ai_model_default", "google/gemini-2.5-flash");

  const currentKeyDisplay =
    displayProvider === "google"
      ? (googleKey ?? get("ai_google_key", ""))
      : displayProvider === "openrouter"
        ? (openRouterKey ?? get("ai_openrouter_key", ""))
        : displayProvider === "openai"
          ? (openAiKey ?? get("ai_openai_key", ""))
          : (customKey ?? get("ai_custom_key", ""));

  const displayBaseUrl =
    displayProvider === "custom"
      ? (customUrl ?? get("ai_custom_url", ""))
      : PROVIDER_BASE_URLS[displayProvider] || "";

  function updateCurrentKey(val: string) {
    if (displayProvider === "google") setGoogleKey(val);
    else if (displayProvider === "openrouter") setOpenRouterKey(val);
    else if (displayProvider === "openai") setOpenAiKey(val);
    else setCustomKey(val);
  }

  async function handleSaveAll() {
    try {
      const promises = [
        upsertMut.mutateAsync({ key: "ai_provider_default", value: displayProvider }),
        upsertMut.mutateAsync({ key: "ai_model_default", value: displayModel }),
        upsertMut.mutateAsync({ key: `ai_${displayProvider}_key`, value: currentKeyDisplay }),
      ];
      if (displayProvider === "custom") {
        promises.push(upsertMut.mutateAsync({ key: "ai_custom_url", value: displayBaseUrl }));
      }
      await Promise.all(promises);
    } catch (e: unknown) {
      console.error(e);
    }
  }

  async function handleTestAi() {
    setTestingAi(true);
    try {
      const res = await testAiFn({
        data: {
          provider: displayProvider,
          model: displayModel,
          apiKey: currentKeyDisplay,
          baseUrl: displayBaseUrl,
        },
      });
      if (res.success) {
        toast.success(`Connection successful!`);
        setConnectionStatus("connected");
      } else {
        toast.error(`Connection failed: ${res.error}`);
        setConnectionStatus("failed");
      }
    } catch (e: unknown) {
      toast.error((e as Error).message || "Failed to test connection");
      setConnectionStatus("failed");
    } finally {
      setTestingAi(false);
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="font-display text-2xl font-semibold flex items-center gap-2">
          <Bot className="h-6 w-6 text-brand" /> AI API Configuration
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configure the generative AI engine powering Smart Comparison, Daily Summaries, and
          Analysis.
        </p>
      </div>

      <Card className="divide-y border-t-4 border-t-brand">
        {/* Status Banner */}
        <div
          className={cn(
            "p-4 flex items-center justify-between transition-colors",
            connectionStatus === "connected"
              ? "bg-green-50 dark:bg-green-950/20"
              : connectionStatus === "failed"
                ? "bg-destructive/10"
                : "bg-muted/30",
          )}
        >
          <div className="flex items-center gap-3">
            {connectionStatus === "connected" ? (
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-500" />
            ) : connectionStatus === "failed" ? (
              <XCircle className="h-5 w-5 text-destructive" />
            ) : (
              <AlertCircle className="h-5 w-5 text-muted-foreground" />
            )}
            <div>
              <p className="font-medium text-sm">AI Service Status</p>
              <p
                className={cn(
                  "text-xs",
                  connectionStatus === "connected"
                    ? "text-green-600 dark:text-green-500 font-semibold"
                    : connectionStatus === "failed"
                      ? "text-destructive font-semibold"
                      : "text-muted-foreground",
                )}
              >
                {connectionStatus === "connected"
                  ? "Connected"
                  : connectionStatus === "failed"
                    ? "Failed - Please check API key"
                    : "Not verified"}
              </p>
            </div>
          </div>
          {connectionStatus === "connected" && (
            <Badge
              variant="outline"
              className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800"
            >
              Operational
            </Badge>
          )}
        </div>

        {/* Provider */}
        <SettingRow label="Provider" description="Select the AI infrastructure provider.">
          <Select
            value={displayProvider}
            onValueChange={(v) => {
              setAiProvider(v);
              setConnectionStatus("idle");
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {AI_PROVIDERS.map((p) => (
                <SelectItem key={p} value={p}>
                  {p === "google"
                    ? "Google AI Studio"
                    : p === "openrouter"
                      ? "OpenRouter"
                      : p === "openai"
                        ? "OpenAI"
                        : "Custom Provider"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </SettingRow>

        {/* Model */}
        <SettingRow label="Model" description="The specific LLM to use for generation.">
          <Input
            value={displayModel}
            onChange={(e) => setAiModel(e.target.value)}
            className="w-full"
            placeholder="e.g. google/gemini-2.5-flash"
            list="model-suggestions"
          />
          <datalist id="model-suggestions">
            {displayProvider === "google" && (
              <>
                <option value="gemini-2.5-flash" />
                <option value="gemini-2.5-pro" />
                <option value="gemini-2.0-flash" />
              </>
            )}
            {displayProvider === "openrouter" && (
              <>
                <option value="google/gemini-2.5-flash" />
                <option value="google/gemini-2.5-pro" />
                <option value="openai/gpt-4o-mini" />
                <option value="anthropic/claude-3-5-sonnet" />
              </>
            )}
            {displayProvider === "openai" && (
              <>
                <option value="gpt-4o-mini" />
                <option value="gpt-4o" />
              </>
            )}
          </datalist>
        </SettingRow>

        {/* Base URL */}
        <SettingRow label="Base URL" description="The API endpoint for the selected provider.">
          <Input
            value={displayBaseUrl}
            onChange={(e) => {
              if (displayProvider === "custom") {
                setCustomUrl(e.target.value);
              }
            }}
            readOnly={displayProvider !== "custom"}
            className={cn(
              "w-full font-mono text-sm",
              displayProvider !== "custom" && "bg-muted/50 text-muted-foreground",
            )}
            placeholder="https://my-ai-api.com/v1"
          />
        </SettingRow>

        {/* API Key */}
        <SettingRow label="API Key" description="Secret key for authentication. Never share this.">
          <div className="relative w-full">
            <Input
              type={showKey ? "text" : "password"}
              value={currentKeyDisplay}
              onChange={(e) => {
                updateCurrentKey(e.target.value);
                setConnectionStatus("idle");
              }}
              className="w-full pr-10 font-mono"
              placeholder="Enter API Key..."
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-muted-foreground"
              onClick={() => setShowKey(!showKey)}
            >
              {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
        </SettingRow>

        {/* Actions */}
        <div className="p-6 flex items-center justify-end gap-3 bg-muted/20">
          <Button
            variant="outline"
            onClick={handleTestAi}
            disabled={testingAi || upsertMut.isPending}
          >
            {testingAi ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Test Connection
          </Button>
          <Button onClick={handleSaveAll} disabled={upsertMut.isPending || testingAi}>
            {upsertMut.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save Configuration
          </Button>
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
    <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
      <div className="w-full sm:w-1/3 sm:max-w-[30%] shrink-0">
        <p className="font-medium text-sm">{label}</p>
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{description}</p>
      </div>
      <div className="w-full flex-1 min-w-0">{children}</div>
    </div>
  );
}
