"use client";

import { useRef } from "react";
import { m as motion, PanInfo } from "framer-motion";
import {
  panelVariants,
  panelTransition,
  GESTURE_CONFIG,
  reducedMotionVariants,
  reducedMotionTransition,
} from "./animations";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import type { SlideMenuPanelProps } from "./types";

export function SlideMenuPanel({ children, onClose }: SlideMenuPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();

  const variants = shouldReduceMotion
    ? reducedMotionVariants.panel
    : panelVariants;
  const transition = shouldReduceMotion
    ? reducedMotionTransition
    : panelTransition;

  // Handle drag end - dismiss if velocity or distance threshold met
  const handleDragEnd = (
    event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo,
  ) => {
    const panelWidth = panelRef.current?.offsetWidth || 300;
    const velocity = info.velocity.x;
    const offset = info.offset.x;

    // Dismiss if:
    // 1. Fast swipe to the right (> 500px/s)
    // 2. Dragged more than 35% of panel width
    const shouldDismiss =
      velocity > GESTURE_CONFIG.dismissVelocity ||
      offset > panelWidth * GESTURE_CONFIG.dismissDistance;

    if (shouldDismiss) {
      onClose();
    }
    // Otherwise spring back animation is handled by framer-motion
  };

  return (
    <motion.div
      ref={panelRef}
      className="fixed top-0 right-0 bottom-0 z-50 md:hidden w-[85vw] max-w-[360px]"
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={transition}
      drag={shouldReduceMotion ? false : "x"}
      dragConstraints={GESTURE_CONFIG.dragConstraints}
      dragElastic={GESTURE_CONFIG.dragElastic}
      onDragEnd={handleDragEnd}
      style={{
        paddingTop: "env(safe-area-inset-top, 0px)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Navigation menu"
    >
      <div className="h-full bg-white shadow-2xl overflow-hidden flex flex-col">
        {children}
      </div>
    </motion.div>
  );
}
