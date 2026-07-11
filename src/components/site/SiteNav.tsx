import { Link } from "@tanstack/react-router";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SiteNav() {
  const links = [
    { label: "Features", to: "/#features" },
    { label: "University Search", to: "/#features" },
    { label: "German Learning", to: "/#features" },
    { label: "Roadmap", to: "/#roadmap" },
    { label: "About", to: "/#about" },
    { label: "Blog", to: "/#blog" },
  ];
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-foreground text-background">
            <Compass className="h-4 w-4" />
          </span>
          <span className="font-display text-base font-semibold tracking-tight">
            Abroad Compass
          </span>
        </Link>
        <nav className="hidden items-center gap-7 lg:flex">
          {links.map((l) => (
            <a
              key={l.label}
              href={l.to}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {l.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link to="/auth">Log in</Link>
          </Button>
          <Button
            asChild
            size="sm"
            className="rounded-full bg-foreground text-background hover:bg-foreground/90"
          >
            <Link to="/auth">Sign Up Free</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
