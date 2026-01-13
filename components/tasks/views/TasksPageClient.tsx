'use client';

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { TaskBoard } from './TaskBoard';
import { TaskModalTrigger } from '../modals/TaskModalTrigger';
import { TaskModal } from '../modals/TaskModal';
import { ProjectFilterHeader } from './ProjectFilterHeader';
import { PullToRefresh, type PullToRefreshHandle } from '@/components/mobile/PullToRefresh';
import { BlueprintBackground } from '@/components/shared';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { useIsMobile } from '@/lib/hooks/useMediaQuery';
import { useBottomNav } from '@/lib/contexts/BottomNavContext';
import { ClipboardList } from 'lucide-react';
import { getProjectAssignees, type AssigneeOption } from '@/app/actions/tasks';
import type {
  TaskWithRelations,
  TaskProject,
  TeamMember,
  TaskDependencyRow,
} from '@/types/db/task';

interface TasksPageClientProps {
  tasks: TaskWithRelations[];
  projects: TaskProject[];
  teamMembers: TeamMember[];
  taskDependencies: TaskDependencyRow[];
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
  initialView,
}: TasksPageClientProps) {
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [assignees, setAssignees] = useState<AssigneeOption[]>([]);
  const router = useRouter();
  const isMobileQuery = useIsMobile();
  const { registerCreateModal, unregisterCreateModal } = useBottomNav();

  // Track if component has mounted to avoid hydration mismatch
  // Server renders desktop layout, client switches to mobile after mount if needed
  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Only use mobile detection after hydration to prevent mismatch
  const isMobile = hasMounted && isMobileQuery;

  // Fetch assignees when project filter changes (Option A: Page-level fetch)
  // This eliminates the N+1 query pattern by fetching assignees once
  useEffect(() => {
    // Only fetch assignees if a specific project is selected
    if (projectFilter && projectFilter !== 'all') {
      getProjectAssignees(projectFilter).then((result) => {
        if (result.data) {
          setAssignees(result.data);
        } else {
          setAssignees([]);
        }
      });
    } else {
      // Clear assignees when 'all' projects selected
      setAssignees([]);
    }
  }, [projectFilter]);

  // Ref for pull-to-refresh
  const pullToRefreshRef = useRef<PullToRefreshHandle>(null);

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

  // Calculate task count for the selected project (used in ProjectFilterHeader)
  const projectTaskCount = useMemo(() => {
    if (projectFilter === 'all') {
      return tasks.length;
    }
    return tasks.filter((task) => task.project_id === projectFilter).length;
  }, [tasks, projectFilter]);

  // Calculate task counts for each project (for dropdown display)
  const projectTaskCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    tasks.forEach((task) => {
      if (task.project_id) {
        counts[task.project_id] = (counts[task.project_id] || 0) + 1;
      }
    });
    return counts;
  }, [tasks]);

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
        {/* Task list with pull-to-refresh */}
        <PullToRefresh ref={pullToRefreshRef} onRefresh={handleRefresh} className="flex-1">
          <div className="p-4 pb-32">
          <BlueprintBackground />

            <div className="relative mb-4">
              {/* Construction border */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-construction-blue" />
                <div className="flex items-start pt-2 justify-between gap-3">
                  <h1 className="text-3xl font-black tracking-tighter text-construction-blue leading-none">
                    TASKS
                  </h1>
                  
                  {/* Action Button with Construction Theme */}
                  <TaskModalTrigger projects={projects} teamMembers={teamMembers} />
                </div>
            </div>

            {/* Project Filter - Sticky on mobile */}
            <div className="sticky top-0 z-30 -mx-4 px-4 py-2 bg-white/95 backdrop-blur-sm border-b border-gray-100">
              <ProjectFilterHeader
                projects={projects}
                selectedProjectId={projectFilter}
                onProjectChange={setProjectFilter}
                taskCount={projectTaskCount}
                projectTaskCounts={projectTaskCounts}
              />
            </div>
             



            {/* Task Board - will use list view on mobile */}
            <TaskBoard
              initialTasks={filteredTasks}
              taskDependencies={taskDependencies}
              projects={projects}
              teamMembers={teamMembers}
              initialView="list"
              externalProjectFilter={projectFilter}
              onExternalProjectFilterChange={setProjectFilter}
              hideFilters
              // Mobile search/filter props
              mobileSearchQuery={searchQuery}
              onMobileSearchChange={setSearchQuery}
              mobileStatusFilter={statusFilter}
              onMobileStatusChange={setStatusFilter}
              mobileStatusTabs={tabsWithCounts}
              mobileActiveFilterCount={activeFilterCount}
              onMobileFilterClick={() => setShowFilterSheet(true)}
              assignees={assignees}
            />

            {/* Empty state */}
            {filteredTasks.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                  <ClipboardList className="w-8 h-8 text-gray-400" />
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
          assignees={assignees}
        />
      </div>
    );
  }

  // Desktop layout (unchanged)
  const pageContent = (
    <div className="flex-1 space-y-4 md:space-y-6 p-4 md:p-8 pt-4 md:pt-6 relative overflow-hidden">
      <BlueprintBackground />

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
              taskCount={projectTaskCount}
              projectTaskCounts={projectTaskCounts}
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
        externalProjectFilter={projectFilter}
        onExternalProjectFilterChange={setProjectFilter}
        assignees={assignees}
      />

      {/* Decorative bottom border */}
      <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
    </div>
  );

  return pageContent;
}
