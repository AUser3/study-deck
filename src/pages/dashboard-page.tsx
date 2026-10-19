import { Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Flame,
  GraduationCap,
  Library,
  MoreHorizontal,
  Pencil,
  Plus,
  Target,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AppShell } from "@/components/app-shell";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { EmptyState } from "@/components/empty-state";
import { Loading } from "@/components/loading";
import { ProgressBar } from "@/components/progress-bar";
import { CourseDialog } from "@/features/courses/course-dialog";
import { createCourse, deleteCourse, updateCourse, useAppState } from "@/lib/data/store";
import {
  attemptsByQuestion,
  computeProgress,
  pct,
  streak,
  studiedToday,
} from "@/lib/data/progress";
import type { Course } from "@/lib/data/types";

/** Course overview and study activity screen. */
export function DashboardPage() {
  const s = useAppState();
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Course | null>(null);
  const [deleting, setDeleting] = useState<Course | null>(null);

  const data = useMemo(() => {
    if (!s) return null;
    const byQ = attemptsByQuestion(s.attempts);
    return {
      byQ,
      overall: computeProgress(s.questions, byQ),
      today: studiedToday(s.attempts),
      streak: streak(s.attempts),
    };
  }, [s]);

  if (!s || !data)
    return (
      <AppShell>
        <Loading />
      </AppShell>
    );

  return (
    <AppShell>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-primary">Welcome back</p>
          <h1 className="mt-1 text-3xl font-semibold sm:text-4xl">Your courses</h1>
        </div>
        <Button size="lg" onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4" /> Create course
        </Button>
      </div>

      <section aria-label="Study overview" className="mt-8 grid gap-4 sm:grid-cols-3">
        <Stat
          icon={<Target className="h-5 w-5" />}
          label="Studied today"
          value={`${data.today}`}
          hint="unique cards"
        />
        <Stat
          icon={<GraduationCap className="h-5 w-5" />}
          label="Overall mastery"
          value={pct(data.overall.mastery)}
          hint={`${data.overall.mastered} of ${data.overall.total} mastered`}
        />
        <Stat
          icon={<Flame className="h-5 w-5" />}
          label="Study streak"
          value={`${data.streak} ${data.streak === 1 ? "day" : "days"}`}
          hint="in a row"
        />
      </section>

      <section className="mt-8">
        {s.courses.length === 0 ? (
          <EmptyState
            icon={<Library className="h-6 w-6" />}
            title="No courses yet"
            actions={
              <Button onClick={() => setCreating(true)}>
                <Plus className="h-4 w-4" /> Create your first course
              </Button>
            }
          >
            Create a course, add topics and questions, then start studying.
          </EmptyState>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {s.courses.map((c) => {
              const qs = s.questions.filter((q) => q.courseId === c.id);
              const p = computeProgress(qs, data.byQ);
              const tc = s.topics.filter((t) => t.courseId === c.id).length;
              return (
                <li
                  key={c.id}
                  className="group relative flex flex-col rounded-xl border border-border bg-card p-5 shadow-card transition hover:border-primary/40"
                >
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      to="/courses/$courseId"
                      params={{ courseId: c.id }}
                      className="after:absolute after:inset-0 after:rounded-xl"
                    >
                      <h2 className="text-xl font-semibold leading-tight">{c.name}</h2>
                    </Link>
                    <div className="relative z-10 flex items-center gap-1">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            aria-label={`Options for ${c.name}`}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={() => setEditing(c)}>
                            <Pencil className="h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onSelect={() => setDeleting(c)}
                          >
                            <Trash2 className="h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  {c.description && (
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {c.description}
                    </p>
                  )}
                  <p className="mt-4 text-sm text-muted-foreground">
                    {tc} {tc === 1 ? "topic" : "topics"} · {qs.length}{" "}
                    {qs.length === 1 ? "question" : "questions"}
                  </p>
                  <div className="mt-auto space-y-2 pt-4">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Completion {pct(p.completion)}</span>
                      <span>Mastery {pct(p.mastery)}</span>
                    </div>
                    <ProgressBar value={p.completion} label={`${c.name} completion`} />
                    <ProgressBar value={p.mastery} label={`${c.name} mastery`} tone="success" />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <CourseDialog
        open={creating}
        onOpenChange={setCreating}
        onSubmit={async (n, d) => {
          const c = await createCourse(n, d);
          setCreating(false);
          navigate({ to: "/courses/$courseId", params: { courseId: c.id } });
        }}
      />
      <CourseDialog
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        initial={editing ?? undefined}
        onSubmit={async (n, d) => {
          await updateCourse(editing!.id, { name: n.trim(), description: d.trim() || undefined });
          setEditing(null);
        }}
      />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={`Delete “${deleting?.name}”?`}
        description="This removes the course with all its topics, questions and progress. This can't be undone."
        onConfirm={async () => {
          await deleteCourse(deleting!.id);
          setDeleting(null);
          toast("Course deleted");
        }}
      />
    </AppShell>
  );
}

function Stat({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-card">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-primary">
        {icon}
      </div>
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="font-display text-2xl font-semibold">{value}</p>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
    </div>
  );
}
