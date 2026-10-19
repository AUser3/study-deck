import { migrateAppState } from "./app-state-codec";
import type { AppState } from "./types";

export const BACKUP_SCHEMA_VERSION = 1 as const;

export interface StudyBackup {
  schemaVersion: typeof BACKUP_SCHEMA_VERSION;
  exportedAt: string;
  state: AppState;
}

function fail(message: string): never {
  throw new Error(`Invalid Studydeck backup: ${message}`);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function createBackup(state: AppState, exportedAt = new Date().toISOString()): StudyBackup {
  return { schemaVersion: BACKUP_SCHEMA_VERSION, exportedAt, state };
}

export function serializeBackup(state: AppState, exportedAt?: string): string {
  return `${JSON.stringify(createBackup(state, exportedAt), null, 2)}\n`;
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
  return {
    schemaVersion: BACKUP_SCHEMA_VERSION,
    exportedAt: value.exportedAt,
    state: migrateAppState(value.state),
  };
}
