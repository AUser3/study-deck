import { Link, useNavigate } from "@tanstack/react-router";
import { AlertCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/empty-state";
import { Loading } from "@/components/loading";
import { Button } from "@/components/ui/button";
import { createImportDraft, parseImportDraft } from "@/features/questions/import-model";
import { ImportPreview } from "@/features/questions/import-preview";
import { ImportSource } from "@/features/questions/import-source";
import { importQuestions, useAppState } from "@/lib/data/store";

interface QuestionImportPageProps {
  courseId: string;
  initialTopicId?: string;
}

/** Text and JSON question-import workflow. */
export function QuestionImportPage({ courseId, initialTopicId }: QuestionImportPageProps) {
  const state = useAppState();
  const navigate = useNavigate();
  const [draft, setDraft] = useState(() => createImportDraft(initialTopicId));
  const topics = useMemo(
    () => state?.topics.filter((topic) => topic.courseId === courseId) ?? [],
    [state, courseId],
  );
  const result = useMemo(
    () =>
      parseImportDraft(
        draft,
        topics,
        state?.questions.filter((q) => q.courseId === courseId),
      ),
    [courseId, draft, state?.questions, topics],
  );

  if (!state) {
    return (
      <AppShell>
        <Loading />
      </AppShell>
    );
  }

  const course = state.courses.find((item) => item.id === courseId);
  if (!course) {
    return (
      <AppShell>
        <EmptyState
          icon={<AlertCircle className="h-6 w-6" />}
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

  const doImport = async (items: typeof result.items) => {
    const { questions, created } = await importQuestions(
      courseId,
      items.map((item) => ({
        topicName: item.topicName,
        text: item.text,
        choices: item.choices,
        correctIndices: item.correctIndices,
        answer: item.answer,
        explanation: item.explanation,
      })),
    );
    toast.success(
      `Imported ${questions.length} questions${created.length ? `, created ${created.length} topics` : ""}`,
    );
    navigate({ to: "/courses/$courseId", params: { courseId } });
  };

  return (
    <AppShell
      crumbs={[
        { label: "Courses", to: "/" },
        { label: course.name, to: "/courses/$courseId", params: { courseId } },
        { label: "Import" },
      ]}
    >
      <h1 className="text-3xl font-semibold">Import questions</h1>
      <p className="mt-1 text-muted-foreground">
        Into <strong className="text-foreground">{course.name}</strong>. Nothing is saved until you
        confirm.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <ImportSource
          draft={draft}
          topics={topics}
          onChange={(patch) => setDraft((current) => ({ ...current, ...patch }))}
        />
        <ImportPreview
          courseName={course.name}
          items={result.items}
          duplicateIndices={result.duplicateIndices}
          error={result.error}
          existingTopics={topics}
          onImport={doImport}
        />
      </div>
    </AppShell>
  );
}
