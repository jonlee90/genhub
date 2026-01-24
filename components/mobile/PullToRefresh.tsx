'use client';

/**
 * PullToRefresh Component
 *
 * Native-feel pull-to-refresh gesture for mobile views.
 * Only activates when scrollTop === 0 to avoid interfering with scroll.
 *
 * Features:
 * - Resistance curve for natural feel (diff * 0.4)
 * - Visual states: idle -> pulling -> ready -> refreshing
 * - Arrow rotates during pull, flips at threshold
 * - Spinner during refresh
 * - threshold: 80px, maxPull: 120px
 * - Exposes scroll container ref via forwardRef
 * - Uses non-passive touchmove listener for proper preventDefault
 */

import { useState, useRef, useCallback, forwardRef, useImperativeHandle, useEffect } from 'react';
import { Loader2, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';

type PullState = 'idle' | 'pulling' | 'ready' | 'refreshing';

interface PullToRefreshProps {
  children: React.ReactNode;
  onRefresh: () => Promise<void>;
  className?: string;
  /** Disable pull-to-refresh (useful for desktop) */
  disabled?: boolean;
}

export interface PullToRefreshHandle {
  /** The scroll container element */
  getScrollContainer: () => HTMLDivElement | null;
}

const THRESHOLD = 80; // px to trigger refresh
const MAX_PULL = 120; // max pull distance
const RESISTANCE = 0.4; // pull resistance factor

export const PullToRefresh = forwardRef<PullToRefreshHandle, PullToRefreshProps>(
  function PullToRefresh({ children, onRefresh, className, disabled = false }, ref) {
  const [pullDistance, setPullDistance] = useState(0);
  const [pullState, setPullState] = useState<PullState>('idle');

  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const isPulling = useRef(false);

  // Use refs for values accessed in event listener to avoid effect re-runs
  const disabledRef = useRef(disabled);
  const pullStateRef = useRef(pullState);

  // Keep refs in sync with state
  useEffect(() => {
    disabledRef.current = disabled;
  }, [disabled]);

  useEffect(() => {
    pullStateRef.current = pullState;
  }, [pullState]);

  // Expose scroll container via ref
  useImperativeHandle(ref, () => ({
    getScrollContainer: () => containerRef.current,
  }), []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabledRef.current || pullStateRef.current === 'refreshing') return;

    // Only start pull if at top of scroll
    const container = containerRef.current;
    if (!container || container.scrollTop !== 0) {
      return;
    }

    startY.current = e.touches[0].clientY;
    isPulling.current = true;
  }, []);

  // Use native event listener for touchmove with { passive: false }
  // This allows preventDefault() to work on mobile browsers
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPulling.current || disabledRef.current || pullStateRef.current === 'refreshing') return;

      // Cancel if scrolled away from top
      if (container.scrollTop > 0) {
        isPulling.current = false;
        setPullDistance(0);
        setPullState('idle');
        return;
      }

      const currentY = e.touches[0].clientY;
      const diff = currentY - startY.current;

      // Only pull downward
      if (diff <= 0) {
        setPullDistance(0);
        setPullState('idle');
        return;
      }

      // Prevent default scroll when pulling down at top
      e.preventDefault();

      // Apply resistance curve and clamp to max
      const distance = Math.min(diff * RESISTANCE, MAX_PULL);
      setPullDistance(distance);

      // Update pull state
      if (distance >= THRESHOLD) {
        setPullState('ready');
      } else {
        setPullState('pulling');
      }
    };

    // Attach with passive: false to allow preventDefault
    container.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      container.removeEventListener('touchmove', handleTouchMove);
    };
  }, []); // Empty deps - listener attached once, uses refs for current values

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling.current || disabledRef.current) return;

    isPulling.current = false;

    if (pullStateRef.current === 'ready') {
      // Trigger refresh
      setPullState('refreshing');
      setPullDistance(THRESHOLD * 0.75); // Hold at indicator position

      try {
        await onRefresh();
      } catch (error) {
        console.error('[PullToRefresh] Refresh failed:', error);
      }

      // Reset after refresh
      setPullState('idle');
      setPullDistance(0);
    } else {
      // Snap back without refresh
      setPullState('idle');
      setPullDistance(0);
    }

    startY.current = 0;
  }, [onRefresh]);

  // Calculate visual properties
  const progress = Math.min(pullDistance / THRESHOLD, 1);
  const arrowRotation = pullState === 'ready' ? 180 : progress * 180;
  const opacity = Math.min(progress * 1.5, 1);

  return (
    <div
      ref={containerRef}
      className={cn(
        'h-full overflow-y-auto overflow-x-hidden overscroll-y-contain',
        className
      )}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull indicator */}
      <div
        className={cn(
          'flex items-center justify-center overflow-hidden',
          'transition-[height] ease-out',
          pullState === 'refreshing' ? 'duration-300' : 'duration-200'
        )}
        style={{
          height: pullState === 'refreshing' ? 60 : pullDistance,
        }}
      >
        {(pullDistance > 0 || pullState === 'refreshing') && (
          <div
            className="flex flex-col items-center gap-1"
            style={{ opacity }}
          >
            {pullState === 'refreshing' ? (
              // Spinner during refresh
              <Loader2
                className="w-6 h-6 text-construction-blue dark:text-blue-500 animate-spin"
              />
            ) : (
              // Arrow during pull
              <ArrowDown
                className="w-6 h-6 text-construction-blue dark:text-blue-500 transition-transform duration-150"
                style={{ transform: `rotate(${arrowRotation}deg)` }}
              />
            )}

            {/* Status text */}
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              {pullState === 'refreshing' && 'Refreshing...'}
              {pullState === 'ready' && 'Release to refresh'}
              {pullState === 'pulling' && 'Pull to refresh'}
            </span>
          </div>
        )}
      </div>

      {/* Children content */}
      {children}
    </div>
  );
});
