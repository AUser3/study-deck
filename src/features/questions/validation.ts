import { MAX_ANSWER_CHOICES, type QuestionInput } from "@/lib/data/types";

export function validateQuestion(question: QuestionInput): string[] {
  const errors: string[] = [];
  const choices = question.choices.map((choice) => choice.trim());

  if (!question.text.trim()) errors.push("Enter the question text.");
  if (!question.topicId) errors.push("Choose a topic.");

  if (choices.length > 0) {
    if (choices.length > MAX_ANSWER_CHOICES) {
      errors.push(`Use no more than ${MAX_ANSWER_CHOICES} answer choices.`);
    }
    if (choices.some((choice) => !choice)) errors.push("Fill in or remove empty choices.");
    const validCorrectIndices = new Set(
      question.correctIndices.filter((index) => index >= 0 && index < choices.length),
    );
    if (validCorrectIndices.size !== question.correctIndices.length) {
      errors.push("Correct answers must refer to existing choices.");
    } else if (validCorrectIndices.size === 0) {
      errors.push("Mark at least one choice as correct.");
    }
  } else if (!question.answer?.trim()) {
    errors.push("Enter the correct answer.");
  }

  return errors;
}
