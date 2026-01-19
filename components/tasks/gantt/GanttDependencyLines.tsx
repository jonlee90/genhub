"use client";

import React, { useMemo } from "react";
import { createDependencyPath } from "./gantt-utils";
import type { GanttDependencyLinesProps, DependencyLine } from "./gantt-types";

// Memoized individual path component to prevent unnecessary re-renders
const DependencyPath = React.memo(function DependencyPath({
  line,
  hoveredTaskId,
}: {
  line: DependencyLine;
  hoveredTaskId: string | null;
}) {
  const isHighlighted =
    line.isHighlighted ||
    hoveredTaskId === line.fromTaskId ||
    hoveredTaskId === line.toTaskId;

  const pathD = useMemo(
    () => createDependencyPath(line.fromX, line.fromY, line.toX, line.toY),
    [line.fromX, line.fromY, line.toX, line.toY]
  );

  // Calculate path length for stroke-dasharray animation
  const pathLength = useMemo(() => {
    const dx = line.toX - line.fromX;
    const dy = line.toY - line.fromY;
    // Approximate bezier curve length (slightly longer than straight line)
    return Math.sqrt(dx * dx + dy * dy) * 1.2;
  }, [line.fromX, line.fromY, line.toX, line.toY]);

  return (
    <path
      d={pathD}
      stroke={isHighlighted ? "#001B51" : "#7A7A7A"}
      strokeWidth={isHighlighted ? 3 : 2}
      fill="none"
      markerEnd={isHighlighted ? "url(#arrow-head-highlight)" : "url(#arrow-head)"}
      className="transition-all duration-300"
      style={{
        strokeDasharray: pathLength,
        strokeDashoffset: 0,
        opacity: isHighlighted ? 1 : 0.5,
        animation: "drawLine 0.8s ease-in-out forwards",
      }}
    />
  );
});

export const GanttDependencyLines = React.memo(function GanttDependencyLines({ lines, hoveredTaskId }: GanttDependencyLinesProps) {
  if (lines.length === 0) return null;

  return (
    <svg className="absolute inset-0 pointer-events-none z-5" style={{ overflow: "visible" }}>
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

      {/* Dependency lines - CSS animations replace Framer Motion (bundle-defer-third-party) */}
      {lines.map((line) => (
        <DependencyPath
          key={line.id}
          line={line}
          hoveredTaskId={hoveredTaskId}
        />
      ))}
    </svg>
  );
});
