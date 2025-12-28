'use client';

import { motion } from 'framer-motion';
import {
  Check,
  AlertTriangle,
  Clock,
  Ban,
  Rocket,
  FileText,
  ShoppingCart,
  HardHat,
  CheckCircle2,
  Sparkles,
  Calendar,
  ListTodo
} from 'lucide-react';
import { AnimatedTooltip } from '@/components/ui/aceternity/animated-tooltip';
import { cn } from '@/lib/utils';
import type { Database } from '@/types/database.types';

type Phase = Database['public']['Tables']['project_phases']['Row'];

interface PhaseStats {
  phaseId: string;
  totalTasks: number;
  completedTasks: number;
  blockedTasks: number;
  overdueTasks: number;
}

interface PhaseStationProps {
  phase: Phase;
  stats?: PhaseStats;
  isCurrent: boolean;
  isSelected: boolean;
  onClick: () => void;
}

// Map phase names to construction-themed icons
const getPhaseIcon = (phaseName: string) => {
  const name = phaseName.toLowerCase();
  if (name.includes('initiation') || name.includes('planning')) return Rocket;
  if (name.includes('pre-construction') || name.includes('design')) return FileText;
  if (name.includes('procurement') || name.includes('procurement')) return ShoppingCart;
  if (name.includes('post') || name.includes('closeout') || name.includes('completion')) return CheckCircle2;
  if (name.includes('construction') || name.includes('execution')) return HardHat;
  return Sparkles; // Default icon
};

