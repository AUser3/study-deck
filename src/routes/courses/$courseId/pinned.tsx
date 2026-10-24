import { createFileRoute } from "@tanstack/react-router";

import { CoursePinnedPage } from "@/pages/course-pinned-page";

export const Route = createFileRoute("/courses/$courseId/pinned")({
  head: () => ({
    meta: [
      { title: "Pinned questions — Studydeck" },
      { name: "description", content: "Review questions pinned while studying." },
    ],
  }),
  component: PinnedRoute,
});

function PinnedRoute() {
  const { courseId } = Route.useParams();
  return <CoursePinnedPage courseId={courseId} />;
}
