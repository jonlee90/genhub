'use client';

import React, { useCallback } from 'react';
import { motion } from 'framer-motion';
import { useDraggable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import type { GanttTaskBarProps } from './/gantt-types';
import { STATUS_STYLES } from './/gantt-types';

export const GanttTaskBar = React.memo(function GanttTaskBar({
  task,
  position,
  config,
  isDragging,
  isHovered,
  onHover,
  onClick,
  isMobile = false,
}: GanttTaskBarProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: task.id,
  });

  // Get status-specific styling
  const statusStyle = STATUS_STYLES[task.status];

  // Mobile: larger touch targets and minimum widths
  const minWidth = isMobile ? 30 : 20;
  const verticalPadding = isMobile ? 6 : 4;
  const barHeight = config.rowHeight - (verticalPadding * 2);

  // Memoized event handlers to prevent recreation on every render
  const handleMouseEnter = useCallback(() => {
    if (!isMobile) onHover?.(task.id);
  }, [isMobile, onHover, task.id]);

  const handleMouseLeave = useCallback(() => {
    if (!isMobile) onHover?.(null);
  }, [isMobile, onHover]);

  const handleTouchStart = useCallback(() => {
    if (isMobile) onHover?.(task.id);
  }, [isMobile, onHover, task.id]);

  const handleTouchEnd = useCallback(() => {
    if (isMobile) onHover?.(null);
  }, [isMobile, onHover]);

  const handleClick = useCallback(() => {
    onClick?.(task);
  }, [onClick, task]);

  const barStyle = {
    left: position.left,
    width: Math.max(position.width, minWidth),
    top: verticalPadding,
    height: barHeight,
    transform: transform
      ? `translate3d(${transform.x}px, 0, 0)`
      : undefined,
  };

  return (
    <motion.div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={cn(
        'absolute rounded-md cursor-grab active:cursor-grabbing bg-construction-blue ',
        'transition-all duration-200',
        isMobile ? 'touch-manipulation' : 'hover:shadow-md',
        // Clean background based on priority - removed gradients for simplicity
        task.priority === 'high' && 'bg-red-600 border border-red-700',
        task.priority === 'medium' && 'border border-amber-600 text-amber-600',
        task.priority === 'low' && 'border border-emerald-600 text-emerald-600',
        // Status overlay styles
        statusStyle,
        // Dragging and hover states
        isDragging && 'opacity-50',
        isHovered && 'ring-2 ring-construction-blue/50 ring-offset-1'
      )}
      style={barStyle}
      initial={{ scaleX: 0, opacity: 0, originX: 0 }}
      animate={{ scaleX: 1, opacity: 1 }}
      whileHover={!isMobile ? { scale: 1.01, y: -1 } : undefined}
      whileTap={isMobile ? { scale: 0.98 } : undefined}
      whileDrag={{
        scale: isMobile ? 1.02 : 1.03,
        boxShadow: '0 8px 16px rgba(0, 27, 81, 0.2)',
        zIndex: 50,
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onClick={handleClick}
    >
      {/* Progress fill (if task has actual_cost / planned_cost) */}
      {task.planned_cost && task.actual_cost && (
        <div
          className="absolute inset-0 bg-white/25 rounded-l-md transition-all"
          style={{
            width: `${Math.min((task.actual_cost / task.planned_cost) * 100, 100)}%`,
          }}
        />
      )}

      {/* Task title - clean white text */}
      <span className={cn(
        'absolute inset-0 flex items-center font-semibold text-white truncate z-10',
        isMobile ? 'px-1.5 text-[10px]' : 'px-2.5 text-xs'
      )}>
        {task.title}
      </span>

      {/* Resize handles (visual only for now) - hide on mobile, subtle styling */}
      {!isMobile && (
        <>
          <div className="absolute left-0 top-0 bottom-0 w-1.5 cursor-ew-resize hover:bg-white/20 rounded-l-md transition-colors" />
          <div className="absolute right-0 top-0 bottom-0 w-1.5 cursor-ew-resize hover:bg-white/20 rounded-r-md transition-colors" />
        </>
      )}
    </motion.div>
  );
});
