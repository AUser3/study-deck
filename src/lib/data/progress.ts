/**
 * Progress model (frontend phase — replaceable).
 *
 * - Completion: unique questions with ≥1 attempt / total questions.
 * - Accuracy:   correct attempts / all attempts.
 * - Mastery:    per question, share of its last 3 attempts that were correct
 *               (unattempted = 0). A question is "mastered" only when its
 *               last 3 attempts were all correct — never from a single view.
 */
import type { Attempt, ID, Question } from "./types";

export const MASTERY_WINDOW = 3;

export interface Progress {
  total: number;
  attempted: number;
  completion: number; // 0..1
  attempts: number;
  correct: number;
  accuracy: number | null; // null when no attempts
  mastery: number; // 0..1
  mastered: number;
}

export function attemptsByQuestion(attempts: Attempt[]) {
  const m = new Map<ID, Attempt[]>();
  for (const a of attempts) {
    const list = m.get(a.questionId);
    if (list) list.push(a);
    else m.set(a.questionId, [a]);
  }
  for (const list of m.values()) list.sort((a, b) => a.at - b.at);
  return m;
}

export function questionMastery(list: Attempt[] | undefined) {
  if (!list || list.length === 0) return 0;
  const recent = list.slice(-MASTERY_WINDOW);
  return recent.filter((a) => a.correct).length / MASTERY_WINDOW;
}

export function isMastered(list: Attempt[] | undefined) {
  return (
    !!list && list.length >= MASTERY_WINDOW && list.slice(-MASTERY_WINDOW).every((a) => a.correct)
  );
}

export function computeProgress(questions: Question[], byQ: Map<ID, Attempt[]>): Progress {
  let attempted = 0,
    attempts = 0,
    correct = 0,
    masterySum = 0,
    mastered = 0;
  for (const q of questions) {
    const list = byQ.get(q.id);
    if (list?.length) {
      attempted++;
      attempts += list.length;
      correct += list.filter((a) => a.correct).length;
    }
    masterySum += questionMastery(list);
    if (isMastered(list)) mastered++;
  }
  const total = questions.length;
  return {
    total,
    attempted,
    completion: total ? attempted / total : 0,
    attempts,
    correct,
    accuracy: attempts ? correct / attempts : null,
    mastery: total ? masterySum / total : 0,
    mastered,
  };
}

const dayKey = (t: number) => {
  const d = new Date(t);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
};

export function studiedToday(attempts: Attempt[], now = Date.now()) {
  const k = dayKey(now);
  return new Set(attempts.filter((a) => dayKey(a.at) === k).map((a) => a.questionId)).size;
}

/** Consecutive days with ≥1 attempt, ending today (or yesterday if nothing yet today). */
export function streak(attempts: Attempt[], now = Date.now()) {
  const days = new Set(attempts.map((a) => dayKey(a.at)));
  const d = new Date(now);
  if (!days.has(dayKey(d.getTime()))) d.setDate(d.getDate() - 1);
  let n = 0;
  while (days.has(dayKey(d.getTime()))) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

export const pct = (x: number) => `${Math.round(x * 100)}%`;
