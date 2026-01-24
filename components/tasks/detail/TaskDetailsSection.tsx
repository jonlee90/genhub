/**
 * TaskDetailsSection - Basic task information display
 * Extracted from TaskDetail.tsx for better maintainability
 */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Save,
  Pencil,
  Calendar,
  DollarSign,
  User,
  Clock,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import { TaskTypeBadge } from '../TaskTypeSelector';
import { updateTask } from '@/app/actions/tasks';
import { cn, formatDate, getInitials } from '@/lib/utils';
import {
  TASK_STATUS_CONFIG,
  TASK_PRIORITY_CONFIG,
} from '@/lib/config/task-colors';
import type {
  TaskStatus,
  TaskPriority,
  TaskType,
  UserRole,
} from '@/types/db/enums';

interface TaskDetailsData {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  task_type: TaskType | null;
  due_date: string | null;
  start_date: string | null;
  planned_cost: number | null;
  actual_cost: number | null;
  blocked_reason: string | null;
  phase_id: string | null;
  project_id: string;
  assignee_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  creator?: { name: string } | null;
  assignee?: {
    id: string;
    name: string;
    email: string;
    avatar_url: string | null;
  } | null;
  phase?: { id: string; name: string } | null;
}

interface TaskDetailsSectionProps {
  task: TaskDetailsData;
  phases: Array<{ id: string; name: string }>;
  teamMembers: Array<{
    id: string;
    name: string;
    email: string;
    avatar_url: string | null;
  }>;
  userRole: UserRole;
  isEditMode: boolean;
  onEditToggle: () => void;
  onSaveSuccess: () => void;
  onError: (error: string) => void;
}

