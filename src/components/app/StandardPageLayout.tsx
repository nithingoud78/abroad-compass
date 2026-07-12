import React from "react";
import { cn } from "@/lib/utils";

interface StandardPageLayoutProps {
  title: React.ReactNode;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  headerBadge?: React.ReactNode;
}

export function StandardPageLayout({
  title,
  subtitle,
  actions,
  children,
  className,
  headerBadge,
}: StandardPageLayoutProps) {
  return (
    <div className={cn("space-y-6 pb-12", className)}>
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
          <div className="flex items-center gap-3">
            <h1 className="font-display text-3xl font-bold tracking-tight">{title}</h1>
            {headerBadge}
          </div>
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </header>

      {children}
    </div>
  );
}
