import { Copy, Download, FileJson, FileText, Sparkles, Upload } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { EXAMPLE_JSON, EXAMPLE_TEXT } from "@/lib/data/importer";
import type { Topic } from "@/lib/data/types";
import { cn } from "@/lib/utils";

import type { ImportDraft } from "./import-model";

interface ImportSourceProps {
  draft: ImportDraft;
  topics: Topic[];
  onChange: (patch: Partial<ImportDraft>) => void;
}

function downloadImportSample() {
  const blob = new Blob([JSON.stringify(EXAMPLE_JSON, null, 2)], { type: "application/json" });
  const anchor = document.createElement("a");
  anchor.href = URL.createObjectURL(blob);
  anchor.download = "studydeck-sample.json";
  anchor.click();
  URL.revokeObjectURL(anchor.href);
}

function buildJsonPrompt(source: string, topicName: string) {
  const topicInstruction = topicName.trim()
    ? `Use "${topicName.trim().replaceAll('"', '\\"')}" as the default topic when the source does not clearly name one.`
    : "If the course or topic cannot be identified, ask the user for the course name and topic before generating any JSON. Never invent or assume them.";

  return `You convert pasted exam material into a JSON question bank for Studydeck.

Return ONLY valid JSON. Do not use Markdown fences, commentary, or trailing commas.
Return a JSON array where every object has exactly these fields:
{
  "topic": "Topic name",
  "question": "The complete question text",
  "options": ["Option 1", "Option 2"],
  "answer": ["The exact text of every correct option"],
  "explanation": "A concise explanation, if one is supported by the source"
}

Rules:
- Preserve every question; never invent, combine, or silently omit questions unless the user explicitly asks you to transform, combine, or remove content.
- Preserve the original question wording and option text exactly. Preserve the original option order exactly.
- Use an empty options array for typed-answer questions.
- The answer field is an array for multiple-choice questions and must contain the exact option text, not letters or indices.
- Copy the marked correct answer from the source. Do not guess when the source is ambiguous; add a short, useful explanation stating what is unclear.
- Remove grading noise such as points, result labels, and repeated “Answer” headings.
- If any required information is missing or ambiguous—including the course, topic, question boundary, answer choices, or correct answer—ask the user a concise clarification question before generating JSON.
- Ask for all missing details at once. Do not generate partial JSON, placeholder values, invented topics, or guessed answers.
- Inside JSON string values, encode double quotes as \\u0022 and backslashes as \\u005c.
- Validate the complete generated output with a JSON parser before returning it. Return nothing until it parses successfully.
- ${topicInstruction}

Source material:
---
${source.trim() || "[Paste the exam material here]"}
---`;
}

