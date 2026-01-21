"use client";

import { useMemo } from "react";
import Image from "next/image";
import { Building2 } from "lucide-react";
import { Trophy } from "lucide-react";
import { TrendingUp } from "lucide-react";
import { CheckCircle2 } from "lucide-react";
import { Target } from "lucide-react";
import { Users } from "lucide-react";
import { formatPercentWhole } from "@/lib/utils";
import { cn } from "@/lib/utils";

/**
 * Top Contributor type for team member display
 */
interface TopContributor {
  id: string;
  name: string;
  avatar_url: string | null;
  taskCount: number;
}

/**
 * TopProjectsCard - Display top 5 projects by task completion ratio (weighted by total tasks)
 *
 * Mobile-first analytics card designed for construction field workers.
 * Features touch-optimized interactions, high contrast for outdoor visibility,
 * and a clean visual hierarchy following GenHub design system.
 *
 * Design Principles:
 * - Mobile-first with 44px+ touch targets
 * - High contrast for outdoor/bright sun visibility
 * - Smooth animations with native app feel
 * - Construction-themed with GenHub colors
 */
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
  /** Top contributors data for team member display */
  topContributors?: TopContributor[];
  /** Count of unassigned tasks */
  unassignedCount?: number;
}

interface ProjectTaskStats {
  id: string;
  name: string;
  completedTasks: number;
  totalTasks: number;
  completionRatio: number;
  weightedScore: number;
}

