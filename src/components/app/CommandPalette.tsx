import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Building2,
  BookOpen,
  CheckSquare,
  FileText,
  FolderKanban,
  GraduationCap,
  LayoutDashboard,
  Sparkles,
  Wallet,
  Library,
  Settings as SettingsIcon,
  History,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useDebounce } from "@/hooks/use-debounce";

type Result = {
  id: string;
  type: "uni" | "task" | "doc" | "word" | "project";
  label: string;
  sub?: string;
  to: string;
};

const QUICK = [
  { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
  { label: "Germany Journey", to: "/germany-journey", icon: Sparkles },
  { label: "Universities", to: "/university", icon: Building2 },
  { label: "Budget", to: "/budget", icon: Wallet },
  { label: "Portfolio", to: "/portfolio", icon: FolderKanban },
  { label: "Vocabulary", to: "/vocabulary", icon: BookOpen },
  { label: "German", to: "/german", icon: GraduationCap },
  { label: "Tools", to: "/tools", icon: Library },
  { label: "Settings", to: "/settings", icon: SettingsIcon },
] as const;

const RECENT_KEY = "ac:cmdk-recent";

export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [q, setQ] = useState("");
  const dq = useDebounce(q, 180);
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [recent, setRecent] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      return JSON.parse(window.localStorage.getItem(RECENT_KEY) ?? "[]");
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (!open) setQ("");
  }, [open]);

  useEffect(() => {
    if (!user || !dq.trim()) {
      setResults([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const term = `%${dq.trim()}%`;
    Promise.all([
      supabase
        .from("universities")
        .select("id, name, city")
        .eq("user_id", user.id)
        .ilike("name", term)
        .limit(5),
      supabase
        .from("tasks")
        .select("id, title, module")
        .eq("user_id", user.id)
        .ilike("title", term)
        .limit(5),
      supabase
        .from("documents")
        .select("id, name, category")
        .eq("user_id", user.id)
        .ilike("name", term)
        .limit(5),
      supabase
        .from("vocabulary")
        .select("id, german, english")
        .eq("user_id", user.id)
        .or(`german.ilike.${term},english.ilike.${term}`)
        .limit(5),
      supabase
        .from("projects")
        .select("id, name")
        .eq("user_id", user.id)
        .ilike("name", term)
        .limit(5),
    ]).then(([u, t, d, v, p]) => {
      if (cancelled) return;
      const out: Result[] = [];
      (u.data ?? []).forEach((r) =>
        out.push({
          id: r.id,
          type: "uni",
          label: r.name,
          sub: r.city ?? undefined,
          to: "/university",
        }),
      );
      (t.data ?? []).forEach((r) =>
        out.push({ id: r.id, type: "task", label: r.title, sub: r.module, to: "/germany-journey" }),
      );
      (d.data ?? []).forEach((r) =>
        out.push({ id: r.id, type: "doc", label: r.name, sub: r.category, to: "/germany-journey" }),
      );
      (v.data ?? []).forEach((r) =>
        out.push({ id: r.id, type: "word", label: r.german, sub: r.english, to: "/vocabulary" }),
      );
      (p.data ?? []).forEach((r) =>
        out.push({ id: r.id, type: "project", label: r.name, to: "/portfolio" }),
      );
      setResults(out);
      setLoading(false);
      // history
      supabase.from("search_history").insert({ user_id: user.id, query: dq, scope: "all" });
    });
    return () => {
      cancelled = true;
    };
  }, [dq, user]);

  function go(to: string, label: string) {
    onOpenChange(false);
    const next = [label, ...recent.filter((r) => r !== label)].slice(0, 8);
    setRecent(next);
    try {
      window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
    navigate({ to: to as never });
  }

  const iconFor = useMemo(
    () =>
      ({
        uni: Building2,
        task: CheckSquare,
        doc: FileText,
        word: BookOpen,
        project: FolderKanban,
      }) as const,
    [],
  );

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Search universities, tasks, documents, words…"
        value={q}
        onValueChange={setQ}
      />
      <CommandList>
        <CommandEmpty>{loading ? "Searching…" : "No matches"}</CommandEmpty>
        {!q && (
          <>
            <CommandGroup heading="Quick navigate">
              {QUICK.map((item) => (
                <CommandItem
                  key={item.to}
                  value={item.label}
                  onSelect={() => go(item.to, item.label)}
                >
                  <item.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                  {item.label}
                </CommandItem>
              ))}
            </CommandGroup>
            {recent.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup heading="Recent">
                  {recent.map((r) => (
                    <CommandItem key={r} value={r} onSelect={() => onOpenChange(false)}>
                      <History className="mr-2 h-4 w-4 text-muted-foreground" />
                      {r}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </>
        )}
        {q && results.length > 0 && (
          <CommandGroup heading={`Results (${results.length})`}>
            {results.map((r) => {
              const Icon = iconFor[r.type];
              return (
                <CommandItem
                  key={`${r.type}-${r.id}`}
                  value={`${r.label} ${r.sub ?? ""}`}
                  onSelect={() => go(r.to, r.label)}
                >
                  <Icon className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span className="truncate">{r.label}</span>
                  {r.sub && <span className="ml-auto text-xs text-muted-foreground">{r.sub}</span>}
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
