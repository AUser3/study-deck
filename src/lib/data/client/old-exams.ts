import {
  loadOldExamDocument,
  removeOldExamDocument,
  saveOldExamDocument,
} from "../app-data.functions";
import { MAX_EXAM_DOCUMENT_BYTES } from "../types";
import type { ID, OldExam } from "../types";
import { transact, uid } from "./state";

export interface OldExamInput {
  title: string;
  year?: number;
  description?: string;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("The PDF could not be read."));
    reader.onload = () => {
      if (typeof reader.result !== "string") return reject(new Error("The PDF could not be read."));
      resolve(reader.result.slice(reader.result.indexOf(",") + 1));
    };
    reader.readAsDataURL(file);
  });
}

function validateFile(file: File): void {
  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    throw new Error("Old exams must be uploaded as PDF files.");
  }
  if (file.size <= 0 || file.size > MAX_EXAM_DOCUMENT_BYTES) {
    throw new Error("Old exam PDFs must be no larger than 20 MiB.");
  }
}

export async function createOldExam(
  courseId: ID,
  input: OldExamInput,
  file: File,
): Promise<OldExam> {
  validateFile(file);
  const document = await saveOldExamDocument({
    data: {
      fileName: file.name,
      mimeType: "application/pdf",
      size: file.size,
      base64: await fileToBase64(file),
    },
  });
  try {
    return await transact((current) => {
      const now = Date.now();
      const exam: OldExam = {
        id: uid(),
        courseId,
        title: input.title.trim(),
        year: input.year,
        description: input.description?.trim() || undefined,
        document,
        createdAt: now,
        updatedAt: now,
      };
      return { next: { ...current, oldExams: [...current.oldExams, exam] }, result: exam };
    });
  } catch (error) {
    await removeOldExamDocument({ data: document }).catch(() => undefined);
    throw error;
  }
}

export function updateOldExam(id: ID, input: OldExamInput): Promise<void> {
  return transact((current) => ({
    next: {
      ...current,
      oldExams: current.oldExams.map((exam) =>
        exam.id === id
          ? {
              ...exam,
              title: input.title.trim(),
              year: input.year,
              description: input.description?.trim() || undefined,
              updatedAt: Date.now(),
            }
          : exam,
      ),
    },
    result: undefined,
  }));
}

export function deleteOldExam(id: ID): Promise<void> {
  return transact((current) => ({
    next: { ...current, oldExams: current.oldExams.filter((exam) => exam.id !== id) },
    result: undefined,
  }));
}

export async function readOldExam(exam: OldExam): Promise<Blob> {
  const base64 = await loadOldExamDocument({ data: exam.document });
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return new Blob([bytes], { type: exam.document.mimeType });
}
