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
import {
  MAX_ANSWER_CHOICES,
  type Course,
  type Question,
  type QuestionInput,
  type Topic,
} from "@/lib/data/types";

import { AnswerChoicesEditor } from "./answer-choices-editor";
import { validateQuestion } from "./validation";

interface QuestionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courses: Course[];
  topics: Topic[];
  initial?: Question;
  defaultCourseId: string;
  defaultTopicId: string;
  onSubmit: (question: QuestionInput) => void | Promise<void>;
}

function createBlankQuestion(courseId: string, topicId: string): QuestionInput {
  return {
    courseId,
    topicId,
    text: "",
    choices: [],
    correctIndices: [],
    answer: "",
    explanation: "",
  };
}

export function QuestionDialog({
  open,
  onOpenChange,
  courses,
  topics,
  initial,
  defaultCourseId,
  defaultTopicId,
  onSubmit,
}: QuestionDialogProps) {
  const [question, setQuestion] = useState<QuestionInput>(() =>
    createBlankQuestion(defaultCourseId, defaultTopicId),
  );
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    if (!open) return;
    setQuestion(initial ? { ...initial } : createBlankQuestion(defaultCourseId, defaultTopicId));
    setSubmitted(false);
    setSaveError("");
  }, [open, initial, defaultCourseId, defaultTopicId]);

  const errors = validateQuestion(question);
  const courseTopics = topics.filter((topic) => topic.courseId === question.courseId);
  const update = (patch: Partial<QuestionInput>) =>
    setQuestion((current) => ({ ...current, ...patch }));

  const selectClassName = "h-9 w-full rounded-md border border-input bg-card px-3 text-sm";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <form
          onSubmit={async (event) => {
            event.preventDefault();
            setSubmitted(true);
            if (errors.length) return;
            setSaving(true);
            setSaveError("");
            try {
              await onSubmit(question);
            } catch (cause) {
              setSaveError(
                cause instanceof Error ? cause.message : "The question could not be saved.",
              );
            } finally {
              setSaving(false);
            }
          }}
        >
          <DialogHeader>
            <DialogTitle>{initial ? "Edit question" : "Add question"}</DialogTitle>
            <DialogDescription>
              Add up to {MAX_ANSWER_CHOICES} choices and mark one or more correct answers, or leave
              choices empty for typed answers only.
            </DialogDescription>
          </DialogHeader>
          <div className="my-5 space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="question-course">Course</Label>
                <select
                  id="question-course"
                  className={selectClassName}
                  value={question.courseId}
                  onChange={(event) =>
                    update({
                      courseId: event.target.value,
                      topicId:
                        topics.find((topic) => topic.courseId === event.target.value)?.id ?? "",
                    })
                  }
                >
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="question-topic">Topic</Label>
                <select
                  id="question-topic"
                  className={selectClassName}
                  value={question.topicId}
                  onChange={(event) => update({ topicId: event.target.value })}
                >
                  {!courseTopics.length && <option value="">No topics in this course</option>}
                  {courseTopics.map((topic) => (
                    <option key={topic.id} value={topic.id}>
                      {topic.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="question-text">Question</Label>
              <Textarea
                id="question-text"
                autoFocus
                rows={3}
                value={question.text}
                onChange={(event) => update({ text: event.target.value })}
              />
            </div>
            <AnswerChoicesEditor
              choices={question.choices}
              correctIndices={question.correctIndices}
              onChange={(choices, correctIndices) => update({ choices, correctIndices })}
            />
            {question.choices.length === 0 && (
              <div className="space-y-1.5">
                <Label htmlFor="question-answer">Correct answer</Label>
                <Input
                  id="question-answer"
                  value={question.answer ?? ""}
                  onChange={(event) => update({ answer: event.target.value })}
                />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="question-explanation">
                Explanation <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Textarea
                id="question-explanation"
                rows={2}
                value={question.explanation ?? ""}
                onChange={(event) => update({ explanation: event.target.value })}
              />
            </div>
            {submitted && errors.length > 0 && (
              <ul role="alert" className="rounded-md bg-danger-soft p-3 text-sm text-destructive">
                {errors.map((error) => (
                  <li key={error}>• {error}</li>
                ))}
              </ul>
            )}
            {saveError && (
              <p role="alert" className="text-sm text-destructive">
                {saveError}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              disabled={saving}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : initial ? "Save question" : "Add question"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
