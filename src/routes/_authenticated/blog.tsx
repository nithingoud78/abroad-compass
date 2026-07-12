import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useDebounce } from "@/hooks/use-debounce";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EmptyState } from "@/components/app/EmptyState";
import { format } from "date-fns";
import { Bookmark, BookmarkCheck, Newspaper, Search, ArrowLeft, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { z } from "zod";

const searchSchema = z.object({ post: z.string().optional() });

export const Route = createFileRoute("/_authenticated/blog")({
  head: () => ({
    meta: [
      { title: "Blog — Abroad Compass" },
      {
        name: "description",
        content: "Long-form guides on Germany, language learning, applications and arrival.",
      },
    ],
  }),
  validateSearch: (s) => searchSchema.parse(s),
  component: BlogPage,
});

type Post = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body_md: string;
  category: string;
  tags: string[];
  cover_url: string | null;
  reading_minutes: number;
  author_name: string;
  published_at: string;
};

const CATEGORIES = [
  "all",
  "germany",
  "university",
  "visa",
  "aps",
  "german",
  "sop",
  "lor",
  "budget",
  "general",
];

function BlogPage() {
  const { post: activeSlug } = Route.useSearch();
  const navigate = useNavigate();
  const [category, setCategory] = useState("all");
  const [rawSearch, setRawSearch] = useState("");
  const search = useDebounce(rawSearch, 250);
  const { user } = useAuth();

  const postsQ = useQuery({
    queryKey: ["blog-posts", category, search],
    queryFn: async () => {
      let q = supabase
        .from("blog_posts" as never)
        .select("*")
        .eq("is_published", true)
        .order("published_at", { ascending: false });
      if (category !== "all") q = q.eq("category", category);
      if (search.trim()) q = q.or(`title.ilike.%${search}%,excerpt.ilike.%${search}%`);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as Post[];
    },
  });

  const bookmarksQ = useQuery({
    queryKey: ["blog-bookmarks", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("blog_bookmarks" as never).select("post_id");
      return new Set(((data ?? []) as Array<{ post_id: string }>).map((r) => r.post_id));
    },
  });

  const activePost = useMemo(
    () => postsQ.data?.find((p) => p.slug === activeSlug) ?? null,
    [postsQ.data, activeSlug],
  );

  if (activePost) {
    return (
      <PostReader
        post={activePost}
        onBack={() => navigate({ to: ".", search: {} })}
        bookmarks={bookmarksQ.data ?? new Set()}
        allPosts={postsQ.data ?? []}
      />
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Blog</h1>
          <p className="text-sm text-muted-foreground">
            Guides on Germany, universities, visa, APS and the language journey.
          </p>
        </div>
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={rawSearch}
            onChange={(e) => setRawSearch(e.target.value)}
            placeholder="Search articles…"
            className="pl-9"
          />
        </div>
      </header>

      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <Button
            key={c}
            variant={c === category ? "default" : "outline"}
            size="sm"
            className="rounded-full"
            onClick={() => setCategory(c)}
          >
            {c === "all" ? "All" : c.charAt(0).toUpperCase() + c.slice(1)}
          </Button>
        ))}
      </div>

      {postsQ.isLoading ? (
        <p className="py-12 text-center text-sm text-muted-foreground">Loading…</p>
      ) : (postsQ.data ?? []).length === 0 ? (
        <EmptyState
          icon={Newspaper}
          title="No articles match"
          description="Try a different category or search term."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {(postsQ.data ?? []).map((p) => (
            <motion.button
              key={p.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-left"
              onClick={() => navigate({ to: ".", search: { post: p.slug } })}
            >
              <Card className="h-full shadow-card transition-shadow hover:shadow-lg">
                <CardContent className="pt-5">
                  <div className="mb-3 flex items-center justify-between">
                    <Badge variant="secondary" className="text-[10px] capitalize">
                      {p.category}
                    </Badge>
                    {(bookmarksQ.data ?? new Set()).has(p.id) && (
                      <BookmarkCheck className="h-4 w-4 text-brand" />
                    )}
                  </div>
                  <h3 className="font-display text-lg font-semibold leading-snug">{p.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{p.excerpt}</p>
                  <div className="mt-4 flex items-center gap-3 text-xs text-muted-foreground">
                    <span>
                      <Clock className="mr-1 inline h-3 w-3" />
                      {p.reading_minutes} min read
                    </span>
                    <span>· {format(new Date(p.published_at), "MMM d, yyyy")}</span>
                  </div>
                </CardContent>
              </Card>
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}

function PostReader({
  post,
  onBack,
  bookmarks,
  allPosts,
}: {
  post: Post;
  onBack: () => void;
  bookmarks: Set<string>;
  allPosts: Post[];
}) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [progress, setProgress] = useState(0);
  // Load progress
  useEffect(() => {
    if (!user) return;
    supabase
      .from("blog_reading_progress" as never)
      .select("progress")
      .eq("post_id", post.id)
      .maybeSingle()
      .then(({ data }) => {
        const row = data as { progress?: number } | null;
        if (row?.progress) setProgress(Number(row.progress) * 100);
      });
  }, [user, post.id]);

  // Track scroll → persist debounced
  useEffect(() => {
    let saved = 0;
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const pct = max > 0 ? Math.min(1, window.scrollY / max) : 0;
      setProgress(pct * 100);
      if (user && Math.abs(pct - saved) > 0.1) {
        saved = pct;
        void supabase.from("blog_reading_progress" as never).upsert(
          {
            user_id: user.id,
            post_id: post.id,
            progress: pct,
            completed: pct > 0.9,
          } as never,
          { onConflict: "user_id,post_id" },
        );
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [user, post.id]);

  const isBookmarked = bookmarks.has(post.id);
  const toggleBookmark = useMutation({
    mutationFn: async () => {
      if (!user) return;
      if (isBookmarked) {
        await supabase
          .from("blog_bookmarks" as never)
          .delete()
          .eq("user_id", user.id)
          .eq("post_id", post.id);
      } else {
        await supabase
          .from("blog_bookmarks" as never)
          .insert({ user_id: user.id, post_id: post.id } as never);
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["blog-bookmarks", user?.id] }),
  });

  const related = allPosts
    .filter((p) => p.id !== post.id && p.category === post.category)
    .slice(0, 3);

  return (
    <div className="mx-auto max-w-4xl">
      <div className="sticky top-14 z-20 -mx-4 mb-4 flex items-center gap-3 border-b bg-background/95 px-4 py-3 backdrop-blur shadow-sm">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Blog
        </Button>
        <Progress value={progress} className="h-1.5 flex-1" />
        <Button variant="outline" size="sm" onClick={() => toggleBookmark.mutate()}>
          {isBookmarked ? (
            <>
              <BookmarkCheck className="mr-2 h-4 w-4" />
              Bookmarked
            </>
          ) : (
            <>
              <Bookmark className="mr-2 h-4 w-4" />
              Bookmark
            </>
          )}
        </Button>
      </div>

      <article className="prose prose-slate max-w-none pb-16 pt-4 dark:prose-invert">
        {post.cover_url && (
          <div className="mb-10 w-full overflow-hidden rounded-2xl border shadow-sm">
            <img
              src={post.cover_url}
              alt={post.title}
              className="w-full object-cover max-h-[400px]"
            />
          </div>
        )}
        <div className="mb-6 flex items-center gap-4">
          <Badge variant="secondary" className="capitalize text-sm px-3 py-1">
            {post.category}
          </Badge>
          <span className="text-sm font-medium text-muted-foreground">
            <Clock className="mr-1 inline h-4 w-4" />
            {post.reading_minutes} min read
          </span>
          <span className="text-sm font-medium text-muted-foreground">
            · {format(new Date(post.published_at), "PPP")}
          </span>
        </div>
        <h1 className="font-display text-4xl font-extrabold tracking-tight md:text-5xl lg:text-6xl mb-6 leading-tight">
          {post.title}
        </h1>
        <p className="text-xl text-muted-foreground mb-10 leading-relaxed border-l-4 border-brand pl-4">
          {post.excerpt}
        </p>
        <div className="prose-lg">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h2: ({ node, ...props }) => (
                <h2 className="font-display font-bold mt-12 mb-4 text-3xl" {...props} />
              ),
              h3: ({ node, ...props }) => (
                <h3 className="font-display font-bold mt-8 mb-4 text-2xl" {...props} />
              ),
              p: ({ node, ...props }) => <p className="leading-relaxed text-lg mb-6" {...props} />,
              a: ({ node, ...props }) => (
                <a className="text-brand hover:underline font-medium" {...props} />
              ),
              blockquote: ({ node, ...props }) => (
                <blockquote
                  className="border-l-4 border-brand bg-brand/5 p-4 rounded-r-lg my-6 text-foreground italic"
                  {...props}
                />
              ),
              table: ({ node, ...props }) => (
                <div className="overflow-x-auto my-8 border rounded-xl shadow-sm">
                  <table className="w-full text-left border-collapse" {...props} />
                </div>
              ),
              th: ({ node, ...props }) => (
                <th className="bg-muted p-3 font-semibold border-b" {...props} />
              ),
              td: ({ node, ...props }) => <td className="p-3 border-b" {...props} />,
              img: ({ node, ...props }) => (
                <img
                  className="rounded-xl shadow-md mx-auto my-8 max-h-[500px] object-cover"
                  {...props}
                />
              ),
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              code: ({ node, inline, className, children, ...props }: any) => {
                if (inline) {
                  return (
                    <code
                      className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono text-brand"
                      {...props}
                    >
                      {children}
                    </code>
                  );
                }
                return (
                  <div className="bg-[#1e1e1e] text-[#d4d4d4] p-4 rounded-xl overflow-x-auto my-6 text-sm font-mono shadow-inner">
                    <code {...props}>{children}</code>
                  </div>
                );
              },
            }}
          >
            {post.body_md}
          </ReactMarkdown>
        </div>
        {related.length > 0 && (
          <div className="mt-16 border-t pt-8 not-prose">
            <h3 className="mb-4 text-xl font-display font-semibold text-foreground">
              Continue Reading
            </h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((r) => (
                <a
                  key={r.id}
                  href={`?post=${r.slug}`}
                  className="block rounded-xl border bg-card p-4 text-card-foreground shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="text-sm font-medium leading-tight mb-2 line-clamp-2">
                    {r.title}
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    {r.reading_minutes} min read
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}
        <div className="mt-12 flex justify-center not-prose">
          <Button variant="outline" onClick={onBack} size="lg">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Return to Blog
          </Button>
        </div>
      </article>
    </div>
  );
}
