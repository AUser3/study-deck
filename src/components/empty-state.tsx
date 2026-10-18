import type { ReactNode } from "react";

export function EmptyState({
  icon,
  title,
  children,
  actions,
}: {
  icon: ReactNode;
  title: string;
  children?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-dashed border-input bg-card/60 px-6 py-12 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-primary">
        {icon}
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      {children && (
        <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">{children}</p>
      )}
      {actions && <div className="mt-5 flex flex-wrap justify-center gap-2">{actions}</div>}
    </div>
  );
}
