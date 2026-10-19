import "@tanstack/react-start/server-only";

import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import { resolveAppDataDirectory } from "./app-data-location.server";
import { parseBackup, serializeBackup } from "./backup";
import {
  EMPTY_PROGRESS,
  parseProgress,
  PROGRESS_FILE,
  serializeProgress,
  validateAppState,
} from "./app-state-codec";
import {
  combineCatalogs,
  parseCourseFile,
  parseManifest,
  serializeCourseFile,
  serializeManifest,
  type Catalog,
  type CourseFileEntry,
} from "./catalog";
import { APP_STATE_VERSION } from "./types";
import type { AppState } from "./types";

const MANIFEST_FILE = "manifest.json";
const EMPTY_MANIFEST = serializeManifest([]);

function slug(value: string): string {
  return (
    value
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 48) || "course"
  );
}

function createEntry(catalog: Catalog, courseId: string, usedFiles: Set<string>): CourseFileEntry {
  const course = catalog.courses.find((item) => item.id === courseId);
  if (!course) throw new Error(`Cannot create a file for missing course ${courseId}.`);
  const idSuffix =
    course.id
      .replace(/[^a-zA-Z0-9]/g, "")
      .slice(0, 8)
      .toLowerCase() || "data";
  const base = `${slug(course.name)}-${idSuffix}`;
  let file = `courses/${base}.json`;
  let counter = 2;
  while (usedFiles.has(file)) file = `courses/${base}-${counter++}.json`;
  usedFiles.add(file);
  return { id: courseId, file };
}

export class AppDataRepository {
  private queue: Promise<void> = Promise.resolve();

  constructor(readonly directory: string) {}

  load(): Promise<AppState> {
    return this.exclusive(async () => {
      await this.ensureBaseFiles();
      return this.readState();
    });
  }

  save(value: unknown): Promise<AppState> {
    return this.exclusive(async () => {
      const next = validateAppState(value);
      await this.ensureBaseFiles();
      const previous = await this.readState();
      await this.writeState(next, previous);
      return next;
    });
  }

  createBackup(): Promise<string> {
    return this.exclusive(async () => {
      await this.ensureBaseFiles();
      return serializeBackup(await this.readState());
    });
  }

  restoreBackup(raw: string): Promise<AppState> {
    const backup = parseBackup(raw);
    return this.exclusive(async () => {
      await this.ensureBaseFiles();
      const previous = await this.readState();
      await this.writeState(backup.state, previous);
      return backup.state;
    });
  }

  private async writeState(next: AppState, previous: AppState): Promise<void> {
    const manifest = parseManifest(await this.read(MANIFEST_FILE));
    const oldEntries = manifest.courses;
    const oldById = new Map(oldEntries.map((entry) => [entry.id, entry]));
    const usedFiles = new Set(oldEntries.map((entry) => entry.file));
    const nextEntries = next.courses.map(
      (course) => oldById.get(course.id) ?? createEntry(next, course.id, usedFiles),
    );

    for (const entry of nextEntries) {
      const before = previous.courses.some((course) => course.id === entry.id)
        ? serializeCourseFile(previous, entry.id)
        : null;
      const after = serializeCourseFile(next, entry.id);
      if (before !== after) await this.atomicWrite(entry.file, after);
    }

    const previousProgress = serializeProgress(previous.attempts);
    const nextProgress = serializeProgress(next.attempts);
    if (previousProgress !== nextProgress) await this.atomicWrite(PROGRESS_FILE, nextProgress);

    const previousManifest = serializeManifest(oldEntries);
    const nextManifest = serializeManifest(nextEntries);
    if (previousManifest !== nextManifest) await this.atomicWrite(MANIFEST_FILE, nextManifest);

    const nextIds = new Set(nextEntries.map((entry) => entry.id));
    for (const entry of oldEntries) {
      if (!nextIds.has(entry.id)) {
        await rm(path.join(this.directory, entry.file), { force: true });
      }
    }
  }

  private exclusive<T>(operation: () => Promise<T>): Promise<T> {
    const result = this.queue.then(operation, operation);
    this.queue = result.then(
      () => undefined,
      () => undefined,
    );
    return result;
  }

  private async ensureBaseFiles(): Promise<void> {
    await mkdir(path.join(this.directory, "courses"), { recursive: true });
    await Promise.all([
      this.writeIfMissing(MANIFEST_FILE, EMPTY_MANIFEST),
      this.writeIfMissing(PROGRESS_FILE, EMPTY_PROGRESS),
    ]);
  }

  private async writeIfMissing(file: string, contents: string): Promise<void> {
    try {
      await writeFile(path.join(this.directory, file), contents, { encoding: "utf8", flag: "wx" });
    } catch (error) {
      if (
        typeof error !== "object" ||
        error === null ||
        !("code" in error) ||
        error.code !== "EEXIST"
      ) {
        throw error;
      }
    }
  }

  private read(file: string): Promise<string> {
    return readFile(path.join(this.directory, file), "utf8");
  }

  private async readState(): Promise<AppState> {
    const manifest = parseManifest(await this.read(MANIFEST_FILE));
    const parts = await Promise.all(
      manifest.courses.map(async (entry) => parseCourseFile(await this.read(entry.file), entry)),
    );
    const catalog = combineCatalogs(parts);
    const attempts = parseProgress(await this.read(PROGRESS_FILE));
    const questionIds = new Set(catalog.questions.map((question) => question.id));
    if (attempts.some((attempt) => !questionIds.has(attempt.questionId))) {
      throw new Error(`Invalid study data: ${PROGRESS_FILE} references a missing question.`);
    }
    return { version: APP_STATE_VERSION, ...catalog, attempts };
  }

  private async atomicWrite(file: string, contents: string): Promise<void> {
    const target = path.join(this.directory, file);
    await mkdir(path.dirname(target), { recursive: true });
    const temporary = `${target}.${process.pid}.${randomUUID()}.tmp`;
    await writeFile(temporary, contents, "utf8");
    try {
      await rename(temporary, target);
    } catch (error) {
      await rm(temporary, { force: true });
      throw error;
    }
  }
}

export const appDataRepository = new AppDataRepository(resolveAppDataDirectory());
