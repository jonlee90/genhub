/**
 * BottomSheetModal Component
 * Mobile-optimized modal using bottom sheet pattern with native app feel
 *
 * Features:
 * - Slides up from bottom with spring physics
 * - Drag-to-dismiss gesture support
 * - Multiple snap points (content, half, full)
 * - Construction theme styling
 * - Safe area handling for notched devices
 * - 44px minimum touch targets
 *
 * Usage:
 * ```tsx
 * <BottomSheetModal
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   icon={ClipboardList}
 *   title="Task Details"
 *   subtitle="Optional description"
 *   rightActions={<Button onClick={handleSubmit}>Save</Button>}
 * >
 *   <div>Modal content here</div>
 * </BottomSheetModal>
 * ```
 */

'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { m as motion, AnimatePresence, useMotionValue, PanInfo } from 'framer-motion';
import { cn } from '@/lib/utils';
import { getModalTheme } from '@/lib/config/modal-themes';

import { BottomSheetModalHeader } from './BottomSheetModalHeader';
import { BottomSheetModalFooter } from './BottomSheetModalFooter';
import {
  BottomSheetModalProps,
  SNAP_POINT_HEIGHTS,
  ANIMATION_CONFIG,
} from './types';

export function BottomSheetModal({
  isOpen,
  onClose,
  children,
  icon,
  title,
  subtitle,
  badges,
  leftActions,
  rightActions,
  showFooter = true,
  theme: themeName = 'default',
  customTheme,
  iconColor,
  enableDragToDismiss = true,
  closeOnBackdropClick = true,
  closeOnEscape = true,
  snapPoints = ['full'],
  initialSnapPoint,
  className,
  contentClassName,
  headerClassName,
  footerClassName,
  ariaLabel,
  ariaDescribedBy,
}: BottomSheetModalProps) {
  // Get theme configuration (customTheme overrides themeName)
  const theme = customTheme || getModalTheme(themeName);

  // Snap point state
  const [currentSnapIndex, setCurrentSnapIndex] = useState(0);
  const currentSnapPoint = snapPoints[currentSnapIndex] || 'half';
  const currentHeight = SNAP_POINT_HEIGHTS[currentSnapPoint];

  // Drag state
  const dragY = useMotionValue(0);
  const [isDragging, setIsDragging] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);

  // Initialize snap point when opening
  useEffect(() => {
    if (isOpen) {
      const initialIndex = initialSnapPoint
        ? snapPoints.indexOf(initialSnapPoint)
        : 0;
      setCurrentSnapIndex(Math.max(0, initialIndex));
    }
  }, [isOpen, initialSnapPoint, snapPoints]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      const scrollY = window.scrollY;
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';

      return () => {
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeOnEscape, onClose]);

  // Handle drag gestures
  const handleDragStart = useCallback(() => {
    setIsDragging(true);
  }, []);

  const handleDragEnd = useCallback(
    (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      setIsDragging(false);

      const screenHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
      const sheetHeight = screenHeight * currentHeight;
      const draggedDistance = info.offset.y;
      const velocity = info.velocity.y;

      // Fast swipe down = dismiss
      if (velocity > ANIMATION_CONFIG.dismissVelocity) {
        if (currentSnapIndex === 0) {
          onClose();
        } else {
          setCurrentSnapIndex(0);
        }
        return;
      }

      // Fast swipe up = expand
      if (velocity < -ANIMATION_CONFIG.dismissVelocity && currentSnapIndex < snapPoints.length - 1) {
        setCurrentSnapIndex(currentSnapIndex + 1);
        return;
      }

      // Check if dragged past dismiss threshold
      const dismissThreshold = sheetHeight * ANIMATION_CONFIG.dismissThreshold;

      if (draggedDistance > dismissThreshold) {
        // Dragged down significantly
        if (currentSnapIndex === 0) {
          onClose();
        } else {
          setCurrentSnapIndex(Math.max(0, currentSnapIndex - 1));
        }
      } else if (draggedDistance < -dismissThreshold && currentSnapIndex < snapPoints.length - 1) {
        // Dragged up significantly
        setCurrentSnapIndex(currentSnapIndex + 1);
      }
      // Otherwise snap back to current position (handled by motion)
    },
    [currentHeight, currentSnapIndex, snapPoints.length, onClose]
  );

  // Handle backdrop click
  const handleBackdropClick = useCallback(() => {
    if (closeOnBackdropClick) {
      onClose();
    }
  }, [closeOnBackdropClick, onClose]);

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="bottom-sheet-backdrop"
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleBackdropClick}
            aria-hidden="true"
          />

          {/* Sheet container - Fixed at 92% height */}
          <motion.div
            key="bottom-sheet-container"
            ref={sheetRef}
            className={cn(
              'fixed inset-x-0 bottom-0 z-50',
              'flex flex-col',
              'bg-white rounded-t-3xl shadow-2xl',
              'overflow-hidden',
              className
            )}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={ANIMATION_CONFIG.spring}
            style={{
              height: '92vh',
              maxHeight: '92dvh',
            }}
            role="dialog"
            aria-modal="true"
            aria-label={ariaLabel || title}
            aria-describedby={ariaDescribedBy}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top accent gradient strip */}
            <div
              className="h-1 w-full rounded-t-3xl flex-shrink-0"
              style={{
                background: `linear-gradient(90deg, ${theme.gradientFrom} 0%, ${theme.gradientTo} 100%)`,
              }}
              aria-hidden="true"
            />

            {/* Drag handle with gesture support */}
            {enableDragToDismiss ? (
              <motion.div
                className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing touch-none flex-shrink-0"
                drag="y"
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={{ top: 0, bottom: 0.3 }}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                style={{ y: dragY }}
                aria-hidden="true"
              >
                <div
                  className={cn(
                    'h-1.5 w-12 rounded-full transition-colors duration-150',
                    isDragging ? 'bg-gray-400' : 'bg-gray-300'
                  )}
                />
              </motion.div>
            ) : (
              <div className="flex justify-center pt-3 pb-2 flex-shrink-0" aria-hidden="true">
                <div className="h-1.5 w-12 bg-gray-300 rounded-full" />
              </div>
            )}

            {/* Header */}
            <BottomSheetModalHeader
              icon={icon}
              title={title}
              subtitle={subtitle}
              badges={badges}
              onClose={onClose}
              themePrimary={theme.primary}
              themeGradientFrom={theme.gradientFrom}
              themeGradientTo={theme.gradientTo}
              iconColor={iconColor}
              className={headerClassName}
            />

            {/* Scrollable content area */}
            <div
              className={cn(
                'flex-1 overflow-y-auto overflow-x-hidden',
                'px-5 py-4',
                // Custom scrollbar styling
                'scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100',
                contentClassName
              )}
            >
              {children}
            </div>

            {/* Footer */}
            {showFooter && (leftActions || rightActions) && (
              <BottomSheetModalFooter
                leftActions={leftActions}
                rightActions={rightActions}
                className={footerClassName}
              />
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Export sub-components and types
export { BottomSheetModalHeader } from './BottomSheetModalHeader';
export { BottomSheetModalFooter } from './BottomSheetModalFooter';
export type {
  BottomSheetModalProps,
  BottomSheetModalHeaderProps,
  BottomSheetModalFooterProps,
  SnapPoint,
} from './types';
