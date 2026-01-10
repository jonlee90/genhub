'use client';

import React, { useState, useTransition, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
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
  ArrowRight,
  ArrowLeft,
  Check,
  XCircle,
  RotateCcw,
  MessageSquare,
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
import { createTask, updateTask, updateApprovalStatus } from '@/app/actions/tasks';
import { TaskMaterialsManager, type TempMaterial } from './TaskMaterialsManager';
import { CreatorBadge } from '@/components/ui/CreatorBadge';
import { TaskTypeSelector, TaskTypeBadge, getTaskTypeInfo } from './TaskTypeSelector';
import { getTaskTypeConfig, isFieldVisible } from '@/lib/config/task-type-fields';
import { TaskExpensesSection, type TaskExpense } from './TaskExpensesSection';
import { TaskReceiptUpload } from './TaskReceiptUpload';
import { AssigneeMultiSelect } from './AssigneeMultiSelect';
import { getTaskExpenses } from '@/app/actions/expenses';
import type { TaskAssignee } from '@/app/actions/tasks';
import { addProductToTask } from '@/app/actions/materials';
import { BaseModal } from '@/components/ui/BaseModal';
import type { Database } from '@/types/database.types';
import type { HomeDepotProduct } from '@/lib/services/home-depot-api';

type TaskType = Database['public']['Enums']['task_type'];
type TaskStatus = Database['public']['Enums']['task_status'];
type ApprovalStatus = Database['public']['Enums']['approval_status'];

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
  creator?: {
    id: string;
    name: string;
    email: string;
    avatar_url: string | null;
  } | null;
  approver?: {
    id: string;
    name: string;
    email: string;
    avatar_url: string | null;
  } | null;
  assignees?: Array<{
    id: string;
    user_id: string | null;
    subcontractor_id: string | null;
    user?: {
      id: string;
      name: string;
      avatar_url: string | null;
    } | null;
    subcontractor?: {
      id: string;
      contact_name: string;
      company_name: string;
    } | null;
  }>;
};

