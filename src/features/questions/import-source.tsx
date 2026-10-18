import { Copy, Download, FileJson, FileText, Upload } from "lucide-react";
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

export function ImportSource({ draft, topics, onChange }: ImportSourceProps) {
  const selectClassName = "h-9 w-full rounded-md border border-input bg-card px-3 text-sm";

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
      </Tabs>
    </section>
  );
}
