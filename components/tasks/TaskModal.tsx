/**
 * TaskModal - Main task creation/editing modal (REFACTORED)
 *
 * Reduced from 1,499 lines to ~200 lines by extracting step components:
 * - TaskTypeSelectionStep: Type selection (create mode)
 * - TaskFormFieldsStep: Form fields (basic, dates, assignees, costs)
 * - TaskMaterialsExtrasStep: Materials, receipts, expenses
 *
 * Uses useTaskFormState hook for centralized state management.
 */
"use client";

import React, { useState, useTransition, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ClipboardList,
  Pencil,
  Loader2,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Plus,
  Trash2,
} from "lucide-react";
import { getTaskTypeDisplayConfig, getTaskTypeIcon } from "@/lib/config/task-type-display";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  createTask,
  updateTask,
  updateApprovalStatus,
  deleteTask,
} from "@/app/actions/tasks";
import { CreatorBadge } from "@/components/ui/CreatorBadge";
import { TaskTypeBadge } from "./TaskTypeSelector";
import { toast } from "sonner";
import { useTaskFormState } from "@/hooks/useTaskFormState";
import type { AssigneeOption as TaskAssigneeOption } from "@/app/actions/tasks";
import { addProductToTask } from "@/app/actions/materials";
import { ResponsiveModal } from "@/components/ui/ResponsiveModal";
import { getTaskExpenses, createExpenseFromTask } from "@/app/actions/expenses";
import type { TaskExpense } from "./TaskExpensesSection";
import type { HomeDepotProduct } from "@/lib/services/home-depot-api";
import type { ApprovalStatus } from "@/types/db/enums";
import type { TasksRow, TaskTypeConfigsRow } from "@/types/db/tables/tasks";

// Step components
import { TaskTypeSelectionStep } from "./modal/TaskTypeSelectionStep";
import { TaskFormFieldsStep } from "./modal/TaskFormFieldsStep";
import { TaskAssigneeStep } from "./modal/TaskAssigneeStep";
import { TaskMaterialsExtrasStep } from "./modal/TaskMaterialsExtrasStep";
import { TaskModalDeleteDialog } from "./modal/TaskModalDeleteDialog";
import { TaskModalStatusAlerts } from "./modal/TaskModalStatusAlerts";
import type { AssigneeOption } from "./PrimaryAssigneeSelector";

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
  project_type_config?: {
    id: string;
    name: string;
    color: string | null;
    icon_name: string | null;
  } | null;
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
  mode: "create" | "edit";
  task?: Task | null;
  projects: Project[];
  teamMembers: TeamMember[];
  preselectedProjectId?: string;
  preselectedPhaseId?: string;
  onSuccess?: () => void;
  tasks?: Array<{ id: string; title: string; project_id: string }>;
  assignees?: TaskAssigneeOption[];
  /** Task types from database - passed from Server Component parent */
  taskTypes?: TaskTypeConfigsRow[];
  userRole?: string | null;
  isLoadingData?: boolean;
}

/**
 * Inner form component that gets remounted when task changes via key prop
 */
