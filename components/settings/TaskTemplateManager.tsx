"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
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
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Plus,
  Edit,
  Trash2,
  GripVertical,
  Package,
  Hammer,
  CheckCircle2,
  Clipboard,
  AlertCircle,
  ListChecks,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ResponsiveModal } from "@/components/ui/ResponsiveModal";
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
  getProjectTypes,
  type ProjectTypeWithCount,
} from "@/app/actions/project-types";
import {
  getPhaseTemplates,
  type PhaseTemplateWithTasks,
} from "@/app/actions/phase-templates";
import { getTaskTypes } from "@/app/actions/task-types";
import type {
  TaskTemplatesRow,
  TaskTypeConfigsRow,
} from "@/types/db/tables/tasks";

// Debug: Type definitions
type TaskTemplate = TaskTemplatesRow;
type TaskTypeConfig = TaskTypeConfigsRow;

/**
 * Task type configuration for badge display
 * Debug: Matches task type configs from DB with construction theme
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
 * Debug: Color-coded priority levels
 */
const PRIORITY_CONFIG = {
  high: { label: "High", color: "border-red-300 text-red-700 bg-red-50" },
  medium: {
    label: "Medium",
    color: "border-amber-300 text-amber-700 bg-amber-50",
  },
  low: { label: "Low", color: "border-gray-300 text-gray-700 bg-gray-50" },
};

/**
 * SortableTaskItem - Individual draggable task template card
 * Debug: Compact horizontal layout with drag handle, badges, and actions
 */
interface SortableTaskItemProps {
  task: TaskTemplate;
  taskTypeConfigs: Record<string, TaskTypeConfig>;
  onEdit: () => void;
  onDelete: () => void;
}

function SortableTaskItem({
  task,
  taskTypeConfigs,
  onEdit,
  onDelete,
}: SortableTaskItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn("relative group", isDragging && "opacity-50 z-50")}
    >
      {/* Debug: Gradient background glow on hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-construction-blue/5 to-transparent rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Debug: Main task card container - RESPONSIVE: Stacked on mobile, horizontal on desktop */}
      <div className="relative bg-white border-2 border-gray-200 rounded-lg shadow-sm hover:shadow-construction hover:border-construction-blue/30 transition-all duration-300">
        {/*
          MOBILE LAYOUT (<640px):
          - Row 1: Drag handle + Task title (truncated)
          - Row 2: Index badge + Type badge + Priority badge
          - Row 3: Edit + Delete buttons (full width, side by side)

          DESKTOP LAYOUT (≥640px):
          - Single row: Drag + Index + Type + Task + Priority + Buttons
        */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 p-3">
          {/* Row 1 on mobile: Drag handle + Task title */}
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            {/* Drag handle - better touch target on mobile */}
            <button
              {...attributes}
              {...listeners}
              className="shrink-0 p-3 sm:p-2 hover:bg-gray-100 rounded-md cursor-grab active:cursor-grabbing transition-colors touch-manipulation"
              aria-label="Drag to reorder"
            >
              <GripVertical className="h-5 w-5 text-gray-400" />
            </button>

            {/* Order index badge - hidden on mobile, shown on desktop */}
            <div className="hidden sm:flex shrink-0 items-center justify-center w-8 h-8 bg-construction-blue/10 text-construction-blue font-black text-sm rounded-md border-2 border-construction-blue/20">
              {task.order_index !== null && task.order_index !== undefined
                ? task.order_index + 1
                : "?"}
            </div>

            {/* Task info - flex-1 to take available space */}
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-gray-900 text-sm truncate">
                {task.title}
              </h4>
              {task.description && (
                <p className="text-xs text-gray-600 line-clamp-1 mt-0.5">
                  {task.description}
                </p>
              )}
            </div>
          </div>

          {/* Row 2 on mobile: Index (mobile only) + Type badge + Priority badge */}
          <div className="flex items-center gap-2 pl-11 sm:pl-0 flex-wrap sm:flex-nowrap">
            {/* Order index badge - shown on mobile, hidden on desktop */}
            <div className="flex sm:hidden shrink-0 items-center justify-center w-7 h-7 bg-construction-blue/10 text-construction-blue font-black text-xs rounded-md border-2 border-construction-blue/20">
              {task.order_index !== null && task.order_index !== undefined
                ? task.order_index + 1
                : "?"}
            </div>

            {/* Task type badge with icon */}
            <div
              className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-bold shrink-0",
                taskTypeColor,
              )}
            >
              <TaskTypeIcon className="h-3.5 w-3.5" />
              <span>{taskTypeLabel}</span>
            </div>

            {/* Priority badge */}
            <Badge
              variant="outline"
              className={cn(
                "text-xs font-bold shrink-0 border-2",
                priorityConfig.color,
              )}
            >
              {priorityConfig.label}
            </Badge>
          </div>

          {/* Row 3 on mobile: Action buttons - better touch targets */}
          <div className="flex items-center gap-2 pl-11 sm:pl-0 sm:ml-auto">
            <Button
              variant="ghost"
              size="sm"
              onClick={onEdit}
              className="h-11 sm:h-8 px-3 sm:px-2 hover:bg-construction-blue/10 hover:text-construction-blue font-semibold transition-colors touch-manipulation flex-1 sm:flex-none"
            >
              <Edit className="h-3.5 w-3.5 mr-1" />
              Edit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="h-11 sm:h-8 px-3 sm:px-2 hover:bg-red-50 hover:text-red-600 font-semibold transition-colors touch-manipulation flex-1 sm:flex-none"
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" />
              Delete
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * TaskTemplateManager - Main component for task template management
 * Debug: Construction-themed CRUD interface with drag-and-drop, filters, and modals
 */
