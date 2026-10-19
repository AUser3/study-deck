import "@tanstack/react-start/server-only";

import os from "node:os";
import path from "node:path";

export function resolveAppDataDirectory(): string {
  const override = process.env.STUDYDECK_DATA_DIR;
  if (override) return path.resolve(override);
  if (process.platform === "win32") {
    return path.join(
      process.env.LOCALAPPDATA ?? path.join(os.homedir(), "AppData", "Local"),
      "Studydeck",
    );
  }
  if (process.platform === "darwin") {
    return path.join(os.homedir(), "Library", "Application Support", "Studydeck");
  }
  return path.join(
    process.env.XDG_DATA_HOME ?? path.join(os.homedir(), ".local", "share"),
    "studydeck",
  );
}
