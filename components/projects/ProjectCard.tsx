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
  TrendingUp,
  TrendingDown,
  Minus,
  DollarSign,
  Users,
  AlertCircle,
  CheckCircle2,
  Clock,
  Package,
  AlertTriangle,
} from 'lucide-react';
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import type { Database } from '@/types/database.types';
import { cn, formatBudget, formatShortDistance, getBudgetVarianceDisplay } from '@/lib/utils';
import type { ProjectWithStats } from '@/app/actions/projects';

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

function getHealthScoreIcon(score: number) {
  if (score >= 80) return <TrendingUp className="h-4 w-4" />;
  if (score >= 50) return <Minus className="h-4 w-4" />;
  return <TrendingDown className="h-4 w-4" />;
}

function getHealthScoreColors(score: number) {
  if (score >= 80) return {
    textColor: 'text-construction-green',
    bgColor: 'bg-construction-green/10',
    borderColor: 'border-construction-green/30',
    label: 'On Track'
  };
  if (score >= 50) return {
    textColor: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-300',
    label: 'At Risk'
  };
  return {
    textColor: 'text-construction-red',
    bgColor: 'bg-construction-red/10',
    borderColor: 'border-construction-red/30',
    label: 'Delayed'
  };
}

export function ProjectCard({ project }: ProjectCardProps) {
  const typeConfig = PROJECT_TYPE_CONFIG[project.project_type];
  const statusConfig = STATUS_CONFIG[project.status];
  const TypeIcon = typeConfig.icon;
  const StatusIcon = statusConfig.icon;

  // 3D Tilt effect - Aceternity UI style
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

  // Calculate current phase
  const currentPhase = project.project_phases?.find(
    (phase) => phase.status === 'in_progress'
  ) || project.project_phases?.[0];

  const formattedStartDate = project.start_date
    ? new Date(project.start_date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Not set';

  const healthScore = project.health_score || 100;
  const completionPercentage = project.completion_percentage || 0;
  const healthColors = getHealthScoreColors(healthScore);

  return (
    <Link href={`/app/projects/${project.id}`}>
      <motion.div
        style={{
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
          "overflow-hidden"
        )}
        whileHover={{ scale: 1.01 }}
      >
        {/* Card Content */}
        <div className="p-5 space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="p-2 rounded-md bg-construction-blue/5 border border-construction-blue/20 shrink-0">
                <TypeIcon className="h-5 w-5 text-construction-blue" />
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-base line-clamp-1 text-gray-900 group-hover:text-construction-blue transition-colors">
                  {project.name}
                </h3>
                <p className="text-sm text-gray-600 line-clamp-1 mt-0.5">
                  {project.client_name}
                </p>
              </div>
            </div>

            {/* Status Badge */}
            <Badge variant="outline" className={cn(
              "flex items-center gap-1.5 px-2 py-0.5 shrink-0 font-medium",
              statusConfig.color
            )}>
              <StatusIcon className="h-3 w-3" />
              <span className="text-xs">{statusConfig.label}</span>
            </Badge>
          </div>

          {/* Meta Info */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <TypeIcon className="h-3 w-3" />
              {typeConfig.label}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formattedStartDate}
            </span>
          </div>
        </div>

        <div className="px-5 pb-5 space-y-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-700">Overall Progress</span>
              <span className="text-sm font-bold text-construction-blue">{completionPercentage}%</span>
            </div>
            <Progress
              value={completionPercentage}
              className="h-2 bg-gray-100"
            />
            {currentPhase && (
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>
                  Phase {project.project_phases?.findIndex((p) => p.id === currentPhase.id) + 1} of{' '}
                  {project.project_phases?.length || 0}
                </span>
                {currentPhase.completion_percentage !== null && currentPhase.completion_percentage !== undefined && (
                  <span className="font-medium text-construction-blue">
                    {currentPhase.completion_percentage}%
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Health Score */}
          <div className={cn(
            "flex items-center justify-between p-3 rounded-md border",
            healthColors.bgColor,
            healthColors.borderColor
          )}>
            <div className="flex items-center gap-2">
              <div className={cn("flex items-center gap-1.5", healthColors.textColor)}>
                {getHealthScoreIcon(healthScore)}
                <span className="text-sm font-semibold">{healthColors.label}</span>
              </div>
              <span className="text-xs text-gray-400">·</span>
              <span className={cn("text-lg font-bold", healthColors.textColor)}>{healthScore}</span>
            </div>

            {/* Risk Indicators (show if project has stats and risks) */}
            {'stats' in project && project.stats &&
             (project.stats.taskCounts.blocked > 0 || project.stats.taskCounts.overdue > 0) && (
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-yellow-600" />
                <span className="text-xs font-medium text-gray-700">
                  {project.stats.taskCounts.blocked > 0 && `${project.stats.taskCounts.blocked} blocked`}
                  {project.stats.taskCounts.blocked > 0 && project.stats.taskCounts.overdue > 0 && ', '}
                  {project.stats.taskCounts.overdue > 0 && `${project.stats.taskCounts.overdue} overdue`}
                </span>
              </div>
            )}
          </div>

          {/* Budget & Schedule Grid */}
          {'stats' in project && project.stats ? (
            <>
              <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-200">
                {/* Budget Column */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1 mb-1">
                    <DollarSign className="h-3.5 w-3.5 text-construction-accent" />
                    <span className="text-xs font-semibold text-gray-700">Budget</span>
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Planned</span>
                      <span className="font-semibold text-gray-900">{formatBudget(project.budget)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
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
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1 mb-1">
                    <Calendar className="h-3.5 w-3.5 text-construction-accent" />
                    <span className="text-xs font-semibold text-gray-700">Schedule</span>
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Remaining</span>
                      <span className="font-semibold text-construction-blue">{project.stats.schedule.daysRemaining} days</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Status</span>
                      <span className={cn(
                        "font-bold",
                        project.stats.schedule.status === 'on-time' && "text-construction-green",
                        project.stats.schedule.status === 'at-risk' && "text-yellow-600",
                        project.stats.schedule.status === 'delayed' && "text-construction-red"
                      )}>
                        {project.stats.schedule.status === 'on-time' && 'On Track'}
                        {project.stats.schedule.status === 'at-risk' && 'At Risk'}
                        {project.stats.schedule.status === 'delayed' && `${project.stats.schedule.daysBehind}d behind`}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Task Summary */}
              <div className="flex items-center gap-3 pt-3 border-t border-gray-200 text-xs">
                <div className="flex items-center gap-1 text-construction-green">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span className="font-medium">{project.stats.taskCounts.completed} done</span>
                </div>
                <div className="flex items-center gap-1 text-gray-600">
                  <Package className="h-3.5 w-3.5" />
                  <span className="font-medium">{project.stats.taskCounts.todo} todo</span>
                </div>
                {project.stats.taskCounts.blocked > 0 && (
                  <div className="flex items-center gap-1 text-yellow-600">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    <span className="font-medium">{project.stats.taskCounts.blocked} blocked</span>
                  </div>
                )}
                {project.stats.taskCounts.overdue > 0 && (
                  <div className="flex items-center gap-1 text-construction-red">
                    <Clock className="h-3.5 w-3.5" />
                    <span className="font-medium">{project.stats.taskCounts.overdue} overdue</span>
                  </div>
                )}
              </div>

              {/* Footer - Team & Materials */}
              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1 text-construction-blue">
                  <Users className="h-3.5 w-3.5" />
                  <span className="font-medium">{project.stats.teamSize} team</span>
                </div>
                {project.stats.materials.needed > 0 && (
                  <div className="flex items-center gap-1 text-yellow-600">
                    <Package className="h-3.5 w-3.5" />
                    <span className="font-medium">{project.stats.materials.needed} needed</span>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Fallback for projects without stats */
            <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-200">
              {project.budget && (
                <div className="space-y-1">
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-3.5 w-3.5 text-construction-accent" />
                    <span className="text-xs font-semibold text-gray-700">Budget</span>
                  </div>
                  <p className="text-sm font-bold text-construction-blue">
                    {formatBudget(project.budget)}
                  </p>
                </div>
              )}
              {project.project_team && (
                <div className="space-y-1">
                  <div className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5 text-construction-accent" />
                    <span className="text-xs font-semibold text-gray-700">Team</span>
                  </div>
                  <p className="text-sm font-bold text-construction-blue">
                    {Array.isArray(project.project_team) ? project.project_team.length : 0} members
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
