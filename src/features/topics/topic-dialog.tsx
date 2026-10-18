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
  onSubmit: (name: string) => void;
}

export function TopicDialog({ open, onOpenChange, initial, onSubmit }: TopicDialogProps) {
  const [name, setName] = useState("");

  useEffect(() => {
    if (open) setName(initial?.name ?? "");
  }, [open, initial]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (name.trim()) onSubmit(name);
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
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim()}>
              {initial ? "Save" : "Create topic"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
