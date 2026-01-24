"use client";

import React, { useState, useCallback, memo } from "react";
import { m as motion, AnimatePresence } from "framer-motion";
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
// Direct Lucide imports - avoid barrel file (200-800ms import cost)
import Plus from "lucide-react/icons/plus";
import Trash2 from "lucide-react/icons/trash-2";
import Layers from "lucide-react/icons/layers";
import AlertCircle from "lucide-react/icons/alert-circle";
import CheckCircle2 from "lucide-react/icons/check-circle-2";
import Pencil from "lucide-react/icons/pencil";
import Package from "lucide-react/icons/package";
import Hammer from "lucide-react/icons/hammer";
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
  createPhaseTemplate,
  updatePhaseTemplate,
  deletePhaseTemplate,
  reorderPhaseTemplates,
  type PhaseTemplateWithTasks,
} from "@/app/actions/phase-templates";
import {
  type ProjectTypeWithCount,
} from "@/app/actions/project-types";

/**
 * Task type configuration for badge display
 * Task type configuration with display properties (icon, label, color)
 */
const TASK_TYPE_CONFIG = {
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
    icon: ListChecks,
    color: "bg-[#FFB627] text-white",
  },
  admin: {
    label: "Admin",
    icon: Pencil,
    color: "bg-construction-accent text-white",
  },
};

/**
 * Empty state when no project type is selected
 * Hoisted outside component to prevent re-creation on every render
 */
const NoProjectTypeSelected = React.memo(() => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="p-6 bg-gradient-to-br from-construction-blue/5 to-construction-blue/10 dark:from-construction-blue/10 dark:to-construction-blue/20 rounded-full border-2 border-construction-blue/20 dark:border-construction-blue/40 mb-4">
      <Layers className="h-16 w-16 text-construction-blue dark:text-blue-400" />
    </div>
    <h3 className="text-xl font-black text-gray-900 dark:text-gray-100 mb-2 uppercase tracking-tight">
      Select a Project Type
    </h3>
    <p className="text-gray-500 dark:text-gray-400 max-w-md">
      Choose a project type from the dropdown above to view and manage its
      phase templates
    </p>
  </div>
));
NoProjectTypeSelected.displayName = 'NoProjectTypeSelected';

/**
 * Empty state when no phase templates exist
 * Hoisted outside component to prevent re-creation on every render
 */
interface EmptyPhaseStateProps {
  onCreate: () => void;
}

const EmptyPhaseState = React.memo(function EmptyPhaseState({ onCreate }: EmptyPhaseStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center animate-in fade-in zoom-in-95 duration-500">
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-construction-blue/10 rounded-full blur-2xl" />
        <div className="relative p-6 bg-gradient-to-br from-construction-blue/5 to-construction-blue/10 dark:from-construction-blue/10 dark:to-construction-blue/20 rounded-full border-2 border-construction-blue/20 dark:border-construction-blue/40">
          <Layers className="h-16 w-16 text-construction-blue dark:text-blue-400" />
        </div>
      </div>
      <h3 className="text-xl font-black text-gray-900 dark:text-gray-100 mb-2 uppercase tracking-tight">
        No Phase Templates Defined
      </h3>
      <p className="text-gray-500 dark:text-gray-400 max-w-md mb-6">
        Create your first phase template to organize tasks across project
        stages
      </p>
      <Button
        onClick={onCreate}
        className="bg-construction-blue hover:bg-blue-700 text-white font-bold"
      >
        <Plus className="h-4 w-4 mr-2" />
        Create First Phase
      </Button>
    </div>
  );
});

/**
 * SortablePhaseItem - Individual draggable phase card using TemplateCard
 * Expandable card with nested task templates and add task button
 * Performance: Uses reusable TemplateCard component
 */
interface SortablePhaseItemProps {
  phase: PhaseTemplateWithTasks;
  onEdit: () => void;
  onDelete: () => void;
  onAddTaskToPhase?: (phaseTemplateId: string) => void;
}

