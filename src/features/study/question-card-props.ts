import type { Question } from "@/lib/data/types";

export interface QuestionCardProps {
  question: Question;
  onResult: (correct: boolean) => void;
  onNext: () => void;
  last: boolean;
}
