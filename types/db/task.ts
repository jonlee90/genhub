/**
 * Task Types - Shared type definitions for task components
 *
 * These types extend the database types with joined relations
 * commonly used in UI components.
 */

import type { LucideIcon } from "lucide-react";
import type { TasksRow, TaskDependenciesRow } from "./tables/tasks";
import type {
  TaskStatus as DbTaskStatus,
  TaskPriority as DbTaskPriority,
  ApprovalStatus as DbApprovalStatus,
} from "./enums";

// =============================================================================
// Base Types from Database
// =============================================================================

export type TaskRow = TasksRow;
export type TaskStatus = DbTaskStatus;
export type TaskPriority = DbTaskPriority;
export type TaskType = string; // User-configurable task types (converted from enum to text in migration)
export type ApprovalStatus = DbApprovalStatus;
export type TaskDependencyRow = TaskDependenciesRow;

// =============================================================================
// Joined Relations
// =============================================================================

/**
 * Task assignee with profile details
 */
export interface TaskAssigneeRelation {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
}

/**
 * Task project reference
 */
export interface TaskProjectRelation {
  id: string;
  name: string;
}

/**
 * Task phase reference
 */
export interface TaskPhaseRelation {
  id: string;
  name: string;
}

/**
 * Task creator reference
 */
export interface TaskCreatorRelation {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
}

/**
 * Material statistics for a task
 */
export interface TaskMaterialStats {
  count: number;
  totalCost: number;
}

/**
 * Expense statistics for a task
 */
export interface TaskExpenseStats {
  count: number;
  totalAmount: number;
}

// =============================================================================
// Task with Relations
// =============================================================================

/**
 * Task with common relations - used across task list, cards, kanban, etc.
 * Base type for most task UI components.
 */
export type TaskWithRelations = TaskRow & {
  assignee?: TaskAssigneeRelation | null;
  project?: TaskProjectRelation | null;
  phase?: TaskPhaseRelation | null;
  materialStats?: TaskMaterialStats;
  expenseStats?: TaskExpenseStats;
};

/**
 * Extended task for modal/detail views with creator info
 */
export type TaskWithCreator = TaskWithRelations & {
  creator?: TaskCreatorRelation | null;
};

/**
 * Task with multi-assignee support (for modal forms)
 */
export type TaskWithAssignees = TaskWithCreator & {
  approver?: TaskCreatorRelation | null;
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

// =============================================================================
// Phase Types
// =============================================================================

/**
 * Project phase for task context (order_index optional for basic display)
 */
export interface Phase {
  id: string;
  name: string;
  order_index?: number;
}

/**
 * Project phase with required order_index (for project_phases array)
 */
export interface PhaseWithOrder {
  id: string;
  name: string;
  order_index: number;
}

// =============================================================================
// Project Types for Task Forms
// =============================================================================

/**
 * Project with phases for task forms
 */
export interface TaskProject {
  id: string;
  name: string;
  budget?: number | null;
  status?: string;
  health_score?: number | null;
  completion_percentage?: number | null;
  end_date?: string | null;
  project_phases?: Phase[];
}

// =============================================================================
// Team Member Types
// =============================================================================

/**
 * Team member for task assignment
 */
export interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
}

/**
 * Top team member with stats
 */
export interface TopTeamMember {
  id: string;
  name: string;
  avatar_url?: string;
  completed_tasks: number;
}

// =============================================================================
// Activity Log Types
// =============================================================================

/**
 * Task activity log entry
 */
export interface TaskActivity {
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

// =============================================================================
// Dependency Types
// =============================================================================

/**
 * Task dependency (tasks this task depends on)
 */
export interface TaskDependency {
  id: string;
  depends_on_task_id: string;
  depends_on: {
    id: string;
    title: string;
    status: string;
  };
}

/**
 * Task dependent (tasks that depend on this task)
 */
export interface TaskDependent {
  id: string;
  task_id: string;
  task: {
    id: string;
    title: string;
    status: string;
  };
}

// =============================================================================
// Task Type Configuration
// =============================================================================

/**
 * Task type display configuration
 */
export interface TaskTypeConfig {
  label: string;
  icon: LucideIcon;
  color: string;
  description: string;
}

// =============================================================================
// Component Props Types
// =============================================================================

/**
 * Props for TaskCard component
 */
export interface TaskCardProps {
  task: TaskWithRelations;
  isDragging?: boolean;
  onTaskClick?: (task: TaskWithRelations) => void;
  phases?: Phase[];
  showEditIndicator?: boolean;
}

/**
 * Props for TaskList component
 */
export interface TaskListProps {
  tasks: TaskWithRelations[];
  onTaskClick?: (task: TaskWithRelations) => void;
  phases?: Phase[];
}

/**
 * Props for TaskListMobile component
 */
export interface TaskListMobileProps {
  tasks: TaskWithRelations[];
  onTaskClick?: (task: TaskWithRelations) => void;
  phases?: Phase[];
  enableComplete?: boolean;
  enableDelete?: boolean;
}

/**
 * Props for KanbanBoard component
 */
export interface KanbanBoardProps {
  tasks: TaskWithRelations[];
  onTaskClick?: (task: TaskWithRelations) => void;
  phases?: Phase[];
}

/**
 * Props for TaskModal component
 */
export interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  task?: TaskWithAssignees | null;
  projects: TaskProject[];
  teamMembers: TeamMember[];
  preselectedProjectId?: string;
  preselectedPhaseId?: string;
  onSuccess?: () => void;
  tasks?: Array<{
    id: string;
    title: string;
    project_id: string;
    task_type?: string | null;
  }>;
}

/**
 * Props for TaskBoard component
 */
export interface TaskBoardProps {
  initialTasks: TaskWithRelations[];
  taskDependencies?: TaskDependencyRow[];
  projects: TaskProject[];
  teamMembers: TeamMember[];
  initialView: "kanban" | "list";
  projectId?: string;
  phases?: Phase[];
  showNewTaskButton?: boolean;
  topTeamMembers?: TopTeamMember[];
  externalProjectFilter?: string;
  onExternalProjectFilterChange?: (projectId: string) => void;
  hideFilters?: boolean;
  resultsCountRef?: React.RefObject<HTMLDivElement | null>;
}