interface Project {
  id: string;
  name: string;
  status?: string;
  health_score?: number | null;
  completion_percentage?: number | null;
  project_phases?: Array<{
    id: string;
    name: string;
    order_index?: number;
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
  tasks?: Array<{ id: string; title: string; project_id: string }>; // Optional: for expense modal task selection
}

// Status configuration for task workflow
const STATUS_CONFIG = {
  todo: {
    label: 'To Do',
    color: 'bg-gray-100 text-gray-800',
    icon: 'text-gray-500',
  },
  in_progress: {
    label: 'In Progress',
    color: 'bg-blue-100 text-blue-800',
    icon: 'text-blue-500',
  },
  review: {
    label: 'Review',
    color: 'bg-amber-100 text-amber-800',
    icon: 'text-amber-500',
  },
  blocked: {
    label: 'Blocked',
    color: 'bg-red-100 text-red-800',
    icon: 'text-red-500',
  },
  completed: {
    label: 'Completed',
    color: 'bg-emerald-100 text-emerald-800',
    icon: 'text-emerald-500',
  },
};

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

// Note: Priority-based theming removed - all modals now use 'default' theme
// to maintain consistent construction blue (#001B51) branding

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
  tasks = [], // Default to empty array
}: Omit<TaskModalProps, 'isOpen'>) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Debug: Expense state for TaskExpensesSection (Subtask 5.2)
  const [expenses, setExpenses] = useState<TaskExpense[]>([]);
  const [expensesLoading, setExpensesLoading] = useState(false);

  // Debug: Temporary materials for create mode (will be associated after task creation)
  const [tempMaterials, setTempMaterials] = useState<TempMaterial[]>([]);

  // Debug: Receipt photo state
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(() => {
    if (mode === 'edit' && task?.receipt_photo_url) return task.receipt_photo_url;
    return null;
  });

  // DEBUG: Log modal rendering
  console.log('[TaskModalForm] Rendering in mode:', mode, {
    taskId: task?.id,
    taskTitle: task?.title,
    taskType: task?.task_type,
    approvalStatus: task?.approval_status,
    creator: task?.creator?.name,
  });

  // Step state for create mode (Step 1: Select Type, Step 2: Fill Form)
  const [currentStep, setCurrentStep] = useState<1 | 2>(mode === 'edit' ? 2 : 1);

  // Task type state - for new tasks, null until selected; for edit, use existing
  const [taskType, setTaskType] = useState<TaskType | null>(() => {
    if (mode === 'edit' && task) return task.task_type;
    return null;
  });

  // DEBUG: Get field visibility config based on task type and mode
  const config = useMemo(() => {
    const cfg = getTaskTypeConfig(taskType);
    console.log('[TaskModalForm] Field config for task type:', taskType, {
      mode,
      config: cfg,
    });
    return cfg;
  }, [taskType, mode]);

  // Approval workflow state
  const [approvalNotes, setApprovalNotes] = useState('');
  const [isApprovalPending, setIsApprovalPending] = useState(false);

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
    // Use config defaults for priority
    const cfg = getTaskTypeConfig(taskType);
    const defaultPriority = cfg.defaults.priority || 'medium';
    console.log('[TaskModalForm] Setting default priority for taskType:', taskType, 'to', defaultPriority);
    return defaultPriority;
  });
  const [phaseId, setPhaseId] = useState(() => {
    if (mode === 'edit' && task) return task.phase_id || 'none';
    return preselectedPhaseId || 'none';
  });
  const [startDate, setStartDate] = useState(() => {
    if (mode === 'edit' && task && task.start_date) return task.start_date.split('T')[0];
    // Use config defaults for start date
    const cfg = getTaskTypeConfig(taskType);
    if (cfg.defaults.startDate === 'today') {
      const today = new Date().toISOString().split('T')[0];
      console.log('[TaskModalForm] Setting default start date to today:', today);
      return today;
    }
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
  const [status, setStatus] = useState<string>(() => {
    if (mode === 'edit' && task) return task.status;
    return 'todo';
  });

  // Multi-assignee state
  const [selectedAssignees, setSelectedAssignees] = useState<TaskAssignee[]>(() => {
    if (mode === 'edit' && task?.assignees) {
      return task.assignees.map((a) => ({
        id: a.user_id || a.subcontractor_id || '',
        type: (a.user_id ? 'user' : 'subcontractor') as 'user' | 'subcontractor'
      })).filter((a): a is TaskAssignee => !!a.id);
    }
    return [];
  });

  // Get current theme based on mode and priority
  const theme = getTheme(mode, priority);

  // Get phases for selected project
  const selectedProject = projects.find((p) => p.id === selectedProjectId);
  const phases = selectedProject?.project_phases || [];

  // Debug: Fetch expenses for task (Subtask 5.2)
  const fetchExpenses = async () => {
    if (!task?.id) {
      console.log('[TaskModalForm] No task ID, skipping expense fetch');
      return;
    }

    console.log('[TaskModalForm] Fetching expenses for task:', task.id);
    setExpensesLoading(true);

    try {
      const result = await getTaskExpenses(task.id);
      if (result.success && result.data) {
        setExpenses(result.data);
        console.log('[TaskModalForm] Loaded expenses:', result.data.length);
      } else {
        console.error('[TaskModalForm] Failed to load expenses:', result.error);
        setExpenses([]);
      }
    } catch (error) {
      console.error('[TaskModalForm] Error fetching expenses:', error);
      setExpenses([]);
    } finally {
      setExpensesLoading(false);
    }
  };

  // Debug: Fetch expenses when modal opens in edit mode (Subtask 5.2)
  // fetchExpenses is excluded from deps as it's a stable function reference
  // task.id and mode changes trigger refetch when modal opens in edit mode
  useEffect(() => {
    if (task?.id && mode === 'edit') {
      console.log('[TaskModalForm] Modal opened in edit mode, fetching expenses');
      fetchExpenses();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task?.id, mode]);

  // Debug: Callback for expense added (Subtask 5.4)
  // CRITICAL: Only refresh expenses, do NOT call onSuccess (which closes the modal)
  const handleExpenseAdded = async () => {
    console.log('[TaskModalForm] Expense added successfully, refreshing expense list');
    await fetchExpenses();
    // NOTE: Do NOT call onSuccess() here - that would close the TaskModal
    // We only want to refresh the expense list so user can see the new expense
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // DEBUG: Log form submission
    console.log('[TaskModalForm] Submitting form', {
      mode,
      taskType,
      title,
      selectedProjectId,
    });

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

    // Add receipt photo URL if available
    if (receiptPreview) {
      formData.append('receipt_photo_url', receiptPreview);
      console.log('[TaskModalForm] Adding receipt_photo_url to form');
    }

    // Add task_type for new tasks
    if (mode === 'create' && taskType) {
      formData.append('task_type', taskType);
      console.log('[TaskModalForm] Adding task_type to form:', taskType);
    }

    if (mode === 'edit' && task) {
      formData.append('id', task.id);
      formData.append('actual_cost', actualCost);
      formData.append('status', status);
    }

    // Add multi-assignee data
    if (selectedAssignees.length > 0) {
      formData.append('assignee_ids', JSON.stringify(selectedAssignees));
      console.log('[TaskModalForm] Adding assignee_ids to form:', selectedAssignees);
    }

    startTransition(async () => {
      try {
        const result = mode === 'create'
          ? await createTask({ error: null, fieldErrors: null, success: false, task: null }, formData)
          : await updateTask(formData);

        if (result?.error) {
          setError(result.error);
        } else {
          // Debug: If creating task with temp materials, associate them now
          if (mode === 'create' && result?.task && tempMaterials.length > 0) {
            console.log('[TaskModalForm] Task created, associating', tempMaterials.length, 'temp materials');

            try {
              // Associate all temp materials with the newly created task
              const materialPromises = tempMaterials.map(async (tempMaterial) => {
                const product: HomeDepotProduct = {
                  id: tempMaterial.product_id,
                  name: tempMaterial.product_name,
                  sku: tempMaterial.sku,
                  category: tempMaterial.category,
                  price: tempMaterial.price,
                  unitOfMeasure: tempMaterial.unit_of_measure,
                  imageUrl: tempMaterial.image_url || '',
                  stockStatus: (tempMaterial.stock_status as HomeDepotProduct['stockStatus']) || 'in_stock',
                  description: '',
                  manufacturer: '',
                  productUrl: '',
                  leadTimeDays: 0,
                  specifications: {},
                };

                return addProductToTask(
                  product,
                  result.task.id,
                  result.task.project_id,
                  tempMaterial.quantity
                );
              });

              await Promise.all(materialPromises);
              console.log('[TaskModalForm] All temp materials associated successfully');
            } catch (materialError) {
              console.error('[TaskModalForm] Error associating materials:', materialError);
              // Don't fail the task creation, just log the error
              // Materials can be added manually after
            }
          }

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

  // Handler for approval status updates
  const handleApprovalAction = async (newStatus: ApprovalStatus) => {
    if (!task?.id) return;

    console.log('[TaskModalForm] Updating approval status:', {
      taskId: task.id,
      newStatus,
      approvalNotes,
    });

    setIsApprovalPending(true);
    setError(null);

    try {
      const result = await updateApprovalStatus(task.id, newStatus, approvalNotes || undefined);

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
    } finally {
      setIsApprovalPending(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Render Step 1: Task Type Selection (Create mode only)
  if (mode === 'create' && currentStep === 1) {
    return (
      <BaseModal
        isOpen={true}
        onClose={onClose}
        icon={ClipboardList}
        title="Select Task Type"
        subtitle="Choose the type of task you want to create"
        theme="default"
        maxWidth="2xl"
        rightActions={
          <Button
            type="button"
            disabled={!taskType}
            onClick={() => {
              console.log('[TaskModalForm] Moving to step 2 with taskType:', taskType);
              setCurrentStep(2);
            }}
            className="h-10 px-6 font-semibold text-white bg-construction-blue hover:bg-construction-blue/90"
          >
            Next
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        }
      >
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.2 }}
        >
          <TaskTypeSelector
            selectedType={taskType}
            onSelect={(type) => {
              console.log('[TaskModalForm] Task type selected:', type);
              setTaskType(type);

              // Apply task type defaults (Subtask 2.6)
              const cfg = getTaskTypeConfig(type);
              console.log('[TaskModalForm] Applying defaults for type:', type, cfg.defaults);

              // Apply default priority
              if (cfg.defaults.priority) {
                setPriority(cfg.defaults.priority);
                console.log('[TaskModalForm] Set priority to:', cfg.defaults.priority);
              }

              // Apply default start date
              if (cfg.defaults.startDate === 'today') {
                const today = new Date().toISOString().split('T')[0];
                setStartDate(today);
                console.log('[TaskModalForm] Set start date to today:', today);
              }
            }}
            disabled={isPending}
          />
        </motion.div>
      </BaseModal>
    );
  }

  // Render Step 2 (Create mode) or Edit mode
  const modalIcon = mode === 'create' ? ClipboardList : Pencil;
  const modalTitleText = mode === 'create' ? 'Create New Task' : 'Edit Task';

  // Create title with inline task type badge
  const modalTitle = (
    <div className="flex items-center gap-2">
      <span>{modalTitleText}</span>
      {mode === 'edit' && task?.task_type && <TaskTypeBadge type={task.task_type} />}
      {mode === 'create' && taskType && <TaskTypeBadge type={taskType} />}
    </div>
  );

  // Get approval status badge only (task type badge is now in title)
  const approvalBadge = mode === 'edit' && task?.task_type === 'approval' && task.approval_status && config.styling.headerBadge === 'approval_status' && (
    <span className={cn(
      'px-2.5 py-1 rounded-full text-xs font-semibold',
      task.approval_status === 'pending' && 'bg-amber-100 text-amber-800',
      task.approval_status === 'approved' && 'bg-emerald-100 text-emerald-800',
      task.approval_status === 'rejected' && 'bg-red-100 text-red-800',
      task.approval_status === 'revision_requested' && 'bg-orange-100 text-orange-800'
    )}>
      {task.approval_status.replace('_', ' ').toUpperCase()}
    </span>
  );

  return (
    <BaseModal
      isOpen={true}
      onClose={onClose}
      icon={modalIcon}
      title={modalTitleText}
      subtitle={mode === 'edit' && selectedProject ? selectedProject.name : undefined}
      badges={approvalBadge || undefined}
      theme="default"
      maxWidth="2xl"
      formKey={mode === 'edit' && task ? `edit-${task.id}` : 'create'}
      leftActions={
        mode === 'create' ? (
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              console.log('[TaskModalForm] Going back to step 1');
              setCurrentStep(1);
            }}
            disabled={isPending}
            className="h-10 px-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        ) : task?.creator ? (
          <CreatorBadge
            creatorName={task.creator.name}
            createdAt={task.created_at}
            variant="default"
          />
        ) : null
      }
      rightActions={
        <Button
          type="submit"
          form="task-form"
          disabled={isPending || !selectedProjectId || !title.trim()}
          className={cn(
            'h-10 px-6 font-semibold text-white bg-construction-blue hover:bg-blue-700'
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
      }
    >
      <form id="task-form" onSubmit={handleSubmit}>
        <div className="space-y-5">

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

          {/* Step 1: Task Type Selection (Create mode only) */}
          {mode === 'create' && currentStep === 1 && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              <TaskTypeSelector
                selectedType={taskType}
                onSelect={(type) => {
                  console.log('[TaskModalForm] Task type selected:', type);
                  setTaskType(type);

                  // Apply task type defaults (Subtask 2.6)
                  const cfg = getTaskTypeConfig(type);
                  console.log('[TaskModalForm] Applying defaults for type:', type, cfg.defaults);

                  // Apply default priority
                  if (cfg.defaults.priority) {
                    setPriority(cfg.defaults.priority);
                    console.log('[TaskModalForm] Set priority to:', cfg.defaults.priority);
                  }

                  // Apply default start date
                  if (cfg.defaults.startDate === 'today') {
                    const today = new Date().toISOString().split('T')[0];
                    setStartDate(today);
                    console.log('[TaskModalForm] Set start date to today:', today);
                  }
                }}
                disabled={isPending}
              />
            </motion.div>
          )}

          {/* Form Fields (Step 2 or Edit mode) */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-5"
          >
              {/* Approval Status Section - Conditional rendering based on task type (Subtask 2.9) */}
              {isFieldVisible(taskType, 'approvalWorkflow', mode) && task && (
                <div className="p-4 rounded-xl border-2 border-amber-200 bg-amber-50">
                  <div className="flex items-center gap-2 mb-3">
                    <ClipboardList className="w-5 h-5 text-amber-600" />
                    <h3 className="text-sm font-bold text-amber-800">Approval Workflow</h3>
                    {task.approval_status && (
                      <span className={cn(
                        'ml-auto px-2 py-0.5 rounded-full text-xs font-medium',
                        task.approval_status === 'pending' && 'bg-amber-200 text-amber-800',
                        task.approval_status === 'approved' && 'bg-emerald-200 text-emerald-800',
                        task.approval_status === 'rejected' && 'bg-red-200 text-red-800',
                        task.approval_status === 'revision_requested' && 'bg-orange-200 text-orange-800'
                      )}>
                        {task.approval_status.replace('_', ' ').toUpperCase()}
                      </span>
                    )}
                  </div>

                  {/* Approval Notes Input */}
                  <div className="space-y-2 mb-3">
                    <Label htmlFor="approval_notes" className="text-sm font-medium text-amber-700 flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Approval Notes
                    </Label>
                    <Textarea
                      id="approval_notes"
                      value={approvalNotes}
                      onChange={(e) => setApprovalNotes(e.target.value)}
                      placeholder="Add notes for this approval decision..."
                      rows={2}
                      disabled={isApprovalPending || task.approval_status === 'approved'}
                      className="border-amber-200 focus:ring-amber-500/20 focus:border-amber-500 bg-white"
                    />
                  </div>

                  {/* Approval Action Buttons */}
                  {task.approval_status !== 'approved' && (
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => handleApprovalAction('approved')}
                        disabled={isApprovalPending}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white"
                      >
                        {isApprovalPending ? (
                          <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="mr-1 h-4 w-4" />
                        )}
                        Approve
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => handleApprovalAction('revision_requested')}
                        disabled={isApprovalPending}
                        className="border-orange-300 text-orange-700 hover:bg-orange-50"
                      >
                        <RotateCcw className="mr-1 h-4 w-4" />
                        Request Revision
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => handleApprovalAction('rejected')}
                        disabled={isApprovalPending}
                        className="border-red-300 text-red-700 hover:bg-red-50"
                      >
                        <XCircle className="mr-1 h-4 w-4" />
                        Reject
                      </Button>
                    </div>
                  )}

                  {/* Show previous approval info if exists */}
                  {task.approved_by && task.approved_at && (
                    <div className="mt-3 pt-3 border-t border-amber-200 text-xs text-amber-700">
                      Last updated: {new Date(task.approved_at).toLocaleDateString()}
                      {task.approval_notes && (
                        <p className="mt-1 italic">"{task.approval_notes}"</p>
                      )}
                    </div>
                  )}
                </div>
              )}

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

          {/* Status & Phase Row - Phase conditional (Subtask 2.2) */}
          <div className={cn(
            'grid gap-4',
            isFieldVisible(taskType, 'phase', mode) ? 'grid-cols-2' : 'grid-cols-1'
          )}>
            {/* Status field - Edit mode only */}
            {mode === 'edit' && (
              <div className="space-y-2">
                <Label htmlFor="status" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-gray-400" />
                  Status <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={status}
                  onValueChange={setStatus}
                  disabled={isPending}
                >
                  <SelectTrigger id="status" className="h-11 border-gray-200">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_CONFIG).map(([value, config]) => (
                      <SelectItem key={value} value={value} textValue={config.label}>
                        <div className="flex items-center gap-2">
                          <div className={cn('w-2 h-2 rounded-full', config.color.split(' ')[0].replace('bg-', 'bg-'))} />
                          <span>{config.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Phase field - Hidden for admin tasks (Subtask 2.2) */}
            {isFieldVisible(taskType, 'phase', mode) && (
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
                      .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
                      .map((phase) => (
                        <SelectItem key={phase.id} value={phase.id}>
                          {phase.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Assignees & Priority Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="assignee" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <User className="h-4 w-4 text-gray-400" />
                Assignees
              </Label>
              <AssigneeMultiSelect
                projectId={selectedProjectId}
                selectedAssignees={selectedAssignees}
                onChange={setSelectedAssignees}
                disabled={isPending}
              />
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

          {/* Date Range Row - Start Date conditional (Subtask 2.3) */}
          <div className={cn(
            'grid gap-4',
            isFieldVisible(taskType, 'startDate', mode) ? 'grid-cols-2' : 'grid-cols-1'
          )}>
            {/* Start Date - Hidden for admin tasks (Subtask 2.3) */}
            {isFieldVisible(taskType, 'startDate', mode) && (
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
            )}

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

          {/* Costs Row - Conditional rendering and dynamic labels (Subtasks 2.4, 2.5) */}
          {isFieldVisible(taskType, 'plannedCost', mode) && (
            <div className={cn(
              'grid gap-4',
              isFieldVisible(taskType, 'actualCost', mode) ? 'grid-cols-2' : 'grid-cols-1'
            )}>
              {/* Planned Cost with dynamic label (Subtask 2.5) */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-gray-400" />
                  {config.labels.plannedCost}
                </Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={plannedCost}
                  onChange={(e) => setPlannedCost(e.target.value)}
                  placeholder="0.00"
                  disabled={isPending}
                  className={cn(
                    'h-11 border-gray-200',
                    taskType === 'purchase' && 'border-emerald-300 focus:ring-emerald-500/20 focus:border-emerald-500'
                  )}
                />
              </div>

              {/* Actual Cost - Edit mode only (Subtask 2.4) */}
              {isFieldVisible(taskType, 'actualCost', mode) && (
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
          )}

          {/* Receipt Photo Upload - For all task types (especially useful for purchase tasks) */}
          <TaskReceiptUpload
            receiptUrl={receiptPreview}
            onReceiptChange={(file, preview) => {
              console.log('[TaskModal] Receipt changed:', { hasFile: !!file, hasPreview: !!preview });
              setReceiptFile(file);
              setReceiptPreview(preview);
            }}
            disabled={isPending}
            showLabel={true}
            compact={false}
          />

              {/* Materials Section - Conditional rendering with emphasis (Subtasks 2.7, 2.8) */}
              {isFieldVisible(taskType, 'materialsSection', mode) && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                    <Package className="h-4 w-4 text-construction-blue" />
                    <h3 className="text-sm font-bold text-gray-900">
                      Materials
                    </h3>
                    <p className="text-xs ml-auto text-gray-500">
                      {mode === 'create'
                        ? `${tempMaterials.length} material${tempMaterials.length !== 1 ? 's' : ''} selected`
                        : 'Search & manage task materials'}
                    </p>
                  </div>
                  <TaskMaterialsManager
                    taskId={task?.id}
                    projectId={selectedProjectId}
                    mode={mode}
                    tempMaterials={tempMaterials}
                    onTempMaterialsChange={setTempMaterials}
                  />
                </div>
              )}

              {/* Expenses Section - Conditional rendering (Subtask 5.1) */}
              {isFieldVisible(taskType, 'expensesSection', mode) && mode === 'edit' && task && (
                <div className="space-y-2">
                  {expensesLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="w-5 h-5 animate-spin text-[#001B51]" />
                    </div>
                  ) : (
                    <TaskExpensesSection
                      taskId={task.id}
                      taskTitle={task.title}
                      projectId={task.project_id}
                      projectName={projects.find(p => p.id === task.project_id)?.name || ''}
                      expenses={expenses}
                      projects={projects}
                      tasks={tasks}
                      onExpenseAdded={handleExpenseAdded}
                    />
                  )}
                </div>
              )}
          </motion.div>
        </div>
      </form>
    </BaseModal>
  );
}

// Main modal component - handles open/close and passes props to form
// BaseModal now handles responsive behavior (bottom sheet on mobile, centered on desktop)
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
  tasks = [], // Default to empty array
}: TaskModalProps) {
  // Generate a unique key for the form based on mode and task ID
  // This forces React to remount the form component with fresh state
  const formKey = mode === 'edit' && task ? `edit-${task.id}` : 'create';

  // DEBUG: Log modal state
  console.log('[TaskModal] Rendering modal:', {
    isOpen,
    mode,
    taskId: task?.id,
    formKey,
  });

  if (!isOpen) return null;

  return (
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
      tasks={tasks}
    />
  );
}
