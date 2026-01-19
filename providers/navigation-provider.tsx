'use client';

/**
 * NavigationProvider
 *
 * Global navigation context for coordinating transitions and prefetch.
 * Provides state for loading indicators, transition callbacks, and prefetch hints.
 *
 * Features:
 * - Global loading state
 * - Transition coordination
 * - Prefetch hint management
 * - View Transitions API integration
 *
 * Usage:
 * 1. Wrap app in NavigationProvider (RootLayout)
 * 2. Use useNavigation() hook in components
 *
 * @example
 * ```tsx
 * // In layout
 * <NavigationProvider>{children}</NavigationProvider>
 *
 * // In component
 * const { isNavigating, startTransition } = useNavigation();
 * ```
 */

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from 'react';
import { usePathname } from 'next/navigation';
import { useViewTransition } from '@/hooks/use-view-transition';

interface NavigationContextValue {
  /** Whether navigation is in progress */
  isNavigating: boolean;
  /** Start a navigation transition */
  startTransition: (callback: () => void | Promise<void>) => Promise<void>;
  /** Current route path */
  currentPath: string;
  /** Register a prefetch hint for current page */
  addPrefetchHint: (href: string) => void;
  /** Get prefetch hints for current page */
  getPrefetchHints: () => string[];
  /** Whether View Transitions API is supported */
  supportsViewTransitions: boolean;
}

const NavigationContext = createContext<NavigationContextValue | null>(null);

interface NavigationProviderProps {
  children: ReactNode;
}

export function NavigationProvider({ children }: NavigationProviderProps) {
  const pathname = usePathname();
  const { startTransition: startViewTransition, isSupported } = useViewTransition();

  const [isNavigating, setIsNavigating] = useState(false);
  const [prefetchHints, setPrefetchHints] = useState<Map<string, Set<string>>>(
    new Map()
  );

  // Reset navigation state when pathname changes
  useEffect(() => {
    setIsNavigating(false);
  }, [pathname]);

  const startTransition = useCallback(
    async (callback: () => void | Promise<void>) => {
      setIsNavigating(true);

      try {
        await startViewTransition(callback);
      } catch (error) {
        console.error('[NavigationProvider] Transition failed:', error);
      } finally {
        // Keep navigating state for a short time to show loading indicator
        setTimeout(() => {
          setIsNavigating(false);
        }, 100);
      }
    },
    [startViewTransition]
  );

  const addPrefetchHint = useCallback(
    (href: string) => {
      setPrefetchHints((prev) => {
        const newMap = new Map(prev);
        const hints = newMap.get(pathname) || new Set();
        hints.add(href);
        newMap.set(pathname, hints);
        return newMap;
      });
    },
    [pathname]
  );

  const getPrefetchHints = useCallback(() => {
    const hints = prefetchHints.get(pathname);
    return hints ? Array.from(hints) : [];
  }, [pathname, prefetchHints]);

  const value: NavigationContextValue = {
    isNavigating,
    startTransition,
    currentPath: pathname,
    addPrefetchHint,
    getPrefetchHints,
    supportsViewTransitions: isSupported,
  };

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
}

/**
 * useNavigation Hook
 *
 * Access navigation context from any component
 *
 * @throws Error if used outside NavigationProvider
 */
export function useNavigation(): NavigationContextValue {
  const context = useContext(NavigationContext);

  if (!context) {
    throw new Error('useNavigation must be used within NavigationProvider');
  }

  return context;
}

/**
 * NavigationLoadingBar Component
 *
 * Global loading indicator for navigation transitions
 */
export function NavigationLoadingBar() {
  const { isNavigating } = useNavigation();

  if (!isNavigating) return null;

  return (
    <div
      role="progressbar"
      aria-label="Loading page"
      className="fixed top-0 left-0 right-0 z-[200] h-1 bg-[#001B51]"
      style={{
        animation: 'loading-bar 1s ease-in-out infinite',
      }}
    >
      <style jsx>{`
        @keyframes loading-bar {
          0% {
            transform: translateX(-100%);
          }
          50% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  );
}
