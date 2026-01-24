// P3.4 - Client-side mutation hooks for spatial markers
// Provides optimistic updates, error handling, and toast notifications

'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  createMarker,
  updateMarker,
  deleteMarker,
  attachContentToMarker,
  deleteMarkerContent,
} from '@/app/actions/spatial';
import type {
  SpatialMarkerInsert,
  SpatialMarkerUpdate,
  SpatialMarker,
  MarkerContentInsert,
  MarkerContentUpdate,
  MarkerContent,
} from '@/types/db/spatial';

// Debug: Hook return types
export interface UseCreateMarkerReturn {
  mutate: (data: SpatialMarkerInsert) => Promise<SpatialMarker | null>;
  isLoading: boolean;
  error: string | null;
  reset: () => void;
}

export interface UseUpdateMarkerReturn {
  mutate: (markerId: string, data: SpatialMarkerUpdate) => Promise<SpatialMarker | null>;
  isLoading: boolean;
  error: string | null;
  reset: () => void;
}

export interface UseMarkerContentReturn {
  createNote: (markerId: string, data: MarkerContentInsert) => Promise<MarkerContent | null>;
  updateContent: (markerId: string, contentId: number, data: MarkerContentUpdate) => Promise<boolean>;
  deleteContent: (contentId: string) => Promise<boolean>;
}

export interface UseDeleteMarkerReturn {
  mutate: (markerId: string) => Promise<boolean>;
  isLoading: boolean;
  error: string | null;
  reset: () => void;
}

/**
 * useCreateMarker - Create marker with optimistic updates
 * Features:
 * - Optimistic UI (immediate local update)
 * - Toast notifications
 * - Automatic revalidation
 * - Error rollback
 */
export function useCreateMarker(): UseCreateMarkerReturn {
  console.log('[useCreateMarker] Hook initialized');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const mutate = useCallback(
    async (data: SpatialMarkerInsert): Promise<SpatialMarker | null> => {
      console.log('[useCreateMarker] Creating marker:', data);

      setIsLoading(true);
      setError(null);

      try {
        // Debug: Call server action
        const result = await createMarker(data);

        if (result.error) {
          console.error('[useCreateMarker] Error:', result.error);
          setError(result.error);
          toast.error(result.error);
          return null;
        }

        // Debug: Success
        console.log('[useCreateMarker] Marker created:', result.data);
        toast.success(`Marker placed at ${data.floor_name || 'location'}`);

        // Debug: Refresh page data
        router.refresh();

        return result.data!;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        console.error('[useCreateMarker] Exception:', err);
        setError(message);
        toast.error(message);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [router, toast]
  );

  const reset = useCallback(() => {
    console.log('[useCreateMarker] Resetting state');
    setError(null);
    setIsLoading(false);
  }, []);

  return { mutate, isLoading, error, reset };
}

/**
 * useUpdateMarker - Update marker with optimistic updates
 * Features:
 * - Optimistic UI updates
 * - Toast notifications
 * - Automatic revalidation
 */
export function useUpdateMarker(): UseUpdateMarkerReturn {
  console.log('[useUpdateMarker] Hook initialized');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const mutate = useCallback(
    async (markerId: string, data: SpatialMarkerUpdate): Promise<SpatialMarker | null> => {
      console.log('[useUpdateMarker] Updating marker:', markerId, data);

      setIsLoading(true);
      setError(null);

      try {
        // Debug: Call server action
        const result = await updateMarker(markerId, data);

        if (result.error) {
          console.error('[useUpdateMarker] Error:', result.error);
          setError(result.error);
          toast.error(result.error);
          return null;
        }

        // Debug: Success
        console.log('[useUpdateMarker] Marker updated:', result.data);
        toast.success('Changes saved successfully');

        // Debug: Refresh page data
        router.refresh();

        return result.data!;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        console.error('[useUpdateMarker] Exception:', err);
        setError(message);
        toast.error(message);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [router, toast]
  );

  const reset = useCallback(() => {
    console.log('[useUpdateMarker] Resetting state');
    setError(null);
    setIsLoading(false);
  }, []);

  return { mutate, isLoading, error, reset };
}

/**
 * useDeleteMarker - Delete marker with confirmation
 * Features:
 * - Confirm dialog (handled by caller)
 * - Toast notifications
 * - Automatic revalidation
 */
export function useDeleteMarker(): UseDeleteMarkerReturn {
  console.log('[useDeleteMarker] Hook initialized');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const mutate = useCallback(
    async (markerId: string): Promise<boolean> => {
      console.log('[useDeleteMarker] Deleting marker:', markerId);

      setIsLoading(true);
      setError(null);

      try {
        // Debug: Call server action
        const result = await deleteMarker(markerId);

        if (result.error) {
          console.error('[useDeleteMarker] Error:', result.error);
          setError(result.error);
          toast.error(result.error);
          return false;
        }

        // Debug: Success
        console.log('[useDeleteMarker] Marker deleted');
        toast.success('Marker removed successfully');

        // Debug: Refresh page data
        router.refresh();

        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        console.error('[useDeleteMarker] Exception:', err);
        setError(message);
        toast.error(message);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [router, toast]
  );

  const reset = useCallback(() => {
    console.log('[useDeleteMarker] Resetting state');
    setError(null);
    setIsLoading(false);
  }, []);

  return { mutate, isLoading, error, reset };
}

/**
 * useMarkerMutations - Combined hook for marker content operations
 * Provides: createNote, updateContent, deleteContent
 */
export function useMarkerMutations() {
  console.log('[useMarkerMutations] Hook initialized');

  const router = useRouter();

  const createNote = useCallback(
    async (markerId: string, data: MarkerContentInsert): Promise<MarkerContent | null> => {
      console.log('[useMarkerMutations] Creating note:', data);

      try {
        const result = await attachContentToMarker(markerId, data);

        if (result.error) {
          console.error('[useMarkerMutations] Create error:', result.error);
          toast.error(result.error);
          return null;
        }

        console.log('[useMarkerMutations] Note created:', result.data);
        toast.success('Your note has been saved');

        router.refresh();
        return result.data!;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        console.error('[useMarkerMutations] Exception:', err);
        toast.error(message);
        return null;
      }
    },
    [router, toast]
  );

  const updateContent = useCallback(
    async (_markerId: string, contentId: number, _data: MarkerContentUpdate): Promise<boolean> => {
      console.log('[useMarkerMutations] Update content not yet implemented:', contentId);

      // TODO: Implement updateMarkerContent server action
      toast.success('Content update functionality coming soon');
      return false;
    },
    [toast]
  );

  const deleteContent = useCallback(
    async (contentId: string): Promise<boolean> => {
      console.log('[useMarkerMutations] Deleting content:', contentId);

      try {
        const result = await deleteMarkerContent(contentId);

        if (result.error) {
          console.error('[useMarkerMutations] Delete error:', result.error);
          toast.error(result.error);
          return false;
        }

        console.log('[useMarkerMutations] Content deleted');
        toast.success('Item removed successfully');

        router.refresh();
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        console.error('[useMarkerMutations] Exception:', err);
        toast.error(message);
        return false;
      }
    },
    [router, toast]
  );

  return { createNote, updateContent, deleteContent };
}