const SortablePhaseItem = React.memo(function SortablePhaseItem({
  phase,
  onEdit,
  onDelete,
  onAddTaskToPhase,
}: SortablePhaseItemProps) {
  const taskCount = phase.task_templates?.length || 0;

  // Build badges for the card
  const badges: TemplateBadge[] = taskCount > 0
    ? [{
        label: `${taskCount} ${taskCount === 1 ? "task" : "tasks"}`,
        className: "bg-construction-blue/10 text-construction-blue border-construction-blue/20"
      }]
    : [];

  return (
    <TemplateCard
      id={phase.id}
      title={phase.name}
      description={phase.description || undefined}
      icon={Layers}
      badges={badges}
      expandable
      onEdit={onEdit}
      onDelete={onDelete}
    >
      {taskCount === 0 ? (
        // Empty state when no task templates exist for this phase
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg mb-3">
            <Package className="h-8 w-8 text-gray-400 dark:text-gray-500" />
          </div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
            No task templates yet
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            Add task templates to this phase to get started
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onAddTaskToPhase?.(phase.id)}
            className="border-2 border-construction-blue text-construction-blue hover:bg-construction-blue hover:text-white font-semibold"
          >
            <Plus className="h-3 w-3 mr-1.5" />
            Add Task Template
          </Button>
        </div>
      ) : (
        // Task templates list with add button
        <div className="space-y-2">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Task Templates
            </p>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onAddTaskToPhase?.(phase.id)}
              className="h-7 text-xs hover:bg-construction-blue/10 hover:text-construction-blue font-semibold"
            >
              <Plus className="h-3 w-3 mr-1" />
              Add Task
            </Button>
          </div>
          {phase.task_templates?.map((task, index) => {
            const typeConfig =
              TASK_TYPE_CONFIG[
                task.default_task_type as keyof typeof TASK_TYPE_CONFIG
              ] || TASK_TYPE_CONFIG.work;
            const TypeIcon = typeConfig.icon;

            return (
              <div
                key={task.id}
                className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-950 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-construction-blue/30 transition-colors animate-in fade-in slide-in-from-left-2"
                style={{
                  animationDelay: `${index * 50}ms`,
                  animationDuration: "300ms",
                  animationFillMode: "both",
                }}
              >
                {/* Task type badge */}
                <div
                  className={cn(
                    "inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-bold shrink-0",
                    typeConfig.color,
                  )}
                >
                  <TypeIcon className="h-3 w-3" />
                  <span>{typeConfig.label}</span>
                </div>

                {/* Task info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm truncate">
                    {task.title}
                  </p>
                  {task.description ? (
                    <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1">
                      {task.description}
                    </p>
                  ) : null}
                </div>

                {/* Priority badge */}
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs font-bold shrink-0",
                    task.default_priority === "high" &&
                      "border-red-300 dark:border-red-700 text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950",
                    task.default_priority === "medium" &&
                      "border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950",
                    task.default_priority === "low" &&
                      "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-400 bg-gray-50 dark:bg-gray-950",
                  )}
                >
                  {task.default_priority}
                </Badge>
              </div>
            );
          })}
        </div>
      )}
    </TemplateCard>
  );
});

/**
 * Props for PhaseTemplateManager
 */
interface PhaseTemplateManagerProps {
  projectTypes: ProjectTypeWithCount[];
  selectedProjectTypeId: string;
  onProjectTypeChange: (id: string) => void;
  phaseTemplates: PhaseTemplateWithTasks[];
  isLoadingProjectTypes: boolean;
  isLoadingPhases: boolean;
  onRefreshPhases: () => void;
  onAddTaskToPhase?: (phaseTemplateId: string) => void;
}

/**
 * PhaseTemplateManager - Main component for phase template management
 * Construction-themed CRUD interface with drag-and-drop
 * Performance: Receives data via props from parent to eliminate redundant network calls
 */
