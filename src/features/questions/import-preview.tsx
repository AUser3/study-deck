import { AlertCircle, CheckCircle2, Copy } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import type { ParsedQuestion } from "@/lib/data/importer";
import type { Topic } from "@/lib/data/types";
import { cn } from "@/lib/utils";

const PREVIEW_PAGE_SIZE = 40;

interface ImportPreviewProps {
  courseName: string;
  items: ParsedQuestion[];
  duplicateIndices: number[];
  error?: string;
  existingTopics: Topic[];
  onImport: (items: ParsedQuestion[]) => void | Promise<void>;
}

export function ImportPreview({
  courseName,
  items,
  duplicateIndices,
  error,
  existingTopics,
  onImport,
}: ImportPreviewProps) {
  const [limit, setLimit] = useState(PREVIEW_PAGE_SIZE);
  const [onlyErrors, setOnlyErrors] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState("");
  const [includeDuplicates, setIncludeDuplicates] = useState(false);

  useEffect(() => setLimit(PREVIEW_PAGE_SIZE), [items]);

  const invalidItems = useMemo(() => items.filter((item) => item.errors.length > 0), [items]);
  const duplicateSet = useMemo(() => new Set(duplicateIndices), [duplicateIndices]);
  const duplicateCount = duplicateIndices.length;
  const importableItems = items.filter(
    (item) => includeDuplicates || !duplicateSet.has(item.index),
  );
  const existingNames = new Set(existingTopics.map((topic) => topic.name.toLowerCase()));
  const newTopics = [
    ...new Set(
      items
        .map((item) => item.topicName.trim())
        .filter((name) => name && !existingNames.has(name.toLowerCase())),
    ),
  ].filter(
    (name, index, names) =>
      names.findIndex((candidate) => candidate.toLowerCase() === name.toLowerCase()) === index,
  );
  const topicCounts = new Map<string, number>();
  items.forEach((item) => {
    const name = item.topicName || "(none)";
    topicCounts.set(name, (topicCounts.get(name) ?? 0) + 1);
  });

  const filteredItems = onlyErrors ? invalidItems : items;
  const shownItems = filteredItems.slice(0, limit);
  const canImport = importableItems.length > 0 && invalidItems.length === 0 && !error;

  return (
    <section aria-label="Import preview" className="space-y-4">
      <div className="rounded-xl border border-border bg-card p-4 shadow-card">
        <h2 className="text-lg font-semibold">Preview</h2>
        {error && (
          <p role="alert" className="mt-2 rounded-md bg-danger-soft p-2.5 text-sm text-destructive">
            {error}
          </p>
        )}
        {!items.length && !error && (
          <p className="mt-1 text-sm text-muted-foreground">
            Paste text or upload a file to see what will be imported.
          </p>
        )}
        {items.length > 0 && (
          <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-muted-foreground">Destination</dt>
              <dd className="font-medium">{courseName}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Questions detected</dt>
              <dd className="font-medium">{items.length}</dd>
            </div>
            <div className="col-span-2">
              <dt className="text-muted-foreground">Topics</dt>
              <dd className="mt-1 flex flex-wrap gap-1.5">
                {[...topicCounts].map(([name, count]) => (
                  <span
                    key={name}
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs",
                      newTopics.includes(name)
                        ? "bg-accent text-accent-foreground"
                        : "bg-secondary text-secondary-foreground",
                    )}
                  >
                    {name} · {count}
                    {newTopics.includes(name) && " · new"}
                  </span>
                ))}
              </dd>
            </div>
            {newTopics.length > 0 && (
              <div className="col-span-2 text-xs text-muted-foreground">
                Will create {newTopics.length} new {newTopics.length === 1 ? "topic" : "topics"}:{" "}
                {newTopics.join(", ")}
              </div>
            )}
          </dl>
        )}
        {invalidItems.length > 0 && (
          <div
            role="alert"
            className="mt-3 flex items-start justify-between gap-2 rounded-md bg-danger-soft p-2.5 text-sm text-destructive"
          >
            <span className="flex gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" /> {invalidItems.length}{" "}
              {invalidItems.length === 1 ? "question needs" : "questions need"} fixing before
              import.
            </span>
            <button className="shrink-0 underline" onClick={() => setOnlyErrors((value) => !value)}>
              {onlyErrors ? "Show all" : "Show only errors"}
            </button>
          </div>
        )}
        {duplicateCount > 0 && (
          <div className="mt-3 flex items-start gap-2 rounded-md bg-warning-soft p-2.5 text-xs">
            <Copy className="h-4 w-4 shrink-0 text-warning" />
            <span>
              {duplicateCount} {duplicateCount === 1 ? "question is" : "questions are"} already in
              this course and will be skipped by default.
            </span>
          </div>
        )}
        {importError && (
          <p role="alert" className="mt-3 rounded-md bg-danger-soft p-2.5 text-sm text-destructive">
            {importError}
          </p>
        )}
        {duplicateCount > 0 && (
          <label className="mt-3 flex cursor-pointer items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={includeDuplicates}
              onChange={(event) => setIncludeDuplicates(event.target.checked)}
              className="mt-0.5"
            />
            <span>
              Import duplicates anyway
              <span className="block text-xs text-muted-foreground">
                Leave this off to keep only new questions.
              </span>
            </span>
          </label>
        )}
        <Button
          className="mt-4 w-full"
          size="lg"
          disabled={!canImport || importing}
          onClick={async () => {
            setImporting(true);
            setImportError("");
            try {
              await onImport(importableItems);
            } catch (cause) {
              setImportError(
                cause instanceof Error ? cause.message : "The questions could not be imported.",
              );
            } finally {
              setImporting(false);
            }
          }}
        >
          {importing
            ? "Saving…"
            : canImport
              ? `Import ${importableItems.length} questions`
              : "Fix errors to import"}
        </Button>
      </div>

      {shownItems.length > 0 && (
        <ol className="space-y-2">
          {shownItems.map((item) => (
            <li
              key={item.index}
              className={cn(
                "rounded-lg border bg-card p-3 text-sm",
                item.errors.length
                  ? "border-destructive"
                  : duplicateSet.has(item.index)
                    ? "border-warning bg-warning-soft/30"
                    : "border-border",
              )}
            >
              <div className="flex items-start gap-2">
                {item.errors.length ? (
                  <AlertCircle
                    className="mt-0.5 h-4 w-4 shrink-0 text-destructive"
                    aria-label="Has errors"
                  />
                ) : duplicateSet.has(item.index) ? (
                  <Copy className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-label="Duplicate" />
                ) : (
                  <CheckCircle2
                    className="mt-0.5 h-4 w-4 shrink-0 text-success"
                    aria-label="Valid"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground">
                    #{item.index}
                    {item.line ? ` · line ${item.line}` : ""} · {item.topicName || "no topic"}
                  </p>
                  <p className="font-medium">
                    {item.text || <em className="text-muted-foreground">(no question text)</em>}
                  </p>
                  {item.choices.length > 0 ? (
                    <ul className="mt-1 space-y-0.5">
                      {item.choices.map((choice, index) => (
                        <li
                          key={index}
                          className={
                            item.correctIndices.includes(index)
                              ? "font-medium text-success"
                              : "text-muted-foreground"
                          }
                        >
                          {index + 1}. {choice}
                          {item.correctIndices.includes(index) && " ✓"}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    item.answer && <p className="mt-1 text-success">Answer: {item.answer}</p>
                  )}
                  {item.errors.map((itemError) => (
                    <p key={itemError} className="mt-1 text-destructive">
                      ⚠ {itemError}
                    </p>
                  ))}
                  {duplicateSet.has(item.index) && (
                    <p className="mt-1 text-warning">Already exists in this course.</p>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
      {filteredItems.length > limit && (
        <Button
          variant="outline"
          className="w-full"
          onClick={() => setLimit((current) => current + PREVIEW_PAGE_SIZE)}
        >
          Show more ({filteredItems.length - limit} remaining)
        </Button>
      )}
    </section>
  );
}