export function TaskDetailsSection({
  task,
  phases,
  teamMembers,
  userRole,
  isEditMode,
  onEditToggle,
  onSaveSuccess,
  onError,
}: TaskDetailsSectionProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  const taskType: TaskType = task.task_type || 'work';
  const isApprovalTask = taskType === 'approval';
  const showCostFields = !isApprovalTask;

  const canEdit =
    userRole === 'admin' ||
    userRole === 'project_manager' ||
    task.assignee_id === task.created_by;

  const isOverdue =
    task.due_date &&
    new Date(task.due_date) < new Date() &&
    task.status !== 'completed';

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);

    const formData = new FormData(e.currentTarget);
    formData.append('id', task.id);

    const result = await updateTask(formData);

    if (result?.error) {
      onError(result.error);
    } else {
      onSaveSuccess();
      onEditToggle();
    }

    setIsSaving(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <Card className="border-2 border-gray-200 dark:border-gray-700">
      <CardContent className="p-6">
        {/* Header with Edit Button */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Task Details</h2>
          {canEdit && !isEditMode && (
            <Button
              onClick={onEditToggle}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <Pencil className="w-4 h-4" />
              Edit
            </Button>
          )}
        </div>

        {isEditMode ? (
          /* Edit Form */
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                name="title"
                defaultValue={task.title}
                required
                placeholder="Enter task title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                defaultValue={task.description || ''}
                placeholder="Enter task description (optional)"
                rows={4}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priority">Priority *</Label>
                <Select name="priority" defaultValue={task.priority}>
                  <SelectTrigger id="priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="assignee_id">Assignee</Label>
                <Select
                  name="assignee_id"
                  defaultValue={task.assignee_id || 'unassigned'}
                >
                  <SelectTrigger id="assignee_id">
                    <SelectValue />
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date">Start Date</Label>
                <Input
                  id="start_date"
                  name="start_date"
                  type="date"
                  defaultValue={
                    task.start_date
                      ? new Date(task.start_date).toISOString().split('T')[0]
                      : ''
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="due_date">Due Date</Label>
                <Input
                  id="due_date"
                  name="due_date"
                  type="date"
                  defaultValue={
                    task.due_date
                      ? new Date(task.due_date).toISOString().split('T')[0]
                      : ''
                  }
                />
              </div>
            </div>

            {showCostFields && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="planned_cost">Planned Cost ($)</Label>
                  <Input
                    id="planned_cost"
                    name="planned_cost"
                    type="number"
                    step="0.01"
                    defaultValue={task.planned_cost || ''}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="actual_cost">Actual Cost ($)</Label>
                  <Input
                    id="actual_cost"
                    name="actual_cost"
                    type="number"
                    step="0.01"
                    defaultValue={task.actual_cost || ''}
                    placeholder="0.00"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="phase_id">Phase</Label>
              <Select
                name="phase_id"
                defaultValue={task.phase_id || 'no_phase'}
              >
                <SelectTrigger id="phase_id">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no_phase">No Phase</SelectItem>
                  {phases.map((phase) => (
                    <SelectItem key={phase.id} value={phase.id}>
                      {phase.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onEditToggle}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSaving}
                className="bg-construction-blue text-white gap-2"
              >
                {isSaving ? (
                  <>
                    <Clock className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </form>
        ) : (
          /* View Mode */
          <div className="space-y-6">
            {/* Title */}
            <div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {task.title}
              </h3>
              {task.description && (
                <p className="text-gray-600 dark:text-gray-400 mt-2">{task.description}</p>
              )}
            </div>

            {/* Metadata Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Priority */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Priority</p>
                  <Badge
                    className={cn(
                      'font-bold',
                      TASK_PRIORITY_CONFIG[task.priority].badgeColor,
                    )}
                  >
                    {TASK_PRIORITY_CONFIG[task.priority].label}
                  </Badge>
                </div>
              </div>

              {/* Assignee */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <User className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Assignee</p>
                  {task.assignee ? (
                    <div className="flex items-center gap-2">
                      <Avatar className="w-6 h-6">
                        <AvatarImage src={task.assignee.avatar_url || ''} />
                        <AvatarFallback className="text-xs">
                          {getInitials(task.assignee.name)}
                        </AvatarFallback>
                      </Avatar>
                      <p className="text-sm font-medium">
                        {task.assignee.name}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">Unassigned</p>
                  )}
                </div>
              </div>

              {/* Start Date */}
              {task.start_date && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Start Date</p>
                    <p className="text-sm font-medium">
                      {formatDate(task.start_date)}
                    </p>
                  </div>
                </div>
              )}

              {/* Due Date */}
              {task.due_date && (
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'w-10 h-10 rounded-lg flex items-center justify-center',
                      isOverdue ? 'bg-red-100' : 'bg-gray-100 dark:bg-gray-800',
                    )}
                  >
                    <Calendar
                      className={cn(
                        'w-5 h-5',
                        isOverdue ? 'text-red-600' : 'text-gray-600 dark:text-gray-400',
                      )}
                    />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Due Date</p>
                    <p
                      className={cn(
                        'text-sm font-medium',
                        isOverdue && 'text-red-600',
                      )}
                    >
                      {formatDate(task.due_date)}
                      {isOverdue && (
                        <span className="ml-2 text-xs">Overdue</span>
                      )}
                    </p>
                  </div>
                </div>
              )}

              {/* Planned Cost */}
              {showCostFields && task.planned_cost !== null && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Planned Cost</p>
                    <p className="text-sm font-medium">
                      {formatCurrency(task.planned_cost)}
                    </p>
                  </div>
                </div>
              )}

              {/* Actual Cost */}
              {showCostFields && task.actual_cost !== null && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Actual Cost</p>
                    <p className="text-sm font-medium">
                      {formatCurrency(task.actual_cost)}
                    </p>
                  </div>
                </div>
              )}

              {/* Phase */}
              {task.phase && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Phase</p>
                    <p className="text-sm font-medium">{task.phase.name}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Task Type Badge */}
            <div className="flex items-start gap-2">
              <TaskTypeBadge type={taskType} />
            </div>

            {/* Blocked Reason */}
            {task.status === 'blocked' && task.blocked_reason && (
              <div className="bg-red-50 dark:bg-gray-950 border border-red-200 dark:border-gray-600 rounded-lg p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-red-900 dark:text-gray-100">Blocked</p>
                  <p className="text-sm text-red-700 dark:text-gray-300">{task.blocked_reason}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
