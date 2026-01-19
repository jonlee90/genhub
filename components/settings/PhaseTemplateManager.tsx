"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  ChevronDown,
  ChevronRight,
  Layers,
  AlertCircle,
  CheckCircle2,
  Pencil,
  Package,
  Hammer,
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
  getPhaseTemplates,
  createPhaseTemplate,
  updatePhaseTemplate,
  deletePhaseTemplate,
  reorderPhaseTemplates,
  type PhaseTemplateWithTasks,
} from "@/app/actions/phase-templates";
import {
  getProjectTypes,
  type ProjectTypeWithCount,
} from "@/app/actions/project-types";

/**
 * Task type configuration for badge display
 * Debug: Matches task type configs from DB
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
 * SortablePhaseItem - Individual draggable phase card
 * Debug: Expandable card with nested task templates
 */
interface SortablePhaseItemProps {
  phase: PhaseTemplateWithTasks;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const SortablePhaseItem = React.memo(function SortablePhaseItem({
  phase,
  isExpanded,
  onToggleExpand,
  onEdit,
  onDelete,
}: SortablePhaseItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: phase.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const taskCount = phase.task_templates?.length || 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn("relative group", isDragging && "opacity-50 z-50")}
    >
      {/* Debug: Gradient background glow on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-construction-blue/5 to-construction-blue/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Debug: Main card container */}
      <div className="relative bg-white border-2 border-gray-200 rounded-lg shadow-construction hover:shadow-construction-lg hover:border-construction-blue/30 transition-all duration-300">
        {/* Debug: Phase header with drag handle */}
        <div className="flex items-center gap-3 p-4">
          {/* Drag handle - better touch target on mobile */}
          <button
            {...attributes}
            {...listeners}
            className="shrink-0 p-3 md:p-2 hover:bg-gray-100 rounded-md cursor-grab active:cursor-grabbing transition-colors touch-manipulation"
            aria-label="Drag to reorder phase"
          >
            <GripVertical className="h-5 w-5 text-gray-400" />
          </button>

          {/* Expand/collapse toggle */}
          <button
            onClick={onToggleExpand}
            className="shrink-0 p-2 hover:bg-construction-blue/10 rounded-md transition-colors"
          >
            {isExpanded ? (
              <ChevronDown className="h-5 w-5 text-construction-blue" />
            ) : (
              <ChevronRight className="h-5 w-5 text-construction-blue" />
            )}
          </button>

          {/* Phase icon */}
          <div className="p-2.5 bg-construction-blue/10 rounded-lg border-2 border-construction-blue/20 shrink-0">
            <Layers className="h-5 w-5 text-construction-blue" />
          </div>

          {/* Phase info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-black text-construction-blue uppercase tracking-tight text-base leading-tight truncate">
                {phase.name}
              </h4>
              {taskCount > 0 && (
                <Badge className="bg-construction-blue/10 text-construction-blue border-construction-blue/20 text-xs font-bold shrink-0">
                  {taskCount} {taskCount === 1 ? "task" : "tasks"}
                </Badge>
              )}
            </div>
            {phase.description && (
              <p className="text-sm text-gray-600 line-clamp-1">
                {phase.description}
              </p>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={onEdit}
              className="hover:bg-construction-blue/10 hover:text-construction-blue font-semibold transition-colors"
            >
              <Edit className="h-4 w-4 mr-1.5" />
              Edit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="hover:bg-red-50 hover:text-red-600 font-semibold transition-colors"
            >
              <Trash2 className="h-4 w-4 mr-1.5" />
              Delete
            </Button>
          </div>
        </div>

        {/* Debug: Expandable task templates section */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 pt-2 border-t-2 border-gray-100">
                {taskCount === 0 ? (
                  // Debug: Empty state for no task templates
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="p-3 bg-gray-100 rounded-lg mb-3">
                      <Package className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-sm font-medium text-gray-600 mb-1">
                      No task templates yet
                    </p>
                    <p className="text-xs text-gray-500 mb-3">
                      Add task templates to this phase to get started
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-2 border-construction-blue text-construction-blue hover:bg-construction-blue hover:text-white font-semibold"
                    >
                      <Plus className="h-3 w-3 mr-1.5" />
                      Add Task Template
                    </Button>
                  </div>
                ) : (
                  // Debug: Task templates list
                  <div className="space-y-2">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Task Templates
                      </p>
                      <Button
                        size="sm"
                        variant="ghost"
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
                        <motion.div
                          key={task.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-construction-blue/30 transition-colors"
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
                            <p className="font-semibold text-gray-900 text-sm truncate">
                              {task.title}
                            </p>
                            {task.description && (
                              <p className="text-xs text-gray-600 line-clamp-1">
                                {task.description}
                              </p>
                            )}
                          </div>

                          {/* Priority badge */}
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-xs font-bold shrink-0",
                              task.default_priority === "high" &&
                                "border-red-300 text-red-700 bg-red-50",
                              task.default_priority === "medium" &&
                                "border-amber-300 text-amber-700 bg-amber-50",
                              task.default_priority === "low" &&
                                "border-gray-300 text-gray-700 bg-gray-50",
                            )}
                          >
                            {task.default_priority}
                          </Badge>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
});

/**
 * PhaseTemplateManager - Main component for phase template management
 * Construction-themed CRUD interface with drag-and-drop
 */
export function PhaseTemplateManager() {
  // Removed console.log("[PhaseTemplateManager] Rendering phase template manager");

  const [projectTypes, setProjectTypes] = useState<ProjectTypeWithCount[]>([]);
  const [selectedProjectTypeId, setSelectedProjectTypeId] =
    useState<string>("");
  const [phaseTemplates, setPhaseTemplates] = useState<
    PhaseTemplateWithTasks[]
  >([]);
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPhase, setEditingPhase] =
    useState<PhaseTemplateWithTasks | null>(null);
  const [deletingPhase, setDeletingPhase] =
    useState<PhaseTemplateWithTasks | null>(null);

  // Debug: Drag-and-drop sensors configuration
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Debug: Load project types on mount
  useEffect(() => {
    loadProjectTypes();
  }, []);

  // Debug: Load phase templates when project type changes
  useEffect(() => {
    if (selectedProjectTypeId) {
      loadPhaseTemplates(selectedProjectTypeId);
    } else {
      setPhaseTemplates([]);
    }
  }, [selectedProjectTypeId]);

  async function loadProjectTypes() {
    // Removed console.log("[PhaseTemplateManager] Loading project types...");
    const result = await getProjectTypes();
    if (result.projectTypes) {
      setProjectTypes(result.projectTypes.filter((pt) => pt.is_active));
      // Auto-select first active project type
      const firstActive = result.projectTypes.find((pt) => pt.is_active);
      if (firstActive) {
        setSelectedProjectTypeId(firstActive.id);
      }
    } else if (result.error) {
      console.error(
        "[PhaseTemplateManager] Error loading project types:",
        result.error,
      );
      toast.error(result.error);
    }
  }

  async function loadPhaseTemplates(projectTypeId: string) {
    setIsLoading(true);
    const result = await getPhaseTemplates(projectTypeId);
    if (result.phaseTemplates) {
      setPhaseTemplates(result.phaseTemplates);
    } else if (result.error) {
      console.error(
        "[PhaseTemplateManager] Error loading phases:",
        result.error,
      );
      toast.error(result.error);
    }
    setIsLoading(false);
  }

  // Handle drag end event
  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = phaseTemplates.findIndex((p) => p.id === active.id);
    const newIndex = phaseTemplates.findIndex((p) => p.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    // Optimistic update
    const newOrder = arrayMove(phaseTemplates, oldIndex, newIndex);
    setPhaseTemplates(newOrder);

    // Persist to backend
    const orderedIds = newOrder.map((p) => p.id);
    const result = await reorderPhaseTemplates(
      selectedProjectTypeId,
      orderedIds,
    );

    if (result.error) {
      toast.error("Failed to reorder phases");
      // Revert on error
      loadPhaseTemplates(selectedProjectTypeId);
    } else {
      toast.success("Phase order updated");
    }
  }, [phaseTemplates, selectedProjectTypeId, loadPhaseTemplates]);

