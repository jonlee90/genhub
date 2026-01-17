'use client';

import { FolderKanban, Clock, ClipboardList } from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { TaskProject } from '@/types/db/task';

type Project = TaskProject;

/**
 * Calculate days remaining until the target date
 * Returns positive number for future dates, negative for past dates
 */
function getDaysUntil(dateString: string): number {
  const targetDate = new Date(dateString);
  const today = new Date();
  // Reset time to compare just dates
  today.setHours(0, 0, 0, 0);
  targetDate.setHours(0, 0, 0, 0);
  const diffTime = targetDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Get compact date indicator for a project
 * Returns number of days for future dates, formatted date for past dates
 * Also returns daysLeft for sorting purposes
 */
function getProjectDateIndicator(endDate: string | null | undefined): {
  display: string;
  colorClass: string;
  daysLeft: number;
} | null {
  if (!endDate) return null;

  const daysLeft = getDaysUntil(endDate);

  if (daysLeft > 0) {
    // Future date - show number only
    return {
      display: String(daysLeft),
      colorClass: daysLeft <= 7 ? 'text-amber-500' : 'text-emerald-500',
      daysLeft,
    };
  } else if (daysLeft === 0) {
    // Due today
    return {
      display: '0',
      colorClass: 'text-amber-500',
      daysLeft,
    };
  } else {
    // Past date - show compact date
    return {
      display: formatDate(endDate),
      colorClass: 'text-red-500',
      daysLeft,
    };
  }
}

/**
 * Sort projects by days left:
 * - Lowest days left (most urgent) at top
 * - Most days left at bottom
 * - Overdue (negative days) at very bottom
 * - Projects without end dates at the bottom before overdue
 */
function sortProjectsByDaysLeft(projects: Project[]): Project[] {
  return [...projects].sort((a, b) => {
    const aIndicator = getProjectDateIndicator(a.end_date);
    const bIndicator = getProjectDateIndicator(b.end_date);

    // Projects without dates go near the bottom (before overdue)
    if (!aIndicator && !bIndicator) return 0;
    if (!aIndicator) return 1; // a goes after b
    if (!bIndicator) return -1; // a goes before b

    const aDays = aIndicator.daysLeft;
    const bDays = bIndicator.daysLeft;

    // Both overdue - sort by most recently overdue first (less negative = more recent)
    if (aDays < 0 && bDays < 0) {
      return bDays - aDays; // Less negative (more recent overdue) comes first
    }

    // Overdue projects go to the very bottom
    if (aDays < 0) return 1; // a is overdue, goes after b
    if (bDays < 0) return -1; // b is overdue, a goes before

    // Both have future dates - sort ascending (lowest days first)
    return aDays - bDays;
  });
}

interface ProjectFilterHeaderProps {
  projects: Project[];
  selectedProjectId: string;
  onProjectChange: (projectId: string) => void;
  /** Total task count for the selected project (or all projects if 'all' selected) */
  taskCount?: number;
  /** Map of project ID to task count for each project in the dropdown */
  projectTaskCounts?: Record<string, number>;
}

export function ProjectFilterHeader({
  projects,
  selectedProjectId,
  onProjectChange,
  taskCount,
  projectTaskCounts,
}: ProjectFilterHeaderProps) {
  const projectName = selectedProjectId === 'all'
    ? 'All Projects'
    : projects.find((p) => p.id === selectedProjectId)?.name || 'Select Project';

  return (
    <div className="flex items-center gap-3">
      <Select value={selectedProjectId} onValueChange={onProjectChange}>
        <SelectTrigger
          className={cn(
            "min-w-[200px] sm:min-w-[280px] h-11 px-4",
            "bg-white border-2 border-construction-blue/20 rounded-lg",
            "hover:border-construction-blue/40 transition-colors",
            "focus:ring-2 focus:ring-construction-blue/20 focus:border-construction-blue",
            "font-semibold text-construction-blue",
            selectedProjectId !== 'all' && "bg-construction-blue/5"
          )}
        >
          <div className="flex items-center gap-2 truncate">
            {selectedProjectId !== 'all' && (
              <div className="w-2 h-2 rounded-full bg-construction-blue animate-pulse" />
            )}
            <SelectValue placeholder="All Projects">
              <span className="flex items-center gap-1">
                {projectName}
                {taskCount !== undefined && (
                  <span className="inline-flex items-center gap-0.5 text-gray-500">
                    (<ClipboardList className="w-3 h-3" />
                    <span>{taskCount}</span>)
                  </span>
                )}
              </span>
            </SelectValue>
          </div>
        </SelectTrigger>
        <SelectContent
          className="max-h-[300px] overflow-y-auto"
          align="start"
        >
          <SelectItem
            value="all"
            className="font-medium [&>span]:flex-1 [&>span]:w-full"
          >
            <div className="flex items-center gap-2 w-full" style={{ width: '100%' }}>
              <FolderKanban className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="flex-1">All Projects</span>
              <span className="ml-auto text-xs text-gray-400 flex-shrink-0">
                ({projects.length})
              </span>
            </div>
          </SelectItem>

          <div className="my-1 h-px bg-gray-200" />

          {sortProjectsByDaysLeft(projects).map((project) => {
            const dateIndicator = getProjectDateIndicator(project.end_date);
            const projectTaskCount = projectTaskCounts?.[project.id] ?? 0;
            return (
              <SelectItem
                key={project.id}
                value={project.id}
                className="font-medium [&>span]:flex-1 [&>span]:w-full"
              >
                <div className="flex items-center justify-between w-full min-w-0 gap-3" style={{ width: '100%' }}>
                  {/* Left side: Status indicator + Project name + Task count */}
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div
                      className={cn(
                        "w-2 h-2 rounded-full flex-shrink-0",
                        project.status === 'active' && "bg-green-500",
                        project.status === 'on_hold' && "bg-yellow-500",
                        project.status === 'completed' && "bg-blue-500",
                        !project.status && "bg-gray-400"
                      )}
                    />
                    <span className="truncate">{project.name}</span>
                    <span className="flex items-center gap-0.5 text-xs text-gray-500 flex-shrink-0">
                      <ClipboardList className="w-3 h-3" />
                      <span>{projectTaskCount}</span>
                    </span>
                  </div>
                  {/* Right side: Days left - pushed to far right */}
                  {dateIndicator && (
                    <span className={cn(
                      "flex items-center gap-1 text-xs flex-shrink-0 ml-auto",
                      dateIndicator.colorClass
                    )}>
                      <Clock className="w-3 h-3" />
                      {dateIndicator.display}
                    </span>
                  )}
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
}
