/**
 * Motion Utilities
 *
 * Shared animation variants and helpers that respect
 * reduced motion preferences and optimize performance
 */

import type { Variants, Transition } from "framer-motion";

/**
 * Default transitions optimized for performance
 */
export const transitions = {
  fast: { duration: 0.2, ease: "easeOut" } as Transition,
  normal: { duration: 0.3, ease: "easeInOut" } as Transition,
  slow: { duration: 0.5, ease: "easeInOut" } as Transition,
  spring: { type: "spring", stiffness: 300, damping: 30 } as Transition,
  springBouncy: { type: "spring", stiffness: 400, damping: 25 } as Transition,
} as const;

/**
 * Fade animations
 */
export const fadeVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

/**
 * Slide animations
 */
export const slideVariants = {
  fromLeft: {
    hidden: { x: -20, opacity: 0 },
    visible: { x: 0, opacity: 1 },
    exit: { x: -20, opacity: 0 },
  },
  fromRight: {
    hidden: { x: 20, opacity: 0 },
    visible: { x: 0, opacity: 1 },
    exit: { x: 20, opacity: 0 },
  },
  fromTop: {
    hidden: { y: -20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
    exit: { y: -20, opacity: 0 },
  },
  fromBottom: {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
    exit: { y: 20, opacity: 0 },
  },
} as const;

/**
 * Scale animations
 */
export const scaleVariants: Variants = {
  hidden: { scale: 0.95, opacity: 0 },
  visible: { scale: 1, opacity: 1 },
  exit: { scale: 0.95, opacity: 0 },
};

/**
 * Modal/Dialog animations
 */
export const modalVariants: Variants = {
  hidden: { scale: 0.95, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: transitions.fast,
  },
  exit: {
    scale: 0.95,
    opacity: 0,
    transition: transitions.fast,
  },
};

/**
 * Backdrop animations
 */
export const backdropVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: transitions.fast },
  exit: { opacity: 0, transition: transitions.fast },
};

/**
 * List item stagger animations
 */
export const listContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

export const listItemVariants: Variants = {
  hidden: { y: 10, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: transitions.fast,
  },
};

/**
 * Helper function to create reduced-motion-safe variants
 *
 * @param variants - Original animation variants
 * @param shouldReduceMotion - Whether to reduce motion
 * @returns Variants with animations disabled if shouldReduceMotion is true
 */
export function getAccessibleVariants(
  variants: Variants,
  shouldReduceMotion: boolean
): Variants {
  if (!shouldReduceMotion) return variants;

  // For reduced motion, remove all animations but keep opacity
  const reducedVariants: Variants = {};
  for (const key in variants) {
    const variant = variants[key];
    if (typeof variant === "object" && variant !== null) {
      reducedVariants[key] = {
        opacity: "opacity" in variant ? variant.opacity : 1,
        transition: { duration: 0 },
      };
    }
  }
  return reducedVariants;
}

/**
 * Helper to disable animations when shouldReduceMotion is true
 */
export function getReducedAnimation<T>(
  animation: T,
  shouldReduceMotion: boolean
): T | false {
  return shouldReduceMotion ? false : animation;
}
