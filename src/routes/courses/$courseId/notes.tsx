import { createFileRoute } from "@tanstack/react-router";

import { CourseNotesPage } from "@/pages/course-notes-page";

export const Route = createFileRoute("/courses/$courseId/notes")({
  head: () => ({
    meta: [
      { title: "Course notes — Studydeck" },
      { name: "description", content: "Write and organize notes for a Studydeck course." },
    ],
  }),
  component: NotesRoute,
});

function NotesRoute() {
  const { courseId } = Route.useParams();
  return <CourseNotesPage courseId={courseId} />;
}
