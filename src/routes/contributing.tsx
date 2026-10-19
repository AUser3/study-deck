import { createFileRoute } from "@tanstack/react-router";

import { ContributingPage } from "@/pages/contributing-page";

export const Route = createFileRoute("/contributing")({
  head: () => ({
    meta: [
      { title: "Contributing — Studydeck" },
      { name: "description", content: "How to contribute focused, tested changes to Studydeck." },
    ],
  }),
  component: ContributingPage,
});
