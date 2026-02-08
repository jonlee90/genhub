"use client";

import React, { useCallback } from "react";
import { cn } from "@/lib/utils";
import ChevronRight from "lucide-react/icons/chevron-right";
import ChevronDown from "lucide-react/icons/chevron-down";
import { getPhaseIcon } from "./phase-icons";
import type { PhaseGroup, PhasePosition, GanttConfig } from "./gantt-types";

interface GanttPhaseRowProps {
  phaseGroup: PhaseGroup;
  phasePosition: PhasePosition;
  config: GanttConfig;
  onToggleCollapse: (phaseId: string) => void;
  isMobile?: boolean;
  /** Right edge X of the bracket connector (relative to timeline area) */
  bracketEndX?: number;
}

export const GanttPhaseRow = React.memo(function GanttPhaseRow({
  phaseGroup,
  phasePosition,
  config,
  onToggleCollapse,
  isMobile = false,
  bracketEndX,
}: GanttPhaseRowProps) {
  const { sidebarWidth, rowHeight } = config;
  // If bracketEndX is provided, extend the bracket to connect with the vertical line
  const bracketWidth =
    bracketEndX != null
      ? bracketEndX - phasePosition.left
      : phasePosition.width;
  const PhaseIcon = getPhaseIcon(phaseGroup.name, phaseGroup.iconName);
  const ChevronIcon = phaseGroup.isCollapsed ? ChevronRight : ChevronDown;

  const handleToggle = useCallback(() => {
    onToggleCollapse(phaseGroup.id);
  }, [onToggleCollapse, phaseGroup.id]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onToggleCollapse(phaseGroup.id);
      }
    },
    [onToggleCollapse, phaseGroup.id],
  );

  return (
    <div
      className="flex border-b border-gray-200 dark:border-gray-700"
      style={{
        height: rowHeight,
        contentVisibility: "auto",
        containIntrinsicSize: `auto ${rowHeight}px`,
      }}
    >
      {/* Left sidebar: Phase info with collapse toggle */}
      <div
        className={cn(
          "sticky left-0 z-10 border-r border-gray-200 dark:border-gray-800 flex items-center cursor-pointer transition-colors bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800/70",
          isMobile ? "gap-1.5 px-2 py-1" : "gap-3 px-3 py-2",
        )}
        style={{ width: sidebarWidth }}
        onClick={handleToggle}
        role="button"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        aria-label={`${phaseGroup.isCollapsed ? "Expand" : "Collapse"} ${phaseGroup.name}`}
      >
        {/* Collapse toggle - 44px touch target */}
        <button
          className={cn(
            "flex items-center justify-center shrink-0 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors",
            isMobile ? "hidden" : "h-8 w-8",
          )}
          onClick={(e) => {
            e.stopPropagation();
            handleToggle();
          }}
          aria-label={
            phaseGroup.isCollapsed ? "Expand phase" : "Collapse phase"
          }
        >
          <ChevronIcon
            className={cn(
              "text-gray-600 dark:text-gray-400",
              isMobile ? "h-5 w-5" : "h-4 w-4",
            )}
            strokeWidth={2.5}
          />
        </button>

        {/* Phase icon */}
        <PhaseIcon
          className={cn(
            "shrink-0 text-gray-600 dark:text-gray-400",
            isMobile ? "h-4 w-4" : "h-5 w-5",
          )}
          strokeWidth={2}
        />

        {/* Phase name and task count */}
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <span
            className={cn(
              "truncate font-semibold text-gray-900 dark:text-gray-100",
              isMobile ? "text-xs" : "text-sm",
            )}
          >
            {phaseGroup.name}
          </span>
          <span
            className={cn(
              "shrink-0 text-gray-500 dark:text-gray-400",
              isMobile ? "text-[10px]" : "text-xs",
            )}
          >
            ({phaseGroup.tasks.length})
          </span>
        </div>
      </div>

      {/* Right area: Phase summary bar */}
      <div className="relative flex-1">
        {phaseGroup.allCompleted ? (
          /* Simple horizontal bar for completed phases (no bracket/hook) */
          <div
            className="absolute bg-gray-400 dark:bg-gray-600 rounded-full"
            style={{
              left: phasePosition.left,
              width: phasePosition.width,
              top: rowHeight / 2 - 4,
              height: 8,
            }}
          />
        ) : (
          <>
            {/* L-shaped bracket: horizontal bar with right edge flowing down */}
            <div
              className="absolute border-t-[3px] border-r-[3px] border-gray-500 dark:border-gray-400 rounded-tr-md"
              style={{
                left: phasePosition.left,
                width: bracketWidth,
                top: rowHeight / 2,
                height: rowHeight / 2,
              }}
            />
            {/* Left triangle (downward pointing) */}
            <div
              className="absolute"
              style={{
                left: phasePosition.left - 5,
                top: rowHeight / 2 - 6,
                width: 0,
                height: 0,
                borderLeft: "5px solid transparent",
                borderRight: "5px solid transparent",
                borderTop: "6px solid",
                borderTopColor: "rgb(107 114 128)", // gray-500
              }}
            />
          </>
        )}
      </div>
    </div>
  );
});
