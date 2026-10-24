import {
  ArchiveRestore,
  Database,
  Download,
  FolderOpen,
  LoaderCircle,
  Trash2,
  Upload,
} from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  deleteRecoveryQuestions,
  exportDataBackup,
  importDataBackup,
  listRecoveryQuestions,
  openDataDirectory,
  restoreRecoveryQuestions,
} from "@/lib/data/store";
import type { RecoveryQuestion } from "@/lib/data/types";

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
  const [recoveryOpen, setRecoveryOpen] = useState(false);
  const [recoveryItems, setRecoveryItems] = useState<RecoveryQuestion[]>([]);
  const [selectedRecovery, setSelectedRecovery] = useState<Set<string>>(new Set());
  const [recoveryBusy, setRecoveryBusy] = useState(false);

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

  const openRecovery = () => {
    setRecoveryOpen(true);
    setRecoveryBusy(true);
    void listRecoveryQuestions()
      .then((items) => {
        setRecoveryItems(items);
        setSelectedRecovery(new Set());
      })
      .catch((error) =>
        toast.error(error instanceof Error ? error.message : "Recovery could not be loaded."),
      )
      .finally(() => setRecoveryBusy(false));
  };

  const toggleRecovery = (id: string) =>
    setSelectedRecovery((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

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
          <DropdownMenuItem onSelect={openRecovery}>
            <ArchiveRestore aria-hidden />
            Recover deleted questions
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

      <AlertDialog open={recoveryOpen} onOpenChange={setRecoveryOpen}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <ArchiveRestore className="h-5 w-5" aria-hidden />
              Recover deleted questions
            </AlertDialogTitle>
            <AlertDialogDescription>
              Select one or more questions to restore. The original course and topic must still
              exist.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="max-h-80 space-y-2 overflow-y-auto py-2">
            {recoveryBusy && <p className="text-sm text-muted-foreground">Loading recovery…</p>}
            {!recoveryBusy && recoveryItems.length === 0 && (
              <p className="text-sm text-muted-foreground">No deleted questions are available.</p>
            )}
            {recoveryItems.map((item) => (
              <label
                key={item.id}
                className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 hover:bg-accent"
              >
                <Checkbox
                  checked={selectedRecovery.has(item.id)}
                  onCheckedChange={() => toggleRecovery(item.id)}
                  aria-label={`Select ${item.question.text}`}
                />
                <span className="min-w-0 text-sm">
                  <span className="block font-medium">{item.question.text}</span>
                  <span className="block text-xs text-muted-foreground">
                    Deleted {new Date(item.deletedAt).toLocaleString()} ·{" "}
                    {item.question.choices.length} choices
                  </span>
                </span>
              </label>
            ))}
          </div>
          <AlertDialogFooter>
            <Button
              variant="outline"
              disabled={!selectedRecovery.size || recoveryBusy}
              onClick={() => {
                const ids = [...selectedRecovery];
                setRecoveryBusy(true);
                void deleteRecoveryQuestions(ids)
                  .then(() => {
                    setRecoveryItems((items) =>
                      items.filter((item) => !selectedRecovery.has(item.id)),
                    );
                    setSelectedRecovery(new Set());
                    toast.success("Selected recovery items permanently deleted.");
                  })
                  .catch((error) =>
                    toast.error(
                      error instanceof Error
                        ? error.message
                        : "Recovery items could not be deleted.",
                    ),
                  )
                  .finally(() => setRecoveryBusy(false));
              }}
            >
              <Trash2 className="h-4 w-4" /> Permanently delete
            </Button>
            <AlertDialogCancel>Close</AlertDialogCancel>
            <Button
              disabled={!selectedRecovery.size || recoveryBusy}
              onClick={() => {
                const ids = [...selectedRecovery];
                setRecoveryBusy(true);
                void restoreRecoveryQuestions(ids)
                  .then(() => {
                    setRecoveryItems((items) =>
                      items.filter((item) => !selectedRecovery.has(item.id)),
                    );
                    setSelectedRecovery(new Set());
                    toast.success("Selected questions restored.");
                  })
                  .catch((error) =>
                    toast.error(
                      error instanceof Error ? error.message : "Questions could not be restored.",
                    ),
                  )
                  .finally(() => setRecoveryBusy(false));
              }}
            >
              <ArchiveRestore className="h-4 w-4" /> Restore selected
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
