import { createFileRoute, Link } from "@tanstack/react-router";
import { Compass } from "lucide-react";
import { SiteFooter } from "@/components/site/SiteFooter";

export const Route = createFileRoute("/community")({
  head: () => ({ meta: [{ title: "Community — Abroad Compass" }] }),
  component: CommunityPage,
});

function CommunityPage() {
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
          <h1 className="font-display text-4xl font-bold tracking-tight mb-2">
            Community Guidelines
          </h1>
          <p className="text-sm text-muted-foreground">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        <div className="prose prose-slate dark:prose-invert max-w-none prose-lg">
          <h2 className="font-display font-bold mt-12 mb-4 text-2xl">Our Mission</h2>
          <p className="leading-relaxed text-lg mb-6 text-muted-foreground">
            The Abroad Compass community is built on collaboration, mutual support, and a shared
            ambition to study abroad. Whether you are seeking advice on university applications,
            looking for a study buddy for the IELTS, or navigating visa requirements, this is a safe
            environment to connect and grow.
          </p>

          <h3 className="font-display font-bold mt-8 mb-4 text-xl">Respect and Safe Environment</h3>
          <p className="leading-relaxed text-lg mb-6 text-muted-foreground">
            We operate a zero-tolerance policy for harassment, discrimination, or hate speech of any
            kind. Treat every member with respect and kindness. We are all navigating a complex
            journey, and a supportive environment is critical to everyone's success.
          </p>

          <h3 className="font-display font-bold mt-8 mb-4 text-xl">No Spam</h3>
          <p className="leading-relaxed text-lg mb-6 text-muted-foreground">
            To keep discussions high-quality, please refrain from self-promotion, selling services,
            or posting irrelevant links. Agency promotions and unsolicited DMs are strictly
            prohibited and will result in an immediate ban.
          </p>

          <h2 className="font-display font-bold mt-12 mb-4 text-2xl">Connecting with Others</h2>

          <h3 className="font-display font-bold mt-8 mb-4 text-xl">
            Student Discussions & Study Groups
          </h3>
          <p className="leading-relaxed text-lg mb-6 text-muted-foreground">
            We encourage members to form study groups for language learning and test preparation.
            Use the platform's networking features to find peers aiming for the same universities or
            intakes. Sharing resources, past experiences, and application timelines strengthens the
            entire community.
          </p>

          <h3 className="font-display font-bold mt-8 mb-4 text-xl">
            Discord & Telegram (Optional)
          </h3>
          <p className="leading-relaxed text-lg mb-6 text-muted-foreground">
            While the core platform remains the primary source of truth, we may optionally host
            Discord and Telegram groups for real-time chat. Links to these external communities will
            be provided in your dashboard. The same community guidelines apply to all external
            channels managed by Abroad Compass.
          </p>

          <h2 className="font-display font-bold mt-12 mb-4 text-2xl">Platform Evolution</h2>

          <h3 className="font-display font-bold mt-8 mb-4 text-xl">Feature Requests & Feedback</h3>
          <p className="leading-relaxed text-lg mb-6 text-muted-foreground">
            Abroad Compass is built for you. If you have an idea that could improve the platform,
            use the Feedback module in your dashboard to submit Feature Requests or report Bugs. Our
            team actively reviews these submissions and incorporates them into the product roadmap.
          </p>

          <h3 className="font-display font-bold mt-8 mb-4 text-xl">Future Community Plans</h3>
          <p className="leading-relaxed text-lg mb-6 text-muted-foreground">
            We are actively developing deeper community integrations, including verified alumni
            badges, mentorship programs, and structured Q&A forums. Stay tuned to the platform
            updates for new ways to engage and succeed together.
          </p>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
