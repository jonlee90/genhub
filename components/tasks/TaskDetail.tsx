'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Trash2,
  AlertTriangle,
  Calendar,
  DollarSign,
  User,
  Clock,
  FileText,
  Link as LinkIcon,
  Activity,
  Pencil,
  CheckCircle2,
  XCircle,
  HardHat,
  Layers,
  Package,
  RotateCcw,
  Ban,
  ThumbsUp,
  MessageSquare,
  Receipt,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
import { TaskActivityLog } from './TaskActivityLog';
import { TaskDependencies } from './TaskDependencies';
import { TaskMaterials } from './TaskMaterials';
import { BlockedReasonModal } from './BlockedReasonModal';
import { TaskTypeBadge, getTaskTypeInfo } from './TaskTypeSelector';
import { updateTask, updateTaskStatus, deleteTask, updateApprovalStatus } from '@/app/actions/tasks';
import { cn } from '@/lib/utils';
import type { Database } from '@/types/database.types';

type TaskStatus = Database['public']['Enums']['task_status'];
type TaskPriority = Database['public']['Enums']['task_priority'];
type TaskType = Database['public']['Enums']['task_type'];
type ApprovalStatus = Database['public']['Enums']['approval_status'];
type UserRole = Database['public']['Enums']['user_role'];

// Debug: Approval status configuration
const APPROVAL_STATUS_CONFIG: Record<ApprovalStatus, {
  label: string;
  color: string;
  bgColor: string;
  icon: typeof CheckCircle2;
}> = {
  pending: {
    label: 'Pending Approval',
    color: 'text-amber-700',
    bgColor: 'bg-amber-100 border-amber-300',
    icon: Clock,
  },
  approved: {
    label: 'Approved',
    color: 'text-green-700',
    bgColor: 'bg-green-100 border-green-300',
    icon: CheckCircle2,
  },
  rejected: {
    label: 'Rejected',
    color: 'text-red-700',
    bgColor: 'bg-red-100 border-red-300',
    icon: Ban,
  },
  revision_requested: {
    label: 'Revision Requested',
    color: 'text-orange-700',
    bgColor: 'bg-orange-100 border-orange-300',
    icon: RotateCcw,
  },
};

interface TaskDetailProps {
  task: any;
  activity: any[];
  dependencies: any[];
  dependents: any[];
  phases: Array<{ id: string; name: string }>;
  teamMembers: Array<{
    id: string;
    name: string;
    email: string;
    avatar_url: string | null;
  }>;
  userRole: UserRole;
}

const STATUS_CONFIG = {
  todo: {
    label: 'To Do',
    color: 'bg-gray-100 text-gray-700 border-gray-300',
    icon: Clock,
    dotColor: 'bg-gray-400',
  },
  in_progress: {
    label: 'In Progress',
    color: 'bg-construction-blue/10 text-construction-blue border-construction-blue',
    icon: Activity,
    dotColor: 'bg-construction-blue',
  },
  review: {
    label: 'Review',
    color: 'bg-amber-50 text-amber-700 border-amber-300',
    icon: FileText,
    dotColor: 'bg-amber-500',
  },
  blocked: {
    label: 'Blocked',
    color: 'bg-red-50 text-red-700 border-red-300',
    icon: XCircle,
    dotColor: 'bg-red-500',
  },
  completed: {
    label: 'Completed',
    color: 'bg-green-50 text-green-700 border-green-300',
    icon: CheckCircle2,
    dotColor: 'bg-green-500',
  },
};

const PRIORITY_CONFIG = {
  low: {
    label: 'Low',
    color: 'bg-gray-50 text-gray-600 border-gray-200',
    badgeColor: 'bg-gray-100 text-gray-700',
  },
  medium: {
    label: 'Medium',
    color: 'bg-blue-50 text-blue-600 border-blue-200',
    badgeColor: 'bg-blue-100 text-blue-700',
  },
  high: {
    label: 'High',
    color: 'bg-red-50 text-red-600 border-red-200',
    badgeColor: 'bg-red-100 text-red-700',
  },
  critical: {
    label: 'Critical',
    color: 'bg-purple-50 text-purple-600 border-purple-200',
    badgeColor: 'bg-purple-100 text-purple-700',
  },
};

