import { Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  FileQuestion,
  FileUp,
  Pencil,
  Play,
  Plus,
  Search,
  SearchX,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AppShell } from "@/components/app-shell";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { EmptyState } from "@/components/empty-state";
import { Loading } from "@/components/loading";
import { QuestionDialog } from "@/features/questions/question-dialog";
import { getStudyEligibility } from "@/features/study/eligibility";
import { ModePicker } from "@/features/study/mode-picker";
import { addQuestions, deleteQuestion, updateQuestion, useAppState } from "@/lib/data/store";
import { attemptsByQuestion, computeProgress, isMastered, pct } from "@/lib/data/progress";
import type { Question, StudyMode } from "@/lib/data/types";

const PAGE = 50;

/** Question bank and study actions for one topic. */
export function TopicQuestionsPage({ courseId, topicId }: { courseId: string; topicId: string }) {
  const s = useAppState();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(PAGE);
  const [editing, setEditing] = useState<Question | null>(null);
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState<Question | null>(null);
  const [mode, setMode] = useState<StudyMode>("mc");

  const byQ = useMemo(() => attemptsByQuestion(s?.attempts ?? []), [s]);
  const qs = useMemo(() => s?.questions.filter((q) => q.topicId === topicId) ?? [], [s, topicId]);
  const filtered = useMemo(() => {
    const t = query.trim().toLowerCase();
    if (!t) return qs;
    return qs.filter(
      (q) =>
        q.text.toLowerCase().includes(t) ||
        q.answer.toLowerCase().includes(t) ||
        q.choices.some((c) => c.toLowerCase().includes(t)),
    );
  }, [qs, query]);

  if (!s)
    return (
      <AppShell>
        <Loading />
      </AppShell>
    );
  const course = s.courses.find((c) => c.id === courseId);
  const topic = s.topics.find((t) => t.id === topicId);
  if (!course || !topic)
    return (
      <AppShell crumbs={[{ label: "Not found" }]}>
        <EmptyState
          icon={<AlertCircle className="h-6 w-6" />}
          title="Topic not found"
          actions={
            <Button asChild>
              <Link to="/">Back to dashboard</Link>
            </Button>
          }
        />
      </AppShell>
    );

  const p = computeProgress(qs, byQ);
  const el = getStudyEligibility(qs, mode);

  return (
    <AppShell
      crumbs={[
        { label: "Courses", to: "/" },
        { label: course.name, to: "/courses/$courseId", params: { courseId } },
        { label: topic.name },
      ]}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-primary">{course.name}</p>
          <h1 className="mt-1 text-3xl font-semibold">{topic.name}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {qs.length} questions · Completion {pct(p.completion)} · Accuracy{" "}
            {p.accuracy === null ? "—" : pct(p.accuracy)} · {p.mastered} mastered
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setAdding(true)}>
            <Plus className="h-4 w-4" /> Add question
          </Button>
          <Button variant="outline" asChild>
            <Link to="/courses/$courseId/import" params={{ courseId }} search={{ topic: topicId }}>
              <FileUp className="h-4 w-4" /> Import
            </Link>
          </Button>
        </div>
      </div>

      {qs.length > 0 && (
        <div className="mt-6 flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-card md:flex-row md:items-center">
          <div className="flex-1">
            <ModePicker value={mode} onChange={setMode} />
          </div>
          <div className="md:w-64">
            {mode === "mc" && el.skipped > 0 && (
              <p className="mb-2 text-xs text-muted-foreground">
                {el.skipped} without choices will be skipped.
              </p>
            )}
            <Button
              className="w-full"
              size="lg"
              disabled={!el.eligible}
              onClick={() =>
                navigate({ to: "/study", search: { course: courseId, topics: topicId, mode } })
              }
            >
              <Play className="h-4 w-4" /> Study {el.eligible}{" "}
              {el.eligible === 1 ? "question" : "questions"}
            </Button>
          </div>
        </div>
      )}

      <section className="mt-6">
        {qs.length === 0 ? (
          <EmptyState
            icon={<FileQuestion className="h-6 w-6" />}
            title="No questions in this topic"
            actions={
              <>
                <Button onClick={() => setAdding(true)}>
                  <Plus className="h-4 w-4" /> Add a question
                </Button>
                <Button variant="outline" asChild>
                  <Link
                    to="/courses/$courseId/import"
                    params={{ courseId }}
                    search={{ topic: topicId }}
                  >
                    <FileUp className="h-4 w-4" /> Import in bulk
                  </Link>
                </Button>
              </>
            }
          >
            Add questions one at a time or paste a whole set at once.
          </EmptyState>
        ) : (
          <>
            <div className="relative mb-4">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setLimit(PAGE);
                }}
                placeholder={`Search ${qs.length} questions…`}
                className="pl-9"
                aria-label="Search questions"
              />
            </div>
            {filtered.length === 0 ? (
              <EmptyState
                icon={<SearchX className="h-6 w-6" />}
                title="No matching questions"
                actions={
                  <Button variant="outline" onClick={() => setQuery("")}>
                    Clear search
                  </Button>
                }
              >
                Nothing matches “{query}”.
              </EmptyState>
            ) : (
              <>
                <p className="mb-2 text-xs text-muted-foreground">
                  Showing {Math.min(limit, filtered.length)} of {filtered.length}
                </p>
                <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card shadow-card">
                  {filtered.slice(0, limit).map((q) => {
                    const list = byQ.get(q.id);
                    return (
                      <li key={q.id} className="flex items-start gap-3 px-4 py-3">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium">{q.text}</p>
                          <p className="mt-0.5 text-sm text-muted-foreground">
                            <span className="text-success">✓ {q.answer}</span>
                            {" · "}
                            {q.choices.length ? `${q.choices.length} choices` : "Typed answer only"}
                            {" · "}
                            {list?.length ? `${list.length} attempts` : "Not studied"}
                          </p>
                        </div>
                        {isMastered(list) && (
                          <span className="mt-1 flex items-center gap-1 text-xs font-medium text-success">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Mastered
                          </span>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Edit question"
                          onClick={() => setEditing(q)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Delete question"
                          onClick={() => setDeleting(q)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </li>
                    );
                  })}
                </ul>
                {limit < filtered.length && (
                  <div className="mt-4 text-center">
                    <Button variant="outline" onClick={() => setLimit((l) => l + PAGE)}>
                      Show more
                    </Button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </section>

      <QuestionDialog
        open={adding}
        onOpenChange={setAdding}
        courses={s.courses}
        topics={s.topics}
        defaultCourseId={courseId}
        defaultTopicId={topicId}
        onSubmit={async (q) => {
          await addQuestions([q]);
          setAdding(false);
          toast("Question added");
        }}
      />
      <QuestionDialog
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        courses={s.courses}
        topics={s.topics}
        initial={editing ?? undefined}
        defaultCourseId={courseId}
        defaultTopicId={topicId}
        onSubmit={async (q) => {
          await updateQuestion(editing!.id, q);
          setEditing(null);
          toast("Question saved");
        }}
      />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete this question?"
        description={deleting?.text}
        onConfirm={async () => {
          await deleteQuestion(deleting!.id);
          setDeleting(null);
        }}
      />
    </AppShell>
  );
}
