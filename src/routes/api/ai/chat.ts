// Streaming AI chat endpoint used by the /assistant page via useChat.
// Requires an authenticated Supabase user; verifies the bearer, then streams.
import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createClient } from "@supabase/supabase-js";
import { createAiProvider } from "@/lib/ai/provider.server";
import { AI_MODEL_IDS } from "@/lib/ai/models";
import { SYSTEM_PROMPTS, type Capability } from "@/lib/ai/prompts";

type Body = {
  messages?: UIMessage[];
  model?: string;
  capability?: Capability;
  threadId?: string;
  system?: string;
};

async function requireUser(request: Request) {
  const auth = request.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) return null;
  const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data } = await sb.auth.getUser();
  return data.user ? { user: data.user, token, sb } : null;
}

export const Route = createFileRoute("/api/ai/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const ctx = await requireUser(request);
        if (!ctx) return new Response("Unauthorized", { status: 401 });

        const body = (await request.json()) as Body;
        if (!Array.isArray(body.messages)) {
          return new Response("messages required", { status: 400 });
        }

        const modelId =
          body.model && AI_MODEL_IDS.includes(body.model as never)
            ? body.model
            : "google/gemini-3-flash-preview";
        const system =
          body.system?.trim() ||
          SYSTEM_PROMPTS[body.capability ?? "general"] ||
          SYSTEM_PROMPTS.general;

        const provider = createAiProvider();

        const started = Date.now();
        const result = streamText({
          model: provider(modelId),
          system,
          messages: await convertToModelMessages(body.messages),
          onFinish: async ({ text, usage }) => {
            try {
              // Persist assistant reply + usage. Fire-and-forget.
              if (body.threadId) {
                await ctx.sb.from("ai_messages").insert({
                  thread_id: body.threadId,
                  user_id: ctx.user.id,
                  role: "assistant",
                  parts: [{ type: "text", text }],
                  tokens_in: usage?.inputTokens ?? null,
                  tokens_out: usage?.outputTokens ?? null,
                  model: modelId,
                });
                await ctx.sb
                  .from("ai_threads")
                  .update({ updated_at: new Date().toISOString() })
                  .eq("id", body.threadId);
              }
              await ctx.sb.from("ai_usage").insert({
                user_id: ctx.user.id,
                thread_id: body.threadId ?? null,
                model: modelId,
                capability: body.capability ?? null,
                tokens_in: usage?.inputTokens ?? 0,
                tokens_out: usage?.outputTokens ?? 0,
                latency_ms: Date.now() - started,
                status: "ok",
              });
            } catch (e) {
              console.error("ai persist failed", e);
            }
          },
        });

        // Persist the latest user message before streaming starts.
        try {
          if (body.threadId) {
            const last = body.messages[body.messages.length - 1];
            if (last?.role === "user") {
              await ctx.sb.from("ai_messages").insert({
                thread_id: body.threadId,
                user_id: ctx.user.id,
                role: "user",
                parts: last.parts as unknown as object,
                model: modelId,
                client_message_id: last.id ?? null,
              });
            }
          }
        } catch (e) {
          console.error("ai user persist failed", e);
        }

        return result.toUIMessageStreamResponse({ originalMessages: body.messages });
      },
    },
  },
});
