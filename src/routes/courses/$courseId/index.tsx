import { createFileRoute } from "@tanstack/react-router";

import { CoursePage } from "@/pages/course-page";

export const Route = createFileRoute("/courses/$courseId/")({
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
  component: CourseRoute,
});

function CourseRoute() {
  const { courseId } = Route.useParams();
  return <CoursePage courseId={courseId} />;
}
