'use client';

import { useMemo } from 'react';
import { CheckSquare, Building2, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';

// Debug: DashboardStats - Main dashboard component with 8 metrics
interface DashboardStatsProps {
  // Filtered tasks array - stats calculated from this
  tasks: Array<{
    id: string;
    title: string;
    status: string | null;
    due_date?: string | null;
    actual_cost?: number | string | null;
    planned_cost?: number | string | null;
    assignee_id?: string | null;
    project_id: string;
  }>;

  // Current project filter value ('all' or project_id)
  projectFilter: string;

  // List of all projects (for counting active when not filtered)
  projects: Array<{
    id: string;
    name: string;
    status?: string | null;
  }>;

  // Optional project budget - when provided, displays instead of total projects
  budget?: number | null;
}

export function DashboardStats({
  tasks,
  projectFilter,
  projects,
  budget,
}: DashboardStatsProps) {
  // Calculate all stats reactively using useMemo
  const stats = useMemo(() => {
    // Total tasks from filtered array
    const totalTasks = tasks.length;

    // Total active projects - 1 if filtered, or count active projects if 'all'
    const totalActiveProjects =
      projectFilter === 'all'
        ? projects.filter((p) => p.status === 'active').length
        : 1;

    // Sum of actual cost
    const totalActualCost = tasks.reduce(
      (sum, t) => sum + (Number(t.actual_cost) || 0),
      0
    );

    // Sum of planned cost
    const totalPlannedCost = tasks.reduce(
      (sum, t) => sum + (Number(t.planned_cost) || 0),
      0
    );

    return {
      totalTasks,
      totalActiveProjects,
      totalActualCost,
      totalPlannedCost,
    };
  }, [tasks, projectFilter, projects, budget]);

  // Debug: Format currency values
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-3 md:space-y-4">
      {/* Row 1 - Stats Cards (2x2 on mobile, 4 cols on desktop) */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {/* Total Tasks */}
        <div className="relative group h-full">
          <div className="absolute inset-0 bg-gradient-to-br from-construction-blue/5 to-construction-blue/10 rounded-lg transform group-hover:scale-105 transition-transform" />
          <div className="relative bg-white border-2 border-gray-200 rounded-lg p-3 md:p-5 shadow-construction hover:shadow-construction-lg transition-all h-full flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2 md:mb-3">
              <div className="p-1.5 md:p-2 bg-construction-blue/10 rounded-lg border-2 border-construction-blue/20">
                <CheckSquare className="h-4 w-4 md:h-5 md:w-5 text-construction-blue" />
              </div>
              <div className="text-[10px] md:text-xs font-mono uppercase tracking-wider text-construction-blue/60">
                Total
              </div>
            </div>
            <div>
              <div className="text-2xl md:text-4xl font-black text-construction-blue leading-none mb-1">
                {stats.totalTasks}
              </div>
              <div className="text-xs md:text-sm font-bold text-gray-600">Tasks</div>
            </div>
          </div>
        </div>

        {/* Project Budget (if provided) OR Total Active Projects (default) */}
        {budget !== undefined && budget !== null ? (
          <div className="relative group h-full">
            <div className="absolute inset-0 bg-gradient-to-br from-construction-accent/5 to-construction-accent/10 rounded-lg transform group-hover:scale-105 transition-transform" />
            <div className="relative bg-white border-2 border-gray-200 rounded-lg p-3 md:p-5 shadow-construction hover:shadow-construction-lg transition-all h-full flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2 md:mb-3">
                <div className="p-1.5 md:p-2 bg-construction-accent/10 rounded-lg border-2 border-construction-accent/20">
                  <DollarSign className="h-4 w-4 md:h-5 md:w-5 text-construction-accent" />
                </div>
                <div className="text-[10px] md:text-xs font-mono uppercase tracking-wider text-construction-accent/60">
                  Budget
                </div>
              </div>
              <div>
                <div className="text-xl md:text-4xl font-black text-construction-accent leading-none mb-1">
                  {formatCurrency(budget)}
                </div>
                <div className="text-xs md:text-sm font-bold text-gray-600">Budget</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="relative group h-full">
            <div className="absolute inset-0 bg-gradient-to-br from-construction-blue/5 to-construction-blue/10 rounded-lg transform group-hover:scale-105 transition-transform" />
            <div className="relative bg-white border-2 border-gray-200 rounded-lg p-3 md:p-5 shadow-construction hover:shadow-construction-lg transition-all h-full flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2 md:mb-3">
                <div className="p-1.5 md:p-2 bg-construction-blue/10 rounded-lg border-2 border-construction-blue/20">
                  <Building2 className="h-4 w-4 md:h-5 md:w-5 text-construction-blue" />
                </div>
                <div className="text-[10px] md:text-xs font-mono uppercase tracking-wider text-construction-blue/60">
                  Active
                </div>
              </div>
              <div>
                <div className="text-2xl md:text-4xl font-black text-construction-blue leading-none mb-1">
                  {stats.totalActiveProjects}
                </div>
                <div className="text-xs md:text-sm font-bold text-gray-600">Projects</div>
              </div>
            </div>
          </div>
        )}

        {/* TaskBudget Overview - spans 2 columns on all screens */}
        <div className="relative group col-span-2 h-full">
          <div className="absolute inset-0 bg-gradient-to-br from-construction-blue/5 to-construction-green/5 rounded-lg transform group-hover:scale-[1.02] transition-transform" />
          <div className="relative bg-white border-2 border-gray-200 rounded-lg p-3 md:p-5 shadow-construction hover:shadow-construction-lg transition-all h-full flex flex-col">
            <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4 pb-2 md:pb-3 border-b-2 border-gray-100">
              <div className="p-1.5 md:p-2 bg-construction-blue/10 rounded-lg border-2 border-construction-blue/20">
                <DollarSign className="h-4 w-4 md:h-5 md:w-5 text-construction-blue" />
              </div>
              <h3 className="text-sm md:text-lg font-black uppercase tracking-tight text-construction-blue">
                Task Budget
              </h3>
            </div>

            <div className={cn(
              "grid gap-3 md:gap-4 flex-1 items-end",
              stats.totalPlannedCost === 0 && stats.totalActualCost === 0
                ? "grid-cols-2"
                : "grid-cols-3"
            )}>
              {/* Planned Cost */}
              <div className="text-center lg:text-left">
                <div className="text-[10px] md:text-xs font-mono uppercase tracking-wider text-construction-blue/60 mb-0.5 md:mb-1">
                  Planned
                </div>
                <div className="text-lg md:text-2xl lg:text-3xl font-black text-construction-blue leading-none">
                  {formatCurrency(stats.totalPlannedCost)}
                </div>
              </div>

              {/* Actual Cost */}
              <div className="text-center lg:text-left">
                <div className="text-[10px] md:text-xs font-mono uppercase tracking-wider text-construction-green/60 mb-0.5 md:mb-1">
                  Actual
                </div>
                <div className="text-lg md:text-2xl lg:text-3xl font-black text-construction-green leading-none">
                  {formatCurrency(stats.totalActualCost)}
                </div>
              </div>

              {/* Variance - only show if there's cost data */}
              {(stats.totalPlannedCost !== 0 || stats.totalActualCost !== 0) && (
                <div className="text-center lg:text-left">
                  <div className={cn(
                    "text-[10px] md:text-xs font-bold",
                    stats.totalActualCost <= stats.totalPlannedCost
                      ? "text-construction-green"
                      : "text-construction-red"
                  )}>
                    {stats.totalActualCost <= stats.totalPlannedCost ? "Under" : "Over"}
                  </div>
                  <div className={cn(
                    "text-lg md:text-2xl lg:text-3xl font-black leading-none",
                    stats.totalActualCost <= stats.totalPlannedCost
                      ? "text-construction-green"
                      : "text-construction-red"
                  )}>
                    {stats.totalActualCost <= stats.totalPlannedCost ? "-" : "+"}
                    {formatCurrency(Math.abs(stats.totalPlannedCost - stats.totalActualCost))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
