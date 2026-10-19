import { createServerFn } from "@tanstack/react-start";

import type { AppState } from "./types";

export const loadStudyData = createServerFn({ method: "GET" }).handler(async () => {
  const { appDataRepository } = await import("./app-data.server");
  return appDataRepository.load();
});

export const saveStudyData = createServerFn({ method: "POST" })
  .validator((data: AppState) => data)
  .handler(async ({ data }) => {
    const { appDataRepository } = await import("./app-data.server");
    return appDataRepository.save(data);
  });

export const createStudyBackup = createServerFn({ method: "GET" }).handler(async () => {
  const { appDataRepository } = await import("./app-data.server");
  return appDataRepository.createBackup();
});

export const restoreStudyBackup = createServerFn({ method: "POST" })
  .validator((data: string) => data)
  .handler(async ({ data }) => {
    const { appDataRepository } = await import("./app-data.server");
    return appDataRepository.restoreBackup(data);
  });

export const openStudyDataDirectory = createServerFn({ method: "POST" }).handler(async () => {
  const { openAppDataDirectory } = await import("./open-data-directory.server");
  await openAppDataDirectory();
});
