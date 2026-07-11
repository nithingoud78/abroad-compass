import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import {
  createThread as createThreadFn,
  listThreads as listThreadsFn,
  loadThread as loadThreadFn,
  deleteThread as deleteThreadFn,
  renameThread as renameThreadFn,
} from "@/lib/ai/ai.functions";
import { CAPABILITIES, type Capability } from "@/lib/ai/prompts";
import { AI_MODELS } from "@/lib/ai/models";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sparkles, Plus, Send, Trash2, MessageSquare, Loader2, Copy, Pencil } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/app/EmptyState";
import { motion, AnimatePresence } from "framer-motion";

export const Route = createFileRoute("/_authenticated/assistant")({
  component: AssistantPage,
});

function AssistantPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const listFn = useServerFn(listThreadsFn);
  const createFn = useServerFn(createThreadFn);
  const loadFn = useServerFn(loadThreadFn);
  const deleteFn = useServerFn(deleteThreadFn);
  const renameFn = useServerFn(renameThreadFn);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [capability, setCapability] = useState<Capability>("general");
  const [model, setModel] = useState<string>(AI_MODELS.fast);

  const threadsQ = useQuery({
    queryKey: ["ai-threads"],
    queryFn: () => listFn(),
    staleTime: 10_000,
  });

  const activeQ = useQuery({
    queryKey: ["ai-thread", activeId],
    queryFn: () => loadFn({ data: { threadId: activeId! } }),
    enabled: !!activeId,
    staleTime: Infinity,
  });

  useEffect(() => {
    if (activeQ.data) {
      setCapability((activeQ.data.thread.capability as Capability) ?? "general");
      setModel(activeQ.data.thread.model ?? AI_MODELS.fast);
    }
  }, [activeQ.data]);

  const createMut = useMutation({
    mutationFn: async (input: { capability: Capability; title?: string }) => {
      return await createFn({
        data: { capability: input.capability, title: input.title ?? "New conversation", model },
      });
    },
    onSuccess: (row) => {
      qc.invalidateQueries({ queryKey: ["ai-threads"] });
      setActiveId(row.id);
    },
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => deleteFn({ data: { threadId: id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ai-threads"] });
      setActiveId(null);
    },
  });

  const renameMut = useMutation({
    mutationFn: async (i: { id: string; title: string }) =>
      renameFn({ data: { threadId: i.id, title: i.title } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ai-threads"] }),
  });

  return (
    <div className="mx-auto grid max-w-[1400px] gap-4 lg:grid-cols-[280px_1fr]">
      <aside className="space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-lg font-semibold flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-brand" /> Assistant
          </h1>
          <Button size="sm" variant="outline" onClick={() => createMut.mutate({ capability })}>
            <Plus className="h-4 w-4" /> New
          </Button>
        </div>

        <Card className="p-2">
          <div className="mb-2 px-2 pt-1 text-xs font-medium text-muted-foreground">
            Capabilities
          </div>
          <div className="flex flex-wrap gap-1 px-1 pb-2">
            {CAPABILITIES.slice(0, 8).map((c) => (
              <button
                key={c.key}
                onClick={() => {
                  setCapability(c.key);
                  createMut.mutate({ capability: c.key, title: c.label });
                }}
                className="rounded-md border px-2 py-1 text-[11px] transition-colors hover:bg-accent"
              >
                {c.label}
              </button>
            ))}
          </div>
        </Card>

        <Card className="p-2">
          <div className="mb-2 px-2 pt-1 text-xs font-medium text-muted-foreground">Recent</div>
          <ScrollArea className="max-h-[calc(100vh-360px)]">
            <div className="space-y-1 pr-2">
              {threadsQ.data?.length ? (
                threadsQ.data.map((t) => (
                  <div
                    key={t.id}
                    className={`group flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors ${
                      activeId === t.id ? "bg-accent" : "hover:bg-accent/50"
                    }`}
                  >
                    <button className="flex-1 truncate text-left" onClick={() => setActiveId(t.id)}>
                      <MessageSquare className="mr-2 inline h-3.5 w-3.5 text-muted-foreground" />
                      {t.title}
                    </button>
                    <button
                      className="opacity-0 transition-opacity group-hover:opacity-100"
                      onClick={() => {
                        const title = window.prompt("Rename thread", t.title);
                        if (title) renameMut.mutate({ id: t.id, title });
                      }}
                      aria-label="Rename"
                    >
                      <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                    <button
                      className="opacity-0 transition-opacity group-hover:opacity-100"
                      onClick={() => {
                        if (window.confirm("Delete this conversation?")) deleteMut.mutate(t.id);
                      }}
                      aria-label="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </button>
                  </div>
                ))
              ) : (
                <p className="px-2 py-6 text-center text-xs text-muted-foreground">
                  No conversations yet
                </p>
              )}
            </div>
          </ScrollArea>
        </Card>
      </aside>

      <section className="min-h-[calc(100vh-140px)]">
        {activeId && activeQ.data ? (
          <ChatWindow
            key={activeId}
            threadId={activeId}
            capability={capability}
            setCapability={setCapability}
            model={model}
            setModel={setModel}
            initialMessages={activeQ.data.messages.map(
              (m) =>
                ({
                  id: m.id,
                  role: m.role as UIMessage["role"],
                  parts: (m.parts as unknown as UIMessage["parts"]) ?? [{ type: "text", text: "" }],
                }) as UIMessage,
            )}
          />
        ) : (
          <Card className="flex h-full min-h-[500px] items-center justify-center p-8">
            <EmptyState
              icon={Sparkles}
              title="Start a conversation with your AI mentor"
              description="Pick a capability on the left or click New to begin. The assistant can draft your SOP, recommend universities, coach your German, and more."
              action={{
                label: "New conversation",
                onClick: () => createMut.mutate({ capability: "general" }),
              }}
            />
          </Card>
        )}
      </section>
    </div>
  );
  void navigate;
}

function ChatWindow({
  threadId,
  capability,
  setCapability,
  model,
  setModel,
  initialMessages,
}: {
  threadId: string;
  capability: Capability;
  setCapability: (c: Capability) => void;
  model: string;
  setModel: (m: string) => void;
  initialMessages: UIMessage[];
}) {
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/ai/chat",
        fetch: async (input, init) => {
          const { data } = await supabase.auth.getSession();
          const token = data.session?.access_token;
          const headers = new Headers(init?.headers);
          if (token) headers.set("Authorization", `Bearer ${token}`);
          return fetch(input, { ...init, headers });
        },
        body: () => ({ threadId, capability, model }),
      }),
    [threadId, capability, model],
  );

  const { messages, sendMessage, status, error, stop } = useChat({
    id: threadId,
    messages: initialMessages,
    transport,
    onError: (e) => toast.error(e.message ?? "AI request failed"),
  });

  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const busy = status === "submitted" || status === "streaming";

  useEffect(() => {
    inputRef.current?.focus();
  }, [threadId]);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  async function submit() {
    const t = input.trim();
    if (!t || busy) return;
    setInput("");
    await sendMessage({ text: t });
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  return (
    <Card className="flex h-full min-h-[500px] flex-col">
      <div className="flex flex-wrap items-center gap-2 border-b px-4 py-3">
        <Select value={capability} onValueChange={(v) => setCapability(v as Capability)}>
          <SelectTrigger className="h-8 w-[200px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CAPABILITIES.map((c) => (
              <SelectItem key={c.key} value={c.key}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={model} onValueChange={setModel}>
          <SelectTrigger className="h-8 w-[220px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={AI_MODELS.fast}>Gemini 3 Flash (fastest)</SelectItem>
            <SelectItem value={AI_MODELS.balanced}>Gemini 2.5 Flash</SelectItem>
            <SelectItem value={AI_MODELS.pro}>Gemini 2.5 Pro (best reasoning)</SelectItem>
            <SelectItem value={AI_MODELS.gpt_mini}>GPT-5 Mini</SelectItem>
            <SelectItem value={AI_MODELS.gpt}>GPT-5</SelectItem>
          </SelectContent>
        </Select>
        <Badge variant="outline" className="ml-auto text-[10px]">
          {messages.length} messages
        </Badge>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.length === 0 && (
          <div className="mx-auto max-w-lg py-12 text-center text-sm text-muted-foreground">
            <Sparkles className="mx-auto mb-3 h-8 w-8 text-brand" />
            Ask anything — from "review my SOP" to "recommend 5 universities for AI in Germany".
          </div>
        )}
        <AnimatePresence initial={false}>
          {messages.map((m) => {
            const text = m.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
            return (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`group relative max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
                    m.role === "user"
                      ? "bg-brand text-brand-foreground"
                      : "bg-muted text-foreground"
                  }`}
                >
                  {text || (busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "")}
                  {m.role === "assistant" && text && (
                    <button
                      className="absolute -top-3 right-2 rounded-md border bg-background p-1 opacity-0 shadow transition-opacity group-hover:opacity-100"
                      onClick={() => {
                        navigator.clipboard.writeText(text);
                        toast.success("Copied");
                      }}
                      aria-label="Copy"
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        {busy && messages[messages.length - 1]?.role === "user" && (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-muted px-4 py-2.5">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          </div>
        )}
        {error && <p className="text-xs text-destructive">{error.message}</p>}
      </div>

      <div className="border-t p-3">
        <div className="flex items-end gap-2">
          <Textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder="Ask your assistant… (Enter to send, Shift+Enter for a new line)"
            rows={2}
            className="max-h-40 min-h-[52px] resize-none"
          />
          {busy ? (
            <Button variant="outline" onClick={() => stop()}>
              Stop
            </Button>
          ) : (
            <Button onClick={submit} disabled={!input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
  void Input;
}
