"use client";

/**
 * FloatingActionButton (FAB) Component
 *
 * Primary create action button for mobile screens.
 *
 * Features:
 * - Position: fixed right-4 bottom-24 (above bottom nav)
 * - Default icon: Plus
 * - Extended variant with label
 * - Touch feedback: active:scale-95
 * - Shadow for elevation
 * - Haptic feedback
 */

import { useCallback } from "react";
import { Plus, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useHapticFeedback } from "@/lib/hooks/useHapticFeedback";

interface FloatingActionButtonProps {
  /** Click handler */
  onClick: () => void;
  /** Icon (default: Plus) */
  icon?: LucideIcon;
  /** Label for extended variant */
  label?: string;
  /** Extended variant with label (default: icon-only) */
  extended?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Custom className */
  className?: string;
  /** Accessible label (required if no visible label) */
  ariaLabel?: string;
}

export function FloatingActionButton({
  onClick,
  icon: Icon = Plus,
  label,
  extended = false,
  disabled = false,
  className,
  ariaLabel = "Create new",
}: FloatingActionButtonProps) {
  const { trigger } = useHapticFeedback();

  // Handle click with haptic feedback
  const handleClick = useCallback(() => {
    if (disabled) return;

    // Trigger haptic feedback
    trigger("light");

    onClick();
  }, [disabled, onClick, trigger]);

  // Determine if using extended variant (has label)
  const isExtended = extended || Boolean(label);

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      aria-label={isExtended ? undefined : ariaLabel}
      className={cn(
        // Fixed positioning - above bottom nav
        "fixed right-4 bottom-24",
        // Safe area
        "mb-[env(safe-area-inset-bottom)]",
        // Z-index
        "z-30",
        // Mobile only
        "md:hidden",

        // Base styles
        "inline-flex items-center justify-center",
        "bg-construction-blue dark:bg-blue-700 text-white",
        "font-semibold",
        "select-none touch-manipulation",

        // Size: icon-only vs extended
        isExtended ? "h-14 px-6 gap-2 rounded-full" : "w-14 h-14 rounded-full",

        // Elevation shadow
        "shadow-lg shadow-[var(--construction-blue)]/30 dark:shadow-blue-700/30",

        // Touch feedback
        "active:scale-95 active:shadow-md",
        "transition-all duration-100",

        // Disabled state
        "disabled:opacity-50 disabled:pointer-events-none disabled:shadow-none",

        className,
      )}
    >
      <Icon className="w-6 h-6" aria-hidden="true" />
      {isExtended && label && <span className="text-base">{label}</span>}
    </button>
  );
}
