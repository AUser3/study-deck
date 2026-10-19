import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Topic } from "@/lib/data/types";

interface TopicDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: Topic;
  onSubmit: (name: string) => void | Promise<void>;
}

export function TopicDialog({ open, onOpenChange, initial, onSubmit }: TopicDialogProps) {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setName(initial?.name ?? "");
      setError("");
    }
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
              await onSubmit(name);
            } catch (cause) {
              setError(cause instanceof Error ? cause.message : "The topic could not be saved.");
            } finally {
              setSaving(false);
            }
          }}
        >
          <DialogHeader>
            <DialogTitle>{initial ? "Rename topic" : "Create topic"}</DialogTitle>
          </DialogHeader>
          <div className="my-5 space-y-1.5">
            <Label htmlFor="topic-name">Topic name</Label>
            <Input
              id="topic-name"
              autoFocus
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
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
              {saving ? "Saving…" : initial ? "Save" : "Create topic"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
