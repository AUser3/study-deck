import { createFileRoute } from "@tanstack/react-router";

import { StudySession } from "@/features/study/study-session";
import type { StudyMode } from "@/lib/data/types";

interface StudySearch {
  course: string;
  topics: string;
  mode: StudyMode;
}

export const Route = createFileRoute("/study")({
  validateSearch: (s: Record<string, unknown>): StudySearch => ({
    course: String(s.course ?? ""),
    topics: String(s.topics ?? ""),
    mode: s.mode === "typed" ? "typed" : "mc",
  }),
  head: () => ({
    meta: [
      { title: "Study session — Studydeck" },
      { name: "description", content: "A focused flashcard study session." },
      { property: "og:title", content: "Study session — Studydeck" },
      { property: "og:description", content: "A focused flashcard study session." },
    ],
  }),
  component: StudyPage,
});

function StudyPage() {
  const { course: courseId, topics, mode } = Route.useSearch();
  return <StudySession courseId={courseId} topicIds={topics} mode={mode} />;
}
