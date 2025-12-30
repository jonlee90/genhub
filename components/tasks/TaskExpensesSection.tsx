'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Receipt,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { CreateExpenseModal } from '@/components/expenses/CreateExpenseModal';

// Debug: Task expense interface
export interface TaskExpense {
  id: string;
  description: string;
  amount: number;
  status: 'submitted' | 'under_review' | 'approved' | 'rejected' | 'paid';
  expense_date: string;
  vendor_name: string | null;
  category: string;
}

// Debug: Props for TaskExpensesSection
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

// Debug: Status configuration for expense badges
const STATUS_CONFIG = {
  submitted: {
    icon: Clock,
    color: 'text-gray-600',
    bg: 'bg-gray-100',
    label: 'Submitted',
  },
  under_review: {
    icon: Clock,
    color: 'text-construction-blue',
    bg: 'bg-construction-blue/10',
    label: 'Under Review',
  },
  approved: {
    icon: CheckCircle2,
    color: 'text-construction-green',
    bg: 'bg-construction-green/10',
    label: 'Approved',
  },
  rejected: {
    icon: XCircle,
    color: 'text-construction-red',
    bg: 'bg-construction-red/10',
    label: 'Rejected',
  },
  paid: {
    icon: CheckCircle2,
    color: 'text-construction-green',
    bg: 'bg-construction-green/10',
    label: 'Paid',
  },
};

// Debug: Format currency helper
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

// Debug: TaskExpensesSection component
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
  // Debug: State for create expense modal
  const [showCreateModal, setShowCreateModal] = useState(false);

  console.log('Debug: TaskExpensesSection rendering', {
    taskId,
    taskTitle,
    expensesCount: expenses.length,
  });

  // Debug: Calculate expense totals
  const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);
  const approvedAmount = expenses
    .filter(e => e.status === 'approved' || e.status === 'paid')
    .reduce((sum, e) => sum + e.amount, 0);

  console.log('Debug: Expense totals', {
    total: totalAmount,
    approved: approvedAmount,
  });

  // Debug: Handle expense created callback
  const handleExpenseCreated = async () => {
    console.log('Debug: Expense created successfully, closing modal and refreshing list');
    setShowCreateModal(false);
    // Refresh expense list in TaskModal
    if (onExpenseAdded) {
      await onExpenseAdded();
    }
  };

  return (
    <div className="space-y-3">
      {/* Debug: Header with totals and add button */}
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
          onClick={() => {
            console.log('Debug: Opening create expense modal');
            setShowCreateModal(true);
          }}
          className="bg-construction-blue hover:bg-construction-blue/90 text-white font-bold"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Expense
        </Button>
      </div>

      {/* Debug: Summary row with totals */}
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

      {/* Debug: Expense list */}
      {expenses.length > 0 ? (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {expenses.map((expense, index) => {
            const status = STATUS_CONFIG[expense.status];
            const StatusIcon = status.icon;

            console.log('Debug: Rendering expense', {
              id: expense.id,
              description: expense.description,
              amount: expense.amount,
              status: expense.status,
            });

            return (
              <motion.div
                key={expense.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
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
              </motion.div>
            );
          })}
        </div>
      ) : (
        // Debug: Empty state
        <div className="text-center py-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
          <Receipt className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No expenses yet</p>
          <p className="text-xs text-gray-400 mt-1">
            Add expenses to track actual costs
          </p>
        </div>
      )}

      {/* Debug: Create Expense Modal with task context */}
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
