'use client';

import { cn } from '@/lib/utils';
import type { GanttHeaderProps } from './gantt-types';

export function GanttHeader({ config, dateGroups, dateCells }: GanttHeaderProps) {
  const { sidebarWidth, headerHeight } = config;
  const isMobile = sidebarWidth <= 140;
  return (
    <div
      className="sticky top-0 z-20 bg-white border-b-2 border-construction-blue/20 shadow-lg"
      style={{ height: headerHeight + 15 }}
    >
      <div className="flex h-full">
        {/* Sidebar header */}
        <div
          className="sticky left-0 z-30 bg-gradient-to-br from-construction-blue via-blue-700 to-blue-800 border-r-2 border-construction-blue/30 flex items-center justify-center shadow-md"
          style={{ width: sidebarWidth, padding: isMobile ? '0 8px' : '0 16px' }}
        >
          <span className={cn(
            'text-white font-black tracking-wider drop-shadow-sm',
            isMobile ? 'text-xs' : 'text-sm'
          )}>
            {isMobile ? 'TASK' : 'TASKS'}
          </span>
        </div>

        {/* Timeline header */}
        <div className="relative flex-1 bg-gradient-to-b from-gray-50 to-white overflow-hidden">
          {/* Month/Year groups (top row) */}
          <div className="absolute inset-x-0 top-0 h-1/2 border-b-2 border-construction-blue/10">
            {dateGroups.map((group, index) => (
              <div
                key={index}
                className="absolute border-r border-gray-200 flex items-center justify-center bg-gradient-to-b from-white to-gray-50/50"
                style={{
                  left: group.startX,
                  width: group.width,
                  height: '100%',
                }}
              >
                <span className={cn(
                  'font-black text-construction-blue tracking-wider uppercase drop-shadow-sm',
                  isMobile ? 'text-[10px]' : 'text-sm'
                )}>
                  {group.label}
                </span>
              </div>
            ))}
          </div>

          {/* Date cells (bottom row) */}
          <div className="absolute inset-x-0 bottom-0 h-1/2">
            {dateCells.map((cell, index) => (
              <div
                key={index}
                className={cn(
                  'absolute border-r border-gray-200 flex flex-col items-center justify-center gap-0.5 transition-all duration-200',
                  // Updated padding: more vertical space for breathing room
                  isMobile ? 'text-[9px] py-2' : 'text-xs py-3',
                  cell.isToday && 'bg-construction-blue/15 border-l-2 border-r-2 border-construction-blue shadow-inner ring-1 ring-construction-blue/20',
                  cell.isWeekend && !cell.isToday && 'bg-gray-100/80',
                  !cell.isToday && !cell.isWeekend && 'hover:bg-gray-50'
                )}
                style={{
                  left: cell.x,
                  width: cell.width,
                  height: '100%',
                }}
              >
                <span className={cn(
                  'font-bold tracking-wide',
                  cell.isToday ? 'text-construction-blue' : 'text-gray-600',
                  isMobile ? 'text-[9px]' : 'text-xs'
                )}>
                  {cell.label.split(' ')[0]}
                </span>
                {!isMobile && (
                  <span className={cn(
                    'font-black',
                    cell.isToday ? 'text-construction-blue text-base' : 'text-gray-800 text-sm'
                  )}>
                    {cell.label.split(' ')[1]}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
