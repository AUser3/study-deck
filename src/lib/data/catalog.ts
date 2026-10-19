import { MAX_ANSWER_CHOICES } from "./types";
import type { Course, Question, StudyNote, Topic } from "./types";

export const MANIFEST_SCHEMA_VERSION = 1 as const;
export const COURSE_SCHEMA_VERSION = 2 as const;

export interface Catalog {
  courses: Course[];
  topics: Topic[];
  questions: Question[];
  notes: StudyNote[];
}

export interface CourseFileEntry {
  id: string;
  file: string;
}

export interface CatalogManifest {
  schemaVersion: typeof MANIFEST_SCHEMA_VERSION;
  courses: CourseFileEntry[];
}

interface CourseFile {
  schemaVersion: typeof COURSE_SCHEMA_VERSION;
  course: Course;
  topics: Omit<Topic, "courseId">[];
  questions: Omit<Question, "courseId">[];
  notes: Omit<StudyNote, "courseId">[];
}

export const EMPTY_CATALOG: Catalog = { courses: [], topics: [], questions: [], notes: [] };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

function fail(message: string): never {
  throw new Error(`Invalid study data: ${message}`);
}

function stringValue(value: unknown, field: string): string {
  if (typeof value !== "string" || !value.trim()) fail(`${field} must be a non-empty string.`);
  return value;
}

function numberValue(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) fail(`${field} must be a number.`);
  return value;
}

function optionalString(value: unknown, field: string): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "string") fail(`${field} must be a string.`);
  return value || undefined;
}

function parseJson(raw: string, file: string): unknown {
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return fail(`${file} is not valid JSON.`);
  }
}

function parseCourse(value: unknown, file: string): Course {
  if (!isRecord(value)) fail(`${file}: course must be an object.`);
  return {
    id: stringValue(value.id, `${file}: course.id`),
    name: stringValue(value.name, `${file}: course.name`),
    description: optionalString(value.description, `${file}: course.description`),
    createdAt: numberValue(value.createdAt, `${file}: course.createdAt`),
  };
}

function parseTopic(value: unknown, courseId: string, file: string): Topic {
  if (!isRecord(value)) fail(`${file}: every topic must be an object.`);
  return {
    id: stringValue(value.id, `${file}: topic.id`),
    courseId,
    name: stringValue(value.name, `${file}: topic.name`),
    createdAt: numberValue(value.createdAt, `${file}: topic.createdAt`),
  };
}

function parseQuestion(
  value: unknown,
  courseId: string,
  topicIds: Set<string>,
  file: string,
): Question {
  if (!isRecord(value)) fail(`${file}: every question must be an object.`);
  const choices = value.choices;
  const correctIndices = value.correctIndices;
  if (!Array.isArray(choices) || !choices.every((choice) => typeof choice === "string")) {
    fail(`${file}: question.choices must be an array of strings.`);
  }
  if (choices.length > MAX_ANSWER_CHOICES) {
    fail(`${file}: a question has more than ${MAX_ANSWER_CHOICES} choices.`);
  }
  if (
    !Array.isArray(correctIndices) ||
    !correctIndices.every((index) => Number.isInteger(index)) ||
    new Set(correctIndices).size !== correctIndices.length ||
    correctIndices.some((index) => index < 0 || index >= choices.length)
  ) {
    fail(`${file}: question.correctIndices contains invalid choice indices.`);
  }
  if (choices.length > 0 && correctIndices.length === 0) {
    fail(`${file}: a choice question needs at least one correct answer.`);
  }

  const answer = stringValue(value.answer, `${file}: question.answer`);
  if (choices.length > 0 && answer !== correctIndices.map((index) => choices[index]).join("; ")) {
    fail(`${file}: question.answer must match the selected correct choices.`);
  }

  const topicId = stringValue(value.topicId, `${file}: question.topicId`);
  if (!topicIds.has(topicId)) fail(`${file}: question references an unknown topic.`);

  return {
    id: stringValue(value.id, `${file}: question.id`),
    courseId,
    topicId,
    text: stringValue(value.text, `${file}: question.text`),
    choices,
    correctIndices,
    answer,
    explanation: optionalString(value.explanation, `${file}: question.explanation`),
    createdAt: numberValue(value.createdAt, `${file}: question.createdAt`),
  };
}

function parseNote(value: unknown, courseId: string, file: string): StudyNote {
  if (!isRecord(value)) fail(`${file}: every note must be an object.`);
  return {
    id: stringValue(value.id, `${file}: note.id`),
    courseId,
    title: stringValue(value.title, `${file}: note.title`),
    content:
      typeof value.content === "string"
        ? value.content
        : fail(`${file}: note.content must be a string.`),
    createdAt: numberValue(value.createdAt, `${file}: note.createdAt`),
    updatedAt: numberValue(value.updatedAt, `${file}: note.updatedAt`),
  };
}

