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
  Clock
} from 'lucide-react';
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import type { Database } from '@/types/database.types';
import { cn } from '@/lib/utils';

type Project = Database['public']['Tables']['projects']['Row'] & {
  project_phases?: Array<{
    id: string;
    status: string;
    completion_percentage: number;
  }>;
};

interface ProjectCardProps {
  project: Project;
}

const PROJECT_TYPE_CONFIG = {
  residential: {
    icon: Home,
    label: 'Residential',
    color: 'bg-blue-50 text-blue-700 border-blue-200',
    iconColor: 'text-blue-600',
    gradient: 'from-blue-400 via-blue-500 to-blue-600',
    hoverShadow: 'hover:shadow-blue-500/20',
  },
  restaurant_cafe: {
    icon: UtensilsCrossed,
    label: 'Restaurant/Cafe',
    color: 'bg-amber-50 text-amber-700 border-amber-200',
    iconColor: 'text-amber-600',
    gradient: 'from-amber-400 via-amber-500 to-amber-600',
    hoverShadow: 'hover:shadow-amber-500/20',
  },
  commercial_office: {
    icon: Building2,
    label: 'Commercial',
    color: 'bg-purple-50 text-purple-700 border-purple-200',
    iconColor: 'text-purple-600',
    gradient: 'from-purple-400 via-purple-500 to-purple-600',
    hoverShadow: 'hover:shadow-purple-500/20',
  },
  industrial: {
    icon: Factory,
    label: 'Industrial',
    color: 'bg-slate-50 text-slate-700 border-slate-200',
    iconColor: 'text-slate-600',
    gradient: 'from-slate-400 via-slate-500 to-slate-600',
    hoverShadow: 'hover:shadow-slate-500/20',
  },
};

const STATUS_CONFIG = {
  active: {
    label: 'Active',
    icon: Clock,
    color: 'bg-green-50 text-green-700 border border-green-200',
    dotColor: 'bg-green-500',
  },
  on_hold: {
    label: 'On Hold',
    icon: AlertCircle,
    color: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
    dotColor: 'bg-yellow-500',
  },
  completed: {
    label: 'Completed',
    icon: CheckCircle2,
    color: 'bg-construction-blue/10 text-construction-blue border border-construction-blue/20',
    dotColor: 'bg-construction-blue',
  },
  archived: {
    label: 'Archived',
    icon: Clock,
    color: 'bg-gray-50 text-gray-700 border border-gray-200',
    dotColor: 'bg-gray-500',
  },
};

function getHealthScoreIcon(score: number) {
  if (score >= 80) return <TrendingUp className="h-4 w-4" />;
  if (score >= 50) return <Minus className="h-4 w-4" />;
  return <TrendingDown className="h-4 w-4" />;
}