export function ImportSource({ draft, topics, onChange }: ImportSourceProps) {
  const [promptSource, setPromptSource] = useState("");
  const selectClassName = "h-9 w-full rounded-md border border-input bg-card px-3 text-sm";
  const generatedPrompt = useMemo(() => {
    const selectedTopic = topics.find((topic) => topic.id === draft.topicId)?.name;
    return buildJsonPrompt(promptSource, selectedTopic ?? draft.newTopicName);
  }, [promptSource, draft.newTopicName, draft.topicId, topics]);

  const onFile = async (file?: File) => {
    if (!file) return;
    onChange({ fileName: file.name, json: await file.text() });
  };

  return (
    <section className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="default-topic">
          Default topic{" "}
          <span className="text-muted-foreground">(used when a question has no “Topic:”)</span>
        </Label>
        <select
          id="default-topic"
          className={selectClassName}
          value={draft.topicId}
          onChange={(event) => onChange({ topicId: event.target.value })}
        >
          <option value="">— None —</option>
          {topics.map((topic) => (
            <option key={topic.id} value={topic.id}>
              {topic.name}
            </option>
          ))}
          <option value="__new">+ New topic…</option>
        </select>
        {draft.topicId === "__new" && (
          <input
            className={cn(selectClassName, "mt-2")}
            placeholder="New topic name"
            value={draft.newTopicName}
            onChange={(event) => onChange({ newTopicName: event.target.value })}
            aria-label="New topic name"
          />
        )}
      </div>

      <Tabs
        value={draft.format}
        onValueChange={(format) => onChange({ format: format as ImportDraft["format"] })}
      >
        <TabsList>
          <TabsTrigger value="text">
            <FileText className="h-4 w-4" /> Paste text
          </TabsTrigger>
          <TabsTrigger value="json">
            <FileJson className="h-4 w-4" /> JSON file
          </TabsTrigger>
          <TabsTrigger value="ai-prompt">
            <Sparkles className="h-4 w-4" /> AI prompt
          </TabsTrigger>
        </TabsList>
        <TabsContent value="text" className="space-y-3">
          <Textarea
            value={draft.text}
            onChange={(event) => onChange({ text: event.target.value })}
            rows={16}
            className="font-mono text-xs"
            placeholder={EXAMPLE_TEXT}
            aria-label="Formatted question text"
          />
          <details className="rounded-lg border border-border bg-card p-3 text-sm">
            <summary className="cursor-pointer font-medium">Format guide & example</summary>
            <ul className="mt-2 list-disc space-y-0.5 pl-5 text-muted-foreground">
              <li>
                <code>Topic:</code> applies to following questions until the next Topic.
              </li>
              <li>
                <code>Q:</code> starts a new question.
              </li>
              <li>
                <code>A1:</code>–<code>A16:</code> optional choices; <code>Correct: A2, A4</code>{" "}
                marks one or more right answers.
              </li>
              <li>
                <code>Answer:</code> for questions without choices. <code>Explanation:</code> is
                optional.
              </li>
            </ul>
            <pre className="mt-3 max-h-56 overflow-auto rounded bg-muted p-3 text-xs">
              {EXAMPLE_TEXT}
            </pre>
            <div className="mt-2 flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(EXAMPLE_TEXT);
                  toast("Example copied");
                }}
              >
                <Copy className="h-4 w-4" /> Copy example
              </Button>
              <Button size="sm" variant="outline" onClick={() => onChange({ text: EXAMPLE_TEXT })}>
                Use example
              </Button>
            </div>
          </details>
        </TabsContent>
        <TabsContent value="json" className="space-y-3">
          <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed border-input bg-card p-8 text-center hover:border-primary">
            <Upload className="h-6 w-6 text-primary" />
            <span className="text-sm font-medium">{draft.fileName || "Choose a .json file"}</span>
            <span className="text-xs text-muted-foreground">
              Array of {"{ topic, question, options, answer, explanation }"}; answer may be a string
              or array.
            </span>
            <input
              type="file"
              accept="application/json,.json"
              className="sr-only"
              onChange={(event) => onFile(event.target.files?.[0])}
            />
          </label>
          <Textarea
            value={draft.json}
            onChange={(event) => onChange({ json: event.target.value })}
            rows={8}
            className="font-mono text-xs"
            placeholder="…or paste JSON here"
            aria-label="JSON content"
          />
          <Button size="sm" variant="outline" onClick={downloadImportSample}>
            <Download className="h-4 w-4" /> Download sample JSON
          </Button>
        </TabsContent>
        <TabsContent value="ai-prompt" className="space-y-3">
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm">
            <p className="font-medium">Turn messy exam text into importable JSON</p>
            <p className="mt-1 text-muted-foreground">
              Paste the exam or quiz results below. The generated prompt tells an AI exactly which
              JSON format Studydeck accepts and protects the original answer choices.
            </p>
          </div>
          <Textarea
            value={promptSource}
            onChange={(event) => setPromptSource(event.target.value)}
            rows={12}
            className="font-mono text-xs"
            placeholder="Paste questions, answer choices, and correct answers here…"
            aria-label="Exam material for AI prompt"
          />
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                navigator.clipboard.writeText(generatedPrompt);
                toast.success("AI prompt copied");
              }}
            >
              <Copy className="h-4 w-4" /> Copy prompt
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const blob = new Blob([generatedPrompt], { type: "text/plain" });
                const anchor = document.createElement("a");
                anchor.href = URL.createObjectURL(blob);
                anchor.download = "studydeck-json-prompt.txt";
                anchor.click();
                URL.revokeObjectURL(anchor.href);
              }}
            >
              <Download className="h-4 w-4" /> Download prompt
            </Button>
          </div>
          <div>
            <Label htmlFor="generated-json-prompt">Generated prompt</Label>
            <Textarea
              id="generated-json-prompt"
              value={generatedPrompt}
              readOnly
              rows={18}
              className="mt-1.5 font-mono text-xs"
              aria-label="Generated JSON prompt"
            />
          </div>
        </TabsContent>
      </Tabs>
    </section>
  );
}
