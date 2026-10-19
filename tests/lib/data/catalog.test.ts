import { describe, expect, it } from "vitest";

import {
  combineCatalogs,
  parseCourseFile,
  parseManifest,
  serializeCourseFile,
  serializeManifest,
  type Catalog,
} from "@/lib/data/catalog";

const catalog: Catalog = {
  courses: [{ id: "course-1", name: "Networks", createdAt: 1 }],
  topics: [{ id: "topic-1", courseId: "course-1", name: "Routing", createdAt: 2 }],
  questions: [
    {
      id: "question-1",
      courseId: "course-1",
      topicId: "topic-1",
      text: "Select routing protocols",
      choices: ["OSPF", "HTTP", "IS-IS"],
      correctIndices: [0, 2],
      answer: "OSPF; IS-IS",
      createdAt: 3,
    },
  ],
  notes: [
    {
      id: "note-1",
      courseId: "course-1",
      title: "Routing summary",
      content: "# Link state",
      createdAt: 4,
      updatedAt: 4,
    },
  ],
};

describe("catalog files", () => {
  it("round-trips a course with multiple correct answers", () => {
    const entry = { id: "course-1", file: "courses/networks-course1.json" };
    const restored = parseCourseFile(serializeCourseFile(catalog, "course-1"), entry);
    expect(restored).toEqual(catalog);
  });

  it("round-trips the manifest", () => {
    const entries = [{ id: "course-1", file: "courses/networks-course1.json" }];
    expect(parseManifest(serializeManifest(entries)).courses).toEqual(entries);
  });

  it("migrates schema version 1 course files with an empty notes list", () => {
    const current = JSON.parse(serializeCourseFile(catalog, "course-1"));
    const { notes: _notes, ...legacy } = current;
    legacy.schemaVersion = 1;

    expect(
      parseCourseFile(JSON.stringify(legacy), {
        id: "course-1",
        file: "courses/networks-course1.json",
      }).notes,
    ).toEqual([]);
  });

  it("rejects paths that can escape the data directory", () => {
    expect(() =>
      parseManifest(
        JSON.stringify({ schemaVersion: 1, courses: [{ id: "x", file: "../secret.json" }] }),
      ),
    ).toThrow(/safe course file path/);
  });

  it("rejects questions that reference another course's topic", () => {
    const file = JSON.parse(serializeCourseFile(catalog, "course-1"));
    file.questions[0].topicId = "missing";
    expect(() =>
      parseCourseFile(JSON.stringify(file), {
        id: "course-1",
        file: "courses/networks-course1.json",
      }),
    ).toThrow(/unknown topic/);
  });

  it("rejects a stale display answer for a choice question", () => {
    const file = JSON.parse(serializeCourseFile(catalog, "course-1"));
    file.questions[0].answer = "OSPF";
    expect(() =>
      parseCourseFile(JSON.stringify(file), {
        id: "course-1",
        file: "courses/networks-course1.json",
      }),
    ).toThrow(/must match the selected correct choices/);
  });

  it("rejects duplicate IDs across course files", () => {
    expect(() => combineCatalogs([catalog, catalog])).toThrow(/course IDs must be unique/);
  });
});
