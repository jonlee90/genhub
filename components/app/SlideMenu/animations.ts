import type { Transition, Variants } from "framer-motion";

/**
 * Enhanced SlideMenu Animation Variants
 *
 * Premium glassmorphism-style animations for mobile menu.
 * Features blur effects, spring physics, and staggered children.
 */

// ============================================================================
// Panel Animations
// ============================================================================

/**
 * Panel slide animation - right to left with blur entrance
 */
export const panelVariants: Variants = {
  initial: {
    x: "100%",
    opacity: 0.5,
  },
  animate: {
    x: 0,
    opacity: 1,
  },
  exit: {
    x: "100%",
    opacity: 0,
  },
};

export const panelTransition: Transition = {
  type: "spring",
  stiffness: 300,
  damping: 30,
  mass: 0.8,
};

// ============================================================================
// Backdrop Animations
// ============================================================================

/**
 * Backdrop fade with blur animation
 */
export const backdropVariants: Variants = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
  },
  exit: {
    opacity: 0,
  },
};

export const backdropTransition: Transition = {
  duration: 0.3,
  ease: "easeOut",
};

// ============================================================================
// User Section Animations
// ============================================================================

export const userSectionVariants: Variants = {
  initial: { opacity: 0, y: -10 },
  animate: { opacity: 1, y: 0 },
};

export const userSectionTransition: Transition = {
  duration: 0.25,
  delay: 0.05,
  ease: "easeOut",
};

// ============================================================================
// List Animations (Staggered)
// ============================================================================

/**
 * Container for staggered list items
 */
export const listContainerVariants: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.1,
    },
  },
};

/**
 * Individual list item animation
 */
export const listItemVariants: Variants = {
  initial: { opacity: 0, x: 20 },
  animate: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: 0.05 + i * 0.04, // 40ms stagger
      type: "spring",
      stiffness: 400,
      damping: 25,
    },
  }),
};

// ============================================================================
// Theme Toggle Animations
// ============================================================================

/**
 * Sun icon animation variants (2-state: light ↔ dark)
 */
export const sunVariants: Variants = {
  light: {
    scale: 1,
    rotate: 0,
    opacity: 1,
  },
  dark: {
    scale: 0.5,
    rotate: 90,
    opacity: 0,
  },
};

/**
 * Moon icon animation variants (2-state: light ↔ dark)
 */
export const moonVariants: Variants = {
  light: {
    scale: 0.5,
    rotate: -90,
    opacity: 0,
  },
  dark: {
    scale: 1,
    rotate: 0,
    opacity: 1,
  },
};

export const themeToggleTransition: Transition = {
  type: "spring",
  stiffness: 400,
  damping: 25,
};

// ============================================================================
// Gesture Configuration
// ============================================================================

export const GESTURE_CONFIG = {
  // Drag constraints
  dragConstraints: { left: 0, right: 0 },
  dragElastic: { left: 0, right: 0.3 },

  // Dismiss thresholds
  dismissVelocity: 500, // px/s
  dismissDistance: 0.35, // 35% of panel width

  // Spring back if not dismissed
  springBack: {
    type: "spring" as const,
    stiffness: 400,
    damping: 30,
  },
};

// ============================================================================
// Reduced Motion Variants (Accessibility)
// ============================================================================

/**
 * Simplified animations for users who prefer reduced motion.
 * Uses instant transitions instead of spring animations.
 */
export const reducedMotionVariants = {
  panel: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  backdrop: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  userSection: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
  },
  listItem: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
  },
  themeToggle: {
    light: { opacity: 1 },
    dark: { opacity: 1 },
  },
};

export const reducedMotionTransition: Transition = {
  duration: 0.15,
};

// ============================================================================
// Active Indicator Animation (Accent Bar)
// ============================================================================

export const activeIndicatorTransition: Transition = {
  type: "spring",
  stiffness: 400,
  damping: 30,
};
