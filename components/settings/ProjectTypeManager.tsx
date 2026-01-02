'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Building2, Home, Factory, UtensilsCrossed, Store, Warehouse, Pencil, CheckCircle2 } from 'lucide-react';
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
 * Debug: Main component for CRUD operations on project types
 */
export function ProjectTypeManager() {
  console.log('[ProjectTypeManager] Rendering project type manager');

  const [projectTypes, setProjectTypes] = useState<ProjectTypeWithCount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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

    const formData = new FormData(e.currentTarget);
    const result = await createProjectType(formData);

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

    const formData = new FormData(e.currentTarget);
    const result = await updateProjectType(editingType.id, formData);

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

    const result = await deleteProjectType(deletingType.id);

    if (result.success) {
      toast.success('Project type deleted successfully');
      setDeletingType(null);
      loadProjectTypes();
    } else {
      toast.error(result.error || 'Failed to delete project type');
    }
  }

  return (
    <div className="space-y-4">
      {/* Debug: Header with Add button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Project Types</h3>
          <p className="text-sm text-gray-500">
            Define the types of construction projects your company handles
          </p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-construction-blue hover:bg-construction-blue/90 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Type
        </Button>
      </div>

      {/* Debug: Project types table */}
      <div className="border-2 border-gray-200 rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="font-bold">Type</TableHead>
              <TableHead className="font-bold hidden md:table-cell">Description</TableHead>
              <TableHead className="font-bold text-center">Projects</TableHead>
              <TableHead className="font-bold text-center">Status</TableHead>
              <TableHead className="font-bold text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              // Debug: Loading skeleton
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-gray-200 rounded-lg animate-pulse" />
                      <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="h-6 w-8 bg-gray-200 rounded-full mx-auto animate-pulse" />
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="h-6 w-16 bg-gray-200 rounded-full mx-auto animate-pulse" />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                      <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
                      <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : projectTypes.length === 0 ? (
              // Debug: Empty state
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12">
                  <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">No project types defined</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Add your first project type to get started
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              // Debug: Project type rows
              projectTypes.map((type) => {
                const IconComponent = AVAILABLE_ICONS[type.icon_name as keyof typeof AVAILABLE_ICONS] || Building2;
                return (
                  <TableRow key={type.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div
                          className="p-2 rounded-lg border-2"
                          style={{
                            backgroundColor: `${type.color || '#001B51'}15`,
                            borderColor: `${type.color || '#001B51'}30`,
                          }}
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
                      <span className="inline-flex items-center justify-center px-2 py-1 bg-gray-100 text-gray-900 rounded-full text-sm font-bold min-w-[2rem]">
                        {type.project_count || 0}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span
                        className={cn(
                          'inline-flex items-center px-2 py-1 rounded-full text-xs font-bold',
                          type.is_active
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600'
                        )}
                      >
                        {type.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingType(type)}
                          className="hover:bg-construction-blue/10"
                        >
                          <Edit className="h-4 w-4 text-construction-blue" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeletingType(type)}
                          className="hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
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
        leftActions={
          <Button
            variant="outline"
            onClick={() => setShowCreateModal(false)}
            className="border-2"
          >
            Cancel
          </Button>
        }
        rightActions={
            <Button
            type="submit"
            form="create-project-type-form"
            className={cn(
              'h-10 px-6 font-semibold text-white bg-construction-blue hover:bg-blue-700'
            )}
          >
         
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Create Type
                  </>
          
          </Button>
        }
      >
        <form id="create-project-type-form" onSubmit={handleCreate} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="create-name">Name *</Label>
            <Input
              id="create-name"
              name="name"
              placeholder="e.g., Retail Store"
              required
              className="border-2"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="create-description">Description</Label>
            <Textarea
              id="create-description"
              name="description"
              placeholder="Brief description of this project type"
              rows={2}
              className="border-2 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="create-icon">Icon</Label>
              <Select name="icon_name" defaultValue="Building2">
                <SelectTrigger className="border-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(AVAILABLE_ICONS).map((iconName) => {
                    const Icon = AVAILABLE_ICONS[iconName as keyof typeof AVAILABLE_ICONS];
                    return (
                      <SelectItem key={iconName} value={iconName}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          <span>{iconName}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-color">Color</Label>
              <Input
                id="create-color"
                name="color"
                type="color"
                defaultValue="#001B51"
                className="h-10 border-2 cursor-pointer"
              />
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
          leftActions={
            <Button
              variant="outline"
              onClick={() => setEditingType(null)}
              className="border-2"
            >
              Cancel
            </Button>
          }
          rightActions={
                  <Button
                  type="submit"
                  form="edit-project-type-form"
                  className={cn(
                    'h-10 px-6 font-semibold text-white bg-construction-blue hover:bg-blue-700'
                  )}
                >
               
                        <>
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Save Changes
                        </>
                
                </Button>
          }
        >
          <form id="edit-project-type-form" onSubmit={handleUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name *</Label>
              <Input
                id="edit-name"
                name="name"
                defaultValue={editingType.name}
                required
                className="border-2"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                name="description"
                defaultValue={editingType.description || ''}
                rows={2}
                className="border-2 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-icon">Icon</Label>
                <Select name="icon_name" defaultValue={editingType.icon_name || 'Building2'}>
                  <SelectTrigger className="border-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(AVAILABLE_ICONS).map((iconName) => {
                      const Icon = AVAILABLE_ICONS[iconName as keyof typeof AVAILABLE_ICONS];
                      return (
                        <SelectItem key={iconName} value={iconName}>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            <span>{iconName}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-color">Color</Label>
                <Input
                  id="edit-color"
                  name="color"
                  type="color"
                  defaultValue={editingType.color || '#001B51'}
                  className="h-10 border-2 cursor-pointer"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg border-2 border-gray-200">
              <input
                type="checkbox"
                id="edit-is-active"
                name="is_active"
                value="true"
                defaultChecked={editingType.is_active ?? true}
                className="h-4 w-4 rounded border-gray-300 text-construction-blue focus:ring-construction-blue"
              />
              <Label htmlFor="edit-is-active" className="cursor-pointer font-medium">
                Active (visible when creating projects)
              </Label>
            </div>
          </form>
        </BaseModal>
      )}

      {/* Debug: Delete Confirmation */}
      {deletingType && (
        <AlertDialog open={!!deletingType} onOpenChange={() => setDeletingType(null)}>
          <AlertDialogContent className="border-2 border-red-200">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-red-600">Delete Project Type</AlertDialogTitle>
              <AlertDialogDescription className="space-y-3">
                {(deletingType.project_count || 0) > 0 ? (
                  <>
                    <p className="font-semibold text-red-600">Cannot delete this project type!</p>
                    <p>
                      This project type is assigned to{' '}
                      <span className="font-bold">{deletingType.project_count}</span>{' '}
                      {deletingType.project_count === 1 ? 'project' : 'projects'}.
                    </p>
                    <p className="text-sm">
                      To remove this type, first reassign all projects to a different type, or mark the type as inactive instead.
                    </p>
                  </>
                ) : (
                  <>
                    <p>
                      Are you sure you want to delete{' '}
                      <span className="font-bold text-gray-900">"{deletingType.name}"</span>?
                    </p>
                    <p className="text-sm">
                      This will also delete all associated phase and task templates. This action cannot be undone.
                    </p>
                  </>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-2">Cancel</AlertDialogCancel>
              {(deletingType.project_count || 0) === 0 && (
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Delete
                </AlertDialogAction>
              )}
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
