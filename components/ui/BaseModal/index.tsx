/**
 * BaseModal Component
 * Production-grade modal system with construction-themed design
 * Built on Radix UI Dialog with custom construction theme
 * Responsive: Bottom sheet on mobile (with drag-to-dismiss), centered modal on desktop
 */

"use client";

import { useState, useMemo, useCallback } from "react";
import { m as motion, useMotionValue, PanInfo } from "framer-motion";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { getModalTheme } from "@/lib/config/modal-themes";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { BaseModalHeader } from "./BaseModalHeader";

import { BaseModalProps, MODAL_MAX_WIDTHS } from "./types";

// Drag-to-dismiss constants
const DRAG_DISMISS_VELOCITY = 500; // px/s - fast swipe dismisses regardless of position
const DRAG_DISMISS_THRESHOLD = 0.6; // 60% of screen height
const SPRING_CONFIG = { stiffness: 400, damping: 35 };

export function BaseModal({
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
  showNavigation = true,
  continueDisabled = false,
  steps,
  currentStep = 1,
  theme: themeName = "default",
  customTheme,
  iconColor,
  closeOnBackdropClick = true,
  closeOnEscape = true,
  formKey,
  maxWidth = "xl",
  enableDragToDismiss = true,
  snapPoints: _snapPoints, // Reserved for future snap point behavior
  className,
  contentClassName,
  headerClassName,
  footerClassName,
  ariaLabel,
  ariaDescribedBy,
}: BaseModalProps) {
  // Memoize theme configuration to prevent recreation on every render
  const theme = useMemo(
    () => customTheme || getModalTheme(themeName),
    [customTheme, themeName],
  );

  // Detect mobile for bottom sheet behavior
  const isMobile = useMediaQuery("(max-width: 767px)");

  // Detect reduced motion preference (Accessibility)
  const shouldReduceMotion = useReducedMotion();

  // Drag-to-dismiss state (Vercel: rerender-lazy-state-init - use function for expensive initial state)
  const dragY = useMotionValue(0);
  const [isDragging, setIsDragging] = useState(false);

  // Memoize dialog state change handler to prevent recreating on every render
  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (!newOpen) {
        onClose();
      }
    },
    [onClose],
  );

  // Memoize drag end handler to prevent recreating on every render
  const handleDragEnd = useCallback(
    (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      setIsDragging(false);
      const screenHeight =
        typeof window !== "undefined" ? window.innerHeight : 800;
      const draggedPastThreshold =
        info.offset.y > screenHeight * DRAG_DISMISS_THRESHOLD;
      const fastSwipe = info.velocity.y > DRAG_DISMISS_VELOCITY;

      if (draggedPastThreshold || fastSwipe) {
        // Dismiss modal
        onClose();
      }
    },
    [onClose],
  );

  // Memoize drag start handler to prevent recreating on every render
  const handleDragStart = useCallback(() => {
    setIsDragging(true);
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        className={cn(
          "bg-white dark:bg-gray-900 shadow-2xl flex flex-col p-0 gap-0 border-0 z-50",
          // Mobile: Bottom sheet styles
          isMobile && [
            "rounded-t-3xl",
            "max-h-[90vh]",
            "w-full",
            "fixed inset-x-0 bottom-0 top-auto left-0 right-0",
            "translate-x-0 translate-y-0",
          ],
          // Desktop: Centered modal styles - let Radix UI handle centering
          !isMobile && [
            "rounded-2xl",
            "max-h-[90vh]",
            MODAL_MAX_WIDTHS[maxWidth],
          ],
          className,
        )}
        aria-label={ariaLabel || title}
        aria-describedby={ariaDescribedBy}
        onPointerDownOutside={(e) => {
          if (!closeOnBackdropClick) {
            e.preventDefault();
          }
        }}
        onEscapeKeyDown={(e) => {
          if (!closeOnEscape) {
            e.preventDefault();
          }
        }}
      >
        {/* DialogTitle for accessibility - hidden visually but available to screen readers */}
        <DialogTitle className="sr-only">{title}</DialogTitle>

        {/* Hide the built-in X close button from DialogContent (keep custom rounded button in header) */}
        <style>{`
          /* Hide the default close button with the X icon (absolute right-4 top-4) */
          button.absolute.right-4.top-4 {
            display: none !important;
            visibility: hidden !important;
          }
        `}</style>
        {/* Top accent gradient strip */}
        <div
          className={cn(
            "h-1.5 w-full",
            isMobile ? "rounded-t-3xl" : "rounded-t-2xl",
          )}
          style={{
            background: `linear-gradient(90deg, ${theme.gradientFrom} 0%, ${theme.gradientTo} 100%)`,
          }}
          aria-hidden="true"
        >
          {/* Animated shimmer effect with dark mode support */}
          <div
            className="h-full w-full opacity-40"
            style={{
              background: `linear-gradient(90deg, transparent 0%, ${
                typeof window !== "undefined" &&
                window.matchMedia("(prefers-color-scheme: dark)").matches
                  ? "rgba(255, 255, 255, 0.2)"
                  : "rgba(255, 255, 255, 0.4)"
              } 50%, transparent 100%)`,
              backgroundSize: "200% 100%",
              animation: "shimmer 3s infinite",
            }}
          />
        </div>

        {/* Mobile: Drag handle with drag-to-dismiss */}
        {isMobile && enableDragToDismiss ? (
          <motion.div
            className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing touch-none"
            aria-hidden="true"
            drag={shouldReduceMotion ? false : "y"}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.2 }}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            style={{ y: dragY }}
            transition={
              shouldReduceMotion
                ? { duration: 0 }
                : { type: "spring", ...SPRING_CONFIG }
            }
          >
            <div
              className={cn(
                "h-1.5 w-12 rounded-full transition-colors",
                isDragging
                  ? "bg-gray-400 dark:bg-gray-500"
                  : "bg-gray-300 dark:bg-gray-700",
              )}
            />
          </motion.div>
        ) : isMobile ? (
          <div className="flex justify-center pt-3 pb-2" aria-hidden="true">
            <div className="h-1.5 w-12 bg-gray-300 dark:bg-gray-700 rounded-full" />
          </div>
        ) : null}

        {/* Header with integrated step indicator */}
        <BaseModalHeader
          icon={icon}
          title={title}
          badges={badges}
          onClose={onClose}
          theme={theme}
          iconColor={iconColor}
          className={headerClassName}
          steps={steps}
          currentStep={currentStep}
        />

        {/* Scrollable content area */}
        <div
          className={cn(
            "flex-1 overflow-y-auto overflow-x-hidden",
            "px-6 py-4 pb-20",
            // Custom scrollbar styling with dark mode support
            "scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-gray-100 dark:scrollbar-track-gray-800",
            contentClassName,
          )}
          style={{
            maxHeight: isMobile ? "calc(90vh - 280px)" : "calc(90vh - 280px)",
          }}
        >
          {/* Key prop for form remounting */}
          <div key={formKey}>{children}</div>
        </div>

        {/* Fixed Navigation Bar - Bottom corners */}
        {showNavigation && (onBack || onContinue) && (
          <>
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
                  "hover:bg-gray-200 dark:hover:bg-gray-700",
                  "active:scale-95",
                  "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400",
                  "ml-6 mb-4",
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
                    : "hover:shadow-lg active:scale-95",
                  "focus:outline-none focus:ring-2 focus:ring-offset-2",
                  "disabled:active:scale-100",
                  "mr-6 mb-4",
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
      </DialogContent>
    </Dialog>
  );
}

// Export sub-components and types
export { BaseModalHeader } from "./BaseModalHeader";
export { StepIndicator } from "./StepIndicator";
export type {
  BaseModalProps,
  BaseModalHeaderProps,
  StepIndicatorProps,
  ModalTheme,
  ModalSize,
} from "./types";

// Add shimmer animation to global styles (if not already present)
if (typeof document !== "undefined") {
  const styleId = "basemodal-animations";
  if (!document.getElementById(styleId)) {
    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `
      @keyframes shimmer {
        0% { background-position: -200% 0; }
        100% { background-position: 200% 0; }
      }
    `;
    document.head.appendChild(style);
  }
}
