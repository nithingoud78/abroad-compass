import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface SummaryCardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title: React.ReactNode;
  value: React.ReactNode;
  icon?: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  accent?: boolean;
}

export function SummaryCard({
  title,
  value,
  icon,
  subtitle,
  action,
  accent,
  className,
  ...props
}: SummaryCardProps) {
  return (
    <Card
      className={cn(
        "shadow-card flex flex-col justify-between",
        accent && "border-brand/30 bg-brand/5",
        className,
      )}
      {...props}
    >
      <CardContent className="p-4 flex flex-col justify-center h-full min-h-[110px]">
        <div className="flex items-center justify-between gap-2 text-xs uppercase tracking-wide text-muted-foreground">
          <div className="flex items-center gap-2">
            {icon}
            {title}
          </div>
          {action && <div>{action}</div>}
        </div>
        <div className="mt-2 font-display text-2xl font-bold">{value}</div>
        {subtitle && <div className="mt-1 text-xs text-muted-foreground">{subtitle}</div>}
      </CardContent>
    </Card>
  );
}
