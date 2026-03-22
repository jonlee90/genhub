/**
 * EST-P3-003 - IndexedDB wrapper for estimates offline edits.
 * Uses a separate database ("genhub-estimates") from the spatial module.
 */

import { openDB } from "idb";
import type { DBSchema, IDBPDatabase } from "idb";

interface EstimatesOfflineDB extends DBSchema {
  edits: {
    key: string; // `${estimateId}:${itemId}:${field}`
    value: {
      estimateId: string;
      itemId: string;
      field: string;
      value: unknown;
      timestamp: number;
      synced: boolean;
    };
  };
  uploads: {
    key: string; // UUID
    value: {
      id: string;
      estimateId: string;
      fileBlob: Blob;
      filename: string;
      timestamp: number;
      synced: boolean;
    };
  };
  deletions: {
    key: string; // itemId
    value: {
      itemId: string;
      estimateId: string;
      timestamp: number;
      synced: boolean;
    };
  };
}

export type EditRecord = EstimatesOfflineDB["edits"]["value"];
export type UploadRecord = EstimatesOfflineDB["uploads"]["value"];
export type DeletionRecord = EstimatesOfflineDB["deletions"]["value"];

const DB_NAME = "genhub-estimates";
const DB_VERSION = 1;

let dbInstance: IDBPDatabase<EstimatesOfflineDB> | null = null;

async function getDB(): Promise<IDBPDatabase<EstimatesOfflineDB>> {
  if (dbInstance) {
    return dbInstance;
  }

  dbInstance = await openDB<EstimatesOfflineDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains("edits")) {
        db.createObjectStore("edits");
      }
      if (!db.objectStoreNames.contains("uploads")) {
        db.createObjectStore("uploads");
      }
      if (!db.objectStoreNames.contains("deletions")) {
        db.createObjectStore("deletions");
      }
    },
  });

  return dbInstance;
}

export async function queueEdit(edit: EditRecord): Promise<void> {
  const db = await getDB();
  const key = `${edit.estimateId}:${edit.itemId}:${edit.field}`;
  await db.put("edits", edit, key);
}

export async function queueUpload(upload: UploadRecord): Promise<void> {
  const db = await getDB();
  await db.put("uploads", upload, upload.id);
}

export async function queueDeletion(deletion: DeletionRecord): Promise<void> {
  const db = await getDB();
  await db.put("deletions", deletion, deletion.itemId);
}

export async function getPendingChanges(): Promise<{
  edits: EditRecord[];
  uploads: UploadRecord[];
  deletions: DeletionRecord[];
}> {
  const db = await getDB();

  // Parallel fetch of all stores (async-parallel skill)
  const [allEdits, allUploads, allDeletions] = await Promise.all([
    db.getAll("edits"),
    db.getAll("uploads"),
    db.getAll("deletions"),
  ]);

  return {
    edits: allEdits.filter((e) => !e.synced),
    uploads: allUploads.filter((u) => !u.synced),
    deletions: allDeletions.filter((d) => !d.synced),
  };
}

export async function markSynced(
  type: "edit" | "upload" | "deletion",
  key: string,
): Promise<void> {
  const db = await getDB();

  if (type === "edit") {
    const record = await db.get("edits", key);
    if (record) {
      await db.put("edits", { ...record, synced: true }, key);
    }
  } else if (type === "upload") {
    const record = await db.get("uploads", key);
    if (record) {
      await db.put("uploads", { ...record, synced: true }, key);
    }
  } else {
    const record = await db.get("deletions", key);
    if (record) {
      await db.put("deletions", { ...record, synced: true }, key);
    }
  }
}

export async function clearSynced(): Promise<void> {
  const db = await getDB();

  // Parallel fetch of all stores (async-parallel skill)
  const [allEdits, allUploads, allDeletions] = await Promise.all([
    db.getAll("edits"),
    db.getAll("uploads"),
    db.getAll("deletions"),
  ]);

  const syncedEditKeys = allEdits
    .filter((e) => e.synced)
    .map((e) => `${e.estimateId}:${e.itemId}:${e.field}`);
  const syncedUploadKeys = allUploads.filter((u) => u.synced).map((u) => u.id);
  const syncedDeletionKeys = allDeletions
    .filter((d) => d.synced)
    .map((d) => d.itemId);

  // Parallel delete across all stores (async-parallel skill)
  await Promise.all([
    ...syncedEditKeys.map((key) => db.delete("edits", key)),
    ...syncedUploadKeys.map((key) => db.delete("uploads", key)),
    ...syncedDeletionKeys.map((key) => db.delete("deletions", key)),
  ]);
}
