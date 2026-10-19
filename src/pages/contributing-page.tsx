import { ExternalLink, GitPullRequest, MessagesSquare, TestTube2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { InfoPageLayout } from "@/features/site/info-page-layout";
import { PROJECT_LINKS } from "@/lib/project-links";

export function ContributingPage() {
  return (
    <InfoPageLayout
      eyebrow="Open source"
      title="Contribute to Studydeck"
      intro="Focused fixes, accessible UI improvements, tests, and clear documentation are welcome."
    >
      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-card p-5 shadow-card">
          <MessagesSquare className="h-5 w-5 text-primary" aria-hidden />
          <h2 className="mt-3 text-lg!">Start with context</h2>
          <p className="text-sm">
            Open or find an issue so the intended behavior and scope are clear.
          </p>
        </div>
        <div className="rounded-xl border bg-card p-5 shadow-card">
          <GitPullRequest className="h-5 w-5 text-primary" aria-hidden />
          <h2 className="mt-3 text-lg!">Keep it focused</h2>
          <p className="text-sm">
            One coherent change is easier to review, test, and merge safely.
          </p>
        </div>
        <div className="rounded-xl border bg-card p-5 shadow-card">
          <TestTube2 className="h-5 w-5 text-primary" aria-hidden />
          <h2 className="mt-3 text-lg!">Verify behavior</h2>
          <p className="text-sm">
            Run tests, lint, TypeScript, and the production build before submitting.
          </p>
        </div>
      </section>
      <section>
        <h2>Repository expectations</h2>
        <ul>
          <li>Use npm and the supported Node.js version.</li>
          <li>Keep dependencies flowing from routes to pages, features, components, and lib.</li>
          <li>Access study data only through the public data store.</li>
          <li>Never commit personal study data or generated build output.</li>
          <li>Add regression coverage when behavior changes.</li>
        </ul>
      </section>
      <section className="rounded-xl border bg-secondary/60 p-6">
        <h2>Read the complete guide</h2>
        <p>
          The repository guide contains setup commands, architecture boundaries, and the
          pull-request checklist.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button asChild>
            <a href={PROJECT_LINKS.contributing} target="_blank" rel="noreferrer">
              Contribution guide <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
          <Button asChild variant="outline">
            <a href={PROJECT_LINKS.issues} target="_blank" rel="noreferrer">
              Browse issues <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        </div>
      </section>
    </InfoPageLayout>
  );
}
