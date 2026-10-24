import { MAX_ANSWER_CHOICES } from "../types";
import type { ID, Question, QuestionInput, Topic } from "../types";
import { transact, uid } from "./state";

export function normalizeQuestion(input: QuestionInput): Omit<Question, "id" | "createdAt"> {
  const selected = new Set(input.correctIndices);
  const correctIndices: number[] = [];
  const choices: string[] = [];
  input.choices.forEach((choice, originalIndex) => {
    const trimmed = choice.trim();
    if (!trimmed) return;
    if (selected.has(originalIndex)) correctIndices.push(choices.length);
    choices.push(trimmed);
  });
  if (choices.length > MAX_ANSWER_CHOICES) {
    throw new Error(`Questions can have at most ${MAX_ANSWER_CHOICES} answer choices.`);
  }
  const hasChoices = choices.length > 0;
  return {
    ...input,
    text: input.text.trim(),
    choices,
    correctIndices: hasChoices ? correctIndices : [],
    answer: hasChoices
      ? correctIndices.map((index) => choices[index]).join("; ")
      : (input.answer ?? "").trim(),
    explanation: input.explanation?.trim() || undefined,
  };
}

export function addQuestions(inputs: QuestionInput[]): Promise<Question[]> {
  return transact((current) => {
    const now = Date.now();
    const questions: Question[] = inputs.map((input, index) => ({
      ...normalizeQuestion(input),
      id: uid(),
      createdAt: now + index,
    }));
    return {
      next: { ...current, questions: [...current.questions, ...questions] },
      result: questions,
    };
  });
}

export function updateQuestion(id: ID, input: QuestionInput): Promise<void> {
  return transact((current) => ({
    next: {
      ...current,
      questions: current.questions.map((question) =>
        question.id === id ? { ...question, ...normalizeQuestion(input) } : question,
      ),
    },
    result: undefined,
  }));
}

export function togglePinned(id: ID, pinned: boolean): Promise<void> {
  return transact((current) => ({
    next: {
      ...current,
      questions: current.questions.map((question) =>
        question.id === id ? { ...question, pinned } : question,
      ),
    },
    result: undefined,
  }));
}

export function deleteQuestion(id: ID): Promise<void> {
  return transact((current) => ({
    next: {
      ...current,
      questions: current.questions.filter((question) => question.id !== id),
      attempts: current.attempts.filter((attempt) => attempt.questionId !== id),
    },
    result: undefined,
  }));
}

/** Import helper: creates missing topics by name, then saves the complete batch once. */
export function importQuestions(
  courseId: ID,
  items: (Omit<QuestionInput, "courseId" | "topicId"> & { topicName: string })[],
): Promise<{ questions: Question[]; created: Topic[] }> {
  return transact((current) => {
    const topics = [...current.topics];
    const byName = new Map(
      topics
        .filter((topic) => topic.courseId === courseId)
        .map((topic) => [topic.name.toLowerCase(), topic]),
    );
    const created: Topic[] = [];
    const now = Date.now();
    const questions: Question[] = items.map((item, index) => {
      const key = item.topicName.trim().toLowerCase();
      let topic = byName.get(key);
      if (!topic) {
        topic = { id: uid(), courseId, name: item.topicName.trim(), createdAt: now };
        byName.set(key, topic);
        created.push(topic);
      }
      const { topicName: _topicName, ...input } = item;
      return {
        ...normalizeQuestion({ ...input, courseId, topicId: topic.id }),
        id: uid(),
        createdAt: now + index,
      };
    });
    return {
      next: {
        ...current,
        topics: [...topics, ...created],
        questions: [...current.questions, ...questions],
      },
      result: { questions, created },
    };
  });
}
