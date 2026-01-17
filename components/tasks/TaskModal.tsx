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
  Layers,
  FolderKanban,
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
  Plus,
  Trash2,
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
// Avatar component removed - was unused
import { cn } from '@/lib/utils';
import { createTask, updateTask, updateApprovalStatus, deleteTask } from '@/app/actions/tasks';
import { TaskMaterialsManager, type TempMaterial } from './TaskMaterialsManager';
import { CreatorBadge } from '@/components/ui/CreatorBadge';
import { TaskTypeSelector, TaskTypeBadge, getTaskTypeInfo } from './TaskTypeSelector';
import { getTaskTypeConfig, isFieldVisible } from '@/lib/config/task-type-fields';
import { TaskExpensesSection, type TaskExpense } from './TaskExpensesSection';
import { TaskReceiptUpload } from './TaskReceiptUpload';
import { AssigneeMultiSelect } from './AssigneeMultiSelect';
import { AutoExpenseToggle } from './AutoExpenseToggle';
import { PrimaryAssigneeSelector, type AssigneeOption } from './PrimaryAssigneeSelector';
import { getTaskExpenses, createExpenseFromTask } from '@/app/actions/expenses';
import { useToast } from '@/hooks/use-toast';
import type { TaskAssignee, AssigneeOption as TaskAssigneeOption } from '@/app/actions/tasks';
import { addProductToTask } from '@/app/actions/materials';
import { ResponsiveModal } from '@/components/ui/ResponsiveModal';
import { TASK_STATUS_CONFIG, TASK_PRIORITY_CONFIG } from '@/lib/config/task-colors';
import type { TaskType, TaskStatus, ApprovalStatus } from '@/types/db/enums';
import type { TasksRow } from '@/types/db/tables/tasks';
import type { HomeDepotProduct } from '@/lib/services/home-depot-api';

type Task = TasksRow & {
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
  assignees?: TaskAssigneeOption[]; // Optional: Pre-fetched assignees to avoid N+1 queries
  userRole?: string | null; // User role for permission checks
}

// Note: Status and Priority colors now come from shared config: TASK_STATUS_CONFIG, TASK_PRIORITY_CONFIG
// This ensures consistency with task cards, task list, and other displays

// Default (create mode) uses construction-blue theme
const DEFAULT_THEME = {
  gradient: 'from-construction-blue via-blue-500 to-construction-blue',
  iconBg: 'bg-gradient-to-br from-construction-blue to-blue-600',
  button: 'bg-construction-blue hover:bg-construction-blue/90',
  focusRing: 'focus:ring-construction-blue/20 focus:border-construction-blue',
  iconColor: 'text-construction-blue',
};

