'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { HardHat, Trophy, Award } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

// Debug: TopTeamMembersCard - Display top 5 team members by completed tasks
interface TopTeamMembersCardProps {
  topTeamMembers: Array<{
    id: string;
    name: string;
    avatar_url?: string | null;
    completed_tasks: number;
  }>;
  tasks: Array<{
    id: string;
    assignee_id?: string | null;
    status: string | null;
  }>;
  projectFilter: string;
}

export function TopTeamMembersCard({
  topTeamMembers,
  tasks,
  projectFilter
}: TopTeamMembersCardProps) {
  // Debug: Filter team members based on project filter
  const displayedMembers = useMemo(() => {
    if (projectFilter === 'all') {
      return topTeamMembers.slice(0, 5);
    }

    // When a specific project is selected, recalculate completed tasks for that project only
    const memberTaskCounts = new Map<string, number>();

    tasks.forEach(task => {
      if (task.status === 'completed' && task.assignee_id) {
        memberTaskCounts.set(
          task.assignee_id,
          (memberTaskCounts.get(task.assignee_id) || 0) + 1
        );
      }
    });

    // Filter and sort members who have completed tasks in this project
    return topTeamMembers
      .map(member => ({
        ...member,
        completed_tasks: memberTaskCounts.get(member.id) || 0
      }))
      .filter(member => member.completed_tasks > 0)
      .sort((a, b) => b.completed_tasks - a.completed_tasks)
      .slice(0, 5);
  }, [topTeamMembers, tasks, projectFilter]);

  // Debug: Get initials from name for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Debug: Empty state handling
  if (displayedMembers.length === 0) {
    return (
      <div className="relative group">
        <div className="absolute inset-0 bg-gradient-to-br from-construction-blue/5 to-construction-blue/10 rounded-lg transform group-hover:scale-105 transition-transform" />
        <div className="relative bg-white border-2 border-gray-200 rounded-lg p-6 shadow-construction hover:shadow-construction-lg transition-all">
          <div className="flex items-center gap-3 mb-4 pb-3 border-b-2 border-construction-blue/20">
            <div className="p-2 bg-construction-blue/10 rounded-lg border-2 border-construction-blue/20">
              <HardHat className="h-5 w-5 text-construction-blue" />
            </div>
            <h3 className="text-lg font-black uppercase tracking-tight text-construction-blue">
              Top Team Members
            </h3>
          </div>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-3">
              <HardHat className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-500">No completed tasks yet</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative group">
      {/* Debug: Gradient overlay background for depth */}
      <div className="absolute inset-0 bg-gradient-to-br from-construction-blue/5 to-construction-blue/10 rounded-lg transform group-hover:scale-105 transition-transform" />

      {/* Debug: Main card container with construction borders */}
      <div className="relative bg-white border-2 border-gray-200 rounded-lg p-6 shadow-construction hover:shadow-construction-lg transition-all">
        {/* Debug: Header section with icon and title */}
        <div className="flex items-center gap-3 mb-4 pb-3 border-b-2 border-construction-blue/20">
          <div className="p-2 bg-construction-blue/10 rounded-lg border-2 border-construction-blue/20">
            <HardHat className="h-5 w-5 text-construction-blue" />
          </div>
          <h3 className="text-lg font-black uppercase tracking-tight text-construction-blue">
            Top Team Members
          </h3>
          <div className="ml-auto text-xs font-mono uppercase tracking-wider text-construction-blue/60">
            Tasks
          </div>
        </div>

        {/* Debug: Team member list with staggered animations */}
        <div className="space-y-3">
          {displayedMembers.map((member, index) => (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                delay: index * 0.08,
                duration: 0.4,
                ease: [0.23, 1, 0.32, 1] // Smooth easing
              }}
              className="group/item relative"
            >
              {/* Debug: Member row container with hover effect */}
              <div className="flex items-center gap-4 p-4 rounded-lg bg-gradient-to-r from-gray-50 to-transparent hover:from-construction-blue/5 hover:to-construction-blue/10 border-2 border-transparent hover:border-construction-blue/20 transition-all duration-300">
                {/* Debug: Rank badge with special styling for #1 */}
                <div className={cn(
                  "flex items-center justify-center w-10 h-10 rounded-lg border-2 font-black text-sm transition-transform group-hover/item:scale-110",
                  index === 0
                    ? "bg-construction-green/10 border-construction-green/20 text-construction-green"
                    : "bg-construction-blue/10 border-construction-blue/20 text-construction-blue"
                )}>
                  {index + 1}
                </div>

                {/* Debug: Avatar with HardHat fallback icon */}
                <div className="relative">
                  <Avatar className="h-12 w-12 border-2 border-construction-blue/20 transition-transform group-hover/item:scale-110">
                    <AvatarImage src={member.avatar_url ?? undefined} alt={member.name} />
                    <AvatarFallback className="bg-construction-blue/10 text-construction-blue font-bold">
                      {member.avatar_url ? (
                        getInitials(member.name)
                      ) : (
                        <HardHat className="w-6 h-6" />
                      )}
                    </AvatarFallback>
                  </Avatar>

                  {/* Debug: Trophy badge for top performer */}
                  {index === 0 && (
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{
                        delay: 0.5,
                        duration: 0.5,
                        type: "spring",
                        stiffness: 200
                      }}
                      className="absolute -top-1 -right-1 w-6 h-6 bg-construction-green rounded-full flex items-center justify-center border-2 border-white shadow-lg"
                    >
                      <Trophy className="w-3.5 h-3.5 text-white" />
                    </motion.div>
                  )}

                  {/* Debug: Award badge for runner-ups */}
                  {index === 1 && (
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{
                        delay: 0.6,
                        duration: 0.5,
                        type: "spring",
                        stiffness: 200
                      }}
                      className="absolute -top-1 -right-1 w-6 h-6 bg-construction-blue rounded-full flex items-center justify-center border-2 border-white shadow-lg"
                    >
                      <Award className="w-3.5 h-3.5 text-white" />
                    </motion.div>
                  )}
                </div>

                {/* Debug: Member info section */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-bold text-gray-900 truncate group-hover/item:text-construction-blue transition-colors">
                      {member.name}
                    </h4>
                    {index === 0 && (
                      <span className="px-2 py-0.5 bg-construction-green/10 border border-construction-green/20 text-construction-green text-xs font-black uppercase tracking-wider rounded">
                        Top
                      </span>
                    )}
                  </div>

                  {/* Debug: Progress bar visualization */}
                  <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width: `${Math.min((member.completed_tasks / (displayedMembers[0]?.completed_tasks || 1)) * 100, 100)}%`
                      }}
                      transition={{
                        delay: index * 0.08 + 0.2,
                        duration: 0.8,
                        ease: [0.23, 1, 0.32, 1]
                      }}
                      className={cn(
                        "h-full rounded-full transition-all",
                        index === 0 ? "bg-construction-green" : "bg-construction-blue"
                      )}
                    />
                    {/* Debug: Shimmer effect on progress bar */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0 group-hover/item:opacity-100 group-hover/item:animate-shimmer transition-opacity" />
                  </div>
                </div>

                {/* Debug: Completed tasks count badge */}
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <div className={cn(
                    "px-3 py-1.5 rounded-lg border-2 font-black text-lg transition-all group-hover/item:scale-110",
                    index === 0
                      ? "bg-construction-green/10 border-construction-green/20 text-construction-green"
                      : "bg-construction-blue/10 border-construction-blue/20 text-construction-blue"
                  )}>
                    {member.completed_tasks}
                  </div>
                  <span className="text-xs font-mono uppercase tracking-wider text-gray-500">
                    Done
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
