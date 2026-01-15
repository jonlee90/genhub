'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { createDependencyPath } from './gantt-utils';
import type { GanttDependencyLinesProps } from './gantt-types';

export const GanttDependencyLines = React.memo(function GanttDependencyLines({ lines, hoveredTaskId }: GanttDependencyLinesProps) {
  if (lines.length === 0) return null;

  return (
    <svg className="absolute inset-0 pointer-events-none z-5" style={{ overflow: 'visible' }}>
      <defs>
        {/* Arrow marker for dependencies */}
        <marker
          id="arrow-head"
          markerWidth="10"
          markerHeight="7"
          refX="9"
          refY="3.5"
          orient="auto"
        >
          <polygon points="0 0, 10 3.5, 0 7" fill="#7A7A7A" className="opacity-70" />
        </marker>

        {/* Highlighted arrow marker */}
        <marker
          id="arrow-head-highlight"
          markerWidth="10"
          markerHeight="7"
          refX="9"
          refY="3.5"
          orient="auto"
        >
          <polygon points="0 0, 10 3.5, 0 7" fill="#001B51" />
        </marker>
      </defs>

      {/* Dependency lines */}
      {lines.map((line) => {
        const isHighlighted =
          line.isHighlighted ||
          hoveredTaskId === line.fromTaskId ||
          hoveredTaskId === line.toTaskId;

        return (
          <motion.path
            key={line.id}
            d={createDependencyPath(line.fromX, line.fromY, line.toX, line.toY)}
            stroke={isHighlighted ? '#001B51' : '#7A7A7A'}
            strokeWidth={isHighlighted ? 3 : 2}
            fill="none"
            markerEnd={isHighlighted ? 'url(#arrow-head-highlight)' : 'url(#arrow-head)'}
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{
              pathLength: 1,
              opacity: isHighlighted ? 1 : 0.5,
            }}
            transition={{
              pathLength: { duration: 0.8, ease: 'easeInOut' },
              opacity: { duration: 0.3 },
            }}
            className="transition-all"
          />
        );
      })}
    </svg>
  );
});
