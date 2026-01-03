/**
 * P5.4 - Conflict Resolution
 * Detects and resolves conflicts between offline edits and server changes
 */

console.log('[ConflictResolver] Module loaded');

export interface MarkerConflict {
  markerId: string;
  conflictType: 'title' | 'position' | 'content' | 'deleted';
  localVersion: any;
  serverVersion: any;
  localTimestamp: number;
  serverTimestamp: number;
  localUser: string;
  serverUser: string;
}

export type ConflictResolution = 'keep-mine' | 'keep-theirs' | 'merge';

/**
 * Detect conflicts between local and server marker data
 */
export function detectMarkerConflicts(
  localMarker: {
    id: string;
    title: string;
    position: { x: number; y: number; z: number };
    updatedAt: number;
    createdBy: string;
  },
  serverMarker: {
    id: string;
    title: string;
    position: { x: number; y: number; z: number };
    updatedAt: number;
    createdBy: string;
  } | null,
  lastSyncedAt: number
): MarkerConflict[] {
  console.log('[ConflictResolver] Detecting conflicts:', {
    markerId: localMarker.id,
    lastSyncedAt,
    localUpdatedAt: localMarker.updatedAt,
    serverUpdatedAt: serverMarker?.updatedAt,
  });

  const conflicts: MarkerConflict[] = [];

  // Conflict: Server marker deleted
  if (!serverMarker) {
    console.log('[ConflictResolver] Conflict: Server marker deleted');
    conflicts.push({
      markerId: localMarker.id,
      conflictType: 'deleted',
      localVersion: localMarker,
      serverVersion: null,
      localTimestamp: localMarker.updatedAt,
      serverTimestamp: Date.now(),
      localUser: localMarker.createdBy,
      serverUser: 'unknown',
    });
    return conflicts;
  }

  // Check if both local and server were modified since last sync
  const localModifiedSinceSync = localMarker.updatedAt > lastSyncedAt;
  const serverModifiedSinceSync = serverMarker.updatedAt > lastSyncedAt;

  if (!localModifiedSinceSync || !serverModifiedSinceSync) {
    console.log('[ConflictResolver] No conflicts (not modified on both sides)');
    return conflicts;
  }

  console.log('[ConflictResolver] Both sides modified since sync, checking fields');

  // Conflict: Title changed on both sides
  if (localMarker.title !== serverMarker.title) {
    console.log('[ConflictResolver] Conflict: Title changed on both sides');
    conflicts.push({
      markerId: localMarker.id,
      conflictType: 'title',
      localVersion: localMarker.title,
      serverVersion: serverMarker.title,
      localTimestamp: localMarker.updatedAt,
      serverTimestamp: serverMarker.updatedAt,
      localUser: localMarker.createdBy,
      serverUser: serverMarker.createdBy,
    });
  }

  // Conflict: Position changed on both sides
  const positionChanged =
    localMarker.position.x !== serverMarker.position.x ||
    localMarker.position.y !== serverMarker.position.y ||
    localMarker.position.z !== serverMarker.position.z;

  if (positionChanged) {
    console.log('[ConflictResolver] Conflict: Position changed on both sides');
    conflicts.push({
      markerId: localMarker.id,
      conflictType: 'position',
      localVersion: localMarker.position,
      serverVersion: serverMarker.position,
      localTimestamp: localMarker.updatedAt,
      serverTimestamp: serverMarker.updatedAt,
      localUser: localMarker.createdBy,
      serverUser: serverMarker.createdBy,
    });
  }

  console.log('[ConflictResolver] Conflicts detected:', conflicts.length);
  return conflicts;
}

/**
 * Detect content conflicts
 */
export function detectContentConflicts(
  localContent: {
    description: string;
    updatedAt: number;
  },
  serverContent: {
    description: string;
    updatedAt: number;
  } | null,
  lastSyncedAt: number
): MarkerConflict | null {
  console.log('[ConflictResolver] Detecting content conflicts');

  if (!serverContent) {
    console.log('[ConflictResolver] No server content to compare');
    return null;
  }

  const localModified = localContent.updatedAt > lastSyncedAt;
  const serverModified = serverContent.updatedAt > lastSyncedAt;

  if (!localModified || !serverModified) {
    console.log('[ConflictResolver] Content not modified on both sides');
    return null;
  }

  if (localContent.description === serverContent.description) {
    console.log('[ConflictResolver] Content identical, no conflict');
    return null;
  }

  console.log('[ConflictResolver] Content conflict detected');
  return {
    markerId: '', // Set by caller
    conflictType: 'content',
    localVersion: localContent.description,
    serverVersion: serverContent.description,
    localTimestamp: localContent.updatedAt,
    serverTimestamp: serverContent.updatedAt,
    localUser: '', // Set by caller
    serverUser: '', // Set by caller
  };
}

