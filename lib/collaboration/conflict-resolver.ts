// ============================================
// CONFLICT RESOLVER — Pure function, no React, no side effects
// Task: EST-P3-002-D
// ============================================

export interface ConflictEvent {
  field: string;
  ourValue: unknown;
  theirValue: unknown;
  theirUserName: string;
  resolvedAt: number;
}

/**
 * Last-write-wins conflict resolution for collaborative editing.
 *
 * - Higher timestamp wins
 * - Equal timestamps: local wins (no conflict event returned)
 * - Returns ConflictEvent only when remote wins
 *
 * The `field` parameter must be supplied by the caller to label the conflict.
 */
export function resolveConflict(
  localUpdate: { value: unknown; timestamp: number },
  remoteUpdate: { value: unknown; timestamp: number; userName: string },
  field = "value",
): { winner: "local" | "remote"; conflict?: ConflictEvent } {
  // Equal timestamps — local wins, no conflict
  if (localUpdate.timestamp >= remoteUpdate.timestamp) {
    return { winner: "local" };
  }

  // Remote has a higher timestamp — remote wins, emit ConflictEvent
  const conflict: ConflictEvent = {
    field,
    ourValue: localUpdate.value,
    theirValue: remoteUpdate.value,
    theirUserName: remoteUpdate.userName,
    resolvedAt: Date.now(),
  };

  return { winner: "remote", conflict };
}
