'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { GanttTaskBar } from './GanttTaskBar';
import type { GanttTask, TaskPosition, GanttConfig } from './gantt-types';

interface GanttTaskRowProps {
  task: GanttTask;
  position: TaskPosition;
  config: GanttConfig;
  isDragging?: boolean;
  hoveredTaskId: string | null;
  onHover: (taskId: string | null) => void;
  onClick: (task: GanttTask) => void;
  isMobile?: boolean;
}

export function GanttTaskRow({
  task,
  position,
  config,
  isDragging,
  hoveredTaskId,
  onHover,
  onClick,
  isMobile = false,
}: GanttTaskRowProps) {
  const { sidebarWidth, rowHeight } = config;
  const isHovered = hoveredTaskId === task.id;

  return (
    <div
      className="flex border-b border-gray-100 hover:bg-gray-50/50 transition-colors"
      style={{ height: rowHeight }}
    >
      {/* Left sidebar: Task info */}
      <div
        className={cn(
          'sticky left-0 z-10 bg-white border-r border-gray-200 flex items-center',
          isMobile ? 'gap-1.5 px-2 py-1' : 'gap-3 px-3 py-2'
        )}
        style={{ width: sidebarWidth }}
      >
        {/* Assignee avatar - only show on larger mobile/desktop */}
        {task.assignee && !isMobile && (
          <Avatar className={cn(isMobile ? 'h-6 w-6' : 'h-7 w-7', 'shrink-0')}>
            <AvatarImage src={task.assignee.avatar_url || undefined} />
            <AvatarFallback className="text-xs bg-construction-blue text-white">
              {task.assignee.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        )}

        {/* Task title and phase */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className={cn(
              'font-bold text-gray-900 truncate',
              isMobile ? 'text-xs' : 'text-sm'
            )}>
              {task.title}
            </span>
            {/* Duration days badge */}
            <span className={cn(
              'shrink-0 px-1.5 py-0.5 rounded bg-construction-blue/10 text-construction-blue font-semibold',
              isMobile ? 'text-[10px]' : 'text-xs'
            )}>
              {task.durationDays}d
            </span>
          </div>
          {/* Show phase only on desktop */}
          {task.phase && !isMobile && (
            <span className="text-xs text-gray-500 truncate block">{task.phase.name}</span>
          )}
        </div>
      </div>

      {/* Right area: Task bar */}
      <div className="relative flex-1">
        <GanttTaskBar
          task={task}
          position={position}
          config={config}
          isDragging={isDragging}
          isHovered={isHovered}
          onHover={onHover}
          onClick={onClick}
          isMobile={isMobile}
        />
      </div>
    </div>
  );
}
