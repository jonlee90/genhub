'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { HardHat, ClipboardList, UserPlus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DashboardHeader } from './DashboardHeader';
import { KPICardsGrid } from './KPICardsGrid';
import { WidgetsGrid } from './WidgetsGrid';
import { CreateProjectModal } from '@/components/projects/CreateProjectModal';
import { TaskModal } from '@/components/tasks/TaskModal';
import { InviteTeamMemberModal } from '@/components/team/InviteTeamMemberModal';
import type { DashboardData } from '@/types/dashboard';

export interface DashboardContentProps {
  data: DashboardData;
  userName: string;
  isLoading?: boolean;
}

/**
 * Animation variants for section entrance
 */
const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: 'easeOut' as const,
    },
  },
};

/**
 * Quick action button configuration
 */
const quickActionConfig = [
  {
    id: 'project',
    icon: HardHat,
    title: 'New Project',
    description: 'Start a construction project',
    color: 'construction-blue',
  },
  {
    id: 'task',
    icon: ClipboardList,
    title: 'New Task',
    description: 'Create a task or checklist',
    color: 'construction-green',
  },
  {
    id: 'team',
    icon: UserPlus,
    title: 'Invite Team',
    description: 'Add team members',
    color: 'construction-accent',
  },
] as const;

type QuickActionId = (typeof quickActionConfig)[number]['id'];

/**
 * QuickActionsSection - Widget-styled quick actions with modal triggers
 */
function QuickActionsSection({
  onActionClick,
}: {
  onActionClick: (action: QuickActionId) => void;
}) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={sectionVariants}
      className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 md:p-6"
    >
      {/* Action Buttons Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {quickActionConfig.map((action, index) => {
          const Icon = action.icon;
          const colorClasses = {
            'construction-blue': {
              bg: 'bg-[#001B51]/5 hover:bg-[#001B51]/10',
              icon: 'bg-[#001B51]/10 text-[#001B51]',
              border: 'hover:border-[#001B51]/30',
            },
            'construction-green': {
              bg: 'bg-emerald-50 hover:bg-emerald-100',
              icon: 'bg-emerald-100 text-emerald-600',
              border: 'hover:border-emerald-300',
            },
            'construction-accent': {
              bg: 'bg-gray-50 hover:bg-gray-100',
              icon: 'bg-gray-100 text-gray-600',
              border: 'hover:border-gray-300',
            },
          }[action.color];

          return (
            <motion.button
              key={action.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => onActionClick(action.id)}
              className={cn(
                'group relative flex items-center gap-3 p-3 rounded-lg border border-gray-200 transition-all duration-200',
                colorClasses.bg,
                colorClasses.border,
                'active:scale-[0.98]'
              )}
            >
              {/* Icon */}
              <div
                className={cn(
                  'flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center transition-transform group-hover:scale-105',
                  colorClasses.icon
                )}
              >
                <Icon className="w-5 h-5" />
              </div>

              {/* Text */}
              <div className="text-left min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {action.title}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {action.description}
                </p>
              </div>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}

/**
 * DashboardContent - Main dashboard layout component
 *
 * Features:
 * - Receives DashboardData as prop (no direct data fetching)
 * - Quick Actions at top with modal triggers
 * - Renders DashboardHeader, KPICardsGrid, WidgetsGrid
 * - Framer-motion entrance animations
 * - NO Supabase imports (client component)
 */
export function DashboardContent({
  data,
  userName,
  isLoading = false,
}: DashboardContentProps) {
  const router = useRouter();

  // Modal states
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  // Handle quick action clicks
  const handleQuickAction = (action: QuickActionId) => {
    switch (action) {
      case 'project':
        setIsProjectModalOpen(true);
        break;
      case 'task':
        setIsTaskModalOpen(true);
        break;
      case 'team':
        setIsInviteModalOpen(true);
        break;
    }
  };

  // Handle modal success callbacks
  const handleProjectSuccess = () => {
    router.refresh();
  };

  const handleTaskSuccess = () => {
    router.refresh();
  };

  const handleInviteClose = () => {
    setIsInviteModalOpen(false);
    router.refresh();
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Subtle Blueprint Grid Background */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03] z-0"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M 40 0 L 0 0 0 40' fill='none' stroke='%23001B51' stroke-width='1'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Main Content */}
      <div className="relative z-10 space-y-6 md:space-y-8 p-4 md:p-8">
        {/* Dashboard Header */}
        <DashboardHeader userName={userName} />

        {/* Quick Actions - Now at top */}
        <QuickActionsSection onActionClick={handleQuickAction} />

        {/* KPI Cards Grid */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={sectionVariants}
          transition={{ delay: 0.1 }}
        >
          <KPICardsGrid kpis={data.kpis} isLoading={isLoading} />
        </motion.div>

        {/* Widgets Grid */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={sectionVariants}
          transition={{ delay: 0.3 }}
        >
          <WidgetsGrid data={data} isLoading={isLoading} />
        </motion.div>
      </div>

      {/* Modals */}
      <CreateProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        onSuccess={handleProjectSuccess}
      />

      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        mode="create"
        projects={data.quickActionData.projects}
        teamMembers={data.quickActionData.teamMembers}
        onSuccess={handleTaskSuccess}
      />

      <InviteTeamMemberModal
        isOpen={isInviteModalOpen}
        onClose={handleInviteClose}
        companyId={data.quickActionData.companyId}
      />
    </div>
  );
}
