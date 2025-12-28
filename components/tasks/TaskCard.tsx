'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Calendar, AlertTriangle, Ban, Package, Wrench, Pencil, Layers as LayersIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import type { Database } from '@/types/database.types';

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
  materialStats?: {
    count: number;
    totalCost: number;
  };
};

// Phase type for project context
type Phase = {
  id: string;
  name: string;
  order_index?: number;
};

interface TaskCardProps {
  task: Task;
  isDragging?: boolean;
  onTaskClick?: (task: Task) => void;
  /** When provided, we're in project context - show phase from this array instead of task.phase */
  phases?: Phase[];
  /** Show edit indicator on hover - default true when phases provided */
  showEditIndicator?: boolean;
}

const PRIORITY_CONFIG = {
  low: {
    label: 'Low',
    color: 'bg-[#059669]/10 text-[#059669]',
    border: 'border-l-4 border-[#059669]',
  },
  medium: {
    label: 'Medium',
    color: 'bg-[#FFB627]/10 text-[#FFB627]',
    border: 'border-l-4 border-[#FFB627]',
  },
  high: {
    label: 'High',
    color: 'bg-[#DC2626]/10 text-[#DC2626]',
    border: 'border-l-4 border-[#DC2626]',
  },
};

export function TaskCard({ task, isDragging = false, onTaskClick, phases, showEditIndicator }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Parse due date properly to avoid UTC timezone issues
  const isOverdue = (() => {
    if (!task.due_date || task.status === 'completed') return false;
    const [year, month, day] = task.due_date.split('T')[0].split('-').map(Number);
    const dueDate = new Date(year, month - 1, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return dueDate < today;
  })();

  const isBlocked = task.status === 'blocked';

  // In project context (phases provided), look up phase from phases array
  const phase = phases ? phases.find((p) => p.id === task.phase_id) : task.phase;

  // Show edit indicator when explicitly set, or when in project context (phases provided)
  const shouldShowEditIndicator = showEditIndicator ?? !!phases;

  const priorityConfig = PRIORITY_CONFIG[task.priority];

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (date: string) => {
    // Parse date components manually to avoid UTC timezone issues
    // new Date("2025-12-15") is interpreted as midnight UTC, which displays
    // as the previous day in timezones behind UTC (e.g., US timezones)
    const [year, month, day] = date.split('T')[0].split('-').map(Number);
    return new Date(year, month - 1, day).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(1)}k`;
    }
    return `$${amount.toFixed(0)}`;
  };

  const hasMaterials = task.materialStats && task.materialStats.count > 0;

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="touch-manipulation"
      animate={isSortableDragging ? {
        opacity: 0.5,
        scale: 0.95
      } : isDragging ? {
        scale: 1.05,
        rotate: 2,
        boxShadow: '0 10px 20px rgba(0, 27, 81, 0.3)'
      } : {
        scale: 1,
        rotate: 0,
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
      }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      <div onClick={() => onTaskClick?.(task)}>
        <Card
          className={cn(
            'p-3 bg-white hover:shadow-md transition-shadow cursor-pointer relative border-2 group',
            priorityConfig.border,
            isBlocked && 'border-red-300 bg-red-50',
            isOverdue && !isBlocked && 'border-orange-300'
          )}
        >
          {/* Edit indicator on hover */}
          {shouldShowEditIndicator && (
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
              <div className="bg-construction-blue text-white p-1.5 rounded-lg shadow-lg">
                <Pencil className="w-3 h-3" />
              </div>
            </div>
          )}

          {/* Material Badge - Industrial Stamped Metal Style - hidden when edit indicator is showing */}
          {hasMaterials && (
            <motion.div
              className={cn(
                "absolute top-2 right-2 z-10",
                shouldShowEditIndicator && "group-hover:hidden"
              )}
              initial={{ scale: 0, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 15 }}
              title={`${task.materialStats!.count} materials - ${formatCurrency(task.materialStats!.totalCost)}`}
            >
              {/* Stamped Metal Badge Design */}
              <div className="relative">
                {/* Shadow layers for depth */}
                <div className="absolute inset-0 bg-construction-accent rounded-lg blur-sm opacity-40 translate-y-0.5" />

                {/* Main badge with rivets */}
                <div className="relative bg-gradient-to-br from-construction-accent via-construction-accent to-[#2a2a2a] border-2 border-[#2a2a2a] rounded-lg px-2.5 py-1.5 shadow-lg">
                  {/* Decorative corner rivets */}
                  <div className="absolute top-0.5 left-0.5 w-1 h-1 bg-gray-400 rounded-full shadow-inner" />
                  <div className="absolute top-0.5 right-0.5 w-1 h-1 bg-gray-400 rounded-full shadow-inner" />
                  <div className="absolute bottom-0.5 left-0.5 w-1 h-1 bg-gray-400 rounded-full shadow-inner" />
                  <div className="absolute bottom-0.5 right-0.5 w-1 h-1 bg-gray-400 rounded-full shadow-inner" />

                  {/* Content */}
                  <div className="flex items-center gap-1.5">
                    {/* Stacked layers icon for materials */}
                    <div className="relative">
                      <LayersIcon className="w-3.5 h-3.5 text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]" />
                    </div>

                    {/* Count badge */}
                    <div className="flex flex-col items-start leading-none">
                      <span className="text-[10px] font-black text-white/90 tracking-wider drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]">
                        {task.materialStats!.count}
                      </span>
                      <span className="text-[8px] font-bold text-white/70 tracking-tight drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]">
                        MAT
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Title and Priority */}
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <h4 className="font-bold text-sm line-clamp-2 text-gray-900">{task.title}</h4>
              <Badge variant="secondary" className={cn('shrink-0 font-bold', priorityConfig.color)}>
                {priorityConfig.label}
              </Badge>
            </div>

            {/* Project/Phase - show project name in tasks context, only phase in project context */}
            {(task.project || phase) && (
              <p className="text-xs text-muted-foreground truncate">
                {phases ? (
                  // Project context - show only phase name
                  phase?.name
                ) : (
                  // Tasks page context - show project / phase
                  <>
                    {task.project?.name}
                    {phase && ` / ${phase.name}`}
                  </>
                )}
              </p>
            )}

            {/* Indicators */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {/* Due Date */}
                {task.due_date && (
                  <div
                    className={cn(
                      'flex items-center gap-1 text-xs',
                      isOverdue ? 'text-red-600' : 'text-muted-foreground'
                    )}
                  >
                    <Calendar className="h-3 w-3" />
                    {formatDate(task.due_date)}
                  </div>
                )}

                {/* Blocked Indicator */}
                {isBlocked && (
                  <div className="flex items-center gap-1 text-xs text-red-600" title={task.blocked_reason || 'Blocked'}>
                    <Ban className="h-3 w-3" />
                    <span className="sr-only">Blocked</span>
                  </div>
                )}

                {/* Overdue Indicator */}
                {isOverdue && !isBlocked && (
                  <div className="flex items-center gap-1 text-xs text-orange-600" title="Overdue">
                    <AlertTriangle className="h-3 w-3" />
                    <span className="sr-only">Overdue</span>
                  </div>
                )}

                {/* Material Cost Display - Industrial Style */}
                {hasMaterials && (
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-gradient-to-r from-construction-accent/10 to-construction-accent/5 border border-construction-accent/20 rounded-md" title={`Total materials cost: $${task.materialStats!.totalCost.toFixed(2)}`}>
                    <Package className="h-3 w-3 text-construction-accent" />
                    <span className="text-[11px] font-black text-construction-accent tracking-tight">
                      {formatCurrency(task.materialStats!.totalCost)}
                    </span>
                  </div>
                )}
              </div>

              {/* Assignee */}
              {task.assignee && (
                <Avatar className="h-6 w-6">
                  <AvatarImage src={task.assignee.avatar_url || undefined} />
                  <AvatarFallback className="text-xs">
                    {getInitials(task.assignee.name)}
                  </AvatarFallback>
                </Avatar>
              )}
            </div>

            {/* Blocked Reason */}
            {isBlocked && task.blocked_reason && (
              <p className="text-xs text-red-600 bg-red-100 p-1.5 rounded truncate">
                {task.blocked_reason}
              </p>
            )}
          </div>
        </Card>
      </div>
    </motion.div>
  );
}
