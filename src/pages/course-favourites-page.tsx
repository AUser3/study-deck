import { Link, useNavigate } from "@tanstack/react-router";
import { BookOpen, Pencil, Star, X } from "lucide-react";
import { useMemo, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { EmptyState } from "@/components/empty-state";
import { Loading } from "@/components/loading";
import { Button } from "@/components/ui/button";
import { CourseSectionNav } from "@/features/courses/course-section-nav";
import { toggleTopicFavorite, useAppState } from "@/lib/data/store";
import type { Topic } from "@/lib/data/types";

export function CourseFavouritesPage({ courseId }: { courseId: string }) {
  const state = useAppState();
  const [removing, setRemoving] = useState<Topic | null>(null);
  const course = state?.courses.find((item) => item.id === courseId);
  const favourites = useMemo(
    () => state?.topics.filter((topic) => topic.courseId === courseId && topic.favorite) ?? [],
    [courseId, state?.topics],
  );

  if (!state)
    return (
      <AppShell>
        <Loading />
      </AppShell>
    );
  if (!course) {
    return (
      <AppShell>
        <EmptyState
          icon={<BookOpen className="h-6 w-6" />}
          title="Course not found"
          actions={
            <Button asChild>
              <Link to="/">Back</Link>
            </Button>
          }
        />
      </AppShell>
    );
  }

  return (
    <AppShell crumbs={[{ label: "Courses", to: "/" }, { label: course.name }]}>
      <p className="text-sm font-medium text-primary">{course.name}</p>
      <h1 className="mt-1 flex items-center gap-2 text-3xl font-semibold">
        <Star className="h-7 w-7 text-warning" fill="currentColor" /> Favourites
      </h1>
      <p className="mt-2 text-muted-foreground">Your saved topics for quick access.</p>
      <CourseSectionNav courseId={courseId} active="favourites" />

      {favourites.length === 0 ? (
        <div className="mt-8">
          <EmptyState icon={<Star className="h-6 w-6" />} title="No favourite topics yet">
            Click the star beside a topic on the course overview to save it here.
          </EmptyState>
        </div>
      ) : (
        <section className="mt-8 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-4 shadow-card">
            <p className="text-sm">
              <strong>{favourites.length}</strong> saved{" "}
              {favourites.length === 1 ? "topic" : "topics"}
            </p>
          </div>
          <ul className="grid gap-3">
            {favourites.map((topic) => (
              <li
                key={topic.id}
                className="surface flex items-center gap-4 overflow-hidden rounded-2xl border p-4 transition hover:-translate-y-0.5 hover:border-primary/30"
              >
                <Star
                  className="mt-0.5 h-5 w-5 shrink-0 text-warning"
                  fill="currentColor"
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <Link
                    className="font-medium hover:text-primary hover:underline"
                    to="/courses/$courseId/topics/$topicId"
                    params={{ courseId, topicId: topic.id }}
                  >
                    {topic.name}
                  </Link>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Favourite topic · open to view and manage questions
                  </p>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link
                    to="/courses/$courseId/topics/$topicId"
                    params={{ courseId, topicId: topic.id }}
                  >
                    <Pencil className="h-4 w-4" /> View questions
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Remove from favourites"
                  onClick={() => setRemoving(topic)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        </section>
      )}
      <ConfirmDialog
        open={!!removing}
        onOpenChange={(open) => !open && setRemoving(null)}
        title="Remove topic from favourites?"
        description={removing?.name}
        onConfirm={async () => {
          await toggleTopicFavorite(removing!.id, false);
          setRemoving(null);
        }}
      />
    </AppShell>
  );
}
