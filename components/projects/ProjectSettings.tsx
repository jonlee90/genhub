'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
// Performance optimization: Direct imports instead of barrel file (saves 200-800ms per page)
import Save from 'lucide-react/icons/save';
import Trash2 from 'lucide-react/icons/trash-2';
import AlertTriangle from 'lucide-react/icons/alert-triangle';
import { CreatorBadge } from '@/components/ui/CreatorBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { updateProject, updateProjectStatus } from '@/app/actions/projects';
import type { ProjectsRow } from '@/types/db/tables/projects';

type Project = Partial<ProjectsRow> & {
  id: string;
  name: string;
  creator?: {
    id: string;
    name: string;
    email: string;
    avatar_url: string | null;
  } | null;
};

interface ProjectSettingsProps {
  project: Project;
}

const PROJECT_STATUSES = [
  { value: 'active', label: 'Active' },
  { value: 'on_hold', label: 'On Hold' },
  { value: 'completed', label: 'Completed' },
  { value: 'archived', label: 'Archived' },
];

export function ProjectSettings({ project }: ProjectSettingsProps) {
  console.log('[ProjectSettings] Rendering with project:', {
    id: project.id,
    name: project.name,
    status: project.status,
    creator: project.creator?.name,
  });

  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [currentStatus, setCurrentStatus] = useState<'active' | 'on_hold' | 'completed' | 'archived'>(
    (project.status === 'in_progress' || project.status === 'planning') ? 'active' : (project.status || 'active')
  );

  // Performance optimization: Memoize event handlers to prevent recreation on every render
  const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    const formData = new FormData(e.currentTarget);
    formData.append('id', project.id);

    const result = await updateProject(formData);

    if (result?.error) {
      setError(result.error);
    } else {
      setSuccessMessage('Project settings saved successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
    }

    setIsSaving(false);
  }, [project.id]);

  const handleStatusChange = useCallback(async (status: string) => {
    const validStatus = status as 'active' | 'on_hold' | 'completed' | 'archived';
    const previousStatus = currentStatus;
    setCurrentStatus(validStatus); // Optimistic update
    setError(null);

    const result = await updateProjectStatus(
      project.id,
      validStatus
    );

    if (result?.error) {
      setError(result.error);
      setCurrentStatus(previousStatus); // Rollback on error
    }
  }, [project.id, currentStatus]);

  const handleArchive = useCallback(async () => {
    setIsArchiving(true);
    setError(null);

    const result = await updateProjectStatus(project.id, 'archived');

    if (result?.error) {
      setError(result.error);
      setIsArchiving(false);
    } else {
      router.push('/app/projects');
    }
  }, [project.id, router]);

  return (
    <div className="space-y-6">
      {/* General Settings */}
      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Project Details</CardTitle>
            <CardDescription>
              Update your project information and settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Creator Badge - Industrial Metadata Tag */}
            {project.creator?.name && project.created_at && (
              <CreatorBadge
                creatorName={project.creator.name}
                createdAt={project.created_at}
                variant="default"
              />
            )}

            {error && (
              <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}
            {successMessage && (
              <div className="bg-green-50 text-green-700 px-4 py-3 rounded-lg text-sm dark:bg-green-900/20 dark:text-green-400">
                {successMessage}
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Project Name</Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={project.name}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="client_name">Client Name</Label>
                <Input
                  id="client_name"
                  name="client_name"
                  defaultValue={project.client_name}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                defaultValue={project.description || ''}
                rows={3}
                placeholder="Project description..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                name="address"
                defaultValue={project.address || ''}
                placeholder="Project site address"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="budget">Budget ($)</Label>
                <Input
                  id="budget"
                  name="budget"
                  type="number"
                  min="0"
                  step="1000"
                  defaultValue={project.budget || ''}
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="start_date">Start Date</Label>
                <Input
                  id="start_date"
                  name="start_date"
                  type="date"
                  defaultValue={project.start_date || ''}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="end_date">Target End Date</Label>
                <Input
                  id="end_date"
                  name="end_date"
                  type="date"
                  defaultValue={project.end_date || ''}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSaving}>
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </CardFooter>
        </form>
      </Card>

      {/* Project Status */}
      <Card>
        <CardHeader>
          <CardTitle>Project Status</CardTitle>
          <CardDescription>
            Change the current status of this project
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={currentStatus}
              onValueChange={handleStatusChange}
            >
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {PROJECT_STATUSES.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>
            Irreversible actions that affect this project
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">Archive this project</p>
              <p className="text-sm text-muted-foreground">
                Archive the project and hide it from the main list. This can be
                undone.
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={isArchiving}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  {isArchiving ? 'Archiving...' : 'Archive Project'}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Archive this project?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will archive &quot;{project.name}&quot; and hide it from the
                    main project list. You can restore it later from the
                    archived projects view.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleArchive}>
                    Archive Project
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
