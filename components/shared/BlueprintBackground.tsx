'use client';

import { memo } from 'react';
import { cn } from '@/lib/utils';

interface BlueprintBackgroundProps {
  /**
   * Opacity of the grid pattern (0-1)
   * @default 0.03
   */
  opacity?: number;
  /**
   * Size of grid cells in pixels
   * @default 40
   */
  gridSize?: number;
  /**
   * Grid line color
   * @default 'var(--construction-blue)' (construction-blue)
   */
  color?: string;
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * BlueprintBackground - Construction-themed grid background
 *
 * A reusable decorative background component that displays a subtle blueprint-style
 * grid pattern. Used across multiple pages to maintain visual consistency with
 * the construction/industrial theme.
 *
 * Features:
 * - Fixed positioning (covers entire viewport)
 * - Non-interactive (pointer-events-none)
 * - Subtle opacity for minimal visual interference
 * - Customizable grid size, color, and opacity
 *
 * @example
 * // Default usage
 * <BlueprintBackground />
 *
 * @example
 * // Custom opacity for more prominent grid
 * <BlueprintBackground opacity={0.05} />
 *
 * @example
 * // Custom grid size
 * <BlueprintBackground gridSize={60} />
 */
export const BlueprintBackground = memo(function BlueprintBackground({
  opacity = 0.03,
  gridSize = 40,
  color = 'var(--construction-blue)',
  className,
}: BlueprintBackgroundProps) {
  return (
    <div
      className={cn('fixed inset-0 pointer-events-none -z-10', className)}
      style={{ opacity }}
    >
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(to right, currentColor 1px, transparent 1px),
            linear-gradient(to bottom, currentColor 1px, transparent 1px)
          `,
          backgroundSize: `${gridSize}px ${gridSize}px`,
          color,
        }}
      />
    </div>
  );
});