export function parseManifest(raw: string): CatalogManifest {
  const value = parseJson(raw, "manifest.json");
  if (!isRecord(value) || value.schemaVersion !== MANIFEST_SCHEMA_VERSION) {
    fail(`manifest.json must use schemaVersion ${MANIFEST_SCHEMA_VERSION}.`);
  }
  if (!Array.isArray(value.courses)) fail("manifest.json: courses must be an array.");

  const seenIds = new Set<string>();
  const seenFiles = new Set<string>();
  const courses = value.courses.map((entry, index) => {
    if (!isRecord(entry)) fail(`manifest.json: courses[${index}] must be an object.`);
    const id = stringValue(entry.id, `manifest.json: courses[${index}].id`);
    const file = stringValue(entry.file, `manifest.json: courses[${index}].file`);
    if (!/^courses\/[a-z0-9][a-z0-9-]*\.json$/.test(file)) {
      fail(`manifest.json: ${file} is not a safe course file path.`);
    }
    if (seenIds.has(id) || seenFiles.has(file)) fail("manifest.json contains duplicate courses.");
    seenIds.add(id);
    seenFiles.add(file);
    return { id, file };
  });

  return { schemaVersion: MANIFEST_SCHEMA_VERSION, courses };
}

export function serializeManifest(entries: CourseFileEntry[]): string {
  return `${JSON.stringify({ schemaVersion: MANIFEST_SCHEMA_VERSION, courses: entries }, null, 2)}\n`;
}

export function parseCourseFile(raw: string, entry: CourseFileEntry): Catalog {
  const value = parseJson(raw, entry.file);
  if (
    !isRecord(value) ||
    (value.schemaVersion !== 1 && value.schemaVersion !== COURSE_SCHEMA_VERSION)
  ) {
    fail(`${entry.file} must use a supported schemaVersion.`);
  }
  const course = parseCourse(value.course, entry.file);
  if (course.id !== entry.id) fail(`${entry.file}: course.id does not match manifest.json.`);
  if (!Array.isArray(value.topics)) fail(`${entry.file}: topics must be an array.`);
  if (!Array.isArray(value.questions)) fail(`${entry.file}: questions must be an array.`);
  if (value.schemaVersion === COURSE_SCHEMA_VERSION && !Array.isArray(value.notes)) {
    fail(`${entry.file}: notes must be an array.`);
  }

  const topics = value.topics.map((topic) => parseTopic(topic, course.id, entry.file));
  const topicIds = new Set(topics.map((topic) => topic.id));
  if (topicIds.size !== topics.length) fail(`${entry.file}: topic IDs must be unique.`);
  const questions = value.questions.map((question) =>
    parseQuestion(question, course.id, topicIds, entry.file),
  );
  if (new Set(questions.map((question) => question.id)).size !== questions.length) {
    fail(`${entry.file}: question IDs must be unique.`);
  }
  const noteValues: unknown[] = Array.isArray(value.notes) ? value.notes : [];
  const notes = noteValues.map((note) => parseNote(note, course.id, entry.file));
  if (new Set(notes.map((note) => note.id)).size !== notes.length) {
    fail(`${entry.file}: note IDs must be unique.`);
  }
  return { courses: [course], topics, questions, notes };
}

export function serializeCourseFile(catalog: Catalog, courseId: string): string {
  const course = catalog.courses.find((item) => item.id === courseId);
  if (!course) throw new Error(`Cannot save missing course ${courseId}.`);

  const topics = catalog.topics
    .filter((topic) => topic.courseId === courseId)
    .map(({ courseId: _courseId, ...topic }) => topic);
  const topicIds = new Set(topics.map((topic) => topic.id));
  const questions = catalog.questions
    .filter((question) => question.courseId === courseId && topicIds.has(question.topicId))
    .map(({ courseId: _courseId, ...question }) => question);
  const notes = catalog.notes
    .filter((note) => note.courseId === courseId)
    .map(({ courseId: _courseId, ...note }) => note);
  const file: CourseFile = {
    schemaVersion: COURSE_SCHEMA_VERSION,
    course,
    topics,
    questions,
    notes,
  };
  return `${JSON.stringify(file, null, 2)}\n`;
}

export function combineCatalogs(parts: Catalog[]): Catalog {
  const catalog = parts.reduce<Catalog>(
    (combined, part) => ({
      courses: [...combined.courses, ...part.courses],
      topics: [...combined.topics, ...part.topics],
      questions: [...combined.questions, ...part.questions],
      notes: [...combined.notes, ...part.notes],
    }),
    { ...EMPTY_CATALOG },
  );
  if (new Set(catalog.courses.map((course) => course.id)).size !== catalog.courses.length) {
    fail("course IDs must be unique across all files.");
  }
  if (new Set(catalog.topics.map((topic) => topic.id)).size !== catalog.topics.length) {
    fail("topic IDs must be unique across all files.");
  }
  if (new Set(catalog.questions.map((question) => question.id)).size !== catalog.questions.length) {
    fail("question IDs must be unique across all files.");
  }
  if (new Set(catalog.notes.map((note) => note.id)).size !== catalog.notes.length) {
    fail("note IDs must be unique across all files.");
  }
  return catalog;
}
