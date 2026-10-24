import { createFileRoute } from "@tanstack/react-router";

import { CourseFavouritesPage } from "@/pages/course-favourites-page";

export const Route = createFileRoute("/courses/$courseId/favourites")({
  head: () => ({
    meta: [
      { title: "Favourites — Studydeck" },
      { name: "description", content: "Review your favourite study questions." },
    ],
  }),
  component: FavouritesRoute,
});

function FavouritesRoute() {
  const { courseId } = Route.useParams();
  return <CourseFavouritesPage courseId={courseId} />;
}
