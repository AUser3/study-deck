import { ArchiveRestore, Database, Download, FolderOpen, LoaderCircle, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { exportDataBackup, importDataBackup, openDataDirectory } from "@/lib/data/store";

interface PendingRestore {
  name: string;
  contents: string;
}

function backupFileName() {
  return `studydeck-backup-${new Date().toISOString().slice(0, 10)}.json`;
}

function download(contents: string) {
  const url = URL.createObjectURL(new Blob([contents], { type: "application/json" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = backupFileName();
  link.click();
  URL.revokeObjectURL(url);
}

export function DataActions() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [pendingRestore, setPendingRestore] = useState<PendingRestore | null>(null);

  const run = async (operation: () => Promise<void>, fallback: string) => {
    setBusy(true);
    try {
      await operation();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : fallback);
    } finally {
      setBusy(false);
    }
  };

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      setPendingRestore({ name: file.name, contents: await file.text() });
    } catch {
      toast.error("The selected backup could not be read.");
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(event) => void handleFile(event.target.files?.[0])}
      />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="ml-auto shrink-0"
            disabled={busy}
          >
            {busy ? (
              <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Database className="h-4 w-4" aria-hidden />
            )}
            Data
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuItem
            onSelect={() =>
              void run(openDataDirectory, "The Studydeck data folder could not be opened.")
            }
          >
            <FolderOpen aria-hidden />
            Open data folder
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() =>
              void run(async () => download(await exportDataBackup()), "Backup failed.")
            }
          >
            <Download aria-hidden />
            Download backup
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => inputRef.current?.click()}>
            <Upload aria-hidden />
            Restore backup
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog
        open={pendingRestore !== null}
        onOpenChange={(open) => !open && setPendingRestore(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <ArchiveRestore className="h-5 w-5" aria-hidden />
              Replace all study data?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Restoring {pendingRestore?.name} replaces your current courses and progress. Download
              a backup first if you may need the current data later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const restore = pendingRestore;
                setPendingRestore(null);
                if (!restore) return;
                void run(async () => {
                  await importDataBackup(restore.contents);
                  toast.success("Study data restored.");
                }, "The backup could not be restored.");
              }}
            >
              Restore backup
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
