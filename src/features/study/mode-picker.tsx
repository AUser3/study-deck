import { Keyboard, ListChecks } from "lucide-react";
import type { ReactNode } from "react";

import type { StudyMode } from "@/lib/data/types";
import { cn } from "@/lib/utils";

const MODES: { value: StudyMode; label: string; description: string; icon: ReactNode }[] = [
  {
    value: "mc",
    label: "Multiple choice",
    description: "Pick from answer choices",
    icon: <ListChecks className="h-4 w-4" />,
  },
  {
    value: "typed",
    label: "Typed answer",
    description: "Write the answer yourself",
    icon: <Keyboard className="h-4 w-4" />,
  },
];

export function ModePicker({
  value,
  onChange,
}: {
  value: StudyMode;
  onChange: (mode: StudyMode) => void;
}) {
  return (
    <div role="radiogroup" aria-label="Study mode" className="grid gap-2 sm:grid-cols-2">
      {MODES.map((mode) => {
        const selected = value === mode.value;
        return (
          <button
            key={mode.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(mode.value)}
            className={cn(
              "group relative flex items-start gap-3 overflow-hidden rounded-2xl border p-3 text-left transition-all duration-300",
              selected
                ? "border-primary bg-primary/[0.08] shadow-lg shadow-primary/10"
                : "surface hover:-translate-y-0.5 hover:border-primary/40",
            )}
          >
            <span
              className={cn(
                "absolute inset-y-0 left-0 w-1 bg-primary transition-transform duration-300",
                selected ? "scale-y-100" : "scale-y-0 group-hover:scale-y-60",
              )}
              aria-hidden
            />
            <span className={cn("mt-0.5", selected ? "text-primary" : "text-muted-foreground")}>
              {mode.icon}
            </span>
            <span>
              <span className="block text-sm font-medium">{mode.label}</span>
              <span className="block text-xs text-muted-foreground">{mode.description}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
