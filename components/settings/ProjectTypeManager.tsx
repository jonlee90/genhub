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

/**
 * Icon mapping for project type selection
 * Debug: Available Lucide icons for construction project types
 */
const AVAILABLE_ICONS = {
  Building2: Building2,
  Home: Home,
  Factory: Factory,
  UtensilsCrossed: UtensilsCrossed,
  Store: Store,
  Warehouse: Warehouse,
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
          <h3 className="text-lg font-bold text-gray-900">Project Types</h3>
          <p className="text-sm text-gray-600" id="project-types-description">
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
              <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-50 rounded-lg animate-pulse" />
              <div className="relative bg-white border-2 border-gray-200 rounded-lg p-5 shadow-construction">
                <div className="flex items-start gap-4 mb-4">
                  <div className="h-12 w-12 bg-gray-200 rounded-lg animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-5 w-24 bg-gray-200 rounded animate-pulse" />
                    <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t-2 border-gray-100">
                  <div className="h-6 w-20 bg-gray-200 rounded animate-pulse" />
                  <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
            </div>
          ))
        ) : projectTypes.length === 0 ? (
          // Debug: Empty state matching ProjectsPageClient pattern
          <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-construction-blue/10 rounded-full blur-2xl" />
              <div className="relative p-6 bg-gradient-to-br from-construction-blue/5 to-construction-blue/10 rounded-full border-2 border-construction-blue/20">
                <Building2 className="h-16 w-16 text-construction-blue" />
              </div>
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-2 uppercase tracking-tight">
              No Project Types Defined
            </h3>
            <p className="text-gray-500 max-w-md mb-6">
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
            const cardColor = type.color || "#001B51";

            return (
              <div
                key={type.id}
                className="relative group h-full animate-in fade-in slide-in-from-bottom-4"
                style={{
                  animationDelay: `${Math.min(index * 50, 300)}ms`,
                  animationDuration: '400ms',
                  animationFillMode: 'both',
                }}
              >
                {/* Debug: Gradient background glow */}
                <div
                  className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl"
                  style={{
                    background: `linear-gradient(135deg, ${cardColor}15, ${cardColor}05)`,
                  }}
                />

                {/* Debug: Clickable card container - Opens edit modal on click */}
                <div
                  onClick={() => setEditingType(type)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setEditingType(type);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  className="relative w-full bg-white border-2 border-gray-200 rounded-lg p-5 shadow-construction hover:shadow-construction-lg hover:border-construction-blue/30 transition-all duration-300 h-full flex flex-col text-left cursor-pointer active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-construction-blue focus-visible:ring-offset-2"
                >
                  {/* Debug: Card header with icon and info */}
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

                    {/* Name and status */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className="font-black text-construction-blue uppercase tracking-tight text-base leading-tight">
                          {type.name}
                        </h4>
                        {!type.is_active && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md text-xs font-bold shrink-0">
                            <XCircle className="h-3 w-3" />
                            Inactive
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2 min-h-[2.5rem]">
                        {type.description || "No description provided"}
                      </p>
                      {/* Project count badge */}
                      <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 rounded-md">
                        <Building2 className="h-3.5 w-3.5 text-gray-600" />
                        <span className="text-xs font-bold text-gray-900">
                          {type.project_count || 0} project{type.project_count !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Debug: Card footer with delete action only */}
                  <div className="flex items-center justify-between gap-3 pt-3 mt-auto border-t-2 border-gray-100">
                    <span className="text-xs text-gray-500 font-medium">
                      Click to edit
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent edit modal from opening
                        setDeletingType(type);
                      }}
                      disabled={(type.project_count || 0) > 0}
                      className="min-h-[44px] min-w-[44px] hover:bg-red-50 hover:text-red-600 active:bg-red-100 font-semibold transition-all duration-150 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
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
        subtitle="Add a new project type to your company"
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
            <Label htmlFor="create-name" className="font-bold text-gray-900">
              Name *
            </Label>
            <Input
              id="create-name"
              name="name"
              placeholder="e.g., Retail Store"
              required
              disabled={isSubmitting}
              className="border-2 focus-visible:ring-2 focus-visible:ring-construction-blue transition-all duration-200"
              aria-describedby="create-name-hint"
            />
            <p id="create-name-hint" className="text-xs text-gray-600">
              A clear, descriptive name for this project type
            </p>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="create-description"
              className="font-bold text-gray-900"
            >
              Description
            </Label>
            <Textarea
              id="create-description"
              name="description"
              placeholder="Brief description of this project type"
              rows={2}
              disabled={isSubmitting}
              className="border-2 resize-none focus-visible:ring-2 focus-visible:ring-construction-blue transition-all duration-200"
              aria-describedby="create-description-hint"
            />
            <p id="create-description-hint" className="text-xs text-gray-600">
              Optional description to help identify this type
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="create-icon" className="font-bold text-gray-900">
                Icon
              </Label>
              <Select
                name="icon_name"
                defaultValue="Building2"
                disabled={isSubmitting}
              >
                <SelectTrigger
                  id="create-icon"
                  className="border-2 focus-visible:ring-2 focus-visible:ring-construction-blue transition-all duration-200"
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
              <p id="create-icon-hint" className="text-xs text-gray-600">
                Visual identifier for this type
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-color" className="font-bold text-gray-900">
                Color
              </Label>
              <Input
                id="create-color"
                name="color"
                type="color"
                defaultValue="#001B51"
                disabled={isSubmitting}
                className="h-10 border-2 cursor-pointer focus-visible:ring-2 focus-visible:ring-construction-blue transition-all duration-200"
                aria-describedby="create-color-hint"
              />
              <p id="create-color-hint" className="text-xs text-gray-600">
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
          subtitle="Update project type settings"
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
              <Label htmlFor="edit-name" className="font-bold text-gray-900">
                Name *
              </Label>
              <Input
                id="edit-name"
                name="name"
                defaultValue={editingType.name}
                required
                disabled={isSubmitting}
                className="border-2 focus-visible:ring-2 focus-visible:ring-construction-blue transition-all duration-200"
                aria-describedby="edit-name-hint"
              />
              <p id="edit-name-hint" className="text-xs text-gray-600">
                A clear, descriptive name for this project type
              </p>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="edit-description"
                className="font-bold text-gray-900"
              >
                Description
              </Label>
              <Textarea
                id="edit-description"
                name="description"
                defaultValue={editingType.description || ""}
                rows={2}
                disabled={isSubmitting}
                className="border-2 resize-none focus-visible:ring-2 focus-visible:ring-construction-blue transition-all duration-200"
                aria-describedby="edit-description-hint"
              />
              <p id="edit-description-hint" className="text-xs text-gray-600">
                Optional description to help identify this type
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-icon" className="font-bold text-gray-900">
                  Icon
                </Label>
                <Select
                  name="icon_name"
                  defaultValue={editingType.icon_name || "Building2"}
                  disabled={isSubmitting}
                >
                  <SelectTrigger
                    id="edit-icon"
                    className="border-2 focus-visible:ring-2 focus-visible:ring-construction-blue transition-all duration-200"
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
                <p id="edit-icon-hint" className="text-xs text-gray-600">
                  Visual identifier for this type
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-color" className="font-bold text-gray-900">
                  Color
                </Label>
                <Input
                  id="edit-color"
                  name="color"
                  type="color"
                  defaultValue={editingType.color || "#001B51"}
                  disabled={isSubmitting}
                  className="h-10 border-2 cursor-pointer focus-visible:ring-2 focus-visible:ring-construction-blue transition-all duration-200"
                  aria-describedby="edit-color-hint"
                />
                <p id="edit-color-hint" className="text-xs text-gray-600">
                  Theme color for this project type
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border-2 border-gray-200">
              <input
                type="checkbox"
                id="edit-is-active"
                name="is_active"
                value="true"
                defaultChecked={editingType.is_active ?? true}
                disabled={isSubmitting}
                className="h-5 w-5 rounded border-2 border-gray-300 text-construction-blue focus:ring-2 focus:ring-construction-blue focus:ring-offset-2 transition-all duration-200"
                aria-describedby="edit-is-active-hint"
              />
              <div className="flex-1">
                <Label
                  htmlFor="edit-is-active"
                  className="cursor-pointer font-bold text-gray-900"
                >
                  Active
                </Label>
                <p
                  id="edit-is-active-hint"
                  className="text-xs text-gray-600 mt-0.5"
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
          <AlertDialogContent className="border-2 border-red-200">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-red-600 font-black uppercase tracking-tight">
                Delete Project Type
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-3 text-gray-700">
                {(deletingType.project_count || 0) > 0 ? (
                  <>
                    <p className="font-semibold text-red-600">
                      Cannot delete this project type!
                    </p>
                    <p>
                      This project type is assigned to{" "}
                      <span className="font-bold">
                        {deletingType.project_count}
                      </span>{" "}
                      {deletingType.project_count === 1
                        ? "project"
                        : "projects"}
                      .
                    </p>
                    <p className="text-sm text-gray-600">
                      To remove this type, first reassign all projects to a
                      different type, or mark the type as inactive instead.
                    </p>
                  </>
                ) : (
                  <>
                    <p>
                      Are you sure you want to delete{" "}
                      <span className="font-bold text-gray-900">
                        "{deletingType.name}"
                      </span>
                      ?
                    </p>
                    <p className="text-sm text-gray-600">
                      This will also delete all associated phase and task
                      templates. This action cannot be undone.
                    </p>
                  </>
                )}
              </AlertDialogDescription>
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
