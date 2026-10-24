import { Link, useNavigate } from "@tanstack/react-router";
import { BookOpen, Star, X } from "lucide-react";
import { useMemo, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { EmptyState } from "@/components/empty-state";
import { Loading } from "@/components/loading";
import { Button } from "@/components/ui/button";
import { CourseSectionNav } from "@/features/courses/course-section-nav";
import { toggleFavorite, useAppState } from "@/lib/data/store";
import type { Question, StudyMode } from "@/lib/data/types";
import { ModePicker } from "@/features/study/mode-picker";

export function CourseFavouritesPage({ courseId }: { courseId: string }) {
  const state = useAppState();
  const navigate = useNavigate();
  const [removing, setRemoving] = useState<Question | null>(null);
  const [mode, setMode] = useState<StudyMode>("mc");
  const course = state?.courses.find((item) => item.id === courseId);
  const topics = useMemo(
    () => new Map((state?.topics ?? []).map((topic) => [topic.id, topic.name])),
    [state?.topics],
  );
  const favourites = useMemo(
    () =>
      state?.questions.filter((question) => question.courseId === courseId && question.favorite) ??
      [],
    [courseId, state?.questions],
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

  const start = () => {
    const topicIds = [...new Set(favourites.map((question) => question.topicId))];
    navigate({ to: "/study", search: { course: courseId, topics: topicIds.join(","), mode } });
  };

  return (
    <AppShell crumbs={[{ label: "Courses", to: "/" }, { label: course.name }]}>
      <p className="text-sm font-medium text-primary">{course.name}</p>
      <h1 className="mt-1 flex items-center gap-2 text-3xl font-semibold">
        <Star className="h-7 w-7 text-warning" fill="currentColor" /> Favourites
      </h1>
      <p className="mt-2 text-muted-foreground">Your saved questions for quick review.</p>
      <CourseSectionNav courseId={courseId} active="favourites" />

      {favourites.length === 0 ? (
        <div className="mt-8">
          <EmptyState icon={<Star className="h-6 w-6" />} title="No favourite questions yet">
            Click the star beside a question to save it here for later review.
          </EmptyState>
        </div>
      ) : (
        <section className="mt-8 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-4 shadow-card">
            <p className="text-sm">
              <strong>{favourites.length}</strong> saved{" "}
              {favourites.length === 1 ? "question" : "questions"}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <ModePicker value={mode} onChange={setMode} />
              <Button onClick={start}>Study favourites</Button>
            </div>
          </div>
          <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card shadow-card">
            {favourites.map((question) => (
              <li key={question.id} className="flex items-start gap-3 px-4 py-4">
                <Star
                  className="mt-0.5 h-5 w-5 shrink-0 text-warning"
                  fill="currentColor"
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{question.text}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {topics.get(question.topicId) ?? "Unknown topic"}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Remove from favourites"
                  onClick={() => setRemoving(question)}
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
        title="Remove from favourites?"
        description={removing?.text}
        onConfirm={async () => {
          await toggleFavorite(removing!.id, false);
          setRemoving(null);
        }}
      />
    </AppShell>
  );
}
