import { Link } from "@tanstack/react-router";
import { BookOpen, FileArchive, NotebookPen } from "lucide-react";

import { cn } from "@/lib/utils";

interface CourseSectionNavProps {
  courseId: string;
  active: "overview" | "notes" | "old-exams";
}

const itemClass = (active: boolean) =>
  cn(
    "inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
    active
      ? "bg-primary text-primary-foreground"
      : "text-muted-foreground hover:bg-accent hover:text-foreground",
  );

export function CourseSectionNav({ courseId, active }: CourseSectionNavProps) {
  return (
    <nav aria-label="Course sections" className="mt-6 flex gap-1 rounded-lg border bg-card p-1">
      <Link
        to="/courses/$courseId"
        params={{ courseId }}
        className={itemClass(active === "overview")}
      >
        <BookOpen className="h-4 w-4" aria-hidden />
        Overview
      </Link>
      <Link
        to="/courses/$courseId/notes"
        params={{ courseId }}
        className={itemClass(active === "notes")}
      >
        <NotebookPen className="h-4 w-4" aria-hidden />
        Notes
      </Link>
      <Link
        to="/courses/$courseId/old-exams"
        params={{ courseId }}
        className={itemClass(active === "old-exams")}
      >
        <FileArchive className="h-4 w-4" aria-hidden />
        Old exams
      </Link>
    </nav>
  );
}
