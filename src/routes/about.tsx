import { createFileRoute } from "@tanstack/react-router";

import { AboutPage } from "@/pages/about-page";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Studydeck" },
      { name: "description", content: "Learn why Studydeck is a local-first study hub." },
    ],
  }),
  component: AboutPage,
});
