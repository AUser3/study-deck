import type { ID, Topic } from "../types";
import { transact, uid } from "./state";

export function createTopic(courseId: ID, name: string): Promise<Topic> {
  return transact((current) => {
    const topic: Topic = { id: uid(), courseId, name: name.trim(), createdAt: Date.now() };
    return { next: { ...current, topics: [...current.topics, topic] }, result: topic };
  });
}

export function renameTopic(id: ID, name: string): Promise<void> {
  return transact((current) => ({
    next: {
      ...current,
      topics: current.topics.map((topic) =>
        topic.id === id ? { ...topic, name: name.trim() } : topic,
      ),
    },
    result: undefined,
  }));
}

export function toggleTopicFavorite(id: ID, favorite: boolean): Promise<void> {
  return transact((current) => ({
    next: {
      ...current,
      topics: current.topics.map((topic) => (topic.id === id ? { ...topic, favorite } : topic)),
    },
    result: undefined,
  }));
}

export function deleteTopic(id: ID): Promise<void> {
  return transact((current) => {
    const questionIds = new Set(
      current.questions
        .filter((question) => question.topicId === id)
        .map((question) => question.id),
    );
    return {
      next: {
        ...current,
        topics: current.topics.filter((topic) => topic.id !== id),
        questions: current.questions.filter((question) => question.topicId !== id),
        attempts: current.attempts.filter((attempt) => !questionIds.has(attempt.questionId)),
      },
      result: undefined,
    };
  });
}
