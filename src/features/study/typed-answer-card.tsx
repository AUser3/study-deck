import { AlertCircle, ArrowRight, CheckCircle2, Pin, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { answersMatch } from "@/lib/data/matching";
import { togglePinned } from "@/lib/data/store";
import { cn } from "@/lib/utils";

import type { QuestionCardProps } from "./question-card-props";
import { useStudyKeys } from "./use-study-keys";

export function TypedAnswerCard({ question, onResult, onNext, last }: QuestionCardProps) {
  const [value, setValue] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [judged, setJudged] = useState<boolean | null>(null);
  const autoMatch = revealed && answersMatch(value, question.answer);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => inputRef.current?.focus(), []);

  const judge = (correct: boolean) => {
    if (judged !== null) return;
    setJudged(correct);
    onResult(correct);
  };

  useStudyKeys((event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    if (!revealed) setRevealed(true);
    else if (judged === null) judge(autoMatch);
    else onNext();
  });

  return (
    <div className="surface relative mt-8 rounded-[2rem] p-5 sm:p-8">
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-4 top-4"
        aria-label={question.pinned ? "Unpin question" : "Pin question"}
        aria-pressed={question.pinned}
        onClick={() => void togglePinned(question.id, !question.pinned)}
      >
        <Pin
          className={question.pinned ? "text-primary drop-shadow-sm" : "text-muted-foreground"}
          fill={question.pinned ? "currentColor" : "none"}
          strokeWidth={question.pinned ? 2.5 : 2}
        />
      </Button>
      <div className="mb-6 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
        <span className="h-2 w-2 rounded-full bg-primary shadow-[0_0_12px_currentColor]" />
        Recall from memory
      </div>
      <h1 className="text-2xl font-semibold leading-snug sm:text-3xl">{question.text}</h1>
      <Input
        ref={inputRef}
        className="mt-6 h-12 text-base"
        placeholder="Type your answer…"
        value={value}
        disabled={revealed}
        onChange={(event) => setValue(event.target.value)}
        aria-label="Your answer"
      />
      {revealed && (
        <div className="mt-5 rounded-xl border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Expected answer</p>
          <p className="mt-1 text-lg font-medium">{question.answer}</p>
          <p
            className={cn(
              "mt-2 flex items-center gap-1.5 text-sm",
              autoMatch ? "text-success" : "text-muted-foreground",
            )}
          >
            {autoMatch ? (
              <>
                <CheckCircle2 className="h-4 w-4" /> Your answer matches.
              </>
            ) : (
              <>
                <AlertCircle className="h-4 w-4" /> No exact match — judge for yourself.
              </>
            )}
          </p>
          {question.explanation && (
            <p className="mt-3 text-sm text-muted-foreground">{question.explanation}</p>
          )}
          {judged === null ? (
            <div className="mt-4 flex flex-wrap gap-2">
              <Button onClick={() => judge(true)} variant={autoMatch ? "default" : "outline"}>
                <CheckCircle2 className="h-4 w-4" /> I was right
              </Button>
              <Button onClick={() => judge(false)} variant={autoMatch ? "outline" : "default"}>
                <RotateCcw className="h-4 w-4" /> Need review
              </Button>
            </div>
          ) : (
            <p className={cn("mt-4 text-sm font-medium", judged ? "text-success" : "text-warning")}>
              {judged ? "✓ Marked correct" : "↺ Marked for review"}
            </p>
          )}
        </div>
      )}
      <div className="mt-6 flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Enter{" "}
          {!revealed
            ? "to reveal"
            : judged === null
              ? `to mark ${autoMatch ? "right" : "for review"}`
              : "to continue"}
        </p>
        {!revealed ? (
          <Button size="lg" onClick={() => setRevealed(true)}>
            Check answer
          </Button>
        ) : (
          judged !== null && (
            <Button size="lg" onClick={onNext}>
              {last ? "Finish" : "Next question"} <ArrowRight className="h-4 w-4" />
            </Button>
          )
        )}
      </div>
    </div>
  );
}
