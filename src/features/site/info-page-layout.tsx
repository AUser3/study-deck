import type { ReactNode } from "react";

import { AppShell } from "@/components/app-shell";

interface InfoPageLayoutProps {
  eyebrow: string;
  title: string;
  intro: string;
  children: ReactNode;
}

export function InfoPageLayout({ eyebrow, title, intro, children }: InfoPageLayoutProps) {
  return (
    <AppShell crumbs={[{ label: title }]}>
      <article className="mx-auto max-w-3xl">
        <header className="border-b pb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
            {eyebrow}
          </p>
          <h1 className="mt-3 text-4xl font-semibold sm:text-5xl">{title}</h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-muted-foreground">{intro}</p>
        </header>
        <div className="space-y-10 py-8 [&_h2]:text-2xl [&_h2]:font-semibold [&_p]:mt-3 [&_p]:leading-7 [&_p]:text-muted-foreground [&_ul]:mt-3 [&_ul]:space-y-2 [&_ul]:pl-5 [&_ul]:text-muted-foreground [&_li]:list-disc">
          {children}
        </div>
      </article>
    </AppShell>
  );
}
