'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  MapPin,
  Calendar,
  DollarSign,
  TrendingUp,
  Users,
  CheckSquare,
  Clock,
  FileText,
  Settings,
  Activity,
  Home,
  UtensilsCrossed,
  Factory,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  HardHat,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ProjectTeam } from './ProjectTeam';
import { ProjectSettings } from './ProjectSettings';
import { ProjectOverview } from './ProjectOverview';
import { TaskBoard } from '@/components/tasks/TaskBoard';
import type { Database } from '@/types/database.types';
import { DashboardStats } from '../tasks/DashboardStats';
import { InfoCard } from './InfoCard';

type Project = Database['public']['Tables']['projects']['Row'];

interface PhaseStats {
  phaseId: string;
  totalTasks: number;
  completedTasks: number;
  blockedTasks: number;
  overdueTasks: number;
}

// Fix C1: Import ExpenseStats instead of duplicating
import type { ExpenseStats, TaskStats } from '@/app/actions/projects';

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
  taskStats?: TaskStats;
  activeModel?: any;
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
  taskStats,
  activeModel,
}: ProjectDetailContentProps) {
  console.log('[ProjectDetailContent] Rendering with expense stats:', expenseStats, 'and task stats:', taskStats);

  const [activeTab, setActiveTab] = useState<'overview' | 'team' | 'tasks' | 'settings'>('overview');
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  const statusConfig = STATUS_CONFIG[project.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.active;

  // Get project type icon
  const getProjectTypeIcon = () => {
    const iconClass = "w-8 h-8 text-white";
    switch (project.project_type) {
      case 'residential':
        return <Home className={iconClass} />;
      case 'restaurant_cafe':
      case 'restaurant':
      case 'cafe':
        return <UtensilsCrossed className={iconClass} />;
      case 'commercial_office':
        return <Building2 className={iconClass} />;
      case 'industrial':
        return <Factory className={iconClass} />;
      default:
        return <HardHat className={iconClass} />;
    }
  };

  // Format address for Google Maps
  const getGoogleMapsUrl = () => {
    if (!project.address) return null;
    const addressParts = [
      project.address,
      project.city,
      project.state,
      project.zip_code,
    ].filter(Boolean);
    const fullAddress = addressParts.join(', ');
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;
  };

  // Truncate description
  const DESCRIPTION_LIMIT = 150;
  const shouldTruncateDescription = project.description && project.description.length > DESCRIPTION_LIMIT;
  const displayDescription = !project.description
    ? null
    : isDescriptionExpanded || !shouldTruncateDescription
    ? project.description
    : project.description.slice(0, DESCRIPTION_LIMIT) + '...';

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
        {/* Comprehensive Project Title InfoCard */}
        <InfoCard
          headerIcon={getProjectTypeIcon}
          headerTitle={project.name}
          headerDescription={displayDescription || 'No description provided'}
          isHeroCard={true}
          columns={3}
          className="border-2 border-gray-300 shadow-construction-lg"
          customHeader={
            <div className="space-y-6">
              {/* Construction-themed Header Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 pb-6 border-b-4 border-[#001B51]">
                {/* Project Type Icon with Industrial Frame */}
                <div className="relative flex-shrink-0">
                  <div className="absolute inset-0 bg-[#001B51] opacity-10 rounded-lg transform rotate-2" />
                  <div className="absolute inset-0 bg-[#3C3C3C] opacity-5 rounded-lg transform -rotate-2" />
                  <div className="relative p-5 bg-[#001B51] rounded-lg shadow-2xl border-2 border-[#001B51]/20">
                    {getProjectTypeIcon()}
                  </div>
                </div>

                {/* Title + Status Section */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col gap-3">
                    {/* Project Name + Status Badge */}
                    <div className="flex flex-wrap items-center gap-4">
                      <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-[#001B51] tracking-tight leading-none break-words uppercase">
                        {project.name}
                      </h1>
                      <Badge
                        className={cn(
                          'px-4 py-2 text-sm font-black border-2 flex items-center gap-2.5 shadow-lg whitespace-nowrap flex-shrink-0 uppercase tracking-wide',
                          statusConfig.color
                        )}
                      >
                        <div className={cn('h-2.5 w-2.5 rounded-full animate-pulse', statusConfig.dotColor)} />
                        {statusConfig.label}
                      </Badge>
                    </div>

                    {/* Project Type Label */}
                    <div className="flex items-center gap-2">
                      <div className="h-1 w-12 bg-[#3C3C3C] rounded-full" />
                      <span className="text-xs font-black text-[#3C3C3C] uppercase tracking-widest">
                        {project.project_type?.replace(/_/g, ' ') || 'General Construction'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description + Location Row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Description - Takes 1 column */}
                <div className="lg:col-span-1">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-gray-100 rounded-md flex-shrink-0 mt-1">
                      <FileText className="h-4 w-4 text-[#001B51]" />
                    </div>
                    <div>
                      <h3 className="text-xs font-black text-gray-500 uppercase tracking-wider mb-2">
                        Description
                      </h3>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {displayDescription || 'No description provided'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Location - Takes 2 columns (2/3 width) */}
                {project.address && (
                  <div className="lg:col-span-2">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-gray-100 rounded-md flex-shrink-0 mt-1">
                        <MapPin className="h-4 w-4 text-[#001B51]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xs font-black text-gray-500 uppercase tracking-wider mb-2">
                          Project Location
                        </h3>
                        {getGoogleMapsUrl() ? (
                          <a
                            href={getGoogleMapsUrl()!}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-sm font-bold text-[#001B51] hover:text-blue-700 transition-colors group"
                          >
                            <span className="break-words">
                              {[
                                project.address,
                                project.city,
                                project.state,
                                project.zip_code,
                              ].filter(Boolean).join(', ')}
                            </span>
                            <ExternalLink className="h-4 w-4 flex-shrink-0 group-hover:scale-110 transition-transform" />
                          </a>
                        ) : (
                          <p className="text-sm font-bold text-gray-900">
                            {[
                              project.address,
                              project.city,
                              project.state,
                              project.zip_code,
                            ].filter(Boolean).join(', ')}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          }
          fields={[
            // TIMELINE SECTION
            {
              label: 'Start Date',
              value: project.start_date
                ? new Date(project.start_date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : 'Not set',
              icon: Calendar,
              show: true,
            },
            {
              label: 'Target End',
              value: project.end_date
                ? new Date(project.end_date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : 'Not set',
              icon: Calendar,
              show: true,
            },
            {
              label: daysRemaining !== null && daysRemaining < 0 ? 'Days Over' : 'Days Left',
              value: daysRemaining !== null ? Math.abs(daysRemaining).toString() : 'N/A',
              icon: Clock,
              show: daysRemaining !== null,
              className: daysRemaining !== null && daysRemaining < 0 ? 'text-construction-red' : 'text-construction-green',
            },

            // METRICS SECTION
            {
              label: 'Project Progress',
              value: `${project.completion_percentage || 0}%`,
              icon: TrendingUp,
              isProgressBar: true,
              progressValue: project.completion_percentage || 0,
              progressColor: 'bg-construction-blue',
              show: true,
            },
            {
              label: 'Budget',
              value: project.budget
                ? `$${(project.budget / 1000).toFixed(0)}k`
                : 'Not set',
              icon: DollarSign,
              show: !!project.budget,
            },
            {
              label: 'Health Score',
              value: `${project.health_score || 0}`,
              icon: Activity,
              isProgressBar: true,
              progressValue: project.health_score || 0,
              progressColor:
                (project.health_score || 0) >= 80 ? 'bg-construction-green' :
                (project.health_score || 0) >= 60 ? 'bg-construction-blue' :
                (project.health_score || 0) >= 40 ? 'bg-construction-accent' :
                'bg-construction-red',
              show: true,
            }
          ]}
          footerContent={
            displayDescription && shouldTruncateDescription ? (
              <div className="mt-6 pt-6 border-t-2 border-gray-200">
                <button
                  onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                  className="inline-flex items-center gap-2 text-sm font-bold text-construction-blue hover:text-blue-700 transition-all group hover:gap-3"
                >
                  {isDescriptionExpanded ? (
                    <>
                      Show less
                      <ChevronUp className="h-4 w-4 group-hover:-translate-y-0.5 transition-transform" />
                    </>
                  ) : (
                    <>
                      Read more
                      <ChevronDown className="h-4 w-4 group-hover:translate-y-0.5 transition-transform" />
                    </>
                  )}
                </button>
              </div>
            ) : undefined
          }
        />

        {/* Task Stats - Only show on Tasks tab */}
        {activeTab === 'tasks' && (
          <DashboardStats
              tasks={project.tasks || []}
              projectFilter={project.id}
              projects={projects}
              budget={project.budget}
            />
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
              taskStats={taskStats}
              activeModel={activeModel}
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
