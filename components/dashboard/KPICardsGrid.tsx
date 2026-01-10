'use client';

import { motion } from 'framer-motion';
import {
  FolderKanban,
  CheckSquare,
  Wallet,
  Clock,
  AlertCircle,
  Users,
} from 'lucide-react';
import { KPICard, type KPICardProps } from './KPICard';
import type { DashboardKPIs } from '@/types/dashboard';

interface KPICardsGridProps {
  kpis: DashboardKPIs;
  isLoading?: boolean;
}

/**
 * Determines the appropriate variant based on KPI context and value
 */
function getVariant(
  type: 'projects' | 'tasks' | 'budget' | 'schedule' | 'approvals' | 'team',
  kpis: DashboardKPIs
): KPICardProps['variant'] {
  switch (type) {
    case 'projects':
      return kpis.activeProjects > 0 ? 'default' : 'warning';

    case 'tasks':
      return kpis.tasksOverdue > 0 ? 'warning' : 'default';

    case 'budget':
      if (kpis.budgetUtilization < 80) return 'success';
      if (kpis.budgetUtilization <= 100) return 'warning';
      return 'danger';

    case 'schedule':
      // Calculate on-time percentage
      const total = kpis.scheduleOnTime + kpis.scheduleAtRisk + kpis.scheduleDelayed;
      if (total === 0) return 'default';
      const onTimePercent = (kpis.scheduleOnTime / total) * 100;
      if (onTimePercent >= 80) return 'success';
      if (onTimePercent >= 60) return 'warning';
      return 'danger';

    case 'approvals':
      return kpis.pendingExpenses > 0 ? 'warning' : 'default';

    case 'team':
      return 'default';

    default:
      return 'default';
  }
}

/**
 * Formats currency value for display
 */
function formatCurrency(amount: number): string {
  if (amount >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (amount >= 1_000) {
    return `$${(amount / 1_000).toFixed(0)}K`;
  }
  return `$${amount.toFixed(0)}`;
}

/**
 * Animation variants for staggered entrance
 */
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
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

export function KPICardsGrid({ kpis, isLoading = false }: KPICardsGridProps) {
  console.log('[KPICardsGrid] Rendering:', { isLoading, activeProjects: kpis?.activeProjects });

  // Loading state: render 6 skeleton cards
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <KPICard
            key={`skeleton-${index}`}
            title=""
            value=""
            icon={FolderKanban}
            variant="default"
            isLoading={true}
          />
        ))}
      </div>
    );
  }

  // Calculate schedule on-time percentage for display
  const scheduleTotal = kpis.scheduleOnTime + kpis.scheduleAtRisk + kpis.scheduleDelayed;
  const scheduleOnTimePercent = scheduleTotal > 0
    ? Math.round((kpis.scheduleOnTime / scheduleTotal) * 100)
    : 100;

  // Define the 6 KPI cards
  const cards: Array<Omit<KPICardProps, 'isLoading'> & { key: string }> = [
    {
      key: 'active-projects',
      title: 'Active Projects',
      value: kpis.activeProjects,
      subtitle: `${kpis.totalProjects} total`,
      icon: FolderKanban,
      variant: getVariant('projects', kpis),
      trend: kpis.projectsTrend !== 0
        ? {
            value: Math.abs(kpis.projectsTrend),
            direction: kpis.projectsTrend > 0 ? 'up' : kpis.projectsTrend < 0 ? 'down' : 'neutral',
            label: 'vs last month',
          }
        : undefined,
      href: '/app/projects',
    },
    {
      key: 'tasks-week',
      title: 'Tasks This Week',
      value: kpis.tasksThisWeek,
      subtitle: kpis.tasksOverdue > 0
        ? `${kpis.tasksOverdue} overdue`
        : `${kpis.tasksDueToday} due today`,
      icon: CheckSquare,
      variant: getVariant('tasks', kpis),
      href: '/app/tasks',
    },
    {
      key: 'budget-health',
      title: 'Budget Health',
      value: `${Math.round(kpis.budgetUtilization)}%`,
      subtitle: `${formatCurrency(kpis.totalActualSpend)} of ${formatCurrency(kpis.totalPlannedBudget)}`,
      icon: Wallet,
      variant: getVariant('budget', kpis),
      trend: kpis.budgetUtilization > 100
        ? {
            value: Math.round(kpis.budgetUtilization - 100),
            direction: 'up',
            label: 'over budget',
          }
        : undefined,
      href: '/app/budget',
    },
    {
      key: 'schedule-status',
      title: 'Schedule Status',
      value: `${scheduleOnTimePercent}%`,
      subtitle: kpis.scheduleDelayed > 0
        ? `${kpis.scheduleDelayed} delayed`
        : `${kpis.scheduleOnTime} on time`,
      icon: Clock,
      variant: getVariant('schedule', kpis),
      href: '/app/schedule',
    },
    {
      key: 'pending-approvals',
      title: 'Pending Approvals',
      value: kpis.pendingExpenses + kpis.pendingApprovals,
      subtitle: kpis.pendingExpenseAmount > 0
        ? formatCurrency(kpis.pendingExpenseAmount)
        : 'All caught up',
      icon: AlertCircle,
      variant: getVariant('approvals', kpis),
      href: '/app/expenses?status=pending',
    },
    {
      key: 'team-size',
      title: 'Team Size',
      value: kpis.teamSize,
      subtitle: kpis.unassignedTasks > 0
        ? `${kpis.unassignedTasks} unassigned tasks`
        : 'All tasks assigned',
      icon: Users,
      variant: getVariant('team', kpis),
      href: '/app/team',
    },
  ];

  return (
    <motion.div
      className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {cards.map((card) => (
        <motion.div key={card.key} variants={itemVariants}>
          <KPICard
            title={card.title}
            value={card.value}
            subtitle={card.subtitle}
            icon={card.icon}
            trend={card.trend}
            variant={card.variant}
            href={card.href}
          />
        </motion.div>
      ))}
    </motion.div>
  );
}
