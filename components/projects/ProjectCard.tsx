"use client";

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Building2,
  Home,
  UtensilsCrossed,
  Factory,
  Calendar,
  DollarSign,
  Users,
  AlertCircle,
  CheckCircle2,
  Clock,
  Package,
  AlertTriangle,
  Receipt,
} from 'lucide-react';
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import type { Database } from '@/types/database.types';
import { cn, formatBudget } from '@/lib/utils';
import type { ProjectWithStats } from '@/app/actions/projects';
import { useIsMobile } from '@/lib/hooks/useMediaQuery';

type Project = Database['public']['Tables']['projects']['Row'] & {
  project_phases?: Array<{
    id: string;
    status: string;
    completion_percentage: number | null;
  }>;
};

interface ProjectCardProps {
  project: Project | ProjectWithStats;
}

const PROJECT_TYPE_CONFIG = {
  residential: {
    icon: Home,
    label: 'Residential',
  },
  restaurant_cafe: {
    icon: UtensilsCrossed,
    label: 'Restaurant/Cafe',
  },
  commercial_office: {
    icon: Building2,
    label: 'Commercial',
  },
  industrial: {
    icon: Factory,
    label: 'Industrial',
  },
};

const STATUS_CONFIG = {
  active: {
    label: 'Active',
    icon: Clock,
    color: 'text-construction-green border-construction-green',
  },
  on_hold: {
    label: 'On Hold',
    icon: AlertCircle,
    color: 'text-yellow-600 border-yellow-400',
  },
  completed: {
    label: 'Completed',
    icon: CheckCircle2,
    color: 'text-construction-blue border-construction-blue',
  },
  archived: {
    label: 'Archived',
    icon: Clock,
    color: 'text-gray-500 border-gray-400',
  },
};

