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
import type { Course } from "@/lib/data/types";

interface CourseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: Course;
  onSubmit: (name: string, description: string) => void | Promise<void>;
}

export function CourseDialog({ open, onOpenChange, initial, onSubmit }: CourseDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setName(initial?.name ?? "");
    setDescription(initial?.description ?? "");
    setError("");
  }, [open, initial]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form
          onSubmit={async (event) => {
            event.preventDefault();
            if (!name.trim()) return;
            setSaving(true);
            setError("");
            try {
              await onSubmit(name, description);
            } catch (cause) {
              setError(cause instanceof Error ? cause.message : "The course could not be saved.");
            } finally {
              setSaving(false);
            }
          }}
        >
          <DialogHeader>
            <DialogTitle>{initial ? "Edit course" : "Create course"}</DialogTitle>
            <DialogDescription>Courses hold your topics and question banks.</DialogDescription>
          </DialogHeader>
          <div className="my-5 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="course-name">Course name</Label>
              <Input
                id="course-name"
                autoFocus
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. Computer Networks"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="course-description">
                Description <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Textarea
                id="course-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={3}
              />
            </div>
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
            <Button type="submit" disabled={!name.trim() || saving}>
              {saving ? "Saving…" : initial ? "Save" : "Create course"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
