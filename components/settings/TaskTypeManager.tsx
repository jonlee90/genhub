"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Edit,
  Trash2,
  Hammer,
  Wrench,
  HardHat,
  Ruler,
  Package,
  Clipboard,
  Pencil,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  XCircle,
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
import { toast } from "sonner";
import {
  getAllTaskTypes,
  createTaskType,
  updateTaskType,
  deleteTaskType,
} from "@/app/actions/task-types";

// Debug: Type definitions - Use database types directly to avoid type mismatches
import type { TaskTypeConfigsRow } from "@/types/db/tables/tasks";

type TaskTypeConfig = TaskTypeConfigsRow;

/**
 * Icon mapping for task type selection
 * Debug: Construction-themed Lucide icons
 */
const AVAILABLE_ICONS = {
  Hammer: Hammer,
  Wrench: Wrench,
  HardHat: HardHat,
  Ruler: Ruler,
  Package: Package,
  Clipboard: Clipboard,
  Pencil: Pencil,
  CheckCircle2: CheckCircle2,
};

/**
 * TaskTypeManager - Grid-based task type configuration manager
 * Debug: Construction-themed card layout with industrial aesthetics
 */
export function TaskTypeManager() {
  // Removed console.log("[TaskTypeManager] Rendering task type manager");

  const [taskTypes, setTaskTypes] = useState<TaskTypeConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingType, setEditingType] = useState<TaskTypeConfig | null>(null);
  const [deletingType, setDeletingType] = useState<TaskTypeConfig | null>(null);

  // Fetch task types on mount
  useEffect(() => {
    loadTaskTypes();
  }, []);

  const loadTaskTypes = useCallback(async () => {
    // Removed console.log("[TaskTypeManager] Loading task types...");
    setIsLoading(true);
    const result = await getAllTaskTypes();
    if (result.taskTypes) {
      setTaskTypes(result.taskTypes);
    } else if (result.error) {
      console.error("[TaskTypeManager] Error loading:", result.error);
      toast.error(result.error);
    }
    setIsLoading(false);
  }, []);

  // Handle create submission
  const handleCreate = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Removed console.log("[TaskTypeManager] Creating task type...");

    const formData = new FormData(e.currentTarget);
    const result = await createTaskType(formData);

    if (result.success) {
      toast.success("Task type created successfully");
      setShowCreateModal(false);
      loadTaskTypes();
    } else {
      toast.error(result.error || "Failed to create task type");
    }
  }, [loadTaskTypes]);

  // Handle update submission
  const handleUpdate = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingType) return;

    // Removed console.log("[TaskTypeManager] Updating task type:", editingType.id);

    const formData = new FormData(e.currentTarget);
    const result = await updateTaskType(editingType.id, formData);

    if (result.success) {
      toast.success("Task type updated successfully");
      setEditingType(null);
      loadTaskTypes();
    } else {
      toast.error(result.error || "Failed to update task type");
    }
  }, [editingType, loadTaskTypes]);

  // Handle delete confirmation
  const handleDelete = useCallback(async () => {
    if (!deletingType) return;

    // Removed console.log("[TaskTypeManager] Deleting task type:", deletingType.id);

    const result = await deleteTaskType(deletingType.id);

    if (result.success) {
      toast.success("Task type deleted successfully");
      setDeletingType(null);
      loadTaskTypes();
    } else {
      toast.error(result.error || "Failed to delete task type");
    }
  }, [deletingType, loadTaskTypes]);

  return (
    <div className="space-y-6">
      {/* Debug: Header with Add button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl md:text-2xl font-black text-construction-blue uppercase tracking-tight">
            Task Types
          </h3>
          <p className="text-sm md:text-base text-gray-600 mt-1">
            Define the types of tasks your team handles on projects
          </p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-construction-blue hover:bg-blue-700 text-white font-bold shadow-construction shrink-0"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Task Type
        </Button>
      </div>

      {/* Debug: Task types grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {isLoading ? (
          // Debug: Loading skeleton cards
          Array.from({ length: 6 }).map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-50 rounded-lg animate-pulse" />
              <div className="relative bg-white border-2 border-gray-200 rounded-lg p-5 shadow-construction">
                <div className="flex items-start gap-4 mb-4">
                  <div className="h-12 w-12 bg-gray-200 rounded-lg animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-5 w-24 bg-gray-200 rounded animate-pulse" />
                    <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 pt-3 border-t-2 border-gray-100">
                  <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
                  <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
            </motion.div>
          ))
        ) : taskTypes.length === 0 ? (
          // Debug: Empty state
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="col-span-full flex flex-col items-center justify-center py-16 text-center"
          >
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-construction-blue/10 rounded-full blur-2xl" />
              <div className="relative p-6 bg-gradient-to-br from-construction-blue/5 to-construction-blue/10 rounded-full border-2 border-construction-blue/20">
                <Hammer className="h-16 w-16 text-construction-blue" />
              </div>
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-2 uppercase tracking-tight">
              No Task Types Defined
            </h3>
            <p className="text-gray-500 max-w-md mb-6">
              Create your first task type to start organizing work across your
              projects
            </p>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-construction-blue hover:bg-blue-700 text-white font-bold"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create First Task Type
            </Button>
          </motion.div>
        ) : (
          // Debug: Task type cards with staggered animation
          taskTypes.map((type, index) => {
            const IconComponent =
              AVAILABLE_ICONS[type.icon_name as keyof typeof AVAILABLE_ICONS] ||
              Hammer;
            const cardColor = type.color || "#3b82f6";

            return (
              <motion.div
                key={type.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08, duration: 0.4 }}
                className="relative group h-full"
              >
                {/* Debug: Gradient background glow */}
                <div
                  className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl"
                  style={{
                    background: `linear-gradient(135deg, ${cardColor}15, ${cardColor}05)`,
                  }}
                />

                {/* Debug: Card container */}
                <div className="relative bg-white border-2 border-gray-200 rounded-lg p-5 shadow-construction hover:shadow-construction-lg hover:border-construction-blue/30 transition-all duration-300 h-full flex flex-col">
                  {/* Debug: Card header with icon and badges */}
                  <div className="flex items-start gap-4 mb-4">
                    {/* Icon */}
                    <div
                      className="p-3 rounded-lg border-2 shrink-0 transition-transform duration-300 group-hover:scale-110"
                      style={{
                        backgroundColor: `${cardColor}15`,
                        borderColor: `${cardColor}30`,
                      }}
                    >
                      <IconComponent
                        className="h-6 w-6"
                        style={{ color: cardColor }}
                      />
                    </div>

                    {/* Name and badges */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className="font-black text-construction-blue uppercase tracking-tight text-base leading-tight">
                          {type.name}
                        </h4>
                        {(type.is_default ?? false) && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-md text-xs font-bold shrink-0">
                            <Sparkles className="h-3 w-3" />
                            Default
                          </span>
                        )}
                        {!(type.is_active ?? true) && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md text-xs font-bold shrink-0">
                            <XCircle className="h-3 w-3" />
                            Inactive
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2 min-h-[2.5rem]">
                        {type.description || "No description provided"}
                      </p>
                    </div>
                  </div>

                  {/* Debug: Card footer with actions */}
                  <div className="flex items-center justify-end gap-2 pt-3 mt-auto border-t-2 border-gray-100">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingType(type)}
                      className="hover:bg-construction-blue/10 hover:text-construction-blue font-semibold transition-colors"
                    >
                      <Edit className="h-4 w-4 mr-1.5" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeletingType(type)}
                      className="hover:bg-red-50 hover:text-red-600 font-semibold transition-colors"
                    >
                      <Trash2 className="h-4 w-4 mr-1.5" />
                      Delete
                    </Button>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Debug: Create Modal */}
      <ResponsiveModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        icon={Hammer}
        title="Create Task Type"
        subtitle="Add a new task type to categorize work across your projects"
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
            form="create-task-type-form"
            className="h-10 px-6 font-bold text-white bg-construction-blue hover:bg-blue-700 shadow-sm"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Task Type
          </Button>
        }
      >
        <form
          id="create-task-type-form"
          onSubmit={handleCreate}
          className="space-y-5"
        >
          {/* Name field */}
          <div className="space-y-2">
            <Label
              htmlFor="create-name"
              className="text-sm font-bold text-gray-900"
            >
              Task Type Name *
            </Label>
            <Input
              id="create-name"
              name="name"
              placeholder="e.g., Material Purchase, Site Inspection"
              required
              maxLength={50}
              className="border-2 border-gray-200 focus:border-construction-blue"
            />
            <p className="text-xs text-gray-500">
              Give this task type a clear, descriptive name
            </p>
          </div>

          {/* Description field */}
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
              placeholder="Brief description of when to use this task type"
              rows={3}
              maxLength={200}
              className="border-2 border-gray-200 focus:border-construction-blue resize-none"
            />
            <p className="text-xs text-gray-500">
              Help your team understand when to use this type
            </p>
          </div>

          {/* Icon and Color selection */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label
                htmlFor="create-icon"
                className="text-sm font-bold text-gray-900"
              >
                Icon
              </Label>
              <Select name="icon_name" defaultValue="Hammer">
                <SelectTrigger className="border-2 border-gray-200 focus:border-construction-blue">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(AVAILABLE_ICONS).map((iconName) => {
                    const Icon =
                      AVAILABLE_ICONS[iconName as keyof typeof AVAILABLE_ICONS];
                    return (
                      <SelectItem key={iconName} value={iconName}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-construction-blue" />
                          <span className="font-medium">{iconName}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="create-color"
                className="text-sm font-bold text-gray-900"
              >
                Color
              </Label>
              <div className="relative">
                <Input
                  id="create-color"
                  name="color"
                  type="color"
                  defaultValue="#001B51"
                  className="h-11 border-2 border-gray-200 focus:border-construction-blue cursor-pointer"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <div className="text-xs font-mono text-gray-500 bg-white px-2 py-1 rounded">
                    HEX
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </ResponsiveModal>

      {/* Debug: Edit Modal */}
      {editingType && (
        <ResponsiveModal
          isOpen={!!editingType}
          onClose={() => setEditingType(null)}
          icon={Pencil}
          title="Edit Task Type"
          subtitle={
            (editingType.is_default ?? false)
              ? "Customize default task type"
              : "Update task type settings"
          }
          maxWidth="md"
          leftActions={
            <Button
              variant="outline"
              onClick={() => setEditingType(null)}
              className="border-2 font-semibold"
            >
              Cancel
            </Button>
          }
          rightActions={
            <Button
              type="submit"
              form="edit-task-type-form"
              className="h-10 px-6 font-bold text-white bg-construction-blue hover:bg-blue-700 shadow-sm"
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          }
        >
          {/* Editable form for all task types */}
          <form
            id="edit-task-type-form"
            onSubmit={handleUpdate}
            className="space-y-5"
          >
            {/* Name field */}
            <div className="space-y-2">
              <Label
                htmlFor="edit-name"
                className="text-sm font-bold text-gray-900"
              >
                Task Type Name *
              </Label>
              <Input
                id="edit-name"
                name="name"
                defaultValue={editingType.name}
                required
                maxLength={50}
                className="border-2 border-gray-200 focus:border-construction-blue"
              />
            </div>

            {/* Description field */}
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
                defaultValue={editingType.description || ""}
                rows={3}
                maxLength={200}
                className="border-2 border-gray-200 focus:border-construction-blue resize-none"
              />
            </div>

            {/* Icon and Color selection */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label
                  htmlFor="edit-icon"
                  className="text-sm font-bold text-gray-900"
                >
                  Icon
                </Label>
                <Select
                  name="icon_name"
                  defaultValue={editingType.icon_name || "Hammer"}
                >
                  <SelectTrigger className="border-2 border-gray-200 focus:border-construction-blue">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(AVAILABLE_ICONS).map((iconName) => {
                      const Icon =
                        AVAILABLE_ICONS[
                          iconName as keyof typeof AVAILABLE_ICONS
                        ];
                      return (
                        <SelectItem key={iconName} value={iconName}>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4 text-construction-blue" />
                            <span className="font-medium">{iconName}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="edit-color"
                  className="text-sm font-bold text-gray-900"
                >
                  Color
                </Label>
                <div className="relative">
                  <Input
                    id="edit-color"
                    name="color"
                    type="color"
                    defaultValue={editingType.color || "#3b82f6"}
                    className="h-11 border-2 border-gray-200 focus:border-construction-blue cursor-pointer"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <div className="text-xs font-mono text-gray-500 bg-white px-2 py-1 rounded">
                      HEX
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Active toggle */}
            <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
              <input
                type="checkbox"
                id="edit-is-active"
                name="is_active"
                value="true"
                defaultChecked={editingType.is_active ?? true}
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
      {deletingType && (
        <AlertDialog
          open={!!deletingType}
          onOpenChange={() => setDeletingType(null)}
        >
          <AlertDialogContent className="border-2 border-red-200">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-xl font-black text-red-600 uppercase tracking-tight flex items-center gap-2">
                <AlertCircle className="h-6 w-6" />
                Delete Task Type
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-3 text-base">
                <p className="text-gray-700">
                  Are you sure you want to delete{" "}
                  <span className="font-bold text-gray-900">
                    "{deletingType.name}"
                  </span>
                  ?
                </p>
                <div className="p-3 bg-amber-50 border-2 border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-800">
                    <strong>Note:</strong> This is a soft delete. Existing tasks
                    will keep this type, but it won't be available for new
                    tasks.
                  </p>
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
                Delete Task Type
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