export const PhaseTemplateManager = memo(function PhaseTemplateManager({
  projectTypes,
  selectedProjectTypeId,
  onProjectTypeChange,
  phaseTemplates,
  isLoadingProjectTypes,
  isLoadingPhases,
  onRefreshPhases,
  onAddTaskToPhase,
}: PhaseTemplateManagerProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPhase, setEditingPhase] =
    useState<PhaseTemplateWithTasks | null>(null);
  const [deletingPhase, setDeletingPhase] =
    useState<PhaseTemplateWithTasks | null>(null);

  // Configure drag-and-drop sensors for both pointer and keyboard interaction
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Filter to only active project types
  const activeProjectTypes = projectTypes.filter((pt) => pt.is_active);

  // Handle drag-and-drop reordering
  // Note: Using functional setState not applicable here since phaseTemplates is a prop (not local state).
  // This callback is already optimized - it recreates only when its actual dependencies change.
  // Dependency on phaseTemplates is necessary because we need the current list to determine indices.
  // The parent component (ProjectConfigurationSection) manages the state, and we refresh via onRefreshPhases.
  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = phaseTemplates.findIndex((p) => p.id === active.id);
    const newIndex = phaseTemplates.findIndex((p) => p.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    // Persist to backend
    const newOrder = arrayMove(phaseTemplates, oldIndex, newIndex);
    const orderedIds = newOrder.map((p) => p.id);
    const result = await reorderPhaseTemplates(
      selectedProjectTypeId,
      orderedIds,
    );

    if (result.error) {
      toast.error("Failed to reorder phases");
    } else {
      toast.success("Phase order updated");
    }

    // Refresh data from server
    onRefreshPhases();
  }, [phaseTemplates, selectedProjectTypeId, onRefreshPhases]);

  // Handle create submission - memoized
  const handleCreate = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const result = await createPhaseTemplate(formData);

    if (result.success) {
      toast.success("Phase template created successfully");
      setShowCreateModal(false);
      onRefreshPhases();
    } else {
      toast.error(result.error || "Failed to create phase template");
    }
  }, [onRefreshPhases]);

  // Handle phase template update - form submission handler
  const handleUpdate = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingPhase) return;

    const formData = new FormData(e.currentTarget);
    const result = await updatePhaseTemplate(editingPhase.id, formData);

    if (result.success) {
      toast.success("Phase template updated successfully");
      setEditingPhase(null);
      onRefreshPhases();
    } else {
      toast.error(result.error || "Failed to update phase template");
    }
  }, [editingPhase, onRefreshPhases]);

  // Handle phase template deletion with cascade warning
  const handleDelete = useCallback(async () => {
    if (!deletingPhase) return;

    const result = await deletePhaseTemplate(deletingPhase.id);

    if (result.success) {
      toast.success("Phase template deleted successfully");
      setDeletingPhase(null);
      onRefreshPhases();
    } else {
      toast.error(result.error || "Failed to delete phase template");
    }
  }, [deletingPhase, onRefreshPhases]);

  return (
    <div className="space-y-6">
      {/* Header with project type filter dropdown and create button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex-1">
          <h3 className="text-xl md:text-2xl font-black text-construction-blue uppercase tracking-tight">
            Phase Templates
          </h3>
          <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mt-1">
            Define project phases and their associated task templates
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {/* Project type filter dropdown */}
          <Select
            value={selectedProjectTypeId}
            onValueChange={onProjectTypeChange}
          >
            <SelectTrigger className="w-[200px] border-2 border-gray-200 dark:border-gray-700 focus:border-construction-blue font-semibold">
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

          <Button
            onClick={() => setShowCreateModal(true)}
            disabled={!selectedProjectTypeId}
            className="bg-construction-blue hover:bg-blue-700 text-white font-bold shadow-construction"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Phase
          </Button>
        </div>
      </div>

      {/* Phase templates sortable list */}
      {!selectedProjectTypeId ? (
        <NoProjectTypeSelected />
      ) : isLoadingPhases ? (
        // Loading skeleton animation
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-lg p-4 animate-pulse animate-in fade-in slide-in-from-bottom-4"
              style={{
                animationDelay: `${i * 50}ms`,
                animationDuration: "400ms",
                animationFillMode: "both",
              }}
            >
              <div className="flex items-center gap-3">
                <div className="h-5 w-5 bg-gray-200 dark:bg-gray-800 rounded" />
                <div className="h-5 w-5 bg-gray-200 dark:bg-gray-800 rounded" />
                <div className="h-10 w-10 bg-gray-200 dark:bg-gray-800 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="h-5 w-48 bg-gray-200 dark:bg-gray-800 rounded" />
                  <div className="h-4 w-full bg-gray-200 dark:bg-gray-800 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : phaseTemplates.length === 0 ? (
        <EmptyPhaseState onCreate={() => setShowCreateModal(true)} />
      ) : (
        // Sortable phase templates list with drag-and-drop reordering
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={phaseTemplates.map((p) => p.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">
              {phaseTemplates.map((phase, index) => (
                <div
                  key={phase.id}
                  className="animate-in fade-in slide-in-from-bottom-4"
                  style={{
                    animationDelay: `${Math.min(index * 50, 300)}ms`,
                    animationDuration: "400ms",
                    animationFillMode: "both",
                  }}
                >
                  <SortablePhaseItem
                    phase={phase}
                    onEdit={() => setEditingPhase(phase)}
                    onDelete={() => setDeletingPhase(phase)}
                    onAddTaskToPhase={onAddTaskToPhase}
                  />
                </div>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Create Phase Modal */}
      <ResponsiveModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        icon={Layers}
        title="Create Phase Template"
        maxWidth="md"
        formKey="create-phase-form"
        showNavigation={true}
        onBack={() => setShowCreateModal(false)}
        backLabel="Cancel"
        onContinue={() => {
          const form = document.getElementById("create-phase-form") as HTMLFormElement;
          form?.requestSubmit();
        }}
        continueLabel="Create Phase"
      >
        <form
          id="create-phase-form"
          onSubmit={handleCreate}
          className="space-y-5"
        >
          {/* Hidden project type field */}
          <input
            type="hidden"
            name="project_type_config_id"
            value={selectedProjectTypeId}
          />

          {/* Phase name */}
          <div className="space-y-2">
            <Label
              htmlFor="create-name"
              className="text-sm font-bold text-gray-900 dark:text-gray-100"
            >
              Phase Name *
            </Label>
            <Input
              id="create-name"
              name="name"
              placeholder="e.g., Foundation, Framing, Finishing"
              required
              maxLength={100}
              className="border-2 border-gray-200 dark:border-gray-700 focus:border-construction-blue"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Give this phase a clear, descriptive name
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label
              htmlFor="create-description"
              className="text-sm font-bold text-gray-900 dark:text-gray-100"
            >
              Description
            </Label>
            <Textarea
              id="create-description"
              name="description"
              placeholder="Brief description of this project phase"
              rows={3}
              maxLength={500}
              className="border-2 border-gray-200 dark:border-gray-700 focus:border-construction-blue resize-none"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Help your team understand the purpose of this phase
            </p>
          </div>
        </form>
      </ResponsiveModal>

      {/* Edit Phase Modal */}
      {editingPhase ? (
        <ResponsiveModal
          isOpen={!!editingPhase}
          onClose={() => setEditingPhase(null)}
          icon={Pencil}
          title="Edit Phase Template"
          maxWidth="md"
          formKey="edit-phase-form"
          showNavigation={true}
          onBack={() => setEditingPhase(null)}
          backLabel="Cancel"
          onContinue={() => {
            const form = document.getElementById("edit-phase-form") as HTMLFormElement;
            form?.requestSubmit();
          }}
          continueLabel="Save Changes"
        >
          <form
            id="edit-phase-form"
            onSubmit={handleUpdate}
            className="space-y-5"
          >
            {/* Phase name */}
            <div className="space-y-2">
              <Label
                htmlFor="edit-name"
                className="text-sm font-bold text-gray-900 dark:text-gray-100"
              >
                Phase Name *
              </Label>
              <Input
                id="edit-name"
                name="name"
                defaultValue={editingPhase.name}
                required
                maxLength={100}
                className="border-2 border-gray-200 dark:border-gray-700 focus:border-construction-blue"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label
                htmlFor="edit-description"
                className="text-sm font-bold text-gray-900 dark:text-gray-100"
              >
                Description
              </Label>
              <Textarea
                id="edit-description"
                name="description"
                defaultValue={editingPhase.description || ""}
                rows={3}
                maxLength={500}
                className="border-2 border-gray-200 dark:border-gray-700 focus:border-construction-blue resize-none"
              />
            </div>

            {/* Active toggle */}
            <div className="flex items-center space-x-3 p-4 bg-gray-50 dark:bg-gray-950 rounded-lg border-2 border-gray-200 dark:border-gray-700">
              <input
                type="checkbox"
                id="edit-is-active"
                name="is_active"
                value="true"
                defaultChecked={editingPhase.is_active ?? true}
                className="h-5 w-5 rounded border-2 border-gray-300 dark:border-gray-600 text-construction-blue focus:ring-construction-blue focus:ring-2"
              />
              <Label
                htmlFor="edit-is-active"
                className="cursor-pointer font-bold text-gray-900 dark:text-gray-100 flex-1"
              >
                Active (visible when creating projects)
              </Label>
            </div>
          </form>
        </ResponsiveModal>
      ) : null}

      {/* Delete Confirmation */}
      {deletingPhase ? (
        <AlertDialog
          open={!!deletingPhase}
          onOpenChange={() => setDeletingPhase(null)}
        >
          <AlertDialogContent className="border-2 border-red-200 dark:border-red-700">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-xl font-black text-red-600 dark:text-red-400 uppercase tracking-tight flex items-center gap-2">
                <AlertCircle className="h-6 w-6" />
                Delete Phase Template
              </AlertDialogTitle>
              <AlertDialogDescription className="text-base text-gray-700 dark:text-gray-300">
                Are you sure you want to delete{" "}
                <span className="font-bold text-gray-900 dark:text-gray-100">
                  "{deletingPhase.name}"
                </span>
                ?
              </AlertDialogDescription>
              <div className="mt-3 p-4 bg-amber-50 dark:bg-amber-950 border-2 border-amber-200 dark:border-amber-700 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-amber-900 dark:text-amber-100 mb-1">
                      Cascade Warning
                    </h4>
                    <div className="text-sm text-amber-800 dark:text-amber-300">
                      This will delete{" "}
                      <span className="font-bold">
                        {deletingPhase.task_templates?.length || 0} task
                        template
                        {deletingPhase.task_templates?.length === 1
                          ? ""
                          : "s"}
                      </span>{" "}
                      associated with this phase.
                    </div>
                    <div className="text-sm text-amber-800 dark:text-amber-300 mt-2">
                      Existing projects will keep their data and are not
                      affected.
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
                Delete Phase Template
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ) : null}
    </div>
  );
});
