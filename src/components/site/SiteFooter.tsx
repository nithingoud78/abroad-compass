import { Compass, Twitter, Github, Linkedin } from "lucide-react";

export function SiteFooter() {
  const cols = [
    { title: "Product", links: ["Features", "Roadmap", "University Search", "German Learning"] },
    { title: "Company", links: ["About", "Blog", "Careers", "Contact"] },
    { title: "Resources", links: ["FAQ", "Help Center", "Guides", "Community"] },
    { title: "Legal", links: ["Privacy", "Terms", "Disclaimer", "Cookies"] },
  ];
  return (
    <footer className="border-t border-border/60 bg-background">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-6">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-foreground text-background">
                <Compass className="h-4 w-4" />
              </span>
              <span className="font-display text-base font-semibold">Abroad Compass</span>
            </div>
            <p className="mt-4 max-w-xs text-sm text-muted-foreground">
              The complete operating system for ambitious students preparing to study abroad.
            </p>
            <div className="mt-5 flex gap-3 text-muted-foreground">
              <a href="#" aria-label="Twitter" className="hover:text-foreground">
                <Twitter className="h-4 w-4" />
              </a>
              <a href="#" aria-label="GitHub" className="hover:text-foreground">
                <Github className="h-4 w-4" />
              </a>
              <a href="#" aria-label="LinkedIn" className="hover:text-foreground">
                <Linkedin className="h-4 w-4" />
              </a>
            </div>
          </div>
          {cols.map((c) => (
            <div key={c.title}>
              <h4 className="text-sm font-semibold text-foreground">{c.title}</h4>
              <ul className="mt-4 space-y-2.5">
                {c.links.map((l) => (
                  <li key={l}>
                    <a
                      href="#"
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-border/60 pt-6 sm:flex-row sm:items-center">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Abroad Compass. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">
            Built for ambitious students. Made with care.
          </p>
        </div>
      </div>
    </footer>
  );
}
