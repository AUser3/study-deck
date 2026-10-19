import { Link } from "@tanstack/react-router";
import { BookOpenCheck, Github } from "lucide-react";

import { PROJECT_LINKS } from "@/lib/project-links";

export function SiteFooter() {
  return (
    <footer className="border-t bg-card/60">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 md:flex-row md:items-center md:justify-between">
        <div>
          <Link to="/" className="inline-flex items-center gap-2 font-display font-semibold">
            <BookOpenCheck className="h-5 w-5 text-primary" aria-hidden />
            Studydeck
          </Link>
          <p className="mt-2 text-sm text-muted-foreground">
            Local-first study tools, built in the open.
          </p>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap items-center gap-x-5 gap-y-3 text-sm">
          <Link
            to="/about"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            About
          </Link>
          <Link to="/faq" className="text-muted-foreground transition-colors hover:text-foreground">
            FAQ
          </Link>
          <Link
            to="/contributing"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Contributing
          </Link>
          <a
            href={PROJECT_LINKS.github}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
          >
            <Github className="h-4 w-4" aria-hidden />
            GitHub
          </a>
        </nav>
      </div>
      <div className="border-t px-4 py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Studydeck. Your study data stays on your machine.
      </div>
    </footer>
  );
}
