'use client';

/**
 * useViewTransition Hook
 *
 * Wraps navigation and state changes in View Transitions API for smooth page transitions.
 * Gracefully degrades in browsers without support.
 *
 * Features:
 * - Automatic fallback for unsupported browsers
 * - TypeScript-safe API
 * - Async operation support
 * - Pending state tracking
 *
 * @example
 * ```tsx
 * const { startTransition, isPending } = useViewTransition();
 *
 * const handleNavigate = () => {
 *   startTransition(async () => {
 *     router.push('/new-page');
 *   });
 * };
 * ```
 */

import { useState, useCallback } from 'react';

// View Transitions API type declarations
// Note: These may be available in future TypeScript versions
interface ViewTransitionAPI {
  ready: Promise<void>;
  finished: Promise<void>;
  updateCallbackDone: Promise<void>;
  skipTransition: () => void;
}

// Extend Document interface only if not already defined
type DocumentWithViewTransition = Document & {
  startViewTransition?: (callback: () => void | Promise<void>) => ViewTransitionAPI;
};

interface UseViewTransitionReturn {
  /** Execute callback within a view transition */
  startTransition: (callback: () => void | Promise<void>) => Promise<void>;
  /** Whether a transition is currently pending */
  isPending: boolean;
  /** Whether the browser supports View Transitions API */
  isSupported: boolean;
}

export function useViewTransition(): UseViewTransitionReturn {
  const [isPending, setIsPending] = useState(false);

  const isSupported =
    typeof document !== 'undefined' &&
    typeof (document as DocumentWithViewTransition).startViewTransition === 'function';

  const startTransition = useCallback(
    async (callback: () => void | Promise<void>) => {
      setIsPending(true);

      try {
        // Use View Transitions API if available
        const doc = document as DocumentWithViewTransition;
        if (isSupported && doc.startViewTransition) {
          const transition = doc.startViewTransition(async () => {
            await callback();
          });

          // Wait for transition to finish
          await transition.finished;
        } else {
          // Fallback: execute callback without transition
          await callback();
        }
      } catch (error) {
        console.error('[useViewTransition] Transition failed:', error);
        // Continue anyway - don't block user action
      } finally {
        setIsPending(false);
      }
    },
    [isSupported]
  );

  return {
    startTransition,
    isPending,
    isSupported,
  };
}

/**
 * Manual view transition wrapper for non-hook contexts
 *
 * @example
 * ```ts
 * await withViewTransition(() => {
 *   setState(newValue);
 * });
 * ```
 */
export async function withViewTransition(
  callback: () => void | Promise<void>
): Promise<void> {
  const doc = document as DocumentWithViewTransition;
  const isSupported =
    typeof document !== 'undefined' &&
    typeof doc.startViewTransition === 'function';

  if (isSupported && doc.startViewTransition) {
    const transition = doc.startViewTransition(async () => {
      await callback();
    });
    await transition.finished;
  } else {
    await callback();
  }
}
