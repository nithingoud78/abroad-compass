import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CTA() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-foreground p-10 text-background shadow-[var(--shadow-elegant)] sm:p-16">
          <div
            className="absolute inset-0 -z-0 opacity-30"
            style={{
              background:
                "radial-gradient(ellipse 50% 60% at 80% 20%, oklch(0.72 0.16 40) 0%, transparent 60%), radial-gradient(ellipse 50% 60% at 10% 90%, oklch(0.55 0.18 350) 0%, transparent 60%)",
            }}
          />
          <div className="relative z-10 max-w-2xl">
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Start your Germany journey today
            </h2>
            <p className="mt-3 text-background/70">
              Join thousands of students using Abroad Compass to plan, learn and arrive prepared.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button
                size="lg"
                className="rounded-full bg-background text-foreground hover:bg-background/90"
              >
                Get Started Free <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="rounded-full border-background/30 bg-transparent text-background hover:bg-background/10 hover:text-background"
              >
                Talk to us
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
