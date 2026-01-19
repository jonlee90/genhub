import type { Transition } from "framer-motion";

// Check if user prefers reduced motion
export const prefersReducedMotion =
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Panel slide animation - right to left
export const panelVariants = {
  initial: { x: "100%" },
  animate: { x: 0 },
  exit: { x: "100%" },
};

export const panelTransition: Transition = {
  type: "spring",
  stiffness: 400,
  damping: 35,
  mass: 0.8,
};

// Backdrop fade animation (simpler)
export const backdropVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const backdropTransition: Transition = {
  duration: 0.2,
};

// User section animation (subtle)
export const userSectionVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
};

export const userSectionTransition: Transition = {
  duration: 0.2,
  delay: 0.05,
};

// List item staggered animation (faster, simpler)
export const listItemVariants = {
  initial: { opacity: 0, x: 20 },
  animate: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: 0.05 + i * 0.03, // 30ms stagger
      duration: 0.2,
      ease: "easeOut",
    },
  }),
};

// Gesture configuration for swipe-to-close
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

// Reduced motion variants (simplified animations)
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
};

export const reducedMotionTransition: Transition = {
  duration: 0.15,
};
