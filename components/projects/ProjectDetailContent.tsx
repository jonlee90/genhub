'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HardHat,
  Building2,
  MapPin,
  Calendar,
  DollarSign,
  TrendingUp,
  Users,
  CheckSquare,
  Clock,
  AlertTriangle,
  FileText,
  Settings,
  Activity,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ProjectTeam } from './ProjectTeam';
import { ProjectSettings } from './ProjectSettings';
import { ProjectOverview } from './ProjectOverview';
import { TaskBoard } from '@/components/tasks/TaskBoard';
import type { Database } from '@/types/database.types';
import { DashboardStats } from '../tasks/DashboardStats';

type Project = Database['public']['Tables']['projects']['Row'];

interface PhaseStats {
  phaseId: string;
  totalTasks: number;
  completedTasks: number;
  blockedTasks: number;
  overdueTasks: number;
}

// Fix C1: Import ExpenseStats instead of duplicating
import type { ExpenseStats } from '@/app/actions/projects';

interface ProjectDetailContentProps {
  project: any;
  projects: Array<{
    id: string;
    name: string;
    project_phases?: Array<{
      id: string;
      name: string;
      order_index: number;
    }>;
  }>;
  teamMembers: Array<{
    id: string;
    name: string;
    email: string;
    avatar_url: string | null;
  }>;
  phaseTaskStats: PhaseStats[];
  taskDependencies?: any[];
  expenseStats?: ExpenseStats;
}

const STATUS_CONFIG = {
  active: {
    label: 'Active',
    color: 'bg-construction-green/10 text-construction-green border-construction-green',
    dotColor: 'bg-construction-green',
  },
  on_hold: {
    label: 'On Hold',
    color: 'bg-construction-accent/10 text-construction-accent border-construction-accent',
    dotColor: 'bg-construction-accent',
  },
  completed: {
    label: 'Completed',
    color: 'bg-construction-blue/10 text-construction-blue border-construction-blue',
    dotColor: 'bg-construction-blue',
  },
  cancelled: {
    label: 'Cancelled',
    color: 'bg-red-50 text-red-700 border-red-300',
    dotColor: 'bg-red-500',
  },
};