export function TopProjectsCard({
  tasks,
  projects,
  projectFilter,
  topContributors = [],
  unassignedCount = 0,
}: TopProjectsCardProps) {
  // Calculate task stats per project and rank by weighted completion score
  const rankedProjects = useMemo(() => {
    // Group tasks by project
    const projectStats = new Map<string, { completed: number; total: number }>();

    tasks.forEach((task) => {
      const stats = projectStats.get(task.project_id) || { completed: 0, total: 0 };
      stats.total += 1;
      if (task.status === "completed") {
        stats.completed += 1;
      }
      projectStats.set(task.project_id, stats);
    });

    // Calculate weighted scores for each project
    // Formula: (completedTasks / totalTasks) * log2(totalTasks + 1)
    const projectsWithStats: ProjectTaskStats[] = [];

    projects.forEach((project) => {
      const stats = projectStats.get(project.id);
      if (stats && stats.total > 0) {
        const completionRatio = stats.completed / stats.total;
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

    return projectsWithStats;
  }, [tasks, projects]);

  // Filter based on project selection
  const displayedProjects = useMemo(() => {
    if (projectFilter === "all") {
      return rankedProjects.slice(0, 5);
    }
    return rankedProjects.filter((p) => p.id === projectFilter).slice(0, 1);
  }, [rankedProjects, projectFilter]);

  // Calculate overall stats for header
  const overallStats = useMemo(() => {
    const totalCompleted = displayedProjects.reduce((sum, p) => sum + p.completedTasks, 0);
    const totalTasks = displayedProjects.reduce((sum, p) => sum + p.totalTasks, 0);
    const avgCompletion =
      displayedProjects.length > 0
        ? displayedProjects.reduce((sum, p) => sum + p.completionRatio, 0) /
          displayedProjects.length
        : 0;
    return { totalCompleted, totalTasks, avgCompletion };
  }, [displayedProjects]);

  // Empty state handling
  if (displayedProjects.length === 0) {
    return (
      <div
        className={cn(
          "bg-white dark:bg-gray-900 rounded-xl overflow-hidden",
          "border-2 border-gray-200 dark:border-gray-700 shadow-sm"
        )}
      >
        {/* Header */}
        <div className="px-4 py-3.5 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-gray-50/80 dark:from-gray-800/80 to-white dark:to-gray-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-construction-blue flex items-center justify-center shadow-sm">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-construction-blue text-sm uppercase tracking-wide">
                Top Projects
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">By task completion</p>
            </div>
          </div>
        </div>

        {/* Empty State */}
        <div className="p-6 flex flex-col items-center justify-center min-h-[200px]">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
            <Building2 className="w-8 h-8 text-gray-300 dark:text-gray-600" />
          </div>
          <p className="text-base font-semibold text-gray-700 dark:text-gray-100 mb-1.5">No project data</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-[240px]">
            Create tasks to see project performance rankings
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "bg-white dark:bg-gray-900 rounded-xl overflow-hidden",
        "border-2 border-gray-200 dark:border-gray-700 shadow-sm",
        "transition-all duration-200"
      )}
    >
      {/* Header */}
      <div className="px-4 py-3.5 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-gray-50/80 dark:from-gray-800/80 to-white dark:to-gray-900">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-construction-blue flex items-center justify-center shadow-sm">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-construction-blue text-sm uppercase tracking-wide">
              Top Projects
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {displayedProjects.length} project{displayedProjects.length !== 1 ? "s" : ""} ranked
            </p>
          </div>
          {/* Summary Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-construction-blue/5 dark:bg-construction-blue/20 border border-construction-blue/20 dark:border-construction-blue/40 rounded-lg">
            <Target className="w-3.5 h-3.5 text-construction-blue" />
            <span className="text-xs font-bold text-construction-blue tabular-nums">
              {formatPercentWhole(overallStats.avgCompletion * 100)} avg
            </span>
          </div>
        </div>
      </div>

      {/* Project List */}
      <div className="p-3 space-y-2">
        {displayedProjects.map((project, index) => (
          <ProjectRow key={project.id} project={project} rank={index + 1} />
        ))}
      </div>

      {/* Top Contributors Section */}
      {topContributors.length > 0 && (
        <div className="px-4 py-4 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Top Contributors
              </span>
            </div>
            {unassignedCount > 0 && (
              <span className="text-[11px] text-gray-400 dark:text-gray-500">
                +{unassignedCount} unassigned
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {topContributors.map((assignee, index) => (
              <div
                key={assignee.id}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2.5 relative",
                  "bg-gray-50 dark:bg-gray-800 border rounded-xl",
                  "min-h-[44px]", // Touch-friendly
                  "active:scale-[0.98] active:bg-gray-100 dark:active:bg-gray-700",
                  "transition-all duration-150",
                  index === 0 ? "border-[#059669]/30 dark:border-[#059669]/40 bg-[#059669]/5 dark:bg-[#059669]/10" : "border-gray-100 dark:border-gray-700"
                )}
              >
                <div className="relative">
                  {assignee.avatar_url ? (
                    <Image
                      src={assignee.avatar_url}
                      alt={assignee.name}
                      width={28}
                      height={28}
                      className="w-7 h-7 rounded-full"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-construction-blue flex items-center justify-center">
                      <span className="text-xs text-white font-bold">
                        {assignee.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  {/* Trophy badge for #1 contributor */}
                  {index === 0 && (
                    <div className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#059669] rounded-full flex items-center justify-center border border-white shadow-sm">
                      <Trophy className="w-2.5 h-2.5 text-white" />
                    </div>
                  )}
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-tight">
                      {assignee.name.split(" ")[0]}
                    </span>
                    {index === 0 && (
                      <span className="px-1.5 py-0.5 bg-[#059669]/10 dark:bg-[#059669]/20 border border-[#059669]/20 dark:border-[#059669]/40 text-[#059669] text-[10px] font-bold uppercase tracking-wider rounded">
                        Top
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-gray-500 dark:text-gray-400">
                    {assignee.taskCount} task{assignee.taskCount !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer Stats */}
      <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Ranked by weighted completion score</span>
          </div>
          <div className="text-xs font-semibold text-construction-blue tabular-nums">
            {overallStats.totalCompleted}/{overallStats.totalTasks} tasks
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * ProjectRow - Individual project ranking item
 * Touch-optimized with visual feedback and smooth animations
 */
interface ProjectRowProps {
  project: ProjectTaskStats;
  rank: number;
}

function ProjectRow({ project, rank }: ProjectRowProps) {
  const isTopProject = rank === 1;
  const isCompleted = project.completionRatio === 1;

  // Determine progress bar color based on completion
  const getProgressColor = () => {
    if (isCompleted) return "bg-[#059669]";
    if (project.completionRatio >= 0.7) return "bg-construction-blue";
    if (project.completionRatio >= 0.4) return "bg-[#F59E0B]";
    return "bg-gray-400";
  };

  // Determine status dot color
  const getStatusDotColor = () => {
    if (isCompleted) return "bg-[#059669]";
    if (project.completionRatio >= 0.7) return "bg-construction-blue";
    if (project.completionRatio >= 0.4) return "bg-[#F59E0B]";
    return "bg-gray-400";
  };

  return (
    <div
      className={cn(
        "relative rounded-xl p-3.5",
        "bg-gray-50 dark:bg-gray-800 border",
        "min-h-[76px]",
        "active:scale-[0.99] active:bg-gray-100 dark:active:bg-gray-700",
        "transition-all duration-150",
        isTopProject ? "border-[#059669]/30 dark:border-[#059669]/40 bg-[#059669]/5 dark:bg-[#059669]/10" : "border-gray-200 dark:border-gray-700"
      )}
    >
      <div className="flex items-start gap-3">
        {/* Rank Badge */}
        <div
          className={cn(
            "flex items-center justify-center",
            "w-9 h-9 rounded-lg flex-shrink-0",
            "font-bold text-sm",
            "transition-transform",
            isTopProject
              ? "bg-[#059669] text-white shadow-sm"
              : "bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 text-construction-blue"
          )}
        >
          {isTopProject ? <Trophy className="w-4 h-4" /> : rank}
        </div>

        {/* Project Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <h4 className="font-semibold text-construction-blue text-sm leading-tight truncate">
              {project.name}
            </h4>
            {isCompleted && (
              <CheckCircle2 className="w-4 h-4 text-[#059669] flex-shrink-0" />
            )}
            {isTopProject && !isCompleted && (
              <span className="px-1.5 py-0.5 bg-[#059669]/10 dark:bg-[#059669]/20 border border-[#059669]/20 dark:border-[#059669]/40 text-[#059669] text-[10px] font-bold uppercase tracking-wider rounded flex-shrink-0">
                Top
              </span>
            )}
          </div>

          {/* Progress Bar */}
          <div className="relative h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden mb-1.5">
            <div
              className={cn(
                "absolute inset-y-0 left-0 rounded-full",
                "transition-all duration-500 ease-out",
                getProgressColor()
              )}
              style={{ width: `${project.completionRatio * 100}%` }}
            />
          </div>

          {/* Stats Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className={cn("w-2 h-2 rounded-full flex-shrink-0", getStatusDotColor())} />
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {formatPercentWhole(project.completionRatio * 100)} complete
              </span>
            </div>
          </div>
        </div>

        {/* Task Count Badge */}
        <div className="flex flex-col items-end flex-shrink-0">
          <div
            className={cn(
              "px-2.5 py-1.5 rounded-lg",
              "font-bold text-sm tabular-nums",
              "bg-white dark:bg-gray-700 border-2",
              isTopProject ? "border-[#059669]/30 dark:border-[#059669]/40 text-[#059669]" : "border-gray-200 dark:border-gray-600 text-construction-blue"
            )}
          >
            {project.completedTasks}/{project.totalTasks}
          </div>
          <span className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 uppercase tracking-wider">Tasks</span>
        </div>
      </div>
    </div>
  );
}
