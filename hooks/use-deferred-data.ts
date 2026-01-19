'use client';

import { useEffect, useState, useCallback, useRef } from 'react';

interface UseDeferredDataOptions<T> {
  /**
   * Function that fetches the data
   */
  fetchFn: () => Promise<T>;

  /**
   * Delay in milliseconds before starting the fetch
   * @default 0
   */
  delay?: number;

  /**
   * Whether to fetch immediately or wait for manual trigger
   * @default true
   */
  enabled?: boolean;

  /**
   * Optional cache key to prevent refetching
   */
  cacheKey?: string;
}

interface UseDeferredDataReturn<T> {
  /**
   * The fetched data, null if not yet loaded
   */
  data: T | null;

  /**
   * Loading state
   */
  loading: boolean;

  /**
   * Error if fetch failed
   */
  error: Error | null;

  /**
   * Manually trigger a refetch
   */
  refetch: () => Promise<void>;

  /**
   * Whether data has been fetched at least once
   */
  hasFetched: boolean;
}

// Simple in-memory cache
const dataCache = new Map<string, any>();

/**
 * Hook for loading data after initial render with optional delay
 * Useful for deferring non-critical data to improve initial page load
 *
 * @example
 * ```tsx
 * // Load expense stats 1 second after page loads
 * const { data: expenseStats, loading } = useDeferredData({
 *   fetchFn: () => getExpenseStats(projectId),
 *   delay: 1000,
 * });
 *
 * if (loading) return <Skeleton />;
 * if (!data) return null;
 * return <ExpenseChart data={expenseStats} />;
 * ```
 */
export function useDeferredData<T>({
  fetchFn,
  delay = 0,
  enabled = true,
  cacheKey,
}: UseDeferredDataOptions<T>): UseDeferredDataReturn<T> {
  const [data, setData] = useState<T | null>(() => {
    // Check cache on mount
    if (cacheKey && dataCache.has(cacheKey)) {
      return dataCache.get(cacheKey);
    }
    return null;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasFetched, setHasFetched] = useState(
    () => cacheKey ? dataCache.has(cacheKey) : false
  );

  const isMountedRef = useRef(true);
  const timerRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const fetchData = useCallback(async () => {
    // Don't fetch if already fetched and cached
    if (hasFetched && cacheKey && dataCache.has(cacheKey)) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await fetchFn();

      // Only update state if component is still mounted
      if (isMountedRef.current) {
        setData(result);
        setHasFetched(true);

        // Cache the result if cache key provided
        if (cacheKey) {
          dataCache.set(cacheKey, result);
        }
      }
    } catch (err) {
      if (isMountedRef.current) {
        const error = err instanceof Error ? err : new Error('Failed to fetch data');
        setError(error);
        console.error('[useDeferredData] Fetch failed:', error);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [fetchFn, cacheKey, hasFetched]);

  const refetch = useCallback(async () => {
    // Clear cache on manual refetch
    if (cacheKey) {
      dataCache.delete(cacheKey);
    }
    setHasFetched(false);
    await fetchData();
  }, [fetchData, cacheKey]);

  useEffect(() => {
    isMountedRef.current = true;

    if (!enabled) {
      return;
    }

    // Start fetch after delay
    timerRef.current = setTimeout(() => {
      fetchData();
    }, delay);

    return () => {
      isMountedRef.current = false;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [fetchData, delay, enabled]);

  return {
    data,
    loading,
    error,
    refetch,
    hasFetched,
  };
}

/**
 * Clear all cached deferred data
 * Useful when user logs out or switches context
 */
export function clearDeferredDataCache() {
  dataCache.clear();
}

/**
 * Clear specific cached data by key
 */
export function clearDeferredDataCacheKey(key: string) {
  dataCache.delete(key);
}
