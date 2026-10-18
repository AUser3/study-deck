import { parseJson, parseText, type ParsedQuestion } from "@/lib/data/importer";
import type { Topic } from "@/lib/data/types";

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
  error?: string;
}

export function createImportDraft(topicId = ""): ImportDraft {
  return { format: "text", text: "", json: "", fileName: "", topicId, newTopicName: "" };
}

export function parseImportDraft(draft: ImportDraft, topics: Topic[]): ImportResult {
  const defaultTopic =
    draft.topicId === "__new"
      ? draft.newTopicName.trim()
      : (topics.find((topic) => topic.id === draft.topicId)?.name ?? "");

  if (draft.format === "text") {
    return {
      items: draft.text.trim() ? parseText(draft.text, defaultTopic) : [],
      error: undefined,
    };
  }

  return draft.json.trim() ? parseJson(draft.json, defaultTopic) : { items: [], error: undefined };
}
