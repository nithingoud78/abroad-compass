// App-internal AI RPCs (thread CRUD, one-shot generation, document review).
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { generateText } from "ai";
import { createAiProvider } from "./provider.server";
import { AI_MODEL_IDS } from "./models";
import { SYSTEM_PROMPTS, type Capability } from "./prompts";

const capabilityEnum = z.enum([
  "general",
  "recommend",
  "sop",
  "lor",
  "cv",
  "coach",
  "tutor",
  "interview",
  "planner",
  "budget",
  "visa",
  "aps",
  "review",
]);

export const createThread = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        title: z.string().min(1).max(200).default("New conversation"),
        capability: capabilityEnum.default("general"),
        model: z.string().default("google/gemini-3-flash-preview"),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("ai_threads")
      .insert({
        user_id: context.userId,
        title: data.title,
        capability: data.capability,
        model: data.model,
        system_prompt: SYSTEM_PROMPTS[data.capability as Capability],
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const listThreads = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("ai_threads")
      .select("id, title, capability, model, pinned, updated_at")
      .is("archived_at", null)
      .order("pinned", { ascending: false })
      .order("updated_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return data;
  });

export const loadThread = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ threadId: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const [thread, messages] = await Promise.all([
      context.supabase.from("ai_threads").select("*").eq("id", data.threadId).maybeSingle(),
      context.supabase
        .from("ai_messages")
        .select("id, role, parts, created_at")
        .eq("thread_id", data.threadId)
        .order("created_at"),
    ]);
    if (thread.error) throw new Error(thread.error.message);
    if (!thread.data) throw new Error("Thread not found");
    if (messages.error) throw new Error(messages.error.message);
    return { thread: thread.data, messages: messages.data ?? [] };
  });

export const deleteThread = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ threadId: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("ai_threads").delete().eq("id", data.threadId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const renameThread = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ threadId: z.string().uuid(), title: z.string().min(1).max(200) }).parse(i),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("ai_threads")
      .update({ title: data.title })
      .eq("id", data.threadId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// One-shot: improve arbitrary text.
export const improveText = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        text: z.string().min(10).max(20000),
        capability: capabilityEnum.default("sop"),
        instruction: z.string().max(1000).optional(),
        model: z.string().default("google/gemini-3-flash-preview"),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    const provider = createAiProvider();
    const modelId = AI_MODEL_IDS.includes(data.model as never)
      ? data.model
      : "google/gemini-3-flash-preview";
    const started = Date.now();
    const { text, usage } = await generateText({
      model: provider(modelId),
      system: SYSTEM_PROMPTS[data.capability as Capability],
      prompt: `${data.instruction ?? "Improve the following text. Return the improved version only."}\n\n---\n${data.text}`,
    });
    await context.supabase.from("ai_usage").insert({
      user_id: context.userId,
      model: modelId,
      capability: data.capability,
      tokens_in: usage?.inputTokens ?? 0,
      tokens_out: usage?.outputTokens ?? 0,
      latency_ms: Date.now() - started,
      status: "ok",
    });
    return { text };
  });

// Review a document's text (already-extracted) and store the result.
export const reviewDocumentText = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        documentId: z.string().uuid(),
        text: z.string().min(20).max(50000),
        kind: z
          .enum([
            "cv",
            "sop",
            "lor",
            "motivation",
            "transcript",
            "project",
            "certificate",
            "research",
          ])
          .default("cv"),
        model: z.string().default("google/gemini-3-flash-preview"),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    const provider = createAiProvider();
    const modelId = AI_MODEL_IDS.includes(data.model as never)
      ? data.model
      : "google/gemini-3-flash-preview";
    const { text } = await generateText({
      model: provider(modelId),
      system: SYSTEM_PROMPTS.review,
      prompt: `Document type: ${data.kind}\n\nReturn only valid JSON matching:
{"score":0-100,"summary":"","grammar":[],"ats":[],"missing":[],"suggestions":[]}\n\n---\n${data.text}`,
    });
    let parsed: {
      score?: number;
      summary?: string;
      grammar?: string[];
      ats?: string[];
      missing?: string[];
      suggestions?: string[];
    } = {};
    try {
      const match = text.match(/\{[\s\S]*\}/);
      parsed = match ? JSON.parse(match[0]) : {};
    } catch {
      parsed = { summary: text.slice(0, 500) };
    }
    const { data: row, error } = await context.supabase
      .from("document_reviews")
      .insert({
        user_id: context.userId,
        document_id: data.documentId,
        score: typeof parsed.score === "number" ? Math.round(parsed.score) : null,
        summary: parsed.summary ?? null,
        feedback: parsed,
        model: modelId,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

// Toggle thread pin/archive.
export const setThreadFlags = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        threadId: z.string().uuid(),
        pinned: z.boolean().optional(),
        archived: z.boolean().optional(),
        folder: z.string().max(60).nullable().optional(),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    const patch: {
      pinned?: boolean;
      archived_at?: string | null;
      folder?: string | null;
    } = {};
    if (data.pinned !== undefined) patch.pinned = data.pinned;
    if (data.archived !== undefined)
      patch.archived_at = data.archived ? new Date().toISOString() : null;
    if (data.folder !== undefined) patch.folder = data.folder;
    if (Object.keys(patch).length === 0) return { ok: true };
    const { error } = await context.supabase
      .from("ai_threads")
      .update(patch)
      .eq("id", data.threadId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// Aggregate AI usage for the current user.
export const aiUsageSummary = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data, error } = await context.supabase
      .from("ai_usage")
      .select("model, capability, tokens_in, tokens_out, latency_ms, created_at, status")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(1000);
    if (error) throw new Error(error.message);
    const rows = data ?? [];
    let totalIn = 0,
      totalOut = 0,
      count = 0,
      errors = 0;
    const byModel: Record<string, { count: number; tokens: number }> = {};
    const byCap: Record<string, number> = {};
    for (const r of rows) {
      count++;
      if (r.status && r.status !== "ok") errors++;
      totalIn += r.tokens_in ?? 0;
      totalOut += r.tokens_out ?? 0;
      const m = r.model ?? "unknown";
      byModel[m] = byModel[m] ?? { count: 0, tokens: 0 };
      byModel[m].count++;
      byModel[m].tokens += (r.tokens_in ?? 0) + (r.tokens_out ?? 0);
      const c = r.capability ?? "general";
      byCap[c] = (byCap[c] ?? 0) + 1;
    }
    return {
      count,
      errors,
      totalIn,
      totalOut,
      totalTokens: totalIn + totalOut,
      byModel,
      byCap,
      recent: rows.slice(0, 50),
    };
  });

