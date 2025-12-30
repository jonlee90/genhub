# Design Document: Task-Expense Integration

## Document Information

| Field | Value |
|-------|-------|
| Feature | Task-Expense Integration |
| Version | 1.0 |
| Last Updated | 2025-12-29 |
| Status | Draft |
| Requirements Doc | [requirements.md](./requirements.md) |

---

## 1. Overview

### 1.1 Executive Summary

This design document specifies the integration between Projects, Tasks, Materials, and Expenses modules in GenHub PWA. The implementation enables:

1. **Task Type-Specific Field Visibility** - Dynamic form fields based on task type (Work, Purchase, Approval, Admin)
2. **In-Task Expense Management** - Add and view expenses directly from task detail modal
3. **Material-Expense Linking** - Auto-create expenses from material purchases with relationship tracking
4. **Project Expense Summary** - Display expense totals on project cards and detail pages

### 1.2 Business Value

- Reduces data entry friction by showing only relevant fields per task type
- Streamlines expense tracking by enabling contextual expense creation from tasks
- Provides real-time budget visibility through project-level expense summaries
- Maintains audit trail between material purchases and associated expenses

### 1.3 Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| Modify existing TaskModal rather than create new | Maintains consistency, reduces component proliferation |
| Use field visibility matrix as configuration | Enables easy future modifications, testable logic |
| Create TaskExpensesSection as reusable component | Can be used in both modal and standalone contexts |
| Leverage existing database trigger for actual_cost | Maintains data consistency, single source of truth |
| Add expense stats to existing getProjectsWithStats | Minimizes new queries, uses established pattern |

---

## 2. Architecture

### 2.1 System Architecture Diagram

```

                            Projects Module
                                   |
         +-------------------------+-------------------------+
         |                         |                         |
         v                         v                         v
   ProjectCard            ProjectDetailPage           ProjectList
   (with expense          (with expense
    indicator)             widget)
         |                         |
         +------------+------------+
                      |
                      v
              getProjectsWithStats
              (enhanced with expense data)
                      |
                      v
              +-------+--------+
              |                |
              v                v
          expenses        material_assignments
          (table)              (table)
              ^
              |
              +--------------------------------+
                                               |
                            Tasks Module       |
                                   |           |
         +-------------------------+-----------+--------+
         |                         |                    |
         v                         v                    v
    TaskModal              TaskMaterialsManager  TaskExpensesSection
  (field visibility)       (material delivery)    (new component)
         |                         |                    |
         v                         v                    v
  TaskTypeSelector         MaterialAssignment    CreateExpenseModal
  (existing)               (delivery prompt)     (with taskContext)
```

### 2.2 Data Flow

```
+------------------+    +-------------------+    +------------------+
| User selects     |--->| TaskModal applies |--->| Form shows only  |
| task type        |    | field visibility  |    | relevant fields  |
+------------------+    +-------------------+    +------------------+

+------------------+    +-------------------+    +------------------+
| User clicks      |--->| CreateExpenseModal|--->| Expense created  |
| "Add Expense"    |    | opens with        |    | with task_id,    |
| in task detail   |    | taskContext       |    | project_id       |
+------------------+    +-------------------+    +------------------+

+------------------+    +-------------------+    +------------------+
| Material status  |--->| Prompt: "Create   |--->| Expense with     |
| -> "delivered"   |    | expense?"         |    | material link    |
+------------------+    +-------------------+    +------------------+

+------------------+    +-------------------+    +------------------+
| DB trigger fires |--->| task.actual_cost  |--->| ProjectCard and  |
| on expense       |    | updated           |    | detail page      |
| approved         |    | automatically     |    | show new totals  |
+------------------+    +-------------------+    +------------------+
```

### 2.3 Component Hierarchy

```
/app/app/projects/page.tsx
  ProjectList
    ProjectCard (modified - expense indicator)
      ExpenseBudgetIndicator (new)

/app/app/projects/[id]/page.tsx (to be created)
  ProjectDetailContent (modified)
    ProjectExpenseSummary (new)

/components/tasks/TaskModal.tsx (modified)
  TaskModalForm
    TaskTypeSelector (existing)
    TaskFieldRenderer (new - handles visibility)
    TaskMaterialsManager (existing, conditional)
    TaskExpensesSection (new)
      ExpenseListCompact (new)
      CreateExpenseModal (existing, with taskContext)

/components/tasks/TaskMaterialsManager.tsx (modified)
  TaskMaterialsList
    MaterialDeliveryPrompt (new)
```

