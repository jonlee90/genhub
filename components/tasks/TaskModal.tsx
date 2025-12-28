'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ClipboardList,
  Pencil,
  Loader2,
  Calendar,
  User,
  Flag,
  FolderOpen,
  Layers,
  DollarSign,
  FileText,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Package,
} from 'lucide-react';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { createTask, updateTask } from '@/app/actions/tasks';
import { TaskMaterials } from './TaskMaterials';
import type { Database } from '@/types/database.types';

type Task = Database['public']['Tables']['tasks']['Row'] & {
  assignee?: {
    id: string;
    name: string;
    email: string;
    avatar_url: string | null;
  } | null;
  phase?: {
    id: string;
    name: string;
  } | null;
};

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

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
  task?: Task | null;
  projects: Project[];
  teamMembers: TeamMember[];
  preselectedProjectId?: string;
  preselectedPhaseId?: string;
  onSuccess?: () => void;
}

// Priority color configuration for dynamic theming
const PRIORITY_CONFIG = {
  low: {
    label: 'Low',
    dot: 'bg-emerald-500',
    gradient: 'from-emerald-500 via-emerald-400 to-emerald-500',
    iconBg: 'bg-gradient-to-br from-emerald-500 to-emerald-600',
    button: 'bg-emerald-500 hover:bg-emerald-600',
    focusRing: 'focus:ring-emerald-500/20 focus:border-emerald-500',
    iconColor: 'text-emerald-500',
    description: 'Can be done when time allows',
  },
  medium: {
    label: 'Medium',
    dot: 'bg-amber-500',
    gradient: 'from-amber-500 via-amber-400 to-amber-500',
    iconBg: 'bg-gradient-to-br from-amber-500 to-amber-600',
    button: 'bg-amber-500 hover:bg-amber-600',
    focusRing: 'focus:ring-amber-500/20 focus:border-amber-500',
    iconColor: 'text-amber-500',
    description: 'Standard priority task',
  },
  high: {
    label: 'High',
    dot: 'bg-red-500',
    gradient: 'from-red-500 via-red-400 to-red-500',
    iconBg: 'bg-gradient-to-br from-red-500 to-red-600',
    button: 'bg-red-500 hover:bg-red-600',
    focusRing: 'focus:ring-red-500/20 focus:border-red-500',
    iconColor: 'text-red-500',
    description: 'Needs immediate attention',
  },
};

// Default (create mode) uses construction-blue theme
const DEFAULT_THEME = {
  gradient: 'from-construction-blue via-blue-500 to-construction-blue',
  iconBg: 'bg-gradient-to-br from-construction-blue to-blue-600',
  button: 'bg-construction-blue hover:bg-construction-blue/90',
  focusRing: 'focus:ring-construction-blue/20 focus:border-construction-blue',
  iconColor: 'text-construction-blue',
};

type PriorityKey = keyof typeof PRIORITY_CONFIG;

// Helper to get theme based on mode and priority
const getTheme = (mode: 'create' | 'edit', priority: string) => {
  if (mode === 'create') {
    return DEFAULT_THEME;
  }
  return PRIORITY_CONFIG[priority as PriorityKey] || DEFAULT_THEME;
};

