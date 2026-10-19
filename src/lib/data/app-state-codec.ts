import {
  combineCatalogs,
  parseCourseFile,
  serializeCourseFile,
  type CourseFileEntry,
} from "./catalog";
import type { AppState, Attempt } from "./types";

export const PROGRESS_FILE = "progress.json";
const PROGRESS_SCHEMA_VERSION = 1 as const;
export const EMPTY_PROGRESS = `${JSON.stringify(
  { schemaVersion: PROGRESS_SCHEMA_VERSION, attempts: [] },
  null,
  2,
)}\n`;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function invalid(message: string): never {
  throw new Error(`Invalid study data: ${message}`);
}

export function parseProgress(raw: string): Attempt[] {
  let value: unknown;
  try {
    value = JSON.parse(raw) as unknown;
  } catch {
    return invalid(`${PROGRESS_FILE} is not valid JSON.`);
  }
  if (!isRecord(value) || value.schemaVersion !== PROGRESS_SCHEMA_VERSION) {
    return invalid(`${PROGRESS_FILE} must use schemaVersion ${PROGRESS_SCHEMA_VERSION}.`);
  }
  if (!Array.isArray(value.attempts)) {
    return invalid(`${PROGRESS_FILE}: attempts must be an array.`);
  }

  const ids = new Set<string>();
  return value.attempts.map((attempt, index) => {
    if (!isRecord(attempt)) {
      return invalid(`${PROGRESS_FILE}: attempts[${index}] must be an object.`);
    }
    const { id, questionId, correct, mode, at } = attempt;
    if (typeof id !== "string" || !id.trim()) {
      return invalid(`${PROGRESS_FILE}: attempt.id is required.`);
    }
    if (ids.has(id)) return invalid(`${PROGRESS_FILE}: attempt IDs must be unique.`);
    ids.add(id);
    if (typeof questionId !== "string" || !questionId.trim()) {
      return invalid(`${PROGRESS_FILE}: attempt.questionId is required.`);
    }
    if (typeof correct !== "boolean") {
      return invalid(`${PROGRESS_FILE}: attempt.correct must be boolean.`);
    }
    if (mode !== "mc" && mode !== "typed") {
      return invalid(`${PROGRESS_FILE}: attempt.mode is invalid.`);
    }
    if (typeof at !== "number" || !Number.isFinite(at)) {
      return invalid(`${PROGRESS_FILE}: attempt.at must be a number.`);
    }
    return { id, questionId, correct, mode, at };
  });
}

export function serializeProgress(attempts: Attempt[]): string {
  return `${JSON.stringify({ schemaVersion: PROGRESS_SCHEMA_VERSION, attempts }, null, 2)}\n`;
}

export function validateAppState(value: unknown): AppState {
  if (!isRecord(value) || value.version !== 2) {
    return invalid("application state must use version 2.");
  }
  if (
    !Array.isArray(value.courses) ||
    !Array.isArray(value.topics) ||
    !Array.isArray(value.questions)
  ) {
    return invalid("courses, topics, and questions must be arrays.");
  }
  if (!Array.isArray(value.attempts)) return invalid("attempts must be an array.");

  const candidate = value as unknown as AppState;
  const entries: CourseFileEntry[] = candidate.courses.map((course, index) => ({
    id: typeof course?.id === "string" ? course.id : `invalid-${index}`,
    file: `courses/course-${index}.json`,
  }));
  const parts = entries.map((entry) =>
    parseCourseFile(serializeCourseFile(candidate, entry.id), entry),
  );
  const catalog = combineCatalogs(parts);
  if (
    catalog.courses.length !== candidate.courses.length ||
    catalog.topics.length !== candidate.topics.length ||
    catalog.questions.length !== candidate.questions.length
  ) {
    return invalid("every topic and question must belong to a saved course.");
  }

  const attempts = parseProgress(serializeProgress(candidate.attempts));
  const questionIds = new Set(catalog.questions.map((question) => question.id));
  if (attempts.some((attempt) => !questionIds.has(attempt.questionId))) {
    return invalid("every attempt must reference an existing question.");
  }
  return { version: 2, ...catalog, attempts };
}
