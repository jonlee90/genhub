"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface UseInfiniteScrollOptions<T> {
  initialItems: T[];
  initialHasMore: boolean;
  pageSize: number;
  resetKey: string;
  fetchPage: (offset: number) => Promise<{ items: T[]; hasMore: boolean }>;
}

export interface UseInfiniteScrollResult<T> {
  items: T[];
  isLoading: boolean;
  isError: boolean;
  hasMore: boolean;
  sentinelRef: React.RefObject<HTMLDivElement | null>;
  reset: () => void;
}

export function useInfiniteScroll<T>(
  opts: UseInfiniteScrollOptions<T>,
): UseInfiniteScrollResult<T> {
  const { initialItems, initialHasMore, resetKey, fetchPage } = opts;

  const [items, setItems] = useState<T[]>(initialItems);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  // Stable ref to current item count — avoids capturing stale length in callbacks
  const itemCountRef = useRef(initialItems.length);
  const isLoadingRef = useRef(false);
  const hasMoreRef = useRef(initialHasMore);
  // Track whether the component has mounted to preserve SSR-seeded initial data
  const didMountRef = useRef(false);
  // Incrementing id to ignore stale fetch responses after a resetKey change
  const requestIdRef = useRef(0);

  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Keep refs in sync with state
  useEffect(() => {
    hasMoreRef.current = hasMore;
  }, [hasMore]);

  // loadMore: append next page — stable via refs (rerender-functional-setstate, advanced-event-handler-refs)
  const loadMore = useCallback(async () => {
    if (isLoadingRef.current || !hasMoreRef.current) return;

    isLoadingRef.current = true;
    setIsLoading(true);
    setIsError(false);

    const offset = itemCountRef.current;
    const expectedId = requestIdRef.current;

    try {
      const result = await fetchPage(offset);

      // Discard stale responses if resetKey triggered a new request cycle
      if (requestIdRef.current !== expectedId) return;

      setItems((prev) => {
        const next = [...prev, ...result.items];
        itemCountRef.current = next.length;
        return next;
      });
      setHasMore(result.hasMore);
      hasMoreRef.current = result.hasMore;
    } catch {
      if (requestIdRef.current !== expectedId) return;
      setIsError(true);
    } finally {
      if (requestIdRef.current === expectedId) {
        isLoadingRef.current = false;
        setIsLoading(false);
      }
    }
  }, [fetchPage]);

  // IntersectionObserver on sentinel (rootMargin 200px for early trigger)
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadMore();
        }
      },
      { rootMargin: "200px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  // Reset + refetch when resetKey changes; skip the very first run to preserve SSR data
  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }

    // Invalidate any in-flight requests
    requestIdRef.current += 1;
    const currentId = requestIdRef.current;

    isLoadingRef.current = true;
    setIsLoading(true);
    setIsError(false);
    setItems([]);
    itemCountRef.current = 0;
    hasMoreRef.current = false;

    fetchPage(0)
      .then((result) => {
        if (requestIdRef.current !== currentId) return;

        setItems(result.items);
        itemCountRef.current = result.items.length;
        setHasMore(result.hasMore);
        hasMoreRef.current = result.hasMore;
      })
      .catch(() => {
        if (requestIdRef.current !== currentId) return;
        setIsError(true);
      })
      .finally(() => {
        if (requestIdRef.current === currentId) {
          isLoadingRef.current = false;
          setIsLoading(false);
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);

  const reset = useCallback(() => {
    requestIdRef.current += 1;
    isLoadingRef.current = false;
    setItems([]);
    itemCountRef.current = 0;
    setHasMore(false);
    hasMoreRef.current = false;
    setIsLoading(false);
    setIsError(false);
  }, []);

  return { items, isLoading, isError, hasMore, sentinelRef, reset };
}
