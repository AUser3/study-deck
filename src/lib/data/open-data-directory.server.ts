import "@tanstack/react-start/server-only";

import { execFile, spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import os from "node:os";
import { win32 as windowsPath } from "node:path";
import { promisify } from "node:util";

import { appDataRepository } from "./app-data.server";

const execFileAsync = promisify(execFile);

function launch(command: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { detached: true, stdio: "ignore" });
    child.once("error", reject);
    child.once("spawn", () => {
      child.unref();
      resolve();
    });
  });
}

function isWindowsSubsystemForLinux(): boolean {
  return Boolean(process.env.WSL_DISTRO_NAME) || os.release().toLowerCase().includes("microsoft");
}

async function openWindowsDirectory(directory: string): Promise<void> {
  // /n asks Explorer for a new window instead of silently reusing one in the background.
  await launch("explorer.exe", ["/n,", directory]);

  // Explorer is a long-running shell process, so launching it does not guarantee focus. Wait for
  // the exact folder window, restore it, raise it above the browser, then return it to the normal
  // (non-topmost) Z-order. SetForegroundWindow alone can be rejected by Windows focus protection.
  const title = windowsPath.basename(directory);
  const titleLiteral = `'${title.replaceAll("'", "''")}'`;
  const activate = `
Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
public static class StudydeckWindow {
  [DllImport("user32.dll")] public static extern bool ShowWindowAsync(IntPtr hWnd, int nCmdShow);
  [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);
  [DllImport("user32.dll")] public static extern bool SetWindowPos(IntPtr hWnd, IntPtr after, int x, int y, int width, int height, uint flags);
}
'@
$title = ${titleLiteral}
$window = $null
for ($i = 0; $i -lt 20 -and $null -eq $window; $i++) {
  Start-Sleep -Milliseconds 100
  $window = (New-Object -ComObject Shell.Application).Windows() |
    Where-Object { $_.LocationName -eq $title } |
    Select-Object -Last 1
}
if ($null -eq $window) { exit 1 }
$handle = [IntPtr]([long]$window.HWND)
$showWithoutMoveOrResize = 0x0001 -bor 0x0002 -bor 0x0040
[StudydeckWindow]::ShowWindowAsync($handle, 9) | Out-Null
[StudydeckWindow]::SetWindowPos($handle, [IntPtr](-1), 0, 0, 0, 0, $showWithoutMoveOrResize) | Out-Null
[StudydeckWindow]::SetWindowPos($handle, [IntPtr](-2), 0, 0, 0, 0, $showWithoutMoveOrResize) | Out-Null
[StudydeckWindow]::SetForegroundWindow($handle) | Out-Null
`;
  const encodedCommand = Buffer.from(activate, "utf16le").toString("base64");
  await execFileAsync("powershell.exe", [
    "-NoLogo",
    "-NoProfile",
    "-NonInteractive",
    "-EncodedCommand",
    encodedCommand,
  ]);
}

/** Opens Studydeck's fixed private data directory in the local OS file manager. */
export async function openAppDataDirectory(): Promise<void> {
  const directory = appDataRepository.directory;
  await mkdir(directory, { recursive: true });

  if (process.platform === "win32") {
    await openWindowsDirectory(directory);
    return;
  }
  if (process.platform === "darwin") {
    await launch("open", [directory]);
    return;
  }
  if (isWindowsSubsystemForLinux()) {
    const { stdout } = await execFileAsync("wslpath", ["-w", directory]);
    await openWindowsDirectory(stdout.trim());
    return;
  }
  await launch("xdg-open", [directory]);
}
