'use client';

import { useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { KanbanBoard } from './KanbanBoard';
import { TaskList } from './TaskList';
import { TaskFilters } from './TaskFilters';
import { TaskModal } from './TaskModal';
import { GanttChart } from './gantt/GanttChart';
import { DashboardStats } from './DashboardStats';
import { TopProjectsCard } from './TopProjectsCard';
import { TopTeamMembersCard } from './TopTeamMembersCard';
import { transformTasksForGantt } from './gantt/gantt-utils';
import { updateTaskDates } from '@/app/actions/tasks';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { LayoutGrid, List, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
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
};

type Phase = {
  id: string;
  name: string;
  order_index?: number;
};

type Project = {
  id: string;
  name: string;
  status?: string;
  health_score?: number | null;
  completion_percentage?: number | null;
  project_phases?: Phase[];
};

type TopTeamMember = {
  id: string;
  name: string;
  avatar_url?: string;
  completed_tasks: number;
};

type TeamMember = {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
};

type TaskDependency = Database['public']['Tables']['task_dependencies']['Row'];

interface TaskBoardProps {
  initialTasks: Task[];
  taskDependencies?: TaskDependency[];
  projects: Project[];
  teamMembers: TeamMember[];
  initialView: 'kanban' | 'list';
  /** When provided, we're in project context - shows phase filter and New Task button */
  projectId?: string;
  /** Phases for project context */
  phases?: Phase[];
  /** Whether to show the New Task button (default: true when projectId is provided) */
  showNewTaskButton?: boolean;
  /** Top 5 team members by completed tasks (for dashboard stats) */
  topTeamMembers?: TopTeamMember[];
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
  topTeamMembers = [],
}: TaskBoardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  // Determine if we're in project context
  const isProjectContext = !!projectId;

  const [view, setView] = useState<'kanban' | 'list'>(initialView);
  const [searchQuery, setSearchQuery] = useState('');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [phaseFilter, setPhaseFilter] = useState<string>('all');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('edit');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Handle task click to open edit modal
  const handleTaskClick = (task: Task) => {
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
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Button
            onClick={handleOpenCreateModal}
            size="lg"
            className="h-11 md:h-12 px-4 md:px-6 bg-gradient-to-r from-construction-blue to-blue-600 hover:from-construction-blue/90 hover:to-blue-600/90 text-white shadow-lg hover:shadow-xl transition-all group"
          >
            <Plus className="mr-1.5 md:mr-2 h-4 w-4 md:h-5 md:w-5 group-hover:rotate-90 transition-transform duration-300" />
            <span className="font-bold text-sm md:text-base">New Task</span>
          </Button>
        </motion.div>
      )}

      {/* Dashboard Stats - Only show on Tasks page (not in project context) */}
      {!isProjectContext && initialTasks.length > 0 && (
        <DashboardStats
          tasks={filteredTasks}
          projectFilter={projectFilter}
          projects={projects}
        />
      )}

      {/* Gantt Chart Timeline - Above Task Board */}
      {filteredTasks.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <GanttChart
            tasks={ganttTasks}
            dependencies={taskDependencies}
            onTaskClick={handleTaskClick}
            onTaskDateChange={handleTaskDateChange}
          />
        </motion.div>
      )}



      {/* Results count (Tasks page only) */}
      {!isProjectContext && (
        <div className="flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 bg-gradient-to-r from-construction-blue/5 to-transparent rounded-lg border-l-4 border-construction-blue">
          <div className="flex items-center gap-1.5 md:gap-2">
            <div className="w-2 h-2 bg-construction-blue rounded-full animate-pulse" />
            <span className="text-xs md:text-sm font-mono font-bold uppercase tracking-wider text-construction-blue">
              Status
            </span>
          </div>
          <div className="h-4 w-px bg-construction-blue/30" />
          <span className="text-xs md:text-sm font-bold text-gray-700">
            {filteredTasks.length} of {initialTasks.length} tasks
          </span>
        </div>
      )}
      
      {/* Toolbar */}
      {isProjectContext ? (
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
      ) : (
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
      )}

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

      {/* Top Projects & Team Members - Only show on Tasks page (not in project context) */}
      {!isProjectContext && filteredTasks.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4 mt-4 md:mt-6">
          <TopProjectsCard
            tasks={filteredTasks}
            projects={projects}
            projectFilter={projectFilter}
          />
          <TopTeamMembersCard
            topTeamMembers={topTeamMembers}
            tasks={filteredTasks}
            projectFilter={projectFilter}
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
      />
    </div>
  );
}
