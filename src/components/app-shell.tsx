import { Link } from "@tanstack/react-router";
import { BookOpenCheck, ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

import { DataActions } from "@/components/data-actions";

export interface Crumb {
  label: string;
  to?: string;
  params?: Record<string, string>;
}

export function AppShell({ crumbs = [], children }: { crumbs?: Crumb[]; children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-card/70 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 sm:px-6">
          <Link
            to="/"
            className="flex items-center gap-2 font-display text-lg font-semibold text-foreground"
          >
            <BookOpenCheck className="h-5 w-5 text-primary" aria-hidden />
            Studydeck
          </Link>
          {crumbs.length > 0 && (
            <nav aria-label="Breadcrumb" className="min-w-0 flex-1">
              <ol className="flex min-w-0 items-center gap-1 text-sm text-muted-foreground">
                {crumbs.map((crumb, index) => (
                  <li key={`${crumb.label}-${index}`} className="flex min-w-0 items-center gap-1">
                    <ChevronRight className="h-4 w-4 shrink-0" aria-hidden />
                    {crumb.to && index < crumbs.length - 1 ? (
                      <Link
                        // TanStack's route-specific params cannot be inferred from a runtime breadcrumb list.
                        to={crumb.to as never}
                        params={crumb.params as never}
                        className="truncate hover:text-foreground"
                      >
                        {crumb.label}
                      </Link>
                    ) : (
                      <span className="truncate font-medium text-foreground" aria-current="page">
                        {crumb.label}
                      </span>
                    )}
                  </li>
                ))}
              </ol>
            </nav>
          )}
          <DataActions />
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">{children}</main>
    </div>
  );
}
