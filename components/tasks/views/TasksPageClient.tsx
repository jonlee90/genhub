'use client';

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { TaskBoard } from './TaskBoard';
import { TaskModalTrigger } from '../modals/TaskModalTrigger';
import { TaskModal } from '../modals/TaskModal';
import { ProjectFilterHeader } from './ProjectFilterHeader';
import { PullToRefresh, type PullToRefreshHandle } from '@/components/mobile/PullToRefresh';
import { SearchInput } from '@/components/mobile/SearchInput';
import { MobileStatusTabs } from '@/components/mobile/MobileStatusTabs';
import { FilterButton } from '@/components/mobile/FilterButton';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { useIsMobile } from '@/lib/hooks/useMediaQuery';
import { useBottomNav } from '@/lib/contexts/BottomNavContext';
import { CheckSquare } from 'lucide-react';
import type { Database } from '@/types/database.types';

type Task = Database['public']['Tables']['tasks']['Row'] & {
  assignee?: {
    id: string;
    name: string;
    email: string;
    avatar_url: string | null;
  } | null;
  project?: {
    id: string;
    name: string;
  } | null;
  phase?: {
    id: string;
    name: string;
  } | null;
  materialStats?: {
    count: number;
    totalCost: number;
  };
};

type Phase = {
  id: string;
  name: string;
  order_index: number;
};

type Project = {
  id: string;
  name: string;
  budget?: number | null;
  status?: string;
  health_score?: number | null;
  completion_percentage?: number | null;
  end_date?: string | null;
  project_phases?: Phase[];
};

type TeamMember = {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
};

type TopTeamMember = {
  id: string;
  name: string;
  avatar_url?: string;
  completed_tasks: number;
};

type TaskDependency = Database['public']['Tables']['task_dependencies']['Row'];

interface TasksPageClientProps {
  tasks: Task[];
  projects: Project[];
  teamMembers: TeamMember[];
  taskDependencies: TaskDependency[];
  topTeamMembers: TopTeamMember[];
  initialView: 'kanban' | 'list';
}

// Status filter tabs for mobile (all 5 statuses + 'all')
const STATUS_TABS = [
  { value: 'all', label: 'All' },
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'review', label: 'Review' },
  { value: 'blocked', label: 'Blocked' },
  { value: 'completed', label: 'Completed' },
];

