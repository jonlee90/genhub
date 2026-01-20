"use client";

import { useEffect, useState } from "react";

/**
 * Hook to detect user's reduced motion preference
 *
 * Returns true if the user prefers reduced motion
 * (via OS settings or browser preferences)
 *
 * Usage:
 * const shouldReduceMotion = useReducedMotion();
 * <motion.div animate={shouldReduceMotion ? false : animation} />
 */
export function useReducedMotion(): boolean {
  const [shouldReduceMotion, setShouldReduceMotion] = useState(false);

  useEffect(() => {
    // Check if window is available (client-side only)
    if (typeof window === "undefined") return;

    // Create media query
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    // Set initial value
    setShouldReduceMotion(mediaQuery.matches);

    // Listen for changes
    const handleChange = (event: MediaQueryListEvent) => {
      setShouldReduceMotion(event.matches);
    };

    // Modern browsers
    mediaQuery.addEventListener("change", handleChange);

    // Cleanup
    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, []);

  return shouldReduceMotion;
}
