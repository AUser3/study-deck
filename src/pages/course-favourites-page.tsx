import { CoursePage } from "./course-page";

export function CourseFavouritesPage({ courseId }: { courseId: string }) {
  return <CoursePage courseId={courseId} favoriteOnly />;
}
