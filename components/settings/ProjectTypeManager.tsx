"use client";

import { useState, useEffect, useCallback, memo } from "react";
// Performance optimization: Direct imports instead of barrel file
import Plus from 'lucide-react/icons/plus';
import Edit from 'lucide-react/icons/edit';
import Trash2 from 'lucide-react/icons/trash-2';
import Building2 from 'lucide-react/icons/building-2';
import Home from 'lucide-react/icons/home';
import Factory from 'lucide-react/icons/factory';
import UtensilsCrossed from 'lucide-react/icons/utensils-crossed';
import Store from 'lucide-react/icons/store';
import Warehouse from 'lucide-react/icons/warehouse';
import Pencil from 'lucide-react/icons/pencil';
import CheckCircle2 from 'lucide-react/icons/check-circle-2';
import Loader2 from 'lucide-react/icons/loader-2';
import XCircle from 'lucide-react/icons/x-circle';
import Coffee from 'lucide-react/icons/coffee';
import HardHat from 'lucide-react/icons/hard-hat';
import Hammer from 'lucide-react/icons/hammer';
import Wrench from 'lucide-react/icons/wrench';
import Zap from 'lucide-react/icons/zap';
import Droplet from 'lucide-react/icons/droplet';
import Drill from 'lucide-react/icons/drill';
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
import { cn } from "@/lib/utils";
import {
  createProjectType,
  updateProjectType,
  deleteProjectType,
  type ProjectTypeWithCount,
} from "@/app/actions/project-types";
import { TypesCard } from "@/components/ui/TypesCard";

/**
 * Icon mapping for project type selection
 * Debug: Available Lucide icons for construction project types
 */
const AVAILABLE_ICONS = {
  Building2: Building2,
  Home: Home,
  Factory: Factory,
  UtensilsCrossed: UtensilsCrossed,
  Coffee: Coffee,
  Store: Store,
  Warehouse: Warehouse,
  HardHat: HardHat,
  Hammer: Hammer,
  Wrench: Wrench,
  Zap: Zap,
  Droplet: Droplet,
  Drill: Drill,
};

/**
 * Props for ProjectTypeManager
 */
interface ProjectTypeManagerProps {
  projectTypes: ProjectTypeWithCount[];
  isLoading: boolean;
  onRefresh: () => void;
}

/**
 * ProjectTypeManager - Manage project type configurations
 * Debug: Main component for CRUD operations on project types with full accessibility
 *
 * Performance optimizations:
 * - Wrapped in memo() to prevent unnecessary re-renders
 * - Direct Lucide imports instead of barrel file
 * - CSS stagger animations instead of per-item framer-motion
 * - All callbacks use useCallback for stable references
 * - Receives data via props from parent to eliminate redundant network calls
 */
