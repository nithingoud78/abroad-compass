import { createFileRoute, Link } from "@tanstack/react-router";
import { Compass } from "lucide-react";
import { SiteFooter } from "@/components/site/SiteFooter";

export const Route = createFileRoute("/help-center")({
  head: () => ({ meta: [{ title: "Help Center — Abroad Compass" }] }),
  component: HelpCenterPage,
});

function HelpCenterPage() {
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
          <h1 className="font-display text-4xl font-bold tracking-tight mb-2">Help Center</h1>
          <p className="text-sm text-muted-foreground">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        <div className="prose prose-slate dark:prose-invert max-w-none prose-lg">
          <h2 className="font-display font-bold mt-12 mb-4 text-2xl">Getting Started</h2>
          <p className="leading-relaxed text-lg mb-6 text-muted-foreground">
            Welcome to Abroad Compass. This platform is designed to guide you through every step of
            your study abroad journey. Whether you are learning German, shortlisting universities,
            or applying for your visa, we have tools to help you succeed.
          </p>

          <h3 className="font-display font-bold mt-8 mb-4 text-xl">Creating an Account</h3>
          <p className="leading-relaxed text-lg mb-6 text-muted-foreground">
            You can create a free account by clicking the "Sign Up Free" button on the homepage. You
            will need a valid email address. Once registered, you will gain access to your
            personalized Dashboard, Journey Roadmap, and German Learning Suite.
          </p>

          <h3 className="font-display font-bold mt-8 mb-4 text-xl">Dashboard Overview</h3>
          <p className="leading-relaxed text-lg mb-6 text-muted-foreground">
            Your dashboard is the central hub. It provides an overview of your upcoming deadlines,
            daily German learning missions, and recent activity. Customize your widgets to focus on
            what matters most for your current stage.
          </p>

          <h2 className="font-display font-bold mt-12 mb-4 text-2xl">Account & Security</h2>

          <h3 className="font-display font-bold mt-8 mb-4 text-xl">Password Reset</h3>
          <p className="leading-relaxed text-lg mb-6 text-muted-foreground">
            If you have forgotten your password, navigate to the login page and click "Forgot
            Password". We will send a secure reset link to your registered email address. Ensure you
            check your spam folder if it doesn't arrive within a few minutes.
          </p>

          <h3 className="font-display font-bold mt-8 mb-4 text-xl">Privacy & Security</h3>
          <p className="leading-relaxed text-lg mb-6 text-muted-foreground">
            We take your privacy seriously. All data, including your budget and documents, is
            encrypted in transit and at rest. You have full control over your data and can request a
            complete export or account deletion at any time via your Profile Settings.
          </p>

          <h2 className="font-display font-bold mt-12 mb-4 text-2xl">Support</h2>

          <h3 className="font-display font-bold mt-8 mb-4 text-xl">Common Problems</h3>
          <ul className="list-disc pl-6 mb-6 text-lg text-muted-foreground">
            <li className="mb-2">
              <strong>Verification Email not received:</strong> Check your spam folder or click
              "Resend" on the verification page.
            </li>
            <li className="mb-2">
              <strong>Document Upload Failing:</strong> Ensure your file is a PDF, JPG, or PNG and
              under 10MB.
            </li>
            <li className="mb-2">
              <strong>University Search empty:</strong> Try broadening your filters, or resetting
              the language requirements.
            </li>
          </ul>

          <h3 className="font-display font-bold mt-8 mb-4 text-xl">
            Contact Support & Email Support
          </h3>
          <p className="leading-relaxed text-lg mb-6 text-muted-foreground">
            If you need further assistance, our support team is ready to help. You can reach out
            directly via email at{" "}
            <a
              className="text-brand hover:underline font-medium"
              href="mailto:support@abroadcompass.com"
            >
              support@abroadcompass.com
            </a>
            . We aim to respond to all inquiries within 24-48 hours.
          </p>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
