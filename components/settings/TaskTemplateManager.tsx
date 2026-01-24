"use client";

import { useState, useEffect, useCallback, memo, useMemo } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
// Performance optimization: Direct imports instead of barrel file
import Plus from "lucide-react/icons/plus";
import Edit from "lucide-react/icons/edit";
import Trash2 from "lucide-react/icons/trash-2";
import Package from "lucide-react/icons/package";
import Hammer from "lucide-react/icons/hammer";
import CheckCircle2 from "lucide-react/icons/check-circle-2";
import Clipboard from "lucide-react/icons/clipboard";
import AlertCircle from "lucide-react/icons/alert-circle";
import ListChecks from "lucide-react/icons/list-checks";
import { Button } from "@/components/ui/button";
import { ResponsiveModal } from "@/components/ui/ResponsiveModal";
import { TemplateCard, type TemplateBadge } from "@/components/ui/TemplateCard";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  getTaskTemplates,
  createTaskTemplate,
  updateTaskTemplate,
  deleteTaskTemplate,
  reorderTaskTemplates,
} from "@/app/actions/task-templates";
import {
  type ProjectTypeWithCount,
} from "@/app/actions/project-types";
import {
  type PhaseTemplateWithTasks,
} from "@/app/actions/phase-templates";
import type {
  TaskTemplatesRow,
  TaskTypeConfigsRow,
} from "@/types/db/tables/tasks";

// Type aliases for improved code readability
type TaskTemplate = TaskTemplatesRow;
type TaskTypeConfig = TaskTypeConfigsRow;

/**
 * Task type configuration for badge display
 * Default task type configurations with display properties (icon, label, color)
 */
const DEFAULT_TASK_TYPE_CONFIG = {
  work: {
    label: "Work",
    icon: Hammer,
    color: "bg-construction-blue text-white",
  },
  purchase: {
    label: "Purchase",
    icon: Package,
    color: "bg-[#059669] text-white",
  },
  approval: {
    label: "Approval",
    icon: CheckCircle2,
    color: "bg-[#FFB627] text-white",
  },
  admin: {
    label: "Admin",
    icon: Clipboard,
    color: "bg-construction-accent text-white",
  },
};

/**
 * Priority configuration for badge display
 * Priority configuration with color-coded display properties
 */
const PRIORITY_CONFIG = {
  high: { label: "High", color: "border-red-300 dark:border-red-700 text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950" },
  medium: {
    label: "Medium",
    color: "border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950",
  },
  low: { label: "Low", color: "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900" },
};

/**
 * Empty state when no project type is selected
 * Hoisted outside component to prevent re-creation on every render
 */
const NoProjectTypeSelectedTask = memo(() => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="p-6 bg-gradient-to-br from-construction-blue/5 to-construction-blue/10 dark:from-construction-blue/10 dark:to-construction-blue/20 rounded-full border-2 border-construction-blue/20 dark:border-construction-blue/40 mb-4">
      <ListChecks className="h-16 w-16 text-construction-blue dark:text-blue-400" />
    </div>
    <h3 className="text-xl font-black text-gray-900 dark:text-gray-100 mb-2 uppercase tracking-tight">
      Select a Project Type
    </h3>
    <p className="text-gray-500 dark:text-gray-400 max-w-md">
      Choose a project type and phase from the filters above to view and
      manage task templates
    </p>
  </div>
));
NoProjectTypeSelectedTask.displayName = 'NoProjectTypeSelectedTask';

/**
 * Empty state when no phase is selected
 * Hoisted outside component to prevent re-creation on every render
 */
interface NoPhaseSelectedProps {
  phasesAvailable: boolean;
}

const NoPhaseSelected = memo(function NoPhaseSelected({ phasesAvailable }: NoPhaseSelectedProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="p-6 bg-gradient-to-br from-construction-blue/5 to-construction-blue/10 dark:from-construction-blue/10 dark:to-construction-blue/20 rounded-full border-2 border-construction-blue/20 dark:border-construction-blue/40 mb-4">
        <ListChecks className="h-16 w-16 text-construction-blue dark:text-blue-400" />
      </div>
      <h3 className="text-xl font-black text-gray-900 dark:text-gray-100 mb-2 uppercase tracking-tight">
        Select a Phase
      </h3>
      <p className="text-gray-500 dark:text-gray-400 max-w-md">
        {!phasesAvailable
          ? "No phase templates found for this project type. Create phase templates first."
          : "Choose a phase template to view its task templates"}
      </p>
    </div>
  );
});

