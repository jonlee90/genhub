'use client';

/**
 * useScrollDirection Hook
 *
 * Detects scroll direction for hiding/showing elements on scroll.
 * Common mobile UX pattern (like iOS Safari address bar).
 *
 * Features:
 * - Configurable scroll threshold (prevents jitter)
 * - Debounced for performance
 * - Returns 'up' | 'down' | null
 * - Optional target element (defaults to window)
 *
 * Usage:
 * ```tsx
 * const scrollDirection = useScrollDirection({ threshold: 15 });
 * const isHeaderHidden = scrollDirection === 'down';
 * ```
 */

import { useState, useEffect, useRef, useCallback } from 'react';

export type ScrollDirection = 'up' | 'down' | null;

interface UseScrollDirectionOptions {
  /** Minimum scroll distance before triggering direction change (default: 15px) */
  threshold?: number;
  /** Target element ref (defaults to window scroll) */
  targetRef?: React.RefObject<HTMLElement | null>;
  /** Callback to get target element (alternative to targetRef, called on mount) */
  getTarget?: () => HTMLElement | null;
  /** Initial direction (default: null) */
  initialDirection?: ScrollDirection;
  /** Disable the hook (useful for desktop) */
  disabled?: boolean;
}

export function useScrollDirection({
  threshold = 15,
  targetRef,
  getTarget,
  initialDirection = null,
  disabled = false,
}: UseScrollDirectionOptions = {}): ScrollDirection {
  const [scrollDirection, setScrollDirection] = useState<ScrollDirection>(initialDirection);
  const lastScrollY = useRef(0);
  const lastScrollDirection = useRef<ScrollDirection>(initialDirection);
  const ticking = useRef(false);
  const targetElementRef = useRef<HTMLElement | null>(null);

  const updateScrollDirection = useCallback(() => {
    if (disabled) return;

    const target = targetElementRef.current || targetRef?.current;
    const scrollY = target ? target.scrollTop : window.scrollY;
    const diff = scrollY - lastScrollY.current;

    // Only update if we've scrolled past the threshold
    if (Math.abs(diff) >= threshold) {
      const newDirection: ScrollDirection = diff > 0 ? 'down' : 'up';

      // Only update state if direction actually changed
      if (newDirection !== lastScrollDirection.current) {
        lastScrollDirection.current = newDirection;
        setScrollDirection(newDirection);
      }

      lastScrollY.current = scrollY;
    }

    // At top of page, reset to null (show header)
    if (scrollY <= 10) {
      if (lastScrollDirection.current !== null) {
        lastScrollDirection.current = null;
        setScrollDirection(null);
      }
      lastScrollY.current = scrollY;
    }

    ticking.current = false;
  }, [threshold, targetRef, disabled]);

  const handleScroll = useCallback(() => {
    if (!ticking.current) {
      window.requestAnimationFrame(updateScrollDirection);
      ticking.current = true;
    }
  }, [updateScrollDirection]);

  useEffect(() => {
    if (disabled) return;

    // Small delay to ensure refs are populated after mount
    const timeoutId = setTimeout(() => {
      // Get target element via callback or ref
      const element = getTarget?.() ?? targetRef?.current ?? null;
      targetElementRef.current = element;
      const target = element || window;

      // Initialize last scroll position
      lastScrollY.current = element?.scrollTop ?? window.scrollY;

      target.addEventListener('scroll', handleScroll, { passive: true });
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      const target = targetElementRef.current || window;
      target.removeEventListener('scroll', handleScroll);
    };
  }, [handleScroll, targetRef, getTarget, disabled]);

  // Reset when disabled changes
  useEffect(() => {
    if (disabled) {
      setScrollDirection(null);
      lastScrollDirection.current = null;
    }
  }, [disabled]);

  return scrollDirection;
}