export function TaskDetail({
  task,
  activity,
  dependencies,
  dependents,
  phases,
  teamMembers,
  userRole,
}: TaskDetailProps) {
  console.log('[TaskDetail] Rendering task:', { id: task.id, task_type: task.task_type, approval_status: task.approval_status });

  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showBlockedModal, setShowBlockedModal] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<TaskStatus | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'materials' | 'activity' | 'dependencies'>('overview');

  // Debug: Approval workflow state
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalAction, setApprovalAction] = useState<ApprovalStatus | null>(null);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [isUpdatingApproval, setIsUpdatingApproval] = useState(false);

  // Debug: Task type determination (default to 'work' for legacy tasks)
  const taskType: TaskType = task.task_type || 'work';
  const isApprovalTask = taskType === 'approval';
  const isPurchaseTask = taskType === 'purchase';

  // Debug: Determine if cost fields should be shown (not for approval tasks)
  const showCostFields = !isApprovalTask;

  const canEdit = userRole === 'gc_admin' || userRole === 'project_manager' ||
                  task.assignee_id === task.created_by;
  const canDelete = userRole === 'gc_admin' || userRole === 'project_manager';
  const canApprove = userRole === 'gc_admin' || userRole === 'project_manager';

  const isOverdue =
    task.due_date &&
    new Date(task.due_date) < new Date() &&
    task.status !== 'completed';

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    const formData = new FormData(e.currentTarget);
    formData.append('id', task.id);

    const result = await updateTask(formData);

    if (result?.error) {
      setError(result.error);
    } else {
      setSuccessMessage('Task updated successfully');
      setIsEditMode(false);
      setTimeout(() => setSuccessMessage(null), 3000);
    }

    setIsSaving(false);
  };

  const handleStatusChange = async (newStatus: TaskStatus) => {
    if (newStatus === task.status) return;

    if (newStatus === 'blocked') {
      setPendingStatus(newStatus);
      setShowBlockedModal(true);
      return;
    }

    setError(null);
    const result = await updateTaskStatus(task.id, newStatus);
    if (result?.error) {
      setError(result.error);
    }
  };

  const handleBlockedConfirm = async (reason: string) => {
    setShowBlockedModal(false);
    if (!pendingStatus) return;

    setError(null);
    const result = await updateTaskStatus(task.id, pendingStatus, reason);
    if (result?.error) {
      setError(result.error);
    }
    setPendingStatus(null);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);

    const result = await deleteTask(task.id);

    if (result?.error) {
      setError(result.error);
      setIsDeleting(false);
    } else {
      router.push('/app/tasks');
    }
  };

  // Debug: Handle approval workflow actions
  const handleApprovalAction = async (action: ApprovalStatus) => {
    console.log('[TaskDetail] Approval action:', action);
    setApprovalAction(action);

    // For approved, execute immediately; for others, show notes modal
    if (action === 'approved') {
      await executeApproval(action, '');
    } else {
      setShowApprovalModal(true);
    }
  };

  const executeApproval = async (status: ApprovalStatus, notes: string) => {
    console.log('[TaskDetail] Executing approval:', { status, notes });
    setIsUpdatingApproval(true);
    setError(null);

    const result = await updateApprovalStatus(task.id, status, notes);

    if (result?.error) {
      console.error('[TaskDetail] Approval error:', result.error);
      setError(result.error);
    } else {
      setSuccessMessage(`Task ${status === 'approved' ? 'approved' : status === 'rejected' ? 'rejected' : 'sent for revision'} successfully`);
      setTimeout(() => setSuccessMessage(null), 3000);
    }

    setIsUpdatingApproval(false);
    setShowApprovalModal(false);
    setApprovalNotes('');
    setApprovalAction(null);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const StatusIcon = STATUS_CONFIG[task.status as TaskStatus].icon;

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-4"
      >
        {/* Title and Actions */}
        <div className="flex items-start justify-between gap-6">
          <div className="flex-1 min-w-0">
            <h1 className="text-4xl font-black text-construction-blue leading-tight mb-3 tracking-tight">
              {task.title}
            </h1>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>Created by {task.creator?.name || 'Unknown'}</span>
              </div>
              <span className="text-gray-400">•</span>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{formatDate(task.created_at)}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {canEdit && (
              <Button
                variant="outline"
                size="lg"
                onClick={() => setIsEditMode(!isEditMode)}
                className="gap-2 border-2 border-construction-blue/20 text-construction-blue hover:bg-construction-blue/10 font-semibold"
              >
                <Pencil className="h-4 w-4" />
                {isEditMode ? 'Cancel Edit' : 'Edit Task'}
              </Button>
            )}
          </div>
        </div>

        {/* Task Type, Status and Priority Badges */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Debug: Task Type Badge - always show, read-only */}
          <TaskTypeBadge type={taskType} />

          <Badge
            className={cn(
              'px-4 py-2 text-sm font-bold border-2 flex items-center gap-2',
              STATUS_CONFIG[task.status as TaskStatus].color
            )}
          >
            <div className={cn('h-2 w-2 rounded-full', STATUS_CONFIG[task.status as TaskStatus].dotColor)} />
            <StatusIcon className="h-4 w-4" />
            {STATUS_CONFIG[task.status as TaskStatus].label}
          </Badge>

          <Badge
            className={cn(
              'px-4 py-2 text-sm font-bold border-2',
              PRIORITY_CONFIG[task.priority as TaskPriority].color
            )}
          >
            {PRIORITY_CONFIG[task.priority as TaskPriority].label} Priority
          </Badge>

          {/* Debug: Approval Status Badge for Approval Tasks */}
          {isApprovalTask && task.approval_status && (
            <Badge
              className={cn(
                'px-4 py-2 text-sm font-bold border-2 flex items-center gap-2',
                APPROVAL_STATUS_CONFIG[task.approval_status as ApprovalStatus].bgColor,
                APPROVAL_STATUS_CONFIG[task.approval_status as ApprovalStatus].color
              )}
            >
              {(() => {
                const Icon = APPROVAL_STATUS_CONFIG[task.approval_status as ApprovalStatus].icon;
                return <Icon className="h-4 w-4" />;
              })()}
              {APPROVAL_STATUS_CONFIG[task.approval_status as ApprovalStatus].label}
            </Badge>
          )}

          {isOverdue && (
            <Badge
              variant="destructive"
              className="px-4 py-2 text-sm font-bold border-2 border-red-300 flex items-center gap-2"
            >
              <AlertTriangle className="h-4 w-4" />
              Overdue
            </Badge>
          )}
        </div>

        {/* Error/Success Messages */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-red-50 border-2 border-red-200 text-red-700 px-6 py-4 rounded-lg text-sm font-medium flex items-center gap-3"
            >
              <AlertTriangle className="h-5 w-5" />
              {error}
            </motion.div>
          )}
          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-green-50 border-2 border-green-200 text-green-700 px-6 py-4 rounded-lg text-sm font-medium flex items-center gap-3"
            >
              <CheckCircle2 className="h-5 w-5" />
              {successMessage}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Blocked Reason Banner */}
        {task.status === 'blocked' && task.blocked_reason && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-red-50 border-2 border-red-200 rounded-lg p-5"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-red-900 mb-1">Task Blocked</h3>
                <p className="text-red-700 text-sm">{task.blocked_reason}</p>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Main Content (2/3) */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="lg:col-span-2 space-y-6"
        >
          {/* Tab Navigation */}
          <div className="flex items-center gap-2 border-b-2 border-gray-200">
            <button
              onClick={() => setActiveTab('overview')}
              className={cn(
                'px-6 py-3 font-bold text-sm transition-all flex items-center gap-2 border-b-2 -mb-[2px]',
                activeTab === 'overview'
                  ? 'text-construction-blue border-construction-blue'
                  : 'text-gray-500 border-transparent hover:text-gray-700'
              )}
            >
              <FileText className="h-4 w-4" />
              Overview
            </button>
            <button
              onClick={() => setActiveTab('materials')}
              className={cn(
                'px-6 py-3 font-bold text-sm transition-all flex items-center gap-2 border-b-2 -mb-[2px]',
                activeTab === 'materials'
                  ? 'text-construction-blue border-construction-blue'
                  : 'text-gray-500 border-transparent hover:text-gray-700'
              )}
            >
              <Package className="h-4 w-4" />
              Materials
            </button>
            <button
              onClick={() => setActiveTab('activity')}
              className={cn(
                'px-6 py-3 font-bold text-sm transition-all flex items-center gap-2 border-b-2 -mb-[2px]',
                activeTab === 'activity'
                  ? 'text-construction-blue border-construction-blue'
                  : 'text-gray-500 border-transparent hover:text-gray-700'
              )}
            >
              <Activity className="h-4 w-4" />
              Activity
              {activity.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-2 text-xs">
                  {activity.length}
                </Badge>
              )}
            </button>
            <button
              onClick={() => setActiveTab('dependencies')}
              className={cn(
                'px-6 py-3 font-bold text-sm transition-all flex items-center gap-2 border-b-2 -mb-[2px]',
                activeTab === 'dependencies'
                  ? 'text-construction-blue border-construction-blue'
                  : 'text-gray-500 border-transparent hover:text-gray-700'
              )}
            >
              <LinkIcon className="h-4 w-4" />
              Dependencies
              {(dependencies.length + dependents.length) > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-2 text-xs">
                  {dependencies.length + dependents.length}
                </Badge>
              )}
            </button>
          </div>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="border-2 border-gray-200 shadow-construction">
                  <CardHeader className="border-b-2 border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                    <CardTitle className="text-lg font-black text-construction-blue flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Task Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    {isEditMode ? (
                      <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Assigned Materials - View Only */}
                        <div className="space-y-3 pb-6 border-b-2 border-gray-100">
                          <div className="flex items-center gap-2">
                            <Package className="h-5 w-5 text-construction-blue" />
                            <h3 className="text-sm font-bold text-gray-900">Assigned Materials</h3>
                            <p className="text-xs text-gray-500">Materials for this task</p>
                          </div>
                          <div className="max-h-80 overflow-y-auto">
                            <TaskMaterials taskId={task.id} canEdit={false} />
                          </div>
                        </div>

                        {/* Title */}
                        <div className="space-y-2">
                          <Label htmlFor="title" className="text-sm font-bold text-gray-700">
                            Task Title
                          </Label>
                          <Input
                            id="title"
                            name="title"
                            defaultValue={task.title}
                            required
                            className="border-2 border-gray-200 focus:border-construction-blue font-medium"
                          />
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                          <Label htmlFor="description" className="text-sm font-bold text-gray-700">
                            Description
                          </Label>
                          <Textarea
                            id="description"
                            name="description"
                            defaultValue={task.description || ''}
                            rows={6}
                            className="border-2 border-gray-200 focus:border-construction-blue font-medium resize-none"
                            placeholder="Describe the task in detail..."
                          />
                        </div>

                        {/* Phase and Assignee */}
                        <div className="grid gap-6 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="phase_id" className="text-sm font-bold text-gray-700">
                              Project Phase
                            </Label>
                            <Select
                              name="phase_id"
                              defaultValue={task.phase_id || 'none'}
                            >
                              <SelectTrigger className="border-2 border-gray-200 focus:border-construction-blue font-medium">
                                <SelectValue placeholder="Select phase" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">No phase</SelectItem>
                                {phases.map((phase) => (
                                  <SelectItem key={phase.id} value={phase.id}>
                                    {phase.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="assignee_id" className="text-sm font-bold text-gray-700">
                              Assignee
                            </Label>
                            <Select
                              name="assignee_id"
                              defaultValue={task.assignee_id || 'none'}
                            >
                              <SelectTrigger className="border-2 border-gray-200 focus:border-construction-blue font-medium">
                                <SelectValue placeholder="Select assignee" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">Unassigned</SelectItem>
                                {teamMembers.map((member) => (
                                  <SelectItem key={member.id} value={member.id}>
                                    {member.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {/* Due Date and Priority */}
                        <div className="grid gap-6 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="due_date" className="text-sm font-bold text-gray-700">
                              Due Date
                            </Label>
                            <Input
                              id="due_date"
                              name="due_date"
                              type="date"
                              defaultValue={task.due_date || ''}
                              className="border-2 border-gray-200 focus:border-construction-blue font-medium"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="priority" className="text-sm font-bold text-gray-700">
                              Priority Level
                            </Label>
                            <Select
                              name="priority"
                              defaultValue={task.priority}
                            >
                              <SelectTrigger className="border-2 border-gray-200 focus:border-construction-blue font-medium">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(PRIORITY_CONFIG).map(([value, config]) => (
                                  <SelectItem key={value} value={value}>
                                    {config.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {/* Cost Fields - Hide for Approval tasks */}
                        {showCostFields && (
                          <div className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-2">
                              <Label htmlFor="planned_cost" className="text-sm font-bold text-gray-700">
                                {isPurchaseTask ? 'Budget Estimate' : 'Planned Cost'}
                              </Label>
                              <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                                <Input
                                  id="planned_cost"
                                  name="planned_cost"
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  defaultValue={task.planned_cost || ''}
                                  className="border-2 border-gray-200 focus:border-construction-blue font-medium pl-10"
                                  placeholder="0.00"
                                />
                              </div>
                            </div>

                            {/* Debug: Actual Cost - READ-ONLY (auto-calculated by trigger) */}
                            <div className="space-y-2">
                              <Label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                Actual Cost
                                <span className="text-xs font-normal text-gray-400">(auto-calculated)</span>
                              </Label>
                              <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                  type="text"
                                  value={task.actual_cost ? formatCurrency(task.actual_cost) : '$0.00'}
                                  disabled
                                  className="border-2 border-gray-200 bg-gray-50 font-medium pl-10 cursor-not-allowed text-gray-600"
                                />
                              </div>
                              <p className="text-xs text-gray-500">
                                Calculated from materials + approved expenses
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Form Actions */}
                        <div className="flex justify-end gap-3 pt-4 border-t-2 border-gray-100">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsEditMode(false)}
                            className="border-2"
                          >
                            Cancel
                          </Button>
                          <Button
                            type="submit"
                            disabled={isSaving}
                            className="text-white bg-construction-blue hover:bg-construction-blue/90 font-bold gap-2"
                          >
                            <Save className="h-4 w-4" />
                            {isSaving ? 'Saving...' : 'Save Changes'}
                          </Button>
                        </div>
                      </form>
                    ) : (
                      <div className="space-y-6">
                        {/* Description */}
                        <div>
                          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                            Description
                          </h3>
                          <p className="text-gray-700 leading-relaxed">
                            {task.description || (
                              <span className="text-gray-400 italic">No description provided</span>
                            )}
                          </p>
                        </div>

                        {/* Task Metrics */}
                        {(task.planned_cost || task.actual_cost) && (
                          <div className="pt-4 border-t-2 border-gray-100">
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                              Cost Tracking
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                              {task.planned_cost && (
                                <div className="bg-gray-50 rounded-lg p-4 border-2 border-gray-100">
                                  <div className="text-xs font-bold text-gray-500 mb-1">Planned</div>
                                  <div className="text-2xl font-black text-construction-blue">
                                    {formatCurrency(task.planned_cost)}
                                  </div>
                                </div>
                              )}
                              {task.actual_cost && (
                                <div className="bg-gray-50 rounded-lg p-4 border-2 border-gray-100">
                                  <div className="text-xs font-bold text-gray-500 mb-1">Actual</div>
                                  <div className="text-2xl font-black text-construction-blue">
                                    {formatCurrency(task.actual_cost)}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {activeTab === 'materials' && (
              <motion.div
                key="materials"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <TaskMaterials taskId={task.id} canEdit={canEdit} />
              </motion.div>
            )}

            {activeTab === 'activity' && (
              <motion.div
                key="activity"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <TaskActivityLog taskId={task.id} activity={activity} />
              </motion.div>
            )}

            {activeTab === 'dependencies' && (
              <motion.div
                key="dependencies"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <TaskDependencies
                  taskId={task.id}
                  projectId={task.project_id}
                  dependencies={dependencies}
                  dependents={dependents}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Right Sidebar (1/3) */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="space-y-6"
        >
          {/* Status Card */}
          <Card className="border-2 border-gray-200 shadow-construction">
            <CardHeader className="border-b-2 border-gray-100 bg-gradient-to-r from-gray-50 to-white">
              <CardTitle className="text-sm font-black text-gray-700 uppercase tracking-wider">
                Status
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <Select value={task.status} onValueChange={handleStatusChange}>
                <SelectTrigger
                  className={cn(
                    'border-2 font-bold h-12',
                    STATUS_CONFIG[task.status as TaskStatus].color
                  )}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_CONFIG).map(([value, config]) => (
                    <SelectItem key={value} value={value} className="font-medium">
                      <div className="flex items-center gap-2">
                        <div className={cn('h-2 w-2 rounded-full', config.dotColor)} />
                        {config.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Assignee Card */}
          <Card className="border-2 border-gray-200 shadow-construction">
            <CardHeader className="border-b-2 border-gray-100 bg-gradient-to-r from-gray-50 to-white">
              <CardTitle className="text-sm font-black text-gray-700 uppercase tracking-wider">
                Assignee
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {task.assignee ? (
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 border-2 border-construction-blue/20">
                    <AvatarImage src={task.assignee.avatar_url || undefined} />
                    <AvatarFallback className="bg-construction-blue text-white font-bold">
                      {getInitials(task.assignee.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 truncate">{task.assignee.name}</p>
                    <p className="text-sm text-gray-500 truncate">{task.assignee.email}</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 text-gray-400 py-2">
                  <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
                    <User className="h-6 w-6" />
                  </div>
                  <span className="font-medium">Unassigned</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Task Info Card */}
          <Card className="border-2 border-gray-200 shadow-construction">
            <CardHeader className="border-b-2 border-gray-100 bg-gradient-to-r from-gray-50 to-white">
              <CardTitle className="text-sm font-black text-gray-700 uppercase tracking-wider">
                Task Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {task.due_date && (
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-construction-blue/10 rounded-lg">
                    <Calendar className="h-4 w-4 text-construction-blue" />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Due Date</div>
                    <div className={cn(
                      "text-sm font-bold mt-0.5",
                      isOverdue ? "text-red-600" : "text-gray-900"
                    )}>
                      {formatDate(task.due_date)}
                    </div>
                  </div>
                </div>
              )}

              {task.phase && (
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-construction-blue/10 rounded-lg">
                    <Layers className="h-4 w-4 text-construction-blue" />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Phase</div>
                    <div className="text-sm font-bold text-gray-900 mt-0.5">{task.phase.name}</div>
                  </div>
                </div>
              )}

              {(task.planned_cost || task.actual_cost) && (
                <div className="pt-3 border-t-2 border-gray-100 space-y-3">
                  {task.planned_cost && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Planned Cost
                      </span>
                      <span className="text-sm font-bold text-gray-900">
                        {formatCurrency(task.planned_cost)}
                      </span>
                    </div>
                  )}
                  {task.actual_cost && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Actual Cost
                      </span>
                      <span className="text-sm font-bold text-construction-blue">
                        {formatCurrency(task.actual_cost)}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Debug: Approval Workflow Card - Only for approval-type tasks */}
          {isApprovalTask && canApprove && task.approval_status === 'pending' && (
            <Card className="border-2 border-amber-200 shadow-construction">
              <CardHeader className="border-b-2 border-amber-100 bg-gradient-to-r from-amber-50 to-white">
                <CardTitle className="text-sm font-black text-amber-700 uppercase tracking-wider flex items-center gap-2">
                  <ThumbsUp className="h-4 w-4" />
                  Approval Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <p className="text-sm text-gray-600 mb-4">
                  Review and take action on this approval request.
                </p>
                <Button
                  onClick={() => handleApprovalAction('approved')}
                  disabled={isUpdatingApproval}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold gap-2 h-11"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Approve
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleApprovalAction('revision_requested')}
                  disabled={isUpdatingApproval}
                  className="w-full border-2 border-orange-300 text-orange-700 hover:bg-orange-50 font-bold gap-2 h-11"
                >
                  <RotateCcw className="h-4 w-4" />
                  Request Revision
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleApprovalAction('rejected')}
                  disabled={isUpdatingApproval}
                  className="w-full border-2 border-red-300 text-red-700 hover:bg-red-50 font-bold gap-2 h-11"
                >
                  <Ban className="h-4 w-4" />
                  Reject
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Debug: Approval Info Card - Show approval details when approved/rejected/revision */}
          {isApprovalTask && task.approval_status && task.approval_status !== 'pending' && (
            <Card className={cn(
              'border-2 shadow-construction',
              task.approval_status === 'approved' ? 'border-green-200' :
              task.approval_status === 'rejected' ? 'border-red-200' :
              'border-orange-200'
            )}>
              <CardHeader className={cn(
                'border-b-2 bg-gradient-to-r to-white',
                task.approval_status === 'approved' ? 'border-green-100 from-green-50' :
                task.approval_status === 'rejected' ? 'border-red-100 from-red-50' :
                'border-orange-100 from-orange-50'
              )}>
                <CardTitle className={cn(
                  'text-sm font-black uppercase tracking-wider flex items-center gap-2',
                  APPROVAL_STATUS_CONFIG[task.approval_status as ApprovalStatus].color
                )}>
                  {(() => {
                    const Icon = APPROVAL_STATUS_CONFIG[task.approval_status as ApprovalStatus].icon;
                    return <Icon className="h-4 w-4" />;
                  })()}
                  {APPROVAL_STATUS_CONFIG[task.approval_status as ApprovalStatus].label}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                {task.approved_by && (
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <User className="h-4 w-4 text-gray-500" />
                    </div>
                    <div className="flex-1">
                      <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                        {task.approval_status === 'approved' ? 'Approved By' : 'Reviewed By'}
                      </div>
                      <div className="text-sm font-bold text-gray-900 mt-0.5">
                        {/* Would need to fetch user name */}
                        Reviewer
                      </div>
                    </div>
                  </div>
                )}
                {task.approved_at && (
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <Calendar className="h-4 w-4 text-gray-500" />
                    </div>
                    <div className="flex-1">
                      <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Date
                      </div>
                      <div className="text-sm font-bold text-gray-900 mt-0.5">
                        {formatDate(task.approved_at)}
                      </div>
                    </div>
                  </div>
                )}
                {task.approval_notes && (
                  <div className="pt-3 border-t-2 border-gray-100">
                    <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                      Notes
                    </div>
                    <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                      {task.approval_notes}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Danger Zone */}
          {canDelete && (
            <Card className="border-2 border-red-200 shadow-construction">
              <CardHeader className="border-b-2 border-red-100 bg-gradient-to-r from-red-50 to-white">
                <CardTitle className="text-sm font-black text-red-700 uppercase tracking-wider">
                  Danger Zone
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      className="w-full font-bold gap-2 h-11"
                      disabled={isDeleting}
                    >
                      <Trash2 className="h-4 w-4" />
                      {isDeleting ? 'Deleting...' : 'Delete Task'}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="border-2">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-xl font-black text-gray-900">
                        Delete this task?
                      </AlertDialogTitle>
                      <AlertDialogDescription className="text-base">
                        This will permanently delete &quot;{task.title}&quot; and all its
                        activity history. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="border-2 font-bold">Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete}
                        className="bg-red-600 hover:bg-red-700 font-bold"
                      >
                        Delete Task
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>

      {/* Blocked Reason Modal */}
      <BlockedReasonModal
        isOpen={showBlockedModal}
        onClose={() => {
          setShowBlockedModal(false);
          setPendingStatus(null);
        }}
        onConfirm={handleBlockedConfirm}
      />

      {/* Debug: Approval Notes Modal */}
      <AlertDialog open={showApprovalModal} onOpenChange={setShowApprovalModal}>
        <AlertDialogContent className="border-2">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-black text-gray-900">
              {approvalAction === 'rejected' ? 'Reject Task' : 'Request Revision'}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              {approvalAction === 'rejected'
                ? 'Please provide a reason for rejecting this approval request.'
                : 'Please describe what changes are needed.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="approval-notes" className="text-sm font-bold text-gray-700">
              {approvalAction === 'rejected' ? 'Rejection Reason' : 'Revision Notes'}
              <span className="text-red-500 ml-1">*</span>
            </Label>
            <Textarea
              id="approval-notes"
              value={approvalNotes}
              onChange={(e) => setApprovalNotes(e.target.value)}
              placeholder={
                approvalAction === 'rejected'
                  ? 'Explain why this request is being rejected...'
                  : 'Describe the changes or revisions needed...'
              }
              rows={4}
              className="mt-2 border-2 border-gray-200 focus:border-construction-blue resize-none"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="border-2 font-bold"
              onClick={() => {
                setApprovalNotes('');
                setApprovalAction(null);
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (approvalAction && approvalNotes.trim()) {
                  executeApproval(approvalAction, approvalNotes);
                }
              }}
              disabled={!approvalNotes.trim() || isUpdatingApproval}
              className={cn(
                'font-bold',
                approvalAction === 'rejected'
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-orange-600 hover:bg-orange-700'
              )}
            >
              {isUpdatingApproval
                ? 'Processing...'
                : approvalAction === 'rejected'
                ? 'Reject'
                : 'Request Revision'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