---

## 3. Components and Interfaces

### 3.1 Task Type Field Visibility Configuration

Create a new configuration file for centralized field visibility management:

**File: `/lib/config/task-type-fields.ts`**

```typescript
import type { Database } from '@/types/database.types';

type TaskType = Database['public']['Enums']['task_type'];

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
    materialsEmphasized: boolean;
    headerBadge?: 'approval_status';
  };
}

export const TASK_TYPE_CONFIG: Record<TaskType, FieldConfig> = {
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
    styling: {
      materialsEmphasized: false,
    },
  },
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
    styling: {
      materialsEmphasized: true,
    },
  },
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
      materialsEmphasized: false,
      headerBadge: 'approval_status',
    },
  },
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
    styling: {
      materialsEmphasized: false,
    },
  },
};

// Helper to get config for a task type
export function getTaskTypeConfig(type: TaskType | null): FieldConfig {
  return type ? TASK_TYPE_CONFIG[type] : TASK_TYPE_CONFIG.work;
}

// Helper to check if a field should be visible
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
```

### 3.2 TaskExpensesSection Component

**File: `/components/tasks/TaskExpensesSection.tsx`**

```typescript
'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Receipt, Plus, Loader2, AlertCircle, DollarSign, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn, formatCurrency } from '@/lib/utils';
import { CreateExpenseModal } from '@/components/expenses/CreateExpenseModal';

interface TaskExpensesSectionProps {
  taskId: string;
  taskTitle: string;
  projectId: string;
  projectName: string;
  expenses: TaskExpense[];
  onExpenseAdded?: () => void;
  projects: Array<{ id: string; name: string }>;
  tasks: Array<{ id: string; title: string; project_id: string }>;
}

interface TaskExpense {
  id: string;
  description: string;
  amount: number;
  status: 'submitted' | 'under_review' | 'approved' | 'rejected' | 'paid';
  expense_date: string;
  vendor_name: string | null;
  category: string;
}

const STATUS_CONFIG = {
  submitted: { icon: Clock, color: 'text-gray-600', bg: 'bg-gray-100' },
  under_review: { icon: Clock, color: 'text-construction-blue', bg: 'bg-construction-blue/10' },
  approved: { icon: CheckCircle2, color: 'text-construction-green', bg: 'bg-construction-green/10' },
  rejected: { icon: XCircle, color: 'text-construction-red', bg: 'bg-construction-red/10' },
  paid: { icon: CheckCircle2, color: 'text-construction-green', bg: 'bg-construction-green/10' },
};

export function TaskExpensesSection({
  taskId,
  taskTitle,
  projectId,
  projectName,
  expenses,
  onExpenseAdded,
  projects,
  tasks,
}: TaskExpensesSectionProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Calculate totals
  const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);
  const approvedAmount = expenses
    .filter(e => e.status === 'approved' || e.status === 'paid')
    .reduce((sum, e) => sum + e.amount, 0);

  const handleExpenseCreated = () => {
    setShowCreateModal(false);
    onExpenseAdded?.();
  };

  return (
    <div className="space-y-3">
      {/* Header with totals */}
      <div className="flex items-center justify-between pb-2 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Receipt className="h-4 w-4 text-construction-blue" />
          <h3 className="text-sm font-bold text-gray-900">
            Expenses
            {expenses.length > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {expenses.length}
              </Badge>
            )}
          </h3>
        </div>

        <Button
          type="button"
          size="sm"
          onClick={() => setShowCreateModal(true)}
          className="bg-construction-blue hover:bg-construction-blue/90 text-white font-bold"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Expense
        </Button>
      </div>

      {/* Summary row */}
      {expenses.length > 0 && (
        <div className="flex items-center gap-4 p-2 bg-gray-50 rounded-lg text-sm">
          <div>
            <span className="text-gray-500">Total:</span>{' '}
            <span className="font-bold text-gray-900">{formatCurrency(totalAmount)}</span>
          </div>
          <div>
            <span className="text-gray-500">Approved:</span>{' '}
            <span className="font-bold text-construction-green">{formatCurrency(approvedAmount)}</span>
          </div>
        </div>
      )}

      {/* Expense list */}
      {expenses.length > 0 ? (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {expenses.map((expense) => {
            const status = STATUS_CONFIG[expense.status];
            const StatusIcon = status.icon;

            return (
              <div
                key={expense.id}
                className="flex items-center justify-between p-2 bg-white border border-gray-200 rounded-lg hover:border-construction-blue/30 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {expense.description}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>{expense.vendor_name || 'No vendor'}</span>
                    <span>-</span>
                    <span>{new Date(expense.expense_date).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 ml-3">
                  <span className="text-sm font-bold text-gray-900">
                    {formatCurrency(expense.amount)}
                  </span>
                  <div className={cn('p-1 rounded', status.bg)}>
                    <StatusIcon className={cn('h-4 w-4', status.color)} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
          <Receipt className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No expenses yet</p>
          <p className="text-xs text-gray-400 mt-1">
            Add expenses to track actual costs
          </p>
        </div>
      )}

      {/* Create Expense Modal */}
      {showCreateModal && (
        <CreateExpenseModal
          projects={projects}
          tasks={tasks}
          onClose={handleExpenseCreated}
          taskContext={{
            taskId,
            taskTitle,
            projectId,
            projectName,
          }}
        />
      )}
    </div>
  );
}
```

