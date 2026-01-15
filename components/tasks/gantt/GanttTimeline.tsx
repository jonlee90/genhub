'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { getTodayPosition } from './gantt-utils';
import type { GanttConfig, DateCell } from './gantt-types';

interface GanttTimelineProps {
  config: GanttConfig;
  dateCells: DateCell[];
  taskCount: number;
}

export const GanttTimeline = React.memo(function GanttTimeline({ config, dateCells, taskCount }: GanttTimelineProps) {
  const { rowHeight, sidebarWidth } = config;
  const totalHeight = taskCount * rowHeight;
  const todayX = getTodayPosition(config);
  const isMobile = sidebarWidth <= 140;

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
      className="absolute inset-0 pointer-events-none"
      style={{
        left: sidebarWidth,
        height: totalHeight,
      }}
    >
      {/* Arrow marker for today */}
      <defs>
        <marker
          id="today-arrow"
          markerWidth={isMobile ? '6' : '8'}
          markerHeight={isMobile ? '6' : '8'}
          refX={isMobile ? '3' : '4'}
          refY={isMobile ? '3' : '4'}
          orient="auto-start-reverse"
        >
          <polygon
            points={isMobile ? '0 0, 6 3, 0 6' : '0 0, 8 4, 0 8'}
            fill="#001B51"
          />
        </marker>
      </defs>

      {/* Solid white background */}
      <rect width="100%" height="100%" fill="#FFFFFF" />

      {/* Weekend shading */}
      {weekendRects.map((rect, index) => (
        <rect
          key={`weekend-${index}`}
          x={rect.x}
          y={0}
          width={rect.width}
          height={totalHeight}
          fill="#F3F4F6"
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
          stroke="#E5E7EB"
          strokeWidth={isMobile ? '0.5' : '1'}
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
          stroke="#E5E7EB"
          strokeWidth={isMobile ? '0.5' : '1'}
        />
      ))}

      {/* Today marker - animated pulsing line */}
      <motion.g
        initial={{ opacity: 0.5 }}
        animate={{
          opacity: [0.5, 1, 0.5],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <line
          x1={todayX}
          y1={0}
          x2={todayX}
          y2={totalHeight}
          stroke="#001B51"
          strokeWidth={isMobile ? '1.5' : '2'}
          strokeDasharray={isMobile ? '3 2' : '4 2'}
        />
        {/* Top arrow */}
        <line
          x1={todayX}
          y1={0}
          x2={todayX}
          y2={0}
          stroke="#001B51"
          strokeWidth={isMobile ? '1.5' : '2'}
          markerStart="url(#today-arrow)"
        />
      </motion.g>
    </svg>
  );
});
