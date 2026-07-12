import * as React from "react";

export function SectionTitle({
  title,
  icon,
  action,
}: {
  title: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-4 mt-8 flex items-center justify-between">
      <div className="flex items-center gap-2">
        {icon && <div className="rounded-md bg-brand/10 p-1.5 text-brand">{icon}</div>}
        <h2 className="font-display text-xl font-semibold tracking-tight">{title}</h2>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