function getHealthScoreColors(score: number) {
  if (score >= 80) return {
    gradient: ['#059669', '#10B981'],
    textColor: 'text-construction-green',
    bgColor: 'bg-green-50',
    borderColor: 'border-construction-green',
    label: 'On Track'
  };
  if (score >= 50) return {
    gradient: ['#3C3C3C', '#7A7A7A'],
    textColor: 'text-construction-accent',
    bgColor: 'bg-gray-50',
    borderColor: 'border-construction-accent',
    label: 'At Risk'
  };
  return {
    gradient: ['#DC2626', '#EF4444'],
    textColor: 'text-construction-red',
    bgColor: 'bg-red-50',
    borderColor: 'border-construction-red',
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
          "group relative cursor-pointer h-full rounded-xl",
          "bg-white border-2 border-gray-200",
          "shadow-construction-lg hover:shadow-construction-xl",
          typeConfig.hoverShadow,
          "transition-all duration-300",
          "overflow-hidden"
        )}
        whileHover={{ scale: 1.02 }}
        transition={{ type: "spring", stiffness: 400, damping: 10 }}
      >
        {/* Animated Gradient Top Border */}
        <div className="absolute top-0 left-0 right-0 h-1.5 overflow-hidden rounded-t-xl">
          <motion.div
            className={cn(
              "h-full bg-gradient-to-r",
              typeConfig.gradient
            )}
            animate={{
              backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "linear",
            }}
            style={{
              backgroundSize: "200% 100%",
            }}
          />
        </div>

        {/* Card Content */}
        <div className="pt-5 px-6 pb-3 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              {/* Animated Type Icon */}
              <motion.div
                className={cn(
                  "p-2.5 rounded-xl border-2",
                  typeConfig.color
                )}
                whileHover={{ scale: 1.15, rotate: 5 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <TypeIcon className={cn("h-6 w-6", typeConfig.iconColor)} />
              </motion.div>

              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-lg line-clamp-1 group-hover:text-construction-blue transition-colors">
                  {project.name}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
                  {project.client_name}
                </p>
              </div>
            </div>

            {/* Status Badge */}
            <Badge variant="secondary" className={cn(statusConfig.color, "flex items-center gap-1.5 px-2.5 py-1 shrink-0")}>
              <span className={cn("w-1.5 h-1.5 rounded-full", statusConfig.dotColor, "animate-pulse-construction")} />
              <StatusIcon className="h-3 w-3" />
              <span className="font-semibold text-xs">{statusConfig.label}</span>
            </Badge>
          </div>

          {/* Project Type Badge */}
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="text-xs font-medium border-current">
              {typeConfig.label}
            </Badge>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {formattedStartDate}
            </span>
          </div>
        </div>

        <div className="px-6 pb-6 space-y-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Overall Progress</span>
              <span className="text-sm font-bold text-foreground">{completionPercentage}%</span>
            </div>
            <div className="relative">
              <Progress
                value={completionPercentage}
                className="h-2.5 bg-gray-100"
              />
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse-construction" />
            </div>
            {currentPhase && (
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-construction-blue" />
                Phase {project.project_phases?.findIndex((p) => p.id === currentPhase.id) + 1} of{' '}
                {project.project_phases?.length || 0}
              </p>
            )}
          </div>

          {/* Enhanced Health Score with Circular Progress - Aceternity Style */}
          <div className="flex items-center gap-4 p-4 bg-gradient-to-br from-gray-50 via-white to-gray-50/50 rounded-xl border-2 border-gray-100">
            {/* Circular Progress Ring */}
            <div className="relative w-20 h-20 shrink-0">
              <svg className="w-full h-full transform -rotate-90">
                {/* Background circle */}
                <circle
                  cx="40"
                  cy="40"
                  r="32"
                  stroke="currentColor"
                  strokeWidth="6"
                  fill="none"
                  className="text-gray-200"
                />
                {/* Animated progress circle */}
                <motion.circle
                  cx="40"
                  cy="40"
                  r="32"
                  stroke={`url(#healthGradient-${project.id})`}
                  strokeWidth="6"
                  fill="none"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: healthScore / 100 }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  strokeDasharray={`${2 * Math.PI * 32}`}
                  style={{
                    filter: "drop-shadow(0 0 8px rgba(0, 27, 81, 0.4))",
                  }}
                />
                <defs>
                  <linearGradient id={`healthGradient-${project.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={healthColors.gradient[0]} />
                    <stop offset="100%" stopColor={healthColors.gradient[1]} />
                  </linearGradient>
                </defs>
              </svg>
              {/* Center text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={cn("text-2xl font-black", healthColors.textColor)}>{healthScore}</span>
                <span className="text-[10px] font-semibold text-gray-500 -mt-1">SCORE</span>
              </div>
            </div>

            {/* Health Info */}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Project Health</p>
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 text-sm font-bold",
                    healthColors.textColor,
                    healthColors.bgColor,
                    healthColors.borderColor
                  )}
                >
                  {getHealthScoreIcon(healthScore)}
                  <span className="font-black">{healthColors.label}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Budget & Team Info */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t-2 border-gray-100">
            {project.budget && (
              <motion.div
                className="flex items-center gap-2"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <div className="p-1.5 bg-green-50 rounded-lg border border-green-200">
                  <DollarSign className="h-4 w-4 text-construction-green" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Budget</p>
                  <p className="text-sm font-black">
                    ${(project.budget / 1000).toFixed(0)}K
                  </p>
                </div>
              </motion.div>
            )}
            {project.project_team && (
              <motion.div
                className="flex items-center gap-2"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <div className="p-1.5 bg-blue-50 rounded-lg border border-blue-200">
                  <Users className="h-4 w-4 text-construction-blue" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Team</p>
                  <p className="text-sm font-black">
                    {Array.isArray(project.project_team) ? project.project_team.length : 0} members
                  </p>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Subtle glow effect on hover */}
        <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-gradient-to-br from-construction-blue/5 via-transparent to-construction-accent/5" />
      </motion.div>
    </Link>
  );
}
