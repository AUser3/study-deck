import { describe, expect, it } from "vitest";

import type { QuestionInput } from "@/lib/data/types";

import { validateQuestion } from "./validation";

const baseQuestion: QuestionInput = {
  courseId: "course-1",
  topicId: "topic-1",
  text: "What is cohesion?",
  choices: [],
  correctIndices: [],
  answer: "Related responsibilities kept together",
};

describe("validateQuestion", () => {
  it("accepts a typed-answer question", () => {
    expect(validateQuestion(baseQuestion)).toEqual([]);
  });

  it("requires one valid answer source", () => {
    expect(validateQuestion({ ...baseQuestion, answer: "" })).toContain(
      "Enter the correct answer.",
    );
    expect(
      validateQuestion({ ...baseQuestion, choices: ["High", "Low"], correctIndices: [] }),
    ).toContain("Mark at least one choice as correct.");
  });

  it("accepts multiple correct answers and limits choices to 16", () => {
    expect(
      validateQuestion({
        ...baseQuestion,
        choices: ["A", "B", "C"],
        correctIndices: [0, 2],
      }),
    ).toEqual([]);
    expect(
      validateQuestion({
        ...baseQuestion,
        choices: Array.from({ length: 17 }, (_, index) => String(index)),
        correctIndices: [0],
      }),
    ).toContain("Use no more than 16 answer choices.");
  });
});
