"use client";

import { useState, useCallback, useMemo, useEffect, useRef, memo } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { TaskModalProvider, useTaskModal } from "./TaskModalContext";
import { TaskBoard } from ".//TaskBoard";
import { TaskModalTrigger } from "./TaskModalTrigger";
import { ProjectFilterHeader } from ".//ProjectFilterHeader";
import { ProjectTaskSummary } from "@/components/projects/ProjectTaskSummary";

// Dynamic import TaskModal (only loads when modal opens)
const TaskModal = dynamic(
  () => import("./TaskModal").then(mod => ({ default: mod.TaskModal })),
  { ssr: false }
);
import { PullToRefresh, type PullToRefreshHandle } from "@/components/mobile/PullToRefresh";
import { BlueprintBackground } from "@/components/shared";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { EmptyStateCard } from "@/components/ui/EmptyStateCard";
import { useIsMobile } from "@/lib/hooks/useMediaQuery";
import { useBottomNav } from "@/lib/contexts/BottomNavContext";
import { ClipboardList } from "lucide-react";
import { getProjectAssignees, type AssigneeOption } from "@/app/actions/tasks";
import type {
  TaskWithRelations,
  TaskProject,
  TeamMember,
  TaskDependencyRow,
} from "@/types/db/task";

interface TasksPageClientProps {
  tasks: TaskWithRelations[];
  projects: TaskProject[];
  teamMembers: TeamMember[];
  taskDependencies: TaskDependencyRow[];
  taskTypes: any[]; // TaskTypeConfigsRow[]
  initialView: "kanban" | "list";
  userRole: string | null;
}

// Status filter tabs for mobile (all 5 statuses + "all")
const STATUS_TABS = [
  { value: "all", label: "All" },
  { value: "todo", label: "To Do" },
  { value: "in_progress", label: "In Progress" },
  { value: "review", label: "Review" },
  { value: "blocked", label: "Blocked" },
  { value: "completed", label: "Completed" },
];

// Modal renderer - consumes TaskModalContext
// Wrapped in memo to prevent re-renders when parent updates
const TaskModalRenderer = memo(function TaskModalRenderer({
  projects,
  teamMembers,
  assignees,
  taskTypes,
  onSuccess
}: {
  projects: TaskProject[],
  teamMembers: TeamMember[],
  assignees: AssigneeOption[],
  taskTypes: any[],
  onSuccess: () => void
}) {
  const { isOpen, mode, selectedTask, close } = useTaskModal();

  if (!isOpen) return null;

  return (
    <TaskModal
      isOpen={isOpen}
      onClose={close}
      mode={mode}
      task={selectedTask}
      projects={projects}
      teamMembers={teamMembers}
      onSuccess={onSuccess}
      assignees={assignees}
      taskTypes={taskTypes}
    />
  );
});