// Format date helper
const formatDate = (dateString: string | null) => {
  if (!dateString) return 'Not set';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export function PhaseStation({
  phase,
  stats,
  isCurrent,
  isSelected,
  onClick,
}: PhaseStationProps) {
  const isCompleted = phase.status === 'completed';
  const isInProgress = phase.status === 'in_progress';
  const hasBlockers = (stats?.blockedTasks || 0) > 0;
  const hasOverdue = (stats?.overdueTasks || 0) > 0;
  const PhaseIcon = getPhaseIcon(phase.name);

  // Tooltip content with phase details
  const tooltipContent = (
    <div className="space-y-2 min-w-[220px]">
      <div className="flex items-center justify-between border-b border-gray-700 pb-2">
        <span className="font-black text-white">{phase.name}</span>
        <span className={cn(
          "text-sm font-black",
          isCompleted && "text-construction-green",
          isInProgress && "text-construction-accent",
          !isCompleted && !isInProgress && "text-gray-400"
        )}>
          {phase.completion_percentage}%
        </span>
      </div>

      {stats && (
        <div className="space-y-1.5 text-xs text-gray-300">
          <div className="flex items-center gap-2">
            <ListTodo className="w-3.5 h-3.5 text-construction-accent" />
            <span className="font-medium">
              {stats.completedTasks}/{stats.totalTasks} tasks
            </span>
          </div>
          {stats.blockedTasks > 0 && (
            <div className="flex items-center gap-2 text-construction-red">
              <Ban className="w-3.5 h-3.5" />
              <span className="font-medium">{stats.blockedTasks} blocked</span>
            </div>
          )}
          {stats.overdueTasks > 0 && (
            <div className="flex items-center gap-2 text-construction-accent">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span className="font-medium">{stats.overdueTasks} overdue</span>
            </div>
          )}
        </div>
      )}

      <div className="space-y-1 text-xs text-gray-400 pt-2 border-t border-gray-700">
        {phase.started_at && (
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5" />
            <span>Started: {formatDate(phase.started_at)}</span>
          </div>
        )}
        {phase.completed_at && (
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5" />
            <span>Completed: {formatDate(phase.completed_at)}</span>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <AnimatedTooltip content={tooltipContent} side="top" delay={200}>
      <motion.button
      onClick={onClick}
      className="flex flex-col items-center gap-3 w-full group focus:outline-none focus-visible:outline-none"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 10 }}
    >
      {/* Station Circle with Icon and Spotlight Effect */}
      <div className="relative">
        {/* Spotlight glow for active phase - Aceternity style */}
        {isCurrent && !isCompleted && (
          <motion.div
            className="absolute inset-0 rounded-full bg-construction-blue/40 blur-2xl -z-10"
            animate={{
              scale: [1, 1.4, 1],
              opacity: [0.4, 0.7, 0.4],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        )}

        <motion.div
          className={cn(
            'relative flex items-center justify-center rounded-full border-4 transition-all duration-300 shadow-construction',
            // Debug: Larger touch target on mobile (56x56px minimum)
            'w-20 h-20 md:w-20 md:h-20',
            isCompleted && 'bg-gradient-to-br from-construction-green to-emerald-600 border-construction-green text-white shadow-emerald-200',
            isInProgress && 'bg-gradient-to-br from-construction-blue to-blue-700 border-construction-blue text-white shadow-construction-lg',
            !isCompleted && !isInProgress && 'bg-white border-gray-300 text-gray-400 shadow-gray-100',
            isCurrent && !isCompleted && 'ring-4 ring-construction-blue/30',
            isSelected && 'ring-4 ring-construction-accent/40 scale-105'
          )}
          whileHover={{ scale: 1.1, rotate: 5 }}
          transition={{ type: 'spring', stiffness: 400, damping: 10 }}
        >
          {isCompleted ? (
            <motion.div
              className="flex flex-col items-center gap-1"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <Check className="w-7 h-7 stroke-[3]" />
            </motion.div>
          ) : (
            <div className="flex flex-col items-center">
              <PhaseIcon className="w-6 h-6 mb-0.5" />
              <span className="text-xs font-black">{phase.completion_percentage}%</span>
            </div>
          )}

          {/* Pulsing ring for current phase */}
          {isCurrent && !isCompleted && (
            <motion.div
              className="absolute inset-0 rounded-full border-4 border-construction-blue"
              animate={{
                scale: [1, 1.15, 1],
                opacity: [0.5, 0, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          )}
        </motion.div>

        {/* Warning Indicators with construction theme */}
        {hasBlockers && !isCompleted && (
          <motion.div
            className="absolute -top-1.5 -right-1.5 bg-construction-red rounded-full p-1.5 shadow-construction animate-pulse border-2 border-white"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <Ban className="w-3.5 h-3.5 text-white" />
          </motion.div>
        )}
        {hasOverdue && !hasBlockers && !isCompleted && (
          <motion.div
            className="absolute -top-1.5 -right-1.5 bg-construction-accent rounded-full p-1.5 shadow-construction animate-pulse border-2 border-white"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-white" />
          </motion.div>
        )}

        {/* Completion check mark for completed phases */}
        {isCompleted && (
          <motion.div
            className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-construction border-2 border-construction-green"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
          >
            <CheckCircle2 className="w-4 h-4 text-construction-green fill-green-50" />
          </motion.div>
        )}
      </div>

      {/* Phase Name and Details */}
      <div className="text-center max-w-[160px]">
        <p
          className={cn(
            'text-sm font-bold line-clamp-2 mb-1',
            isCompleted && 'text-construction-green',
            isInProgress && 'text-construction-blue',
            !isCompleted && !isInProgress && 'text-gray-600',
            'group-hover:text-construction-blue transition-colors'
          )}
        >
          {phase.name}
        </p>

        {/* Task Count with construction styling */}
        {stats && stats.totalTasks > 0 && (
          <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground mb-1">
            <div className="w-1 h-1 rounded-full bg-current" />
            <span className="font-medium">
              {stats.completedTasks}/{stats.totalTasks} tasks
            </span>
          </div>
        )}

        {/* Status Badge with construction theme */}
        {isCurrent && !isCompleted && (
          <motion.span
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-construction-blue/10 to-construction-blue/20 text-construction-blue text-xs font-black rounded-full border-2 border-construction-blue"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
          >
            <Clock className="w-3 h-3" />
            Active
          </motion.span>
        )}

        {isCompleted && (
          <motion.span
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-construction-green/10 to-construction-green/20 text-construction-green text-xs font-black rounded-full border-2 border-construction-green/30"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
          >
            <CheckCircle2 className="w-3 h-3" />
            Complete
          </motion.span>
        )}
      </div>
    </motion.button>
    </AnimatedTooltip>
  );
}