/**
 * Empty state when no task templates exist
 * Hoisted outside component to prevent re-creation on every render
 */
interface EmptyTaskStateProps {
  onCreate: () => void;
}

const EmptyTaskState = memo(function EmptyTaskState({ onCreate }: EmptyTaskStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center animate-in fade-in zoom-in-95 duration-500">
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-construction-blue/10 rounded-full blur-2xl" />
        <div className="relative p-6 bg-gradient-to-br from-construction-blue/5 to-construction-blue/10 dark:from-construction-blue/10 dark:to-construction-blue/20 rounded-full border-2 border-construction-blue/20 dark:border-construction-blue/40">
          <ListChecks className="h-16 w-16 text-construction-blue dark:text-blue-400" />
        </div>
      </div>
      <h3 className="text-xl font-black text-gray-900 dark:text-gray-100 mb-2 uppercase tracking-tight">
        No Task Templates Defined
      </h3>
      <p className="text-gray-500 dark:text-gray-400 max-w-md mb-6">
        Create task templates to define default tasks for this project phase
      </p>
      <Button
        onClick={onCreate}
        className="bg-construction-blue hover:bg-blue-700 text-white font-bold min-h-[44px]"
      >
        <Plus className="h-4 w-4 mr-2" />
        Create First Task Template
      </Button>
    </div>
  );
});

/**
 * SortableTaskItem - Individual draggable task template card using TemplateCard
 * Compact draggable task template card with type and priority badges
 * Performance: Uses reusable TemplateCard component, wrapped in React.memo
 */
interface SortableTaskItemProps {
  task: TaskTemplate;
  taskTypeConfigs: Record<string, TaskTypeConfig>;
  onEdit: () => void;
  onDelete: () => void;
}

const SortableTaskItem = memo(function SortableTaskItem({
  task,
  taskTypeConfigs,
  onEdit,
  onDelete,
}: SortableTaskItemProps) {
  // Get task type config from database or fallback to defaults
  const dbTaskType = task.default_task_type
    ? taskTypeConfigs[task.default_task_type]
    : undefined;
  const defaultTaskType =
    DEFAULT_TASK_TYPE_CONFIG[
      task.default_task_type as keyof typeof DEFAULT_TASK_TYPE_CONFIG
    ] || DEFAULT_TASK_TYPE_CONFIG.work;

  const TaskTypeIcon = dbTaskType
    ? DEFAULT_TASK_TYPE_CONFIG[
        dbTaskType.name.toLowerCase() as keyof typeof DEFAULT_TASK_TYPE_CONFIG
      ]?.icon || Hammer
    : defaultTaskType.icon;

  const taskTypeColor = dbTaskType?.color || defaultTaskType.color;
  const taskTypeLabel = dbTaskType?.name || defaultTaskType.label;

  const priorityConfig =
    PRIORITY_CONFIG[task.default_priority as keyof typeof PRIORITY_CONFIG] ||
    PRIORITY_CONFIG.medium;

  // Build badges for the card
  const badges: TemplateBadge[] = [
    {
      label: taskTypeLabel,
      icon: TaskTypeIcon,
      className: taskTypeColor,
    },
    {
      label: priorityConfig.label,
      className: `border-2 ${priorityConfig.color}`,
    },
  ];

  return (
    <TemplateCard
      id={task.id}
      title={task.title}
      description={task.description || undefined}
      orderIndex={task.order_index !== null && task.order_index !== undefined ? task.order_index : undefined}
      badges={badges}
      onEdit={onEdit}
      onDelete={onDelete}
    />
  );
});

/**
 * Props for TaskTemplateManager
 * Performance: Receives all shared data via props to eliminate redundant network calls
 */
interface TaskTemplateManagerProps {
  projectTypes: ProjectTypeWithCount[];
  selectedProjectTypeId: string;
  onProjectTypeChange: (id: string) => void;
  phaseTemplates: PhaseTemplateWithTasks[];
  selectedPhaseTemplateId: string;
  onPhaseTemplateChange: (id: string) => void;
  taskTypes: TaskTypeConfigsRow[];
  isLoadingProjectTypes: boolean;
  isLoadingPhases: boolean;
  onRefreshPhases: () => void;
}

