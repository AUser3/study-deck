import { Link } from "@tanstack/react-router";
import { BookOpen, Pencil, Pin, X } from "lucide-react";
import { useMemo, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { EmptyState } from "@/components/empty-state";
import { Loading } from "@/components/loading";
import { Button } from "@/components/ui/button";
import { CourseSectionNav } from "@/features/courses/course-section-nav";
import { QuestionDialog } from "@/features/questions/question-dialog";
import { togglePinned, updateQuestion, useAppState } from "@/lib/data/store";
import type { Question } from "@/lib/data/types";

export function CoursePinnedPage({ courseId }: { courseId: string }) {
  const state = useAppState();
  const [busy, setBusy] = useState<string | null>(null);
  const [editing, setEditing] = useState<Question | null>(null);
  const [unpinning, setUnpinning] = useState<Question | null>(null);
  const course = state?.courses.find((item) => item.id === courseId);
  const pinned = useMemo(
    () =>
      state?.questions.filter((question) => question.courseId === courseId && question.pinned) ??
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
        <EmptyState icon={<BookOpen className="h-6 w-6" />} title="Course not found">
          <Button asChild>
            <Link to="/">Back</Link>
          </Button>
        </EmptyState>
      </AppShell>
    );
  }

  const topicNames = new Map(state.topics.map((topic) => [topic.id, topic.name]));
  return (
    <AppShell crumbs={[{ label: "Courses", to: "/" }, { label: course.name }]}>
      <p className="text-sm font-medium text-primary">{course.name}</p>
      <h1 className="mt-1 flex items-center gap-2 text-3xl font-semibold">
        <Pin className="h-7 w-7 text-primary" /> Pinned questions
      </h1>
      <p className="mt-2 text-muted-foreground">Questions you pinned while studying.</p>
      <CourseSectionNav courseId={courseId} active="pinned" />
      {pinned.length === 0 ? (
        <div className="mt-8">
          <EmptyState icon={<Pin className="h-6 w-6" />} title="No pinned questions yet">
            Pin a question from the top-right corner of its study card.
          </EmptyState>
        </div>
      ) : (
        <ul className="mt-8 divide-y divide-border overflow-hidden rounded-xl border border-border bg-card shadow-card">
          {pinned.map((question) => (
            <li key={question.id} className="flex items-start gap-3 px-4 py-4">
              <Pin className="mt-0.5 h-5 w-5 shrink-0 text-primary" fill="currentColor" />
              <div className="min-w-0 flex-1">
                <p className="font-medium">{question.text}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {topicNames.get(question.topicId) ?? "Unknown topic"}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                disabled={busy === question.id}
                aria-label="Unpin question"
                onClick={() => setUnpinning(question)}
              >
                <X className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Edit question"
                onClick={() => setEditing(question)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}
      <QuestionDialog
        open={!!editing}
        onOpenChange={(open) => !open && setEditing(null)}
        courses={state.courses}
        topics={state.topics}
        initial={editing ?? undefined}
        defaultCourseId={courseId}
        defaultTopicId={editing?.topicId ?? ""}
        onSubmit={async (next) => {
          await updateQuestion(editing!.id, next);
          setEditing(null);
        }}
      />
      <ConfirmDialog
        open={!!unpinning}
        onOpenChange={(open) => !open && setUnpinning(null)}
        title="Unpin this question?"
        description={unpinning?.text}
        onConfirm={async () => {
          setBusy(unpinning!.id);
          await togglePinned(unpinning!.id, false);
          setBusy(null);
          setUnpinning(null);
        }}
      />
    </AppShell>
  );
}