### 3.3 ProjectExpenseSummary Component

**File: `/components/projects/ProjectExpenseSummary.tsx`**

```typescript
'use client';

import { DollarSign, TrendingUp, TrendingDown, AlertTriangle, Receipt, ExternalLink } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn, formatCurrency, formatBudget } from '@/lib/utils';
import Link from 'next/link';

interface ExpenseStats {
  totalBudget: number;
  totalExpenses: number;
  approvedExpenses: number;
  pendingExpenses: number;
  rejectedExpenses: number;
  byCategory: Array<{
    category: string;
    amount: number;
  }>;
}

interface ProjectExpenseSummaryProps {
  projectId: string;
  stats: ExpenseStats;
  variant?: 'card' | 'widget';
}

export function ProjectExpenseSummary({
  projectId,
  stats,
  variant = 'widget',
}: ProjectExpenseSummaryProps) {
  const utilizationPercent = stats.totalBudget > 0
    ? Math.min(100, (stats.approvedExpenses / stats.totalBudget) * 100)
    : 0;

  const isOverBudget = stats.approvedExpenses > stats.totalBudget;
  const isNearBudget = utilizationPercent >= 80 && !isOverBudget;

  if (variant === 'card') {
    // Compact version for ProjectCard
    return (
      <div className="flex items-center gap-2 text-xs">
        <Receipt className="h-3.5 w-3.5 text-construction-accent" />
        <span className="text-gray-600">Expenses:</span>
        <span className={cn(
          'font-bold',
          isOverBudget && 'text-construction-red',
          isNearBudget && 'text-yellow-600',
          !isOverBudget && !isNearBudget && 'text-gray-900'
        )}>
          {formatBudget(stats.approvedExpenses)}
        </span>
        {stats.totalBudget > 0 && (
          <>
            <span className="text-gray-400">/</span>
            <span className="text-gray-500">{formatBudget(stats.totalBudget)}</span>
          </>
        )}
        {isOverBudget && (
          <AlertTriangle className="h-3.5 w-3.5 text-construction-red" />
        )}
        {isNearBudget && (
          <AlertTriangle className="h-3.5 w-3.5 text-yellow-600" />
        )}
      </div>
    );
  }

  // Full widget version for ProjectDetailPage
  return (
    <div className="bg-white border-2 border-gray-200 rounded-lg p-5 shadow-construction hover:shadow-construction-lg transition-shadow">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-construction-blue/10 rounded-lg border-2 border-construction-blue/20">
            <DollarSign className="h-5 w-5 text-construction-blue" />
          </div>
          <h3 className="font-bold text-gray-900">Expense Summary</h3>
        </div>
        <Link
          href={`/app/expenses?project=${projectId}`}
          className="text-sm text-construction-blue hover:underline flex items-center gap-1"
        >
          View All <ExternalLink className="h-3 w-3" />
        </Link>
      </div>

      {/* Budget utilization bar */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Budget Utilization</span>
          <span className={cn(
            'font-bold',
            isOverBudget && 'text-construction-red',
            isNearBudget && 'text-yellow-600',
            !isOverBudget && !isNearBudget && 'text-construction-blue'
          )}>
            {utilizationPercent.toFixed(0)}%
          </span>
        </div>
        <Progress
          value={utilizationPercent}
          className={cn(
            'h-2',
            isOverBudget && '[&>div]:bg-construction-red',
            isNearBudget && '[&>div]:bg-yellow-500',
            !isOverBudget && !isNearBudget && '[&>div]:bg-construction-blue'
          )}
        />
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500 mb-1">Total Budget</p>
          <p className="text-lg font-bold text-gray-900">{formatCurrency(stats.totalBudget)}</p>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500 mb-1">Total Expenses</p>
          <p className="text-lg font-bold text-gray-900">{formatCurrency(stats.totalExpenses)}</p>
        </div>
        <div className="p-3 bg-construction-green/10 rounded-lg">
          <p className="text-xs text-gray-500 mb-1">Approved</p>
          <p className="text-lg font-bold text-construction-green">{formatCurrency(stats.approvedExpenses)}</p>
        </div>
        <div className="p-3 bg-yellow-50 rounded-lg">
          <p className="text-xs text-gray-500 mb-1">Pending</p>
          <p className="text-lg font-bold text-yellow-600">{formatCurrency(stats.pendingExpenses)}</p>
        </div>
      </div>

      {/* Category breakdown */}
      {stats.byCategory.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            By Category
          </h4>
          <div className="space-y-1">
            {stats.byCategory.slice(0, 4).map((cat) => (
              <div key={cat.category} className="flex items-center justify-between text-sm">
                <span className="text-gray-600 capitalize">{cat.category}</span>
                <span className="font-medium text-gray-900">{formatCurrency(cat.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

### 3.4 MaterialDeliveryPrompt Component

**File: `/components/tasks/MaterialDeliveryPrompt.tsx`**

```typescript
'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Receipt, Package, DollarSign, Loader2 } from 'lucide-react';
import { createExpenseFromMaterial } from '@/app/actions/expenses';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils';

