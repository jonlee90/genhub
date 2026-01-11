'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
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
  FolderOpen,
  Target,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn, formatPercentWhole } from '@/lib/utils';
import { ProjectTeam } from './ProjectTeam';
import { ProjectSettings } from './ProjectSettings';
import { ProjectOverview } from './ProjectOverview';
import { TaskBoard } from '@/components/tasks/views/TaskBoard';
import { ProjectFilesTab } from './files/ProjectFilesTab';
import { DashboardStats } from '../tasks/mia/DashboardStats';

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
  userRole?: string; // NEW: For spatial viewer permissions
  projectFiles?: any[]; // NEW: For Files & Photos tab
  projectPhotos?: any[]; // NEW: For Files & Photos tab
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
  userRole = 'field_worker',
  projectFiles = [],
  projectPhotos = [],
}: ProjectDetailContentProps) {
  console.log('[ProjectDetailContent] Rendering with expense stats:', expenseStats, 'task stats:', taskStats, 'userRole:', userRole, 'files:', projectFiles?.length, 'photos:', projectPhotos?.length);

  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'overview' | 'team' | 'tasks' | 'files' | 'settings'>('overview');
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  // Handler for when primary photo changes - refresh to get updated project data
  const handlePrimaryPhotoChange = useCallback(() => {
    console.log('[ProjectDetailContent] Primary photo changed, refreshing...');
    router.refresh();
  }, [router]);

  const statusConfig = STATUS_CONFIG[project.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.active;

  // Get project type icon
  const getProjectTypeIcon = () => {
    const iconClass = "w-6 h-6 text-white sm:w-7 sm:h-7 md:w-8 md:h-8";
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
  const _completedTasks = project.tasks?.filter((t: any) => t.status === 'completed').length || 0;
  const _inProgressTasks = project.tasks?.filter((t: any) => t.status === 'in_progress').length || 0;
  const _blockedTasks = project.tasks?.filter((t: any) => t.status === 'blocked').length || 0;
  const _overdueTasks = project.tasks?.filter(
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
    <div className="space-y-4 sm:space-y-6">
      {/* Project Header - Streamlined Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-4"
      >
        {/* Hero Card with Project Identity */}
        <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-construction-lg overflow-hidden">
          {/* Top Section: Project Identity */}
          <div className="p-4 sm:p-6 bg-gradient-to-br from-gray-50 to-white">
            {/* Row 1: Icon + Name + Status */}
            <div className="flex items-start gap-3 sm:gap-4">
              {/* Project Type Icon */}
              <div className="relative flex-shrink-0">
                <div className="absolute inset-0 bg-[#001B51]/10 rounded-xl transform rotate-2" />
                <div className="relative p-2.5 bg-gradient-to-br from-[#001B51] to-[#001B51]/90 rounded-xl shadow-lg sm:p-3.5">
                  {getProjectTypeIcon()}
                </div>
              </div>

              {/* Project Name */}
              <div className="flex-1 min-w-0">
                <h1 className="text-lg font-black text-[#001B51] tracking-tight leading-tight break-words uppercase sm:text-xl md:text-2xl lg:text-3xl">
                  {project.name}
                </h1>
                <div className="flex items-center gap-2 mt-1.5">
                  <div className="h-0.5 w-6 bg-[#3C3C3C] rounded-full" />
                  <span className="text-[10px] font-bold text-[#3C3C3C] uppercase tracking-widest sm:text-xs">
                    {project.project_type?.replace(/_/g, ' ') || 'General Construction'}
                  </span>
                </div>
              </div>

              {/* Status Badge */}
              <Badge
                className={cn(
                  'px-2.5 py-1.5 text-[10px] font-black border-2 flex items-center gap-1.5 shadow-md whitespace-nowrap flex-shrink-0 uppercase tracking-wider rounded-lg',
                  'sm:px-3 sm:py-2 sm:text-xs',
                  statusConfig.color
                )}
              >
                <div className={cn('h-2 w-2 rounded-full animate-pulse', statusConfig.dotColor)} />
                {statusConfig.label}
              </Badge>
            </div>

            {/* Description (if exists) */}
            {displayDescription && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600 leading-relaxed line-clamp-2 sm:line-clamp-none">
                  {displayDescription}
                </p>
                {shouldTruncateDescription && (
                  <button
                    onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                    className="mt-2 text-xs font-bold text-[#001B51] flex items-center gap-1 min-h-[44px] active:opacity-70"
                  >
                    {isDescriptionExpanded ? (
                      <>Show less <ChevronUp className="h-3.5 w-3.5" /></>
                    ) : (
                      <>Read more <ChevronDown className="h-3.5 w-3.5" /></>
                    )}
                  </button>
                )}
              </div>
            )}

            {/* Location Link */}
            {project.address && (
              <div className="mt-3">
                {getGoogleMapsUrl() ? (
                  <a
                    href={getGoogleMapsUrl()!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      'inline-flex items-center gap-2 px-3 py-2 -mx-1 rounded-lg',
                      'text-xs font-semibold text-[#001B51]',
                      'bg-[#001B51]/5 hover:bg-[#001B51]/10',
                      'active:scale-[0.98] transition-all duration-150',
                      'min-h-[44px] sm:text-sm'
                    )}
                  >
                    <MapPin className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">
                      {[project.address, project.city, project.state].filter(Boolean).join(', ')}
                    </span>
                    <ExternalLink className="h-3.5 w-3.5 flex-shrink-0 opacity-60" />
                  </a>
                ) : (
                  <div className="flex items-center gap-2 text-xs text-gray-600 sm:text-sm">
                    <MapPin className="h-4 w-4 flex-shrink-0 text-gray-400" />
                    <span>{[project.address, project.city, project.state].filter(Boolean).join(', ')}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Bottom Section: Quick Stats Grid */}
          <div className="grid grid-cols-2 gap-px bg-gray-200 sm:grid-cols-3 lg:grid-cols-6">
            {/* Progress */}
            <div className="bg-white p-3 sm:p-4">
              <div className="flex items-center gap-2 mb-1.5">
                <TrendingUp className="h-3.5 w-3.5 text-[#001B51]" />
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Progress</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#001B51] rounded-full transition-all duration-500"
                    style={{ width: `${project.completion_percentage || 0}%` }}
                  />
                </div>
                <span className="text-sm font-black text-[#001B51] tabular-nums min-w-[3ch]">
                  {formatPercentWhole(project.completion_percentage || 0)}
                </span>
              </div>
            </div>

            {/* Health Score */}
            <div className="bg-white p-3 sm:p-4">
              <div className="flex items-center gap-2 mb-1.5">
                <Activity className={cn('h-3.5 w-3.5', getHealthColor(project.health_score || 0))} />
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Health</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-500',
                      (project.health_score || 0) >= 80 ? 'bg-construction-green' :
                      (project.health_score || 0) >= 60 ? 'bg-construction-blue' :
                      (project.health_score || 0) >= 40 ? 'bg-construction-yellow' :
                      'bg-construction-red'
                    )}
                    style={{ width: `${project.health_score || 0}%` }}
                  />
                </div>
                <span className={cn('text-sm font-black tabular-nums min-w-[3ch]', getHealthColor(project.health_score || 0))}>
                  {project.health_score || 0}
                </span>
              </div>
            </div>

            {/* Start Date */}
            <div className="bg-white p-3 sm:p-4">
              <div className="flex items-center gap-2 mb-1.5">
                <Calendar className="h-3.5 w-3.5 text-gray-400" />
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Start</span>
              </div>
              <span className="text-sm font-bold text-gray-900">
                {project.start_date
                  ? new Date(project.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                  : 'Not set'}
              </span>
            </div>

            {/* End Date */}
            <div className="bg-white p-3 sm:p-4">
              <div className="flex items-center gap-2 mb-1.5">
                <Target className="h-3.5 w-3.5 text-gray-400" />
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Target</span>
              </div>
              <span className="text-sm font-bold text-gray-900">
                {project.end_date
                  ? new Date(project.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                  : 'Not set'}
              </span>
            </div>

            {/* Days Remaining */}
            <div className="bg-white p-3 sm:p-4">
              <div className="flex items-center gap-2 mb-1.5">
                <Clock className={cn('h-3.5 w-3.5', daysRemaining !== null && daysRemaining < 0 ? 'text-construction-red' : 'text-gray-400')} />
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                  {daysRemaining !== null && daysRemaining < 0 ? 'Overdue' : 'Days Left'}
                </span>
              </div>
              <span className={cn(
                'text-sm font-black tabular-nums',
                daysRemaining !== null && daysRemaining < 0 ? 'text-construction-red' : 'text-gray-900'
              )}>
                {daysRemaining !== null ? Math.abs(daysRemaining) : 'N/A'}
              </span>
            </div>

            {/* Budget */}
            <div className="bg-white p-3 sm:p-4">
              <div className="flex items-center gap-2 mb-1.5">
                <DollarSign className="h-3.5 w-3.5 text-construction-green" />
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Budget</span>
              </div>
              <span className="text-sm font-black text-gray-900 tabular-nums">
                {project.budget ? `$${(project.budget / 1000).toFixed(0)}k` : 'Not set'}
              </span>
            </div>
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


      </motion.div>

      {/* Tab Navigation - Mobile-First Pill Design */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="relative -mx-4 px-4 md:mx-0 md:px-0"
      >
        {/* Industrial accent line */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-200" />

        {/* Scrollable tab container with snap points */}
        <div
          className="flex items-center gap-1.5 overflow-x-auto pb-3 snap-x snap-mandatory scrollbar-hide sm:gap-2 md:gap-3"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {/* Overview Tab */}
          <button
            onClick={() => setActiveTab('overview')}
            className={cn(
              'relative flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap snap-start',
              'min-h-[44px] min-w-[44px] flex-shrink-0',
              'transition-all duration-200 ease-out',
              'active:scale-[0.97]',
              'sm:px-5 sm:py-3 sm:text-sm',
              activeTab === 'overview'
                ? 'bg-[#001B51] text-white shadow-lg shadow-[#001B51]/25'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 active:bg-gray-300'
            )}
          >
            <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
            <span>Overview</span>
          </button>

          {/* Team Tab */}
          <button
            onClick={() => setActiveTab('team')}
            className={cn(
              'relative flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap snap-start',
              'min-h-[44px] min-w-[44px] flex-shrink-0',
              'transition-all duration-200 ease-out',
              'active:scale-[0.97]',
              'sm:px-5 sm:py-3 sm:text-sm',
              activeTab === 'team'
                ? 'bg-[#001B51] text-white shadow-lg shadow-[#001B51]/25'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 active:bg-gray-300'
            )}
          >
            <Users className="h-4 w-4 sm:h-5 sm:w-5" />
            <span>Team</span>
            {teamSize > 0 && (
              <span className={cn(
                'ml-1 px-1.5 py-0.5 rounded-md text-[10px] font-black tabular-nums',
                activeTab === 'team'
                  ? 'bg-white/20 text-white'
                  : 'bg-[#001B51]/10 text-[#001B51]'
              )}>
                {teamSize}
              </span>
            )}
          </button>

          {/* Tasks Tab */}
          <button
            onClick={() => setActiveTab('tasks')}
            className={cn(
              'relative flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap snap-start',
              'min-h-[44px] min-w-[44px] flex-shrink-0',
              'transition-all duration-200 ease-out',
              'active:scale-[0.97]',
              'sm:px-5 sm:py-3 sm:text-sm',
              activeTab === 'tasks'
                ? 'bg-[#001B51] text-white shadow-lg shadow-[#001B51]/25'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 active:bg-gray-300'
            )}
          >
            <CheckSquare className="h-4 w-4 sm:h-5 sm:w-5" />
            <span>Tasks</span>
            {totalTasks > 0 && (
              <span className={cn(
                'ml-1 px-1.5 py-0.5 rounded-md text-[10px] font-black tabular-nums',
                activeTab === 'tasks'
                  ? 'bg-white/20 text-white'
                  : 'bg-[#001B51]/10 text-[#001B51]'
              )}>
                {totalTasks}
              </span>
            )}
          </button>

          {/* Files Tab */}
          <button
            onClick={() => setActiveTab('files')}
            className={cn(
              'relative flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap snap-start',
              'min-h-[44px] min-w-[44px] flex-shrink-0',
              'transition-all duration-200 ease-out',
              'active:scale-[0.97]',
              'sm:px-5 sm:py-3 sm:text-sm',
              activeTab === 'files'
                ? 'bg-[#001B51] text-white shadow-lg shadow-[#001B51]/25'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 active:bg-gray-300'
            )}
          >
            <FolderOpen className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="hidden sm:inline">Files & Photos</span>
            <span className="sm:hidden">Files</span>
            {((projectFiles?.length || 0) + (projectPhotos?.length || 0)) > 0 && (
              <span className={cn(
                'ml-1 px-1.5 py-0.5 rounded-md text-[10px] font-black tabular-nums',
                activeTab === 'files'
                  ? 'bg-white/20 text-white'
                  : 'bg-[#001B51]/10 text-[#001B51]'
              )}>
                {(projectFiles?.length || 0) + (projectPhotos?.length || 0)}
              </span>
            )}
          </button>

          {/* Settings Tab */}
          <button
            onClick={() => setActiveTab('settings')}
            className={cn(
              'relative flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap snap-start',
              'min-h-[44px] min-w-[44px] flex-shrink-0',
              'transition-all duration-200 ease-out',
              'active:scale-[0.97]',
              'sm:px-5 sm:py-3 sm:text-sm',
              activeTab === 'settings'
                ? 'bg-[#001B51] text-white shadow-lg shadow-[#001B51]/25'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 active:bg-gray-300'
            )}
          >
            <Settings className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="hidden sm:inline">Settings</span>
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
              userRole={userRole}
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

        {activeTab === 'files' && (
          <motion.div
            key="files"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <ProjectFilesTab
              projectId={project.id}
              initialFiles={projectFiles || []}
              initialPhotos={projectPhotos || []}
              currentImageUrl={project.image_url}
              onPrimaryPhotoChange={handlePrimaryPhotoChange}
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