// Helper to get theme (now always returns default for consistent branding)
const getTheme = () => DEFAULT_THEME;

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
  assignees, // Optional: Pre-fetched assignees
  userRole, // User role for permission checks
}: Omit<TaskModalProps, 'isOpen'>) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Expense state for TaskExpensesSection (Subtask 5.2)
  const [expenses, setExpenses] = useState<TaskExpense[]>([]);
  const [expensesLoading, setExpensesLoading] = useState(false);

  // Auto-expense state (Task 3.4)
  const [autoExpenseEnabled, setAutoExpenseEnabled] = useState(true);
  const [primaryAssigneeId, setPrimaryAssigneeId] = useState<string | null>(null);

  // Temporary materials for create mode (will be associated after task creation)
  const [tempMaterials, setTempMaterials] = useState<TempMaterial[]>([]);

  // Receipt photo state
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(() => {
    if (mode === 'edit' && task?.receipt_photo_url) return task.receipt_photo_url;
    return null;
  });


  // Step state for create mode (Step 1: Select Type, Step 2: Fill Form)
  const [currentStep, setCurrentStep] = useState<1 | 2>(mode === 'edit' ? 2 : 1);

  // Task type state - for new tasks, null until selected; for edit, use existing
  const [taskType, setTaskType] = useState<TaskType | null>(() => {
    if (mode === 'edit' && task) return task.task_type;
    return null;
  });

  // Get field visibility config based on task type and mode
  const config = useMemo(() => {
    return getTaskTypeConfig(taskType);
  }, [taskType, mode]);

  // Approval workflow state
  const [approvalNotes, setApprovalNotes] = useState('');
  const [isApprovalPending, setIsApprovalPending] = useState(false);

  // Delete confirmation state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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
    return cfg.defaults.priority || 'medium';
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
      return new Date().toISOString().split('T')[0];
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
  const theme = getTheme();

  // Get phases for selected project
  const selectedProject = projects.find((p) => p.id === selectedProjectId);
  const phases = selectedProject?.project_phases || [];

  // Build assignee options for PrimaryAssigneeSelector (Task 3.4)
  const assigneeOptions: AssigneeOption[] = useMemo(() => {
    if (!task?.assignees) return [];
    return task.assignees
      .filter((a) => a.user || a.subcontractor)
      .map((a) => {
        if (a.user) {
          return {
            id: a.user.id,
            type: 'user' as const,
            name: a.user.name,
            avatarUrl: a.user.avatar_url,
          };
        }
        return {
          id: a.subcontractor!.id,
          type: 'subcontractor' as const,
          name: a.subcontractor!.contact_name || a.subcontractor!.company_name,
          companyName: a.subcontractor!.company_name,
        };
      });
  }, [task?.assignees]);

  // Get primary assignee's name for expense vendor_name
  // Uses primary assignee if set, otherwise uses first assignee
  const primaryAssigneeName = useMemo(() => {
    if (primaryAssigneeId) {
      const assignee = assigneeOptions.find((a) => a.id === primaryAssigneeId);
      if (assignee?.name) return assignee.name;
    }
    // Fallback to first assignee if primary not set or not found
    if (assigneeOptions.length > 0) {
      return assigneeOptions[0].name || null;
    }
    return null;
  }, [primaryAssigneeId, assigneeOptions]);

  // Editable expense category state (Task 3.4)
  const [expenseCategory, setExpenseCategory] = useState(() => {
    if (!taskType) return 'other';
    const categoryMap: Record<string, string> = {
      purchase: 'materials',
      labor: 'labor',
      admin: 'other',
      approval: 'other',
      general: 'other',
    };
    return categoryMap[taskType] || 'other';
  });

  // Fetch expenses for task
  const fetchExpenses = async () => {
    if (!task?.id) {
      return;
    }

    setExpensesLoading(true);

    try {
      const result = await getTaskExpenses(task.id);
      if (result.success && result.data) {
        setExpenses(result.data);
      } else {
        setExpenses([]);
      }
    } catch {
      setExpenses([]);
    } finally {
      setExpensesLoading(false);
    }
  };

  // Fetch expenses when modal opens in edit mode
  // fetchExpenses is excluded from deps as it's a stable function reference
  // task.id and mode changes trigger refetch when modal opens in edit mode
  useEffect(() => {
    if (task?.id && mode === 'edit') {
      fetchExpenses();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task?.id, mode]);

  // Callback for expense added
  // CRITICAL: Only refresh expenses, do NOT call onSuccess (which closes the modal)
  const handleExpenseAdded = async () => {
    await fetchExpenses();
    // NOTE: Do NOT call onSuccess() here - that would close the TaskModal
    // We only want to refresh the expense list so user can see the new expense
  };

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

    // Add receipt photo URL if available
    if (receiptPreview) {
      formData.append('receipt_photo_url', receiptPreview);
    }

    // Add task_type for new tasks
    if (mode === 'create' && taskType) {
      formData.append('task_type', taskType);
    }

    if (mode === 'edit' && task) {
      formData.append('id', task.id);
      formData.append('actual_cost', actualCost);
      formData.append('status', status);
    }

    // Add multi-assignee data
    if (selectedAssignees.length > 0) {
      formData.append('assignee_ids', JSON.stringify(selectedAssignees));
    }

    startTransition(async () => {
      try {
        const result = mode === 'create'
          ? await createTask({ error: null, fieldErrors: null, success: false, task: null }, formData)
          : await updateTask(formData);

        if (result?.error) {
          setError(result.error);
        } else {
          // If creating task with temp materials, associate them now
          if (mode === 'create' && result?.task && tempMaterials.length > 0) {
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
            } catch {
              // Materials can be added manually after task creation
            }
          }

          // Auto-create expense if enabled (Task 3.4)
          // Only create expense if:
          // 1. In edit mode
          // 2. Auto-expense is enabled
          // 3. Task exists
          // 4. No expenses already exist for this task
          // 5. Task has an actual cost
          if (
            mode === 'edit' &&
            autoExpenseEnabled &&
            task?.id &&
            expenses.length === 0 &&
            actualCost &&
            parseFloat(actualCost) > 0
          ) {
            try {
              const expenseResult = await createExpenseFromTask(task.id);
              if (expenseResult.data) {
                toast({
                  title: 'Expense Created',
                  description: `Expense for $${parseFloat(actualCost).toFixed(2)} has been created from this task.`,
                  variant: 'default',
                });
                // Refresh expenses list to show the new expense
                await fetchExpenses();
              } else if (expenseResult.error) {
                console.error('Failed to create expense:', expenseResult.error);
                toast({
                  title: 'Warning',
                  description: 'Task saved but expense creation failed.',
                  variant: 'destructive',
                });
              }
            } catch {
              console.error('Error creating expense from task');
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

  // Handler for deleting a task
  const handleDeleteTask = async () => {
    if (!task?.id) return;

    setIsDeleting(true);
    setError(null);

    try {
      const result = await deleteTask(task.id);

      if (result?.error) {
        setError(result.error);
        setShowDeleteConfirm(false);
      } else {
        toast({
          title: 'Task Deleted',
          description: 'The task has been successfully deleted.',
          variant: 'default',
        });
        setTimeout(() => {
          onSuccess?.();
          onClose();
          router.refresh();
        }, 500);
      }
    } catch (err) {
      setError('An unexpected error occurred while deleting the task');
      setShowDeleteConfirm(false);
    } finally {
      setIsDeleting(false);
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
      <ResponsiveModal
        isOpen={true}
        onClose={onClose}
        icon={ClipboardList}
        title="Select Task Type"
        subtitle="Choose the type of task you want to create"
        theme="default"
        maxWidth="2xl"
        snapPoints={['half', 'full']}
        initialSnapPoint="half"
        rightActions={
          <Button
            type="button"
            disabled={!taskType}
            onClick={() => {
              setCurrentStep(2);
            }}
            className="h-10 min-h-[44px] px-6 font-semibold text-white bg-construction-blue hover:bg-construction-blue/90 active:scale-[0.98] transition-transform"
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
              setTaskType(type);

              // Apply task type defaults
              const cfg = getTaskTypeConfig(type);

              // Apply default priority
              if (cfg.defaults.priority) {
                setPriority(cfg.defaults.priority);
              }

              // Apply default start date
              if (cfg.defaults.startDate === 'today') {
                setStartDate(new Date().toISOString().split('T')[0]);
              }
            }}
            disabled={isPending}
          />
        </motion.div>
      </ResponsiveModal>
    );
  }

  // Render Step 2 (Create mode) or Edit mode
  const modalIcon = mode === 'create' ? Plus : Pencil;
  const modalTitleText = mode === 'create' ? 'Add Task' : 'Edit Task';

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
    <ResponsiveModal
      isOpen={true}
      onClose={onClose}
      icon={modalIcon}
      title={modalTitleText}
      subtitle={mode === 'edit' && selectedProject ? selectedProject.name : undefined}
      badges={approvalBadge || undefined}
      theme="default"
      maxWidth="2xl"
      snapPoints={['half', 'full']}
      initialSnapPoint="full"
      formKey={mode === 'edit' && task ? `edit-${task.id}` : 'create'}
      leftActions={
        mode === 'create' ? (
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setCurrentStep(1);
            }}
            disabled={isPending}
            className="h-10 min-h-[44px] px-4 active:scale-[0.98] transition-transform"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            {/* Delete button for admin and project managers only */}
            {(userRole === 'admin' || userRole === 'project_manager') && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isPending || isDeleting}
                className="h-10 min-h-[44px] px-3 text-red-600 hover:text-red-700 hover:bg-red-50 active:scale-[0.98] transition-transform"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
            {task?.creator && (
              <CreatorBadge
                creatorName={task.creator.name}
                createdAt={task.created_at}
                variant="default"
              />
            )}
          </div>
        )
      }
      rightActions={
        <Button
          type="submit"
          form="task-form"
          disabled={isPending || !selectedProjectId || !title.trim()}
          className={cn(
            'h-10 min-h-[44px] px-6 font-semibold text-white bg-construction-blue hover:bg-blue-700 active:scale-[0.98] transition-transform'
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
                  <Plus className="mr-2 h-4 w-4" />
                  Add Task
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
                  setTaskType(type);

                  // Apply task type defaults
                  const cfg = getTaskTypeConfig(type);

                  // Apply default priority
                  if (cfg.defaults.priority) {
                    setPriority(cfg.defaults.priority);
                  }

                  // Apply default start date
                  if (cfg.defaults.startDate === 'today') {
                    setStartDate(new Date().toISOString().split('T')[0]);
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
              {/* Project Selection - Required for create mode */}
              {mode === 'create' && (
                <div className="space-y-2">
                  <Label htmlFor="project" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <FolderKanban className="h-4 w-4 text-gray-400" />
                    Project <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={selectedProjectId}
                    onValueChange={(value) => {
                      setSelectedProjectId(value);
                      // Reset phase when project changes
                      setPhaseId('none');
                    }}
                    disabled={isPending}
                  >
                    <SelectTrigger id="project" className="h-11 border-gray-200">
                      <SelectValue placeholder="Select a project" />
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
              )}

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
          {/* Mobile: Stack vertically, Desktop: 2 columns */}
          <div className={cn(
            'grid gap-4',
            isFieldVisible(taskType, 'phase', mode) ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'
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
                    {Object.entries(TASK_STATUS_CONFIG).map(([value, config]) => (
                      <SelectItem key={value} value={value} textValue={config.label}>
                        <div className="flex items-center gap-2">
                          <div className={cn('w-2 h-2 rounded-full', config.dotColor)} />
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
          {/* Mobile: Stack vertically, Desktop: 2 columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                assignees={assignees}
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
                  {Object.entries(TASK_PRIORITY_CONFIG).map(([value, config]) => (
                    <SelectItem key={value} value={value} textValue={config.label}>
                      <div className="flex items-center gap-2">
                        <div className={cn('w-2 h-2 rounded-full', config.dotColor)} />
                        <span>{config.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Date Range Row - Start Date conditional (Subtask 2.3) */}
          {/* Mobile: Stack vertically, Desktop: 2 columns */}
          <div className={cn(
            'grid gap-4',
            isFieldVisible(taskType, 'startDate', mode) ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'
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
          {/* Mobile: Stack vertically, Desktop: 2 columns */}
          {isFieldVisible(taskType, 'plannedCost', mode) && (
            <div className={cn(
              'grid gap-4',
              isFieldVisible(taskType, 'actualCost', mode) ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'
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

          {/* Auto-Expense Section (Task 3.4) - Between costs and receipt upload */}
          {/* Show when: edit mode, actualCost > 0 */}
          {mode === 'edit' && parseFloat(actualCost) > 0 && (
            <div className="space-y-4">
              {/* Primary Assignee Selector - Only when multiple assignees */}
              {assigneeOptions.length > 1 && (
                <PrimaryAssigneeSelector
                  assignees={assigneeOptions}
                  primaryId={primaryAssigneeId}
                  onPrimaryChange={setPrimaryAssigneeId}
                  disabled={isPending}
                />
              )}

              {/* Auto-Expense Toggle */}
              <AutoExpenseToggle
                enabled={autoExpenseEnabled}
                onToggle={setAutoExpenseEnabled}
                actualCost={parseFloat(actualCost) || 0}
                taskTitle={title}
                vendorName={primaryAssigneeName}
                category={expenseCategory}
                onCategoryChange={setExpenseCategory}
                disabled={isPending}
              />
            </div>
          )}

          {/* Receipt Photo Upload - For all task types (especially useful for purchase tasks) */}
          <TaskReceiptUpload
            receiptUrl={receiptPreview}
            onReceiptChange={(file, preview) => {
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

      {/* Delete Confirmation Dialog */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50"
              onClick={() => !isDeleting && setShowDeleteConfirm(false)}
            />

            {/* Confirmation Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white rounded-2xl shadow-xl p-6 max-w-md w-full"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    Delete Task
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Are you sure you want to delete this task? This action cannot be undone.
                  </p>
                  <div className="flex items-center gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowDeleteConfirm(false)}
                      disabled={isDeleting}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      onClick={handleDeleteTask}
                      disabled={isDeleting}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                    >
                      {isDeleting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        <>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </ResponsiveModal>
  );
}

// Main modal component - handles open/close and passes props to form
// ResponsiveModal provides: BottomSheetModal on mobile, BaseModal on desktop
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
  assignees, // Optional: Pre-fetched assignees
  userRole, // User role for permission checks
}: TaskModalProps) {
  // Generate a unique key for the form based on mode and task ID
  // This forces React to remount the form component with fresh state
  const formKey = mode === 'edit' && task ? `edit-${task.id}` : 'create';

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
      assignees={assignees}
      userRole={userRole}
    />
  );
}