interface MaterialDeliveryPromptProps {
  isOpen: boolean;
  onClose: () => void;
  materialAssignment: {
    id: string;
    material: {
      product_name: string;
      sku: string;
    };
    total_cost: number;
    task_id: string;
    project_id: string;
  };
  onExpenseCreated?: () => void;
}

export function MaterialDeliveryPrompt({
  isOpen,
  onClose,
  materialAssignment,
  onExpenseCreated,
}: MaterialDeliveryPromptProps) {
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const handleCreateExpense = async () => {
    setIsCreating(true);

    const result = await createExpenseFromMaterial({
      material_assignment_id: materialAssignment.id,
      task_id: materialAssignment.task_id,
      project_id: materialAssignment.project_id,
      amount: materialAssignment.total_cost,
      description: `Material: ${materialAssignment.material.product_name}`,
      category: 'materials',
    });

    setIsCreating(false);

    if (result.success) {
      toast({
        title: 'Expense Created',
        description: 'Expense has been created and linked to the material purchase.',
      });
      onExpenseCreated?.();
      onClose();
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Failed to create expense',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-construction-blue">
            <Package className="h-5 w-5" />
            Material Delivered
          </DialogTitle>
          <DialogDescription>
            Would you like to create an expense record for this material purchase?
          </DialogDescription>
        </DialogHeader>

        <div className="p-4 bg-gray-50 rounded-lg border-2 border-gray-200 space-y-2">
          <p className="font-bold text-gray-900">{materialAssignment.material.product_name}</p>
          <p className="text-sm text-gray-600">SKU: {materialAssignment.material.sku}</p>
          <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
            <DollarSign className="h-4 w-4 text-construction-accent" />
            <span className="text-lg font-bold text-construction-blue">
              {formatCurrency(materialAssignment.total_cost)}
            </span>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={onClose} disabled={isCreating}>
            Skip
          </Button>
          <Button
            onClick={handleCreateExpense}
            disabled={isCreating}
            className="bg-construction-blue hover:bg-construction-blue/90 text-white font-bold"
          >
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Receipt className="mr-2 h-4 w-4" />
                Create Expense
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

---

## 4. Data Models

### 4.1 Database Schema Changes

No new tables are required. The existing schema supports all requirements:

- **`expenses`** - Already has `task_id`, `project_id` columns
- **`expense_line_items`** - Already has `material_assignment_id` column
- **`tasks`** - Already has `task_type`, `actual_cost` columns
- **`material_assignments`** - Already has `procurement_status` column

### 4.2 Database Trigger (Existing)

The existing `update_task_costs` trigger already handles updating `tasks.actual_cost` when expenses are approved. No modifications needed.

```sql
-- Existing trigger (documented in DB_SCHEMA.md)
-- Fires on: material_assignments INSERT/UPDATE/DELETE
-- Fires on: expenses UPDATE (when status changes to 'approved')
-- Updates: tasks.actual_cost = SUM(material_assignments.total_cost) + SUM(approved expenses)
```

### 4.3 New Query Functions

**Add to `app/actions/expenses.ts`:**

```typescript
/**
 * Create expense from material purchase (auto-link)
 */
export async function createExpenseFromMaterial(data: {
  material_assignment_id: string;
  task_id: string;
  project_id: string;
  amount: number;
  description: string;
  category: 'materials';
}) {
  // Validation, auth, insert expense
  // Insert expense_line_item with material_assignment_id link
  // Revalidate paths
}

/**
 * Get task expenses (for TaskExpensesSection)
 */
export async function getTaskExpenses(taskId: string) {
  // Returns expenses linked to task with status summary
}

/**
 * Check if material assignment has linked expense
 */
export async function getMaterialExpenseLink(materialAssignmentId: string) {
  // Returns expense_id if exists, null otherwise
}
```

**Add to `app/actions/projects.ts` - Enhance `getProjectsWithStats`:**

```typescript
// Add to existing query
const { data: expenses, error: expensesError } = await supabase
  .from('expenses')
  .select('id, project_id, amount, status, category')
  .in('project_id', projectIds);

// Add to ProjectStats interface
interface ExpenseStats {
  totalExpenses: number;
  approvedExpenses: number;
  pendingExpenses: number;
  byCategory: Map<string, number>;
}

// Calculate expense stats per project
const expenseStats: ExpenseStats = {
  totalExpenses: projectExpenses.reduce((sum, e) => sum + e.amount, 0),
  approvedExpenses: projectExpenses
    .filter(e => e.status === 'approved' || e.status === 'paid')
    .reduce((sum, e) => sum + e.amount, 0),
  pendingExpenses: projectExpenses
    .filter(e => e.status === 'submitted' || e.status === 'under_review')
    .reduce((sum, e) => sum + e.amount, 0),
  byCategory: /* aggregate by category */,
};
```

---

## 5. Error Handling

### 5.1 Error Scenarios

| Scenario | Handling | User Feedback |
|----------|----------|---------------|
| Failed to load task expenses | Retry with exponential backoff | Show retry button, display cached data if available |
| Expense creation fails | Transaction rollback | Toast with error message, keep modal open |
| Material-expense link already exists | Return success (idempotent) | Show "Already linked" indicator |
| Budget data unavailable | Fallback to showing actual only | Hide budget comparison, show "Budget not set" |
| Field visibility config missing | Default to 'work' type config | Log warning, render all fields |

### 5.2 Error Response Format

```typescript
interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
  fieldErrors?: Record<string, string[]>;
}
```

### 5.3 Validation Rules

**CreateExpenseModal with taskContext:**
- `project_id` and `task_id` must match the provided context
- Amount must be positive
- Description required
- Category required

**Material Delivery Expense:**
- Material assignment must not already have linked expense
- Expense amount defaults to `material_assignment.total_cost`

---

## 6. Testing Strategy

### 6.1 Unit Tests

**Field Visibility Configuration:**
```typescript
describe('getTaskTypeConfig', () => {
  it('returns correct config for work type', () => {
    const config = getTaskTypeConfig('work');
    expect(config.visibility.materialsSection).toBe(false);
    expect(config.visibility.expensesSection).toBe(true);
    expect(config.labels.plannedCost).toBe('Labor Cost');
  });

  it('returns correct config for purchase type', () => {
    const config = getTaskTypeConfig('purchase');
    expect(config.visibility.materialsSection).toBe(true);
    expect(config.styling.materialsEmphasized).toBe(true);
  });

  it('returns correct config for approval type', () => {
    const config = getTaskTypeConfig('approval');
    expect(config.visibility.plannedCost).toBe(false);
    expect(config.visibility.approvalWorkflow).toBe(true);
  });

  it('returns correct config for admin type', () => {
    const config = getTaskTypeConfig('admin');
    expect(config.visibility.phase).toBe(false);
    expect(config.visibility.startDate).toBe(false);
    expect(config.defaults.priority).toBe('low');
  });
});

describe('isFieldVisible', () => {
  it('hides edit-only fields in create mode', () => {
    expect(isFieldVisible('work', 'actualCost', 'create')).toBe(false);
    expect(isFieldVisible('work', 'actualCost', 'edit')).toBe(true);
  });
});
```

**Expense Calculations:**
```typescript
describe('ProjectExpenseSummary', () => {
  it('calculates utilization percentage correctly', () => {
    const stats = { totalBudget: 10000, approvedExpenses: 8000 };
    // 80% utilization, should show warning
  });

  it('handles zero budget gracefully', () => {
    const stats = { totalBudget: 0, approvedExpenses: 5000 };
    // Should not show budget bar, only actual
  });
});
```

### 6.2 Integration Tests

**TaskModal Field Visibility:**
1. Select "Work" type -> Verify materials section hidden
2. Select "Purchase" type -> Verify materials section emphasized
3. Select "Approval" type -> Verify cost fields hidden
4. Select "Admin" type -> Verify minimal fields shown
5. Edit existing task -> Verify expenses section visible

**Expense Creation from Task:**
1. Open task in edit mode
2. Click "Add Expense" button
3. Verify modal opens with pre-filled project/task
4. Verify dropdowns are disabled
5. Submit expense
6. Verify expense appears in task expense list
7. Verify task actual_cost updated (via trigger)

**Material to Expense Flow:**
1. Update material status to "delivered"
2. Verify prompt appears
3. Click "Create Expense"
4. Verify expense created with correct amount
5. Verify expense_line_item links to material_assignment
6. Verify material shows "Expense linked" indicator

### 6.3 E2E Tests (Playwright)

```typescript
test('purchase task workflow with materials and expenses', async ({ page }) => {
  // 1. Create purchase task
  await page.click('[data-testid="create-task"]');
  await page.click('[data-testid="task-type-purchase"]');
  await page.click('[data-testid="next-step"]');

  // 2. Verify materials section is emphasized
  await expect(page.locator('[data-testid="materials-section"]'))
    .toHaveClass(/border-emerald/);

  // 3. Add material
  await page.fill('[data-testid="material-search"]', 'lumber');
  await page.click('[data-testid="add-material"]');

  // 4. Save task
  await page.click('[data-testid="submit-task"]');

  // 5. Reopen task and verify expenses section
  await page.click('[data-testid="task-row"]');
  await expect(page.locator('[data-testid="expenses-section"]')).toBeVisible();

  // 6. Add expense from task
  await page.click('[data-testid="add-expense"]');
  await expect(page.locator('[data-testid="project-select"]')).toBeDisabled();
  await page.fill('[data-testid="expense-amount"]', '500');
  await page.click('[data-testid="submit-expense"]');

  // 7. Verify expense in list
  await expect(page.locator('[data-testid="expense-list"]')).toContainText('$500');
});
```

---

## 7. Implementation Plan

### 7.1 Development Phases

**Phase 1: Field Visibility Configuration (1 day)**
1. Create `/lib/config/task-type-fields.ts`
2. Add helper functions for visibility checks
3. Unit tests for configuration

**Phase 2: TaskModal Updates (2 days)**
1. Refactor TaskModal to use field visibility config
2. Conditionally render fields based on config
3. Apply appropriate labels (Labor Cost, Budget, etc.)
4. Apply default values (priority for admin, startDate for work/purchase/approval)
5. Test all 4 task types in create and edit modes

**Phase 3: TaskExpensesSection Component (1 day)**
1. Create TaskExpensesSection component
2. Integrate into TaskModal (edit mode only)
3. Create server action for fetching task expenses
4. Connect with CreateExpenseModal using taskContext

**Phase 4: CreateExpenseModal Updates (0.5 days)**
1. Handle taskContext prop
2. Disable project/task dropdowns when context provided
3. Display context info banner

**Phase 5: Material-Expense Integration (1 day)**
1. Create MaterialDeliveryPrompt component
2. Add to TaskMaterialsList when status changes to "delivered"
3. Create createExpenseFromMaterial server action
4. Add "Expense linked" indicator to material assignments

**Phase 6: ProjectCard Expense Indicator (0.5 days)**
1. Enhance getProjectsWithStats to include expense data
2. Create ExpenseBudgetIndicator sub-component
3. Add to ProjectCard

**Phase 7: ProjectExpenseSummary Widget (1 day)**
1. Create ProjectExpenseSummary component
2. Add to project detail page layout
3. Link to filtered expenses page

### 7.2 Dependencies

```
Phase 1 (Field Config)
    |
    v
Phase 2 (TaskModal Updates)
    |
    +---> Phase 3 (TaskExpensesSection)
    |         |
    |         v
    |     Phase 4 (CreateExpenseModal Updates)
    |
    +---> Phase 5 (Material-Expense Integration)

Phase 6 (ProjectCard) ----+
                          |
                          v
                     Phase 7 (ProjectExpenseSummary)
```

### 7.3 File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `/lib/config/task-type-fields.ts` | Create | Field visibility configuration |
| `/components/tasks/TaskModal.tsx` | Modify | Use field visibility config |
| `/components/tasks/TaskExpensesSection.tsx` | Create | Task expenses display |
| `/components/tasks/MaterialDeliveryPrompt.tsx` | Create | Material expense prompt |
| `/components/tasks/TaskMaterialsList.tsx` | Modify | Add delivery prompt trigger |
| `/components/expenses/CreateExpenseModal.tsx` | Modify | Handle taskContext |
| `/components/projects/ProjectExpenseSummary.tsx` | Create | Expense summary widget |
| `/components/projects/ProjectCard.tsx` | Modify | Add expense indicator |
| `/app/actions/expenses.ts` | Modify | Add new server actions |
| `/app/actions/projects.ts` | Modify | Add expense stats to query |
| `/app/app/projects/[id]/page.tsx` | Create/Modify | Add expense summary widget |

---

## 8. UI/UX Design

### 8.1 Field Visibility Implementation

**Work Task Form:**
```
+--------------------------------------------------+
| [Title] *                                         |
+--------------------------------------------------+
| [Description]                                     |
+--------------------------------------------------+
| [Project] *          | [Phase]                   |
+--------------------------------------------------+
| [Assignee]           | [Priority]                |
+--------------------------------------------------+
| [Start Date]         | [Due Date]                |
+--------------------------------------------------+
| [Labor Cost]         | [Actual Cost] (edit only) |
+--------------------------------------------------+
| --- Expenses Section (edit mode only) ---        |
+--------------------------------------------------+
```

**Purchase Task Form:**
```
+--------------------------------------------------+
| [Title] *                                         |
+--------------------------------------------------+
| [Description]                                     |
+--------------------------------------------------+
| [Project] *          | [Phase]                   |
+--------------------------------------------------+
| [Assignee]           | [Priority]                |
+--------------------------------------------------+
| [Start Date]         | [Due Date]                |
+--------------------------------------------------+
| [Budget]             | [Actual Cost] (auto-calc) |
+--------------------------------------------------+
| +----------------------------------------------+ |
| | MATERIALS (Required for Purchase Tasks)      | |
| | [Emphasized border - emerald-200]            | |
| | [Search Products] | [Assigned Materials]     | |
| +----------------------------------------------+ |
+--------------------------------------------------+
| --- Expenses Section (edit mode only) ---        |
+--------------------------------------------------+
```

**Approval Task Form:**
```
+--------------------------------------------------+
| [Title] *                     [Status Badge]     |
+--------------------------------------------------+
| [Description]                                     |
+--------------------------------------------------+
| [Project] *          | [Phase]                   |
+--------------------------------------------------+
| [Assignee]           | [Priority]                |
+--------------------------------------------------+
| [Start Date]         | [Due Date]                |
+--------------------------------------------------+
| +----------------------------------------------+ |
| | APPROVAL WORKFLOW                             | |
| | [Amber border]                                | |
| | [Approval Notes]                              | |
| | [Approve] [Request Revision] [Reject]         | |
| +----------------------------------------------+ |
+--------------------------------------------------+
```

**Admin Task Form (Minimal):**
```
+--------------------------------------------------+
| [Title] *                                         |
+--------------------------------------------------+
| [Description]                                     |
+--------------------------------------------------+
| [Project] *          | [Assignee]                |
+--------------------------------------------------+
| [Priority: Low]      | [Due Date]                |
+--------------------------------------------------+
```

### 8.2 TaskExpensesSection Layout

```
+------------------------------------------------------------------+
| [Receipt Icon] Expenses [3]                  [+ Add Expense]      |
+------------------------------------------------------------------+
| Total: $1,250.00        Approved: $750.00                        |
+------------------------------------------------------------------+
| +--------------------------------------------------------------+ |
| | Lumber for framing                          $500.00  [Check] | |
| | Home Depot - Dec 15, 2025                                    | |
| +--------------------------------------------------------------+ |
| | Electrical supplies                         $450.00  [Clock] | |
| | Lowe's - Dec 18, 2025                                        | |
| +--------------------------------------------------------------+ |
| | Hardware misc                               $300.00  [Check] | |
| | ACE Hardware - Dec 20, 2025                                  | |
| +--------------------------------------------------------------+ |
+------------------------------------------------------------------+
```

### 8.3 Project Card Expense Indicator

```
+------------------------------------------+
| Residential Remodel           [Active]   |
| Smith Family                             |
|------------------------------------------|
| [Type Icon] Residential    Dec 1, 2025   |
|------------------------------------------|
| [Progress Bar===============] 65%        |
|------------------------------------------|
| Budget          | Schedule               |
| Plan: $50K      | Days: 45d              |
| Actual: $32K    | Status: On Track       |
|------------------------------------------|
| [Receipt] Expenses: $28.5K / $50K  [!]   |  <-- NEW
|------------------------------------------|
| [Check] 12 [Box] 5 [Triangle] 2          |
|------------------------------------------|
| [Users] 4 members                        |
+------------------------------------------+
```

### 8.4 ProjectExpenseSummary Widget

```
+----------------------------------------------------------+
| [$] Expense Summary                      [View All ->]    |
+----------------------------------------------------------+
| Budget Utilization                              72%       |
| [=============================           ]                |
+----------------------------------------------------------+
| Total Budget     | Total Expenses                         |
| $50,000.00       | $36,000.00                             |
+----------------------------------------------------------+
| Approved         | Pending                                |
| $28,500.00 (green)| $7,500.00 (yellow)                    |
+----------------------------------------------------------+
| By Category                                               |
| Materials ........................... $18,500.00          |
| Labor ............................... $8,200.00           |
| Equipment ........................... $5,800.00           |
| Other ............................... $3,500.00           |
+----------------------------------------------------------+
```

---

## 9. Risk Assessment

### 9.1 Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Database trigger performance with many expenses | Low | Medium | Monitor query times, add indexes if needed |
| Field visibility config becomes too complex | Medium | Low | Keep config flat, avoid deep nesting |
| Race condition in material-expense linking | Low | Medium | Use database transaction, check before insert |

### 9.2 UX Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Users confused by field changes between types | Medium | Medium | Clear visual transition, type badge in header |
| Too many fields hidden for admin tasks | Low | Low | Ensure critical fields (title, project) always visible |
| Expense prompt disrupts material workflow | Medium | Low | Make prompt dismissible, add "Don't ask again" option in future |

### 9.3 Integration Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Existing task creation breaks | Low | High | Comprehensive testing, feature flag for rollback |
| Expense trigger conflicts with manual updates | Low | Medium | Document that actual_cost is read-only, add UI indicator |

---

## 10. Appendix

### 10.1 Related Documentation

- [Requirements Document](./requirements.md)
- [DB_SCHEMA.md](../../law/DB_SCHEMA.md)
- [UI_RULES.md](../../law/UI_RULES.md)
- [SYSTEM.md](../../law/SYSTEM.md)

### 10.2 Existing Component References

- `components/tasks/TaskModal.tsx` - Main task modal
- `components/tasks/TaskTypeSelector.tsx` - Type selection cards
- `components/tasks/TaskMaterialsManager.tsx` - Materials management
- `components/expenses/CreateExpenseModal.tsx` - Expense creation
- `components/expenses/ExpensesList.tsx` - Expense list display
- `components/projects/ProjectCard.tsx` - Project card display

### 10.3 Server Action References

- `app/actions/tasks.ts` - Task CRUD operations
- `app/actions/expenses.ts` - Expense CRUD operations
- `app/actions/projects.ts` - Project operations with stats
- `app/actions/materials.ts` - Material assignment operations
