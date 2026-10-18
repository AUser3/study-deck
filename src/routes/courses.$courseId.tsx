import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AlertCircle, FileUp, FolderPlus, Layers, Pencil, Play, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { AppShell } from "@/components/app-shell";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { DemoBadge } from "@/components/demo-badge";
import { EmptyState } from "@/components/empty-state";
import { Loading } from "@/components/loading";
import { ProgressBar } from "@/components/progress-bar";
import { CourseDialog } from "@/features/courses/course-dialog";
import { QuestionDialog } from "@/features/questions/question-dialog";
import { getStudyEligibility } from "@/features/study/eligibility";
import { ModePicker } from "@/features/study/mode-picker";
import { TopicDialog } from "@/features/topics/topic-dialog";
import {
  addQuestions,
  createTopic,
  deleteTopic,
  renameTopic,
  updateCourse,
  useAppState,
} from "@/lib/data/store";
import { attemptsByQuestion, computeProgress, pct } from "@/lib/data/progress";
import type { StudyMode, Topic } from "@/lib/data/types";

export const Route = createFileRoute("/courses/$courseId")({
  head: () => ({
    meta: [
      { title: "Course — Studydeck" },
      {
        name: "description",
        content:
          "Topics, question counts and progress for this course. Pick topics and start studying.",
      },
      { property: "og:title", content: "Course — Studydeck" },
      {
        property: "og:description",
        content: "Topics, question counts and progress for this course.",
      },
    ],
  }),
  component: CoursePage,
});

