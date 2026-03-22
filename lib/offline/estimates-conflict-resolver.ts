/**
 * EST-P3-003 - Timestamp-based conflict resolution for estimates edits.
 * Pure function, no side effects.
 */

import type { EditRecord } from "./estimates-sync";
import type { SyncConflict } from "@/app/actions/estimates";

export function resolveEditConflicts(
  localEdits: EditRecord[],
  serverUpdates: Array<{
    itemId: string;
    field: string;
    value: unknown;
    updatedAt: string;
  }>,
): {
  toApply: EditRecord[];
  conflicts: SyncConflict[];
} {
  const toApply: EditRecord[] = [];
  const conflicts: SyncConflict[] = [];

  for (const localEdit of localEdits) {
    const serverUpdate = serverUpdates.find(
      (s) => s.itemId === localEdit.itemId && s.field === localEdit.field,
    );

    // No server update for this field — local edit has no conflict
    if (!serverUpdate) {
      toApply.push(localEdit);
      continue;
    }

    const serverTimestamp = Date.parse(serverUpdate.updatedAt);

    // Local edit is newer — local wins
    if (localEdit.timestamp > serverTimestamp) {
      toApply.push(localEdit);
    } else {
      // Server is same age or newer — server wins
      conflicts.push({
        itemId: localEdit.itemId,
        field: localEdit.field,
        localValue: localEdit.value,
        localTimestamp: localEdit.timestamp,
        serverValue: serverUpdate.value,
        serverTimestamp,
        resolution: "server_wins",
      });
    }
  }

  return { toApply, conflicts };
}
