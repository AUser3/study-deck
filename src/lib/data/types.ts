export type ID = string;
export const MAX_ANSWER_CHOICES = 16;
export const APP_STATE_VERSION = 3 as const;

export interface Course {
  id: ID;
  name: string;
  description?: string;
  createdAt: number;
}

export interface Topic {
  id: ID;
  courseId: ID;
  name: string;
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

export interface StudyNote {
  id: ID;
  courseId: ID;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

export interface AppState {
  version: typeof APP_STATE_VERSION;
  courses: Course[];
  topics: Topic[];
  questions: Question[];
  attempts: Attempt[];
  notes: StudyNote[];
}

export type QuestionInput = Omit<Question, "id" | "createdAt" | "answer"> & { answer?: string };
