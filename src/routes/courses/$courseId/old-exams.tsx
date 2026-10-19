import { createFileRoute } from "@tanstack/react-router";

import { CourseOldExamsPage } from "@/pages/course-old-exams-page";

export const Route = createFileRoute("/courses/$courseId/old-exams")({
  head: () => ({
    meta: [
      { title: "Old exams — Studydeck" },
      { name: "description", content: "Organize and view old exam PDFs for a Studydeck course." },
    ],
  }),
  component: OldExamsRoute,
});

function OldExamsRoute() {
  const { courseId } = Route.useParams();
  return <CourseOldExamsPage courseId={courseId} />;
}
