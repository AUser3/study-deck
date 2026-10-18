export type ID = string;
export const MAX_ANSWER_CHOICES = 16;

export interface Course {
  id: ID;
  name: string;
  description?: string;
  demo?: boolean;
  createdAt: number;
}

export interface Topic {
  id: ID;
  courseId: ID;
  name: string;
  demo?: boolean;
  createdAt: number;
}

export interface Question {
  id: ID;
  courseId: ID;
  topicId: ID;
  text: string;
  /** Answer choices (0 = typed-answer only, otherwise 1–16). */
  choices: string[];
  /** Indices into choices; at least one is required when choices exist. */
  correctIndices: number[];
  /** Expected answer. For choice questions this lists all correct choices. */
  answer: string;
  explanation?: string;
  demo?: boolean;
  createdAt: number;
}

export type StudyMode = "mc" | "typed";

export interface Attempt {
  id: ID;
  questionId: ID;
  correct: boolean;
  mode: StudyMode;
  at: number;
}

export interface AppState {
  version: 2;
  courses: Course[];
  topics: Topic[];
  questions: Question[];
  attempts: Attempt[];
}

export type QuestionInput = Omit<Question, "id" | "createdAt" | "answer"> & { answer?: string };
