import { Link } from "@tanstack/react-router";
import {
  AlertCircle,
  Download,
  ExternalLink,
  FileArchive,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { EmptyState } from "@/components/empty-state";
import { Loading } from "@/components/loading";
import { Button } from "@/components/ui/button";
import { CourseSectionNav } from "@/features/courses/course-section-nav";
import { OldExamDialog } from "@/features/old-exams/old-exam-dialog";
import {
  createOldExam,
  deleteOldExam,
  readOldExam,
  updateOldExam,
  useAppState,
} from "@/lib/data/store";
import type { OldExam } from "@/lib/data/types";

function openBlob(blob: Blob, fileName: string, download: boolean) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = download ? fileName : "";
  link.target = download ? "_self" : "_blank";
  link.rel = "noopener noreferrer";
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

function fileSize(bytes: number) {
  return bytes < 1024 * 1024
    ? `${Math.ceil(bytes / 1024)} KiB`
    : `${(bytes / 1024 / 1024).toFixed(1)} MiB`;
}

export function CourseOldExamsPage({ courseId }: { courseId: string }) {
  const state = useAppState();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<OldExam | null>(null);
  const [deleting, setDeleting] = useState<OldExam | null>(null);
  const [opening, setOpening] = useState<string>();
  const course = state?.courses.find((item) => item.id === courseId);
  const exams = useMemo(
    () =>
      (state?.oldExams.filter((exam) => exam.courseId === courseId) ?? []).sort(
        (left, right) => (right.year ?? 0) - (left.year ?? 0) || right.updatedAt - left.updatedAt,
      ),
    [courseId, state],
  );

  if (!state)
    return (
      <AppShell>
        <Loading />
      </AppShell>
    );
  if (!course) {
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
  }

  const handleDocument = async (exam: OldExam, download: boolean) => {
    setOpening(exam.id);
    try {
      openBlob(await readOldExam(exam), exam.document.fileName, download);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The PDF could not be opened.");
    } finally {
      setOpening(undefined);
    }
  };

  return (
    <AppShell
      crumbs={[
        { label: "Courses", to: "/" },
        { label: course.name, to: "/courses/$courseId", params: { courseId } },
        { label: "Old exams" },
      ]}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold sm:text-4xl">Old exams</h1>
          <p className="mt-2 text-muted-foreground">
            Keep past papers organized with {course.name}.
          </p>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4" /> Add old exam
        </Button>
      </div>
      <CourseSectionNav courseId={courseId} active="old-exams" />

      {exams.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={<FileArchive className="h-6 w-6" />}
            title="No old exams yet"
            actions={
              <Button onClick={() => setCreating(true)}>
                <Plus className="h-4 w-4" /> Add your first exam
              </Button>
            }
          >
            Add a PDF and Studydeck will keep a managed copy in your private data folder.
          </EmptyState>
        </div>
      ) : (
        <ul className="mt-8 space-y-3">
          {exams.map((exam) => (
            <li
              key={exam.id}
              className="flex flex-col gap-4 rounded-xl border bg-card p-5 shadow-card sm:flex-row sm:items-center"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-semibold">{exam.title}</h2>
                  {exam.year && (
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium">
                      {exam.year}
                    </span>
                  )}
                </div>
                {exam.description && (
                  <p className="mt-1 text-sm text-muted-foreground">{exam.description}</p>
                )}
                <p className="mt-2 truncate text-xs text-muted-foreground">
                  {exam.document.fileName} · {fileSize(exam.document.size)}
                </p>
              </div>
              <div className="flex flex-wrap gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={opening === exam.id}
                  onClick={() => void handleDocument(exam, false)}
                >
                  <ExternalLink className="h-4 w-4" /> View
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Download ${exam.title}`}
                  disabled={opening === exam.id}
                  onClick={() => void handleDocument(exam, true)}
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Edit ${exam.title}`}
                  onClick={() => setEditing(exam)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Delete ${exam.title}`}
                  onClick={() => setDeleting(exam)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <OldExamDialog
        open={creating}
        onOpenChange={setCreating}
        onSubmit={async (input, file) => {
          if (!file) return;
          await createOldExam(courseId, input, file);
          setCreating(false);
          toast.success("Old exam added.");
        }}
      />
      <OldExamDialog
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
        initial={editing ?? undefined}
        onSubmit={async (input) => {
          if (!editing) return;
          await updateOldExam(editing.id, input);
          setEditing(null);
          toast.success("Old exam updated.");
        }}
      />
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={`Delete “${deleting?.title}”?`}
        description="The managed PDF and its metadata will be permanently removed."
        onConfirm={async () => {
          if (!deleting) return;
          await deleteOldExam(deleting.id);
          setDeleting(null);
          toast.success("Old exam deleted.");
        }}
      />
    </AppShell>
  );
}
