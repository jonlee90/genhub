/**
 * Phase 1 - Form Draft Persistence Service
 * Auto-save form state to IndexedDB for recovery
 *
 * Features:
 * - Auto-save form state on change
 * - Restore drafts on form mount
 * - Auto-cleanup of old drafts (>7 days)
 * - Draft age tracking
 */

'use client';

import { getDB } from './indexed-db';

console.log('[Form Persistence] Module loaded');

// Draft configuration
const DRAFT_EXPIRY_DAYS = 7;
const DRAFT_EXPIRY_MS = DRAFT_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
const AUTO_SAVE_DEBOUNCE_MS = 1000; // 1 second

export interface FormDraft {
  formId: string;
  formType: string;
  data: any;
  savedAt: number;
  expiresAt: number;
}

export interface DraftMetadata {
  formId: string;
  formType: string;
  savedAt: number;
  expiresAt: number;
  ageMs: number;
  isExpired: boolean;
}

// Debounce timers
const saveTimers = new Map<string, NodeJS.Timeout>();

/**
 * Save form draft to IndexedDB
 * Automatically debounced to prevent excessive saves
 */
export async function saveFormDraft(
  formId: string,
  formType: string,
  data: any,
  options?: {
    immediate?: boolean;
    expiryMs?: number;
  }
): Promise<void> {
  console.log('[Form Persistence] Saving form draft:', { formId, formType });

  // Clear existing timer if debouncing
  if (!options?.immediate && saveTimers.has(formId)) {
    clearTimeout(saveTimers.get(formId)!);
  }

  const save = async () => {
    const db = await getDB();
    const now = Date.now();
    const expiryMs = options?.expiryMs || DRAFT_EXPIRY_MS;

    try {
      const draft: FormDraft = {
        formId,
        formType,
        data,
        savedAt: now,
        expiresAt: now + expiryMs,
      };

      await db.put('form_drafts', draft);

      console.log('[Form Persistence] Form draft saved:', {
        formId,
        expiresAt: new Date(draft.expiresAt).toISOString(),
      });

      // Clean up timer
      saveTimers.delete(formId);
    } catch (error) {
      console.error('[Form Persistence] Failed to save form draft:', error);
      throw error;
    }
  };

  if (options?.immediate) {
    // Save immediately
    await save();
  } else {
    // Debounce save
    const timer = setTimeout(save, AUTO_SAVE_DEBOUNCE_MS);
    saveTimers.set(formId, timer);
  }
}

/**
 * Load form draft from IndexedDB
 */
export async function loadFormDraft(formId: string): Promise<FormDraft | null> {
  console.log('[Form Persistence] Loading form draft:', { formId });

  const db = await getDB();

  try {
    const draft = await db.get('form_drafts', formId);

    if (!draft) {
      console.log('[Form Persistence] No draft found');
      return null;
    }

    // Check if expired
    if (Date.now() > draft.expiresAt) {
      console.log('[Form Persistence] Draft expired, deleting');
      await db.delete('form_drafts', formId);
      return null;
    }

    console.log('[Form Persistence] Draft loaded:', {
      formId,
      savedAt: new Date(draft.savedAt).toISOString(),
    });

    return draft;
  } catch (error) {
    console.error('[Form Persistence] Failed to load form draft:', error);
    return null;
  }
}

/**
 * Clear form draft after successful submission
 */
export async function clearFormDraft(formId: string): Promise<boolean> {
  console.log('[Form Persistence] Clearing form draft:', { formId });

  const db = await getDB();

  try {
    // Clear any pending save timers
    if (saveTimers.has(formId)) {
      clearTimeout(saveTimers.get(formId)!);
      saveTimers.delete(formId);
    }

    await db.delete('form_drafts', formId);
    console.log('[Form Persistence] Form draft cleared');
    return true;
  } catch (error) {
    console.error('[Form Persistence] Failed to clear form draft:', error);
    return false;
  }
}

/**
 * List all saved form drafts
 */
export async function listFormDrafts(
  filters?: {
    formType?: string;
    includeExpired?: boolean;
  }
): Promise<DraftMetadata[]> {
  console.log('[Form Persistence] Listing form drafts:', filters);

  const db = await getDB();
  const now = Date.now();

  try {
    let drafts: FormDraft[];

    if (filters?.formType) {
      drafts = await db.getAllFromIndex('form_drafts', 'by-type', filters.formType);
    } else {
      drafts = await db.getAll('form_drafts');
    }

    // Map to metadata
    const metadata: DraftMetadata[] = drafts.map((draft) => ({
      formId: draft.formId,
      formType: draft.formType,
      savedAt: draft.savedAt,
      expiresAt: draft.expiresAt,
      ageMs: now - draft.savedAt,
      isExpired: now > draft.expiresAt,
    }));

    // Filter expired if needed
    const filtered = filters?.includeExpired
      ? metadata
      : metadata.filter((m) => !m.isExpired);

    console.log('[Form Persistence] Drafts listed:', {
      total: drafts.length,
      filtered: filtered.length,
    });

    return filtered;
  } catch (error) {
    console.error('[Form Persistence] Failed to list form drafts:', error);
    return [];
  }
}

