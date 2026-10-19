import { Link } from "@tanstack/react-router";
import { AlertCircle, X } from "lucide-react";
import { useCallback, useEffect, useState, type ReactNode } from "react";

import { EmptyState } from "@/components/empty-state";
import { Loading } from "@/components/loading";
import { ProgressBar } from "@/components/progress-bar";
import { Button } from "@/components/ui/button";
import { getState, recordAttempt, useAppState } from "@/lib/data/store";
import { shuffle } from "@/lib/data/matching";
import type { Question, StudyMode } from "@/lib/data/types";
import { toast } from "sonner";

import { MultipleChoiceCard } from "./multiple-choice-card";
import { SessionSummary, type StudyResult } from "./session-summary";
import { TypedAnswerCard } from "./typed-answer-card";

interface StudySessionProps {
  courseId: string;
  topicIds: string;
  mode: StudyMode;
}

export function StudySession({ courseId, topicIds, mode }: StudySessionProps) {
  const state = useAppState();
  const storeReady = state !== null;
  const [queue, setQueue] = useState<Question[] | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<StudyResult[]>([]);
  const [finished, setFinished] = useState(false);
  const [skippedCount, setSkippedCount] = useState(0);

  const buildQueue = useCallback(() => {
    const selectedTopicIds = new Set(topicIds.split(",").filter(Boolean));
    const selectedQuestions = getState().questions.filter(
      (question) => question.courseId === courseId && selectedTopicIds.has(question.topicId),
    );
    const eligibleQuestions =
      mode === "mc"
        ? selectedQuestions.filter((question) => question.choices.length > 0)
        : selectedQuestions;

    setSkippedCount(selectedQuestions.length - eligibleQuestions.length);
    setQueue(shuffle(eligibleQuestions));
    setCurrentIndex(0);
    setResults([]);
    setFinished(false);
  }, [courseId, topicIds, mode]);

  useEffect(() => {
    if (storeReady) buildQueue();
  }, [storeReady, buildQueue]);

  if (!state || !queue) return <Loading />;

  const course = state.courses.find((item) => item.id === courseId);
  const backLink = course ? (
    <Link
      to="/courses/$courseId"
      params={{ courseId }}
      className="text-sm text-muted-foreground hover:text-foreground"
    >
      ← {course.name}
    </Link>
  ) : (
    <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
      ← Dashboard
    </Link>
  );

  if (queue.length === 0) {
    return (
      <StudyFrame>
        {backLink}
        <div className="mt-8">
          <EmptyState
            icon={<AlertCircle className="h-6 w-6" />}
            title="No eligible questions"
            actions={
              course && (
                <Button asChild>
                  <Link to="/courses/$courseId" params={{ courseId }}>
                    Back to course
                  </Link>
                </Button>
              )
            }
          >
            {mode === "mc" && skippedCount > 0
              ? `The selected topics have ${skippedCount} questions, but none have answer choices. Try typed-answer mode instead.`
              : "The selected topics don't contain any questions yet."}
          </EmptyState>
        </div>
      </StudyFrame>
    );
  }

  if (finished) {
    return (
      <StudyFrame>
        {backLink}
        <SessionSummary
          results={results}
          questions={queue}
          courseId={course?.id}
          onRestart={buildQueue}
        />
      </StudyFrame>
    );
  }

  const question = queue[currentIndex];
  const onResult = (correct: boolean) => {
    void recordAttempt(question.id, correct, mode).catch((error: unknown) => {
      toast.error(error instanceof Error ? error.message : "Could not save study progress.");
    });
    setResults((current) => [...current, { id: question.id, correct }]);
  };
  const next = () => {
    if (currentIndex + 1 >= queue.length) setFinished(true);
    else setCurrentIndex((index) => index + 1);
  };
  const last = currentIndex + 1 === queue.length;

  return (
    <StudyFrame>
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          Question <strong className="text-foreground">{currentIndex + 1}</strong> of {queue.length}
          <span className="ml-2">· {mode === "mc" ? "Multiple choice" : "Typed answer"}</span>
        </p>
        <Button variant="ghost" size="sm" onClick={() => setFinished(true)}>
          <X className="h-4 w-4" /> End session
        </Button>
      </div>
      <div className="mt-3">
        <ProgressBar value={currentIndex / queue.length} label="Session progress" />
      </div>
      {mode === "mc" && skippedCount > 0 && currentIndex === 0 && (
        <p className="mt-3 text-xs text-muted-foreground">
          {skippedCount} questions without choices were left out of this multiple-choice session.
        </p>
      )}
      {mode === "mc" ? (
        <MultipleChoiceCard
          key={question.id}
          question={question}
          onResult={onResult}
          onNext={next}
          last={last}
        />
      ) : (
        <TypedAnswerCard
          key={question.id}
          question={question}
          onResult={onResult}
          onNext={next}
          last={last}
        />
      )}
    </StudyFrame>
  );
}

function StudyFrame({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:py-14">{children}</div>
    </div>
  );
}
