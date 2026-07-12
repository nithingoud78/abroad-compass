import {
  Compass,
  Twitter,
  Github,
  Linkedin,
  Globe,
  Mail,
  Youtube,
  MessageSquare,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function SiteFooter() {
  const [socials, setSocials] = useState<Record<string, string>>({});

  const normalizeUrl = (url: string) => {
    if (!url) return url;
    if (!url.startsWith("http://") && !url.startsWith("https://") && !url.startsWith("mailto:")) {
      return `https://${url}`;
    }
    return url;
  };

  useEffect(() => {
    supabase
      .from("system_settings")
      .select("value")
      .eq("key", "site_socials")
      .maybeSingle()
      .then(({ data }) => {
        if (data && data.value) setSocials(data.value as Record<string, string>);
      });
  }, []);

  const cols = [
    {
      title: "Product",
      links: [
        { label: "Features", href: "/#features" },
        { label: "Roadmap", href: "/#roadmap" },
        { label: "University Search", href: "/#university-search" },
        { label: "German Learning", href: "/#german-learning" },
      ],
    },
    {
      title: "Company",
      links: [
        { label: "About", to: "/legal/$slug" as const, params: { slug: "about" } },
        { label: "Blog", to: "/blog" as const },
        { label: "Contact", to: "/legal/$slug" as const, params: { slug: "contact" } },
      ],
    },
    {
      title: "Resources",
      links: [
        { label: "FAQ", href: "/#faq" },
        { label: "Help Center", to: "/help-center" as const },
        { label: "Guides", to: "/guides" as const },
        { label: "Community", to: "/community" as const },
      ],
    },
    {
      title: "Legal",
      links: [
        { label: "Privacy", to: "/legal/$slug" as const, params: { slug: "privacy" } },
        { label: "Terms", to: "/legal/$slug" as const, params: { slug: "terms" } },
        { label: "Disclaimer", to: "/legal/$slug" as const, params: { slug: "disclaimer" } },
        { label: "Cookies", to: "/legal/$slug" as const, params: { slug: "cookies" } },
      ],
    },
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
              {socials.twitter && (
                <a
                  href={normalizeUrl(socials.twitter)}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Twitter"
                  className="hover:text-foreground"
                >
                  <Twitter className="h-4 w-4" />
                </a>
              )}
              {socials.github && (
                <a
                  href={normalizeUrl(socials.github)}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="GitHub"
                  className="hover:text-foreground"
                >
                  <Github className="h-4 w-4" />
                </a>
              )}
              {socials.linkedin && (
                <a
                  href={normalizeUrl(socials.linkedin)}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn"
                  className="hover:text-foreground"
                >
                  <Linkedin className="h-4 w-4" />
                </a>
              )}
              {socials.website && (
                <a
                  href={normalizeUrl(socials.website)}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Website"
                  className="hover:text-foreground"
                >
                  <Globe className="h-4 w-4" />
                </a>
              )}
              {socials.email && (
                <a
                  href={normalizeUrl(socials.email)}
                  aria-label="Email"
                  className="hover:text-foreground"
                >
                  <Mail className="h-4 w-4" />
                </a>
              )}
              {socials.discord && (
                <a
                  href={normalizeUrl(socials.discord)}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Discord"
                  className="hover:text-foreground"
                >
                  <MessageSquare className="h-4 w-4" />
                </a>
              )}
              {socials.youtube && (
                <a
                  href={normalizeUrl(socials.youtube)}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="YouTube"
                  className="hover:text-foreground"
                >
                  <Youtube className="h-4 w-4" />
                </a>
              )}
            </div>
          </div>
          {cols.map((c) => (
            <div key={c.title}>
              <h4 className="text-sm font-semibold text-foreground">{c.title}</h4>
              <ul className="mt-4 space-y-2.5">
                {c.links.map((l) => (
                  <li key={l.label}>
                    {"href" in l ? (
                      <a
                        href={l.href}
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {l.label}
                      </a>
                    ) : (
                      <Link
                        to={l.to}
                        params={"params" in l ? l.params : undefined}
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {l.label}
                      </Link>
                    )}
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
