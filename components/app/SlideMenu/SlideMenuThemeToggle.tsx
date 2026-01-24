"use client";

/**
 * SlideMenuThemeToggle Component
 *
 * A 2-state animated toggle for theme preference (Light ↔ Dark).
 * Designed specifically for the SlideMenu with glassmorphism styling.
 *
 * Features:
 * - Simple toggle: light ↔ dark
 * - Animated icon transitions using Framer Motion
 * - Haptic feedback on selection
 * - Touch-friendly (52px × 44px pill - meets 44px minimum)
 * - Accessible with proper ARIA attributes
 * - Reduced motion support
 */

import { useCallback } from "react";
import { m as motion } from "framer-motion";
import { Sun, Moon } from "lucide-react";
import { useTheme, type ThemePreference } from "@/lib/context/ThemeContext";
import { useHapticFeedback } from "@/lib/hooks/useHapticFeedback";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import {
  sunVariants,
  moonVariants,
  themeToggleTransition,
  reducedMotionVariants,
} from "./animations";
import { cn } from "@/lib/utils";
import type { SlideMenuThemeToggleProps } from "./types";

export function SlideMenuThemeToggle({
  preference,
  onToggle,
  className,
}: SlideMenuThemeToggleProps) {
  const { trigger } = useHapticFeedback();
  const shouldReduceMotion = useReducedMotion();

  const handleToggle = useCallback(() => {
    trigger("light");
    onToggle();
  }, [onToggle, trigger]);

  // Determine icon variant based on preference (light or dark only)
  const iconVariant = shouldReduceMotion ? "light" : preference;
  const transition = shouldReduceMotion
    ? { duration: 0 }
    : themeToggleTransition;

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-label={`Current theme: ${preference}. Click to toggle.`}
      className={cn(
        // Pill container - 52px × 44px (touch target compliant)
        "relative inline-flex items-center justify-center",
        "w-[52px] h-[44px] rounded-full",
        // Glassmorphic background
        "bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm",
        "border border-white/30 dark:border-white/10",
        // Touch feedback
        "active:scale-[0.96] active:bg-white/50 dark:active:bg-gray-800/50",
        "transition-all duration-150",
        className
      )}
    >
      {/* Sun icon (light mode) */}
      <motion.div
        className="absolute"
        variants={shouldReduceMotion ? reducedMotionVariants.themeToggle : sunVariants}
        initial={false}
        animate={iconVariant}
        transition={transition}
      >
        <Sun className="w-4 h-4 text-amber-500" />
      </motion.div>

      {/* Moon icon (dark mode) */}
      <motion.div
        className="absolute"
        variants={shouldReduceMotion ? reducedMotionVariants.themeToggle : moonVariants}
        initial={false}
        animate={iconVariant}
        transition={transition}
      >
        <Moon className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
      </motion.div>
    </button>
  );
}
