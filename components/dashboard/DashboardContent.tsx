'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FolderKanban, ClipboardList, UserPlus, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DashboardHeader } from './DashboardHeader';
import { KPICardsGrid } from './KPICardsGrid';
import { WidgetsGrid } from './WidgetsGrid';
import { CreateProjectModal } from '@/components/projects/CreateProjectModal';
import { TaskModal } from '@/components/tasks/modals/TaskModal';
import { InviteTeamMemberModal } from '@/components/team/InviteTeamMemberModal';
import type { DashboardData } from '@/types/dashboard';

export interface DashboardContentProps {
  data: DashboardData;
  userName: string;
  isLoading?: boolean;
}

/**
 * Quick action button configuration
 */
const quickActionConfig = [
  {
    id: 'project',
    icon: FolderKanban,
    title: 'New Project',
    description: 'Start a construction project',
    color: 'navy' as const,
  },
  {
    id: 'task',
    icon: ClipboardList,
    title: 'New Task',
    description: 'Create a task or checklist',
    color: 'green' as const,
  },
  {
    id: 'team',
    icon: UserPlus,
    title: 'Invite Team',
    description: 'Add team members',
    color: 'gray' as const,
  },
] as const;

type QuickActionId = (typeof quickActionConfig)[number]['id'];

const colorStyles = {
  navy: {
    bg: 'bg-[#001B51]/5',
    activeBg: 'active:bg-[#001B51]/15',
    iconBg: 'bg-[#001B51]/10',
    iconColor: 'text-[#001B51]',
    border: 'border-[#001B51]/10',
  },
  green: {
    bg: 'bg-[#059669]/5',
    activeBg: 'active:bg-[#059669]/15',
    iconBg: 'bg-[#059669]/10',
    iconColor: 'text-[#059669]',
    border: 'border-[#059669]/10',
  },
  gray: {
    bg: 'bg-gray-50',
    activeBg: 'active:bg-gray-100',
    iconBg: 'bg-gray-100',
    iconColor: 'text-gray-600',
    border: 'border-gray-100',
  },
};

/**
 * QuickActionsSection - Touch-friendly quick actions with modal triggers
 */
function QuickActionsSection({
  onActionClick,
}: {
  onActionClick: (action: QuickActionId) => void;
}) {
  return (
    <section className="bg-white rounded-xl border-2 border-gray-200 p-4">
      {/* Section header - hidden on mobile for cleaner look */}
      <h2 className="sr-only">Quick Actions</h2>

      {/* Action Buttons - Stack on mobile, row on larger screens */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {quickActionConfig.map((action) => {
          const Icon = action.icon;
          const styles = colorStyles[action.color];

          return (
            <button
              key={action.id}
              onClick={() => onActionClick(action.id)}
              className={cn(
                'flex items-center gap-3 p-4 rounded-xl',
                'border-2 transition-all duration-150',
                'min-h-[64px]',
                styles.bg,
                styles.border,
                styles.activeBg,
                'active:scale-[0.98]'
              )}
            >
              {/* Icon */}
              <div
                className={cn(
                  'flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center',
                  styles.iconBg
                )}
              >
                <Icon className={cn('w-5 h-5', styles.iconColor)} />
              </div>

              {/* Text */}
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-bold text-gray-900">
                  {action.title}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {action.description}
                </p>
              </div>

              {/* Arrow indicator */}
              <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
            </button>
          );
        })}
      </div>
    </section>
  );
}

/**
 * DashboardContent - Mobile-first dashboard layout
 *
 * Features:
 * - Receives DashboardData as prop (no direct data fetching)
 * - Mobile-first responsive design
 * - Touch-friendly interactions with active states
 * - Quick Actions at top with modal triggers
 * - Renders DashboardHeader, KPICardsGrid, WidgetsGrid
 * - NO Supabase imports (client component)
 * - NO framer-motion for better performance
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
    <div className="relative min-h-[100dvh] bg-gray-50">
      {/* Subtle Blueprint Grid Background */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.02] z-0"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M 40 0 L 0 0 0 40' fill='none' stroke='%23001B51' stroke-width='1'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Main Content */}
      <main className="relative z-10 px-4 py-6 pb-24 md:px-6 md:py-8 space-y-6">
        {/* Dashboard Header */}
        <DashboardHeader userName={userName} />

        {/* Quick Actions */}
        <QuickActionsSection onActionClick={handleQuickAction} />

        {/* KPI Cards Grid */}
        <section aria-labelledby="kpis-heading">
          <h2 id="kpis-heading" className="sr-only">Key Performance Indicators</h2>
          <KPICardsGrid kpis={data.kpis} isLoading={isLoading} />
        </section>

        {/* Widgets Grid */}
        <section aria-labelledby="widgets-heading">
          <h2 id="widgets-heading" className="sr-only">Dashboard Widgets</h2>
          <WidgetsGrid data={data} isLoading={isLoading} />
        </section>
      </main>

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
