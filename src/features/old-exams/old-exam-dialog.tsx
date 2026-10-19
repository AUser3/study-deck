import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { OldExamInput } from "@/lib/data/store";
import type { OldExam } from "@/lib/data/types";

interface OldExamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: OldExam;
  onSubmit: (input: OldExamInput, file?: File) => void | Promise<void>;
}

export function OldExamDialog({ open, onOpenChange, initial, onSubmit }: OldExamDialogProps) {
  const [title, setTitle] = useState("");
  const [year, setYear] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File>();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setTitle(initial?.title ?? "");
    setYear(initial?.year?.toString() ?? "");
    setDescription(initial?.description ?? "");
    setFile(undefined);
    setError("");
  }, [initial, open]);

  const parsedYear = year ? Number(year) : undefined;
  const yearValid =
    parsedYear === undefined ||
    (Number.isInteger(parsedYear) && parsedYear >= 1900 && parsedYear <= 2200);
  const canSubmit = title.trim() && yearValid && (initial || file);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form
          onSubmit={async (event) => {
            event.preventDefault();
            if (!canSubmit) return;
            setSaving(true);
            setError("");
            try {
              await onSubmit({ title, year: parsedYear, description }, file);
            } catch (cause) {
              setError(cause instanceof Error ? cause.message : "The old exam could not be saved.");
            } finally {
              setSaving(false);
            }
          }}
        >
          <DialogHeader>
            <DialogTitle>{initial ? "Edit old exam" : "Add old exam"}</DialogTitle>
            <DialogDescription>
              {initial
                ? "Update the searchable details for this exam."
                : "Studydeck copies the PDF into its private AppData folder."}
            </DialogDescription>
          </DialogHeader>
          <div className="my-5 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="exam-title">Title</Label>
              <Input
                id="exam-title"
                autoFocus
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="e.g. Final exam"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="exam-year">
                Year <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Input
                id="exam-year"
                inputMode="numeric"
                value={year}
                onChange={(event) => setYear(event.target.value)}
                placeholder="2025"
              />
              {!yearValid && (
                <p className="text-xs text-destructive">Use a year from 1900 to 2200.</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="exam-description">
                Description <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Textarea
                id="exam-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={3}
              />
            </div>
            {!initial && (
              <div className="space-y-1.5">
                <Label htmlFor="exam-file">PDF file</Label>
                <Input
                  id="exam-file"
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={(event) => setFile(event.target.files?.[0])}
                />
                <p className="text-xs text-muted-foreground">Maximum file size: 20 MiB.</p>
              </div>
            )}
          </div>
          {error && (
            <p role="alert" className="mb-4 text-sm text-destructive">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              disabled={saving}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!canSubmit || saving}>
              {saving ? "Saving…" : initial ? "Save changes" : "Add exam"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
