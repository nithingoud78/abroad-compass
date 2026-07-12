import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, ScrollText } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/legal")({
  component: AdminLegalPages,
});

type LegalPage = {
  slug: string;
  title: string;
  content_md: string;
};

function AdminLegalPages() {
  const [pages, setPages] = useState<LegalPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<LegalPage | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPages();
  }, []);

  async function loadPages() {
    setLoading(true);
    const { data, error } = await supabase.from("legal_pages").select("*").order("title");
    if (error) {
      console.error(error);
      toast.error(`Error loading pages: ${error.message}`);
    } else setPages(data || []);
    setLoading(false);
  }

  async function handleSave() {
    if (!editing?.slug || !editing?.title) return toast.error("Slug and title required");
    setSaving(true);

    const { error } = await supabase.from("legal_pages").upsert({
      slug: editing.slug,
      title: editing.title,
      content_md: editing.content_md,
      updated_at: new Date().toISOString(),
    });

    setSaving(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Page saved");
      setEditing(null);
      loadPages();
    }
  }

  async function handleDelete(slug: string) {
    if (!confirm("Are you sure?")) return;
    const { error } = await supabase.from("legal_pages").delete().eq("slug", slug);
    if (error) toast.error(error.message);
    else {
      toast.success("Page deleted");
      loadPages();
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold tracking-tight">Legal Pages CMS</h1>
        <p className="text-muted-foreground mt-1">Manage dynamic pages for the footer</p>
      </header>

      {editing ? (
        <Card>
          <CardHeader>
            <CardTitle>
              {pages.some((p) => p.slug === editing.slug) ? "Edit Page" : "New Page"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">URL Slug (e.g., privacy, terms)</label>
                <Input
                  value={editing.slug}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""),
                    })
                  }
                  disabled={pages.some((p) => p.slug === editing.slug)} // Disable changing slug if editing existing
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Page Title</label>
                <Input
                  value={editing.title}
                  onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Markdown Content</label>
              <Textarea
                value={editing.content_md}
                onChange={(e) => setEditing({ ...editing, content_md: e.target.value })}
                className="min-h-[300px] font-mono text-sm"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Save Page
              </Button>
              <Button variant="outline" onClick={() => setEditing(null)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Published Pages</CardTitle>
              <CardDescription>These appear in the main footer automatically.</CardDescription>
            </div>
            <Button onClick={() => setEditing({ slug: "", title: "", content_md: "" })}>
              <Plus className="w-4 h-4 mr-2" /> Add Page
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-8 flex justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : pages.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center bg-muted/20 rounded-xl border border-dashed">
                <ScrollText className="h-10 w-10 text-muted-foreground mb-4 opacity-50" />
                <h3 className="font-semibold text-lg text-foreground">No legal pages found</h3>
                <p className="text-sm text-muted-foreground mt-2 max-w-sm">
                  Add pages like Privacy Policy or Terms of Service. They will automatically appear
                  in the footer.
                </p>
                <Button
                  className="mt-6"
                  onClick={() => setEditing({ slug: "", title: "", content_md: "" })}
                >
                  <Plus className="w-4 h-4 mr-2" /> Add your first page
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {pages.map((page) => (
                  <div
                    key={page.slug}
                    className="flex items-center justify-between p-3 border rounded-lg bg-card"
                  >
                    <div>
                      <p className="font-medium">{page.title}</p>
                      <p className="text-xs text-muted-foreground">/legal/{page.slug}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="secondary" size="sm" onClick={() => setEditing(page)}>
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => handleDelete(page.slug)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
