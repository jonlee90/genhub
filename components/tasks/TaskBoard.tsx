'use client';

import { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import { KanbanBoard } from './KanbanBoard';
import { TaskList } from './TaskList';
import { TaskFilters } from './TaskFilters';
import { TaskModal } from './TaskModal';
import { ProjectTaskSummary } from '@/components/projects/ProjectTaskSummary';
import { TopProjectsCard } from './TopProjectsCard';
import { transformTasksForGantt } from './gantt-utils';
import { updateTaskDates } from '@/app/actions/tasks';
import { SearchInput } from '@/components/mobile/SearchInput';
import { FilterTabs } from '@/components/ui/FilterTabs';
import { FilterButton } from '@/components/mobile/FilterButton';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { LayoutGrid, List, Plus, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import type { TaskStats } from '@/app/actions/projects';
import type { AssigneeOption } from '@/app/actions/tasks';
import type {
  TaskWithRelations,
  Phase,
  TaskProject,
  TeamMember,
  TaskDependencyRow,
} from '@/types/db/task';

// Dynamic import GanttChart to reduce initial bundle
const GanttChart = dynamic(() => import('./GanttChart').then(mod => ({ default: mod.GanttChart })), {
  loading: () => (
    <div className="bg-white rounded-xl border-2 border-gray-200 shadow-construction p-8">
      <div className="flex items-center justify-center gap-3 text-gray-500">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-sm font-medium">Loading timeline...</span>
      </div>
    </div>
  ),
  ssr: false,
});

/** Status tab configuration for mobile */
interface StatusTab {
  value: string;
  label: string;
  count?: number;
}

interface TaskBoardProps {
  initialTasks: TaskWithRelations[];
  taskDependencies?: TaskDependencyRow[];
  projects: TaskProject[];
  teamMembers: TeamMember[];
  initialView: 'kanban' | 'list';
  /** When provided, we're in project context - shows phase filter and New Task button */
  projectId?: string;
  /** Phases for project context */
  phases?: Phase[];
  /** Whether to show the New Task button (default: true when projectId is provided) */
  showNewTaskButton?: boolean;
  /** External project filter control - when provided, filter is managed externally */
  externalProjectFilter?: string;
  /** External project filter change handler */
  onExternalProjectFilterChange?: (projectId: string) => void;
  /** Hide all filters (useful when filters are managed externally, e.g., mobile layout) */
  hideFilters?: boolean;
  /** Ref to attach to the results count element (for mobile header visibility) */
  resultsCountRef?: React.RefObject<HTMLDivElement | null>;

  // Mobile search/filter props (Tasks page only)
  /** Search query for mobile - controlled externally */
  mobileSearchQuery?: string;
  /** Handler for mobile search query change */
  onMobileSearchChange?: (query: string) => void;
  /** Status filter for mobile - controlled externally */
  mobileStatusFilter?: string;
  /** Handler for mobile status filter change */
  onMobileStatusChange?: (status: string) => void;
  /** Status tabs with counts for mobile */
  mobileStatusTabs?: StatusTab[];
  /** Active filter count for mobile filter button badge */
  mobileActiveFilterCount?: number;
  /** Handler for opening the filter bottom sheet on mobile */
  onMobileFilterClick?: () => void;
  /** Optional: Pre-fetched assignees to avoid N+1 queries in task modals */
  assignees?: AssigneeOption[];
  /** User role for permission checks */
  userRole?: string | null;
}

export function TaskBoard({
  initialTasks,
  taskDependencies = [],
  projects,
  teamMembers,
  initialView,
  projectId,
  phases,
  showNewTaskButton,
  externalProjectFilter,
  onExternalProjectFilterChange,
  hideFilters = false,
  assignees,
  resultsCountRef,
  // Mobile search/filter props
  mobileSearchQuery,
  onMobileSearchChange,
  mobileStatusFilter,
  onMobileStatusChange,
  mobileStatusTabs,
  mobileActiveFilterCount,
  onMobileFilterClick,
  userRole,
}: TaskBoardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  // Determine if we're in project context
  const isProjectContext = !!projectId;

  const [view, setView] = useState<'kanban' | 'list'>(initialView);
  const [searchQuery, setSearchQuery] = useState('');
  const [internalProjectFilter, setInternalProjectFilter] = useState<string>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [phaseFilter, setPhaseFilter] = useState<string>('all');

  // Use external filter if provided, otherwise use internal state
  const projectFilter = externalProjectFilter ?? internalProjectFilter;
  const setProjectFilter = onExternalProjectFilterChange ?? setInternalProjectFilter;

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('edit');
  const [selectedTask, setSelectedTask] = useState<TaskWithRelations | null>(null);

  // Handle task click to open edit modal
  const handleTaskClick = (task: TaskWithRelations) => {
    setSelectedTask(task);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedTask(null);
  };

  const handleModalSuccess = () => {
    setIsModalOpen(false);
    setSelectedTask(null);
    router.refresh();
  };

  const handleOpenCreateModal = () => {
    setModalMode('create');
    setSelectedTask(null);
    setIsModalOpen(true);
  };

  // Apply filters
  const filteredTasks = useMemo(() => {
    let filtered = [...initialTasks];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (task) =>
          task.title.toLowerCase().includes(query) ||
          task.description?.toLowerCase().includes(query)
      );
    }

    // Project filter (Tasks page context only)
    if (!isProjectContext && projectFilter && projectFilter !== 'all') {
      filtered = filtered.filter((task) => task.project_id === projectFilter);
    }

    // Phase filter (Project context only)
    if (isProjectContext && phaseFilter && phaseFilter !== 'all') {
      filtered = filtered.filter((task) => task.phase_id === phaseFilter);
    }

    // Assignee filter
    if (assigneeFilter && assigneeFilter !== 'all') {
      if (assigneeFilter === 'unassigned') {
        filtered = filtered.filter((task) => !task.assignee_id);
      } else {
        filtered = filtered.filter((task) => task.assignee_id === assigneeFilter);
      }
    }

    // Priority filter
    if (priorityFilter && priorityFilter !== 'all') {
      filtered = filtered.filter((task) => task.priority === priorityFilter);
    }

    return filtered;
  }, [initialTasks, searchQuery, projectFilter, assigneeFilter, priorityFilter, phaseFilter, isProjectContext]);

  // Compute TaskStats from project-filtered tasks (updates when project dropdown changes)
  const computedTaskStats = useMemo((): TaskStats | null => {
    if (isProjectContext) return null; // Only for Tasks page

    // Filter tasks by project only (not other filters) for summary stats
    const tasksForStats = projectFilter === 'all'
      ? initialTasks
      : initialTasks.filter((task) => task.project_id === projectFilter);

    if (tasksForStats.length === 0) {
      return {
        total: 0,
        completed: 0,
        inProgress: 0,
        blocked: 0,
        overdue: 0,
        totalPlannedCost: 0,
        totalActualCost: 0,
        budgetVariance: 0,
        budgetUtilization: 0,
        unassignedCount: 0,
        topAssignees: [],
        tasksWithMaterials: 0,
        totalMaterialCost: 0,
      };
    }

    const now = new Date();
    const completed = tasksForStats.filter((t) => t.status === 'completed').length;
    const blocked = tasksForStats.filter((t) => t.status === 'blocked').length;
    const inProgress = tasksForStats.filter((t) => t.status === 'in_progress').length;
    const overdue = tasksForStats.filter((t) => {
      if (!t.due_date || t.status === 'completed') return false;
      return new Date(t.due_date) < now;
    }).length;

    const totalPlannedCost = tasksForStats.reduce((sum, t) => sum + (Number(t.planned_cost) || 0), 0);
    const totalActualCost = tasksForStats.reduce((sum, t) => sum + (Number(t.actual_cost) || 0), 0);
    const budgetVariance = totalPlannedCost - totalActualCost;
    const budgetUtilization = totalPlannedCost > 0 ? (totalActualCost / totalPlannedCost) * 100 : 0;

    const unassignedCount = tasksForStats.filter((t) => !t.assignee_id).length;

    // Compute top assignees
    const assigneeCounts: Record<string, { id: string; name: string; avatar_url: string | null; count: number }> = {};
    tasksForStats.forEach((task) => {
      if (task.assignee) {
        const key = task.assignee.id;
        if (!assigneeCounts[key]) {
          assigneeCounts[key] = {
            id: task.assignee.id,
            name: task.assignee.name,
            avatar_url: task.assignee.avatar_url,
            count: 0,
          };
        }
        assigneeCounts[key].count++;
      }
    });
    const topAssignees = Object.values(assigneeCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .map((a) => ({ id: a.id, name: a.name, avatar_url: a.avatar_url, taskCount: a.count }));

    // Calculate materials from task materialStats
    const tasksWithMaterials = tasksForStats.filter((t) => t.materialStats && t.materialStats.count > 0).length;
    const totalMaterialCost = tasksForStats.reduce((sum, t) => sum + (t.materialStats?.totalCost || 0), 0);

    return {
      total: tasksForStats.length,
      completed,
      inProgress,
      blocked,
      overdue,
      totalPlannedCost,
      totalActualCost,
      budgetVariance,
      budgetUtilization,
      unassignedCount,
      topAssignees,
      tasksWithMaterials,
      totalMaterialCost,
    };
  }, [initialTasks, projectFilter, isProjectContext]);

  // Compute project budget based on filter
  const projectBudget = useMemo(() => {
    if (isProjectContext || !projects || projects.length === 0) return undefined;
    
    if (projectFilter === 'all') {
      // Sum all project budgets
      return projects.reduce((sum, p) => sum + (Number(p.budget) || 0), 0);
    } else {
      // Get selected project's budget
      const selectedProject = projects.find(p => p.id === projectFilter);
      return selectedProject ? Number(selectedProject.budget) || 0 : 0;
    }
  }, [projects, projectFilter, isProjectContext]);

  // Handle view change
  const handleViewChange = (newView: 'kanban' | 'list') => {
    setView(newView);
    if (!isProjectContext) {
      const params = new URLSearchParams(searchParams.toString());
      params.set('view', newView);
      router.push(`/app/tasks?${params.toString()}`, { scroll: false });
    }
  };

  // Transform tasks for Gantt chart
  const ganttTasks = useMemo(() => transformTasksForGantt(filteredTasks), [filteredTasks]);

  // Handle task date change from Gantt drag-drop
  const handleTaskDateChange = async (
    taskId: string,
    newStartDate: string,
    newDueDate: string
  ) => {
    const result = await updateTaskDates(taskId, newStartDate, newDueDate);

    if (result.error) {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Task Updated',
        description: 'Task dates have been updated successfully',
      });
      router.refresh();
    }
  };

  // Should show New Task button
  const shouldShowNewTaskButton = showNewTaskButton ?? isProjectContext;

  return (
    <div className="space-y-3 md:space-y-4">
      {/* New Task Button (Project context) */}
      {shouldShowNewTaskButton && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
          <Button
            onClick={handleOpenCreateModal}
            size="lg"
            className="h-11 md:h-12 px-4 md:px-6 bg-gradient-to-r from-construction-blue to-blue-600 hover:from-construction-blue/90 hover:to-blue-600/90 text-white shadow-lg hover:shadow-xl transition-all group"
          >
            <Plus className="mr-1.5 md:mr-2 h-4 w-4 md:h-5 md:w-5 group-hover:rotate-90 transition-transform duration-300" />
            <span className="font-bold text-sm md:text-base">New Task</span>
          </Button>
        </div>
      )}

      {/* Task Summary - Only show on Tasks page (not in project context) */}
      {!isProjectContext && computedTaskStats && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
          <ProjectTaskSummary taskStats={computedTaskStats} projectBudget={projectBudget} />
        </div>
      )}

      {/* Gantt Chart Timeline - Above Task Board */}
      {filteredTasks.length > 0 && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-400">
          <GanttChart
            tasks={ganttTasks}
            dependencies={taskDependencies}
            onTaskClick={handleTaskClick}
            onTaskDateChange={handleTaskDateChange}
          />
        </div>
      )}



      {/* Mobile Search, Filter, and Status Tabs (Tasks page only) */}
      {!isProjectContext && mobileStatusTabs && onMobileSearchChange && onMobileStatusChange && onMobileFilterClick && (
        <div ref={resultsCountRef}>
          {/* Search and Filter Row */}
          <div className="flex flex-row items-center gap-2">
            <SearchInput
              value={mobileSearchQuery || ''}
              onChange={onMobileSearchChange}
              placeholder="Search tasks..."
              debounce={300}
              className="w-full"
            />
            <FilterButton
              onClick={onMobileFilterClick}
              count={mobileActiveFilterCount || 0}
              className="flex-shrink-0"
            />
          </div>

          {/* Status filter tabs */}
          <FilterTabs
            tabs={mobileStatusTabs}
            value={mobileStatusFilter || 'all'}
            onChange={onMobileStatusChange}
            showCounts={true}
            useStatusGradients={true}
            layoutId="taskStatusTabs"
          />
        </div>
      )}
      
      {/* Toolbar - hidden when hideFilters is true */}
      {!hideFilters && isProjectContext ? (
        // Project context toolbar - Phase filter + View toggle
        <Card className="border-2 border-gray-200 shadow-construction">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              {/* Phase Filter */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-bold text-gray-700">Phase:</span>
                <button
                  onClick={() => setPhaseFilter('all')}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-bold transition-all',
                    phaseFilter === 'all'
                      ? 'bg-construction-blue text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  )}
                >
                  All Phases
                </button>
                {phases?.map((phase) => (
                  <button
                    key={phase.id}
                    onClick={() => setPhaseFilter(phase.id)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-bold transition-all',
                      phaseFilter === phase.id
                        ? 'bg-construction-blue text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    )}
                  >
                    {phase.name}
                  </button>
                ))}
              </div>

              {/* View Toggle */}
              <div className="flex items-center gap-1 rounded-lg border-2 border-gray-200 p-1 bg-white">
                <Button
                  variant={view === 'kanban' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => handleViewChange('kanban')}
                  className={cn(
                    'gap-2',
                    view === 'kanban' && 'bg-construction-blue text-white hover:bg-construction-blue/90'
                  )}
                >
                  <LayoutGrid className="h-4 w-4" />
                  <span className="hidden sm:inline">Kanban</span>
                </Button>
                <Button
                  variant={view === 'list' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => handleViewChange('list')}
                  className={cn(
                    'gap-2',
                    view === 'list' && 'bg-construction-blue text-white hover:bg-construction-blue/90'
                  )}
                >
                  <List className="h-4 w-4" />
                  <span className="hidden sm:inline">List</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : !hideFilters ? (
        // Tasks page context toolbar - Full filters
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Filters */}
          <TaskFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            projectFilter={projectFilter}
            onProjectChange={setProjectFilter}
            assigneeFilter={assigneeFilter}
            onAssigneeChange={setAssigneeFilter}
            priorityFilter={priorityFilter}
            onPriorityChange={setPriorityFilter}
            projects={projects}
            teamMembers={teamMembers}
            hideProjectFilter={!!externalProjectFilter}
          />

          {/* View Toggle */}
          <div className="flex items-center gap-1 rounded-lg border p-1">
            <Button
              variant={view === 'kanban' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => handleViewChange('kanban')}
              className="gap-2"
            >
              <LayoutGrid className="h-4 w-4" />
              <span className="hidden sm:inline">Kanban</span>
            </Button>
            <Button
              variant={view === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => handleViewChange('list')}
              className="gap-2"
            >
              <List className="h-4 w-4" />
              <span className="hidden sm:inline">List</span>
            </Button>
          </div>
        </div>
      ) : null}

      {/* View Content */}
      {view === 'kanban' ? (
        <KanbanBoard
          tasks={filteredTasks}
          onTaskClick={handleTaskClick}
          phases={isProjectContext ? phases : undefined}
        />
      ) : (
        <TaskList
          tasks={filteredTasks}
          onTaskClick={handleTaskClick}
          phases={isProjectContext ? phases : undefined}
        />
      )}

      {/* Top Projects - Only show on Tasks page (not in project context) */}
      {!isProjectContext && filteredTasks.length > 0 && (
        <div className="mt-4 md:mt-6">
          <TopProjectsCard
            tasks={filteredTasks}
            projects={projects}
            projectFilter={projectFilter}
            topContributors={computedTaskStats?.topAssignees}
            unassignedCount={computedTaskStats?.unassignedCount}
          />
        </div>
      )}

      {/* Task Modal */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        mode={modalMode}
        task={selectedTask}
        projects={projects}
        teamMembers={teamMembers}
        preselectedProjectId={projectId}
        onSuccess={handleModalSuccess}
        tasks={initialTasks}
        assignees={assignees}
        userRole={userRole}
      />
    </div>
  );
}