export const ProjectTypeManager = memo(function ProjectTypeManager({
  projectTypes,
  isLoading,
  onRefresh,
}: ProjectTypeManagerProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingType, setEditingType] = useState<ProjectTypeWithCount | null>(
    null,
  );
  const [deletingType, setDeletingType] = useState<ProjectTypeWithCount | null>(
    null,
  );

  // Handle create submission
  const handleCreate = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const result = await createProjectType(formData);

    setIsSubmitting(false);

    if (result.success) {
      toast.success("Project type created successfully");
      setShowCreateModal(false);
      onRefresh();
    } else {
      toast.error(result.error || "Failed to create project type");
    }
  }, [onRefresh]);

  // Handle update submission
  const handleUpdate = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingType) return;

    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const result = await updateProjectType(editingType.id, formData);

    setIsSubmitting(false);

    if (result.success) {
      toast.success("Project type updated successfully");
      setEditingType(null);
      onRefresh();
    } else {
      toast.error(result.error || "Failed to update project type");
    }
  }, [editingType, onRefresh]);

  // Handle delete confirmation
  const handleDelete = useCallback(async () => {
    if (!deletingType) return;

    setIsSubmitting(true);

    const result = await deleteProjectType(deletingType.id);

    setIsSubmitting(false);

    if (result.success) {
      toast.success("Project type deleted successfully");
      setDeletingType(null);
      onRefresh();
    } else {
      toast.error(result.error || "Failed to delete project type");
    }
  }, [deletingType, onRefresh]);

  return (
    <div
      className="space-y-4"
      role="region"
      aria-label="Project Type Management"
    >
      {/* Debug: Header with Add button */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Project Types</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400" id="project-types-description">
            Define the types of construction projects your company handles
          </p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-construction-blue hover:bg-blue-700 text-white transition-all duration-300 shadow-construction hover:shadow-construction-lg focus-visible:ring-2 focus-visible:ring-construction-blue focus-visible:ring-offset-2 min-h-[44px] min-w-[44px]"
          aria-label="Add new project type"
        >
          <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
          Add Type
        </Button>
      </div>

      {/* Debug: Project types grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {isLoading ? (
          // Debug: Loading skeleton cards with CSS stagger animation
          Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="relative group animate-in fade-in slide-in-from-bottom-4"
              style={{
                animationDelay: `${Math.min(i * 50, 300)}ms`,
                animationDuration: '400ms',
                animationFillMode: 'both',
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-lg animate-pulse" />
              <div className="relative bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-lg p-5 shadow-construction">
                <div className="flex items-start gap-4 mb-4">
                  <div className="h-12 w-12 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-5 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t-2 border-gray-100 dark:border-gray-800">
                  <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </div>
              </div>
            </div>
          ))
        ) : projectTypes.length === 0 ? (
          // Debug: Empty state matching ProjectsPageClient pattern
          <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-construction-blue/10 rounded-full blur-2xl" />
              <div className="relative p-6 bg-gradient-to-br from-construction-blue/5 to-construction-blue/10 dark:from-construction-blue/10 dark:to-construction-blue/20 rounded-full border-2 border-construction-blue/20 dark:border-construction-blue/40">
                <Building2 className="h-16 w-16 text-construction-blue dark:text-blue-400" />
              </div>
            </div>
            <h3 className="text-xl font-black text-gray-900 dark:text-gray-100 mb-2 uppercase tracking-tight">
              No Project Types Defined
            </h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mb-6">
              Create your first project type to start organizing construction projects
            </p>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="min-h-[44px] min-w-[44px] bg-construction-blue hover:bg-blue-700 active:bg-blue-800 text-white font-bold transition-all duration-150 active:scale-[0.98]"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create First Project Type
            </Button>
          </div>
        ) : (
          // Debug: Project type cards with CSS stagger animation
          projectTypes.map((type, index) => {
            const IconComponent =
              AVAILABLE_ICONS[
                type.icon_name as keyof typeof AVAILABLE_ICONS
              ] || Building2;
            const cardColor = type.color || "var(--construction-blue)";

            // Prepare badges array
            const badges = !type.is_active
              ? [{ label: "Inactive", icon: XCircle, variant: "inactive" as const }]
              : [];

            return (
              <TypesCard
                key={type.id}
                title={type.name}
                description={type.description || undefined}
                icon={IconComponent}
                iconColor={cardColor}
                badges={badges}
                countBadge={{
                  count: type.project_count || 0,
                  label: "project",
                  icon: Building2,
                }}
                onEdit={() => setEditingType(type)}
                onDelete={() => setDeletingType(type)}
                deleteDisabled={(type.project_count || 0) > 0}
                className="animate-in fade-in slide-in-from-bottom-4"
                style={{
                  animationDelay: `${Math.min(index * 50, 300)}ms`,
                  animationDuration: '400ms',
                  animationFillMode: 'both',
                }}
              />
            );
          })
        )}
      </div>

      {/* Debug: Create Modal */}
      <ResponsiveModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        icon={Building2}
        title="Create Project Type"
        maxWidth="md"
        ariaLabel="Create project type dialog"
        leftActions={
          <Button
            variant="outline"
            onClick={() => setShowCreateModal(false)}
            disabled={isSubmitting}
            className="border-2 focus-visible:ring-2 focus-visible:ring-construction-blue focus-visible:ring-offset-2 transition-all duration-300"
          >
            Cancel
          </Button>
        }
        rightActions={
          <Button
            type="submit"
            form="create-project-type-form"
            disabled={isSubmitting}
            className="h-10 px-6 font-semibold text-white bg-construction-blue hover:bg-blue-700 transition-all duration-300 shadow-sm focus-visible:ring-2 focus-visible:ring-construction-blue focus-visible:ring-offset-2"
            aria-busy={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2
                  className="mr-2 h-4 w-4 animate-spin"
                  aria-hidden="true"
                />
                Creating...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
                Create Type
              </>
            )}
          </Button>
        }
      >
        <form
          id="create-project-type-form"
          onSubmit={handleCreate}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="create-name" className="font-bold text-gray-900 dark:text-gray-100">
              Name *
            </Label>
            <Input
              id="create-name"
              name="name"
              placeholder="e.g., Retail Store"
              required
              disabled={isSubmitting}
              className="border-2 border-gray-200 dark:border-gray-700 focus-visible:ring-2 focus-visible:ring-construction-blue transition-all duration-200"
              aria-describedby="create-name-hint"
            />
            <p id="create-name-hint" className="text-xs text-gray-600 dark:text-gray-400">
              A clear, descriptive name for this project type
            </p>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="create-description"
              className="font-bold text-gray-900 dark:text-gray-100"
            >
              Description
            </Label>
            <Textarea
              id="create-description"
              name="description"
              placeholder="Brief description of this project type"
              rows={2}
              disabled={isSubmitting}
              className="border-2 border-gray-200 dark:border-gray-700 resize-none focus-visible:ring-2 focus-visible:ring-construction-blue transition-all duration-200"
              aria-describedby="create-description-hint"
            />
            <p id="create-description-hint" className="text-xs text-gray-600 dark:text-gray-400">
              Optional description to help identify this type
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="create-icon" className="font-bold text-gray-900 dark:text-gray-100">
                Icon
              </Label>
              <Select
                name="icon_name"
                defaultValue="Building2"
                disabled={isSubmitting}
              >
                <SelectTrigger
                  id="create-icon"
                  className="border-2 border-gray-200 dark:border-gray-700 focus-visible:ring-2 focus-visible:ring-construction-blue transition-all duration-200"
                  aria-describedby="create-icon-hint"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(AVAILABLE_ICONS).map((iconName) => {
                    const Icon =
                      AVAILABLE_ICONS[iconName as keyof typeof AVAILABLE_ICONS];
                    return (
                      <SelectItem key={iconName} value={iconName}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" aria-hidden="true" />
                          <span>{iconName}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <p id="create-icon-hint" className="text-xs text-gray-600 dark:text-gray-400">
                Visual identifier for this type
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-color" className="font-bold text-gray-900 dark:text-gray-100">
                Color
              </Label>
              <Input
                id="create-color"
                name="color"
                type="color"
                defaultValue="var(--construction-blue)"
                disabled={isSubmitting}
                className="h-10 border-2 border-gray-200 dark:border-gray-700 cursor-pointer focus-visible:ring-2 focus-visible:ring-construction-blue transition-all duration-200"
                aria-describedby="create-color-hint"
              />
              <p id="create-color-hint" className="text-xs text-gray-600 dark:text-gray-400">
                Theme color for this project type
              </p>
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
          title="Edit Project Type"
          maxWidth="md"
          ariaLabel={`Edit ${editingType.name} project type`}
          leftActions={
            <Button
              variant="outline"
              onClick={() => setEditingType(null)}
              disabled={isSubmitting}
              className="border-2 focus-visible:ring-2 focus-visible:ring-construction-blue focus-visible:ring-offset-2 transition-all duration-300"
            >
              Cancel
            </Button>
          }
          rightActions={
            <Button
              type="submit"
              form="edit-project-type-form"
              disabled={isSubmitting}
              className="h-10 px-6 font-semibold text-white bg-construction-blue hover:bg-blue-700 transition-all duration-300 shadow-sm focus-visible:ring-2 focus-visible:ring-construction-blue focus-visible:ring-offset-2"
              aria-busy={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2
                    className="mr-2 h-4 w-4 animate-spin"
                    aria-hidden="true"
                  />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" aria-hidden="true" />
                  Save Changes
                </>
              )}
            </Button>
          }
        >
          <form
            id="edit-project-type-form"
            onSubmit={handleUpdate}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="edit-name" className="font-bold text-gray-900 dark:text-gray-100">
                Name *
              </Label>
              <Input
                id="edit-name"
                name="name"
                defaultValue={editingType.name}
                required
                disabled={isSubmitting}
                className="border-2 border-gray-200 dark:border-gray-700 focus-visible:ring-2 focus-visible:ring-construction-blue transition-all duration-200"
                aria-describedby="edit-name-hint"
              />
              <p id="edit-name-hint" className="text-xs text-gray-600 dark:text-gray-400">
                A clear, descriptive name for this project type
              </p>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="edit-description"
                className="font-bold text-gray-900 dark:text-gray-100"
              >
                Description
              </Label>
              <Textarea
                id="edit-description"
                name="description"
                defaultValue={editingType.description || ""}
                rows={2}
                disabled={isSubmitting}
                className="border-2 border-gray-200 dark:border-gray-700 resize-none focus-visible:ring-2 focus-visible:ring-construction-blue transition-all duration-200"
                aria-describedby="edit-description-hint"
              />
              <p id="edit-description-hint" className="text-xs text-gray-600 dark:text-gray-400">
                Optional description to help identify this type
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-icon" className="font-bold text-gray-900 dark:text-gray-100">
                  Icon
                </Label>
                <Select
                  name="icon_name"
                  defaultValue={editingType.icon_name || "Building2"}
                  disabled={isSubmitting}
                >
                  <SelectTrigger
                    id="edit-icon"
                    className="border-2 border-gray-200 dark:border-gray-700 focus-visible:ring-2 focus-visible:ring-construction-blue transition-all duration-200"
                    aria-describedby="edit-icon-hint"
                  >
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
                            <Icon className="h-4 w-4" aria-hidden="true" />
                            <span>{iconName}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                <p id="edit-icon-hint" className="text-xs text-gray-600 dark:text-gray-400">
                  Visual identifier for this type
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-color" className="font-bold text-gray-900 dark:text-gray-100">
                  Color
                </Label>
                <Input
                  id="edit-color"
                  name="color"
                  type="color"
                  defaultValue={editingType.color || "var(--construction-blue)"}
                  disabled={isSubmitting}
                  className="h-10 border-2 border-gray-200 dark:border-gray-700 cursor-pointer focus-visible:ring-2 focus-visible:ring-construction-blue transition-all duration-200"
                  aria-describedby="edit-color-hint"
                />
                <p id="edit-color-hint" className="text-xs text-gray-600 dark:text-gray-400">
                  Theme color for this project type
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700">
              <input
                type="checkbox"
                id="edit-is-active"
                name="is_active"
                value="true"
                defaultChecked={editingType.is_active ?? true}
                disabled={isSubmitting}
                className="h-5 w-5 rounded border-2 border-gray-300 dark:border-gray-600 text-construction-blue focus:ring-2 focus:ring-construction-blue focus:ring-offset-2 dark:focus:ring-blue-400 dark:focus:ring-offset-gray-900 transition-all duration-200"
                aria-describedby="edit-is-active-hint"
              />
              <div className="flex-1">
                <Label
                  htmlFor="edit-is-active"
                  className="cursor-pointer font-bold text-gray-900 dark:text-gray-100"
                >
                  Active
                </Label>
                <p
                  id="edit-is-active-hint"
                  className="text-xs text-gray-600 dark:text-gray-400 mt-0.5"
                >
                  Visible when creating new projects
                </p>
              </div>
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
          <AlertDialogContent className="border-2 border-red-200 dark:border-red-800 dark:bg-gray-900">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-red-600 dark:text-red-400 font-black uppercase tracking-tight">
                Delete Project Type
              </AlertDialogTitle>
              {(deletingType.project_count || 0) > 0 ? (
                <>
                  <AlertDialogDescription className="text-gray-700 dark:text-gray-300">
                    Cannot delete this project type!
                  </AlertDialogDescription>
                  <div className="mt-3 space-y-2 text-gray-700 dark:text-gray-300">
                    <div>
                      This project type is assigned to{" "}
                      <span className="font-bold">
                        {deletingType.project_count}
                      </span>{" "}
                      {deletingType.project_count === 1
                        ? "project"
                        : "projects"}
                      .
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      To remove this type, first reassign all projects to a
                      different type, or mark the type as inactive instead.
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <AlertDialogDescription className="text-gray-700 dark:text-gray-300">
                    Are you sure you want to delete{" "}
                    <span className="font-bold text-gray-900 dark:text-gray-100">
                      "{deletingType.name}"
                    </span>
                    ?
                  </AlertDialogDescription>
                  <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                    This will also delete all associated phase and task
                    templates. This action cannot be undone.
                  </div>
                </>
              )}
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel
                className="border-2 focus-visible:ring-2 focus-visible:ring-construction-blue focus-visible:ring-offset-2 transition-all duration-300"
                disabled={isSubmitting}
              >
                Cancel
              </AlertDialogCancel>
              {(deletingType.project_count || 0) === 0 && (
                <AlertDialogAction
                  onClick={handleDelete}
                  disabled={isSubmitting}
                  className="bg-red-600 hover:bg-red-700 text-white focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2 transition-all duration-300"
                  aria-busy={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2
                        className="h-4 w-4 mr-2 animate-spin"
                        aria-hidden="true"
                      />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" aria-hidden="true" />
                      Delete
                    </>
                  )}
                </AlertDialogAction>
              )}
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
});
