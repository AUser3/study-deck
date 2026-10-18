import type { StudyMode } from "@/lib/data/types";

export function getStudyEligibility(questions: { choices: string[] }[], mode: StudyMode) {
  const eligible =
    mode === "mc" ? questions.filter((question) => question.choices.length > 0) : questions;
  return { eligible: eligible.length, skipped: questions.length - eligible.length };
}
