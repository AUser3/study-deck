import { createFileRoute } from "@tanstack/react-router";

import { FaqPage } from "@/pages/faq-page";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "FAQ — Studydeck" },
      { name: "description", content: "Answers about Studydeck data, backups, and study tools." },
    ],
  }),
  component: FaqPage,
});
