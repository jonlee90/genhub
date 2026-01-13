import type { TaskType } from '@/types/db/enums';

/**
 * Field visibility interface
 * Defines which fields are visible for each task type
 */
export interface FieldVisibility {
  title: boolean;
  description: boolean;
  project: boolean;
  phase: boolean;
  assignee: boolean;
  priority: boolean;
  startDate: boolean;
  dueDate: boolean;
  plannedCost: boolean;
  actualCost: boolean;
  materialsSection: boolean;
  approvalWorkflow: boolean;
  expensesSection: boolean;
  addExpenseButton: boolean;
}

/**
 * Field configuration interface
 * Includes visibility, labels, defaults, and styling for each task type
 */
export interface FieldConfig {
  visibility: FieldVisibility;
  labels: {
    plannedCost: string; // "Labor Cost" | "Budget" | "Planned Cost"
  };
  defaults: {
    priority?: 'low' | 'medium' | 'high';
    startDate?: 'today' | null;
  };
  styling: {
    headerBadge?: 'approval_status';
  };
}

/**
 * Task type field configuration
 * Maps each task type to its field configuration
 */
export const TASK_TYPE_CONFIG: Record<TaskType, FieldConfig> = {
  // Work tasks: Standard labor/work tasks
  work: {
    visibility: {
      title: true,
      description: true,
      project: true,
      phase: true,
      assignee: true,
      priority: true,
      startDate: true,
      dueDate: true,
      plannedCost: true,
      actualCost: true, // edit mode only
      materialsSection: false,
      approvalWorkflow: false,
      expensesSection: true, // edit mode only
      addExpenseButton: true, // edit mode only
    },
    labels: {
      plannedCost: 'Labor Cost',
    },
    defaults: {
      startDate: 'today',
    },
    styling: {},
  },

  // Purchase tasks: Buying materials/supplies (shows Materials step)
  purchase: {
    visibility: {
      title: true,
      description: true,
      project: true,
      phase: true,
      assignee: true,
      priority: true,
      startDate: true,
      dueDate: true,
      plannedCost: true,
      actualCost: true, // auto-calculated from materials
      materialsSection: true,
      approvalWorkflow: false,
      expensesSection: true, // edit mode only
      addExpenseButton: true, // edit mode only
    },
    labels: {
      plannedCost: 'Budget',
    },
    defaults: {
      startDate: 'today',
    },
    styling: {},
  },

  // Approval tasks: Permits, sign-offs, inspections (has approval workflow)
  approval: {
    visibility: {
      title: true,
      description: true,
      project: true,
      phase: true,
      assignee: true,
      priority: true,
      startDate: true,
      dueDate: true,
      plannedCost: false,
      actualCost: false,
      materialsSection: false,
      approvalWorkflow: true,
      expensesSection: false,
      addExpenseButton: false,
    },
    labels: {
      plannedCost: 'Planned Cost', // not shown
    },
    defaults: {
      startDate: 'today',
    },
    styling: {
      headerBadge: 'approval_status',
    },
  },

  // Admin tasks: Administrative/overhead tasks (minimal fields)
  admin: {
    visibility: {
      title: true,
      description: true,
      project: true,
      phase: false,
      assignee: true,
      priority: true,
      startDate: false,
      dueDate: true,
      plannedCost: false,
      actualCost: false,
      materialsSection: false,
      approvalWorkflow: false,
      expensesSection: false,
      addExpenseButton: false,
    },
    labels: {
      plannedCost: 'Planned Cost', // not shown
    },
    defaults: {
      priority: 'low',
    },
    styling: {},
  },
};

/**
 * Get config for a task type
 * Returns the field configuration for the given task type
 * Defaults to 'work' if type is null
 */
export function getTaskTypeConfig(type: TaskType | null): FieldConfig {
  return type ? TASK_TYPE_CONFIG[type] : TASK_TYPE_CONFIG.work;
}

/**
 * Check if a field should be visible
 * Returns true if the field is visible for the given task type and mode
 * Edit-only fields (actualCost, expensesSection, addExpenseButton) only visible in edit mode
 */
export function isFieldVisible(
  type: TaskType | null,
  field: keyof FieldVisibility,
  mode: 'create' | 'edit'
): boolean {
  const config = getTaskTypeConfig(type);
  const visible = config.visibility[field];

  // Some fields are only visible in edit mode
  if (field === 'actualCost' || field === 'expensesSection' || field === 'addExpenseButton') {
    return visible && mode === 'edit';
  }

  return visible;
}
