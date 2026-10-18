import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MAX_ANSWER_CHOICES } from "@/lib/data/types";
import { cn } from "@/lib/utils";

interface AnswerChoicesEditorProps {
  choices: string[];
  correctIndices: number[];
  onChange: (choices: string[], correctIndices: number[]) => void;
}

export function AnswerChoicesEditor({
  choices,
  correctIndices,
  onChange,
}: AnswerChoicesEditorProps) {
  const updateChoice = (index: number, value: string) => {
    onChange(
      choices.map((choice, current) => (current === index ? value : choice)),
      correctIndices,
    );
  };

  const removeChoice = (index: number) => {
    const nextChoices = choices.filter((_, current) => current !== index);
    const nextCorrectIndices = correctIndices
      .filter((correctIndex) => correctIndex !== index)
      .map((correctIndex) => (correctIndex > index ? correctIndex - 1 : correctIndex));
    onChange(nextChoices, nextCorrectIndices);
  };

  const toggleCorrect = (index: number) => {
    const nextCorrectIndices = correctIndices.includes(index)
      ? correctIndices.filter((correctIndex) => correctIndex !== index)
      : [...correctIndices, index].sort((a, b) => a - b);
    onChange(choices, nextCorrectIndices);
  };

  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium">
        Answer choices{" "}
        <span className="text-muted-foreground">(optional, max {MAX_ANSWER_CHOICES})</span>
      </legend>
      {choices.map((choice, index) => (
        <div key={index} className="flex items-center gap-2">
          <label
            className={cn(
              "flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-md border px-2 text-xs",
              correctIndices.includes(index)
                ? "border-success bg-success-soft text-success"
                : "border-input text-muted-foreground",
            )}
          >
            <input
              type="checkbox"
              checked={correctIndices.includes(index)}
              onChange={() => toggleCorrect(index)}
            />
            {correctIndices.includes(index) ? "Correct" : `#${index + 1}`}
          </label>
          <Input
            aria-label={`Choice ${index + 1}`}
            value={choice}
            onChange={(event) => updateChoice(index, event.target.value)}
          />
          <Button
            type="button"
            size="icon"
            variant="ghost"
            aria-label={`Remove choice ${index + 1}`}
            onClick={() => removeChoice(index)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      {choices.length < MAX_ANSWER_CHOICES && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onChange([...choices, ""], correctIndices)}
        >
          <Plus className="h-4 w-4" /> Add choice
        </Button>
      )}
    </fieldset>
  );
}
