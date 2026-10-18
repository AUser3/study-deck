import { describe, expect, it } from "vitest";

import { getStudyEligibility } from "./eligibility";

const questions = [{ choices: ["A", "B"] }, { choices: [] }];

describe("getStudyEligibility", () => {
  it("excludes questions without choices from multiple choice", () => {
    expect(getStudyEligibility(questions, "mc")).toEqual({ eligible: 1, skipped: 1 });
  });

  it("includes every question in typed-answer mode", () => {
    expect(getStudyEligibility(questions, "typed")).toEqual({ eligible: 2, skipped: 0 });
  });
});