// Prompt template CRUD.
export const listPromptTemplates = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("ai_prompt_templates")
      .select("*")
      .order("is_favorite", { ascending: false })
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

const templateInput = z.object({
  name: z.string().min(1).max(120),
  category: z.string().min(1).max(60).default("general"),
  body: z.string().min(1).max(8000),
  variables: z.array(z.string().max(60)).max(20).default([]),
  is_favorite: z.boolean().default(false),
});

export const upsertPromptTemplate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ id: z.string().uuid().optional() }).merge(templateInput).parse(i),
  )
  .handler(async ({ data, context }) => {
    if (data.id) {
      const { error } = await context.supabase
        .from("ai_prompt_templates")
        .update({
          name: data.name,
          category: data.category,
          body: data.body,
          variables: data.variables,
          is_favorite: data.is_favorite,
        })
        .eq("id", data.id);
      if (error) throw new Error(error.message);
      return { id: data.id };
    }
    const { data: row, error } = await context.supabase
      .from("ai_prompt_templates")
      .insert({
        user_id: context.userId,
        name: data.name,
        category: data.category,
        body: data.body,
        variables: data.variables,
        is_favorite: data.is_favorite,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const deletePromptTemplate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("ai_prompt_templates").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// AI-assisted university recommendations. Takes the pre-scored buckets and
// asks the model for concise rationale + missing-gap suggestions per uni.
export const generateRecommendationNotes = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        universities: z
          .array(
            z.object({
              id: z.string().uuid(),
              name: z.string(),
              matchScore: z.number(),
              bucket: z.string(),
              gaps: z.array(z.string()).default([]),
            }),
          )
          .min(1)
          .max(20),
        model: z.string().default("google/gemini-3-flash-preview"),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    const provider = createAiProvider();
    const modelId = AI_MODEL_IDS.includes(data.model as never)
      ? data.model
      : "google/gemini-3-flash-preview";

    const started = Date.now();
    const { text, usage } = await generateText({
      model: provider(modelId),
      system: SYSTEM_PROMPTS.recommend,
      prompt: `For each university below, give a 2-sentence rationale explaining the fit and one concrete action the student can take to improve odds.
Return JSON array: [{"id":"...","reasoning":"...","action":"..."}]
Universities:
${JSON.stringify(data.universities, null, 2)}`,
    });

    let parsed: Array<{ id: string; reasoning?: string; action?: string }> = [];
    try {
      const m = text.match(/\[[\s\S]*\]/);
      parsed = m ? JSON.parse(m[0]) : [];
    } catch {
      parsed = [];
    }

    // Persist as recommendation rows (upsert by uni + user).
    const rows = data.universities.map((u) => {
      const note = parsed.find((p) => p.id === u.id);
      return {
        user_id: context.userId,
        university_id: u.id,
        bucket: (u.bucket === "ambitious" ? "moderate" : u.bucket) as "safe" | "moderate" | "dream",
        match_score: u.matchScore,
        acceptance_probability: null as number | null,
        reasoning: note?.reasoning ?? null,
        gaps: u.gaps,
        scholarships: [],
        model: modelId,
      };
    });
    // Clear stale then insert new (simple strategy — RLS-scoped).
    await context.supabase
      .from("university_recommendations")
      .delete()
      .eq("user_id", context.userId);
    if (rows.length) {
      const { error } = await context.supabase.from("university_recommendations").insert(rows);
      if (error) throw new Error(error.message);
    }

    await context.supabase.from("ai_usage").insert({
      user_id: context.userId,
      model: modelId,
      capability: "recommend",
      tokens_in: usage?.inputTokens ?? 0,
      tokens_out: usage?.outputTokens ?? 0,
      latency_ms: Date.now() - started,
      status: "ok",
    });

    return { count: rows.length, notes: parsed };
  });
