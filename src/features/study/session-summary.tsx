import { Link } from "@tanstack/react-router";
import { RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { Question } from "@/lib/data/types";
import { cn } from "@/lib/utils";

export interface StudyResult {
  id: string;
  correct: boolean;
}

interface SessionSummaryProps {
  results: StudyResult[];
  questions: Question[];
  courseId?: string;
  onRestart: () => void;
}

export function SessionSummary({ results, questions, courseId, onRestart }: SessionSummaryProps) {
  const correctCount = results.filter((result) => result.correct).length;
  const reviewQuestions = results
    .filter((result) => !result.correct)
    .map((result) => questions.find((question) => question.id === result.id))
    .filter((question): question is Question => Boolean(question));

  return (
    <div className="mesh-gradient shimmer mt-8 rounded-[2rem] border border-white/70 p-6 shadow-card sm:p-8">
      <div className="relative">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Nice work</p>
        <h1 className="mt-2 text-3xl font-semibold">Session complete</h1>
      </div>
      <dl className="relative mt-6 grid grid-cols-3 gap-3 text-center">
        <SummaryStat label="Reviewed" value={results.length} />
        <SummaryStat label="Correct" value={correctCount} tone="success" />
        <SummaryStat label="Need review" value={reviewQuestions.length} tone="warning" />
      </dl>
      {reviewQuestions.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold">Questions to review</h2>
          <ul className="mt-2 divide-y divide-border text-sm">
            {reviewQuestions.map((question) => (
              <li key={question.id} className="py-2">
                <p>{question.text}</p>
                <p className="text-success">✓ {question.answer}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="relative mt-8 flex flex-wrap gap-2">
        <Button onClick={onRestart}>
          <RotateCcw className="h-4 w-4" /> Study again
        </Button>
        {courseId && (
          <Button variant="outline" asChild>
            <Link to="/courses/$courseId" params={{ courseId }}>
              Back to course
            </Link>
          </Button>
        )}
        <Button variant="ghost" asChild>
          <Link to="/">Dashboard</Link>
        </Button>
      </div>
    </div>
  );
}

function SummaryStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "success" | "warning";
}) {
  return (
    <div className="rounded-xl bg-muted p-4">
      <dd
        className={cn(
          "font-display text-3xl font-semibold",
          tone === "success" && "text-success",
          tone === "warning" && "text-warning",
        )}
      >
        {value}
      </dd>
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
    </div>
  );
}