function TaskModalForm({
  mode,
  task,
  projects,
  teamMembers,
  preselectedProjectId,
  preselectedPhaseId,
  onClose,
  onSuccess,
  tasks = [],
  assignees,
  taskTypes,
  userRole,
}: Omit<TaskModalProps, "isOpen">) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Use centralized form state hook
  const formState = useTaskFormState({
    mode,
    task,
    preselectedProjectId,
    preselectedPhaseId,
  });

  // Expense state
  const [expenses, setExpenses] = useState<TaskExpense[]>([]);
  const [expensesLoading, setExpensesLoading] = useState(false);

  // Approval workflow state
  const [isApprovalPending, setIsApprovalPending] = useState(false);

  // Delete confirmation state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Build assignee options for PrimaryAssigneeSelector
  const assigneeOptions: AssigneeOption[] = useMemo(() => {
    if (!task?.assignees) return [];
    return task.assignees
      .filter((a) => a.user || a.subcontractor)
      .map((a) => {
        if (a.user) {
          return {
            id: a.user.id,
            type: "user" as const,
            name: a.user.name,
            avatarUrl: a.user.avatar_url,
          };
        }
        return {
          id: a.subcontractor!.id,
          type: "subcontractor" as const,
          name: a.subcontractor!.contact_name || a.subcontractor!.company_name,
          companyName: a.subcontractor!.company_name,
        };
      });
  }, [task?.assignees]);

  // Get primary assignee name for expense vendor_name
  const primaryAssigneeName = useMemo(() => {
    if (formState.primaryAssigneeId) {
      const assignee = assigneeOptions.find(
        (a) => a.id === formState.primaryAssigneeId,
      );
      if (assignee?.name) return assignee.name;
    }
    if (assigneeOptions.length > 0) {
      return assigneeOptions[0].name || null;
    }
    return null;
  }, [formState.primaryAssigneeId, assigneeOptions]);

  // Editable expense category state
  const [expenseCategory, setExpenseCategory] = useState(() => {
    if (!formState.taskType) return "other";
    const categoryMap: Record<string, string> = {
      purchase: "materials",
      labor: "labor",
      admin: "other",
      approval: "other",
      general: "other",
    };
    return categoryMap[formState.taskType] || "other";
  });

  // Fetch expenses for task
  const fetchExpenses = async () => {
    if (!task?.id) return;

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
  useEffect(() => {
    if (task?.id && mode === "edit") {
      fetchExpenses();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task?.id, mode]);

  // Callback for expense added
  const handleExpenseAdded = async () => {
    await fetchExpenses();
  };

  // Check if an auto-created expense exists (description starts with "Task expense:")
  const hasAutoExpense = expenses.some(e => e.description?.startsWith("Task expense:"));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData();
    formData.append("title", formState.title);
    formData.append("description", formState.description);
    formData.append("project_id", formState.selectedProjectId);
    formData.append("phase_id", formState.phaseId);
    formData.append("assignee_id", formState.assigneeId);
    formData.append("priority", formState.priority);
    formData.append("start_date", formState.startDate);
    formData.append("due_date", formState.dueDate);
    formData.append("planned_cost", formState.plannedCost);

    if (formState.receiptPreview) {
      formData.append("receipt_photo_url", formState.receiptPreview);
    }

    if (mode === "create" && formState.taskType) {
      formData.append("task_type", formState.taskType);
    }

    if (mode === "edit" && task) {
      formData.append("id", task.id);
      formData.append("actual_cost", formState.actualCost);
      formData.append("status", formState.status);
    }

    if (formState.selectedAssignees.length > 0) {
      formData.append(
        "assignee_ids",
        JSON.stringify(formState.selectedAssignees),
      );
    }

    startTransition(async () => {
      try {
        const result =
          mode === "create"
            ? await createTask(null, formData)
            : await updateTask(formData);

        if (!result.success) {
          setError(result.error);
        } else {
          // Associate temp materials for create mode
          if (
            mode === "create" &&
            result.data &&
            formState.tempMaterials.length > 0
          ) {
            try {
              const materialPromises = formState.tempMaterials.map(
                async (tempMaterial) => {
                  const product: HomeDepotProduct = {
                    id: tempMaterial.product_id,
                    name: tempMaterial.product_name,
                    sku: tempMaterial.sku,
                    category: tempMaterial.category,
                    price: tempMaterial.price,
                    unitOfMeasure: tempMaterial.unit_of_measure,
                    imageUrl: tempMaterial.image_url || "",
                    stockStatus:
                      (tempMaterial.stock_status as HomeDepotProduct["stockStatus"]) ||
                      "in_stock",
                    description: "",
                    manufacturer: "",
                    productUrl: "",
                    leadTimeDays: 0,
                    specifications: {},
                  };

                  return addProductToTask(
                    product,
                    result.data.id,
                    result.data.project_id,
                    tempMaterial.quantity,
                  );
                },
              );

              await Promise.all(materialPromises);
            } catch {
              // Materials can be added manually
            }
          }

          // Auto-create expense if enabled
          if (
            mode === "edit" &&
            formState.autoExpenseEnabled &&
            task?.id &&
            !hasAutoExpense &&
            formState.actualCost &&
            parseFloat(formState.actualCost) > 0
          ) {
            try {
              const expenseResult = await createExpenseFromTask(task.id);
              if (expenseResult.success && expenseResult.data) {
                toast.success(`Expense for $${parseFloat(formState.actualCost).toFixed(2)} has been created from this task.`);
                await fetchExpenses();
              } else if (!expenseResult.success) {
                toast.error("Task saved but expense creation failed.");
              }
            } catch {
              // Error creating expense - toast already handles user feedback
            }
          }

          // Show success toast
          toast.success(mode === "create" ? "Task created successfully" : "Task updated successfully");

          setSuccess(true);
          setTimeout(() => {
            onSuccess?.();
            onClose();
            router.refresh();
          }, 500);
        }
      } catch (err) {
        setError("An unexpected error occurred");
      }
    });
  };

  // Handler for approval status updates
  const handleApprovalAction = async (newStatus: ApprovalStatus) => {
    if (!task?.id) return;

    setIsApprovalPending(true);
    setError(null);

    try {
      const result = await updateApprovalStatus(
        task.id,
        newStatus,
        formState.approvalNotes || undefined,
      );

      if (!result.success) {
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
      setError("An unexpected error occurred");
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

      if (!result.success) {
        setError(result.error);
        setShowDeleteConfirm(false);
      } else {
        toast.success("Task deleted successfully");
        setTimeout(() => {
          onSuccess?.();
          onClose();
          router.refresh();
        }, 500);
      }
    } catch (err) {
      setError("An unexpected error occurred while deleting the task");
      setShowDeleteConfirm(false);
    } finally {
      setIsDeleting(false);
    }
  };

  // Render Step 1: Task Type Selection (Create mode only)
  if (mode === "create" && formState.currentStep === 1) {
    return (
      <ResponsiveModal
        isOpen={true}
        onClose={onClose}
        icon={ClipboardList}
        title="Select Task Type"
        theme="default"
        maxWidth="2xl"
        snapPoints={["half", "full"]}
        initialSnapPoint="half"
        showNavigation={true}
        onContinue={() => formState.setCurrentStep(2)}
        continueLabel="Next"
        continueDisabled={!formState.taskType}
      >
        <TaskTypeSelectionStep
          selectedType={formState.taskType}
          onTypeSelect={formState.setTaskType}
          onPriorityChange={formState.setPriority}
          onStartDateChange={formState.setStartDate}
          disabled={isPending}
          prefetchedTaskTypes={taskTypes || []}
        />
      </ResponsiveModal>
    );
  }

  // Render Step 2 (Create mode) or Edit mode
  // Find task type config from taskTypes array based on task.task_type
  const taskTypeConfig = mode === "edit" && task?.task_type
    ? taskTypes?.find((tt) => tt.name === task.task_type)
    : undefined;

  // Use actual database config icon if available, otherwise fallback
  const modalIcon = mode === "create"
    ? Plus
    : taskTypeConfig?.icon_name
      ? getTaskTypeIcon(taskTypeConfig.icon_name)
      : task?.task_type
        ? getTaskTypeDisplayConfig(task.task_type).icon
        : Pencil;
  const modalTitleText = mode === "create" ? "Add Task" : "Edit " + task?.task_type?.replace(/_/g, '').replace(/\b\w/g, c => c.toUpperCase());

  const modalTitle = (
    <div className="flex items-center gap-2">
      <span>{modalTitleText}</span>
      {mode === "edit" && task?.task_type && (
        <TaskTypeBadge type={task.task_type} />
      )}
      {mode === "create" && formState.taskType && (
        <TaskTypeBadge type={formState.taskType} />
      )}
    </div>
  );

  const approvalBadge = mode === "edit" &&
    task?.task_type === "approval" &&
    task.approval_status ? (
      <span
        className={cn(
          "px-2.5 py-1 rounded-full text-xs font-semibold",
          task.approval_status === "pending" && "bg-amber-100 text-amber-800",
          task.approval_status === "approved" &&
            "bg-emerald-100 text-emerald-800",
          task.approval_status === "rejected" && "bg-red-100 text-red-800",
          task.approval_status === "revision_requested" &&
            "bg-orange-100 text-orange-800",
        )}
      >
        {task.approval_status.replace("_", " ").toUpperCase()}
      </span>
    ) : undefined;

  const selectedProject = projects.find(
    (p) => p.id === formState.selectedProjectId,
  );

  // Use task type config color for icon only (edit mode only)
  const iconColor = mode === "edit" && taskTypeConfig?.color
    ? taskTypeConfig.color
    : undefined;

  return (
    <ResponsiveModal
      isOpen={true}
      onClose={onClose}
      icon={modalIcon}
      title={modalTitleText}
      badges={approvalBadge || undefined}
      theme="default"
      iconColor={iconColor}
      maxWidth="2xl"
      snapPoints={["half", "full"]}
      initialSnapPoint="full"
      formKey={mode === "edit" && task ? `edit-${task.id}` : "create"}
      showNavigation={true}
      onBack={mode === "create" ? () => formState.setCurrentStep(1) : undefined}
      onContinue={() => {
        const form = document.getElementById("task-form") as HTMLFormElement;
        if (form) form.requestSubmit();
      }}
      backLabel="Back"
      continueLabel={mode === "create" ? "Add Task" : "Save Changes"}
      continueDisabled={
        isPending || !formState.selectedProjectId || !formState.title.trim()
      }
    >
      <form id="task-form" onSubmit={handleSubmit}>
        <div className="space-y-5">
          {/* Error/Success Messages */}
          <TaskModalStatusAlerts error={error} success={success} mode={mode} />

          {/* Step 2: Form Fields (includes Assignees) */}
          <TaskFormFieldsStep
            mode={mode}
            taskType={formState.taskType}
            config={formState.config}
            title={formState.title}
            onTitleChange={formState.setTitle}
            description={formState.description}
            onDescriptionChange={formState.setDescription}
            selectedProjectId={formState.selectedProjectId}
            onProjectChange={formState.setSelectedProjectId}
            priority={formState.priority}
            onPriorityChange={formState.setPriority}
            phaseId={formState.phaseId}
            onPhaseChange={formState.setPhaseId}
            startDate={formState.startDate}
            onStartDateChange={formState.setStartDate}
            dueDate={formState.dueDate}
            onDueDateChange={formState.setDueDate}
            plannedCost={formState.plannedCost}
            onPlannedCostChange={formState.setPlannedCost}
            actualCost={formState.actualCost}
            onActualCostChange={formState.setActualCost}
            status={formState.status}
            onStatusChange={formState.setStatus}
            projects={projects}
            selectedAssignees={formState.selectedAssignees}
            onAssigneesChange={formState.setSelectedAssignees}
            primaryAssigneeId={formState.primaryAssigneeId}
            onPrimaryAssigneeChange={formState.setPrimaryAssigneeId}
            assigneeOptions={assigneeOptions}
            assignees={assignees}
            showPrimarySelector={
              mode === "edit" &&
              parseFloat(formState.actualCost) > 0 &&
              assigneeOptions.length > 1
            }
            disabled={isPending}
            approvalStatus={task?.approval_status}
            approvalNotes={formState.approvalNotes}
            onApprovalNotesChange={formState.setApprovalNotes}
            onApprovalAction={handleApprovalAction}
            isApprovalPending={isApprovalPending}
            approvedBy={task?.approved_by}
            approvedAt={task?.approved_at}
            approvalNotesHistory={task?.approval_notes}
          />

          {/* Step 3: Materials, Receipt, Expenses */}
          <TaskMaterialsExtrasStep
            mode={mode}
            taskType={formState.taskType}
            taskId={task?.id}
            taskTitle={formState.title}
            projectId={formState.selectedProjectId}
            tempMaterials={formState.tempMaterials}
            onTempMaterialsChange={formState.setTempMaterials}
            receiptUrl={formState.receiptPreview}
            onReceiptChange={(file, preview) => {
              formState.setReceiptFile(file);
              formState.setReceiptPreview(preview);
            }}
            showAutoExpense={mode === "edit"}
            autoExpenseEnabled={formState.autoExpenseEnabled}
            onAutoExpenseToggle={formState.setAutoExpenseEnabled}
            actualCost={parseFloat(formState.actualCost) || 0}
            primaryAssigneeName={primaryAssigneeName}
            expenseCategory={expenseCategory}
            onExpenseCategoryChange={setExpenseCategory}
            hasAutoExpense={hasAutoExpense}
            showExpenses={mode === "edit"}
            expenses={expenses}
            expensesLoading={expensesLoading}
            onExpenseAdded={handleExpenseAdded}
            projects={projects}
            tasks={tasks}
            projectName={selectedProject?.name}
            disabled={isPending}
          />
        </div>
      </form>

      {/* Delete Confirmation Dialog */}
      <TaskModalDeleteDialog
        isOpen={showDeleteConfirm}
        isDeleting={isDeleting}
        onCancel={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteTask}
      />
    </ResponsiveModal>
  );
}

/**
 * Main modal component - handles open/close and passes props to form
 * Wrapper that ensures form is remounted with fresh state on task change
 *
 * Uses key prop to remount component when task changes (React best practice).
 * This avoids useEffect anti-pattern for syncing props to state.
 * See: https://react.dev/learn/you-might-not-need-an-effect#resetting-all-state-when-a-prop-changes
 */
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
  tasks = [],
  assignees,
  taskTypes,
  userRole,
  isLoadingData,
}: TaskModalProps) {
  if (!isOpen) return null;

  // Use stable key to force remount when task changes
  // This resets all form state to initial values from props
  const formKey = mode === 'edit' && task ? `edit-${task.id}` : 'create';

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
      taskTypes={taskTypes}
      userRole={userRole}
    />
  );
}
