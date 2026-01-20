"use client";

import { m as motion } from "framer-motion";
import {
  backdropVariants,
  backdropTransition,
  prefersReducedMotion,
  reducedMotionVariants,
  reducedMotionTransition,
} from "./animations";
import type { SlideMenuBackdropProps } from "./types";

export function SlideMenuBackdrop({ onClick }: SlideMenuBackdropProps) {
  const variants = prefersReducedMotion
    ? reducedMotionVariants.backdrop
    : backdropVariants;
  const transition = prefersReducedMotion
    ? reducedMotionTransition
    : backdropTransition;

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm md:hidden"
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={transition}
      onClick={onClick}
      aria-hidden="true"
    />
  );
}
