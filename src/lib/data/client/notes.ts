import type { ID, StudyNote } from "../types";
import { transact, uid } from "./state";

export function createNote(courseId: ID, title: string, content: string): Promise<StudyNote> {
  return transact((current) => {
    const now = Date.now();
    const note: StudyNote = {
      id: uid(),
      courseId,
      title: title.trim(),
      content,
      createdAt: now,
      updatedAt: now,
    };
    return { next: { ...current, notes: [...current.notes, note] }, result: note };
  });
}

export function updateNote(id: ID, patch: Pick<StudyNote, "title" | "content">): Promise<void> {
  return transact((current) => ({
    next: {
      ...current,
      notes: current.notes.map((note) =>
        note.id === id
          ? { ...note, title: patch.title.trim(), content: patch.content, updatedAt: Date.now() }
          : note,
      ),
    },
    result: undefined,
  }));
}

export function deleteNote(id: ID): Promise<void> {
  return transact((current) => ({
    next: { ...current, notes: current.notes.filter((note) => note.id !== id) },
    result: undefined,
  }));
}
