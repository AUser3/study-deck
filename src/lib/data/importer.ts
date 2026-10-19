/** Parsers for bulk question import (formatted text + JSON). Pure functions. */

import { MAX_ANSWER_CHOICES } from "./types";

export interface ParsedQuestion {
  index: number; // 1-based position in import
  line?: number; // source line (text format)
  topicName: string;
  text: string;
  choices: string[];
  correctIndices: number[];
  answer: string;
  explanation?: string;
  errors: string[];
}

export const EXAMPLE_TEXT = `Topic: Routing
Q: Which protocols use a link-state algorithm?
A1: BGP
A2: OSPF
A3: RIP
A4: IS-IS
Correct: A2, A4
Explanation: OSPF and IS-IS are link-state routing protocols.

Q: What is the maximum reachable hop count in RIP?
A1: 15
A2: 16
Correct: A1

Topic: DNS
Q: What does DNS stand for?
Answer: Domain Name System
Explanation: DNS resolves domain names to records such as IP addresses.`;

export const EXAMPLE_JSON = [
  {
    topic: "Numbers",
    question: "Which numbers are even?",
    options: ["1", "2", "3", "4"],
    answer: ["2", "4"],
    explanation: "Even numbers are divisible by 2.",
  },
  {
    topic: "Vocabulary",
    question: "What is the opposite of hot?",
    options: [],
    answer: "Cold",
    explanation: "This example demonstrates a typed-answer question.",
  },
];

function resolveChoice(token: string, choices: string[]): number | undefined {
  const numbered = /^a?\s*(\d{1,2})$/i.exec(token.trim());
  if (numbered) {
    const index = Number(numbered[1]) - 1;
    return index >= 0 && index < choices.length ? index : undefined;
  }
  const index = choices.findIndex(
    (choice) => choice.trim().toLowerCase() === token.trim().toLowerCase(),
  );
  return index >= 0 ? index : undefined;
}

function resolveCorrectAnswers(raw: string, choices: string[]): number[] {
  const exactMatch = resolveChoice(raw, choices);
  if (exactMatch !== undefined) return [exactMatch];

  const tokens = raw.split(/\s*(?:,|;|\band\b)\s*/i).filter(Boolean);
  const indices = tokens.map((token) => resolveChoice(token, choices));
  if (!tokens.length || indices.some((index) => index === undefined)) return [];
  return [...new Set(indices as number[])].sort((a, b) => a - b);
}

function validate(q: ParsedQuestion, rawCorrect?: string) {
  if (!q.text.trim()) q.errors.push("Question text is missing.");
  if (!q.topicName.trim())
    q.errors.push("No topic — add a “Topic:” line or choose a default topic.");
  if (q.choices.length > MAX_ANSWER_CHOICES) {
    q.errors.push(`Has ${q.choices.length} choices; maximum is ${MAX_ANSWER_CHOICES}.`);
  }
  if (q.choices.some((c) => !c.trim())) q.errors.push("One of the choices is empty.");
  if (q.choices.length > 0) {
    if (
      q.correctIndices.length === 0 ||
      q.correctIndices.some((index) => index < 0 || index >= q.choices.length)
    ) {
      q.errors.push(
        rawCorrect
          ? `One or more correct answers in “${rawCorrect}” don't match a choice.`
          : "Missing which choices are correct.",
      );
    } else {
      q.answer = q.correctIndices.map((index) => q.choices[index]).join("; ");
    }
  } else if (!q.answer.trim()) {
    q.errors.push("Missing answer.");
  }
}

export function parseText(input: string, defaultTopic: string): ParsedQuestion[] {
  const out: ParsedQuestion[] = [];
  let topic = "";
  let cur: (ParsedQuestion & { slots: (string | undefined)[]; rawCorrect?: string }) | null = null;

  const finish = () => {
    if (!cur) return;
    const slots = cur.slots;
    const maxIdx = slots.length;
    const gaps = slots.slice(0, maxIdx).some((s) => s === undefined);
    cur.choices = slots.filter((s): s is string => s !== undefined);
    if (gaps) cur.errors.push("Choice numbers skip a value (e.g. A1, A3).");
    if (cur.rawCorrect) {
      cur.correctIndices = resolveCorrectAnswers(cur.rawCorrect, cur.choices);
    } else if (cur.choices.length && cur.answer) {
      cur.correctIndices = resolveCorrectAnswers(cur.answer, cur.choices);
    }
    validate(cur, cur.rawCorrect);
    const { slots: _s, rawCorrect: _r, ...q } = cur;
    out.push(q);
    cur = null;
  };

  input.split(/\r?\n/).forEach((rawLine, i) => {
    const line = rawLine.trim();
    if (!line) return;
    const m = /^(Topic|Q|A([1-9]\d*)|Correct|Answer|Explanation)\s*:\s*(.*)$/i.exec(line);
    if (!m) {
      if (cur) cur.errors.push(`Line ${i + 1}: unrecognised line “${line.slice(0, 40)}”.`);
      return;
    }
    const key = m[1].toLowerCase();
    const val = m[3].trim();
    if (key === "topic") {
      finish();
      topic = val;
      return;
    }
    if (key === "q") {
      finish();
      cur = {
        index: out.length + 1,
        line: i + 1,
        topicName: topic || defaultTopic,
        text: val,
        choices: [],
        correctIndices: [],
        answer: "",
        errors: [],
        slots: [],
      };
      return;
    }
    if (!cur) return;
    if (m[2]) {
      const n = Number(m[2]);
      if (n > MAX_ANSWER_CHOICES) {
        cur.errors.push(`A${n} is not allowed; use A1–A${MAX_ANSWER_CHOICES}.`);
      } else cur.slots[n - 1] = val;
    } else if (key === "correct") cur.rawCorrect = val;
    else if (key === "answer") cur.answer = val;
    else if (key === "explanation") cur.explanation = val || undefined;
  });
  finish();
  return out;
}

export function parseJson(
  input: string,
  defaultTopic: string,
): { items: ParsedQuestion[]; error?: string } {
  let data: unknown;
  try {
    data = JSON.parse(input);
  } catch (e) {
    return { items: [], error: `Invalid JSON: ${(e as Error).message}` };
  }
  if (!Array.isArray(data))
    return { items: [], error: "JSON must be an array of question objects." };
  const items = data.map((raw, i): ParsedQuestion => {
    const o = (raw ?? {}) as Record<string, unknown>;
    const choices = Array.isArray(o.options) ? o.options.map((x) => String(x ?? "")) : [];
    const answerTokens = Array.isArray(o.answer)
      ? o.answer.map((answer) => String(answer ?? ""))
      : typeof o.answer === "string"
        ? [o.answer]
        : [];
    const answer = answerTokens.join("; ");
    const q: ParsedQuestion = {
      index: i + 1,
      topicName: (typeof o.topic === "string" && o.topic.trim()) || defaultTopic,
      text: typeof o.question === "string" ? o.question : "",
      choices,
      correctIndices: [],
      answer,
      explanation:
        typeof o.explanation === "string" && o.explanation.trim() ? o.explanation : undefined,
      errors: [],
    };
    if (choices.length) {
      const indices = answerTokens.map((token) => resolveChoice(token, choices));
      if (answerTokens.length > 0 && indices.every((index) => index !== undefined)) {
        q.correctIndices = [...new Set(indices as number[])].sort((a, b) => a - b);
      }
    }
    validate(q, choices.length ? answer || undefined : undefined);
    return q;
  });
  return { items };
}
