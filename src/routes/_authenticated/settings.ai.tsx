import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import {
  aiUsageSummary,
  listPromptTemplates,
  upsertPromptTemplate,
  deletePromptTemplate,
} from "@/lib/ai/ai.functions";
import { AI_MODELS } from "@/lib/ai/models";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/app/EmptyState";
import { Sparkles, Star, Trash2, Plus, Save, Loader2, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

export const Route = createFileRoute("/_authenticated/settings/ai")({
  head: () => ({
    meta: [
      { title: "AI Settings — Abroad Compass" },
      {
        name: "description",
        content: "Tune your AI mentor: model, temperature, memory, prompt templates, and usage.",
      },
    ],
  }),
  component: AiSettingsPage,
});

type Prefs = {
  ai_default_model: string;
  ai_temperature: number;
  ai_top_p: number;
  ai_streaming: boolean;
  ai_memory_enabled: boolean;
  ai_cache_enabled: boolean;
  ai_context_profile: boolean;
};

const DEFAULT_PREFS: Prefs = {
  ai_default_model: AI_MODELS.fast,
  ai_temperature: 0.7,
  ai_top_p: 1.0,
  ai_streaming: true,
  ai_memory_enabled: true,
  ai_cache_enabled: true,
  ai_context_profile: true,
};

function AiSettingsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const usageFn = useServerFn(aiUsageSummary);
  const listFn = useServerFn(listPromptTemplates);
  const upsertFn = useServerFn(upsertPromptTemplate);
  const deleteFn = useServerFn(deletePromptTemplate);

  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [saving, setSaving] = useState(false);

  const prefsQ = useQuery({
    queryKey: ["ai-prefs", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("user_preferences")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      return (data ?? null) as (Prefs & { user_id: string }) | null;
    },
  });

  useEffect(() => {
    if (prefsQ.data) {
      setPrefs({
        ai_default_model: prefsQ.data.ai_default_model ?? DEFAULT_PREFS.ai_default_model,
        ai_temperature: Number(prefsQ.data.ai_temperature ?? DEFAULT_PREFS.ai_temperature),
        ai_top_p: Number(prefsQ.data.ai_top_p ?? DEFAULT_PREFS.ai_top_p),
        ai_streaming: prefsQ.data.ai_streaming ?? DEFAULT_PREFS.ai_streaming,
        ai_memory_enabled: prefsQ.data.ai_memory_enabled ?? DEFAULT_PREFS.ai_memory_enabled,
        ai_cache_enabled: prefsQ.data.ai_cache_enabled ?? DEFAULT_PREFS.ai_cache_enabled,
        ai_context_profile: prefsQ.data.ai_context_profile ?? DEFAULT_PREFS.ai_context_profile,
      });
    }
  }, [prefsQ.data]);

  async function save() {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("user_preferences").upsert(
      {
        user_id: user.id,
        ...prefs,
      },
      { onConflict: "user_id" },
    );
    setSaving(false);
    if (error) toast.error(error.message);
    else {
      toast.success("AI settings saved");
      qc.invalidateQueries({ queryKey: ["ai-prefs", user.id] });
    }
  }

  const usageQ = useQuery({ queryKey: ["ai-usage"], queryFn: () => usageFn() });
  const tplsQ = useQuery({ queryKey: ["prompt-templates"], queryFn: () => listFn() });

  type TemplatePayload = {
    id?: string;
    name: string;
    category: string;
    body: string;
    variables: string[];
    is_favorite: boolean;
  };

  const upsertMut = useMutation({
    mutationFn: (input: TemplatePayload) => upsertFn({ data: input }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["prompt-templates"] });
      toast.success("Template saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["prompt-templates"] }),
  });

  const modelName = useMemo(() => {
    const entry = Object.entries(AI_MODELS).find(([, v]) => v === prefs.ai_default_model);
    return entry?.[0] ?? "custom";
  }, [prefs.ai_default_model]);

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <header>
        <h1 className="font-display text-3xl font-bold tracking-tight">AI Settings</h1>
        <p className="text-sm text-muted-foreground">Configure your Abroad Compass AI mentor.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-brand" /> Model & sampling
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Default model</Label>
              <Select
                value={prefs.ai_default_model}
                onValueChange={(v) => setPrefs((p) => ({ ...p, ai_default_model: v }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={AI_MODELS.fast}>Gemini 3 Flash — fastest</SelectItem>
                  <SelectItem value={AI_MODELS.balanced}>Gemini 2.5 Flash — balanced</SelectItem>
                  <SelectItem value={AI_MODELS.pro}>Gemini 2.5 Pro — best reasoning</SelectItem>
                  <SelectItem value={AI_MODELS.gpt_mini}>GPT-5 Mini</SelectItem>
                  <SelectItem value={AI_MODELS.gpt}>GPT-5</SelectItem>
                </SelectContent>
              </Select>
              <p className="mt-1 text-[11px] text-muted-foreground">Current: {modelName}</p>
            </div>
            <div>
              <Label>Temperature ({prefs.ai_temperature.toFixed(2)})</Label>
              <Slider
                value={[prefs.ai_temperature]}
                min={0}
                max={2}
                step={0.05}
                onValueChange={(v) => setPrefs((p) => ({ ...p, ai_temperature: v[0] }))}
                className="mt-3"
              />
              <p className="mt-1 text-[11px] text-muted-foreground">
                0 = deterministic, 2 = highly creative.
              </p>
            </div>
            <div>
              <Label>Top P ({prefs.ai_top_p.toFixed(2)})</Label>
              <Slider
                value={[prefs.ai_top_p]}
                min={0.1}
                max={1}
                step={0.05}
                onValueChange={(v) => setPrefs((p) => ({ ...p, ai_top_p: v[0] }))}
                className="mt-3"
              />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <ToggleRow
              label="Stream responses"
              desc="Show tokens as they arrive."
              checked={prefs.ai_streaming}
              onChange={(b) => setPrefs((p) => ({ ...p, ai_streaming: b }))}
            />
            <ToggleRow
              label="Response cache"
              desc="Skip identical prompts for faster replies."
              checked={prefs.ai_cache_enabled}
              onChange={(b) => setPrefs((p) => ({ ...p, ai_cache_enabled: b }))}
            />
            <ToggleRow
              label="Conversation memory"
              desc="Persist thread context between messages."
              checked={prefs.ai_memory_enabled}
              onChange={(b) => setPrefs((p) => ({ ...p, ai_memory_enabled: b }))}
            />
            <ToggleRow
              label="Include profile context"
              desc="Inject profile, education & German level automatically."
              checked={prefs.ai_context_profile}
              onChange={(b) => setPrefs((p) => ({ ...p, ai_context_profile: b }))}
            />
          </div>
          <div className="flex justify-end">
            <Button onClick={save} disabled={saving}>
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save changes
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base flex items-center gap-2">
            <Wand2 className="h-4 w-4 text-brand" /> Prompt templates
          </CardTitle>
          <TemplateDialog onSubmit={(v) => upsertMut.mutate(v)} />
        </CardHeader>
        <CardContent>
          {tplsQ.isLoading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Loading…</p>
          ) : (tplsQ.data ?? []).length === 0 ? (
            <EmptyState
              icon={Wand2}
              title="No templates yet"
              description="Save reusable prompts (SOP intro, LOR tone, visa checklist)."
            />
          ) : (
            <div className="space-y-2">
              {(tplsQ.data ?? []).map((t) => (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-start gap-3 rounded-md border p-3"
                >
                  <button
                    onClick={() =>
                      upsertMut.mutate({
                        id: t.id,
                        name: t.name,
                        category: t.category,
                        body: t.body,
                        variables: (t.variables as string[]) ?? [],
                        is_favorite: !t.is_favorite,
                      })
                    }
                    aria-label={t.is_favorite ? "Unfavorite" : "Favorite"}
                  >
                    <Star
                      className={`h-4 w-4 ${t.is_favorite ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`}
                    />
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{t.name}</p>
                      <Badge variant="outline" className="text-[10px]">
                        {t.category}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-2 whitespace-pre-wrap">
                      {t.body}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <TemplateDialog
                      trigger={
                        <Button size="sm" variant="ghost">
                          Edit
                        </Button>
                      }
                      initial={{
                        id: t.id,
                        name: t.name,
                        category: t.category,
                        body: t.body,
                        variables: (t.variables as string[]) ?? [],
                        is_favorite: t.is_favorite,
                      }}
                      onSubmit={(v) => upsertMut.mutate(v)}
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => deleteMut.mutate(t.id)}
                      aria-label="Delete"
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Usage (last 30 days)</CardTitle>
        </CardHeader>
        <CardContent>
          {usageQ.isLoading ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Loading…</p>
          ) : !usageQ.data ? (
            <p className="text-sm text-muted-foreground">No usage yet.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-4">
              <Stat label="Requests" value={usageQ.data.count} />
              <Stat label="Tokens in" value={usageQ.data.totalIn.toLocaleString()} />
              <Stat label="Tokens out" value={usageQ.data.totalOut.toLocaleString()} />
              <Stat
                label="Errors"
                value={usageQ.data.errors}
                tone={usageQ.data.errors > 0 ? "warn" : undefined}
              />
              <div className="sm:col-span-4">
                <p className="mb-2 text-xs font-medium text-muted-foreground">By model</p>
                <div className="space-y-1">
                  {Object.entries(usageQ.data.byModel).map(([m, v]) => (
                    <div
                      key={m}
                      className="flex items-center justify-between rounded-md border px-3 py-1.5 text-xs"
                    >
                      <span className="truncate">{m}</span>
                      <span className="tabular-nums text-muted-foreground">
                        {v.count} req · {v.tokens.toLocaleString()} tokens
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ToggleRow({
  label,
  desc,
  checked,
  onChange,
}: {
  label: string;
  desc: string;
  checked: boolean;
  onChange: (b: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-3 rounded-md border p-3">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </label>
  );
}

function Stat({ label, value, tone }: { label: string; value: string | number; tone?: "warn" }) {
  return (
    <div
      className={`rounded-md border p-3 ${tone === "warn" ? "border-amber-500/40 bg-amber-500/5" : ""}`}
    >
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-xl font-bold tabular-nums">{value}</p>
    </div>
  );
}

type TemplateInput = {
  id?: string;
  name: string;
  category: string;
  body: string;
  variables: string[];
  is_favorite: boolean;
};

function TemplateDialog({
  trigger,
  initial,
  onSubmit,
}: {
  trigger?: React.ReactNode;
  initial?: TemplateInput;
  onSubmit: (v: TemplateInput) => void;
}) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<TemplateInput>(
    initial ?? { name: "", category: "general", body: "", variables: [], is_favorite: false },
  );

  useEffect(() => {
    if (open && initial) setState(initial);
  }, [open, initial]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            New template
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initial?.id ? "Edit template" : "New prompt template"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label htmlFor="tpl-name">Name</Label>
            <Input
              id="tpl-name"
              value={state.name}
              onChange={(e) => setState({ ...state, name: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="tpl-cat">Category</Label>
            <Input
              id="tpl-cat"
              value={state.category}
              onChange={(e) => setState({ ...state, category: e.target.value })}
              placeholder="sop / lor / german …"
            />
          </div>
          <div>
            <Label htmlFor="tpl-body">Prompt body</Label>
            <Textarea
              id="tpl-body"
              value={state.body}
              onChange={(e) => setState({ ...state, body: e.target.value })}
              rows={8}
              placeholder="Use {{variables}} in curly braces to make the prompt reusable."
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            disabled={!state.name.trim() || !state.body.trim()}
            onClick={() => {
              onSubmit(state);
              setOpen(false);
            }}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
