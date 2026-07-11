import { createFileRoute } from "@tanstack/react-router";
import { SiteNav } from "@/components/site/SiteNav";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Hero } from "@/components/site/Hero";
import { Features } from "@/components/site/Features";
import { Stats } from "@/components/site/Stats";
import { Roadmap } from "@/components/site/Roadmap";
import { Testimonials } from "@/components/site/Testimonials";
import { FAQ } from "@/components/site/FAQ";
import { CTA } from "@/components/site/CTA";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Abroad Compass — Your Study Abroad Operating System" },
      {
        name: "description",
        content:
          "Plan university applications, master German, track your budget and visa journey — the complete operating system for students heading to Germany.",
      },
      { property: "og:title", content: "Abroad Compass — Study Abroad OS" },
      {
        property: "og:description",
        content:
          "The complete operating system for ambitious students preparing to study in Germany.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteNav />
      <main>
        <Hero />
        <Features />
        <Stats />
        <Roadmap />
        <Testimonials />
        <FAQ />
        <CTA />
      </main>
      <SiteFooter />
    </div>
  );
}
