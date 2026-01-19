'use client';

import { useState, useRef, useCallback } from 'react';
import { getModalData } from '@/app/actions/projects';
import type { ProjectForModal, TeamMemberForModal } from '@/app/actions/projects';

// Cache TTL: 5 minutes (for long-running PWA sessions)
const CACHE_TTL = 5 * 60 * 1000;

interface ModalData {
  projects: ProjectForModal[];
  teamMembers: TeamMemberForModal[];
}

interface UseModalDataReturn {
  data: ModalData | null;
  isLoading: boolean;
  error: string | null;
  fetchData: () => Promise<void>;
}

/**
 * Hook for lazy-loading modal data (projects + team members)
 *
 * Features:
 * - Prevents duplicate fetches using ref guard
 * - Caches result in state with 5-minute TTL
 * - Manual trigger via fetchData()
 * - Auto-invalidates cache after TTL expires
 *
 * Usage:
 * ```tsx
 * const { data, isLoading, fetchData } = useModalData();
 *
 * // Trigger fetch when modal opens
 * const handleOpenModal = () => {
 *   fetchData();
 *   openModal();
 * };
 * ```
 */
export function useModalData(): UseModalDataReturn {
  const [data, setData] = useState<ModalData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Prevent duplicate fetches and track cache timestamp
  const isFetchingRef = useRef(false);
  const hasFetchedRef = useRef(false);
  const fetchTimestampRef = useRef<number | null>(null);

  // Check if cached data is still valid
  const isCacheValid = useCallback(() => {
    if (!fetchTimestampRef.current || !hasFetchedRef.current) return false;
    return Date.now() - fetchTimestampRef.current < CACHE_TTL;
  }, []);

  const fetchData = useCallback(async () => {
    // Skip if cache is valid or currently fetching
    if (isCacheValid() || isFetchingRef.current) {
      return;
    }

    isFetchingRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      const result = await getModalData();

      if (result.error) {
        setError(result.error);
      } else if (result.data) {
        setData(result.data);
        hasFetchedRef.current = true;
        fetchTimestampRef.current = Date.now(); // Mark cache timestamp
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch modal data';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, [isCacheValid]);

  return {
    data,
    isLoading,
    error,
    fetchData,
  };
}