  // Toggle phase expansion
  const togglePhaseExpansion = useCallback((phaseId: string) => {
    setExpandedPhases((prev) => {
      const next = new Set(prev);
      if (next.has(phaseId)) {
        next.delete(phaseId);
      } else {
        next.add(phaseId);
      }
      return next;
    });
  }, []);

  // Handle create submission
  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // Removed console.log("[PhaseTemplateManager] Creating phase template...");

    const formData = new FormData(e.currentTarget);
    const result = await createPhaseTemplate(formData);

    if (result.success) {
      toast.success("Phase template created successfully");
      setShowCreateModal(false);
      loadPhaseTemplates(selectedProjectTypeId);
    } else {
      toast.error(result.error || "Failed to create phase template");
    }
  }

  // Debug: Handle update submission
  async function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editingPhase) return;

    const formData = new FormData(e.currentTarget);
    const result = await updatePhaseTemplate(editingPhase.id, formData);

    if (result.success) {
      toast.success("Phase template updated successfully");
      setEditingPhase(null);
      loadPhaseTemplates(selectedProjectTypeId);
    } else {
      toast.error(result.error || "Failed to update phase template");
    }
  }

  // Debug: Handle delete confirmation
  async function handleDelete() {
    if (!deletingPhase) return;

    const result = await deletePhaseTemplate(deletingPhase.id);

    if (result.success) {
      toast.success("Phase template deleted successfully");
      setDeletingPhase(null);
      loadPhaseTemplates(selectedProjectTypeId);
    } else {
      toast.error(result.error || "Failed to delete phase template");
    }
  }

  return (
    <div className="space-y-6">
      {/* Debug: Header with project type filter and Add button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex-1">
          <h3 className="text-xl md:text-2xl font-black text-construction-blue uppercase tracking-tight">
            Phase Templates
          </h3>
          <p className="text-sm md:text-base text-gray-600 mt-1">
            Define project phases and their associated task templates
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {/* Project type filter dropdown */}
          <Select
            value={selectedProjectTypeId}
            onValueChange={setSelectedProjectTypeId}
          >
            <SelectTrigger className="w-[200px] border-2 border-gray-200 focus:border-construction-blue font-semibold">
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

      {/* Debug: Phase templates sortable list */}
      {!selectedProjectTypeId ? (
        // Debug: No project type selected state
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="p-6 bg-gradient-to-br from-construction-blue/5 to-construction-blue/10 rounded-full border-2 border-construction-blue/20 mb-4">
            <Layers className="h-16 w-16 text-construction-blue" />
          </div>
          <h3 className="text-xl font-black text-gray-900 mb-2 uppercase tracking-tight">
            Select a Project Type
          </h3>
          <p className="text-gray-500 max-w-md">
            Choose a project type from the dropdown above to view and manage its
            phase templates
          </p>
        </div>
      ) : isLoading ? (
        // Debug: Loading skeleton
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bg-white border-2 border-gray-200 rounded-lg p-4 animate-pulse"
            >
              <div className="flex items-center gap-3">
                <div className="h-5 w-5 bg-gray-200 rounded" />
                <div className="h-5 w-5 bg-gray-200 rounded" />
                <div className="h-10 w-10 bg-gray-200 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="h-5 w-48 bg-gray-200 rounded" />
                  <div className="h-4 w-full bg-gray-200 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : phaseTemplates.length === 0 ? (
        // Debug: Empty state
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center py-16 text-center"
        >
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-construction-blue/10 rounded-full blur-2xl" />
            <div className="relative p-6 bg-gradient-to-br from-construction-blue/5 to-construction-blue/10 rounded-full border-2 border-construction-blue/20">
              <Layers className="h-16 w-16 text-construction-blue" />
            </div>
          </div>
          <h3 className="text-xl font-black text-gray-900 mb-2 uppercase tracking-tight">
            No Phase Templates Defined
          </h3>
          <p className="text-gray-500 max-w-md mb-6">
            Create your first phase template to organize tasks across project
            stages
          </p>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-construction-blue hover:bg-blue-700 text-white font-bold"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create First Phase
          </Button>
        </motion.div>
      ) : (
        // Debug: Sortable phase templates list
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
                <motion.div
                  key={phase.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                >
                  <SortablePhaseItem
                    phase={phase}
                    isExpanded={expandedPhases.has(phase.id)}
                    onToggleExpand={() => togglePhaseExpansion(phase.id)}
                    onEdit={() => setEditingPhase(phase)}
                    onDelete={() => setDeletingPhase(phase)}
                  />
                </motion.div>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Debug: Create Phase Modal */}
      <ResponsiveModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        icon={Layers}
        title="Create Phase Template"
        subtitle="Add a new phase template to organize project tasks"
        maxWidth="md"
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
            form="create-phase-form"
            className="h-10 px-6 font-bold text-white bg-construction-blue hover:bg-blue-700 shadow-sm"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Phase
          </Button>
        }
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
              className="text-sm font-bold text-gray-900"
            >
              Phase Name *
            </Label>
            <Input
              id="create-name"
              name="name"
              placeholder="e.g., Foundation, Framing, Finishing"
              required
              maxLength={100}
              className="border-2 border-gray-200 focus:border-construction-blue"
            />
            <p className="text-xs text-gray-500">
              Give this phase a clear, descriptive name
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
              placeholder="Brief description of this project phase"
              rows={3}
              maxLength={500}
              className="border-2 border-gray-200 focus:border-construction-blue resize-none"
            />
            <p className="text-xs text-gray-500">
              Help your team understand the purpose of this phase
            </p>
          </div>
        </form>
      </ResponsiveModal>

      {/* Debug: Edit Phase Modal */}
      {editingPhase && (
        <ResponsiveModal
          isOpen={!!editingPhase}
          onClose={() => setEditingPhase(null)}
          icon={Pencil}
          title="Edit Phase Template"
          subtitle="Update phase template settings"
          maxWidth="md"
          leftActions={
            <Button
              variant="outline"
              onClick={() => setEditingPhase(null)}
              className="border-2 font-semibold"
            >
              Cancel
            </Button>
          }
          rightActions={
            <Button
              type="submit"
              form="edit-phase-form"
              className="h-10 px-6 font-bold text-white bg-construction-blue hover:bg-blue-700 shadow-sm"
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          }
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
                className="text-sm font-bold text-gray-900"
              >
                Phase Name *
              </Label>
              <Input
                id="edit-name"
                name="name"
                defaultValue={editingPhase.name}
                required
                maxLength={100}
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
                defaultValue={editingPhase.description || ""}
                rows={3}
                maxLength={500}
                className="border-2 border-gray-200 focus:border-construction-blue resize-none"
              />
            </div>

            {/* Active toggle */}
            <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
              <input
                type="checkbox"
                id="edit-is-active"
                name="is_active"
                value="true"
                defaultChecked={editingPhase.is_active ?? true}
                className="h-5 w-5 rounded border-2 border-gray-300 text-construction-blue focus:ring-construction-blue focus:ring-2"
              />
              <Label
                htmlFor="edit-is-active"
                className="cursor-pointer font-bold text-gray-900 flex-1"
              >
                Active (visible when creating projects)
              </Label>
            </div>
          </form>
        </ResponsiveModal>
      )}

      {/* Debug: Delete Confirmation */}
      {deletingPhase && (
        <AlertDialog
          open={!!deletingPhase}
          onOpenChange={() => setDeletingPhase(null)}
        >
          <AlertDialogContent className="border-2 border-red-200">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-xl font-black text-red-600 uppercase tracking-tight flex items-center gap-2">
                <AlertCircle className="h-6 w-6" />
                Delete Phase Template
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-3 text-base">
                <p className="text-gray-700">
                  Are you sure you want to delete{" "}
                  <span className="font-bold text-gray-900">
                    "{deletingPhase.name}"
                  </span>
                  ?
                </p>
                <div className="p-4 bg-amber-50 border-2 border-amber-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-amber-900 mb-1">
                        Cascade Warning
                      </h4>
                      <p className="text-sm text-amber-800">
                        This will delete{" "}
                        <span className="font-bold">
                          {deletingPhase.task_templates?.length || 0} task
                          template
                          {deletingPhase.task_templates?.length === 1
                            ? ""
                            : "s"}
                        </span>{" "}
                        associated with this phase.
                      </p>
                      <p className="text-sm text-amber-800 mt-2">
                        Existing projects will keep their data and are not
                        affected.
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
                Delete Phase Template
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
