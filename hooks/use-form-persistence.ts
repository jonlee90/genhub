'use client';

/**
 * useFormPersistence Hook
 *
 * Connects form state to IndexedDB for automatic draft persistence.
 * Useful for preventing data loss when users navigate away or refresh.
 *
 * Features:
 * - Auto-save on change with debounce (2s default)
 * - Restore from draft on mount
 * - Clear draft on submit
 * - IndexedDB storage (works offline)
 * - TypeScript-safe generic data type
 *
 * @example
 * ```tsx
 * const { formData, updateField, saveDraft, clearDraft, isLoading } = useFormPersistence(
 *   'create-task-form',
 *   { title: '', description: '' }
 * );
 *
 * <input value={formData.title} onChange={(e) => updateField('title', e.target.value)} />
 * ```
 */

import { useState, useEffect, useCallback, useRef } from 'react';

interface UseFormPersistenceReturn<T> {
  /** Current form data */
  formData: T;
  /** Update a single field (triggers auto-save) */
  updateField: <K extends keyof T>(field: K, value: T[K]) => void;
  /** Update entire form data */
  updateFormData: (data: T) => void;
  /** Manually save draft */
  saveDraft: () => Promise<void>;
  /** Clear draft from storage */
  clearDraft: () => Promise<void>;
  /** Whether loading from storage */
  isLoading: boolean;
  /** Whether draft exists in storage */
  hasDraft: boolean;
}

interface UseFormPersistenceOptions {
  /** Debounce delay in ms (default: 2000) */
  debounceMs?: number;
  /** Disable auto-save (manual save only) */
  disableAutoSave?: boolean;
  /** Callback when draft is restored */
  onRestore?: () => void;
}

// IndexedDB setup
const DB_NAME = 'genhub-form-drafts';
const DB_VERSION = 1;
const STORE_NAME = 'drafts';

let dbPromise: Promise<IDBDatabase> | null = null;

function getDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('IndexedDB not available in SSR'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });

  return dbPromise;
}

async function saveToDB<T>(formId: string, data: T): Promise<void> {
  try {
    const db = await getDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    await new Promise<void>((resolve, reject) => {
      const request = store.put(
        {
          data,
          timestamp: Date.now(),
        },
        formId
      );
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('[useFormPersistence] Save failed:', error);
    throw error;
  }
}

async function loadFromDB<T>(formId: string): Promise<T | null> {
  try {
    const db = await getDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);

    return new Promise<T | null>((resolve, reject) => {
      const request = store.get(formId);
      request.onsuccess = () => {
        const result = request.result;
        resolve(result?.data ?? null);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('[useFormPersistence] Load failed:', error);
    return null;
  }
}

async function deleteFromDB(formId: string): Promise<void> {
  try {
    const db = await getDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    await new Promise<void>((resolve, reject) => {
      const request = store.delete(formId);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('[useFormPersistence] Delete failed:', error);
    throw error;
  }
}

export function useFormPersistence<T extends Record<string, unknown>>(
  formId: string,
  initialData: T,
  options: UseFormPersistenceOptions = {}
): UseFormPersistenceReturn<T> {
  const { debounceMs = 2000, disableAutoSave = false, onRestore } = options;

  const [formData, setFormData] = useState<T>(initialData);
  const [isLoading, setIsLoading] = useState(true);
  const [hasDraft, setHasDraft] = useState(false);

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitializedRef = useRef(false);

  // Restore draft on mount
  useEffect(() => {
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;

    (async () => {
      setIsLoading(true);
      try {
        const draft = await loadFromDB<T>(formId);
        if (draft) {
          setFormData(draft);
          setHasDraft(true);
          onRestore?.();
        }
      } catch (error) {
        console.error('[useFormPersistence] Failed to restore draft:', error);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [formId, onRestore]);

  // Save draft to IndexedDB
  const saveDraft = useCallback(async () => {
    try {
      await saveToDB(formId, formData);
      setHasDraft(true);
    } catch (error) {
      console.error('[useFormPersistence] Failed to save draft:', error);
    }
  }, [formId, formData]);

  // Clear draft from storage
  const clearDraft = useCallback(async () => {
    try {
      await deleteFromDB(formId);
      setHasDraft(false);
    } catch (error) {
      console.error('[useFormPersistence] Failed to clear draft:', error);
    }
  }, [formId]);

  // Debounced auto-save
  useEffect(() => {
    if (disableAutoSave || !isInitializedRef.current || isLoading) return;

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Schedule save
    saveTimeoutRef.current = setTimeout(() => {
      saveDraft();
    }, debounceMs);

    // Cleanup
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [formData, disableAutoSave, isLoading, debounceMs, saveDraft]);

  // Update single field
  const updateField = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  // Update entire form data
  const updateFormData = useCallback((data: T) => {
    setFormData(data);
  }, []);

  return {
    formData,
    updateField,
    updateFormData,
    saveDraft,
    clearDraft,
    isLoading,
    hasDraft,
  };
}
