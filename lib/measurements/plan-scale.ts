/**
 * Plan scale utilities for converting between pixel and real-world measurements.
 * No React, no side effects.
 * Task: EST-P3-001-C
 */

/**
 * Derive a scale ratio (pixels per foot) from a drawn line and its known real-world length.
 * @param drawnPixels - The length of the drawn calibration line in pixels
 * @param realWorldFeet - The known real-world length in feet
 * @returns pixels per foot
 */
export function deriveScaleRatio(
  drawnPixels: number,
  realWorldFeet: number,
): number {
  if (realWorldFeet <= 0 || drawnPixels <= 0) return 0;
  return drawnPixels / realWorldFeet;
}

/**
 * Format a measurement value with its unit for display.
 * Rounds to 2 decimal places.
 */
export function formatMeasurement(value: number, unit: string): string {
  const rounded = Math.round(value * 100) / 100;
  return `${rounded} ${unit}`;
}
