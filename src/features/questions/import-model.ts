import { parseJson, parseText, type ParsedQuestion } from "@/lib/data/importer";
import type { Question, Topic } from "@/lib/data/types";

export interface ImportDraft {
  format: "text" | "json";
  text: string;
  json: string;
  fileName: string;
  topicId: string;
  newTopicName: string;
}

export interface ImportResult {
  items: ParsedQuestion[];
  duplicateIndices: number[];
  error?: string;
}

export function createImportDraft(topicId = ""): ImportDraft {
  return { format: "text", text: "", json: "", fileName: "", topicId, newTopicName: "" };
}

function normalize(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase();
}

function fingerprint(
  item: Pick<ParsedQuestion, "topicName" | "text" | "choices" | "correctIndices" | "answer">,
): string {
  return JSON.stringify({
    topic: normalize(item.topicName),
    text: normalize(item.text),
    choices: item.choices.map(normalize),
    correctIndices: item.correctIndices,
    answer: normalize(item.answer),
  });
}

export function parseImportDraft(
  draft: ImportDraft,
  topics: Topic[],
  existingQuestions: Question[] = [],
): ImportResult {
  const defaultTopic =
    draft.topicId === "__new"
      ? draft.newTopicName.trim()
      : (topics.find((topic) => topic.id === draft.topicId)?.name ?? "");

  const parsed =
    draft.format === "text"
      ? draft.text.trim()
        ? { items: parseText(draft.text, defaultTopic), error: undefined }
        : { items: [], error: undefined }
      : draft.json.trim()
        ? parseJson(draft.json, defaultTopic)
        : { items: [], error: undefined };
  const topicNames = new Map(topics.map((topic) => [topic.id, topic.name]));
  const known = new Set(
    existingQuestions.map((question) =>
      fingerprint({
        topicName: topicNames.get(question.topicId) ?? "",
        text: question.text,
        choices: question.choices,
        correctIndices: question.correctIndices,
        answer: question.answer,
      }),
    ),
  );
  const duplicateIndices: number[] = [];
  for (const item of parsed.items) {
    const key = fingerprint(item);
    if (known.has(key)) duplicateIndices.push(item.index);
    known.add(key);
  }
  return { ...parsed, duplicateIndices };
}
