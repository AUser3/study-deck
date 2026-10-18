import { createFileRoute } from "@tanstack/react-router";

import { QuestionImportPage } from "@/features/questions/question-import-page";

export const Route = createFileRoute("/courses/$courseId_/import")({
  validateSearch: (search: Record<string, unknown>): { topic?: string } => ({
    topic: typeof search.topic === "string" ? search.topic : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Import questions — Studydeck" },
      {
        name: "description",
        content: "Paste formatted text or upload JSON to add many questions at once.",
      },
      { property: "og:title", content: "Import questions — Studydeck" },
      {
        property: "og:description",
        content: "Paste formatted text or upload JSON to add many questions at once.",
      },
    ],
  }),
  component: ImportRoute,
});

function ImportRoute() {
  const { courseId } = Route.useParams();
  const { topic } = Route.useSearch();
  return <QuestionImportPage courseId={courseId} initialTopicId={topic} />;
}
