/* eslint-disable @typescript-eslint/no-explicit-any */
import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Twitter, Linkedin, Github, Instagram, Mail } from "lucide-react";

type FooterSettings = {
  copyright_text: string;
  contact_email: string;
  twitter_url: string;
  linkedin_url: string;
  github_url: string;
  instagram_url: string;
};

export function Footer() {
  const [links, setLinks] = useState<{ slug: string; title: string }[]>([]);
  const [settings, setSettings] = useState<FooterSettings | null>(null);

  useEffect(() => {
    // Load dynamic legal pages
    supabase
      .from("legal_pages")
      .select("slug, title")
      .then(({ data }) => {
        if (data) setLinks(data);
      });

    // Load footer settings
    (supabase.from as any)("system_settings")
      .select("value")
      .eq("key", "footer_settings")
      .maybeSingle()
      .then(({ data }: any) => {
        if (data && data.value) setSettings(data.value);
      });
  }, []);

  return (
    <footer className="border-t bg-background/50 mt-auto h-12 md:h-14 flex items-center shrink-0 w-full">
      <div className="w-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 text-xs">
        {/* Left: Copyright */}
        <div className="flex items-center gap-1.5 text-muted-foreground whitespace-nowrap">
          <span className="font-display font-semibold text-foreground">Abroad Compass</span>
          <span>{settings?.copyright_text || `© ${new Date().getFullYear()} AbroadCompass`}</span>
        </div>

        {/* Right: Legal Links & Socials */}
        <div className="flex items-center gap-6 ml-auto">
          <nav className="hidden md:flex items-center gap-4 font-medium text-muted-foreground overflow-hidden">
            {links.length > 0 ? (
              links.map((l) => (
                <Link
                  key={l.slug}
                  to="/legal/$slug"
                  params={{ slug: l.slug }}
                  className="hover:text-foreground transition-colors whitespace-nowrap truncate"
                >
                  {l.title}
                </Link>
              ))
            ) : (
              <>
                <Link
                  to="/legal/$slug"
                  params={{ slug: "about" }}
                  className="hover:text-foreground transition-colors whitespace-nowrap"
                >
                  About
                </Link>
                <Link
                  to="/legal/$slug"
                  params={{ slug: "privacy" }}
                  className="hover:text-foreground transition-colors whitespace-nowrap"
                >
                  Privacy
                </Link>
                <Link
                  to="/legal/$slug"
                  params={{ slug: "terms" }}
                  className="hover:text-foreground transition-colors whitespace-nowrap"
                >
                  Terms
                </Link>
                <Link
                  to="/legal/$slug"
                  params={{ slug: "disclaimer" }}
                  className="hover:text-foreground transition-colors whitespace-nowrap"
                >
                  Disclaimer
                </Link>
                <Link
                  to="/legal/$slug"
                  params={{ slug: "cookies" }}
                  className="hover:text-foreground transition-colors whitespace-nowrap"
                >
                  Cookies
                </Link>
                <Link
                  to="/legal/$slug"
                  params={{ slug: "contact" }}
                  className="hover:text-foreground transition-colors whitespace-nowrap"
                >
                  Contact
                </Link>
              </>
            )}
          </nav>

          {/* Right: Socials & Contact */}
          <div className="flex items-center gap-3 text-muted-foreground">
            {settings?.contact_email && (
              <a
                href={`mailto:${settings.contact_email}`}
                className="hover:text-foreground transition-colors"
                title="Contact Us"
              >
                <Mail className="h-4 w-4" />
              </a>
            )}
            {settings?.twitter_url && (
              <a
                href={settings.twitter_url}
                target="_blank"
                rel="noreferrer"
                className="hover:text-foreground transition-colors"
              >
                <Twitter className="h-4 w-4" />
              </a>
            )}
            {settings?.linkedin_url && (
              <a
                href={settings.linkedin_url}
                target="_blank"
                rel="noreferrer"
                className="hover:text-foreground transition-colors"
              >
                <Linkedin className="h-4 w-4" />
              </a>
            )}
            {settings?.github_url && (
              <a
                href={settings.github_url}
                target="_blank"
                rel="noreferrer"
                className="hover:text-foreground transition-colors"
              >
                <Github className="h-4 w-4" />
              </a>
            )}
            {settings?.instagram_url && (
              <a
                href={settings.instagram_url}
                target="_blank"
                rel="noreferrer"
                className="hover:text-foreground transition-colors"
              >
                <Instagram className="h-4 w-4" />
              </a>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
