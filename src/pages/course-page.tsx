import { Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  AlertCircle,
  FileUp,
  FolderPlus,
  Layers,
  MoreHorizontal,
  Pencil,
  Play,
  Plus,
  Star,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { AppShell } from "@/components/app-shell";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { EmptyState } from "@/components/empty-state";
import { Loading } from "@/components/loading";
import { ProgressBar } from "@/components/progress-bar";
import { CourseDialog } from "@/features/courses/course-dialog";
import { CourseSectionNav } from "@/features/courses/course-section-nav";
import { QuestionDialog } from "@/features/questions/question-dialog";
import { getStudyEligibility } from "@/features/study/eligibility";
import { ModePicker } from "@/features/study/mode-picker";
import { TopicDialog } from "@/features/topics/topic-dialog";
import { cn } from "@/lib/utils";
import {
  addQuestions,
  createTopic,
  deleteTopic,
  renameTopic,
  toggleTopicFavorite,
  updateCourse,
  useAppState,
} from "@/lib/data/store";
import { attemptsByQuestion, computeProgress, pct } from "@/lib/data/progress";
import type { StudyMode, Topic } from "@/lib/data/types";

/** Topics, progress, and course actions for one course. */
export function CoursePage({
  courseId,
  favoriteOnly = false,
}: {
  courseId: string;
  favoriteOnly?: boolean;
}) {
  const s = useAppState();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [mode, setMode] = useState<StudyMode>("mc");
  const [newTopic, setNewTopic] = useState(false);
  const [renaming, setRenaming] = useState<Topic | null>(null);
  const [deleting, setDeleting] = useState<Topic | null>(null);
  const [unfavoriting, setUnfavoriting] = useState<Topic | null>(null);
  const [editCourse, setEditCourse] = useState(false);
  const [addingQTopic, setAddingQTopic] = useState<Topic | null>(null);

  const course = s?.courses.find((c) => c.id === courseId);
  const topics = useMemo(
    () =>
      [
        ...(s?.topics.filter((t) => t.courseId === courseId && (!favoriteOnly || t.favorite)) ??
          []),
      ].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" })),
    [s, courseId, favoriteOnly],
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
          <Button variant="outline" asChild>
            <Link to="/courses/$courseId/import" params={{ courseId }}>
              <FileUp className="h-4 w-4" /> Import questions
            </Link>
          </Button>
        </div>
      </div>
      <CourseSectionNav courseId={courseId} active={favoriteOnly ? "favourites" : "overview"} />

      {topics.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={<Layers className="h-6 w-6" />}
            title={favoriteOnly ? "No favourite topics yet" : "This course has no topics yet"}
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
            {favoriteOnly
              ? "Click the star beside a topic on the course overview to save it here."
              : "Topics group your questions. Create one manually, or import questions — topics named in the import are created for you."}
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
            <ul className="grid gap-3">
              {topics.map((t) => {
                const qs = courseQs.filter((q) => q.topicId === t.id);
                const tp = computeProgress(qs, byQ);
                const isSelected = selected.has(t.id);
                return (
                  <li
                    key={t.id}
                    className={cn(
                      "group relative flex cursor-pointer items-center gap-4 overflow-hidden rounded-2xl border p-4 transition-all duration-300",
                      isSelected
                        ? "border-primary/50 bg-primary/[0.07] shadow-lg shadow-primary/10"
                        : "surface hover:-translate-y-0.5 hover:border-primary/30",
                    )}
                    onClick={(event) => {
                      const target = event.target as HTMLElement;
                      if (target.closest("button, a, input")) return;
                      toggle(t.id);
                    }}
                  >
                    <span
                      className={cn(
                        "absolute inset-y-0 left-0 w-1 origin-bottom bg-primary transition-transform duration-300",
                        isSelected ? "scale-y-100" : "scale-y-0 group-hover:scale-y-60",
                      )}
                      aria-hidden
                    />
                    <Checkbox
                      checked={isSelected}
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
                      <div className="mt-2 max-w-xs">
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
                      aria-label={
                        t.favorite
                          ? `Remove ${t.name} from favourites`
                          : `Add ${t.name} to favourites`
                      }
                      onClick={() =>
                        t.favorite ? setUnfavoriting(t) : void toggleTopicFavorite(t.id, true)
                      }
                    >
                      <Star
                        className={t.favorite ? "text-warning" : "text-muted-foreground"}
                        fill={t.favorite ? "currentColor" : "none"}
                      />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAddingQTopic(t)}
                      aria-label={`Add question to ${t.name}`}
                    >
                      <Plus className="h-4 w-4" /> Add question
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label={`Actions for ${t.name}`}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => setRenaming(t)}>
                          <Pencil className="h-4 w-4" /> Change topic name
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() =>
                            navigate({
                              to: "/courses/$courseId/topics/$topicId",
                              params: { courseId, topicId: t.id },
                            })
                          }
                        >
                          <Layers className="h-4 w-4" /> View questions
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onSelect={() => setDeleting(t)}
                        >
                          <Trash2 className="h-4 w-4" /> Delete topic
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </li>
                );
              })}
            </ul>
          </section>

          <aside className="mesh-gradient relative h-fit overflow-hidden rounded-3xl border border-white/70 p-5 shadow-card lg:sticky lg:top-6">
            <div className="relative">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-xl font-semibold">Study session</h2>
                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
                  Focus mode
                </span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {chosenIds.length
                  ? `${chosenIds.length} of ${topics.length} topics selected`
                  : "Select one or more topics."}
              </p>
              <div className="mt-5">
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
                    answer choices and will be skipped in multiple choice. Use typed answer to
                    include {el.skipped === 1 ? "it" : "them"}.
                  </p>
                )}
                {chosenIds.length > 0 && el.eligible === 0 && (
                  <p className="mt-2 rounded-md bg-danger-soft p-2.5 text-xs text-destructive">
                    No eligible questions for this mode. Add questions or switch mode.
                  </p>
                )}
              </div>
              <Button
                className="mt-5 w-full shadow-xl shadow-primary/20"
                size="lg"
                disabled={el.eligible === 0}
                onClick={start}
              >
                <Play className="h-4 w-4" /> Start studying
              </Button>
            </div>
          </aside>
        </div>
      )}

      <TopicDialog
        open={newTopic}
        onOpenChange={setNewTopic}
        onSubmit={async (n) => {
          await createTopic(courseId, n);
          setNewTopic(false);
          toast("Topic created");
        }}
      />
      <TopicDialog
        open={!!renaming}
        onOpenChange={(o) => !o && setRenaming(null)}
        initial={renaming ?? undefined}
        onSubmit={async (n) => {
          await renameTopic(renaming!.id, n);
          setRenaming(null);
        }}
      />
      <ConfirmDialog
        open={!!unfavoriting}
        onOpenChange={(o) => !o && setUnfavoriting(null)}
        title="Remove topic from favourites?"
        description={unfavoriting?.name}
        onConfirm={async () => {
          await toggleTopicFavorite(unfavoriting!.id, false);
          setUnfavoriting(null);
        }}
      />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={`Delete “${deleting?.name}”?`}
        description="All questions and progress in this topic will be removed."
        onConfirm={async () => {
          await deleteTopic(deleting!.id);
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
        onSubmit={async (n, d) => {
          await updateCourse(courseId, { name: n.trim(), description: d.trim() || undefined });
          setEditCourse(false);
        }}
      />
      <QuestionDialog
        open={!!addingQTopic}
        onOpenChange={(open) => !open && setAddingQTopic(null)}
        courses={s.courses}
        topics={s.topics}
        defaultCourseId={courseId}
        defaultTopicId={addingQTopic?.id ?? ""}
        onSubmit={async (q) => {
          await addQuestions([q]);
          setAddingQTopic(null);
          toast("Question added");
        }}
      />
    </AppShell>
  );
}
