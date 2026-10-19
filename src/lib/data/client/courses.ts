import type { Course, ID } from "../types";
import { transact, uid } from "./state";

export function createCourse(name: string, description?: string): Promise<Course> {
  return transact((current) => {
    const course: Course = {
      id: uid(),
      name: name.trim(),
      description: description?.trim() || undefined,
      createdAt: Date.now(),
    };
    return { next: { ...current, courses: [...current.courses, course] }, result: course };
  });
}

export function updateCourse(
  id: ID,
  patch: Partial<Pick<Course, "name" | "description">>,
): Promise<void> {
  return transact((current) => ({
    next: {
      ...current,
      courses: current.courses.map((course) =>
        course.id === id ? { ...course, ...patch } : course,
      ),
    },
    result: undefined,
  }));
}

export function deleteCourse(id: ID): Promise<void> {
  return transact((current) => {
    const questionIds = new Set(
      current.questions
        .filter((question) => question.courseId === id)
        .map((question) => question.id),
    );
    return {
      next: {
        ...current,
        courses: current.courses.filter((course) => course.id !== id),
        topics: current.topics.filter((topic) => topic.courseId !== id),
        questions: current.questions.filter((question) => question.courseId !== id),
        notes: current.notes.filter((note) => note.courseId !== id),
        attempts: current.attempts.filter((attempt) => !questionIds.has(attempt.questionId)),
      },
      result: undefined,
    };
  });
}
