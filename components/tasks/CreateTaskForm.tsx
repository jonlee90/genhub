'use client';

import { useActionState, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { createTask } from '@/app/actions/tasks';

interface Project {
  id: string;
  name: string;
  project_phases?: Array<{
    id: string;
    name: string;
    order_index: number;
  }>;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
}

interface CreateTaskFormProps {
  projects: Project[];
  teamMembers: TeamMember[];
  preselectedProjectId?: string;
  preselectedPhaseId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const initialState = {
  error: null as string | null,
  fieldErrors: null as Record<string, string[]> | null,
  success: false,
  task: null as any,
};

export function CreateTaskForm({
  projects,
  teamMembers,
  preselectedProjectId,
  preselectedPhaseId,
  onSuccess,
  onCancel,
}: CreateTaskFormProps) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(createTask, initialState);
  const [selectedProjectId, setSelectedProjectId] = useState(preselectedProjectId || '');

  // Get phases for selected project
  const selectedProject = projects.find((p) => p.id === selectedProjectId);
  const phases = selectedProject?.project_phases || [];

  // Handle success - call onSuccess callback if provided, otherwise navigate
  useEffect(() => {
    if (state?.success && state?.task) {
      if (onSuccess) {
        onSuccess();
      } else {
        router.push(`/app/tasks/${state.task.id}`);
      }
    }
  }, [state, router, onSuccess]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Task Details</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-6">
          {/* Error Display */}
          {state?.error && (
            <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg text-sm">
              {state.error}
            </div>
          )}

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              name="title"
              placeholder="Enter task title"
              required
              disabled={isPending}
            />
            {state?.fieldErrors?.title && (
              <p className="text-sm text-destructive">{state.fieldErrors.title[0]}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Describe the task..."
              rows={3}
              disabled={isPending}
            />
          </div>

          {/* Project & Phase */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="project_id">
                Project <span className="text-destructive">*</span>
              </Label>
              <Select
                name="project_id"
                value={selectedProjectId}
                onValueChange={setSelectedProjectId}
                required
                disabled={isPending}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {state?.fieldErrors?.project_id && (
                <p className="text-sm text-destructive">{state.fieldErrors.project_id[0]}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phase_id">Phase</Label>
              <Select
                name="phase_id"
                defaultValue={preselectedPhaseId || 'none'}
                disabled={isPending || !selectedProjectId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select phase (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No phase</SelectItem>
                  {phases
                    .sort((a, b) => a.order_index - b.order_index)
                    .map((phase) => (
                      <SelectItem key={phase.id} value={phase.id}>
                        {phase.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Assignee & Priority */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="assignee_id">Assignee</Label>
              <Select name="assignee_id" defaultValue="unassigned" disabled={isPending}>
                <SelectTrigger>
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {teamMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select name="priority" defaultValue="medium" disabled={isPending}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Date Range */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="start_date">Start Date</Label>
              <Input
                id="start_date"
                name="start_date"
                type="date"
                disabled={isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="due_date">Due Date</Label>
              <Input
                id="due_date"
                name="due_date"
                type="date"
                disabled={isPending}
              />
            </div>
          </div>

          {/* Cost */}
          <div className="space-y-2">
            <Label htmlFor="planned_cost">Planned Cost ($)</Label>
            <Input
              id="planned_cost"
              name="planned_cost"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              disabled={isPending}
            />
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel || (() => router.back())}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !selectedProjectId}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Task'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