/**
 * Auto-cleanup expired drafts
 */
export async function cleanupExpiredDrafts(): Promise<number> {
  console.log('[Form Persistence] Cleaning up expired drafts');

  const db = await getDB();
  const now = Date.now();
  let deleted = 0;

  try {
    const allDrafts = await db.getAll('form_drafts');

    for (const draft of allDrafts) {
      if (now > draft.expiresAt) {
        await db.delete('form_drafts', draft.formId);
        deleted++;
      }
    }

    console.log('[Form Persistence] Expired drafts cleaned up:', { count: deleted });
    return deleted;
  } catch (error) {
    console.error('[Form Persistence] Failed to cleanup expired drafts:', error);
    return 0;
  }
}

/**
 * Get draft age in human-readable format
 */
export function getDraftAge(savedAt: number): string {
  const ageMs = Date.now() - savedAt;
  const ageMinutes = Math.floor(ageMs / (1000 * 60));
  const ageHours = Math.floor(ageMinutes / 60);
  const ageDays = Math.floor(ageHours / 24);

  if (ageDays > 0) {
    return `${ageDays} day${ageDays > 1 ? 's' : ''} ago`;
  } else if (ageHours > 0) {
    return `${ageHours} hour${ageHours > 1 ? 's' : ''} ago`;
  } else if (ageMinutes > 0) {
    return `${ageMinutes} minute${ageMinutes > 1 ? 's' : ''} ago`;
  } else {
    return 'just now';
  }
}

/**
 * Check if draft exists
 */
export async function hasDraft(formId: string): Promise<boolean> {
  console.log('[Form Persistence] Checking if draft exists:', { formId });

  const draft = await loadFormDraft(formId);
  return draft !== null;
}

/**
 * Get draft statistics
 */
export async function getDraftStats(): Promise<{
  total: number;
  expired: number;
  active: number;
  byType: Record<string, number>;
  oldestDraftAge: number;
}> {
  console.log('[Form Persistence] Getting draft stats');

  const db = await getDB();
  const now = Date.now();

  try {
    const allDrafts = await db.getAll('form_drafts');

    const stats = {
      total: allDrafts.length,
      expired: 0,
      active: 0,
      byType: {} as Record<string, number>,
      oldestDraftAge: 0,
    };

    let oldestTimestamp = now;

    for (const draft of allDrafts) {
      if (now > draft.expiresAt) {
        stats.expired++;
      } else {
        stats.active++;
      }

      stats.byType[draft.formType] = (stats.byType[draft.formType] || 0) + 1;

      if (draft.savedAt < oldestTimestamp) {
        oldestTimestamp = draft.savedAt;
      }
    }

    stats.oldestDraftAge = now - oldestTimestamp;

    console.log('[Form Persistence] Draft stats:', stats);
    return stats;
  } catch (error) {
    console.error('[Form Persistence] Failed to get draft stats:', error);
    return {
      total: 0,
      expired: 0,
      active: 0,
      byType: {},
      oldestDraftAge: 0,
    };
  }
}

/**
 * Clear all drafts (use with caution)
 */
export async function clearAllDrafts(): Promise<number> {
  console.log('[Form Persistence] Clearing all drafts');

  const db = await getDB();

  try {
    const allDrafts = await db.getAll('form_drafts');
    const count = allDrafts.length;

    // Clear all save timers
    saveTimers.forEach((timer) => clearTimeout(timer));
    saveTimers.clear();

    await db.clear('form_drafts');

    console.log('[Form Persistence] All drafts cleared:', { count });
    return count;
  } catch (error) {
    console.error('[Form Persistence] Failed to clear all drafts:', error);
    return 0;
  }
}

/**
 * React Hook: Auto-save form state
 * Usage: useFormDraft('create-task-123', 'task', formState)
 */
export function useFormDraft(
  formId: string,
  formType: string,
  data: any
): {
  saveDraft: () => Promise<void>;
  loadDraft: () => Promise<FormDraft | null>;
  clearDraft: () => Promise<boolean>;
  hasDraft: () => Promise<boolean>;
} {
  return {
    saveDraft: async () => {
      await saveFormDraft(formId, formType, data, { immediate: true });
    },
    loadDraft: async () => {
      return await loadFormDraft(formId);
    },
    clearDraft: async () => {
      return await clearFormDraft(formId);
    },
    hasDraft: async () => {
      return await hasDraft(formId);
    },
  };
}

// Export configuration
export const FORM_DRAFT_CONFIG = {
  DRAFT_EXPIRY_DAYS,
  DRAFT_EXPIRY_MS,
  AUTO_SAVE_DEBOUNCE_MS,
} as const;