/**
 * Auto-merge non-conflicting changes
 * Returns merged result if possible, null if manual resolution needed
 */
export function autoMergeMarker(
  localMarker: any,
  serverMarker: any,
  conflicts: MarkerConflict[]
): any | null {
  console.log('[ConflictResolver] Attempting auto-merge:', {
    conflictCount: conflicts.length,
  });

  // Can't auto-merge if there are conflicts
  if (conflicts.length > 0) {
    console.log('[ConflictResolver] Auto-merge not possible due to conflicts');
    return null;
  }

  // Merge: Take newer timestamp for each field
  const merged = {
    ...serverMarker,
  };

  // If local is newer, use local changes
  if (localMarker.updatedAt > serverMarker.updatedAt) {
    console.log('[ConflictResolver] Local changes are newer, using local version');
    merged.title = localMarker.title;
    merged.position = localMarker.position;
    merged.updatedAt = localMarker.updatedAt;
  }

  console.log('[ConflictResolver] Auto-merge successful');
  return merged;
}

/**
 * Resolve conflict based on user choice
 */
export function resolveConflict(
  conflict: MarkerConflict,
  resolution: ConflictResolution,
  currentData: any
): any {
  console.log('[ConflictResolver] Resolving conflict:', {
    conflictType: conflict.conflictType,
    resolution,
  });

  const resolved = { ...currentData };

  switch (resolution) {
    case 'keep-mine':
      console.log('[ConflictResolver] Keeping local version');
      if (conflict.conflictType === 'title') {
        resolved.title = conflict.localVersion;
      } else if (conflict.conflictType === 'position') {
        resolved.position = conflict.localVersion;
      } else if (conflict.conflictType === 'content') {
        resolved.description = conflict.localVersion;
      }
      resolved.updatedAt = conflict.localTimestamp;
      break;

    case 'keep-theirs':
      console.log('[ConflictResolver] Keeping server version');
      if (conflict.conflictType === 'title') {
        resolved.title = conflict.serverVersion;
      } else if (conflict.conflictType === 'position') {
        resolved.position = conflict.serverVersion;
      } else if (conflict.conflictType === 'content') {
        resolved.description = conflict.serverVersion;
      }
      resolved.updatedAt = conflict.serverTimestamp;
      break;

    case 'merge':
      console.log('[ConflictResolver] Merging changes');
      // For merge, attempt intelligent combination
      if (conflict.conflictType === 'content') {
        // Simple merge: concatenate with separator
        resolved.description = `${conflict.localVersion}\n\n---\n\n${conflict.serverVersion}`;
        resolved.updatedAt = Math.max(conflict.localTimestamp, conflict.serverTimestamp);
      } else {
        // For other types, use newer version
        const useLocal = conflict.localTimestamp > conflict.serverTimestamp;
        if (conflict.conflictType === 'title') {
          resolved.title = useLocal ? conflict.localVersion : conflict.serverVersion;
        } else if (conflict.conflictType === 'position') {
          resolved.position = useLocal ? conflict.localVersion : conflict.serverVersion;
        }
        resolved.updatedAt = useLocal ? conflict.localTimestamp : conflict.serverTimestamp;
      }
      break;
  }

  console.log('[ConflictResolver] Conflict resolved:', resolution);
  return resolved;
}

/**
 * Resolve multiple conflicts
 */
export function resolveConflicts(
  conflicts: MarkerConflict[],
  resolutions: Map<string, ConflictResolution>,
  currentData: any
): any {
  console.log('[ConflictResolver] Resolving multiple conflicts:', {
    count: conflicts.length,
  });

  let resolved = { ...currentData };

  for (const conflict of conflicts) {
    const resolution = resolutions.get(conflict.conflictType);
    if (resolution) {
      resolved = resolveConflict(conflict, resolution, resolved);
    } else {
      console.warn('[ConflictResolver] No resolution for conflict:', conflict.conflictType);
    }
  }

  console.log('[ConflictResolver] All conflicts resolved');
  return resolved;
}

/**
 * Log conflict to activity timeline
 */
export function logConflictToTimeline(
  conflict: MarkerConflict,
  resolution: ConflictResolution
): void {
  console.log('[ConflictResolver] Logging conflict to timeline:', {
    markerId: conflict.markerId,
    conflictType: conflict.conflictType,
    resolution,
  });

  // TODO: Implement actual timeline logging
  // This would integrate with the activity timeline system
  // For now, just log to console

  const timelineEntry = {
    type: 'conflict_resolved',
    markerId: conflict.markerId,
    conflictType: conflict.conflictType,
    resolution,
    localUser: conflict.localUser,
    serverUser: conflict.serverUser,
    timestamp: Date.now(),
  };

  console.log('[ConflictResolver] Timeline entry:', timelineEntry);
}
