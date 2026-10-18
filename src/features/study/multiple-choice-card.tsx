import { ArrowRight, CheckCircle2, XCircle } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { selectionsMatch } from "@/lib/data/matching";
import { cn } from "@/lib/utils";

import type { QuestionCardProps } from "./question-card-props";
import { useStudyKeys } from "./use-study-keys";

export function MultipleChoiceCard({ question, onResult, onNext, last }: QuestionCardProps) {
  const [selected, setSelected] = useState<Set<number>>(() => new Set());
  const [checked, setChecked] = useState(false);
  const correct = selectionsMatch(selected, question.correctIndices);

  const toggleChoice = (index: number) => {
    if (checked) return;
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const checkAnswer = () => {
    if (selected.size === 0 || checked) return;
    setChecked(true);
    onResult(correct);
  };

  useStudyKeys((event) => {
    if (
      event.target instanceof HTMLElement &&
      event.target.tagName === "BUTTON" &&
      event.key === "Enter"
    ) {
      event.preventDefault();
    }

    const choiceNumber = Number(event.key);
    if (!checked && choiceNumber >= 1 && choiceNumber <= Math.min(9, question.choices.length)) {
      toggleChoice(choiceNumber - 1);
    } else if (event.key === "Enter") {
      if (checked) onNext();
      else checkAnswer();
    }
  });

  return (
    <div className="mt-8">
      <h1 className="text-2xl font-semibold leading-snug sm:text-3xl">{question.text}</h1>
      <p className="mt-3 text-sm text-muted-foreground">Select all correct answers.</p>
      <div role="group" aria-label="Answer choices" className="mt-6 space-y-2">
        {question.choices.map((choice, index) => {
          const isCorrect = question.correctIndices.includes(index);
          const isSelected = selected.has(index);
          const state = checked
            ? isCorrect
              ? "correct"
              : isSelected
                ? "wrong"
                : "idle"
            : isSelected
              ? "selected"
              : "idle";

          return (
            <button
              key={index}
              aria-pressed={isSelected}
              disabled={checked}
              onClick={() => toggleChoice(index)}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl border-2 bg-card px-4 py-3 text-left transition",
                state === "idle" && "border-border hover:border-primary/40",
                state === "selected" && "border-primary bg-secondary",
                state === "correct" && "border-success bg-success-soft",
                state === "wrong" && "border-destructive bg-danger-soft",
              )}
            >
              <kbd className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-semibold">
                {index + 1}
              </kbd>
              <span className="flex-1">{choice}</span>
              {state === "correct" && (
                <CheckCircle2 className="h-5 w-5 text-success" aria-label="Correct answer" />
              )}
              {state === "wrong" && (
                <XCircle className="h-5 w-5 text-destructive" aria-label="Your answer, incorrect" />
              )}
            </button>
          );
        })}
      </div>
      {checked && (
        <AnswerFeedback
          correct={correct}
          answer={question.answer}
          multiple={question.correctIndices.length > 1}
          explanation={question.explanation}
        />
      )}
      <div className="mt-6 flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Keys: 1–{Math.min(9, question.choices.length)} toggle
          {question.choices.length > 9 && ` · Select 10–${question.choices.length} on screen`} ·
          Enter {checked ? "continue" : "check"}
        </p>
        {checked ? (
          <Button size="lg" onClick={onNext}>
            {last ? "Finish" : "Next question"} <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button size="lg" disabled={selected.size === 0} onClick={checkAnswer}>
            Check answer
          </Button>
        )}
      </div>
    </div>
  );
}

function AnswerFeedback({
  correct,
  answer,
  multiple,
  explanation,
}: {
  correct: boolean;
  answer: string;
  multiple: boolean;
  explanation?: string;
}) {
  return (
    <div
      role="status"
      className={cn("mt-5 rounded-xl p-4", correct ? "bg-success-soft" : "bg-danger-soft")}
    >
      <p
        className={cn(
          "flex items-center gap-2 font-semibold",
          correct ? "text-success" : "text-destructive",
        )}
      >
        {correct ? (
          <>
            <CheckCircle2 className="h-5 w-5" /> Correct
          </>
        ) : (
          <>
            <XCircle className="h-5 w-5" /> Not quite — the correct{" "}
            {multiple ? "answers are" : "answer is"} “{answer}”
          </>
        )}
      </p>
      {explanation && <p className="mt-2 text-sm text-foreground">{explanation}</p>}
    </div>
  );
}
