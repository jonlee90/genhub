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
 *   onBack={() => handleBack()}
 *   onContinue={() => handleContinue()}
 *   currentStep={2}
 *   totalSteps={3}
 * >
 *   <div>Modal content here</div>
 * </BottomSheetModal>
 * ```
 */

"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  m as motion,
  AnimatePresence,
  useMotionValue,
  PanInfo,
} from "framer-motion";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { getModalTheme } from "@/lib/config/modal-themes";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { BottomSheetModalHeader } from "./BottomSheetModalHeader";
import {
  BottomSheetModalProps,
  SNAP_POINT_HEIGHTS,
  ANIMATION_CONFIG,
} from "./types";

function BottomSheetModalContent({
  isOpen,
  onClose,
  children,
  icon,
  title,
  badges,
  onBack,
  onContinue,
  backLabel = "Back",
  continueLabel = "Continue",
  currentStep,
  totalSteps,
  showNavigation = true,
  continueDisabled = false,
  theme: themeName = "default",
  customTheme,
  iconColor,
  enableDragToDismiss = true,
  closeOnBackdropClick = true,
  closeOnEscape = true,
  snapPoints = ["full"],
  initialSnapPoint,
  className,
  contentClassName,
  headerClassName,
  ariaLabel,
  ariaDescribedBy,
}: BottomSheetModalProps) {
  // Get theme configuration (customTheme overrides themeName)
  const theme = customTheme || getModalTheme(themeName);

  // Detect reduced motion preference (Accessibility)
  const shouldReduceMotion = useReducedMotion();

  // Snap point state
  const [currentSnapIndex, setCurrentSnapIndex] = useState(() => {
    const initialIndex = initialSnapPoint
      ? snapPoints.indexOf(initialSnapPoint)
      : 0;
    return Math.max(0, initialIndex);
  });
  const currentSnapPoint = snapPoints[currentSnapIndex] || "half";
  const currentHeight = SNAP_POINT_HEIGHTS[currentSnapPoint];

  // Drag state
  const dragY = useMotionValue(0);
  const [isDragging, setIsDragging] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);

  // Track if component is mounted (for SSR safety with portal)
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Lock body scroll while open
  useEffect(() => {
    if (!isOpen) return;

    const scrollY = window.scrollY;
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";

    return () => {
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      window.scrollTo(0, scrollY);
    };
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, closeOnEscape, onClose]);

  // Handle drag gestures
  const handleDragStart = useCallback(() => {
    setIsDragging(true);
  }, []);

  const handleDragEnd = useCallback(
    (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      setIsDragging(false);

      const screenHeight =
        typeof window !== "undefined" ? window.innerHeight : 800;
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
      if (
        velocity < -ANIMATION_CONFIG.dismissVelocity &&
        currentSnapIndex < snapPoints.length - 1
      ) {
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
      } else if (
        draggedDistance < -dismissThreshold &&
        currentSnapIndex < snapPoints.length - 1
      ) {
        // Dragged up significantly
        setCurrentSnapIndex(currentSnapIndex + 1);
      }
      // Otherwise snap back to current position (handled by motion)
    },
    [currentHeight, currentSnapIndex, snapPoints.length, onClose],
  );

  // Handle backdrop click
  const handleBackdropClick = useCallback(() => {
    if (closeOnBackdropClick) {
      onClose();
    }
  }, [closeOnBackdropClick, onClose]);

  // Don't render until mounted (SSR safety) or if not open
  if (!isMounted) return null;

  const modalContent = (
    <AnimatePresence mode="wait">
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="bottom-sheet-backdrop"
            className="fixed inset-0 z-50 bg-black/60 dark:bg-black/80 backdrop-blur-sm"
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
              "fixed inset-x-0 bottom-0 z-50",
              "flex flex-col",
              "bg-white dark:bg-gray-900 rounded-t-3xl shadow-2xl",
              "overflow-hidden",
              className,
            )}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={ANIMATION_CONFIG.spring}
            style={{
              height: "92vh",
              maxHeight: "92dvh",
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
                drag={shouldReduceMotion ? false : "y"}
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={{ top: 0, bottom: 0.3 }}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                style={{ y: dragY }}
                aria-hidden="true"
              >
                <div
                  className={cn(
                    "h-1.5 w-12 rounded-full transition-colors duration-150",
                    isDragging
                      ? "bg-gray-400 dark:bg-gray-500"
                      : "bg-gray-300 dark:bg-gray-700",
                  )}
                />
              </motion.div>
            ) : (
              <div
                className="flex justify-center pt-3 pb-2 flex-shrink-0"
                aria-hidden="true"
              >
                <div className="h-1.5 w-12 bg-gray-300 dark:bg-gray-700 rounded-full" />
              </div>
            )}

            {/* Header */}
            <BottomSheetModalHeader
              icon={icon}
              title={title}
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
                "flex-1 overflow-y-auto overflow-x-hidden",
                "px-5 py-4 pb-20",
                // Custom scrollbar styling
                "scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-gray-100 dark:scrollbar-track-gray-800",
                contentClassName,
              )}
            >
              {children}
            </div>

            {/* Fixed Navigation Bar - Bottom corners */}
            {showNavigation && (onBack || onContinue) && (
              <>
                {typeof totalSteps === "number" &&
                  typeof currentStep === "number" && (
                    <span className="sr-only">{`Step ${currentStep} of ${totalSteps}`}</span>
                  )}
                {/* Back Button - Hidden on step 1 */}
                {onBack && (!currentStep || currentStep > 1) && (
                  <button
                    onClick={onBack}
                    className={cn(
                      "absolute bottom-0 left-0",
                      "h-11 px-4 min-h-[44px] rounded-lg",
                      "bg-gray-100 dark:bg-gray-800",
                      "flex items-center gap-2",
                      "font-medium text-gray-700 dark:text-gray-200",
                      "transition-all duration-150",
                      "active:scale-95 active:bg-gray-200 dark:active:bg-gray-700",
                      "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400",
                      "ml-5 mb-0",
                    )}
                    aria-label={backLabel}
                  >
                    <ArrowLeft className="w-5 h-5" />
                    <span>{backLabel}</span>
                  </button>
                )}

                {/* Continue Button - Always at bottom right */}
                {onContinue && (
                  <button
                    onClick={onContinue}
                    disabled={continueDisabled}
                    className={cn(
                      "absolute bottom-0 right-0",
                      "h-11 px-6 min-h-[44px] rounded-lg",
                      "flex items-center gap-2",
                      "font-semibold text-white",
                      "transition-all duration-150",
                      "shadow-md",
                      continueDisabled
                        ? "opacity-50 cursor-not-allowed"
                        : "active:scale-95 hover:shadow-lg",
                      "focus:outline-none focus:ring-2 focus:ring-offset-2",
                      "disabled:active:scale-100",
                      "mr-5 mb-0",
                    )}
                    style={{
                      background: continueDisabled
                        ? "#9CA3AF"
                        : `linear-gradient(135deg, ${theme.gradientFrom} 0%, ${theme.gradientTo} 100%)`,
                      // @ts-ignore - CSS custom property
                      "--tw-ring-color": theme.ring,
                    }}
                    aria-label={continueLabel}
                  >
                    <span>{continueLabel}</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>
                )}
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  // Render modal via portal to escape stacking contexts
  return createPortal(modalContent, document.body);
}

// Export main component as BottomSheetModal
export { BottomSheetModalContent as BottomSheetModal };

// Export sub-components and types
export { BottomSheetModalHeader } from "./BottomSheetModalHeader";
export type {
  BottomSheetModalProps,
  BottomSheetModalHeaderProps,
  SnapPoint,
} from "./types";
