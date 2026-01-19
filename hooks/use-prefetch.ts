'use client';

/**
 * usePrefetch Hook
 *
 * Intelligently prefetches routes on hover/focus with Next.js App Router.
 * Includes auto-cancellation and debouncing to prevent excessive network requests.
 *
 * Features:
 * - Debounced prefetch (default 100ms hover delay)
 * - Auto-cancellation if user leaves before click
 * - Works with Next.js router prefetch
 * - Configurable delay
 * - No unnecessary requests
 *
 * @example
 * ```tsx
 * const { prefetchProps, isPrefetching } = usePrefetch('/app/tasks');
 *
 * return (
 *   <a href="/app/tasks" {...prefetchProps}>
 *     Go to Tasks
 *   </a>
 * );
 * ```
 */

import { useRouter } from 'next/navigation';
import { useState, useCallback, useRef, useEffect } from 'react';

interface UsePrefetchOptions {
  /** Delay in ms before prefetch triggers (default: 100) */
  delay?: number;
  /** Callback when prefetch starts */
  onPrefetch?: () => void;
  /** Disable prefetch */
  disabled?: boolean;
}

interface UsePrefetchReturn {
  /** Props to spread on link element */
  prefetchProps: {
    onMouseEnter: () => void;
    onMouseLeave: () => void;
    onFocus: () => void;
    onBlur: () => void;
  };
  /** Whether currently prefetching */
  isPrefetching: boolean;
  /** Manually trigger prefetch */
  prefetch: () => void;
}

export function usePrefetch(
  href: string,
  options: UsePrefetchOptions = {}
): UsePrefetchReturn {
  const { delay = 100, onPrefetch, disabled = false } = options;

  const router = useRouter();
  const [isPrefetching, setIsPrefetching] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasPrefetchedRef = useRef(false);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const prefetch = useCallback(() => {
    if (disabled || hasPrefetchedRef.current) return;

    setIsPrefetching(true);
    hasPrefetchedRef.current = true;

    try {
      router.prefetch(href);
      onPrefetch?.();
    } catch (error) {
      console.error('[usePrefetch] Prefetch failed:', error);
    } finally {
      setIsPrefetching(false);
    }
  }, [disabled, href, router, onPrefetch]);

  const handleMouseEnter = useCallback(() => {
    if (disabled || hasPrefetchedRef.current) return;

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Start prefetch after delay
    timeoutRef.current = setTimeout(() => {
      prefetch();
    }, delay);
  }, [disabled, delay, prefetch]);

  const handleMouseLeave = useCallback(() => {
    // Cancel prefetch if user leaves before delay
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const handleFocus = useCallback(() => {
    if (disabled || hasPrefetchedRef.current) return;

    // Immediate prefetch on focus (accessibility)
    prefetch();
  }, [disabled, prefetch]);

  const handleBlur = useCallback(() => {
    // Cancel pending prefetch on blur
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  return {
    prefetchProps: {
      onMouseEnter: handleMouseEnter,
      onMouseLeave: handleMouseLeave,
      onFocus: handleFocus,
      onBlur: handleBlur,
    },
    isPrefetching,
    prefetch,
  };
}

/**
 * usePrefetchMultiple Hook
 *
 * Prefetch multiple routes at once (e.g., for dashboard critical routes)
 *
 * @example
 * ```tsx
 * usePrefetchMultiple(['/app/tasks', '/app/projects'], { delay: 500 });
 * ```
 */
export function usePrefetchMultiple(
  hrefs: string[],
  options: { delay?: number } = {}
): void {
  const { delay = 0 } = options;
  const router = useRouter();
  const hasPrefetchedRef = useRef(false);

  useEffect(() => {
    if (hasPrefetchedRef.current) return;

    const timeoutId = setTimeout(() => {
      hasPrefetchedRef.current = true;

      hrefs.forEach((href) => {
        try {
          router.prefetch(href);
        } catch (error) {
          console.error(`[usePrefetchMultiple] Failed to prefetch ${href}:`, error);
        }
      });
    }, delay);

    return () => clearTimeout(timeoutId);
  }, [hrefs, delay, router]);
}