export function TasksPageClient({
  tasks,
  projects,
  teamMembers,
  taskDependencies,
  topTeamMembers,
  initialView,
}: TasksPageClientProps) {
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const router = useRouter();
  const isMobile = useIsMobile();
  const { registerCreateModal, unregisterCreateModal } = useBottomNav();

  // Refs for scroll-based header visibility
  const pullToRefreshRef = useRef<PullToRefreshHandle>(null);
  const resultsCountRef = useRef<HTMLDivElement>(null);
  const [showHeader, setShowHeader] = useState(false);

  // Track results count element position to show/hide header
  // Header shows when results count is 133px or less from viewport top
  useEffect(() => {
    if (!isMobile) return;

    // Delay to ensure refs are populated after mount
    const setupListener = () => {
      const scrollContainer = pullToRefreshRef.current?.getScrollContainer();
      if (!scrollContainer) return;

      const checkResultsPosition = () => {
        if (!resultsCountRef.current) return;
        const rect = resultsCountRef.current.getBoundingClientRect();
        setShowHeader(rect.top <= 133);
      };

      checkResultsPosition();
      scrollContainer.addEventListener('scroll', checkResultsPosition, { passive: true });

      return () => {
        scrollContainer.removeEventListener('scroll', checkResultsPosition);
      };
    };

    const timeoutId = setTimeout(setupListener, 50);
    return () => clearTimeout(timeoutId);
  }, [isMobile]);

  // Register create modal data for bottom nav
  useEffect(() => {
    registerCreateModal('/app/tasks', {
      projects,
      teamMembers,
    });
    return () => unregisterCreateModal('/app/tasks');
  }, [projects, teamMembers, registerCreateModal, unregisterCreateModal]);

  // Pull-to-refresh handler
  const handleRefresh = useCallback(async () => {
    // Small delay to show spinner before refresh
    await new Promise((resolve) => setTimeout(resolve, 500));
    router.refresh();
  }, [router]);

  // Calculate active filter count (excluding 'all' selections)
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (projectFilter !== 'all') count++;
    // Status filter is shown in segmented control, so don't count it here
    return count;
  }, [projectFilter]);

  // Filter tasks based on search, status, and project
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          task.title.toLowerCase().includes(query) ||
          task.description?.toLowerCase().includes(query) ||
          task.project?.name.toLowerCase().includes(query) ||
          task.assignee?.name.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Status filter
      if (statusFilter !== 'all' && task.status !== statusFilter) {
        return false;
      }

      // Project filter
      if (projectFilter !== 'all' && task.project_id !== projectFilter) {
        return false;
      }

      return true;
    });
  }, [tasks, searchQuery, statusFilter, projectFilter]);

  // Calculate status counts for all tabs (filtered by project and search, but NOT by status)
  const statusCounts = useMemo(() => {
    // First, filter tasks by project and search (exclude status filter)
    const tasksForCounting = tasks.filter((task) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          task.title.toLowerCase().includes(query) ||
          task.description?.toLowerCase().includes(query) ||
          task.project?.name.toLowerCase().includes(query) ||
          task.assignee?.name.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Project filter
      if (projectFilter !== 'all' && task.project_id !== projectFilter) {
        return false;
      }

      return true;
    });

    const counts: Record<string, number> = {
      all: tasksForCounting.length,
      todo: 0,
      in_progress: 0,
      review: 0,
      blocked: 0,
      completed: 0,
    };
    tasksForCounting.forEach((task) => {
      if (task.status in counts) {
        counts[task.status]++;
      }
    });
    return counts;
  }, [tasks, projectFilter, searchQuery]);

  // Add counts to status tabs
  const tabsWithCounts = STATUS_TABS.map((tab) => ({
    ...tab,
    count: statusCounts[tab.value] || 0,
  }));

  // Handle create task success
  const handleCreateSuccess = useCallback(() => {
    setShowCreateModal(false);
    router.refresh();
  }, [router]);

  // Mobile layout
  if (isMobile) {
    return (
      <div className="flex flex-col h-full">
        {/* Fixed header - initially hidden, shows when scrolled past results count */}
        <header
          className={`
            fixed top-0 left-0 right-0 z-30
            bg-white/95 backdrop-blur-sm border-b border-gray-200
            px-4 py-3 space-y-3
            transition-all duration-200 ease-out
            will-change-transform
            ${showHeader
              ? 'translate-y-0 opacity-100 pointer-events-auto'
              : '-translate-y-full opacity-0 pointer-events-none'}
          `}
        >
          {/* Search input */}
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search tasks..."
            debounce={300}
          />

          {/* Status filter tabs (x-scrollable) */}
          <div className="flex items-center gap-2">
            <div className="flex-1 min-w-0">
              <MobileStatusTabs
                tabs={tabsWithCounts}
                value={statusFilter}
                onChange={setStatusFilter}
                showCounts={true}
              />
            </div>
            <FilterButton
              onClick={() => setShowFilterSheet(true)}
              count={activeFilterCount}
              className="flex-shrink-0"
            />
          </div>
        </header>


        {/* Task list with pull-to-refresh */}
        <PullToRefresh ref={pullToRefreshRef} onRefresh={handleRefresh} className="flex-1">
          <div className="p-4 pb-32">
            {/* Blueprint Grid Background */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.03] -z-10">
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: `
                    linear-gradient(to right, currentColor 1px, transparent 1px),
                    linear-gradient(to bottom, currentColor 1px, transparent 1px)
                  `,
                  backgroundSize: '40px 40px',
                  color: '#001B51',
                }}
              />
            </div>


      {/* Industrial Header with Blueprint Aesthetic */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
            linear-gradient(to right, currentColor 1px, transparent 1px),
            linear-gradient(to bottom, currentColor 1px, transparent 1px)
          `,
            backgroundSize: '40px 40px',
            color: '#001B51',
          }}
        />
      </div>
            <div className="relative mb-5">
              {/* Construction border */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-construction-blue" />

              <div className="flex flex-col gap-4 pt-2 md:pt-4">
                {/* Title Row */}
                <div className="flex items-start justify-between gap-3">
                    
                  {/* Prominent Project Filter */}
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <ProjectFilterHeader
                      projects={projects}
                      selectedProjectId={projectFilter}
                      onProjectChange={setProjectFilter}
                    />

                    {/* Selected project indicator on mobile */}
                    {projectFilter !== 'all' && (
                      <div className="sm:hidden text-xs text-gray-500">
                        Showing tasks for selected project only
                      </div>
                    )}
                  </div>

                  {/* Action Button with Construction Theme */}
                  <TaskModalTrigger projects={projects} teamMembers={teamMembers} />
                </div>
              </div>
            </div>

            {/* Task Board - will use list view on mobile */}
            <TaskBoard
              initialTasks={filteredTasks}
              taskDependencies={taskDependencies}
              projects={projects}
              teamMembers={teamMembers}
              initialView="list"
              topTeamMembers={topTeamMembers}
              externalProjectFilter={projectFilter}
              onExternalProjectFilterChange={setProjectFilter}
              hideFilters
              resultsCountRef={resultsCountRef}
            />

            {/* Empty state */}
            {filteredTasks.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                  <CheckSquare className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  No tasks found
                </h3>
                <p className="text-sm text-gray-500 mb-4 max-w-xs">
                  {searchQuery || statusFilter !== 'all' || projectFilter !== 'all'
                    ? 'Try adjusting your filters'
                    : 'Create your first task to get started'}
                </p>
              </div>
            )}
          </div>
        </PullToRefresh>

        {/* Filter bottom sheet */}
        <BottomSheet
          isOpen={showFilterSheet}
          onClose={() => setShowFilterSheet(false)}
          title="Filters"
          description="Filter tasks by project"
        >
          <div className="px-5 py-4 space-y-6">
            {/* Project filter */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-gray-700">Project</label>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    setProjectFilter('all');
                    setShowFilterSheet(false);
                  }}
                  className={`w-full h-12 px-4 rounded-xl text-left font-medium transition-colors ${
                    projectFilter === 'all'
                      ? 'bg-[#001B51] text-white'
                      : 'bg-gray-100 text-gray-700 active:bg-gray-200'
                  }`}
                >
                  All Projects
                </button>
                {projects.map((project) => (
                  <button
                    key={project.id}
                    type="button"
                    onClick={() => {
                      setProjectFilter(project.id);
                      setShowFilterSheet(false);
                    }}
                    className={`w-full h-12 px-4 rounded-xl text-left font-medium transition-colors ${
                      projectFilter === project.id
                        ? 'bg-[#001B51] text-white'
                        : 'bg-gray-100 text-gray-700 active:bg-gray-200'
                    }`}
                  >
                    {project.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Clear filters button */}
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={() => {
                  setProjectFilter('all');
                  setShowFilterSheet(false);
                }}
                className="w-full h-12 px-4 rounded-xl text-center font-medium text-[#DC2626] bg-red-50 active:bg-red-100 transition-colors"
              >
                Clear All Filters
              </button>
            )}
          </div>
        </BottomSheet>

        {/* Create task modal */}
        <TaskModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          mode="create"
          projects={projects}
          teamMembers={teamMembers}
          onSuccess={handleCreateSuccess}
        />
      </div>
    );
  }

  // Desktop layout (unchanged)
  const pageContent = (
    <div className="flex-1 space-y-4 md:space-y-6 p-4 md:p-8 pt-4 md:pt-6 relative overflow-hidden">
      {/* Blueprint Grid Background */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
            linear-gradient(to right, currentColor 1px, transparent 1px),
            linear-gradient(to bottom, currentColor 1px, transparent 1px)
          `,
            backgroundSize: '40px 40px',
            color: '#001B51',
          }}
        />
      </div>

      {/* Industrial Header with Blueprint Aesthetic */}
      <div className="relative">
        {/* Construction border */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-construction-blue" />

        <div className="flex flex-col gap-4 pt-2 md:pt-4">
          {/* Title Row */}
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1 md:space-y-3">
              {/* Main Title - Heavy Industrial Typography */}
              <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-construction-blue leading-none">
                TASKS
              </h1>
            </div>

            {/* Action Button with Construction Theme */}
            <TaskModalTrigger projects={projects} teamMembers={teamMembers} />
          </div>

          {/* Prominent Project Filter */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <ProjectFilterHeader
              projects={projects}
              selectedProjectId={projectFilter}
              onProjectChange={setProjectFilter}
            />

            {/* Selected project indicator on mobile */}
            {projectFilter !== 'all' && (
              <div className="sm:hidden text-xs text-gray-500">
                Showing tasks for selected project only
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Task Board with external project filter */}
      <TaskBoard
        initialTasks={tasks}
        taskDependencies={taskDependencies}
        projects={projects}
        teamMembers={teamMembers}
        initialView={initialView}
        topTeamMembers={topTeamMembers}
        externalProjectFilter={projectFilter}
        onExternalProjectFilterChange={setProjectFilter}
      />

      {/* Decorative bottom border */}
      <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
    </div>
  );

  return pageContent;
}
