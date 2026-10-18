/**
 * Local data layer. All reads/writes go through this module so it can be
 * swapped for a backend later. Persists to localStorage.
 */
import { useSyncExternalStore } from "react";
import { MAX_ANSWER_CHOICES } from "./types";
import type {
  AppState,
  Attempt,
  Course,
  ID,
  Question,
  QuestionInput,
  StudyMode,
  Topic,
} from "./types";
import { buildDemoState } from "./demo";

const KEY = "studydeck:v1";
const EMPTY: AppState = { version: 2, courses: [], topics: [], questions: [], attempts: [] };

let state: AppState = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

export const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = localStorage.getItem(KEY);
    state = raw ? migrateState(JSON.parse(raw) as LegacyAppState) : buildDemoState();
    persist();
  } catch {
    state = buildDemoState();
  }
}

type LegacyQuestion = Omit<Question, "correctIndices"> & {
  correctIndices?: number[];
  correctIndex?: number;
};

type LegacyAppState = Omit<AppState, "version" | "questions"> & {
  version?: number;
  questions: LegacyQuestion[];
};

function migrateState(saved: LegacyAppState): AppState {
  return {
    ...saved,
    version: 2,
    questions: saved.questions.map((question) => {
      const { correctIndex, ...current } = question;
      const correctIndices = Array.isArray(question.correctIndices)
        ? question.correctIndices
        : typeof correctIndex === "number"
          ? [correctIndex]
          : [];
      return { ...current, correctIndices };
    }),
  };
}

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* quota — ignore */
  }
}

function set(next: AppState) {
  state = next;
  persist();
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

const SERVER: AppState & { __server?: true } = { ...EMPTY, __server: true };

/** Returns null until the browser store has loaded (avoids hydration mismatch). */
export function useAppState(): AppState | null {
  const s = useSyncExternalStore(
    subscribe,
    () => {
      load();
      return state;
    },
    () => SERVER,
  );
  return (s as typeof SERVER).__server ? null : s;
}

export const getState = () => {
  load();
  return state;
};

// ---------- Courses ----------
export function createCourse(name: string, description?: string): Course {
  const c: Course = {
    id: uid(),
    name: name.trim(),
    description: description?.trim() || undefined,
    createdAt: Date.now(),
  };
  set({ ...getState(), courses: [...state.courses, c] });
  return c;
}
export function updateCourse(id: ID, patch: Partial<Pick<Course, "name" | "description">>) {
  set({ ...getState(), courses: state.courses.map((c) => (c.id === id ? { ...c, ...patch } : c)) });
}
export function deleteCourse(id: ID) {
  const s = getState();
  const qIds = new Set(s.questions.filter((q) => q.courseId === id).map((q) => q.id));
  set({
    ...s,
    courses: s.courses.filter((c) => c.id !== id),
    topics: s.topics.filter((t) => t.courseId !== id),
    questions: s.questions.filter((q) => q.courseId !== id),
    attempts: s.attempts.filter((a) => !qIds.has(a.questionId)),
  });
}

// ---------- Topics ----------
export function createTopic(courseId: ID, name: string): Topic {
  const t: Topic = { id: uid(), courseId, name: name.trim(), createdAt: Date.now() };
  set({ ...getState(), topics: [...state.topics, t] });
  return t;
}
export function renameTopic(id: ID, name: string) {
  set({
    ...getState(),
    topics: state.topics.map((t) => (t.id === id ? { ...t, name: name.trim() } : t)),
  });
}
export function deleteTopic(id: ID) {
  const s = getState();
  const qIds = new Set(s.questions.filter((q) => q.topicId === id).map((q) => q.id));
  set({
    ...s,
    topics: s.topics.filter((t) => t.id !== id),
    questions: s.questions.filter((q) => q.topicId !== id),
    attempts: s.attempts.filter((a) => !qIds.has(a.questionId)),
  });
}

// ---------- Questions ----------
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
export function addQuestions(inputs: QuestionInput[]) {
  const now = Date.now();
  const qs: Question[] = inputs.map((i, n) => ({
    ...normalizeQuestion(i),
    id: uid(),
    createdAt: now + n,
  }));
  set({ ...getState(), questions: [...state.questions, ...qs] });
  return qs;
}
export function updateQuestion(id: ID, input: QuestionInput) {
  set({
    ...getState(),
    questions: state.questions.map((q) =>
      q.id === id ? { ...q, ...normalizeQuestion(input) } : q,
    ),
  });
}
export function deleteQuestion(id: ID) {
  const s = getState();
  set({
    ...s,
    questions: s.questions.filter((q) => q.id !== id),
    attempts: s.attempts.filter((a) => a.questionId !== id),
  });
}

/** Import helper: creates any missing topics by name, then adds questions. */
export function importQuestions(
  courseId: ID,
  items: (Omit<QuestionInput, "courseId" | "topicId"> & { topicName: string })[],
) {
  const s = getState();
  const topics = [...s.topics];
  const byName = new Map(
    topics.filter((t) => t.courseId === courseId).map((t) => [t.name.toLowerCase(), t]),
  );
  const created: Topic[] = [];
  const now = Date.now();
  const questions: Question[] = items.map((it, n) => {
    const key = it.topicName.trim().toLowerCase();
    let t = byName.get(key);
    if (!t) {
      t = { id: uid(), courseId, name: it.topicName.trim(), createdAt: now };
      byName.set(key, t);
      created.push(t);
    }
    const { topicName: _t, ...rest } = it;
    return {
      ...normalizeQuestion({ ...rest, courseId, topicId: t.id }),
      id: uid(),
      createdAt: now + n,
    };
  });
  set({ ...s, topics: [...topics, ...created], questions: [...s.questions, ...questions] });
  return { questions, created };
}

// ---------- Attempts ----------
export function recordAttempt(questionId: ID, correct: boolean, mode: StudyMode) {
  const a: Attempt = { id: uid(), questionId, correct, mode, at: Date.now() };
  set({ ...getState(), attempts: [...state.attempts, a] });
}

// ---------- Demo ----------
export function hasDemo() {
  return getState().courses.some((c) => c.demo);
}
export function removeDemo() {
  const s = getState();
  const demoQ = new Set(s.questions.filter((q) => q.demo).map((q) => q.id));
  const demoCourses = new Set(s.courses.filter((c) => c.demo).map((c) => c.id));
  set({
    ...s,
    courses: s.courses.filter((c) => !c.demo),
    topics: s.topics.filter((t) => !t.demo && !demoCourses.has(t.courseId)),
    questions: s.questions.filter((q) => !q.demo && !demoCourses.has(q.courseId)),
    attempts: s.attempts.filter((a) => !demoQ.has(a.questionId)),
  });
}
export function restoreDemo() {
  removeDemo();
  const d = buildDemoState();
  const s = getState();
  set({
    ...s,
    courses: [...d.courses, ...s.courses],
    topics: [...d.topics, ...s.topics],
    questions: [...d.questions, ...s.questions],
    attempts: [...d.attempts, ...s.attempts],
  });
}
