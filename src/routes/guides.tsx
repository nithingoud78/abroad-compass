import { createFileRoute, Link } from "@tanstack/react-router";
import { Compass } from "lucide-react";
import { SiteFooter } from "@/components/site/SiteFooter";

export const Route = createFileRoute("/guides")({
  head: () => ({ meta: [{ title: "Guides — Abroad Compass" }] }),
  component: GuidesPage,
});

function GuidesPage() {
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
          <h1 className="font-display text-4xl font-bold tracking-tight mb-2">Platform Guides</h1>
          <p className="text-sm text-muted-foreground">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        <div className="prose prose-slate dark:prose-invert max-w-none prose-lg">
          <h2 className="font-display font-bold mt-12 mb-4 text-2xl">Germany Roadmap</h2>
          <p className="leading-relaxed text-lg mb-6 text-muted-foreground">
            The Germany Roadmap is a step-by-step workflow customized to your specific situation. By
            keeping your Roadmap up-to-date, you ensure that the platform recommends the right tasks
            at the right time. Start by completing the Onboarding to generate your personalized
            timeline.
          </p>

          <h3 className="font-display font-bold mt-8 mb-4 text-xl">APS Guide</h3>
          <p className="leading-relaxed text-lg mb-6 text-muted-foreground">
            The Akademische Prüfstelle (APS) certificate is mandatory for many international
            students. Our guide walks you through document notarization, fee payment, and tracking
            your APS status directly from your Document Vault. Ensure all transcripts are translated
            into English or German.
          </p>

          <h3 className="font-display font-bold mt-8 mb-4 text-xl">
            Visa Guide & Blocked Account Guide
          </h3>
          <p className="leading-relaxed text-lg mb-6 text-muted-foreground">
            Applying for a student visa requires a Blocked Account (Sperrkonto) to prove financial
            resources. Use the Budget Manager to track your savings goal in your local currency.
            Once reached, you can proceed with providers like Coracle, Fintiba, or Expatrio, and
            upload the confirmation to your Document Vault.
          </p>

          <h2 className="font-display font-bold mt-12 mb-4 text-2xl">Language & Testing</h2>

          <h3 className="font-display font-bold mt-8 mb-4 text-xl">
            IELTS Guide & German Language Guide
          </h3>
          <p className="leading-relaxed text-lg mb-6 text-muted-foreground">
            Most English-taught programs require an IELTS score of 6.5 or higher. If you're learning
            German, use our integrated German Learning Suite. We support CEFR tracking from A1 to
            C1. Complete daily grammar, vocabulary, and reading missions to build your study streak
            and prepare for Goethe or TestDaF exams.
          </p>

          <h2 className="font-display font-bold mt-12 mb-4 text-2xl">University Preparation</h2>

          <h3 className="font-display font-bold mt-8 mb-4 text-xl">University Search Guide</h3>
          <p className="leading-relaxed text-lg mb-6 text-muted-foreground">
            The University Search module allows you to filter programs by language, tuition fees
            (public vs. private), and semester (Winter/Summer). Use the "Fit Score" to see how
            closely a program matches your academic background and save favorites to your shortlist.
          </p>

          <h3 className="font-display font-bold mt-8 mb-4 text-xl">
            Application Timeline & Document Checklist
          </h3>
          <p className="leading-relaxed text-lg mb-6 text-muted-foreground">
            Winter semester applications typically open in April and close on July 15th via
            Uni-Assist. Summer semester deadlines usually fall on January 15th. Keep your Document
            Vault updated with your Passport, Transcripts, APS, IELTS, Motivation Letter (SOP), and
            Letters of Recommendation to ensure you are ready to apply on day one.
          </p>

          <h3 className="font-display font-bold mt-8 mb-4 text-xl">Budget Planning</h3>
          <p className="leading-relaxed text-lg mb-6 text-muted-foreground">
            Aside from the Blocked Account (approx. €11,208/year), budget for health insurance,
            semester contributions (€150-€350), rent, and living expenses. Our Budget Manager helps
            you categorize and forecast these expenses accurately.
          </p>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