export function ProjectDetailContent({
  project,
  projects,
  teamMembers,
  phaseTaskStats,
  taskDependencies = [],
  expenseStats,
}: ProjectDetailContentProps) {
  console.log('[ProjectDetailContent] Rendering with expense stats:', expenseStats);

  const [activeTab, setActiveTab] = useState<'overview' | 'team' | 'tasks' | 'settings'>('overview');

  const statusConfig = STATUS_CONFIG[project.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.active;

  // Calculate project statistics
  const totalTasks = project.tasks?.length || 0;
  const completedTasks = project.tasks?.filter((t: any) => t.status === 'completed').length || 0;
  const inProgressTasks = project.tasks?.filter((t: any) => t.status === 'in_progress').length || 0;
  const blockedTasks = project.tasks?.filter((t: any) => t.status === 'blocked').length || 0;
  const overdueTasks = project.tasks?.filter(
    (t: any) => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'completed'
  ).length || 0;
  const teamSize = project.project_team?.length || 0;

  // Calculate timeline progress
  const getDaysRemaining = () => {
    if (!project.end_date) return null;
    const today = new Date();
    const endDate = new Date(project.end_date);
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysRemaining = getDaysRemaining();

  // Calculate health score color
  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-construction-green';
    if (score >= 60) return 'text-construction-blue';
    if (score >= 40) return 'text-construction-accent';
    return 'text-construction-red';
  };

  const getHealthBgColor = (score: number) => {
    if (score >= 80) return 'bg-construction-green/10';
    if (score >= 60) return 'bg-construction-blue/10';
    if (score >= 40) return 'bg-construction-accent/10';
    return 'bg-construction-red/10';
  };

  const getHealthBorderColor = (score: number) => {
    if (score >= 80) return 'border-construction-green/20';
    if (score >= 60) return 'border-construction-blue/20';
    if (score >= 40) return 'border-construction-accent/20';
    return 'border-construction-red/20';
  };

  return (
    <div className="space-y-6">
      {/* Project Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-4"
      >
        {/* Title and Status */}
        <div className="flex items-start justify-between gap-6">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-4 mb-3">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-construction-blue to-blue-700 flex items-center justify-center shadow-construction">
                <HardHat className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-4xl font-black text-construction-blue leading-tight mb-2 tracking-tight">
                  {project.name}
                </h1>
                <div className="flex items-center gap-3 flex-wrap">
                  <Badge
                    className={cn(
                      'px-3 py-1 text-sm font-bold border-2 flex items-center gap-2',
                      statusConfig.color
                    )}
                  >
                    <div className={cn('h-2 w-2 rounded-full animate-pulse', statusConfig.dotColor)} />
                    {statusConfig.label}
                  </Badge>
                  {project.client_name && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 font-medium">
                      <Building2 className="h-4 w-4 text-construction-blue" />
                      <span>{project.client_name}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            {project.address && (
              <div className="flex items-center gap-2 text-gray-600 mt-2">
                <MapPin className="h-4 w-4 text-construction-accent" />
                <span className="text-sm">
                  {project.address}
                  {project.city && `, ${project.city}`}
                  {project.state && `, ${project.state}`}
                </span>
              </div>
            )}
          </div>
        </div>


        {/* Task Stats - Only show on Tasks tab */}
        {activeTab === 'tasks' && (
          <DashboardStats
              tasks={project.tasks || []}
              projectFilter={project.id}
              projects={projects}
              budget={project.budget}
            />
                )}

        {/* Stats Dashboard - Show on all tabs except Tasks */}
        {activeTab !== 'tasks' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-5 gap-4"
        >
          {/* Completion */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.15 }}
            className="relative group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-construction-blue/5 to-construction-blue/10 rounded-lg transform group-hover:scale-105 transition-transform" />
            <div className="relative bg-white border-2 border-gray-200 rounded-lg p-4 shadow-construction hover:shadow-construction-lg transition-all">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-construction-blue/10 rounded-lg border-2 border-construction-blue/20">
                  <TrendingUp className="h-4 w-4 text-construction-blue" />
                </div>
                <div className="text-xs font-mono uppercase tracking-wider text-construction-blue/60">
                  Progress
                </div>
              </div>
              <div className="text-3xl font-black text-construction-blue leading-none mb-1">
                {project.completion_percentage || 0}%
              </div>
              <div className="text-xs font-bold text-gray-600">Complete</div>
            </div>
          </motion.div>

          {/* Health Score */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="relative group"
          >
            <div
              className={cn(
                'absolute inset-0 rounded-lg transform group-hover:scale-105 transition-transform',
                getHealthBgColor(project.health_score || 0)
              )}
            />
            <div
              className={cn(
                'relative bg-white border-2 rounded-lg p-4 shadow-construction hover:shadow-construction-lg transition-all',
                getHealthBorderColor(project.health_score || 0)
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <div
                  className={cn(
                    'p-2 rounded-lg border-2',
                    getHealthBgColor(project.health_score || 0),
                    getHealthBorderColor(project.health_score || 0)
                  )}
                >
                  <Activity className={cn('h-4 w-4', getHealthColor(project.health_score || 0))} />
                </div>
                <div
                  className={cn(
                    'text-xs font-mono uppercase tracking-wider',
                    getHealthColor(project.health_score || 0),
                    'opacity-60'
                  )}
                >
                  Health
                </div>
              </div>
              <div className={cn('text-3xl font-black leading-none mb-1', getHealthColor(project.health_score || 0))}>
                {project.health_score || 0}
              </div>
              <div className="text-xs font-bold text-gray-600">Score</div>
            </div>
          </motion.div>

          {/* Budget */}
          {project.budget && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.25 }}
              className="relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-construction-accent/5 to-construction-accent/10 rounded-lg transform group-hover:scale-105 transition-transform" />
              <div className="relative bg-white border-2 border-gray-200 rounded-lg p-4 shadow-construction hover:shadow-construction-lg transition-all">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 bg-construction-accent/10 rounded-lg border-2 border-construction-accent/20">
                    <DollarSign className="h-4 w-4 text-construction-accent" />
                  </div>
                  <div className="text-xs font-mono uppercase tracking-wider text-construction-accent/60">
                    Budget
                  </div>
                </div>
                <div className="text-3xl font-black text-construction-accent leading-none mb-1">
                  ${(project.budget / 1000).toFixed(0)}k
                </div>
                <div className="text-xs font-bold text-gray-600">Total</div>
              </div>
            </motion.div>
          )}

          {/* Team Size */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.3 }}
            className="relative group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-construction-blue/5 to-construction-blue/10 rounded-lg transform group-hover:scale-105 transition-transform" />
            <div className="relative bg-white border-2 border-gray-200 rounded-lg p-4 shadow-construction hover:shadow-construction-lg transition-all">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-construction-blue/10 rounded-lg border-2 border-construction-blue/20">
                  <Users className="h-4 w-4 text-construction-blue" />
                </div>
                <div className="text-xs font-mono uppercase tracking-wider text-construction-blue/60">Team</div>
              </div>
              <div className="text-3xl font-black text-construction-blue leading-none mb-1">{teamSize}</div>
              <div className="text-xs font-bold text-gray-600">Members</div>
            </div>
          </motion.div>

          {/* Days Remaining */}
          {daysRemaining !== null && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.35 }}
              className="relative group"
            >
              <div
                className={cn(
                  'absolute inset-0 rounded-lg transform group-hover:scale-105 transition-transform',
                  daysRemaining < 0
                    ? 'bg-gradient-to-br from-red-50 to-red-100'
                    : 'bg-gradient-to-br from-construction-green/5 to-construction-green/10'
                )}
              />
              <div
                className={cn(
                  'relative bg-white border-2 rounded-lg p-4 shadow-construction hover:shadow-construction-lg transition-all',
                  daysRemaining < 0 ? 'border-red-200' : 'border-gray-200'
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <div
                    className={cn(
                      'p-2 rounded-lg border-2',
                      daysRemaining < 0
                        ? 'bg-red-50 border-red-200'
                        : 'bg-construction-green/10 border-construction-green/20'
                    )}
                  >
                    <Calendar className={cn('h-4 w-4', daysRemaining < 0 ? 'text-red-600' : 'text-construction-green')} />
                  </div>
                  <div
                    className={cn(
                      'text-xs font-mono uppercase tracking-wider opacity-60',
                      daysRemaining < 0 ? 'text-red-600' : 'text-construction-green'
                    )}
                  >
                    Timeline
                  </div>
                </div>
                {/* Right-aligned remaining days display */}
                <div className="text-right">
                  <div className={cn('text-3xl font-black leading-none mb-1', daysRemaining < 0 ? 'text-red-600' : 'text-construction-green')}>
                    {Math.abs(daysRemaining)}
                  </div>
                  <div className="text-xs font-bold text-gray-600">{daysRemaining < 0 ? 'Days Over' : 'Days Left'}</div>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
        )}

      </motion.div>

      {/* Tab Navigation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="border-b-2 border-gray-200"
      >
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={cn(
              'px-6 py-3 font-bold text-sm transition-all flex items-center gap-2 border-b-2 -mb-[2px]',
              activeTab === 'overview'
                ? 'text-construction-blue border-construction-blue'
                : 'text-gray-500 border-transparent hover:text-gray-700'
            )}
          >
            <FileText className="h-4 w-4" />
            Overview
          </button>
          <button
            onClick={() => setActiveTab('team')}
            className={cn(
              'px-6 py-3 font-bold text-sm transition-all flex items-center gap-2 border-b-2 -mb-[2px]',
              activeTab === 'team'
                ? 'text-construction-blue border-construction-blue'
                : 'text-gray-500 border-transparent hover:text-gray-700'
            )}
          >
            <Users className="h-4 w-4" />
            Team
            {teamSize > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-2 text-xs">
                {teamSize}
              </Badge>
            )}
          </button>
          <button
            onClick={() => setActiveTab('tasks')}
            className={cn(
              'px-6 py-3 font-bold text-sm transition-all flex items-center gap-2 border-b-2 -mb-[2px]',
              activeTab === 'tasks'
                ? 'text-construction-blue border-construction-blue'
                : 'text-gray-500 border-transparent hover:text-gray-700'
            )}
          >
            <CheckSquare className="h-4 w-4" />
            Tasks
            {totalTasks > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-2 text-xs">
                {totalTasks}
              </Badge>
            )}
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={cn(
              'px-6 py-3 font-bold text-sm transition-all flex items-center gap-2 border-b-2 -mb-[2px]',
              activeTab === 'settings'
                ? 'text-construction-blue border-construction-blue'
                : 'text-gray-500 border-transparent hover:text-gray-700'
            )}
          >
            <Settings className="h-4 w-4" />
            Settings
          </button>
        </div>
      </motion.div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <ProjectOverview
              project={project}
              projects={projects}
              teamMembers={teamMembers}
              phaseTaskStats={phaseTaskStats}
              expenseStats={expenseStats}
            />
          </motion.div>
        )}

        {activeTab === 'team' && (
          <motion.div
            key="team"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <ProjectTeam
              projectId={project.id}
              companyId={project.company_id}
              team={project.project_team || []}
            />
          </motion.div>
        )}

        {activeTab === 'tasks' && (
          <motion.div
            key="tasks"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <TaskBoard
              initialTasks={project.tasks || []}
              taskDependencies={taskDependencies}
              projects={projects}
              teamMembers={teamMembers}
              initialView="kanban"
              projectId={project.id}
              phases={project.project_phases || []}
            />
          </motion.div>
        )}

        {activeTab === 'settings' && (
          <motion.div
            key="settings"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <ProjectSettings project={project} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
