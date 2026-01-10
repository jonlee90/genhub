'use client';

import { motion } from 'framer-motion';
import {
  FolderKanban,
  CheckSquare,
  Wallet,
  Clock,
  Users,
  Package,
} from 'lucide-react';
import { ProjectStatusWidget } from './ProjectStatusWidget';
import { TaskProgressWidget } from './TaskProgressWidget';
import { BudgetSummaryWidget } from './BudgetSummaryWidget';
import { ScheduleHealthWidget } from './ScheduleHealthWidget';
import { TeamActivityWidget } from './TeamActivityWidget';
import { MaterialsStatusWidget } from './MaterialsStatusWidget';
import type { DashboardData } from '@/types/dashboard';

export interface WidgetsGridProps {
  data: DashboardData;
  isLoading?: boolean;
}

/**
 * Widget configuration for consistent rendering
 */
const WIDGET_CONFIG = [
  {
    key: 'project-status',
    title: 'Project Status',
    icon: FolderKanban,
  },
  {
    key: 'task-progress',
    title: 'Task Progress',
    icon: CheckSquare,
  },
  {
    key: 'budget-summary',
    title: 'Budget Summary',
    icon: Wallet,
  },
  {
    key: 'schedule-health',
    title: 'Schedule Health',
    icon: Clock,
  },
  {
    key: 'team-activity',
    title: 'Team Activity',
    icon: Users,
  },
  {
    key: 'materials-status',
    title: 'Materials Status',
    icon: Package,
  },
] as const;

/**
 * Animation variants for staggered entrance
 */
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 300,
      damping: 24,
    },
  },
};

/**
 * Loading skeleton for individual widget
 */
function WidgetSkeleton() {
  return (
    <div className="bg-white border-2 border-gray-200 rounded-lg p-4 animate-pulse h-[280px]">
      {/* Header skeleton */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-gray-200 rounded-lg" />
        <div className="h-5 w-32 bg-gray-200 rounded" />
      </div>
      {/* Content skeleton */}
      <div className="space-y-3">
        <div className="h-4 w-full bg-gray-200 rounded" />
        <div className="h-4 w-3/4 bg-gray-200 rounded" />
        <div className="h-20 w-full bg-gray-200 rounded mt-4" />
      </div>
    </div>
  );
}

/**
 * WidgetsGrid - Container for all 6 dashboard widgets
 *
 * Features:
 * - Responsive grid: 1 col mobile, 2 cols desktop
 * - Consistent widget wrapper styling
 * - Staggered entrance animations
 * - Loading state with skeletons
 */
export function WidgetsGrid({ data, isLoading = false }: WidgetsGridProps) {
  console.log('[WidgetsGrid] Rendering:', { isLoading });

  // Loading state: render 6 skeleton widgets
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {WIDGET_CONFIG.map((widget) => (
          <WidgetSkeleton key={widget.key} />
        ))}
      </div>
    );
  }

  return (
    <motion.div
      className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Project Status Widget */}
      <motion.div variants={itemVariants}>
        <ProjectStatusWidget
          status={data.projectStatus}
          isLoading={isLoading}
        />
      </motion.div>

      {/* Task Progress Widget */}
      <motion.div variants={itemVariants}>
        <TaskProgressWidget
          progress={data.taskProgress}
          isLoading={isLoading}
        />
      </motion.div>

      {/* Budget Summary Widget */}
      <motion.div variants={itemVariants}>
        <BudgetSummaryWidget
          budget={data.budgetSummary}
          isLoading={isLoading}
        />
      </motion.div>

      {/* Schedule Health Widget */}
      <motion.div variants={itemVariants}>
        <ScheduleHealthWidget
          health={data.scheduleHealth}
          isLoading={isLoading}
        />
      </motion.div>

      {/* Team Activity Widget */}
      <motion.div variants={itemVariants}>
        <TeamActivityWidget
          activity={data.teamActivity}
          isLoading={isLoading}
        />
      </motion.div>

      {/* Materials Status Widget */}
      <motion.div variants={itemVariants}>
        <MaterialsStatusWidget
          materials={data.materialsStatus}
          isLoading={isLoading}
        />
      </motion.div>
    </motion.div>
  );
}
