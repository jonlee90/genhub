'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Users, AlertTriangle, ChevronRight } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { TeamActivityData } from '@/types/dashboard';

export interface TeamActivityWidgetProps {
  activity: TeamActivityData;
  isLoading?: boolean;
}

/**
 * Get initials from a name for avatar fallback
 * e.g., "John Doe" -> "JD", "Alice" -> "A"
 */
function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Generate a consistent background color based on name
 */
function getAvatarColor(name: string): string {
  const colors = [
    'bg-[#001B51]',
    'bg-[#059669]',
    'bg-[#3C3C3C]',
    'bg-[#7C3AED]',
    'bg-[#0891B2]',
    'bg-[#EA580C]',
  ];
  const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[index % colors.length];
}

function TeamActivityWidgetSkeleton() {
  return (
    <div className="bg-white border-2 border-gray-200 rounded-lg p-4 md:p-5 animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gray-200 rounded-lg w-9 h-9" />
          <div className="h-5 w-32 bg-gray-200 rounded" />
        </div>
        <div className="h-4 w-4 bg-gray-200 rounded" />
      </div>

      {/* Assignee list skeleton */}
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-2 w-full rounded-full" />
            </div>
            <Skeleton className="h-5 w-8" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function TeamActivityWidget({ activity, isLoading = false }: TeamActivityWidgetProps) {
  console.log('[TeamActivityWidget] Rendering:', {
    totalMembers: activity?.totalMembers,
    topAssigneesCount: activity?.topAssignees?.length,
    unassignedTasks: activity?.unassignedTasks,
    isLoading,
  });

  if (isLoading) {
    return <TeamActivityWidgetSkeleton />;
  }

  const { totalMembers, topAssignees, unassignedTasks } = activity;
  const maxTasks = topAssignees.length > 0 ? Math.max(...topAssignees.map((a) => a.taskCount)) : 1;

  return (
    <Link href="/app/team" className="block group">
      <motion.div
        className={cn(
          'bg-white border-2 border-gray-200 rounded-lg p-4 md:p-5 transition-colors h-full',
          'hover:border-[#001B51]/30 cursor-pointer'
        )}
        whileHover={{
          scale: 1.01,
          boxShadow: '0 4px 12px rgba(0, 27, 81, 0.1)',
        }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#001B51]/10 rounded-lg border border-[#001B51]/20">
              <Users className="w-4 h-4 md:w-5 md:h-5 text-[#001B51]" />
            </div>
            <div>
              <h3 className="text-sm md:text-base font-bold text-[#001B51]">
                {totalMembers} Team Member{totalMembers !== 1 ? 's' : ''}
              </h3>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-[#001B51] group-hover:translate-x-0.5 transition-all" />
        </div>

        {/* Top Assignees */}
        <div className="space-y-3">
          {topAssignees.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-2">
                <Users className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500">No task assignments yet</p>
            </div>
          ) : (
            topAssignees.slice(0, 5).map((assignee, index) => {
              const barWidth = maxTasks > 0 ? (assignee.taskCount / maxTasks) * 100 : 0;

              return (
                <motion.div
                  key={assignee.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                  className="flex items-center gap-3"
                >
                  {/* Avatar */}
                  <Avatar className="h-8 w-8 border border-gray-200">
                    <AvatarImage src={assignee.avatarUrl ?? undefined} alt={assignee.name} />
                    <AvatarFallback
                      className={cn(
                        'text-white text-xs font-semibold',
                        getAvatarColor(assignee.name)
                      )}
                    >
                      {getInitials(assignee.name)}
                    </AvatarFallback>
                  </Avatar>

                  {/* Name and Bar */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900 truncate">
                        {assignee.name}
                      </span>
                      <span className="text-xs font-semibold text-[#001B51] ml-2">
                        {assignee.taskCount}
                      </span>
                    </div>
                    {/* Progress bar */}
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${barWidth}%` }}
                        transition={{ delay: index * 0.05 + 0.2, duration: 0.5, ease: 'easeOut' }}
                        className="h-full bg-[#001B51] rounded-full"
                      />
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>

        {/* Unassigned Tasks Warning */}
        {unassignedTasks > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-4 pt-3 border-t border-gray-100"
          >
            <div className="flex items-center gap-2 px-3 py-2 bg-[#F59E0B]/10 border border-[#F59E0B]/20 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-[#F59E0B] flex-shrink-0" />
              <span className="text-xs md:text-sm font-medium text-[#F59E0B]">
                {unassignedTasks} unassigned task{unassignedTasks !== 1 ? 's' : ''}
              </span>
            </div>
          </motion.div>
        )}
      </motion.div>
    </Link>
  );
}
