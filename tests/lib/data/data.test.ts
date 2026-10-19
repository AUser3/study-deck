import { describe, expect, it } from "vitest";
import { EXAMPLE_JSON, parseJson, parseText } from "@/lib/data/importer";
import { answersMatch, selectionsMatch } from "@/lib/data/matching";
import { computeProgress, isMastered } from "@/lib/data/progress";
import { normalizeQuestion } from "@/lib/data/store";
import type { Attempt, Question } from "@/lib/data/types";

describe("text importer", () => {
  it("applies Topic and maps multiple correct choices", () => {
    const r = parseText(
      "Topic: Routing\nQ: x?\nA1: BGP\nA2: OSPF\nA3: IS-IS\nCorrect: A2, A3\n\nQ: y?\nAnswer: z",
      "",
    );
    expect(r).toHaveLength(2);
    expect(r[0].topicName).toBe("Routing");
    expect(r[0].correctIndices).toEqual([1, 2]);
    expect(r[0].answer).toBe("OSPF; IS-IS");
    expect(r[1].topicName).toBe("Routing");
    expect(r[1].errors).toEqual([]);
  });
  it("falls back to selected topic when none is given", () => {
    expect(parseText("Q: a\nAnswer: b", "Default")[0].topicName).toBe("Default");
  });
  it("flags choice questions without a correct choice", () => {
    expect(parseText("Q: a\nA1: x\nA2: y", "T")[0].errors.length).toBeGreaterThan(0);
  });
  it("rejects more than 16 choices", () => {
    const t =
      "Q: a\n" +
      Array.from({ length: 17 }, (_, index) => `A${index + 1}: c${index + 1}`).join("\n") +
      "\nCorrect: A1";
    expect(parseText(t, "T")[0].errors.length).toBeGreaterThan(0);
  });
});

describe("json importer", () => {
  it("keeps the downloadable general sample valid", () => {
    const { items, error } = parseJson(JSON.stringify(EXAMPLE_JSON), "");
    expect(error).toBeUndefined();
    expect(items).toHaveLength(2);
    expect(items.every((item) => item.errors.length === 0)).toBe(true);
    expect(items[0].correctIndices).toEqual([1, 3]);
  });

  it("requires answer to match an option", () => {
    const { items } = parseJson(
      JSON.stringify([{ topic: "T", question: "q", options: ["a", "b"], answer: "c" }]),
      "",
    );
    expect(items[0].errors.length).toBeGreaterThan(0);
  });
  it("accepts an array of correct answers", () => {
    const { items } = parseJson(
      JSON.stringify([{ topic: "T", question: "q", options: ["a", "b", "c"], answer: ["a", "c"] }]),
      "",
    );
    expect(items[0].correctIndices).toEqual([0, 2]);
    expect(items[0].errors).toEqual([]);
  });
});

describe("typed matching", () => {
  it("ignores case, whitespace and punctuation", () => {
    expect(answersMatch("  domain name system. ", "Domain Name System")).toBe(true);
    expect(answersMatch("domain", "Domain Name System")).toBe(false);
  });
});

describe("multiple-choice matching", () => {
  it("requires the exact set of correct choices", () => {
    expect(selectionsMatch([0, 2], [2, 0])).toBe(true);
    expect(selectionsMatch([0], [0, 2])).toBe(false);
    expect(selectionsMatch([0, 1, 2], [0, 2])).toBe(false);
  });
});

describe("question normalization", () => {
  it("preserves multiple correct answers when empty choices are removed", () => {
    const question = normalizeQuestion({
      courseId: "course-1",
      topicId: "topic-1",
      text: " Pick all valid answers ",
      choices: [" Alpha ", "", "Beta"],
      correctIndices: [0, 2],
    });

    expect(question.choices).toEqual(["Alpha", "Beta"]);
    expect(question.correctIndices).toEqual([0, 1]);
    expect(question.answer).toBe("Alpha; Beta");
  });
});

describe("progress", () => {
  const q = { id: "q1" } as Question;
  const at = (correct: boolean, t: number): Attempt => ({
    id: String(t),
    questionId: "q1",
    correct,
    mode: "mc",
    at: t,
  });
  it("one correct attempt is not mastery", () => {
    expect(isMastered([at(true, 1)])).toBe(false);
  });
  it("three correct in a row is mastered", () => {
    expect(isMastered([at(false, 1), at(true, 2), at(true, 3), at(true, 4)])).toBe(true);
  });
  it("separates completion and accuracy", () => {
    const p = computeProgress(
      [q, { id: "q2" } as Question],
      new Map([["q1", [at(true, 1), at(false, 2)]]]),
    );
    expect(p.completion).toBe(0.5);
    expect(p.accuracy).toBe(0.5);
  });
});
