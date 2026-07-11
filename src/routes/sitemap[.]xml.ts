import { createFileRoute } from "@tanstack/react-router";

// Static sitemap for public/marketing routes. Authenticated app routes are
// intentionally excluded — they require sign-in and shouldn't be indexed.
const PUBLIC_ROUTES = ["/", "/auth"];

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: () => {
        const origin = process.env.APP_URL || "https://abroadcompass.app";
        const now = new Date().toISOString();
        const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${PUBLIC_ROUTES.map(
  (p) => `  <url>
    <loc>${origin}${p}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${p === "/" ? "1.0" : "0.7"}</priority>
  </url>`,
).join("\n")}
</urlset>`;
        return new Response(body, {
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
