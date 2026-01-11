'use client';

import { useState, useRef, useCallback } from 'react';
import { Check, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SwipeableCardProps {
  children: React.ReactNode;
  /** Called when swiped right (reveals left action - complete) */
  onSwipeRight?: () => void;
  /** Called when swiped left (reveals right action - delete) */
  onSwipeLeft?: () => void;
  /** Custom left action icon (default: Check) */
  leftActionIcon?: React.ReactNode;
  /** Custom right action icon (default: Trash2) */
  rightActionIcon?: React.ReactNode;
  /** Left action background color (default: green) */
  leftActionColor?: string;
  /** Right action background color (default: red) */
  rightActionColor?: string;
  /** Whether swipe gestures are enabled */
  disabled?: boolean;
  /** Additional className for the container */
  className?: string;
}

// Swipe threshold in pixels - must drag past this to trigger action
const SWIPE_THRESHOLD = 60;
// Maximum swipe distance
const MAX_SWIPE = 100;
// Resistance factor for edge behavior (lower = more resistance)
const RESISTANCE = 0.5;

/**
 * SwipeableCard - Mobile swipeable card with left/right actions
 *
 * Features:
 * - Native touch events (touchstart, touchmove, touchend)
 * - Resistance curve at edges
 * - Haptic feedback via navigator.vibrate
 * - Priority: vertical scroll > horizontal swipe
 * - Smooth 200ms ease-out snap-back animation
 */
export function SwipeableCard({
  children,
  onSwipeRight,
  onSwipeLeft,
  leftActionIcon,
  rightActionIcon,
  leftActionColor = 'bg-[#059669]',
  rightActionColor = 'bg-[#DC2626]',
  disabled = false,
  className,
}: SwipeableCardProps) {
  const [translateX, setTranslateX] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // Refs for touch tracking
  const startX = useRef(0);
  const startY = useRef(0);
  const isHorizontalSwipe = useRef<boolean | null>(null);
  const hasTriggedHaptic = useRef(false);

  // Calculate translation with resistance at edges
  const getResistantTranslate = useCallback((diff: number): number => {
    const sign = Math.sign(diff);
    const absDiff = Math.abs(diff);

    // Apply resistance after threshold
    if (absDiff > MAX_SWIPE) {
      const excess = absDiff - MAX_SWIPE;
      const resistedExcess = excess * RESISTANCE;
      return sign * (MAX_SWIPE + resistedExcess);
    }

    return diff;
  }, []);

  // Trigger haptic feedback
  const triggerHaptic = useCallback(() => {
    if (!hasTriggedHaptic.current && typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(10);
      hasTriggedHaptic.current = true;
    }
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled) return;

    // Record start position
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    isHorizontalSwipe.current = null;
    hasTriggedHaptic.current = false;
    setIsAnimating(false);
  }, [disabled]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (disabled) return;

    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const diffX = currentX - startX.current;
    const diffY = currentY - startY.current;

    // Determine swipe direction on first significant movement
    if (isHorizontalSwipe.current === null) {
      const absDiffX = Math.abs(diffX);
      const absDiffY = Math.abs(diffY);

      // Need some minimum movement to determine direction
      if (absDiffX > 5 || absDiffY > 5) {
        // Vertical scroll takes priority - if vertical movement is greater, don't swipe
        isHorizontalSwipe.current = absDiffX > absDiffY;
      }
    }

    // Only handle horizontal swipes
    if (isHorizontalSwipe.current === true) {
      // Prevent vertical scroll during horizontal swipe
      e.preventDefault();

      // Apply resistance and set translation
      const resistantX = getResistantTranslate(diffX);
      setTranslateX(resistantX);

      // Haptic feedback when crossing threshold
      if (Math.abs(resistantX) >= SWIPE_THRESHOLD && !hasTriggedHaptic.current) {
        triggerHaptic();
      }
    }
  }, [disabled, getResistantTranslate, triggerHaptic]);

  const handleTouchEnd = useCallback(() => {
    if (disabled) return;

    setIsAnimating(true);

    // Check if we've passed threshold
    if (translateX >= SWIPE_THRESHOLD && onSwipeRight) {
      // Trigger haptic on action
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(15);
      }
      onSwipeRight();
    } else if (translateX <= -SWIPE_THRESHOLD && onSwipeLeft) {
      // Trigger haptic on action
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(15);
      }
      onSwipeLeft();
    }

    // Reset position with animation
    setTranslateX(0);

    // Reset swipe direction
    isHorizontalSwipe.current = null;
  }, [disabled, translateX, onSwipeRight, onSwipeLeft]);

  // Calculate action reveal progress (0 to 1)
  const leftProgress = Math.min(Math.max(translateX / SWIPE_THRESHOLD, 0), 1);
  const rightProgress = Math.min(Math.max(-translateX / SWIPE_THRESHOLD, 0), 1);

  return (
    <div className={cn('relative overflow-hidden rounded-xl', className)}>
      {/* Left action (revealed when swiping right) */}
      {onSwipeRight && (
        <div
          className={cn(
            'absolute inset-y-0 left-0 flex items-center justify-center transition-opacity',
            leftActionColor
          )}
          style={{
            width: `${Math.max(Math.abs(translateX), 0)}px`,
            opacity: leftProgress,
          }}
        >
          <div
            className="flex items-center justify-center w-12 h-12 text-white"
            style={{
              transform: `scale(${0.5 + leftProgress * 0.5})`,
              opacity: leftProgress,
            }}
          >
            {leftActionIcon || <Check className="w-6 h-6" />}
          </div>
        </div>
      )}

      {/* Right action (revealed when swiping left) */}
      {onSwipeLeft && (
        <div
          className={cn(
            'absolute inset-y-0 right-0 flex items-center justify-center transition-opacity',
            rightActionColor
          )}
          style={{
            width: `${Math.max(Math.abs(translateX), 0)}px`,
            opacity: rightProgress,
          }}
        >
          <div
            className="flex items-center justify-center w-12 h-12 text-white"
            style={{
              transform: `scale(${0.5 + rightProgress * 0.5})`,
              opacity: rightProgress,
            }}
          >
            {rightActionIcon || <Trash2 className="w-6 h-6" />}
          </div>
        </div>
      )}

      {/* Main content */}
      <div
        className={cn(
          'relative bg-white',
          isAnimating && 'transition-transform duration-200 ease-out'
        )}
        style={{
          transform: `translateX(${translateX}px)`,
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>
    </div>
  );
}