export function ProjectCard({ project }: ProjectCardProps) {
  const typeConfig = PROJECT_TYPE_CONFIG[project.project_type];
  const statusConfig = STATUS_CONFIG[project.status];
  const TypeIcon = typeConfig.icon;
  const StatusIcon = statusConfig.icon;
  const isMobile = useIsMobile();

  // 3D Tilt effect - Aceternity UI style (disabled on mobile for performance)
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [8, -8]), {
    stiffness: 400,
    damping: 10,
  });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-8, 8]), {
    stiffness: 400,
    damping: 10,
  });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    // Disable 3D tilt on mobile for better performance
    if (isMobile) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set((e.clientX - centerX) / (rect.width / 2));
    y.set((e.clientY - centerY) / (rect.height / 2));
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  // Debug: Format start date
  const formattedStartDate = project.start_date
    ? new Date(project.start_date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Not set';

  // Debug: Calculate completion percentage
  const completionPercentage = project.completion_percentage || 0;

  return (
    <Link href={`/app/projects/${project.id}`}>
      <motion.div
        style={isMobile ? {} : {
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className={cn(
          "group relative cursor-pointer h-full rounded-lg",
          "bg-white border-[1.5px] border-construction-blue",
          "hover:border-construction-blue hover:shadow-lg",
          "transition-all duration-200",
          "overflow-hidden",
          // Mobile: Add active state for touch feedback
          "active:scale-[0.98] active:bg-gray-50"
        )}
        whileHover={isMobile ? {} : { scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
      >
        {/* Debug: Card Content - Clean minimal design, responsive padding */}
        <div className="p-4 md:p-5 space-y-3 md:space-y-4">
          {/* Debug: Header Section - Icon, Name/Client, Status Badge */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1 min-w-0">
          

              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-base md:text-lg line-clamp-1 text-gray-900 group-hover:text-construction-blue transition-colors">
                  {project.name}
                </h3>
                <p className="text-xs md:text-sm text-gray-600 line-clamp-1 mt-0.5 md:mt-1">
                  {project.client_name}
                </p>
              </div>
            </div>

            {/* Status Badge */}
            <Badge variant="outline" className={cn(
              "flex items-center gap-1 md:gap-1.5 px-1.5 md:px-2 py-0.5 shrink-0 font-medium",
              statusConfig.color
            )}>
              <StatusIcon className="h-3 w-3" />
              <span className="text-[10px] md:text-xs">{statusConfig.label}</span>
            </Badge>
          </div>

          {/* Debug: Meta Row - Project Type & Start Date */}
          <div className="flex items-center justify-between text-[10px] md:text-xs text-gray-500 pb-2 md:pb-3 border-b border-gray-100">
            <span className="flex items-center gap-1 md:gap-1.5">
              <TypeIcon className="h-3 w-3 md:h-3.5 md:w-3.5" />
              <span>{typeConfig.label}</span>
            </span>
            <span className="flex items-center gap-1 md:gap-1.5">
              <Calendar className="h-3 w-3 md:h-3.5 md:w-3.5" />
              <span>{formattedStartDate}</span>
            </span>
          </div>

          {/* Debug: Progress Section - NEW HORIZONTAL LAYOUT */}
          <div className="space-y-1.5 md:space-y-2">
            {/* Progress Bar + Percentage (side by side) */}
            <div className="flex items-center gap-2 md:gap-3">
              <Progress
                value={completionPercentage}
                className="flex-1 h-1.5 md:h-2 bg-gray-100"
              />
              <span className="text-lg md:text-xl font-bold text-construction-blue shrink-0 min-w-[3rem] md:min-w-[3.5rem] text-right">
                {completionPercentage}%
              </span>
            </div>
            {/* Small label below */}
            <p className="text-[10px] md:text-xs text-gray-500">Overall Progress</p>
          </div>

          {/* Debug: Budget & Schedule Grid - Clean 2-column layout */}
          {'stats' in project && project.stats ? (
            <>
              <div className="grid grid-cols-2 gap-3 md:gap-4 pb-3 md:pb-4 border-b border-gray-100">
                {/* Budget Column */}
                <div className="space-y-1.5 md:space-y-2">
                  <div className="flex items-center gap-1 md:gap-1.5 mb-1 md:mb-2">
                    <DollarSign className="h-3.5 w-3.5 md:h-4 md:w-4 text-construction-accent" />
                    <span className="text-[10px] md:text-xs font-semibold text-gray-700 uppercase tracking-wide">
                      Budget
                    </span>
                  </div>
                  <div className="space-y-0.5 md:space-y-1">
                    <div className="flex justify-between text-[10px] md:text-xs">
                      <span className="text-gray-500">Plan</span>
                      <span className="font-semibold text-gray-900">{formatBudget(project.budget)}</span>
                    </div>
                    <div className="flex justify-between text-[10px] md:text-xs">
                      <span className="text-gray-500">Actual</span>
                      <span className={cn(
                        "font-bold",
                        project.stats.isUnderBudget ? "text-construction-green" : "text-construction-red"
                      )}>
                        {formatBudget(project.stats.actualSpent)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Schedule Column */}
                <div className="space-y-1.5 md:space-y-2">
                  <div className="flex items-center gap-1 md:gap-1.5 mb-1 md:mb-2">
                    <Clock className="h-3.5 w-3.5 md:h-4 md:w-4 text-construction-accent" />
                    <span className="text-[10px] md:text-xs font-semibold text-gray-700 uppercase tracking-wide">
                      Schedule
                    </span>
                  </div>
                  <div className="space-y-0.5 md:space-y-1">
                    <div className="flex justify-between text-[10px] md:text-xs">
                      <span className="text-gray-500">Days</span>
                      <span className="font-semibold text-construction-blue">
                        {project.stats.schedule.daysRemaining}d
                      </span>
                    </div>
                    <div className="flex justify-between text-[10px] md:text-xs">
                      <span className="text-gray-500">Status</span>
                      <span className={cn(
                        "font-bold",
                        project.stats.schedule.status === 'on-time' && "text-construction-green",
                        project.stats.schedule.status === 'at-risk' && "text-yellow-600",
                        project.stats.schedule.status === 'delayed' && "text-construction-red"
                      )}>
                        {project.stats.schedule.status === 'on-time' && 'On Track'}
                        {project.stats.schedule.status === 'at-risk' && 'At Risk'}
                        {project.stats.schedule.status === 'delayed' && `${project.stats.schedule.daysBehind}d`}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Debug: Task Summary Pills - Horizontal colored pills */}
              <div className="flex items-center gap-1 md:gap-2.5 flex-wrap pb-2 md:pb-3 border-b border-gray-100">
                {/* Completed Tasks */}
                <div className="flex items-center gap-1 px-2 py-0.5 md:px-2.5 md:py-1 rounded-full bg-construction-green/10">
                  <CheckCircle2 className="h-3 w-3 md:h-3.5 md:w-3.5 text-construction-green" />
                  <span className="text-[10px] md:text-xs font-medium text-construction-green">
                    {project.stats.taskCounts.completed}
                  </span>
                </div>

                {/* Todo Tasks */}
                <div className="flex items-center gap-1 px-2 py-0.5 md:px-2.5 md:py-1 rounded-full bg-gray-100">
                  <Package className="h-3 w-3 md:h-3.5 md:w-3.5 text-gray-600" />
                  <span className="text-[10px] md:text-xs font-medium text-gray-600">
                    {project.stats.taskCounts.todo}
                  </span>
                </div>

                {/* Blocked Tasks (conditional) */}
                {project.stats.taskCounts.blocked > 0 && (
                  <div className="flex items-center gap-1 px-2 py-0.5 md:px-2.5 md:py-1 rounded-full bg-yellow-50">
                    <AlertTriangle className="h-3 w-3 md:h-3.5 md:w-3.5 text-yellow-600" />
                    <span className="text-[10px] md:text-xs font-medium text-yellow-600">
                      {project.stats.taskCounts.blocked}
                    </span>
                  </div>
                )}

                {/* Overdue Tasks (conditional) */}
                {project.stats.taskCounts.overdue > 0 && (
                  <div className="flex items-center gap-1 px-2 py-0.5 md:px-2.5 md:py-1 rounded-full bg-red-50">
                    <Clock className="h-3 w-3 md:h-3.5 md:w-3.5 text-construction-red" />
                    <span className="text-[10px] md:text-xs font-medium text-construction-red">
                      {project.stats.taskCounts.overdue}
                    </span>
                  </div>
                )}
              </div>

              {/* Debug: Footer - Team Size & Expenses */}
              <div className="flex items-center justify-between text-[10px] md:text-xs">
                <div className="flex items-center text-gray-500">
                  <Users className="h-3 w-3 md:h-3.5 md:w-3.5 mr-1 md:mr-1.5" />
                  <span className="font-medium">{project.stats.teamSize} members</span>
                </div>

                {/* Expense Indicator */}
                {project.stats.expenses && project.stats.expenses.total > 0 && (
                  <div className={cn(
                    "flex items-center gap-1 px-2 py-0.5 md:px-2.5 md:py-1 rounded-full",
                    // Warning if expenses approach or exceed budget
                    project.stats.expenses.approvedAmount > (project.budget || 0) * 0.8
                      ? project.stats.expenses.approvedAmount > (project.budget || 0)
                        ? "bg-red-50"
                        : "bg-yellow-50"
                      : "bg-construction-blue/10"
                  )}>
                    <Receipt className={cn(
                      "h-3 w-3 md:h-3.5 md:w-3.5",
                      project.stats.expenses.approvedAmount > (project.budget || 0)
                        ? "text-construction-red"
                        : project.stats.expenses.approvedAmount > (project.budget || 0) * 0.8
                          ? "text-yellow-600"
                          : "text-construction-blue"
                    )} />
                    <span className={cn(
                      "font-semibold",
                      project.stats.expenses.approvedAmount > (project.budget || 0)
                        ? "text-construction-red"
                        : project.stats.expenses.approvedAmount > (project.budget || 0) * 0.8
                          ? "text-yellow-600"
                          : "text-construction-blue"
                    )}>
                      {formatBudget(project.stats.expenses.approvedAmount)}
                    </span>
                    {project.stats.expenses.pending > 0 && (
                      <span className="text-gray-500">
                        (+{project.stats.expenses.pending})
                      </span>
                    )}
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Debug: Fallback for projects without stats */
            <div className="grid grid-cols-2 gap-3 md:gap-4 pb-3 md:pb-4 border-b border-gray-100">
              {project.budget && (
                <div className="space-y-1 md:space-y-2">
                  <div className="flex items-center gap-1 md:gap-1.5">
                    <DollarSign className="h-3.5 w-3.5 md:h-4 md:w-4 text-construction-accent" />
                    <span className="text-[10px] md:text-xs font-semibold text-gray-700 uppercase tracking-wide">Budget</span>
                  </div>
                  <p className="text-xs md:text-sm font-bold text-construction-blue">
                    {formatBudget(project.budget)}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </Link>
  );
}