export function TaskTemplateManager() {
  const [projectTypes, setProjectTypes] = useState<ProjectTypeWithCount[]>([]);
  const [selectedProjectTypeId, setSelectedProjectTypeId] =
    useState<string>("");
  const [phaseTemplates, setPhaseTemplates] = useState<
    PhaseTemplateWithTasks[]
  >([]);
  const [selectedPhaseTemplateId, setSelectedPhaseTemplateId] =
    useState<string>("");
  const [taskTemplates, setTaskTemplates] = useState<TaskTemplate[]>([]);
  const [taskTypeConfigs, setTaskTypeConfigs] = useState<
    Record<string, TaskTypeConfig>
  >({});
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskTemplate | null>(null);
  const [deletingTask, setDeletingTask] = useState<TaskTemplate | null>(null);

  // Debug: Drag-and-drop sensors configuration
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Debug: Load initial data on mount
  useEffect(() => {
    loadProjectTypes();
    loadTaskTypeConfigs();
  }, []);

  // Debug: Load phase templates when project type changes
  useEffect(() => {
    if (selectedProjectTypeId) {
      loadPhaseTemplates(selectedProjectTypeId);
    } else {
      setPhaseTemplates([]);
      setSelectedPhaseTemplateId("");
    }
  }, [selectedProjectTypeId]);

  // Debug: Load task templates when phase changes
  useEffect(() => {
    if (selectedPhaseTemplateId) {
      loadTaskTemplates(selectedPhaseTemplateId);
    } else {
      setTaskTemplates([]);
    }
  }, [selectedPhaseTemplateId]);

  async function loadProjectTypes() {
    const result = await getProjectTypes();
    if (result.projectTypes) {
      const activeTypes = result.projectTypes.filter((pt) => pt.is_active);
      setProjectTypes(activeTypes);
      // Auto-select first active project type
      if (activeTypes.length > 0) {
        setSelectedProjectTypeId(activeTypes[0].id);
      }
    } else if (result.error) {
      console.error(
        "[TaskTemplateManager] Error loading project types:",
        result.error,
      );
      toast.error(result.error);
    }
  }

  async function loadPhaseTemplates(projectTypeId: string) {
    const result = await getPhaseTemplates(projectTypeId);
    if (result.phaseTemplates) {
      setPhaseTemplates(result.phaseTemplates);
      // Auto-select first phase
      if (result.phaseTemplates.length > 0) {
        setSelectedPhaseTemplateId(result.phaseTemplates[0].id);
      }
    } else if (result.error) {
      console.error(
        "[TaskTemplateManager] Error loading phases:",
        result.error,
      );
      toast.error(result.error);
    }
  }

  async function loadTaskTemplates(phaseTemplateId: string) {
    setIsLoading(true);
    const result = await getTaskTemplates(phaseTemplateId);
    if (result.taskTemplates) {
      setTaskTemplates(result.taskTemplates);
    } else if (result.error) {
      console.error("[TaskTemplateManager] Error loading tasks:", result.error);
      toast.error(result.error);
    }
    setIsLoading(false);
  }

  async function loadTaskTypeConfigs() {
    const result = await getTaskTypes();
    if (result.taskTypes) {
      const configMap = result.taskTypes.reduce(
        (acc, type) => {
          acc[type.name.toLowerCase()] = type;
          return acc;
        },
        {} as Record<string, TaskTypeConfig>,
      );
      setTaskTypeConfigs(configMap);
    } else if (result.error) {
      console.error(
        "[TaskTemplateManager] Error loading task types:",
        result.error,
      );
    }
  }

  // Debug: Handle drag end event
  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over || active.id === over.id || !selectedPhaseTemplateId) return;

    const oldIndex = taskTemplates.findIndex((t) => t.id === active.id);
    const newIndex = taskTemplates.findIndex((t) => t.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    // Optimistic update
    const newOrder = arrayMove(taskTemplates, oldIndex, newIndex);
    setTaskTemplates(newOrder);

    // Persist to backend
    const orderedIds = newOrder.map((t) => t.id);
    const result = await reorderTaskTemplates(
      selectedPhaseTemplateId,
      orderedIds,
    );

    if (result.error) {
      toast.error("Failed to reorder tasks");
      // Revert on error
      loadTaskTemplates(selectedPhaseTemplateId);
    } else {
      toast.success("Task order updated");
    }
  }

  // Debug: Handle create submission
  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
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
  }

  // Debug: Handle update submission
  async function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
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
  }

  // Debug: Handle delete confirmation
  async function handleDelete() {
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
  }

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
      {/* Debug: Header with filters and Add button */}
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
            className="bg-construction-blue hover:bg-blue-700 text-white font-bold shadow-construction shrink-0"
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
              onValueChange={setSelectedProjectTypeId}
            >
              <SelectTrigger
                id="project-type-filter"
                className="border-2 border-gray-200 focus:border-construction-blue font-semibold"
              >
                <SelectValue placeholder="Select project type" />
              </SelectTrigger>
              <SelectContent>
                {projectTypes.map((type) => (
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
              onValueChange={setSelectedPhaseTemplateId}
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

      {/* Debug: Task templates sortable list */}
      {!selectedProjectTypeId ? (
        // Debug: No project type selected state
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="p-6 bg-gradient-to-br from-construction-blue/5 to-construction-blue/10 rounded-full border-2 border-construction-blue/20 mb-4">
            <ListChecks className="h-16 w-16 text-construction-blue" />
          </div>
          <h3 className="text-xl font-black text-gray-900 mb-2 uppercase tracking-tight">
            Select a Project Type
          </h3>
          <p className="text-gray-500 max-w-md">
            Choose a project type and phase from the filters above to view and
            manage task templates
          </p>
        </div>
      ) : !selectedPhaseTemplateId ? (
        // Debug: No phase selected state
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="p-6 bg-gradient-to-br from-construction-blue/5 to-construction-blue/10 rounded-full border-2 border-construction-blue/20 mb-4">
            <ListChecks className="h-16 w-16 text-construction-blue" />
          </div>
          <h3 className="text-xl font-black text-gray-900 mb-2 uppercase tracking-tight">
            Select a Phase
          </h3>
          <p className="text-gray-500 max-w-md">
            {phaseTemplates.length === 0
              ? "No phase templates found for this project type. Create phase templates first."
              : "Choose a phase template to view its task templates"}
          </p>
        </div>
      ) : isLoading ? (
        // Debug: Loading skeleton
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bg-white border-2 border-gray-200 rounded-lg p-3 animate-pulse"
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
        // Debug: Empty state
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center py-16 text-center"
        >
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-construction-blue/10 rounded-full blur-2xl" />
            <div className="relative p-6 bg-gradient-to-br from-construction-blue/5 to-construction-blue/10 rounded-full border-2 border-construction-blue/20">
              <ListChecks className="h-16 w-16 text-construction-blue" />
            </div>
          </div>
          <h3 className="text-xl font-black text-gray-900 mb-2 uppercase tracking-tight">
            No Task Templates Defined
          </h3>
          <p className="text-gray-500 max-w-md mb-6">
            Create task templates to define default tasks for this project phase
          </p>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-construction-blue hover:bg-blue-700 text-white font-bold"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create First Task Template
          </Button>
        </motion.div>
      ) : (
        // Debug: Sortable task templates list
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
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03, duration: 0.3 }}
                >
                  <SortableTaskItem
                    task={task}
                    taskTypeConfigs={taskTypeConfigs}
                    onEdit={() => setEditingTask(task)}
                    onDelete={() => setDeletingTask(task)}
                  />
                </motion.div>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Debug: Create Task Template Modal */}
      <ResponsiveModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        icon={ListChecks}
        title="Create Task Template"
        subtitle="Add a new task template to this phase"
        maxWidth="lg"
        leftActions={
          <Button
            variant="outline"
            onClick={() => setShowCreateModal(false)}
            className="border-2 font-semibold"
          >
            Cancel
          </Button>
        }
        rightActions={
          <Button
            type="submit"
            form="create-task-template-form"
            className="h-10 px-6 font-bold text-white bg-construction-blue hover:bg-blue-700 shadow-sm"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Task Template
          </Button>
        }
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

      {/* Debug: Edit Task Template Modal */}
      {editingTask && (
        <ResponsiveModal
          isOpen={!!editingTask}
          onClose={() => setEditingTask(null)}
          icon={Edit}
          title="Edit Task Template"
          subtitle="Update task template settings"
          maxWidth="lg"
          leftActions={
            <Button
              variant="outline"
              onClick={() => setEditingTask(null)}
              className="border-2 font-semibold"
            >
              Cancel
            </Button>
          }
          rightActions={
            <Button
              type="submit"
              form="edit-task-template-form"
              className="h-10 px-6 font-bold text-white bg-construction-blue hover:bg-blue-700 shadow-sm"
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          }
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
      )}

      {/* Debug: Delete Confirmation */}
      {deletingTask && (
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
              <AlertDialogDescription className="space-y-3 text-base">
                <p className="text-gray-700">
                  Are you sure you want to delete{" "}
                  <span className="font-bold text-gray-900">
                    "{deletingTask.title}"
                  </span>
                  ?
                </p>
                <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-blue-900 mb-1">
                        Template Only
                      </h4>
                      <p className="text-sm text-blue-800">
                        This will delete the task template. Existing tasks in
                        projects will not be affected.
                      </p>
                    </div>
                  </div>
                </div>
              </AlertDialogDescription>
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
      )}
    </div>
  );
}