function CoursePage() {
  const { courseId } = Route.useParams();
  const s = useAppState();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [mode, setMode] = useState<StudyMode>("mc");
  const [newTopic, setNewTopic] = useState(false);
  const [renaming, setRenaming] = useState<Topic | null>(null);
  const [deleting, setDeleting] = useState<Topic | null>(null);
  const [editCourse, setEditCourse] = useState(false);
  const [addingQ, setAddingQ] = useState(false);

  const course = s?.courses.find((c) => c.id === courseId);
  const topics = useMemo(
    () => s?.topics.filter((t) => t.courseId === courseId) ?? [],
    [s, courseId],
  );
  const byQ = useMemo(() => attemptsByQuestion(s?.attempts ?? []), [s]);

  if (!s)
    return (
      <AppShell>
        <Loading />
      </AppShell>
    );
  if (!course)
    return (
      <AppShell crumbs={[{ label: "Not found" }]}>
        <EmptyState
          icon={<AlertCircle className="h-6 w-6" />}
          title="Course not found"
          actions={
            <Button asChild>
              <Link to="/">Back to dashboard</Link>
            </Button>
          }
        >
          It may have been deleted.
        </EmptyState>
      </AppShell>
    );

  const courseQs = s.questions.filter((q) => q.courseId === courseId);
  const p = computeProgress(courseQs, byQ);
  const allSelected = topics.length > 0 && topics.every((t) => selected.has(t.id));
  const chosenIds = selected.size
    ? [...selected].filter((id) => topics.some((t) => t.id === id))
    : [];
  const chosenQs = courseQs.filter((q) => chosenIds.includes(q.topicId));
  const el = getStudyEligibility(chosenQs, mode);

  const toggle = (id: string) =>
    setSelected((cur) => {
      const n = new Set(cur);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const start = () =>
    navigate({ to: "/study", search: { course: courseId, topics: chosenIds.join(","), mode } });

  return (
    <AppShell crumbs={[{ label: "Courses", to: "/" }, { label: course.name }]}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-semibold sm:text-4xl">{course.name}</h1>
            {course.demo && <DemoBadge />}
            <Button
              variant="ghost"
              size="icon"
              aria-label="Edit course"
              onClick={() => setEditCourse(true)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          </div>
          {course.description && (
            <p className="mt-2 max-w-2xl text-muted-foreground">{course.description}</p>
          )}
          <p className="mt-3 text-sm text-muted-foreground">
            {topics.length} topics · {courseQs.length} questions · Completion {pct(p.completion)} ·
            Accuracy {p.accuracy === null ? "—" : pct(p.accuracy)} · Mastery {pct(p.mastery)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setNewTopic(true)}>
            <FolderPlus className="h-4 w-4" /> Create topic
          </Button>
          <Button variant="outline" disabled={!topics.length} onClick={() => setAddingQ(true)}>
            <Plus className="h-4 w-4" /> Add question
          </Button>
          <Button variant="outline" asChild>
            <Link to="/courses/$courseId/import" params={{ courseId }}>
              <FileUp className="h-4 w-4" /> Import questions
            </Link>
          </Button>
        </div>
      </div>

      {topics.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={<Layers className="h-6 w-6" />}
            title="This course has no topics yet"
            actions={
              <>
                <Button onClick={() => setNewTopic(true)}>
                  <FolderPlus className="h-4 w-4" /> Create a topic
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/courses/$courseId/import" params={{ courseId }}>
                    <FileUp className="h-4 w-4" /> Import questions
                  </Link>
                </Button>
              </>
            }
          >
            Topics group your questions. Create one manually, or import questions — topics named in
            the import are created for you.
          </EmptyState>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_340px]">
          <section aria-label="Topics">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Topics</h2>
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={() =>
                    setSelected(allSelected ? new Set() : new Set(topics.map((t) => t.id)))
                  }
                />
                Study all topics
              </label>
            </div>
            <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card shadow-card">
              {topics.map((t) => {
                const qs = courseQs.filter((q) => q.topicId === t.id);
                const tp = computeProgress(qs, byQ);
                return (
                  <li key={t.id} className="flex items-center gap-4 px-4 py-3">
                    <Checkbox
                      checked={selected.has(t.id)}
                      onCheckedChange={() => toggle(t.id)}
                      aria-label={`Select ${t.name}`}
                    />
                    <div className="min-w-0 flex-1">
                      <Link
                        to="/courses/$courseId/topics/$topicId"
                        params={{ courseId, topicId: t.id }}
                        className="font-medium hover:text-primary hover:underline"
                      >
                        {t.name}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {qs.length} questions · {pct(tp.completion)} complete · {pct(tp.mastery)}{" "}
                        mastery
                      </p>
                      <div className="mt-1.5 max-w-xs">
                        <ProgressBar
                          value={tp.mastery}
                          label={`${t.name} mastery`}
                          tone="success"
                        />
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Rename ${t.name}`}
                      onClick={() => setRenaming(t)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Delete ${t.name}`}
                      onClick={() => setDeleting(t)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </li>
                );
              })}
            </ul>
          </section>

          <aside className="h-fit rounded-xl border border-border bg-card p-5 shadow-card lg:sticky lg:top-6">
            <h2 className="text-lg font-semibold">Study session</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {chosenIds.length
                ? `${chosenIds.length} of ${topics.length} topics selected`
                : "Select one or more topics."}
            </p>
            <div className="mt-4">
              <ModePicker value={mode} onChange={setMode} />
            </div>
            <div className="mt-4 text-sm" aria-live="polite">
              {chosenIds.length > 0 && (
                <p>
                  <strong>{el.eligible}</strong> of {chosenQs.length} questions available.
                </p>
              )}
              {mode === "mc" && el.skipped > 0 && (
                <p className="mt-2 flex gap-2 rounded-md bg-warning-soft p-2.5 text-xs text-foreground">
                  <AlertCircle className="h-4 w-4 shrink-0 text-warning" />
                  {el.skipped} selected {el.skipped === 1 ? "question has" : "questions have"} no
                  answer choices and will be skipped in multiple choice. Use typed answer to include{" "}
                  {el.skipped === 1 ? "it" : "them"}.
                </p>
              )}
              {chosenIds.length > 0 && el.eligible === 0 && (
                <p className="mt-2 rounded-md bg-danger-soft p-2.5 text-xs text-destructive">
                  No eligible questions for this mode. Add questions or switch mode.
                </p>
              )}
            </div>
            <Button className="mt-4 w-full" size="lg" disabled={el.eligible === 0} onClick={start}>
              <Play className="h-4 w-4" /> Start studying
            </Button>
          </aside>
        </div>
      )}

      <TopicDialog
        open={newTopic}
        onOpenChange={setNewTopic}
        onSubmit={(n) => {
          createTopic(courseId, n);
          setNewTopic(false);
          toast("Topic created");
        }}
      />
      <TopicDialog
        open={!!renaming}
        onOpenChange={(o) => !o && setRenaming(null)}
        initial={renaming ?? undefined}
        onSubmit={(n) => {
          renameTopic(renaming!.id, n);
          setRenaming(null);
        }}
      />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={`Delete “${deleting?.name}”?`}
        description="All questions and progress in this topic will be removed."
        onConfirm={() => {
          deleteTopic(deleting!.id);
          setSelected((c) => {
            const n = new Set(c);
            n.delete(deleting!.id);
            return n;
          });
          setDeleting(null);
        }}
      />
      <CourseDialog
        open={editCourse}
        onOpenChange={setEditCourse}
        initial={course}
        onSubmit={(n, d) => {
          updateCourse(courseId, { name: n.trim(), description: d.trim() || undefined });
          setEditCourse(false);
        }}
      />
      <QuestionDialog
        open={addingQ}
        onOpenChange={setAddingQ}
        courses={s.courses}
        topics={s.topics}
        defaultCourseId={courseId}
        defaultTopicId={topics[0]?.id ?? ""}
        onSubmit={(q) => {
          addQuestions([q]);
          setAddingQ(false);
          toast("Question added");
        }}
      />
    </AppShell>
  );
}