// Internal component that consumes TaskModalContext
function TasksPageContent({
  tasks,
  projects,
  teamMembers,
  taskDependencies,
  taskTypes,
  initialView,
  userRole,
}: TasksPageClientProps) {
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [assignees, setAssignees] = useState<AssigneeOption[]>([]);
  const router = useRouter();
  const isMobileQuery = useIsMobile();
  const { registerCreateModal, unregisterCreateModal, openModal, closeCreateModal } = useBottomNav();
  const { openCreate } = useTaskModal();

  // Track if component has mounted to avoid hydration mismatch
  // Server renders desktop layout, client switches to mobile after mount if needed
  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => {
    // This is a legitimate hydration-safe pattern - setState on mount is intentional
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHasMounted(true);
  }, []);

  // Only use mobile detection after hydration to prevent mismatch
  const isMobile = hasMounted && isMobileQuery;

  // Fetch assignees when project filter changes (Option A: Page-level fetch)
  // This eliminates the N+1 query pattern by fetching assignees once
  useEffect(() => {
    // Early return for "all" projects case
    if (projectFilter === "all") {
      // Use functional update to clear assignees - avoids setState-in-effect warning
      setAssignees((prev) => (prev.length > 0 ? [] : prev));
      return;
    }

    // Cleanup flag to prevent race conditions when filter changes rapidly
    let cancelled = false;

    getProjectAssignees(projectFilter).then((result) => {
      // Don't update state if this effect has been cleaned up
      if (cancelled) return;

      if (result.success && result.data) {
        setAssignees(result.data);
      } else {
        setAssignees([]);
      }
    });

    // Cleanup function runs when projectFilter changes or component unmounts
    return () => {
      cancelled = true;
    };
  }, [projectFilter]);

  // Ref for pull-to-refresh
  const pullToRefreshRef = useRef<PullToRefreshHandle>(null);

  // Stabilize modal data object to prevent unnecessary effect re-runs
  // Includes assignees to prevent re-fetches when TaskModal is rendered
  const modalData = useMemo(() => ({
    projects,
    teamMembers,
    assignees,
    taskTypes,
  }), [projects, teamMembers, assignees, taskTypes]);

  // Register create modal data for bottom nav
  useEffect(() => {
    registerCreateModal("/app/tasks", modalData);
    return () => unregisterCreateModal("/app/tasks");
  }, [registerCreateModal, unregisterCreateModal, modalData]);

  // Listen to openModal from BottomNavContext and open the local modal
  useEffect(() => {
    if (openModal === 'task') {
      openCreate();
      // Close the context modal state so it doesn't interfere
      closeCreateModal();
    }
  }, [openModal, openCreate, closeCreateModal]);

  // Pull-to-refresh handler
  const handleRefresh = useCallback(async () => {
    // Small delay to show spinner before refresh
    await new Promise((resolve) => setTimeout(resolve, 500));
    router.refresh();
  }, [router]);

  // Memoized callback for task modal success to prevent TaskModalRenderer re-renders
  const handleModalSuccess = useCallback(() => {
    router.refresh();
  }, [router]);

  // Calculate active filter count (excluding "all" selections)
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (projectFilter !== "all") count++;
    // Status filter is shown in segmented control, so don"t count it here
    return count;
  }, [projectFilter]);

  // Single-pass computation of all task-derived values (reduces 4 iterations to 1)
  const taskMetrics = useMemo(() => {
    // Initialize counters
    const projectCounts: Record<string, number> = {};
    const statusCounts: Record<string, number> = {
      all: 0,
      todo: 0,
      in_progress: 0,
      review: 0,
      blocked: 0,
      completed: 0
    };
    const filtered: TaskWithRelations[] = [];
    let projectTaskCount = 0;

    const query = searchQuery?.toLowerCase();

    // Single iteration over all tasks
    for (const task of tasks) {
      // Always count by project (for dropdown)
      if (task.project_id) {
        projectCounts[task.project_id] = (projectCounts[task.project_id] || 0) + 1;
      }

      // Check project filter match
      const matchesProject = projectFilter === "all" || task.project_id === projectFilter;
      if (matchesProject && projectFilter !== "all") {
        projectTaskCount++;
      }

      // Check search match
      const matchesSearch = !query ||
        task.title.toLowerCase().includes(query) ||
        task.description?.toLowerCase().includes(query) ||
        task.project?.name.toLowerCase().includes(query) ||
        task.assignee?.name.toLowerCase().includes(query);

      // Count for status tabs (project + search filtered, not status filtered)
      if (matchesProject && matchesSearch) {
        statusCounts.all++;
        if (task.status in statusCounts) {
          statusCounts[task.status]++;
        }
      }

      // Check status filter for final filtered list
      const matchesStatus = statusFilter === "all" || task.status === statusFilter;

      if (matchesProject && matchesSearch && matchesStatus) {
        filtered.push(task);
      }
    }

    return {
      filteredTasks: filtered,
      projectTaskCount: projectFilter === "all" ? tasks.length : projectTaskCount,
      projectTaskCounts: projectCounts,
      statusCounts,
    };
  }, [tasks, searchQuery, statusFilter, projectFilter]);

  // Destructure for use
  const { filteredTasks, projectTaskCount, projectTaskCounts, statusCounts } = taskMetrics;

  // Add counts to status tabs
  const tabsWithCounts = STATUS_TABS.map((tab) => ({
    ...tab,
    count: statusCounts[tab.value] || 0,
  }));

  // Compute task summary stats BEFORE conditional rendering (fixes react-hooks/rules-of-hooks)
  // This memoized value is used in both mobile and desktop layouts
  const taskSummaryCard = useMemo(() => {
    // Early return null if no tasks to display
    if (filteredTasks.length === 0) {
      return null;
    }

    const now = new Date();
    const completed = filteredTasks.filter((t) => t.status === "completed").length;
    const blocked = filteredTasks.filter((t) => t.status === "blocked").length;
    const inProgress = filteredTasks.filter((t) => t.status === "in_progress").length;
    const overdue = filteredTasks.filter((t) => {
      if (!t.due_date || t.status === "completed") return false;
      return new Date(t.due_date) < now;
    }).length;

    const totalPlannedCost = filteredTasks.reduce(
      (sum, t) => sum + (Number(t.planned_cost) || 0),
      0,
    );
    const totalActualCost = filteredTasks.reduce(
      (sum, t) => sum + (Number(t.actual_cost) || 0),
      0,
    );
    const budgetVariance = totalPlannedCost - totalActualCost;
    const budgetUtilization =
      totalPlannedCost > 0 ? (totalActualCost / totalPlannedCost) * 100 : 0;

    const unassignedCount = filteredTasks.filter((t) => !t.assignee_id).length;

    const assigneeCounts: Record<
      string,
      { id: string; name: string; avatar_url: string | null; count: number }
    > = {};
    filteredTasks.forEach((task) => {
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
      .map((a) => ({
        id: a.id,
        name: a.name,
        avatar_url: a.avatar_url,
        taskCount: a.count,
      }));

    const tasksWithMaterials = filteredTasks.filter(
      (t) => t.materialStats && t.materialStats.count > 0,
    ).length;
    const totalMaterialCost = filteredTasks.reduce(
      (sum, t) => sum + (t.materialStats?.totalCost || 0),
      0,
    );

    const projectBudget =
      projectFilter === "all"
        ? projects.reduce((sum, p) => sum + (Number(p.budget) || 0), 0)
        : projects.find((p) => p.id === projectFilter)
          ? Number(projects.find((p) => p.id === projectFilter)?.budget) || 0
          : 0;

    return (
      <div className="my-3">
        <ProjectTaskSummary
          taskStats={{
            total: filteredTasks.length,
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
          }}
          projectBudget={projectBudget}
        />
      </div>
    );
  }, [filteredTasks, projectFilter, projects]);

  // Mobile layout
  if (isMobile) {
    return (
      <div className="flex flex-col h-full">
          {/* Task list with pull-to-refresh */}
          <PullToRefresh ref={pullToRefreshRef} onRefresh={handleRefresh} className="flex-1">
          <div className="p-4">
          <BlueprintBackground />

            <div className="relative mb-4">
              {/* Construction border */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-construction-blue" />
                <div className="flex items-start pt-2 justify-between gap-3">
                  <h1 className="text-3xl font-black tracking-tighter text-construction-blue leading-none">
                    TASKS
                  </h1>
                  
                  {/* Action Button with Construction Theme */}
                  <TaskModalTrigger projects={projects} teamMembers={teamMembers} taskTypes={taskTypes} />
                </div>
            </div>

            {/* Project Filter - Sticky on mobile */}
            <div className="sticky top-0 z-30 -mx-4 px-4 py-2 bg-white/95 backdrop-blur-sm border-b border-gray-100 dark:bg-gray-900/95 dark:border-gray-800">
              <ProjectFilterHeader
                projects={projects}
                selectedProjectId={projectFilter}
                onProjectChange={setProjectFilter}
                taskCount={projectTaskCount}
                projectTaskCounts={projectTaskCounts}
              />
            </div>

            {/* Task Summary - using pre-computed value to avoid conditional hooks */}
            {taskSummaryCard}

            {/* Empty states - show when no tasks exist */}
            {filteredTasks.length === 0 && (
              tasks.length === 0 ? (
                // No tasks exist at all - show full construction-themed empty state
                <EmptyStateCard
                  icon={ClipboardList}
                  title="CREATE YOUR FIRST TASK"
                  description="Start organizing your construction work. Track progress, assign team members, and manage deadlines."
                  buttonText="CREATE TASK"
                  onButtonClick={() => openCreate()}
                  showButton={true}
                />
              ) : (
                // Tasks exist but filters produced no results - show simple no results state
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                    <ClipboardList className="w-8 h-8 text-gray-400 dark:text-gray-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                    No tasks found
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 max-w-xs">
                    Try adjusting your filters
                  </p>
                </div>
              )
            )}

            {/* Task Board - will use list view on mobile */}
            {filteredTasks.length > 0 && (
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
                  userRole={userRole}
                  taskTypes={taskTypes}
                />
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
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Project</label>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    setProjectFilter("all");
                    setShowFilterSheet(false);
                  }}
                  className={`w-full h-12 px-4 rounded-xl text-left font-medium transition-colors ${
                    projectFilter === "all"
                      ? "bg-construction-blue text-white dark:bg-blue-900"
                      : "bg-gray-100 text-gray-700 active:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:active:bg-gray-600"
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
                        ? "bg-construction-blue text-white dark:bg-blue-900"
                        : "bg-gray-100 text-gray-700 active:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:active:bg-gray-600"
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
                  setProjectFilter("all");
                  setShowFilterSheet(false);
                }}
                className="w-full h-12 px-4 rounded-xl text-center font-medium text-[#DC2626] dark:text-red-400 bg-red-50 active:bg-red-100 dark:bg-red-900/30 dark:active:bg-red-900/50 transition-colors"
              >
                Clear All Filters
              </button>
            )}
          </div>
        </BottomSheet>

        {/* Task modal - rendered via context */}
        <TaskModalRenderer
          projects={modalData.projects}
          teamMembers={modalData.teamMembers}
          assignees={modalData.assignees}
          taskTypes={modalData.taskTypes}
          onSuccess={handleModalSuccess}
        />
      </div>
    );
  }

  // Desktop layout
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
            <TaskModalTrigger projects={projects} teamMembers={teamMembers} taskTypes={taskTypes} />
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
            {projectFilter !== "all" && (
              <div className="sm:hidden text-xs text-gray-500 dark:text-gray-400">
                Showing tasks for selected project only
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Empty state or Task Board */}
      {filteredTasks.length === 0 ? (
        tasks.length === 0 ? (
          // No tasks exist at all - show full construction-themed empty state
          <EmptyStateCard
            icon={ClipboardList}
            title="CREATE YOUR FIRST TASK"
            description="Start organizing your construction work. Track progress, assign team members, and manage deadlines."
            buttonText="CREATE TASK"
            onButtonClick={() => openCreate()}
            showButton={true}
          />
        ) : (
          // Tasks exist but filters produced no results - show simple no results state
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
              <ClipboardList className="w-8 h-8 text-gray-400 dark:text-gray-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
              No tasks found
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 max-w-xs">
              Try adjusting your filters
            </p>
          </div>
        )
      ) : (
        <>
          {/* Task Summary - using pre-computed value to avoid conditional hooks */}
          {taskSummaryCard && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
              {taskSummaryCard}
            </div>
          )}

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
            userRole={userRole}
            taskTypes={taskTypes}
          />
        </>
      )}

      {/* Decorative bottom border */}
      <div className="h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-700 to-transparent" />

      {/* Task modal - rendered via context */}
      <TaskModalRenderer
        projects={modalData.projects}
        teamMembers={modalData.teamMembers}
        assignees={modalData.assignees}
        taskTypes={modalData.taskTypes}
        onSuccess={handleModalSuccess}
      />
    </div>
  );

  return pageContent;
}

// External wrapper component that provides TaskModalContext
export function TasksPageClient(props: TasksPageClientProps) {
  return (
    <TaskModalProvider>
      <TasksPageContent {...props} />
    </TaskModalProvider>
  );
}
