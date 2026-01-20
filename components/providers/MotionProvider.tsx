"use client";

import { LazyMotion } from "framer-motion";
import { domAnimation } from "@/lib/motion-features";

/**
 * Motion Provider Component
 *
 * Wraps the app with LazyMotion to enable bundle splitting
 * for Framer Motion animations. This reduces initial JS bundle
 * by ~30KB by lazy-loading animation features.
 *
 * Benefits:
 * - Smaller initial bundle
 * - Faster page loads
 * - Same animation capabilities
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      {children}
    </LazyMotion>
  );
}
