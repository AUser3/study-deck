import { createFileRoute } from "@tanstack/react-router";

import { DashboardPage } from "@/pages/dashboard-page";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Your courses — Studydeck" },
      {
        name: "description",
        content: "Your flashcard courses, daily study stats and mastery at a glance.",
      },
      { property: "og:title", content: "Your courses — Studydeck" },
      {
        property: "og:description",
        content: "Your flashcard courses, daily study stats and mastery at a glance.",
      },
    ],
  }),
  component: DashboardPage,
});
