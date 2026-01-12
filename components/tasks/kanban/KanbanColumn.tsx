'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { TaskCard } from '../list/TaskCard';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { HardHat } from 'lucide-react';
import type { Database } from '@/types/database.types';

type TaskStatus = Database['public']['Enums']['task_status'];

type Task = Database['public']['Tables']['tasks']['Row'] & {
  assignee?: {
    id: string;
    name: string;
    email: string;
    avatar_url: string | null;
  } | null;
  project?: {
    id: string;
    name: string;
  } | null;
  phase?: {
    id: string;
    name: string;
  } | null;
};

// Phase type for project context
type Phase = {
  id: string;
  name: string;
  order_index?: number;
};

interface KanbanColumnProps {
  id: TaskStatus;
  title: string;
  color: string;
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
  /** When provided, we're in project context - pass to TaskCard for phase lookup */
  phases?: Phase[];
  /** Mobile mode - full width layout */
  isMobile?: boolean;
}

export function KanbanColumn({ id, title, color, tasks, onTaskClick, phases, isMobile = false }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
  });

  return (
    <motion.div
      className={cn(
        'flex-shrink-0 rounded-lg border-2 transition-all duration-300 bg-white shadow-construction',
        'border-gray-200',
        isMobile ? 'w-full' : 'w-[300px]'
      )}
      animate={isOver ? {
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06), 0 0 20px rgba(0, 27, 81, 0.4), inset 0 0 10px rgba(0, 27, 81, 0.2)',
        borderColor: 'rgba(0, 27, 81, 0.5)',
        scale: isMobile ? 1 : 1.02
      } : {
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        borderColor: 'rgba(229, 231, 235, 1)',
        scale: 1
      }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
    >
      {/* Column Header - hidden on mobile since we have tabs */}
      {!isMobile && (
        <div className="p-3 border-b-2 border-gray-200 bg-gradient-to-r from-[#001B51]/5 to-transparent">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-sm uppercase tracking-wider text-[#001B51]">
              {title}
            </h3>
            <span className="text-xs font-bold text-[#001B51] bg-gray-50 px-2 py-0.5 rounded-full border border-[#001B51]/20">
              {tasks.length}
            </span>
          </div>
        </div>
      )}

      {/* Column Content - Scrollable with optimized height */}
      <div
        ref={setNodeRef}
        className={cn(
          "p-3 min-h-[200px] bg-white overflow-y-auto scroll-smooth",
          "scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100",
          isMobile
            ? "max-h-[calc(100dvh-240px)]" // Mobile: Account for sticky tabs + bottom nav
            : "max-h-[calc(100vh-150px)]"  // Desktop: Account for page header + padding
        )}
      >
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {tasks.length === 0 ? (
              <motion.div
                className="flex flex-col items-center justify-center py-12"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <HardHat className="w-16 h-16 text-[#001B51]/30" />
                </motion.div>
                <p className="mt-4 text-sm font-bold text-gray-600">No tasks yet</p>
                <p className="text-xs text-gray-500">Start building your workflow</p>
              </motion.div>
            ) : (
              tasks.map((task) => (
                <TaskCard key={task.id} task={task} onTaskClick={onTaskClick} phases={phases} />
              ))
            )}
          </div>
        </SortableContext>
      </div>
    </motion.div>
  );
}
