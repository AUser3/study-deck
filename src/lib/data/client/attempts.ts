import type { Attempt, ID, StudyMode } from "../types";
import { transact, uid } from "./state";

export function recordAttempt(questionId: ID, correct: boolean, mode: StudyMode): Promise<void> {
  return transact((current) => {
    const attempt: Attempt = { id: uid(), questionId, correct, mode, at: Date.now() };
    return {
      next: { ...current, attempts: [...current.attempts, attempt] },
      result: undefined,
    };
  });
}
