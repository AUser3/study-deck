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
import type { StudyNote } from "@/lib/data/types";

interface NoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: StudyNote;
  onSubmit: (title: string, content: string) => void | Promise<void>;
}

export function NoteDialog({ open, onOpenChange, initial, onSubmit }: NoteDialogProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setTitle(initial?.title ?? "");
    setContent(initial?.content ?? "");
    setError("");
  }, [initial, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <form
          onSubmit={async (event) => {
            event.preventDefault();
            if (!title.trim()) return;
            setSaving(true);
            setError("");
            try {
              await onSubmit(title, content);
            } catch (cause) {
              setError(cause instanceof Error ? cause.message : "The note could not be saved.");
            } finally {
              setSaving(false);
            }
          }}
        >
          <DialogHeader>
            <DialogTitle>{initial ? "Edit note" : "Create note"}</DialogTitle>
            <DialogDescription>
              Keep course material together. Plain text and Markdown syntax are both safe to use.
            </DialogDescription>
          </DialogHeader>
          <div className="my-5 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="note-title">Title</Label>
              <Input
                id="note-title"
                autoFocus
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="e.g. Week 3 summary"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="note-content">Note</Label>
              <Textarea
                id="note-content"
                value={content}
                onChange={(event) => setContent(event.target.value)}
                placeholder="Write your notes here…"
                rows={14}
                className="font-mono text-sm"
              />
            </div>
          </div>
          {error && <p className="mb-4 text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              disabled={saving}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!title.trim() || saving}>
              {saving ? "Saving…" : initial ? "Save changes" : "Create note"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
