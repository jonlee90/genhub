"use client";

/**
 * TouchButton Component
 *
 * Standardized touch-optimized button with haptic feedback.
 *
 * Features:
 * - 4 variants: primary, secondary, ghost, danger
 * - 3 sizes: sm (44px), md (48px), lg (56px)
 * - Touch feedback: active:scale-[0.97], active:opacity-90
 * - Haptic feedback via useHapticFeedback
 * - Icon support (left/right position)
 * - Loading state with spinner
 * - Disabled state
 */

import { forwardRef, useCallback } from "react";
import { Loader2, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useHapticFeedback } from "@/lib/hooks/useHapticFeedback";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface TouchButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Button variant */
  variant?: ButtonVariant;
  /** Button size: sm=44px, md=48px, lg=56px */
  size?: ButtonSize;
  /** Full width button */
  fullWidth?: boolean;
  /** Loading state with spinner */
  loading?: boolean;
  /** Icon component (Lucide) */
  icon?: LucideIcon;
  /** Icon position */
  iconPosition?: "left" | "right";
  /** Enable haptic feedback (default: true) */
  haptic?: boolean;
  /** Children */
  children?: React.ReactNode;
}

// Size configurations
const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-11 min-w-[44px] px-4 text-sm", // 44px
  md: "h-12 min-w-[48px] px-5 text-base", // 48px
  lg: "h-14 min-w-[56px] px-6 text-base", // 56px
};

// Icon sizes by button size
const iconSizes: Record<ButtonSize, string> = {
  sm: "w-4 h-4",
  md: "w-5 h-5",
  lg: "w-5 h-5",
};

// Variant styles
const variantStyles: Record<ButtonVariant, string> = {
  primary: cn(
    "bg-[#001B51] text-white",
    "active:bg-[#001B51]/80",
    "disabled:bg-gray-300 disabled:text-gray-500",
  ),
  secondary: cn(
    "bg-white text-[#001B51] border-2 border-[#001B51]",
    "active:bg-gray-100",
    "disabled:border-gray-300 disabled:text-gray-400",
  ),
  ghost: cn(
    "bg-transparent text-[#001B51]",
    "active:bg-gray-100",
    "disabled:text-gray-400",
  ),
  danger: cn(
    "bg-[#DC2626] text-white",
    "active:bg-[#DC2626]/80",
    "disabled:bg-gray-300 disabled:text-gray-500",
  ),
};

export const TouchButton = forwardRef<HTMLButtonElement, TouchButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      fullWidth = false,
      loading = false,
      icon: Icon,
      iconPosition = "left",
      haptic = true,
      children,
      className,
      disabled,
      onClick,
      ...props
    },
    ref,
  ) => {
    const { trigger } = useHapticFeedback();

    // Handle click with haptic feedback
    const handleClick = useCallback(
      (e: React.MouseEvent<HTMLButtonElement>) => {
        // Trigger haptic feedback on press
        if (haptic) {
          trigger("light");
        }

        // Call original onClick
        onClick?.(e);
      },
      [haptic, onClick, trigger],
    );

    // Determine if button should be disabled
    const isDisabled = disabled || loading;

    // Icon component to render
    const iconSize = iconSizes[size];
    const IconComponent = loading ? Loader2 : Icon;
    const iconElement = IconComponent ? (
      <IconComponent
        className={cn(iconSize, loading && "animate-spin")}
        aria-hidden="true"
      />
    ) : null;

    return (
      <button
        ref={ref}
        type="button"
        disabled={isDisabled}
        onClick={handleClick}
        className={cn(
          // Base styles
          "inline-flex items-center justify-center gap-2",
          "font-semibold rounded-xl",
          "select-none touch-manipulation",

          // Touch feedback
          "active:scale-[0.97] active:opacity-90",
          "transition-all duration-100",

          // Disabled state
          "disabled:pointer-events-none disabled:opacity-50",

          // Size
          sizeStyles[size],

          // Variant
          variantStyles[variant],

          // Width
          fullWidth && "w-full",

          className,
        )}
        {...props}
      >
        {/* Icon left */}
        {iconElement && iconPosition === "left" && iconElement}

        {/* Children */}
        {children && <span>{children}</span>}

        {/* Icon right */}
        {iconElement && iconPosition === "right" && iconElement}
      </button>
    );
  },
);

TouchButton.displayName = "TouchButton";
