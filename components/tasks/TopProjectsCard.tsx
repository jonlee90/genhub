'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Building2, CheckCircle2 } from 'lucide-react';
import { formatPercentWhole } from '@/lib/utils';

// Debug: TopProjectsCard - Display top 5 projects by task completion ratio (weighted by total tasks)
interface TopProjectsCardProps {
  tasks: Array<{
    id: string;
    project_id: string;
    status: string | null;
  }>;
  projects: Array<{
    id: string;
    name: string;
  }>;
  projectFilter: string;
}

interface ProjectTaskStats {
  id: string;
  name: string;
  completedTasks: number;
  totalTasks: number;
  completionRatio: number;
  weightedScore: number; // Ratio weighted by total tasks
}

export function TopProjectsCard({ tasks, projects, projectFilter }: TopProjectsCardProps) {
  // Debug: Calculate task stats per project and rank by weighted completion score
  const rankedProjects = useMemo(() => {
    console.log('[TopProjectsCard] Calculating project rankings from', tasks.length, 'tasks');

    // Group tasks by project
    const projectStats = new Map<string, { completed: number; total: number }>();

    tasks.forEach(task => {
      const stats = projectStats.get(task.project_id) || { completed: 0, total: 0 };
      stats.total += 1;
      if (task.status === 'completed') {
        stats.completed += 1;
      }
      projectStats.set(task.project_id, stats);
    });

    // Calculate weighted scores for each project
    // Formula: (completedTasks / totalTasks) * log2(totalTasks + 1)
    // This gives higher weight to projects with more tasks
    const projectsWithStats: ProjectTaskStats[] = [];

    projects.forEach(project => {
      const stats = projectStats.get(project.id);
      if (stats && stats.total > 0) {
        const completionRatio = stats.completed / stats.total;
        // Weighted score: ratio * log factor for total tasks
        // A project with 8/10 (0.8 * 3.46 = 2.77) ranks higher than 4/5 (0.8 * 2.58 = 2.07)
        const weightedScore = completionRatio * Math.log2(stats.total + 1);

        projectsWithStats.push({
          id: project.id,
          name: project.name,
          completedTasks: stats.completed,
          totalTasks: stats.total,
          completionRatio,
          weightedScore,
        });
      }
    });

    // Sort by weighted score (highest first)
    projectsWithStats.sort((a, b) => b.weightedScore - a.weightedScore);

    console.log('[TopProjectsCard] Ranked projects:', projectsWithStats.slice(0, 5));

    return projectsWithStats;
  }, [tasks, projects]);

  // Debug: Filter based on project selection
  const displayedProjects = useMemo(() => {
    if (projectFilter === 'all') {
      return rankedProjects.slice(0, 5);
    }
    // Show only the selected project
    return rankedProjects.filter(p => p.id === projectFilter).slice(0, 1);
  }, [rankedProjects, projectFilter]);

  // Debug: Empty state handling
  if (displayedProjects.length === 0) {
    return (
      <div className="relative group">
        <div className="absolute inset-0 bg-gradient-to-br from-construction-blue/5 to-construction-blue/10 rounded-lg transform group-hover:scale-105 transition-transform" />
        <div className="relative bg-white border-2 border-gray-200 rounded-lg p-6 shadow-construction hover:shadow-construction-lg transition-all">
          <div className="flex items-center gap-3 mb-4 pb-3 border-b-2 border-construction-blue/20">
            <div className="p-2 bg-construction-blue/10 rounded-lg border-2 border-construction-blue/20">
              <Building2 className="h-5 w-5 text-construction-blue" />
            </div>
            <h3 className="text-lg font-black uppercase tracking-tight text-construction-blue">
              Top Projects by Tasks
            </h3>
          </div>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-3">
              <Building2 className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-500">No project data available</p>
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
            <Building2 className="h-5 w-5 text-construction-blue" />
          </div>
          <h3 className="text-lg font-black uppercase tracking-tight text-construction-blue">
            Top Projects by Tasks
          </h3>
          <div className="ml-auto text-xs font-mono uppercase tracking-wider text-construction-blue/60">
            Completed / Total
          </div>
        </div>

        {/* Debug: Project list with staggered animations */}
        <div className="space-y-3">
          {displayedProjects.map((project, index) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                delay: index * 0.08,
                duration: 0.4,
                ease: [0.23, 1, 0.32, 1]
              }}
              className="group/item relative"
            >
              {/* Debug: Project row container with hover effect */}
              <div className="flex items-center gap-4 p-4 rounded-lg bg-gradient-to-r from-gray-50 to-transparent hover:from-construction-blue/5 hover:to-construction-blue/10 border-2 border-transparent hover:border-construction-blue/20 transition-all duration-300">
                {/* Debug: Rank badge with neutral styling */}
                <div className="flex items-center justify-center w-10 h-10 rounded-lg border-2 font-black text-sm transition-transform group-hover/item:scale-110 bg-gray-100 border-gray-300 text-construction-blue">
                  {index + 1}
                </div>

                {/* Debug: Project info section */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-bold text-gray-900 truncate group-hover/item:text-construction-blue transition-colors">
                      {project.name}
                    </h4>
                    {index === 0 && (
                      <CheckCircle2 className="w-4 h-4 text-construction-green flex-shrink-0" />
                    )}
                  </div>

                  {/* Debug: Progress bar with animated width */}
                  <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${project.completionRatio * 100}%` }}
                      transition={{
                        delay: index * 0.08 + 0.2,
                        duration: 0.8,
                        ease: [0.23, 1, 0.32, 1]
                      }}
                      className="h-full rounded-full transition-all bg-construction-blue"
                    />
                    {/* Debug: Shimmer effect on progress bar */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0 group-hover/item:opacity-100 group-hover/item:animate-shimmer transition-opacity" />
                  </div>

                  {/* Debug: Completion percentage label */}
                  <p className="text-xs font-medium text-gray-500 mt-1">
                    {formatPercentWhole(project.completionRatio * 100)} Complete
                  </p>
                </div>

                {/* Debug: Task count badge */}
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <div className="px-3 py-1.5 rounded-lg border-2 font-black text-base transition-all group-hover/item:scale-110 bg-gray-100 border-gray-300 text-construction-blue">
                    {project.completedTasks}/{project.totalTasks}
                  </div>
                  <span className="text-xs font-mono uppercase tracking-wider text-gray-500">
                    Tasks
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
