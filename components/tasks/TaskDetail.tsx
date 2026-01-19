/**
 * TaskDetail - Main orchestrator component for task detail view
 * REFACTORED: Extracted sections into focused sub-components
 * Original: 1,404 lines → New: ~250 lines
 *
 * Sub-components:
 * - TaskDetailsSection: Basic task info display and editing
 * - TaskApprovalSection: Approval workflow UI
 * - TaskDependenciesSection: Dependencies management
 * - TaskMaterialsSection: Materials/expenses tabs
 *
 * Shared utilities:
 * - useActionWithError: Error state management hook
 * - ErrorBanner/SuccessBanner: Reusable error display
 */
"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ResponsiveModal } from "@/components/ui/ResponsiveModal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertTriangle,
  Calendar,
  User,
  Clock,
  FileText,
  Activity,
  Package,
  Trash2,
  Ban,
  RotateCcw,
} from "lucide-react";
import { TaskDetailsSection } from "./detail/TaskDetailsSection";
import { TaskApprovalSection } from "./detail/TaskApprovalSection";
import { TaskDependenciesSection } from "./detail/TaskDependenciesSection";
import { TaskMaterialsSection } from "./detail/TaskMaterialsSection";
import { TaskActivityLog } from "./TaskActivityLog";
import { TaskTypeBadge } from "./TaskTypeSelector";
import { BlockedReasonModal } from "./BlockedReasonModal";
import { ErrorBanner, SuccessBanner } from "@/components/shared/ErrorBanner";
import { useActionWithError } from "@/hooks/useActionWithError";
import { updateTaskStatus, deleteTask } from "@/app/actions/tasks";
import { cn, formatDate } from "@/lib/utils";
import {
  TASK_STATUS_CONFIG,
  TASK_PRIORITY_CONFIG,
} from "@/lib/config/task-colors";
import type {
  TaskStatus,
  TaskPriority,
  TaskType,
  ApprovalStatus,
  UserRole,
} from "@/types/db/enums";

// Status icon mapping
const STATUS_ICONS: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  todo: Clock,
  in_progress: Activity,
  review: FileText,
  blocked: Ban,
  completed: Calendar,
};

