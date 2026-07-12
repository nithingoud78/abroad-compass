import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  adminBlogList,
  adminBlogCreate,
  adminBlogUpdate,
  adminBlogDelete,
  adminBlogGet,
} from "@/lib/admin/admin.functions";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Star,
  ChevronLeft,
  ChevronRight,
  Newspaper,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/blog")({
  head: () => ({ meta: [{ title: "Blog — Admin — Abroad Compass" }] }),
  component: AdminBlogPage,
});

const CATEGORIES = [
  "general",
  "guide",
  "news",
  "visa",
  "university",
  "language",
  "finance",
  "life-in-germany",
];

type BlogFormState = {
  title: string;
  slug: string;
  excerpt: string;
  body_md: string;
  category: string;
  tags: string;
  is_published: boolean;
  featured: boolean;
  cover_url: string;
  featured_image: string;
  seo_title: string;
  seo_description: string;
  scheduled_for: string;
  author_name: string;
};

const EMPTY_FORM: BlogFormState = {
  title: "",
  slug: "",
  excerpt: "",
  body_md: "",
  category: "general",
  tags: "",
  is_published: false,
  featured: false,
  cover_url: "",
  featured_image: "",
  seo_title: "",
  seo_description: "",
  scheduled_for: "",
  author_name: "Abroad Compass Team",
};

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function AdminBlogPage() {
  const listFn = useServerFn(adminBlogList);
  const getFn = useServerFn(adminBlogGet);
  const createFn = useServerFn(adminBlogCreate);
  const updateFn = useServerFn(adminBlogUpdate);
  const deleteFn = useServerFn(adminBlogDelete);
  const qc = useQueryClient();

  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft" | "scheduled">(
    "all",
  );
  const [page, setPage] = useState(0);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<BlogFormState>(EMPTY_FORM);
  const [loadingEdit, setLoadingEdit] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "blog", { q, statusFilter, page }],
    queryFn: () => listFn({ data: { q: q || undefined, status: statusFilter, page } }),
  });

  const saveMut = useMutation({
    mutationFn: async () => {
      const payload = {
        title: form.title,
        slug: form.slug || slugify(form.title),
        excerpt: form.excerpt,
        body_md: form.body_md,
        category: form.category,
        tags: form.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        is_published: form.is_published,
        featured: form.featured,
        cover_url: form.cover_url || null,
        featured_image: form.featured_image || null,
        seo_title: form.seo_title || null,
        seo_description: form.seo_description || null,
        scheduled_for: form.scheduled_for || null,
        author_name: form.author_name,
      };
      if (editId) {
        await updateFn({ data: { id: editId, ...payload } });
      } else {
        await createFn({ data: payload });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "blog"] });
      toast.success(editId ? "Post updated" : "Post created");
      setEditorOpen(false);
      setEditId(null);
      setForm(EMPTY_FORM);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "blog"] });
      toast.success("Post deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const togglePublish = useMutation({
    mutationFn: ({ id, is_published }: { id: string; is_published: boolean }) =>
      updateFn({ data: { id, is_published } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "blog"] });
      toast.success("Status updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function openEdit(id: string) {
    setLoadingEdit(true);
    try {
      const post = await getFn({ data: { id } });
      setForm({
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        body_md: post.body_md,
        category: post.category,
        tags: (post.tags ?? []).join(", "),
        is_published: post.is_published,
        featured: post.featured,
        cover_url: post.cover_url ?? "",
        featured_image: post.featured_image ?? "",
        seo_title: post.seo_title ?? "",
        seo_description: post.seo_description ?? "",
        scheduled_for: post.scheduled_for ?? "",
        author_name: post.author_name,
      });
      setEditId(id);
      setEditorOpen(true);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoadingEdit(false);
    }
  }

  function openNew() {
    setForm(EMPTY_FORM);
    setEditId(null);
    setEditorOpen(true);
  }

  const totalPages = data ? Math.ceil(data.total / data.pageSize) : 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold">Blog CMS</h1>
          <p className="text-sm text-muted-foreground">{data?.total ?? 0} posts total</p>
        </div>
        <Button onClick={openNew}>
          <Plus className="mr-2 h-4 w-4" /> New Post
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <Input
          placeholder="Search posts…"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(0);
          }}
          className="max-w-xs"
        />
        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v as typeof statusFilter);
            setPage(0);
          }}
        >
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      )}

      {/* Posts table */}
      <div className="space-y-2">
        {(data?.posts ?? []).map((post) => (
          <Card key={post.id} className="p-4">
            <div className="flex flex-wrap items-start gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{post.title}</span>
                  {post.is_published ? (
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 text-[10px]">
                      Published
                    </Badge>
                  ) : post.scheduled_for ? (
                    <Badge variant="outline" className="text-[10px]">
                      Scheduled
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-[10px]">
                      Draft
                    </Badge>
                  )}
                  {post.featured && <Star className="h-3.5 w-3.5 text-yellow-500" />}
                </div>
                <div className="mt-1 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                  <span>{post.category}</span>
                  <span>{post.reading_minutes} min read</span>
                  <span>{format(new Date(post.updated_at), "PP")}</span>
                  <span className="hidden sm:inline">/{post.slug}</span>
                </div>
                {(post.tags ?? []).length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {post.tags.map((t: string) => (
                      <Badge key={t} variant="outline" className="text-[10px]">
                        {t}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={togglePublish.isPending || loadingEdit}
                  onClick={() =>
                    togglePublish.mutate({ id: post.id, is_published: !post.is_published })
                  }
                  title={post.is_published ? "Unpublish" : "Publish"}
                >
                  {post.is_published ? (
                    <EyeOff className="h-3.5 w-3.5" />
                  ) : (
                    <Eye className="h-3.5 w-3.5" />
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={loadingEdit}
                  onClick={() => openEdit(post.id)}
                >
                  {loadingEdit ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Pencil className="h-3.5 w-3.5" />
                  )}
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete "{post.title}"?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This permanently deletes the post. This cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        onClick={() => deleteMut.mutate(post.id)}
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </Card>
        ))}
        {!isLoading && (data?.posts ?? []).length === 0 && (
          <Card className="flex items-center gap-2 p-8 text-sm text-muted-foreground">
            <Newspaper className="h-4 w-4" /> No posts matched. Create your first post!
          </Card>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Page {page + 1} of {totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Blog Post Editor Sheet */}
      <Sheet
        open={editorOpen}
        onOpenChange={(o) => {
          if (!o) {
            setEditorOpen(false);
            setEditId(null);
            setForm(EMPTY_FORM);
          }
        }}
      >
        <SheetContent side="right" className="w-full max-w-2xl overflow-y-auto sm:max-w-3xl">
          <SheetHeader>
            <SheetTitle>{editId ? "Edit Post" : "New Post"}</SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-4 pb-8">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-medium">Title *</label>
                <Input
                  value={form.title}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      title: e.target.value,
                      slug: f.slug || slugify(e.target.value),
                    }))
                  }
                  placeholder="Post title"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Slug *</label>
                <Input
                  value={form.slug}
                  onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                  placeholder="url-slug"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium">Excerpt *</label>
              <Textarea
                value={form.excerpt}
                onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
                rows={2}
                placeholder="Short description for previews and SEO"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium">Body (Markdown) *</label>
              <Textarea
                value={form.body_md}
                onChange={(e) => setForm((f) => ({ ...f, body_md: e.target.value }))}
                rows={12}
                placeholder="Write your post in Markdown…"
                className="font-mono text-sm"
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="space-y-1">
                <label className="text-xs font-medium">Category</label>
                <Select
                  value={form.category}
                  onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Author</label>
                <Input
                  value={form.author_name}
                  onChange={(e) => setForm((f) => ({ ...f, author_name: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Tags (comma-separated)</label>
                <Input
                  value={form.tags}
                  onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
                  placeholder="germany, visa, guide"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-medium">Cover Image URL</label>
                <Input
                  value={form.cover_url}
                  onChange={(e) => setForm((f) => ({ ...f, cover_url: e.target.value }))}
                  placeholder="https://…"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Scheduled For</label>
                <Input
                  type="datetime-local"
                  value={form.scheduled_for}
                  onChange={(e) => setForm((f) => ({ ...f, scheduled_for: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-medium">SEO Title</label>
                <Input
                  value={form.seo_title}
                  onChange={(e) => setForm((f) => ({ ...f, seo_title: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">SEO Description</label>
                <Input
                  value={form.seo_description}
                  onChange={(e) => setForm((f) => ({ ...f, seo_description: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.is_published}
                  onChange={(e) => setForm((f) => ({ ...f, is_published: e.target.checked }))}
                  className="h-4 w-4 rounded"
                />
                Publish immediately
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.featured}
                  onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))}
                  className="h-4 w-4 rounded"
                />
                Featured post
              </label>
            </div>

            <div className="flex gap-3">
              <Button
                className="flex-1"
                disabled={saveMut.isPending || !form.title || !form.body_md || !form.excerpt}
                onClick={() => saveMut.mutate()}
              >
                {saveMut.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {editId ? "Update Post" : "Create Post"}
              </Button>
              <Button variant="outline" onClick={() => setEditorOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

// Suppress unused cn import warning
void cn;
