import { describe, expect, it } from "vitest";

import { parseBackup, serializeBackup } from "@/lib/data/backup";
import { APP_STATE_VERSION, type AppState } from "@/lib/data/types";

const state: AppState = {
  version: APP_STATE_VERSION,
  courses: [],
  topics: [],
  questions: [],
  attempts: [],
  notes: [],
  oldExams: [],
};

describe("Studydeck backups", () => {
  it("round-trips a versioned backup", () => {
    const backup = parseBackup(serializeBackup(state, "2026-10-19T12:00:00.000Z"));

    expect(backup.schemaVersion).toBe(1);
    expect(backup.exportedAt).toBe("2026-10-19T12:00:00.000Z");
    expect(backup.state).toEqual(state);
  });

  it("migrates legacy single-answer state while restoring", () => {
    const backup = JSON.stringify({
      schemaVersion: 1,
      exportedAt: "2026-10-19T12:00:00.000Z",
      state: {
        version: 1,
        courses: [{ id: "c", name: "Course", createdAt: 1 }],
        topics: [{ id: "t", courseId: "c", name: "Topic", createdAt: 2 }],
        questions: [
          {
            id: "q",
            courseId: "c",
            topicId: "t",
            text: "Question",
            choices: ["A", "B"],
            correctIndex: 1,
            answer: "B",
            createdAt: 3,
          },
        ],
        attempts: [],
      },
    });

    expect(parseBackup(backup).state.questions[0].correctIndices).toEqual([1]);
  });

  it("rejects unknown backup schemas", () => {
    expect(() => parseBackup('{"schemaVersion":99,"exportedAt":"2026-10-19","state":{}}')).toThrow(
      /schemaVersion/,
    );
  });
});
