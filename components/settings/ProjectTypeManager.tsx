'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Building2, Home, Factory, UtensilsCrossed, Store, Warehouse, Pencil, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { BaseModal } from '@/components/ui/BaseModal';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  getProjectTypes,
  createProjectType,
  updateProjectType,
  deleteProjectType,
  type ProjectTypeWithCount,
} from '@/app/actions/project-types';

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
 * ProjectTypeManager - Manage project type configurations
 * Debug: Main component for CRUD operations on project types with full accessibility
 */
export function ProjectTypeManager() {
  console.log('[ProjectTypeManager] Rendering project type manager');

  const [projectTypes, setProjectTypes] = useState<ProjectTypeWithCount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingType, setEditingType] = useState<ProjectTypeWithCount | null>(null);
  const [deletingType, setDeletingType] = useState<ProjectTypeWithCount | null>(null);

  // Debug: Fetch project types on mount
  useEffect(() => {
    loadProjectTypes();
  }, []);

  async function loadProjectTypes() {
    console.log('[ProjectTypeManager] Loading project types...');
    setIsLoading(true);
    const result = await getProjectTypes();
    if (result.projectTypes) {
      setProjectTypes(result.projectTypes);
      console.log('[ProjectTypeManager] Loaded', result.projectTypes.length, 'project types');
    } else if (result.error) {
      console.error('[ProjectTypeManager] Error loading:', result.error);
      toast.error(result.error);
    }
    setIsLoading(false);
  }

  // Debug: Handle create submission
  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    console.log('[ProjectTypeManager] Creating project type...');
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const result = await createProjectType(formData);

    setIsSubmitting(false);

    if (result.success) {
      toast.success('Project type created successfully');
      setShowCreateModal(false);
      loadProjectTypes();
    } else {
      toast.error(result.error || 'Failed to create project type');
    }
  }

  // Debug: Handle update submission
  async function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editingType) return;

    console.log('[ProjectTypeManager] Updating project type:', editingType.id);
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const result = await updateProjectType(editingType.id, formData);

    setIsSubmitting(false);

    if (result.success) {
      toast.success('Project type updated successfully');
      setEditingType(null);
      loadProjectTypes();
    } else {
      toast.error(result.error || 'Failed to update project type');
    }
  }

  // Debug: Handle delete confirmation
  async function handleDelete() {
    if (!deletingType) return;

    console.log('[ProjectTypeManager] Deleting project type:', deletingType.id);
    setIsSubmitting(true);

    const result = await deleteProjectType(deletingType.id);

    setIsSubmitting(false);

    if (result.success) {
      toast.success('Project type deleted successfully');
      setDeletingType(null);
      loadProjectTypes();
    } else {
      toast.error(result.error || 'Failed to delete project type');
    }
  }

  return (
    <div className="space-y-4" role="region" aria-label="Project Type Management">
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

      {/* Debug: Project types table */}
      <div
        className="border-2 border-gray-200 rounded-lg overflow-hidden shadow-construction transition-all duration-300"
        aria-busy={isLoading}
      >
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="font-bold text-gray-900">Type</TableHead>
              <TableHead className="font-bold text-gray-900 hidden md:table-cell">Description</TableHead>
              <TableHead className="font-bold text-gray-900 text-center">Projects</TableHead>
              <TableHead className="font-bold text-gray-900 text-center">Status</TableHead>
              <TableHead className="font-bold text-gray-900 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              // Debug: Loading skeleton with improved contrast
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-gray-300 rounded-lg animate-pulse" />
                      <div className="h-4 w-32 bg-gray-300 rounded animate-pulse" />
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="h-4 w-48 bg-gray-300 rounded animate-pulse" />
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="h-6 w-8 bg-gray-300 rounded-full mx-auto animate-pulse" />
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="h-6 w-16 bg-gray-300 rounded-full mx-auto animate-pulse" />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                      <div className="h-10 w-10 bg-gray-300 rounded animate-pulse" />
                      <div className="h-10 w-10 bg-gray-300 rounded animate-pulse" />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : projectTypes.length === 0 ? (
              // Debug: Empty state with improved visual hierarchy
              <TableRow>
                <TableCell colSpan={5} className="text-center py-16">
                  <div className="flex flex-col items-center gap-4">
                    <div className="p-4 bg-construction-blue/10 rounded-full border-2 border-construction-blue/20">
                      <Building2 className="h-12 w-12 text-construction-blue" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="text-gray-900 font-bold text-lg mb-1">No project types defined</p>
                      <p className="text-sm text-gray-600">
                        Add your first project type to get started
                      </p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              // Debug: Project type rows
              projectTypes.map((type) => {
                const IconComponent = AVAILABLE_ICONS[type.icon_name as keyof typeof AVAILABLE_ICONS] || Building2;
                return (
                  <TableRow
                    key={type.id}
                    className="hover:bg-gray-50 transition-colors duration-200"
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div
                          className="p-2 rounded-lg border-2 transition-all duration-300"
                          style={{
                            backgroundColor: `${type.color || '#001B51'}15`,
                            borderColor: `${type.color || '#001B51'}30`,
                          }}
                          aria-hidden="true"
                        >
                          <IconComponent
                            className="h-5 w-5"
                            style={{ color: type.color || '#001B51' }}
                          />
                        </div>
                        <span className="font-semibold text-gray-900">{type.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-600 max-w-xs truncate hidden md:table-cell">
                      {type.description || '-'}
                    </TableCell>
                    <TableCell className="text-center">
                      <span
                        className="inline-flex items-center justify-center px-2 py-1 bg-gray-100 text-gray-900 rounded-full text-sm font-bold min-w-[2rem]"
                        aria-label={`${type.project_count || 0} projects`}
                      >
                        {type.project_count || 0}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span
                        className={cn(
                          'inline-flex items-center px-2 py-1 rounded-full text-xs font-bold transition-colors duration-200',
                          type.is_active
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600'
                        )}
                        aria-label={`Status: ${type.is_active ? 'Active' : 'Inactive'}`}
                      >
                        {type.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingType(type)}
                          className="hover:bg-construction-blue/10 transition-all duration-300 focus-visible:ring-2 focus-visible:ring-construction-blue focus-visible:ring-offset-2 min-h-[44px] min-w-[44px]"
                          aria-label={`Edit ${type.name}`}
                        >
                          <Edit className="h-4 w-4 text-construction-blue" aria-hidden="true" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeletingType(type)}
                          className="hover:bg-red-50 transition-all duration-300 focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2 min-h-[44px] min-w-[44px]"
                          aria-label={`Delete ${type.name}`}
                          disabled={(type.project_count || 0) > 0}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" aria-hidden="true" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Debug: Create Modal */}
      <BaseModal
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
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
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
        <form id="create-project-type-form" onSubmit={handleCreate} className="space-y-4">
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
            <Label htmlFor="create-description" className="font-bold text-gray-900">
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
              <Select name="icon_name" defaultValue="Building2" disabled={isSubmitting}>
                <SelectTrigger
                  id="create-icon"
                  className="border-2 focus-visible:ring-2 focus-visible:ring-construction-blue transition-all duration-200"
                  aria-describedby="create-icon-hint"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(AVAILABLE_ICONS).map((iconName) => {
                    const Icon = AVAILABLE_ICONS[iconName as keyof typeof AVAILABLE_ICONS];
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
      </BaseModal>

      {/* Debug: Edit Modal */}
      {editingType && (
        <BaseModal
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
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
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
          <form id="edit-project-type-form" onSubmit={handleUpdate} className="space-y-4">
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
              <Label htmlFor="edit-description" className="font-bold text-gray-900">
                Description
              </Label>
              <Textarea
                id="edit-description"
                name="description"
                defaultValue={editingType.description || ''}
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
                <Select name="icon_name" defaultValue={editingType.icon_name || 'Building2'} disabled={isSubmitting}>
                  <SelectTrigger
                    id="edit-icon"
                    className="border-2 focus-visible:ring-2 focus-visible:ring-construction-blue transition-all duration-200"
                    aria-describedby="edit-icon-hint"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(AVAILABLE_ICONS).map((iconName) => {
                      const Icon = AVAILABLE_ICONS[iconName as keyof typeof AVAILABLE_ICONS];
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
                  defaultValue={editingType.color || '#001B51'}
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
                <Label htmlFor="edit-is-active" className="cursor-pointer font-bold text-gray-900">
                  Active
                </Label>
                <p id="edit-is-active-hint" className="text-xs text-gray-600 mt-0.5">
                  Visible when creating new projects
                </p>
              </div>
            </div>
          </form>
        </BaseModal>
      )}

      {/* Debug: Delete Confirmation */}
      {deletingType && (
        <AlertDialog open={!!deletingType} onOpenChange={() => setDeletingType(null)}>
          <AlertDialogContent className="border-2 border-red-200">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-red-600 font-black uppercase tracking-tight">
                Delete Project Type
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-3 text-gray-700">
                {(deletingType.project_count || 0) > 0 ? (
                  <>
                    <p className="font-semibold text-red-600">Cannot delete this project type!</p>
                    <p>
                      This project type is assigned to{' '}
                      <span className="font-bold">{deletingType.project_count}</span>{' '}
                      {deletingType.project_count === 1 ? 'project' : 'projects'}.
                    </p>
                    <p className="text-sm text-gray-600">
                      To remove this type, first reassign all projects to a different type, or mark the type as inactive instead.
                    </p>
                  </>
                ) : (
                  <>
                    <p>
                      Are you sure you want to delete{' '}
                      <span className="font-bold text-gray-900">"{deletingType.name}"</span>?
                    </p>
                    <p className="text-sm text-gray-600">
                      This will also delete all associated phase and task templates. This action cannot be undone.
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
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
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
}
