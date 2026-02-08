"use client";

import React from "react";
import { cn } from "@/lib/utils";
import type { GanttHeaderProps } from "./gantt-types";

export const GanttHeader = React.memo(function GanttHeader({
  config,
  dateGroups,
  dateCells,
  taskCount,
}: GanttHeaderProps) {
  const { sidebarWidth, headerHeight } = config;
  const isMobile = sidebarWidth <= 140;
  return (
    <div
      className="sticky top-0 z-20 bg-white dark:bg-gray-900 border-b-2 border-construction-blue/20 dark:border-construction-blue/30 shadow-lg"
      style={{ height: headerHeight + 15 }}
    >
      <div className="flex h-full">
        {/* Sidebar header */}
        <div
          className="sticky left-0 z-30 bg-gradient-to-br from-construction-blue via-blue-700 to-blue-800 flex items-center shadow-md"
          style={{
            width: sidebarWidth,
            padding: isMobile ? "0 8px" : "0 16px",
          }}
        >
          <span
            className={cn(
              "text-white font-black tracking-wider drop-shadow-sm",
              isMobile ? "text-xs" : "text-sm",
            )}
          >
            {taskCount + " TASKS"}
          </span>
        </div>

        {/* Timeline header */}
        <div className="relative flex-1 bg-gradient-to-b from-gray-50 dark:from-gray-800 to-white dark:to-gray-900 overflow-hidden">
          {/* Month/Year groups (top row) */}
          <div className="absolute inset-x-0 top-0 h-1/2 border-b-2 border-construction-blue/10">
            {dateGroups.map((group, index) => (
              <div
                key={index}
                className={cn(
                  "absolute border-r border-gray-200 dark:border-gray-700 flex items-center bg-gradient-to-b from-white dark:from-gray-900 to-gray-50/50 dark:to-gray-800/50",
                  isMobile ? "justify-start pl-2" : "justify-center",
                )}
                style={{
                  left: group.startX,
                  width: group.width,
                  height: "100%",
                }}
              >
                <span
                  className={cn(
                    "font-black text-construction-blue dark:text-blue-400 tracking-wider uppercase drop-shadow-sm",
                    isMobile ? "text-[10px]" : "text-sm",
                  )}
                >
                  {group.label}
                </span>
              </div>
            ))}
          </div>

          {/* Date cells (bottom row) */}
          <div className="absolute inset-x-0 bottom-0 h-1/2">
            {dateCells.map((cell, index) => {
              // Memoize split operation to avoid recalculation
              const labelParts = cell.label.split(" ");
              return (
                <div
                  key={index}
                  className={cn(
                    "absolute border-r border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center gap-0.5 transition-all duration-200",
                    // Updated padding: more vertical space for breathing room
                    isMobile ? "text-[9px] py-2" : "text-xs py-3",
                    cell.isToday &&
                      "bg-construction-blue/15 dark:bg-construction-blue/20 border-l-2 border-r-2 border-construction-blue dark:border-construction-blue shadow-inner ring-1 ring-construction-blue/20 dark:ring-construction-blue/40",
                    cell.isWeekend &&
                      !cell.isToday &&
                      "bg-gray-100/80 dark:bg-gray-800/50",
                    !cell.isToday &&
                      !cell.isWeekend &&
                      "hover:bg-gray-50 dark:hover:bg-gray-800/30",
                  )}
                  style={{
                    left: cell.x,
                    width: cell.width,
                    height: "100%",
                  }}
                >
                  <span
                    className={cn(
                      "font-bold tracking-wide",
                      cell.isToday
                        ? "text-construction-blue dark:text-blue-400"
                        : "text-gray-600 dark:text-gray-300",
                      isMobile ? "text-[9px]" : "text-xs",
                    )}
                  >
                    {labelParts[0]}
                  </span>
                  {!isMobile ? (
                    <span
                      className={cn(
                        "font-black",
                        cell.isToday
                          ? "text-construction-blue dark:text-blue-400 text-base"
                          : "text-gray-800 dark:text-gray-200 text-sm",
                      )}
                    >
                      {labelParts[1]}
                    </span>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
});
