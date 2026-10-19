import "@tanstack/react-start/server-only";

import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";

import type { BackupDocument } from "./backup";
import { MAX_EXAM_DOCUMENT_BYTES } from "./types";
import type { ManagedDocument } from "./types";

export interface DocumentUpload {
  fileName: string;
  mimeType: string;
  size: number;
  base64: string;
}

const safeStorageName = (value: string) => /^[a-f0-9-]+\.pdf$/.test(value);

function validateFileName(value: string): string {
  const name = value.trim();
  const hasControlCharacter = [...name].some((character) => character.charCodeAt(0) < 32);
  if (!name || name.length > 255 || hasControlCharacter) {
    throw new Error("The PDF file name is invalid.");
  }
  return name;
}

function decodePdf(base64: string, expectedSize: number): Buffer {
  if (
    !Number.isInteger(expectedSize) ||
    expectedSize <= 0 ||
    expectedSize > MAX_EXAM_DOCUMENT_BYTES
  ) {
    throw new Error("Old exam PDFs must be no larger than 20 MiB.");
  }
  const contents = Buffer.from(base64, "base64");
  if (
    contents.byteLength !== expectedSize ||
    contents.subarray(0, 5).toString("ascii") !== "%PDF-"
  ) {
    throw new Error("The selected file is not a valid PDF.");
  }
  return contents;
}

function validateDocument(document: ManagedDocument): void {
  if (!safeStorageName(document.storageName)) throw new Error("Unsafe document storage name.");
  validateFileName(document.fileName);
  if (document.mimeType !== "application/pdf") throw new Error("Old exam documents must be PDFs.");
  if (
    !Number.isInteger(document.size) ||
    document.size <= 0 ||
    document.size > MAX_EXAM_DOCUMENT_BYTES
  ) {
    throw new Error("Invalid old exam document size.");
  }
}

export class ManagedDocumentStore {
  private readonly documentsDirectory: string;

  constructor(private readonly dataDirectory: string) {
    this.documentsDirectory = path.join(dataDirectory, "documents");
  }

  async ensure(): Promise<void> {
    await mkdir(this.documentsDirectory, { recursive: true });
  }

  async save(upload: DocumentUpload): Promise<ManagedDocument> {
    if (upload.mimeType !== "application/pdf") throw new Error("Old exam documents must be PDFs.");
    const contents = decodePdf(upload.base64, upload.size);
    const document: ManagedDocument = {
      storageName: `${randomUUID()}.pdf`,
      fileName: validateFileName(upload.fileName),
      mimeType: "application/pdf",
      size: contents.byteLength,
    };
    await this.atomicWrite(document.storageName, contents);
    return document;
  }

  async read(document: ManagedDocument): Promise<string> {
    validateDocument(document);
    const contents = await readFile(path.join(this.documentsDirectory, document.storageName));
    if (contents.byteLength !== document.size) throw new Error("The stored PDF is incomplete.");
    return contents.toString("base64");
  }

  async verify(document: ManagedDocument): Promise<void> {
    validateDocument(document);
    const details = await stat(path.join(this.documentsDirectory, document.storageName));
    if (!details.isFile() || details.size !== document.size) {
      throw new Error(`The managed PDF ${document.fileName} is missing or incomplete.`);
    }
  }

  async export(document: ManagedDocument): Promise<BackupDocument> {
    return { ...document, base64: await this.read(document) };
  }

  async restore(document: BackupDocument): Promise<void> {
    validateDocument(document);
    await this.atomicWrite(document.storageName, decodePdf(document.base64, document.size));
  }

  async remove(document: ManagedDocument): Promise<void> {
    validateDocument(document);
    await rm(path.join(this.documentsDirectory, document.storageName), { force: true });
  }

  private async atomicWrite(storageName: string, contents: Buffer): Promise<void> {
    if (!safeStorageName(storageName)) throw new Error("Unsafe document storage name.");
    await this.ensure();
    const target = path.join(this.documentsDirectory, storageName);
    const temporary = `${target}.${process.pid}.${randomUUID()}.tmp`;
    await writeFile(temporary, contents);
    try {
      await rename(temporary, target);
    } catch (error) {
      await rm(temporary, { force: true });
      throw error;
    }
  }
}
