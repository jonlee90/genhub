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
import { m as motion, AnimatePresence } from "framer-motion";
import { ResponsiveModal } from "@/components/ui/ResponsiveModal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Activity, Ban, Calendar, Clock, FileText, Trash2 } from "lucide-react";
import { TaskDetailsSection } from "./detail/TaskDetailsSection";
import { TaskApprovalSection } from "./detail/TaskApprovalSection";
import { TaskDependenciesSection } from "./detail/TaskDependenciesSection";
import { TaskMaterialsSection } from "./detail/TaskMaterialsSection";
import { TaskActivityLog } from "./TaskActivityLog";
import { BlockedReasonModal } from "./BlockedReasonModal";
import { TaskDetailDeleteModalContent } from "./detail/TaskDetailDeleteModalContent";
import { TaskDetailHeader } from "./detail/TaskDetailHeader";
import { TaskDetailStatusBanners } from "./detail/TaskDetailStatusBanners";
import { TaskDetailTabs } from "./detail/TaskDetailTabs";
import { useActionWithError } from "@/hooks/useActionWithError";
import { updateTaskStatus, deleteTask } from "@/app/actions/tasks";
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
    if (!result.success) {
      setError(result.error);
    }
  };

  const handleBlockedConfirm = async (reason: string) => {
    setShowBlockedModal(false);
    if (!pendingStatus) return;

    clearError();
    const result = await updateTaskStatus(task.id, pendingStatus, reason);
    if (!result.success) {
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

    if (!result.success) {
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
      <div className="space-y-4">
        <TaskDetailHeader
          title={task.title}
          creatorName={task.creator?.name || null}
          createdAt={task.created_at}
          status={task.status}
          priority={task.priority}
          taskType={taskType}
          isOverdue={Boolean(isOverdue)}
          canDelete={canDelete}
          onDelete={handleDeleteClick}
          statusIcon={StatusIcon}
        />

        <TaskDetailStatusBanners
          error={error}
          successMessage={successMessage}
          onDismiss={clearError}
        />

        {/* Status Selector */}
        {canEdit && (
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
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
      </div>

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
          <TaskDetailTabs
            activeTab={activeTab}
            activityCount={activity.length}
            onOverview={handleOverviewTab}
            onMaterials={handleMaterialsTab}
            onActivity={handleActivityTab}
            onDependencies={handleDependenciesTab}
          />

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
                <TaskMaterialsSection taskId={task.id} />
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
        <TaskDetailDeleteModalContent
          title={task.title}
          isDeleting={isDeleting}
          onCancel={handleDeleteCancel}
          onConfirm={handleDeleteConfirm}
        />
      </ResponsiveModal>
    </div>
  );
}
