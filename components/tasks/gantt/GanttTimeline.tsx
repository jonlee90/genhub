"use client";

import React, { useMemo, useState, useEffect } from "react";
import { getTodayPosition } from "./gantt-utils";
import type { GanttConfig, DateCell } from "./gantt-types";

interface GanttTimelineProps {
  config: GanttConfig;
  dateCells: DateCell[];
  taskCount: number;
  totalWidth: number;
}

export const GanttTimeline = React.memo(function GanttTimeline({ config, dateCells, taskCount, totalWidth }: GanttTimelineProps) {
  const { rowHeight, sidebarWidth } = config;
  // Calculate the grid width (chart area without sidebar)
  const gridWidth = totalWidth - sidebarWidth;
  const totalHeight = taskCount * rowHeight;
  const todayX = getTodayPosition(config);
  const isMobile = sidebarWidth <= 140;

  // Detect dark mode
  const [isDarkMode, setIsDarkMode] = useState(false);
  useEffect(() => {
    // Check if dark mode is enabled
    setIsDarkMode(document.documentElement.classList.contains('dark'));

    // Watch for theme changes
    const observer = new MutationObserver(() => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    return () => observer.disconnect();
  }, []);

  // Define colors based on dark mode
  const colors = {
    weekend: isDarkMode ? '#1f2937' : '#F3F4F6',
    line: isDarkMode ? '#374151' : '#E5E7EB',
  };

  // Memoize weekend rectangles to prevent recalculation on every render
  const weekendRects = useMemo(() =>
    dateCells
      .filter((cell) => cell.isWeekend)
      .map((cell) => ({
        x: cell.x,
        width: cell.width,
      })),
    [dateCells]
  );

  // Memoize row dividers
  const rowDividers = useMemo(() =>
    Array.from({ length: taskCount }, (_, i) => i * rowHeight),
    [taskCount, rowHeight]
  );

  return (
    <svg
      className="absolute top-0 pointer-events-none"
      style={{
        left: sidebarWidth,
        width: gridWidth,
        height: totalHeight,
      }}
    >
      {/* Arrow marker for today */}
      <defs>
        <marker
          id="today-arrow"
          markerWidth={isMobile ? "6" : "8"}
          markerHeight={isMobile ? "6" : "8"}
          refX={isMobile ? "3" : "4"}
          refY={isMobile ? "3" : "4"}
          orient="auto-start-reverse"
        >
          <polygon
            points={isMobile ? "0 0, 6 3, 0 6" : "0 0, 8 4, 0 8"}
            fill="var(--construction-blue)"
          />
        </marker>
      </defs>

      {/* Solid background for the bar area - provides consistent base for grid lines */}
      <rect
        x={0}
        y={0}
        width="100%"
        height={totalHeight}
        fill={isDarkMode ? '#111827' : '#ffffff'}
      />

      {/* Weekend shading */}
      {weekendRects.map((rect, index) => (
        <rect
          key={`weekend-${index}`}
          x={rect.x}
          y={0}
          width={rect.width}
          height={totalHeight}
          fill={colors.weekend}
          opacity={0.5}
        />
      ))}

      {/* Vertical date lines - thinner on mobile */}
      {dateCells.map((cell, index) => (
        <line
          key={`vline-${index}`}
          x1={cell.x}
          y1={0}
          x2={cell.x}
          y2={totalHeight}
          stroke={colors.line}
          strokeWidth={isMobile ? "0.5" : "1"}
        />
      ))}

      {/* Horizontal row dividers - thinner on mobile */}
      {rowDividers.map((y, index) => (
        <line
          key={`hline-${index}`}
          x1={0}
          y1={y}
          x2="100%"
          y2={y}
          stroke={colors.line}
          strokeWidth={isMobile ? "0.5" : "1"}
        />
      ))}

      {/* Today marker - CSS animated pulsing line (replaced Framer Motion for bundle size) */}
      <g className="animate-pulse-opacity">
        <line
          x1={todayX}
          y1={0}
          x2={todayX}
          y2={totalHeight}
          stroke="var(--construction-blue)"
          strokeWidth={isMobile ? "1.5" : "2"}
          strokeDasharray={isMobile ? "3 2" : "4 2"}
        />
        {/* Top arrow */}
        <line
          x1={todayX}
          y1={0}
          x2={todayX}
          y2={0}
          stroke="var(--construction-blue)"
          strokeWidth={isMobile ? "1.5" : "2"}
          markerStart="url(#today-arrow)"
        />
      </g>
    </svg>
  );
});
