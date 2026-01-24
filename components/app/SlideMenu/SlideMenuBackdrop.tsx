"use client";

import { m as motion } from "framer-motion";
import {
  backdropVariants,
  backdropTransition,
  reducedMotionVariants,
  reducedMotionTransition,
} from "./animations";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import type { SlideMenuBackdropProps } from "./types";

export function SlideMenuBackdrop({ onClick }: SlideMenuBackdropProps) {
  const shouldReduceMotion = useReducedMotion();

  const variants = shouldReduceMotion
    ? reducedMotionVariants.backdrop
    : backdropVariants;
  const transition = shouldReduceMotion
    ? reducedMotionTransition
    : backdropTransition;

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-md md:hidden"
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
