import { createFileRoute, Link } from "@tanstack/react-router";
import { Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/maintenance")({
  head: () => ({ meta: [{ title: "Under Maintenance — Abroad Compass" }] }),
  component: MaintenancePage,
});

function MaintenancePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-center">
      <Wrench className="h-12 w-12 text-brand mb-4" />
      <h1 className="text-3xl font-display font-bold tracking-tight mb-2">Under Maintenance</h1>
      <p className="text-muted-foreground mb-6 max-w-md mx-auto">
        We are currently upgrading Abroad Compass to improve your experience. We will be back online
        shortly.
      </p>
      <Button asChild>
        <Link to="/auth">Return to Login</Link>
      </Button>
    </div>
  );
}
