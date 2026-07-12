import { createFileRoute, notFound } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Footer } from "@/components/app/Footer";
import { Link } from "@tanstack/react-router";
import { Compass } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
export const Route = createFileRoute("/legal/$slug")({
  component: LegalPage,
  loader: async ({ params: { slug } }) => {
    const { data, error } = await supabase
      .from("legal_pages")
      .select("title, content_md, updated_at")
      .eq("slug", slug)
      .single();

    if (error || !data) {
      // Return 404 or fallback if not found
      return { found: false, slug };
    }
    return { found: true, page: data, slug };
  },
});

// Since we need MarkdownPreview, I'll assume it exists or I will create a simple one if it doesn't.
// Wait, do I have a Markdown component? Let's check if there is one later.
// For now, I'll render the Markdown string in a container if there's no MarkdownPreview.

function LegalPage() {
  const { found, page, slug } = Route.useLoaderData();

  if (!found) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <header className="border-b bg-background p-4">
          <Link to="/" className="flex items-center gap-2">
            <Compass className="h-6 w-6 text-brand" />
            <span className="font-display font-semibold tracking-tight text-foreground">
              Abroad Compass
            </span>
          </Link>
        </header>
        <main className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <h1 className="text-4xl font-bold mb-4">Page Not Found</h1>
          <p className="text-muted-foreground mb-8">
            The legal document for '{slug}' does not exist.
          </p>
          <Link to="/dashboard" className="text-brand hover:underline">
            Return to Dashboard
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b bg-background p-4">
        <Link to="/" className="flex items-center gap-2 max-w-4xl mx-auto w-full">
          <Compass className="h-6 w-6 text-brand" />
          <span className="font-display font-semibold tracking-tight text-foreground">
            Abroad Compass
          </span>
        </Link>
      </header>

      <main className="flex-1 w-full max-w-4xl mx-auto p-6 md:p-12">
        <div className="mb-8 border-b pb-8">
          <h1 className="font-display text-4xl font-bold tracking-tight mb-2">{page?.title}</h1>
          <p className="text-sm text-muted-foreground">
            Last updated: {page ? new Date(page.updated_at).toLocaleDateString() : ""}
          </p>
        </div>

        <div className="prose prose-slate dark:prose-invert max-w-none prose-lg">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h2: ({ node, ...props }) => (
                <h2 className="font-display font-bold mt-12 mb-4 text-2xl" {...props} />
              ),
              h3: ({ node, ...props }) => (
                <h3 className="font-display font-bold mt-8 mb-4 text-xl" {...props} />
              ),
              p: ({ node, ...props }) => (
                <p className="leading-relaxed text-lg mb-6 text-muted-foreground" {...props} />
              ),
              ul: ({ node, ...props }) => (
                <ul className="list-disc pl-6 mb-6 text-lg text-muted-foreground" {...props} />
              ),
              li: ({ node, ...props }) => <li className="mb-2" {...props} />,
              a: ({ node, ...props }) => (
                <a className="text-brand hover:underline font-medium" {...props} />
              ),
              strong: ({ node, ...props }) => (
                <strong className="font-semibold text-foreground" {...props} />
              ),
            }}
          >
            {page?.content_md || ""}
          </ReactMarkdown>
        </div>
      </main>

      <Footer />
    </div>
  );
}
