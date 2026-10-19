import { migrateAppState } from "./app-state-codec";
import { MAX_EXAM_DOCUMENT_BYTES } from "./types";
import type { AppState, ManagedDocument } from "./types";

export const BACKUP_SCHEMA_VERSION = 1 as const;

export interface StudyBackup {
  schemaVersion: typeof BACKUP_SCHEMA_VERSION;
  exportedAt: string;
  state: AppState;
  documents: BackupDocument[];
}

export interface BackupDocument extends ManagedDocument {
  base64: string;
}

function fail(message: string): never {
  throw new Error(`Invalid Studydeck backup: ${message}`);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function createBackup(
  state: AppState,
  exportedAt = new Date().toISOString(),
  documents: BackupDocument[] = [],
): StudyBackup {
  return { schemaVersion: BACKUP_SCHEMA_VERSION, exportedAt, state, documents };
}

export function serializeBackup(
  state: AppState,
  exportedAt?: string,
  documents: BackupDocument[] = [],
): string {
  return `${JSON.stringify(createBackup(state, exportedAt, documents), null, 2)}\n`;
}

export function parseBackup(raw: string): StudyBackup {
  let value: unknown;
  try {
    value = JSON.parse(raw) as unknown;
  } catch {
    return fail("the file is not valid JSON.");
  }
  if (!isRecord(value) || value.schemaVersion !== BACKUP_SCHEMA_VERSION) {
    return fail(`schemaVersion must be ${BACKUP_SCHEMA_VERSION}.`);
  }
  if (typeof value.exportedAt !== "string" || Number.isNaN(Date.parse(value.exportedAt))) {
    return fail("exportedAt must be a valid date.");
  }
  const state = migrateAppState(value.state);
  const documentValues = value.documents === undefined ? [] : value.documents;
  if (!Array.isArray(documentValues)) return fail("documents must be an array.");
  const documents = documentValues.map((document, index) => {
    if (!isRecord(document)) return fail(`documents[${index}] must be an object.`);
    if (
      typeof document.storageName !== "string" ||
      !/^[a-f0-9-]+\.pdf$/.test(document.storageName)
    ) {
      return fail(`documents[${index}].storageName is invalid.`);
    }
    if (typeof document.fileName !== "string" || !document.fileName.trim()) {
      return fail(`documents[${index}].fileName is required.`);
    }
    if (document.mimeType !== "application/pdf") {
      return fail(`documents[${index}] must be a PDF.`);
    }
    if (
      typeof document.size !== "number" ||
      !Number.isInteger(document.size) ||
      document.size <= 0 ||
      document.size > MAX_EXAM_DOCUMENT_BYTES
    ) {
      return fail(`documents[${index}].size is invalid.`);
    }
    if (typeof document.base64 !== "string" || !document.base64) {
      return fail(`documents[${index}].base64 is required.`);
    }
    return {
      storageName: document.storageName,
      fileName: document.fileName,
      mimeType: "application/pdf" as const,
      size: document.size,
      base64: document.base64,
    };
  });
  const expectedDocuments = new Map(
    state.oldExams.map((exam) => [exam.document.storageName, exam.document]),
  );
  const expected = new Set(expectedDocuments.keys());
  const included = new Set(documents.map((document) => document.storageName));
  if (included.size !== documents.length || expected.size !== included.size) {
    return fail("documents must match the old exams in the backup.");
  }
  for (const storageName of expected) {
    if (!included.has(storageName)) return fail("an old exam document is missing.");
    const expectedDocument = expectedDocuments.get(storageName);
    const includedDocument = documents.find((document) => document.storageName === storageName);
    if (
      !expectedDocument ||
      !includedDocument ||
      expectedDocument.fileName !== includedDocument.fileName ||
      expectedDocument.mimeType !== includedDocument.mimeType ||
      expectedDocument.size !== includedDocument.size
    ) {
      return fail("document metadata does not match its old exam.");
    }
  }
  return {
    schemaVersion: BACKUP_SCHEMA_VERSION,
    exportedAt: value.exportedAt,
    state,
    documents,
  };
}