/**
 * TaskTemplateManager - Main component for task template management
 * CRUD interface for task template management with drag-and-drop, filtering, and modals
 * Performance:
 * - Wrapped in memo to prevent unnecessary re-renders
 * - Receives shared data via props from parent to eliminate redundant network calls
 */
export const TaskTemplateManager = memo(function TaskTemplateManager({
  projectTypes,
  selectedProjectTypeId,
  onProjectTypeChange,
  phaseTemplates,
  selectedPhaseTemplateId,
  onPhaseTemplateChange,
  taskTypes,
  isLoadingProjectTypes,
  isLoadingPhases,
  onRefreshPhases,
}: TaskTemplateManagerProps) {
  const [taskTemplates, setTaskTemplates] = useState<TaskTemplate[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskTemplate | null>(null);
  const [deletingTask, setDeletingTask] = useState<TaskTemplate | null>(null);

  // Configure drag-and-drop sensors for both pointer and keyboard interaction
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Filter to only active project types
  const activeProjectTypes = projectTypes.filter((pt) => pt.is_active);

  // Convert taskTypes array to lookup map using useMemo for performance
  // Following rerender-dependencies: only recompute when taskTypes changes
  const taskTypeConfigs = useMemo(() => {
    return taskTypes.reduce(
      (acc, type) => {
        acc[type.name.toLowerCase()] = type;
        return acc;
      },
      {} as Record<string, TaskTypeConfig>,
    );
  }, [taskTypes]);

  const loadTaskTemplates = useCallback(async (phaseTemplateId: string) => {
    setIsLoadingTasks(true);
    const result = await getTaskTemplates(phaseTemplateId);
    if (result.taskTemplates) {
      setTaskTemplates(result.taskTemplates);
    } else if (result.error) {
      console.error("[TaskTemplateManager] Error loading tasks:", result.error);
      toast.error(result.error);
    }
    setIsLoadingTasks(false);
  }, []);

  // Load task templates when phase selection changes
  useEffect(() => {
    if (selectedPhaseTemplateId) {
      loadTaskTemplates(selectedPhaseTemplateId);
    } else {
      setTaskTemplates([]);
    }
  }, [selectedPhaseTemplateId, loadTaskTemplates]);

  // Handle drag-and-drop reordering with optimistic update
  // Vercel React Best Practice: rerender-functional-setstate
  // Using functional setState to avoid including taskTemplates in dependencies,
  // which keeps this callback stable and prevents unnecessary re-renders.
  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id || !selectedPhaseTemplateId) return;

    let orderedIds: string[] = [];

    // Optimistic update using functional setState
    setTaskTemplates(current => {
      const oldIndex = current.findIndex((t) => t.id === active.id);
      const newIndex = current.findIndex((t) => t.id === over.id);

      if (oldIndex === -1 || newIndex === -1) return current;

      const newOrder = arrayMove(current, oldIndex, newIndex);
      orderedIds = newOrder.map((t) => t.id);
      return newOrder;
    });

    // Persist to backend (async, outside setState)
    const result = await reorderTaskTemplates(
      selectedPhaseTemplateId,
      orderedIds,
    );

    if (result.error) {
      toast.error("Failed to reorder tasks");
      // Revert on error by reloading from server
      loadTaskTemplates(selectedPhaseTemplateId);
    } else {
      toast.success("Task order updated");
    }
  }, [selectedPhaseTemplateId, loadTaskTemplates]);

  // Handle task template creation - form submission
  const handleCreate = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const result = await createTaskTemplate(formData);

    if (result.success) {
      toast.success("Task template created successfully");
      setShowCreateModal(false);
      if (selectedPhaseTemplateId) {
        loadTaskTemplates(selectedPhaseTemplateId);
      }
    } else {
      toast.error(result.error || "Failed to create task template");
    }
  }, [selectedPhaseTemplateId, loadTaskTemplates]);

  // Handle task template update - form submission
  const handleUpdate = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingTask) return;

    const formData = new FormData(e.currentTarget);
    const result = await updateTaskTemplate(editingTask.id, formData);

    if (result.success) {
      toast.success("Task template updated successfully");
      setEditingTask(null);
      if (selectedPhaseTemplateId) {
        loadTaskTemplates(selectedPhaseTemplateId);
      }
    } else {
      toast.error(result.error || "Failed to update task template");
    }
  }, [editingTask, selectedPhaseTemplateId, loadTaskTemplates]);

  // Handle task template deletion
  const handleDelete = useCallback(async () => {
    if (!deletingTask) return;

    const result = await deleteTaskTemplate(deletingTask.id);

    if (result.success) {
      toast.success("Task template deleted successfully");
      setDeletingTask(null);
      if (selectedPhaseTemplateId) {
        loadTaskTemplates(selectedPhaseTemplateId);
      }
    } else {
      toast.error(result.error || "Failed to delete task template");
    }
  }, [deletingTask, selectedPhaseTemplateId, loadTaskTemplates]);

  // Get available task type options from DB configs
  const taskTypeOptions = Object.entries(taskTypeConfigs).map(
    ([key, config]) => ({
      value: key,
      label: config.name,
      icon:
        DEFAULT_TASK_TYPE_CONFIG[key as keyof typeof DEFAULT_TASK_TYPE_CONFIG]
          ?.icon || Hammer,
      color: config.color,
    }),
  );

  return (
    <div className="space-y-6">
      {/* Header with project type and phase filters, create button */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-xl md:text-2xl font-black text-construction-blue uppercase tracking-tight">
              Task Templates
            </h3>
            <p className="text-sm md:text-base text-gray-600 mt-1">
              Define default tasks for each project phase
            </p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            disabled={!selectedPhaseTemplateId}
            className="bg-construction-blue hover:bg-blue-700 text-white font-bold shadow-construction shrink-0 min-h-[44px]"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Task Template
          </Button>
        </div>

        {/* Filter dropdowns */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Project type filter */}
          <div className="flex-1">
            <Label
              htmlFor="project-type-filter"
              className="text-xs font-bold text-gray-700 mb-1.5 block uppercase tracking-wider"
            >
              Project Type
            </Label>
            <Select
              value={selectedProjectTypeId}
              onValueChange={onProjectTypeChange}
            >
              <SelectTrigger
                id="project-type-filter"
                className="border-2 border-gray-200 focus:border-construction-blue font-semibold"
              >
                <SelectValue placeholder="Select project type" />
              </SelectTrigger>
              <SelectContent>
                {activeProjectTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Phase filter */}
          <div className="flex-1">
            <Label
              htmlFor="phase-filter"
              className="text-xs font-bold text-gray-700 mb-1.5 block uppercase tracking-wider"
            >
              Phase Template
            </Label>
            <Select
              value={selectedPhaseTemplateId}
              onValueChange={onPhaseTemplateChange}
              disabled={!selectedProjectTypeId || phaseTemplates.length === 0}
            >
              <SelectTrigger
                id="phase-filter"
                className="border-2 border-gray-200 focus:border-construction-blue font-semibold"
              >
                <SelectValue placeholder="Select phase" />
              </SelectTrigger>
              <SelectContent>
                {phaseTemplates.map((phase) => (
                  <SelectItem key={phase.id} value={phase.id}>
                    {phase.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Task templates sortable list */}
      {!selectedProjectTypeId ? (
        <NoProjectTypeSelectedTask />
      ) : !selectedPhaseTemplateId ? (
        <NoPhaseSelected phasesAvailable={phaseTemplates.length > 0} />
      ) : isLoadingTasks ? (
        // Loading skeleton animation
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bg-white border-2 border-gray-200 rounded-lg p-3 animate-pulse animate-in fade-in slide-in-from-bottom-4"
              style={{
                animationDelay: `${i * 50}ms`,
                animationDuration: '400ms',
                animationFillMode: 'both',
              }}
            >
              <div className="flex items-center gap-3">
                <div className="h-5 w-5 bg-gray-200 rounded" />
                <div className="h-8 w-8 bg-gray-200 rounded" />
                <div className="h-8 w-20 bg-gray-200 rounded-md" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-48 bg-gray-200 rounded" />
                  <div className="h-3 w-full bg-gray-200 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : taskTemplates.length === 0 ? (
        <EmptyTaskState onCreate={() => setShowCreateModal(true)} />
      ) : (
        // Sortable task templates list with drag-and-drop reordering
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={taskTemplates.map((t) => t.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {taskTemplates.map((task, index) => (
                <div
                  key={task.id}
                  className="animate-in fade-in slide-in-from-bottom-4"
                  style={{
                    animationDelay: `${Math.min(index * 50, 300)}ms`,
                    animationDuration: '400ms',
                    animationFillMode: 'both',
                  }}
                >
                  <SortableTaskItem
                    task={task}
                    taskTypeConfigs={taskTypeConfigs}
                    onEdit={() => setEditingTask(task)}
                    onDelete={() => setDeletingTask(task)}
                  />
                </div>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Create Task Template Modal */}
      <ResponsiveModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        icon={ListChecks}
        title="Create Task Template"
        maxWidth="lg"
        formKey="create-task-template-form"
        showNavigation={true}
        onBack={() => setShowCreateModal(false)}
        backLabel="Cancel"
        onContinue={() => {
          const form = document.getElementById("create-task-template-form") as HTMLFormElement;
          form?.requestSubmit();
        }}
        continueLabel="Create Task Template"
      >
        <form
          id="create-task-template-form"
          onSubmit={handleCreate}
          className="space-y-5"
        >
          {/* Hidden phase template field */}
          <input
            type="hidden"
            name="phase_template_id"
            value={selectedPhaseTemplateId}
          />

          {/* Title */}
          <div className="space-y-2">
            <Label
              htmlFor="create-title"
              className="text-sm font-bold text-gray-900"
            >
              Task Title *
            </Label>
            <Input
              id="create-title"
              name="title"
              placeholder="e.g., Pour Foundation, Install Electrical, Final Inspection"
              required
              maxLength={500}
              className="border-2 border-gray-200 focus:border-construction-blue"
            />
            <p className="text-xs text-gray-500">
              Give this task a clear, action-oriented name
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label
              htmlFor="create-description"
              className="text-sm font-bold text-gray-900"
            >
              Description
            </Label>
            <Textarea
              id="create-description"
              name="description"
              placeholder="Brief description of what this task involves"
              rows={3}
              maxLength={2000}
              className="border-2 border-gray-200 focus:border-construction-blue resize-none"
            />
            <p className="text-xs text-gray-500">
              Help your team understand the scope and requirements
            </p>
          </div>

          {/* Task Type and Priority row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Task Type */}
            <div className="space-y-2">
              <Label
                htmlFor="create-task-type"
                className="text-sm font-bold text-gray-900"
              >
                Task Type *
              </Label>
              <Select name="default_task_type" defaultValue="work">
                <SelectTrigger
                  id="create-task-type"
                  className="border-2 border-gray-200 focus:border-construction-blue"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {taskTypeOptions.map((option) => {
                    const Icon = option.icon;
                    return (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          <span>{option.label}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <Label
                htmlFor="create-priority"
                className="text-sm font-bold text-gray-900"
              >
                Default Priority *
              </Label>
              <Select name="default_priority" defaultValue="medium">
                <SelectTrigger
                  id="create-priority"
                  className="border-2 border-gray-200 focus:border-construction-blue"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-gray-400" />
                      Low
                    </span>
                  </SelectItem>
                  <SelectItem value="medium">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-amber-400" />
                      Medium
                    </span>
                  </SelectItem>
                  <SelectItem value="high">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-red-400" />
                      High
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Days Offset */}
          <div className="space-y-2">
            <Label
              htmlFor="create-days-offset"
              className="text-sm font-bold text-gray-900"
            >
              Days After Project Start (Optional)
            </Label>
            <Input
              id="create-days-offset"
              name="days_offset"
              type="number"
              min="0"
              max="365"
              defaultValue="30"
              placeholder="e.g., 0, 7, 30"
              className="border-2 border-gray-200 focus:border-construction-blue"
            />
            <p className="text-xs text-gray-500">
              Auto-schedule this task X days after project start. Leave empty
              for manual scheduling.
            </p>
          </div>
        </form>
      </ResponsiveModal>

      {/* Edit Task Template Modal */}
      {editingTask ? (
        <ResponsiveModal
          isOpen={!!editingTask}
          onClose={() => setEditingTask(null)}
          icon={Edit}
          title="Edit Task Template"
          maxWidth="lg"
          formKey="edit-task-template-form"
          showNavigation={true}
          onBack={() => setEditingTask(null)}
          backLabel="Cancel"
          onContinue={() => {
            const form = document.getElementById("edit-task-template-form") as HTMLFormElement;
            form?.requestSubmit();
          }}
          continueLabel="Save Changes"
        >
          <form
            id="edit-task-template-form"
            onSubmit={handleUpdate}
            className="space-y-5"
          >
            {/* Title */}
            <div className="space-y-2">
              <Label
                htmlFor="edit-title"
                className="text-sm font-bold text-gray-900"
              >
                Task Title *
              </Label>
              <Input
                id="edit-title"
                name="title"
                defaultValue={editingTask.title}
                required
                maxLength={500}
                className="border-2 border-gray-200 focus:border-construction-blue"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label
                htmlFor="edit-description"
                className="text-sm font-bold text-gray-900"
              >
                Description
              </Label>
              <Textarea
                id="edit-description"
                name="description"
                defaultValue={editingTask.description || ""}
                rows={3}
                maxLength={2000}
                className="border-2 border-gray-200 focus:border-construction-blue resize-none"
              />
            </div>

            {/* Task Type and Priority row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Task Type */}
              <div className="space-y-2">
                <Label
                  htmlFor="edit-task-type"
                  className="text-sm font-bold text-gray-900"
                >
                  Task Type *
                </Label>
                <Select
                  name="default_task_type"
                  defaultValue={editingTask.default_task_type ?? undefined}
                >
                  <SelectTrigger
                    id="edit-task-type"
                    className="border-2 border-gray-200 focus:border-construction-blue"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {taskTypeOptions.map((option) => {
                      const Icon = option.icon;
                      return (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            <span>{option.label}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* Priority */}
              <div className="space-y-2">
                <Label
                  htmlFor="edit-priority"
                  className="text-sm font-bold text-gray-900"
                >
                  Default Priority *
                </Label>
                <Select
                  name="default_priority"
                  defaultValue={editingTask.default_priority ?? undefined}
                >
                  <SelectTrigger
                    id="edit-priority"
                    className="border-2 border-gray-200 focus:border-construction-blue"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">
                      <span className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-gray-400" />
                        Low
                      </span>
                    </SelectItem>
                    <SelectItem value="medium">
                      <span className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-amber-400" />
                        Medium
                      </span>
                    </SelectItem>
                    <SelectItem value="high">
                      <span className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-red-400" />
                        High
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Days Offset */}
            <div className="space-y-2">
              <Label
                htmlFor="edit-days-offset"
                className="text-sm font-bold text-gray-900"
              >
                Days After Project Start (Optional)
              </Label>
              <Input
                id="edit-days-offset"
                name="days_offset"
                type="number"
                min="0"
                max="365"
                defaultValue={editingTask.days_offset ?? ""}
                placeholder="e.g., 0, 7, 30"
                className="border-2 border-gray-200 focus:border-construction-blue"
              />
              <p className="text-xs text-gray-500">
                Auto-schedule this task X days after project start. Leave empty
                for manual scheduling.
              </p>
            </div>

            {/* Active toggle */}
            <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
              <input
                type="checkbox"
                id="edit-is-active"
                name="is_active"
                value="true"
                defaultChecked={editingTask.is_active ?? true}
                className="h-5 w-5 rounded border-2 border-gray-300 text-construction-blue focus:ring-construction-blue focus:ring-2"
              />
              <Label
                htmlFor="edit-is-active"
                className="cursor-pointer font-bold text-gray-900 flex-1"
              >
                Active (visible when creating tasks)
              </Label>
            </div>
          </form>
        </ResponsiveModal>
      ) : null}

      {/* Delete Confirmation */}
      {deletingTask ? (
        <AlertDialog
          open={!!deletingTask}
          onOpenChange={() => setDeletingTask(null)}
        >
          <AlertDialogContent className="border-2 border-red-200">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-xl font-black text-red-600 uppercase tracking-tight flex items-center gap-2">
                <AlertCircle className="h-6 w-6" />
                Delete Task Template
              </AlertDialogTitle>
              <AlertDialogDescription className="text-base text-gray-700">
                Are you sure you want to delete{" "}
                <span className="font-bold text-gray-900">
                  "{deletingTask.title}"
                </span>
                ?
              </AlertDialogDescription>
              <div className="mt-3 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-blue-900 mb-1">
                      Template Only
                    </h4>
                    <div className="text-sm text-blue-800">
                      This will delete the task template. Existing tasks in
                      projects will not be affected.
                    </div>
                  </div>
                </div>
              </div>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-2 font-semibold">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700 text-white font-bold"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Task Template
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ) : null}
    </div>
  );
});
