import { Link } from "@tanstack/react-router";
import { AlertCircle, FileText, Pencil, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { EmptyState } from "@/components/empty-state";
import { Loading } from "@/components/loading";
import { Button } from "@/components/ui/button";
import { CourseSectionNav } from "@/features/courses/course-section-nav";
import { NoteDialog } from "@/features/notes/note-dialog";
import { createNote, deleteNote, updateNote, useAppState } from "@/lib/data/store";
import type { StudyNote } from "@/lib/data/types";

export function CourseNotesPage({ courseId }: { courseId: string }) {
  const state = useAppState();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<StudyNote | null>(null);
  const [deleting, setDeleting] = useState<StudyNote | null>(null);
  const notes = useMemo(
    () =>
      (state?.notes.filter((note) => note.courseId === courseId) ?? []).sort(
        (left, right) => right.updatedAt - left.updatedAt,
      ),
    [courseId, state],
  );
  const course = state?.courses.find((item) => item.id === courseId);

  if (!state) {
    return (
      <AppShell>
        <Loading />
      </AppShell>
    );
  }
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

  return (
    <AppShell
      crumbs={[
        { label: "Courses", to: "/" },
        { label: course.name, to: "/courses/$courseId", params: { courseId } },
        { label: "Notes" },
      ]}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold sm:text-4xl">Notes</h1>
          <p className="mt-2 text-muted-foreground">
            Keep summaries and study material with {course.name}.
          </p>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4" /> Create note
        </Button>
      </div>
      <CourseSectionNav courseId={courseId} active="notes" />

      {notes.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={<FileText className="h-6 w-6" />}
            title="No notes yet"
            actions={
              <Button onClick={() => setCreating(true)}>
                <Plus className="h-4 w-4" /> Create your first note
              </Button>
            }
          >
            Add lecture summaries, reminders, formulas, or Markdown-formatted study notes.
          </EmptyState>
        </div>
      ) : (
        <ul className="mt-8 grid gap-4 md:grid-cols-2">
          {notes.map((note) => (
            <li key={note.id} className="rounded-xl border bg-card p-5 shadow-card">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate text-lg font-semibold">{note.title}</h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Updated {new Date(note.updatedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex shrink-0">
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label={`Edit ${note.title}`}
                    onClick={() => setEditing(note)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label={`Delete ${note.title}`}
                    onClick={() => setDeleting(note)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <p className="mt-4 max-h-48 overflow-hidden whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                {note.content || "Empty note"}
              </p>
            </li>
          ))}
        </ul>
      )}

      <NoteDialog
        open={creating}
        onOpenChange={setCreating}
        onSubmit={async (title, content) => {
          await createNote(courseId, title, content);
          setCreating(false);
          toast.success("Note created.");
        }}
      />
      <NoteDialog
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
        initial={editing ?? undefined}
        onSubmit={async (title, content) => {
          if (!editing) return;
          await updateNote(editing.id, { title, content });
          setEditing(null);
          toast.success("Note saved.");
        }}
      />
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={`Delete “${deleting?.title}”?`}
        description="This note will be permanently removed."
        onConfirm={async () => {
          if (!deleting) return;
          await deleteNote(deleting.id);
          setDeleting(null);
          toast.success("Note deleted.");
        }}
      />
    </AppShell>
  );
}