interface TaskWithRelations {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  task_type: TaskType | null;
  approval_status: ApprovalStatus | null;
  approval_notes: string | null;
  approved_by: string | null;
  approved_at: string | null;
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

interface TaskActivityEntry {
  id: string;
  action: string;
  old_value: string | null;
  new_value: string | null;
  comment: string | null;
  created_at: string;
  user: {
    id: string;
    name: string;
    avatar_url: string | null;
  } | null;
}

interface Dependency {
  id: string;
  depends_on_task_id: string;
  depends_on: { id: string; title: string; status: string };
}

interface Dependent {
  id: string;
  task_id: string;
  task: { id: string; title: string; status: string };
}

interface TaskDetailProps {
  task: TaskWithRelations;
  activity: TaskActivityEntry[];
  dependencies: Dependency[];
  dependents: Dependent[];
  phases: Array<{ id: string; name: string }>;
  teamMembers: Array<{
    id: string;
    name: string;
    email: string;
    avatar_url: string | null;
  }>;
  userRole: UserRole;
}

export function TaskDetail({
  task,
  activity,
  dependencies,
  dependents,
  phases,
  teamMembers,
  userRole,
}: TaskDetailProps) {
  const router = useRouter();
  const { error, setError, clearError, successMessage, showSuccess } =
    useActionWithError();

  // UI state
  const [isEditMode, setIsEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "overview" | "materials" | "activity" | "dependencies"
  >("overview");

  // Action state
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showBlockedModal, setShowBlockedModal] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<TaskStatus | null>(null);

  // Derived values
  const taskType: TaskType = task.task_type || "work";
  const isApprovalTask = taskType === "approval";
  const canEdit =
    userRole === "admin" ||
    userRole === "project_manager" ||
    task.assignee_id === task.created_by;
  const canDelete = userRole === "admin" || userRole === "project_manager";
  const isOverdue =
    task.due_date &&
    new Date(task.due_date) < new Date() &&
    task.status !== "completed";

  const StatusIcon = STATUS_ICONS[task.status as TaskStatus];

  // Tab handlers (memoized)
  const handleOverviewTab = useCallback(() => setActiveTab("overview"), []);
  const handleMaterialsTab = useCallback(() => setActiveTab("materials"), []);
  const handleActivityTab = useCallback(() => setActiveTab("activity"), []);
  const handleDependenciesTab = useCallback(
    () => setActiveTab("dependencies"),
    [],
  );

  // Edit mode toggle
  const handleEditToggle = useCallback(
    () => setIsEditMode((prev) => !prev),
    [],
  );

  // Status change handlers
  const handleStatusChange = async (newStatus: TaskStatus) => {
    if (newStatus === task.status) return;

    if (newStatus === "blocked") {
      setPendingStatus(newStatus);
      setShowBlockedModal(true);
      return;
    }

    clearError();
    const result = await updateTaskStatus(task.id, newStatus);
    if (result?.error) {
      setError(result.error);
    }
  };

  const handleBlockedConfirm = async (reason: string) => {
    setShowBlockedModal(false);
    if (!pendingStatus) return;

    clearError();
    const result = await updateTaskStatus(task.id, pendingStatus, reason);
    if (result?.error) {
      setError(result.error);
    }
    setPendingStatus(null);
  };

  // Delete handlers (memoized)
  const handleDeleteClick = useCallback(() => setShowDeleteModal(true), []);
  const handleDeleteCancel = useCallback(() => setShowDeleteModal(false), []);
  const handleDeleteConfirm = useCallback(async () => {
    setIsDeleting(true);
    clearError();

    const result = await deleteTask(task.id);

    if (result?.error) {
      setError(result.error);
      setIsDeleting(false);
    } else {
      router.push("/app/tasks");
      router.refresh();
    }
  }, [task.id, router, clearError, setError]);

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
                <span>Created by {task.creator?.name || "Unknown"}</span>
              </div>
              <span className="text-gray-400">•</span>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{formatDate(task.created_at)}</span>
              </div>
            </div>
          </div>

          {canDelete && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDeleteClick}
              className="gap-2 border-red-200 text-red-600 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          )}
        </div>

        {/* Badges */}
        <div className="flex items-center gap-3 flex-wrap">
          <TaskTypeBadge type={taskType} />

          <Badge
            className={cn(
              "px-4 py-2 text-sm font-bold border-2 flex items-center gap-2",
              TASK_STATUS_CONFIG[task.status as TaskStatus].badgeColor,
            )}
          >
            <div
              className={cn(
                "h-2 w-2 rounded-full",
                TASK_STATUS_CONFIG[task.status as TaskStatus].dotColor,
              )}
            />
            <StatusIcon className="h-4 w-4" />
            {TASK_STATUS_CONFIG[task.status as TaskStatus].label}
          </Badge>

          <Badge
            className={cn(
              "px-4 py-2 text-sm font-bold border-2",
              TASK_PRIORITY_CONFIG[task.priority as TaskPriority].badgeColor,
            )}
          >
            {TASK_PRIORITY_CONFIG[task.priority as TaskPriority].label} Priority
          </Badge>

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
            >
              <ErrorBanner error={error} onDismiss={clearError} />
            </motion.div>
          )}
          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <SuccessBanner message={successMessage} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Status Selector */}
        {canEdit && (
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700">
              Change Status:
            </label>
            <Select value={task.status} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todo">To Do</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="review">Review</SelectItem>
                <SelectItem value="blocked">Blocked</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
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
              onClick={handleOverviewTab}
              className={cn(
                "px-6 py-3 font-bold text-sm transition-all flex items-center gap-2 border-b-2 -mb-[2px]",
                activeTab === "overview"
                  ? "text-construction-blue border-construction-blue"
                  : "text-gray-500 border-transparent hover:text-gray-700",
              )}
            >
              <FileText className="h-4 w-4" />
              Overview
            </button>
            <button
              onClick={handleMaterialsTab}
              className={cn(
                "px-6 py-3 font-bold text-sm transition-all flex items-center gap-2 border-b-2 -mb-[2px]",
                activeTab === "materials"
                  ? "text-construction-blue border-construction-blue"
                  : "text-gray-500 border-transparent hover:text-gray-700",
              )}
            >
              <Package className="h-4 w-4" />
              Materials
            </button>
            <button
              onClick={handleActivityTab}
              className={cn(
                "px-6 py-3 font-bold text-sm transition-all flex items-center gap-2 border-b-2 -mb-[2px]",
                activeTab === "activity"
                  ? "text-construction-blue border-construction-blue"
                  : "text-gray-500 border-transparent hover:text-gray-700",
              )}
            >
              <Activity className="h-4 w-4" />
              Activity
              {activity.length > 0 && (
                <span className="ml-1 px-2 py-0.5 bg-construction-blue text-white rounded-full text-xs font-bold">
                  {activity.length}
                </span>
              )}
            </button>
            <button
              onClick={handleDependenciesTab}
              className={cn(
                "px-6 py-3 font-bold text-sm transition-all flex items-center gap-2 border-b-2 -mb-[2px]",
                activeTab === "dependencies"
                  ? "text-construction-blue border-construction-blue"
                  : "text-gray-500 border-transparent hover:text-gray-700",
              )}
            >
              Dependencies
            </button>
          </div>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            {activeTab === "overview" && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <TaskDetailsSection
                  task={task}
                  phases={phases}
                  teamMembers={teamMembers}
                  userRole={userRole}
                  isEditMode={isEditMode}
                  onEditToggle={handleEditToggle}
                  onSaveSuccess={() => showSuccess("Task updated successfully")}
                  onError={setError}
                />
              </motion.div>
            )}

            {activeTab === "materials" && (
              <motion.div
                key="materials"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <TaskMaterialsSection
                  taskId={task.id}
                />
              </motion.div>
            )}

            {activeTab === "activity" && (
              <motion.div
                key="activity"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <TaskActivityLog taskId={task.id} activity={activity} />
              </motion.div>
            )}

            {activeTab === "dependencies" && (
              <motion.div
                key="dependencies"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <TaskDependenciesSection
                  taskId={task.id}
                  projectId={task.project_id}
                  dependencies={dependencies}
                  dependents={dependents}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Right Column - Approval Section (1/3) */}
        {isApprovalTask && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <TaskApprovalSection
              task={task}
              userRole={userRole}
              onSuccess={() => showSuccess("Approval status updated")}
              onError={setError}
            />
          </motion.div>
        )}
      </div>

      {/* Modals */}
      <BlockedReasonModal
        isOpen={showBlockedModal}
        onClose={() => setShowBlockedModal(false)}
        onConfirm={handleBlockedConfirm}
      />

      <ResponsiveModal
        isOpen={showDeleteModal}
        onClose={handleDeleteCancel}
        title="Delete Task"
        icon={Trash2}
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            You are about to delete the task{" "}
            <strong>&quot;{task.title}&quot;</strong>.
          </p>
          <p className="text-gray-700">
            All activity history, dependencies, and associated data will be
            permanently removed.
          </p>
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={handleDeleteCancel}
              className="border-2 font-bold"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 font-bold"
            >
              {isDeleting ? "Deleting..." : "Delete Task"}
            </Button>
          </div>
        </div>
      </ResponsiveModal>
    </div>
  );
}
