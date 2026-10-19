import { createFileRoute } from "@tanstack/react-router";

import { TopicQuestionsPage } from "@/pages/topic-questions-page";

export const Route = createFileRoute("/courses/$courseId/topics/$topicId")({
  head: () => ({
    meta: [
      { title: "Question bank — Studydeck" },
      { name: "description", content: "Browse, search, add and edit the questions in this topic." },
      { property: "og:title", content: "Question bank — Studydeck" },
      {
        property: "og:description",
        content: "Browse, search, add and edit the questions in this topic.",
      },
    ],
  }),
  component: TopicRoute,
});

function TopicRoute() {
  const { courseId, topicId } = Route.useParams();
  return <TopicQuestionsPage courseId={courseId} topicId={topicId} />;
}
