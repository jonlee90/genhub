/**
 * Pure geometry utilities for measurement tools.
 * No React, no side effects.
 * Task: EST-P3-001-C
 */

export type Point = { x: number; y: number };

/**
 * Calculate the area of a polygon using the Shoelace formula.
 * Returns area in pixel² (caller divides by scaleRatio² to get real-world units).
 */
export function calculatePolygonArea(points: Point[]): number {
  const n = points.length;
  if (n < 3) return 0;

  let sum = 0;
  for (let i = 0; i < n; i++) {
    const curr = points[i];
    const next = points[(i + 1) % n];
    sum += curr.x * next.y - next.x * curr.y;
  }
  return 0.5 * Math.abs(sum);
}

/**
 * Calculate the total length of a polyline (sum of segment lengths).
 * Returns length in pixels (caller divides by scaleRatio to get real-world units).
 */
export function calculatePolylineLength(points: Point[]): number {
  if (points.length < 2) return 0;

  let total = 0;
  for (let i = 0; i < points.length - 1; i++) {
    total += pointDistance(points[i], points[i + 1]);
  }
  return total;
}

/**
 * Euclidean distance between two points.
 */
export function pointDistance(a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Convert a pixel measurement to feet using a scale ratio (pixels per foot).
 */
export function scalePixelsToFeet(pixels: number, scaleRatio: number): number {
  if (scaleRatio <= 0) return 0;
  return pixels / scaleRatio;
}
