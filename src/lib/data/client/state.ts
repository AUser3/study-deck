import { useSyncExternalStore } from "react";

import {
  createStudyBackup,
  loadStudyData,
  openStudyDataDirectory,
  restoreStudyBackup,
  saveStudyData,
} from "../app-data.functions";
import { EMPTY_CATALOG } from "../catalog";
import { APP_STATE_VERSION } from "../types";
import type { AppState } from "../types";

const EMPTY: AppState = { version: APP_STATE_VERSION, ...EMPTY_CATALOG, attempts: [] };
const SERVER_STATE: AppState & { __server?: true } = { ...EMPTY, __server: true };

let state: AppState = EMPTY;
let started = false;
let ready = false;
let loadError: Error | null = null;
let writeQueue: Promise<void> = Promise.resolve();

const stateListeners = new Set<() => void>();

export const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);

function emitState() {
  stateListeners.forEach((listener) => listener());
}

function start() {
  if (started || typeof window === "undefined") return;
  started = true;
  void loadStudyData()
    .then((loaded) => {
      state = loaded;
      ready = true;
      emitState();
    })
    .catch((error: unknown) => {
      loadError = error instanceof Error ? error : new Error("Study data could not be loaded.");
      ready = true;
      emitState();
    });
}

function subscribeState(listener: () => void) {
  stateListeners.add(listener);
  return () => stateListeners.delete(listener);
}

/** Returns null while the application-data JSON is loading. */
export function useAppState(): AppState | null {
  const snapshot = useSyncExternalStore(
    subscribeState,
    () => {
      start();
      return state;
    },
    () => SERVER_STATE,
  );
  if (loadError) throw loadError;
  if ((snapshot as typeof SERVER_STATE).__server || !ready) return null;
  return snapshot;
}

export const getState = () => {
  start();
  return state;
};

function enqueue<T>(operation: () => Promise<T>): Promise<T> {
  const result = writeQueue.then(operation, operation);
  writeQueue = result.then(
    () => undefined,
    () => undefined,
  );
  return result;
}

export function transact<T>(
  update: (current: AppState) => { next: AppState; result: T },
): Promise<T> {
  return enqueue(async () => {
    const { next, result } = update(state);
    state = await saveStudyData({ data: next });
    emitState();
    return result;
  });
}

export function openDataDirectory(): Promise<void> {
  return openStudyDataDirectory();
}

export function exportDataBackup(): Promise<string> {
  return createStudyBackup();
}

export function importDataBackup(raw: string): Promise<void> {
  return enqueue(async () => {
    state = await restoreStudyBackup({ data: raw });
    ready = true;
    loadError = null;
    emitState();
  });
}
