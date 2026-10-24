// @vitest-environment node

import { mkdtemp, readFile, readdir, stat, unlink } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { AppDataRepository } from "@/lib/data/app-data.server";
import { parseManifest } from "@/lib/data/catalog";
import { APP_STATE_VERSION, type AppState } from "@/lib/data/types";

const directories: string[] = [];

async function repository() {
  const directory = await mkdtemp(path.join(os.tmpdir(), "studydeck-test-"));
  directories.push(directory);
  return new AppDataRepository(directory);
}

afterEach(async () => {
  const { rm } = await import("node:fs/promises");
  await Promise.all(directories.splice(0).map((directory) => rm(directory, { recursive: true })));
});

describe("application-data repository", () => {
  it("creates base files once and leaves existing JSON untouched when loading", async () => {
    const data = await repository();
    await data.load();
    const manifestPath = path.join(data.directory, "manifest.json");
    const progressPath = path.join(data.directory, "progress.json");
    const manifestBefore = await readFile(manifestPath, "utf8");
    const progressBefore = await readFile(progressPath, "utf8");
    const modifiedBefore = (await stat(manifestPath)).mtimeMs;

    await data.load();

    expect(await readFile(manifestPath, "utf8")).toBe(manifestBefore);
    expect(await readFile(progressPath, "utf8")).toBe(progressBefore);
    expect((await stat(manifestPath)).mtimeMs).toBe(modifiedBefore);
  });

  it("round-trips courses and progress through JSON files", async () => {
    const data = await repository();
    const state: AppState = {
      version: APP_STATE_VERSION,
      courses: [{ id: "course-1", name: "Networks", createdAt: 1 }],
      topics: [{ id: "topic-1", courseId: "course-1", name: "Routing", createdAt: 2 }],
      questions: [
        {
          id: "question-1",
          courseId: "course-1",
          topicId: "topic-1",
          text: "Pick the protocol",
          choices: ["OSPF", "HTTP"],
          correctIndices: [0],
          answer: "OSPF",
          createdAt: 3,
        },
      ],
      attempts: [{ id: "attempt-1", questionId: "question-1", correct: true, mode: "mc", at: 4 }],
      notes: [
        {
          id: "note-1",
          courseId: "course-1",
          title: "Summary",
          content: "Study OSPF",
          createdAt: 5,
          updatedAt: 5,
        },
      ],
      oldExams: [],
    };

    expect(await data.save(state)).toEqual(state);
    expect(await data.load()).toEqual(state);

    const manifest = parseManifest(
      await readFile(path.join(data.directory, "manifest.json"), "utf8"),
    );
    expect(manifest.courses).toHaveLength(1);
    const coursePath = path.join(data.directory, manifest.courses[0].file);
    expect(await readFile(coursePath, "utf8")).toContain('"Pick the protocol"');
    expect(await readFile(path.join(data.directory, "progress.json"), "utf8")).toContain(
      '"attempt-1"',
    );

    const empty: AppState = {
      version: APP_STATE_VERSION,
      courses: [],
      topics: [],
      questions: [],
      attempts: [],
      notes: [],
      oldExams: [],
    };
    await data.save(empty);
    expect(await data.load()).toEqual(empty);
    await expect(readFile(coursePath, "utf8")).rejects.toMatchObject({ code: "ENOENT" });
    const archivedCourses = await readdir(path.join(data.directory, "backup", "courses"));
    expect(archivedCourses).toHaveLength(1);
  });

  it("repairs a manifest when a course file was removed outside the app", async () => {
    const data = await repository();
    await data.save({
      version: APP_STATE_VERSION,
      courses: [{ id: "course-1", name: "Missing file", createdAt: 1 }],
      topics: [],
      questions: [],
      attempts: [],
      notes: [],
      oldExams: [],
    });
    const manifest = parseManifest(
      await readFile(path.join(data.directory, "manifest.json"), "utf8"),
    );
    await unlink(path.join(data.directory, manifest.courses[0].file));

    await expect(data.load()).resolves.toMatchObject({ courses: [], topics: [], questions: [] });
    expect(
      parseManifest(await readFile(path.join(data.directory, "manifest.json"), "utf8")),
    ).toEqual({ schemaVersion: 1, courses: [] });
  });

  it("archives and restores deleted questions in batches", async () => {
    const data = await repository();
    const question = {
      id: "question-1",
      courseId: "course-1",
      topicId: "topic-1",
      text: "What is REST?",
      choices: ["A protocol", "A database"],
      correctIndices: [0],
      answer: "A protocol",
      createdAt: 3,
    };
    const state: AppState = {
      version: APP_STATE_VERSION,
      courses: [{ id: "course-1", name: "Web", createdAt: 1 }],
      topics: [{ id: "topic-1", courseId: "course-1", name: "APIs", createdAt: 2 }],
      questions: [question],
      attempts: [],
      notes: [],
      oldExams: [],
    };
    await data.save(state);
    await data.save({ ...state, questions: [] });

    await expect(data.listRecoveryQuestions()).resolves.toMatchObject([
      { id: question.id, question },
    ]);
    await expect(data.restoreRecoveryQuestions([question.id])).resolves.toMatchObject({
      questions: [question],
    });
    await expect(data.listRecoveryQuestions()).resolves.toEqual([]);
  });

  it("rejects attempts that point at missing questions", async () => {
    const data = await repository();
    await expect(
      data.save({
        version: APP_STATE_VERSION,
        courses: [],
        topics: [],
        questions: [],
        attempts: [{ id: "a", questionId: "missing", correct: true, mode: "mc", at: 1 }],
        notes: [],
        oldExams: [],
      }),
    ).rejects.toThrow(/existing question/);
  });

  it("restores a backup through the same validated repository", async () => {
    const data = await repository();
    const original: AppState = {
      version: APP_STATE_VERSION,
      courses: [{ id: "course-1", name: "Backup course", createdAt: 1 }],
      topics: [],
      questions: [],
      attempts: [],
      notes: [],
      oldExams: [],
    };
    await data.save(original);
    const backup = await data.createBackup();
    await data.save({
      version: APP_STATE_VERSION,
      courses: [],
      topics: [],
      questions: [],
      attempts: [],
      notes: [],
      oldExams: [],
    });

    await expect(data.restoreBackup(backup)).resolves.toEqual(original);
    await expect(data.load()).resolves.toEqual(original);
  });

  it("backs up, removes, and restores managed old exam PDFs", async () => {
    const data = await repository();
    const pdf = Buffer.from("%PDF-1.4\n%%EOF");
    const document = await data.saveDocument({
      fileName: "exam.pdf",
      mimeType: "application/pdf",
      size: pdf.byteLength,
      base64: pdf.toString("base64"),
    });
    const state: AppState = {
      version: APP_STATE_VERSION,
      courses: [{ id: "course-1", name: "Course", createdAt: 1 }],
      topics: [],
      questions: [],
      attempts: [],
      notes: [],
      oldExams: [
        {
          id: "exam-1",
          courseId: "course-1",
          title: "Final exam",
          document,
          createdAt: 2,
          updatedAt: 2,
        },
      ],
    };
    await data.save(state);
    const backup = await data.createBackup();

    await data.save({
      version: APP_STATE_VERSION,
      courses: [],
      topics: [],
      questions: [],
      attempts: [],
      notes: [],
      oldExams: [],
    });
    await expect(data.readDocument(document)).rejects.toMatchObject({ code: "ENOENT" });

    await data.restoreBackup(backup);
    await expect(data.readDocument(document)).resolves.toBe(pdf.toString("base64"));
  });
});
