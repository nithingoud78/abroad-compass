import { createFileRoute, Link } from "@tanstack/react-router";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/coming-soon")({
  component: ComingSoonRoute,
});

function ComingSoonRoute() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-foreground text-background">
              <Compass className="h-4 w-4" />
            </span>
            <span className="font-display text-base font-semibold tracking-tight">
              Abroad Compass
            </span>
          </Link>
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center p-6">
        <div className="mx-auto max-w-md text-center">
          <Compass className="mx-auto h-12 w-12 text-muted-foreground mb-4 opacity-20" />
          <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Coming Soon
          </h1>
          <p className="mt-4 text-muted-foreground">
            This page is under development. We're working hard to bring you this feature very soon!
          </p>
          <div className="mt-8 flex justify-center">
            <Button asChild>
              <Link to="/">Return to Home</Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
