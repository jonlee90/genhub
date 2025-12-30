'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Receipt, Plus, Search, Filter, Eye, FileText, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { CreateExpenseModal } from './CreateExpenseModal';
import { ExpenseDetailModal } from './ExpenseDetailModal';

interface Project {
  id: string;
  name: string;
}

interface Task {
  id: string;
  title: string;
  project_id: string;
}

interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  expense_date: string;
  vendor_name: string | null;
  receipt_url: string | null;
  status: 'submitted' | 'under_review' | 'approved' | 'rejected' | 'paid';
  created_at: string;
  project: {
    id: string;
    name: string;
  } | null;
  task?: {
    id: string;
    title: string;
  } | null;
  submitter?: {
    id: string;
    name: string;
    email: string;
  } | null;
}

interface ExpensesListProps {
  expenses: Expense[];
  projects: Project[];
  tasks: Task[];
}

const STATUS_CONFIG = {
  submitted: {
    label: 'Submitted',
    color: 'bg-gray-100 text-gray-700 border-gray-300',
  },
  under_review: {
    label: 'Under Review',
    color: 'bg-construction-blue/10 text-construction-blue border-construction-blue',
  },
  approved: {
    label: 'Approved',
    color: 'bg-construction-green/10 text-construction-green border-construction-green/30',
  },
  rejected: {
    label: 'Rejected',
    color: 'bg-construction-red/10 text-construction-red border-construction-red/30',
  },
  paid: {
    label: 'Paid',
    color: 'bg-construction-green/10 text-construction-green border-construction-green/30',
  },
};

export function ExpensesList({ expenses, projects, tasks }: ExpensesListProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [projectFilter, setProjectFilter] = useState<string>('all');

  // Filter expenses
  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = searchQuery === '' ||
      expense.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      expense.vendor_name?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || expense.status === statusFilter;
    const matchesProject = projectFilter === 'all' || expense.project?.id === projectFilter;

    return matchesSearch && matchesStatus && matchesProject;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <>
      <Card className="border-2 border-gray-200 shadow-construction">
        <CardHeader className="border-b-2 border-gray-100 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-black text-construction-blue flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              All Expenses ({filteredExpenses.length})
            </CardTitle>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-construction-blue hover:bg-construction-blue/90 text-white font-bold"
            >
              <Plus className="h-4 w-4 mr-2" />
              Submit Expense
            </Button>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-4 mt-4">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search expenses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-2"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px] border-2">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="under_review">Under Review</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>

            {/* Project Filter */}
            <Select value={projectFilter} onValueChange={setProjectFilter}>
              <SelectTrigger className="w-[200px] border-2">
                <SelectValue placeholder="All Projects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                {projects.map(project => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {filteredExpenses.length > 0 ? (
            <div className="space-y-3">
              <AnimatePresence>
                {filteredExpenses.map((expense, index) => {
                  const statusConfig = STATUS_CONFIG[expense.status];

                  return (
                    <motion.div
                      key={expense.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ delay: index * 0.03 }}
                      className="bg-white border-2 border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => setSelectedExpense(expense)}
                    >
                      <div className="flex items-start gap-4">
                        {/* Receipt Icon */}
                        <div className={cn(
                          "p-3 rounded-lg border-2 shrink-0",
                          expense.receipt_url
                            ? "bg-construction-blue/10 border-construction-blue/20"
                            : "bg-gray-100 border-gray-200"
                        )}>
                          {expense.receipt_url ? (
                            <ImageIcon className="h-6 w-6 text-construction-blue" />
                          ) : (
                            <FileText className="h-6 w-6 text-gray-400" />
                          )}
                        </div>

                        {/* Expense Details */}
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-construction-blue line-clamp-1">
                                {expense.description}
                              </h4>
                              <div className="flex items-center gap-3 mt-1 text-sm text-gray-600">
                                {expense.vendor_name && (
                                  <>
                                    <span>{expense.vendor_name}</span>
                                    <span className="text-gray-400">•</span>
                                  </>
                                )}
                                <Badge variant="outline" className="font-semibold capitalize text-xs">
                                  {expense.category}
                                </Badge>
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <div className="text-2xl font-black text-construction-blue">
                                {formatCurrency(expense.amount)}
                              </div>
                              <div className="text-xs text-gray-600 mt-1">
                                {formatDate(expense.expense_date)}
                              </div>
                            </div>
                          </div>

                          {/* Project and Task */}
                          <div className="flex items-center gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">Project:</span>{' '}
                              <span className="font-semibold text-gray-900">{expense.project?.name || 'N/A'}</span>
                            </div>
                            {expense.task && (
                              <>
                                <span className="text-gray-400">•</span>
                                <div>
                                  <span className="text-gray-600">Task:</span>{' '}
                                  <span className="font-semibold text-gray-900">{expense.task.title}</span>
                                </div>
                              </>
                            )}
                          </div>

                          {/* Status and Submitter */}
                          <div className="flex items-center gap-3">
                            <Badge className={cn('font-semibold border-2', statusConfig.color)}>
                              {statusConfig.label}
                            </Badge>
                            {expense.submitter && (
                              <span className="text-xs text-gray-600">
                                Submitted by {expense.submitter.name}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* View Button */}
                        <Button
                          variant="outline"
                          size="sm"
                          className="shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedExpense(expense);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          ) : (
            <div className="text-center py-12">
              <Receipt className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">No Expenses Found</h3>
              <p className="text-gray-600 mb-4">
                {searchQuery || statusFilter !== 'all' || projectFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Submit your first expense to get started'
                }
              </p>
              {!(searchQuery || statusFilter !== 'all' || projectFilter !== 'all') && (
                <Button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-construction-blue hover:bg-construction-blue/90 text-white font-bold"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Submit Expense
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Expense Modal */}
      {showCreateModal && (
        <CreateExpenseModal
          projects={projects}
          tasks={tasks}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {/* Expense Detail Modal */}
      {selectedExpense && (
        <ExpenseDetailModal
          expense={selectedExpense}
          onClose={() => setSelectedExpense(null)}
        />
      )}
    </>
  );
}
