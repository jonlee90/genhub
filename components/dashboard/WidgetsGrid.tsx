"use client";

import { FolderKanban } from "lucide-react";
import { ProjectStatusWidget } from "./ProjectStatusWidget";
import { TaskProgressWidget } from "./TaskProgressWidget";
import { BudgetSummaryWidget } from "./BudgetSummaryWidget";
import { ScheduleHealthWidget } from "./ScheduleHealthWidget";
import { TeamActivityWidget } from "./TeamActivityWidget";
import { MaterialsStatusWidget } from "./MaterialsStatusWidget";
import { WidgetSkeleton } from "@/components/ui/WidgetCard";
import type { DashboardData } from "@/types/dashboard";

export interface WidgetsGridProps {
  data: DashboardData;
  isLoading?: boolean;
}

/**
 * Widget configuration for consistent rendering
 */
const WIDGET_CONFIG = [
  { key: "project-status", title: "Project Status", icon: FolderKanban },
  { key: "task-progress", title: "Task Progress", icon: FolderKanban },
  { key: "budget-summary", title: "Budget Summary", icon: FolderKanban },
  { key: "schedule-health", title: "Schedule Health", icon: FolderKanban },
  { key: "team-activity", title: "Team Activity", icon: FolderKanban },
  { key: "materials-status", title: "Materials Status", icon: FolderKanban },
] as const;

/**
 * Loading skeleton for individual widget
 */
function DashboardWidgetSkeleton() {
  return (
    <WidgetSkeleton className="h-[280px]">
      {/* Header skeleton */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>
      {/* Content skeleton */}
      <div className="space-y-3">
        <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-20 w-full bg-gray-100 dark:bg-gray-800 rounded mt-4" />
      </div>
    </WidgetSkeleton>
  );
}

/**
 * WidgetsGrid - Mobile-first container for dashboard widgets
 *
 * Features:
 * - Single column on mobile, 2 columns on tablet/desktop
 * - Consistent spacing and styling
 * - Loading state with skeletons
 * - Touch-friendly cards
 */
export function WidgetsGrid({ data, isLoading = false }: WidgetsGridProps) {
  // Loading state: render 6 skeleton widgets
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {WIDGET_CONFIG.map((widget) => (
          <DashboardWidgetSkeleton key={widget.key} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Project Status Widget */}
      <ProjectStatusWidget status={data.projectStatus} isLoading={isLoading} />

      {/* Task Progress Widget */}
      <TaskProgressWidget progress={data.taskProgress} isLoading={isLoading} />

      {/* Budget Summary Widget */}
      <BudgetSummaryWidget budget={data.budgetSummary} isLoading={isLoading} />

      {/* Schedule Health Widget */}
      <ScheduleHealthWidget
        health={data.scheduleHealth}
        isLoading={isLoading}
      />

      {/* Team Activity Widget */}
      <TeamActivityWidget activity={data.teamActivity} isLoading={isLoading} />

      {/* Materials Status Widget */}
      <MaterialsStatusWidget
        materials={data.materialsStatus}
        isLoading={isLoading}
      />
    </div>
  );
}