// Inner form component that gets remounted when task changes via key prop
function TaskModalForm({
  mode,
  task,
  projects,
  teamMembers,
  preselectedProjectId,
  preselectedPhaseId,
  onClose,
  onSuccess,
}: Omit<TaskModalProps, 'isOpen'>) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form state - initialized directly from task props for edit mode
  // Using function initializers ensures values are set on first render
  const [selectedProjectId, setSelectedProjectId] = useState(() => {
    if (mode === 'edit' && task) return task.project_id;
    return preselectedProjectId || '';
  });
  const [title, setTitle] = useState(() => {
    if (mode === 'edit' && task) return task.title;
    return '';
  });
  const [description, setDescription] = useState(() => {
    if (mode === 'edit' && task) return task.description || '';
    return '';
  });
  const [assigneeId, setAssigneeId] = useState(() => {
    if (mode === 'edit' && task) return task.assignee_id || 'none';
    return 'none';
  });
  const [priority, setPriority] = useState<string>(() => {
    if (mode === 'edit' && task) return task.priority;
    return 'medium';
  });
  const [phaseId, setPhaseId] = useState(() => {
    if (mode === 'edit' && task) return task.phase_id || 'none';
    return preselectedPhaseId || 'none';
  });
  const [startDate, setStartDate] = useState(() => {
    if (mode === 'edit' && task && task.start_date) return task.start_date.split('T')[0];
    return '';
  });
  const [dueDate, setDueDate] = useState(() => {
    if (mode === 'edit' && task && task.due_date) return task.due_date.split('T')[0];
    return '';
  });
  const [plannedCost, setPlannedCost] = useState(() => {
    if (mode === 'edit' && task) return task.planned_cost?.toString() || '';
    return '';
  });
  const [actualCost, setActualCost] = useState(() => {
    if (mode === 'edit' && task) return task.actual_cost?.toString() || '';
    return '';
  });

  // Get current theme based on mode and priority
  const theme = getTheme(mode, priority);

  // Get phases for selected project
  const selectedProject = projects.find((p) => p.id === selectedProjectId);
  const phases = selectedProject?.project_phases || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('project_id', selectedProjectId);
    formData.append('phase_id', phaseId);
    formData.append('assignee_id', assigneeId);
    formData.append('priority', priority);
    formData.append('start_date', startDate);
    formData.append('due_date', dueDate);
    formData.append('planned_cost', plannedCost);

    if (mode === 'edit' && task) {
      formData.append('id', task.id);
      formData.append('actual_cost', actualCost);
    }

    startTransition(async () => {
      try {
        const result = mode === 'create'
          ? await createTask({ error: null, fieldErrors: null, success: false, task: null }, formData)
          : await updateTask(formData);

        if (result?.error) {
          setError(result.error);
        } else {
          setSuccess(true);
          setTimeout(() => {
            onSuccess?.();
            onClose();
            router.refresh();
          }, 500);
        }
      } catch (err) {
        setError('An unexpected error occurred');
      }
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden">
      {/* Top accent - uses priority color in edit mode */}
      <div className={cn('h-1.5 bg-gradient-to-r', theme.gradient)} />

      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className={cn(
              'w-12 h-12 rounded-xl flex items-center justify-center shadow-lg',
              theme.iconBg
            )}>
              {mode === 'create' ? (
                <ClipboardList className="w-6 h-6 text-white" />
              ) : (
                <Pencil className="w-6 h-6 text-white" />
              )}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {mode === 'create' ? 'Create New Task' : 'Edit Task'}
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                {mode === 'create'
                  ? 'Add a new task to your project'
                  : 'Update task details and assignments'
                }
              </p>
            </div>
          </div>

          <Button
            onClick={onClose}
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-xl hover:bg-gray-100"
          >
            <X className="h-5 w-5 text-gray-500" />
          </Button>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div className="px-6 py-5 max-h-[calc(100vh-280px)] overflow-y-auto space-y-5">
          {/* Materials Section - Edit mode only */}
          {mode === 'edit' && task && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                <Package className="h-4 w-4 text-construction-blue" />
                <h3 className="text-sm font-bold text-gray-900">Assigned Materials</h3>
                <p className="text-xs text-gray-500">Materials for this task</p>
              </div>
              {console.log('[TaskModal] Rendering TaskMaterials with taskId:', task.id)}
              <div className="max-h-80 overflow-y-auto">
                <TaskMaterials taskId={task.id} canEdit={false} />
              </div>
            </div>
          )}
          {/* Error/Success Messages */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700"
              >
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <span className="text-sm font-medium">{error}</span>
              </motion.div>
            )}
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700"
              >
                <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
                <span className="text-sm font-medium">
                  Task {mode === 'create' ? 'created' : 'updated'} successfully!
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Sparkles className={cn('h-4 w-4', theme.iconColor)} />
              Task Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              required
              disabled={isPending}
              className={cn('h-11 border-gray-200', theme.focusRing)}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <FileText className="h-4 w-4 text-gray-400" />
              Description
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add details about this task..."
              rows={3}
              disabled={isPending}
              className={cn('border-gray-200 resize-none', theme.focusRing)}
            />
          </div>

          {/* Project & Phase Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="project" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <FolderOpen className="h-4 w-4 text-gray-400" />
                Project <span className="text-red-500">*</span>
              </Label>
              <Select
                value={selectedProjectId}
                onValueChange={setSelectedProjectId}
                disabled={isPending || mode === 'edit'}
              >
                <SelectTrigger id="project" className="h-11 border-gray-200">
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="phase" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Layers className="h-4 w-4 text-gray-400" />
                Phase
              </Label>
              <Select
                value={phaseId}
                onValueChange={setPhaseId}
                disabled={isPending || !selectedProjectId}
              >
                <SelectTrigger id="phase" className="h-11 border-gray-200">
                  <SelectValue placeholder="Select phase" />
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

          {/* Assignee & Priority Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="assignee" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <User className="h-4 w-4 text-gray-400" />
                Assignee
              </Label>
              <Select
                value={assigneeId}
                onValueChange={setAssigneeId}
                disabled={isPending}
              >
                <SelectTrigger id="assignee" className="h-11 border-gray-200">
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none" textValue="Unassigned">
                    <span className="text-gray-500">Unassigned</span>
                  </SelectItem>
                  {teamMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id} textValue={member.name}>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={member.avatar_url || undefined} />
                          <AvatarFallback className="text-[10px] bg-construction-blue text-white">
                            {getInitials(member.name)}
                          </AvatarFallback>
                        </Avatar>
                        <span>{member.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Flag className="h-4 w-4 text-gray-400" />
                Priority
              </Label>
              <Select
                value={priority}
                onValueChange={setPriority}
                disabled={isPending}
              >
                <SelectTrigger id="priority" className="h-11 border-gray-200">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PRIORITY_CONFIG).map(([value, config]) => (
                    <SelectItem key={value} value={value} textValue={config.label}>
                      <div className="flex items-center gap-2">
                        <div className={cn('w-2 h-2 rounded-full', config.dot)} />
                        <span>{config.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Date Range Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                Start Date
              </Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => {
                  const newStartDate = e.target.value;
                  setStartDate(newStartDate);
                  // If start date is after due date, update due date to match
                  if (dueDate && newStartDate > dueDate) {
                    setDueDate(newStartDate);
                  }
                }}
                disabled={isPending}
                className="h-11 border-gray-200"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                Due Date
              </Label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                disabled={isPending}
                min={startDate || undefined}
                className="h-11 border-gray-200"
              />
            </div>
          </div>

          {/* Costs Row */}
          <div className={cn('grid gap-4', mode === 'edit' ? 'grid-cols-2' : 'grid-cols-1')}>
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-gray-400" />
                Planned Cost
              </Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={plannedCost}
                onChange={(e) => setPlannedCost(e.target.value)}
                placeholder="0.00"
                disabled={isPending}
                className="h-11 border-gray-200"
              />
            </div>

            {mode === 'edit' && (
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <DollarSign className={cn('h-4 w-4', theme.iconColor)} />
                  Actual Cost
                </Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={actualCost}
                  onChange={(e) => setActualCost(e.target.value)}
                  placeholder="0.00"
                  disabled={isPending}
                  className="h-11 border-gray-200"
                />
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <p className="text-xs text-gray-500">
            <span className="text-red-500">*</span> Required fields
          </p>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isPending}
              className="h-10 px-5"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending || !selectedProjectId || !title.trim()}
              className={cn(
                'h-10 px-6 font-semibold text-white',
                theme.button
              )}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {mode === 'create' ? 'Creating...' : 'Saving...'}
                </>
              ) : (
                <>
                  {mode === 'create' ? (
                    <>
                      <ClipboardList className="mr-2 h-4 w-4" />
                      Create Task
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

// Main modal component - handles open/close and remounts form on task change
export function TaskModal({
  isOpen,
  onClose,
  mode,
  task,
  projects,
  teamMembers,
  preselectedProjectId,
  preselectedPhaseId,
  onSuccess,
}: TaskModalProps) {
  // Generate a unique key for the form based on mode and task ID
  // This forces React to remount the form component with fresh state
  const formKey = mode === 'edit' && task ? `edit-${task.id}` : 'create';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-2xl pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Key forces remount when switching between tasks */}
              <TaskModalForm
                key={formKey}
                mode={mode}
                task={task}
                projects={projects}
                teamMembers={teamMembers}
                preselectedProjectId={preselectedProjectId}
                preselectedPhaseId={preselectedPhaseId}
                onClose={onClose}
                onSuccess={onSuccess}
              />
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
