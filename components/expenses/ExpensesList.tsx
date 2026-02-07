"use client";

import { useState, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import { m as motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Receipt, X, ShieldAlert, Wrench, DollarSign } from "lucide-react";
import { ExpenseCard } from "./ExpenseCard";
import { FilterBar } from "@/components/ui/FilterBar";
import { ExpenseProjectFilter } from "./ExpenseProjectFilter";
import { EmptyStateCard } from "@/components/ui/EmptyStateCard";
import type {
  ExpenseWithRelations,
  ExpensesListProps,
} from "@/types/db/expense";

const STATUS_FILTER_OPTIONS = [
  { label: "All Statuses", value: "all" },
  { label: "Submitted", value: "submitted" },
  { label: "Under Review", value: "under_review" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
  { label: "Paid", value: "paid" },
];

const SORT_FILTER_OPTIONS = [
  { label: "Latest First", value: "created_at" },
  { label: "Expense Date", value: "date" },
  { label: "Amount (High to Low)", value: "amount_high" },
  { label: "Amount (Low to High)", value: "amount_low" },
  { label: "Description (A-Z)", value: "description" },
  { label: "Status", value: "status" },
];

const EMPTY_STATE_STEPS = [
  { num: "01", label: "Upload", icon: Receipt },
  { num: "02", label: "Review", icon: DollarSign },
  { num: "03", label: "Approve", icon: Wrench },
];

const CreateExpenseModal = dynamic(
  () => import("./CreateExpenseModal").then((mod) => mod.CreateExpenseModal),
  { ssr: false },
);

const ExpenseDetailModal = dynamic(
  () => import("./ExpenseDetailModal").then((mod) => mod.ExpenseDetailModal),
  { ssr: false },
);

export function ExpensesList({
  initialExpenses,
  projects,
  tasks,
  searchParams: _searchParams,
  companyId,
  userRole,
}: ExpensesListProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedExpense, setSelectedExpense] =
    useState<ExpenseWithRelations | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("created_at");

  const normalizedQuery = useMemo(
    () => searchQuery.trim().toLowerCase(),
    [searchQuery],
  );

  // Calculate expense counts and amounts per project
  const { projectExpenseCounts, projectExpenseAmounts } = useMemo(() => {
    const counts: Record<string, number> = {};
    const amounts: Record<string, number> = {};
    initialExpenses.forEach((expense) => {
      if (expense.project?.id) {
        counts[expense.project.id] = (counts[expense.project.id] || 0) + 1;
        amounts[expense.project.id] =
          (amounts[expense.project.id] || 0) + expense.amount;
      }
    });
    return { projectExpenseCounts: counts, projectExpenseAmounts: amounts };
  }, [initialExpenses]);

  // Apply filters and sorting
  const filteredExpenses = useMemo(() => {
    let filtered = [...initialExpenses];

    // Search filter
    if (normalizedQuery) {
      filtered = filtered.filter(
        (expense) =>
          expense.description.toLowerCase().includes(normalizedQuery) ||
          expense.vendor_name?.toLowerCase().includes(normalizedQuery) ||
          expense.category.toLowerCase().includes(normalizedQuery),
      );
    }

    // Status filter
    if (statusFilter && statusFilter !== "all") {
      filtered = filtered.filter((expense) => expense.status === statusFilter);
    }

    // Project filter
    if (projectFilter && projectFilter !== "all") {
      filtered = filtered.filter(
        (expense) => expense.project?.id === projectFilter,
      );
    }

    // Sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "amount_high":
          return b.amount - a.amount;
        case "amount_low":
          return a.amount - b.amount;
        case "date":
          return (
            new Date(b.expense_date).getTime() -
            new Date(a.expense_date).getTime()
          );
        case "description":
          return a.description.localeCompare(b.description);
        case "status":
          return a.status.localeCompare(b.status);
        case "created_at":
        default:
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
      }
    });

    return filtered;
  }, [initialExpenses, normalizedQuery, statusFilter, projectFilter, sortBy]);

  // Calculate current expense count for the selected project
  const currentExpenseCount = useMemo(() => {
    if (projectFilter === "all") {
      return initialExpenses.length;
    }
    return projectExpenseCounts[projectFilter] || 0;
  }, [projectFilter, initialExpenses.length, projectExpenseCounts]);

  const handleClearFilters = useCallback(() => {
    setSearchQuery("");
    setStatusFilter("all");
    setProjectFilter("all");
    setSortBy("created_at");
  }, []);

  const handleExpenseSelect = useCallback((expense: ExpenseWithRelations) => {
    setSelectedExpense(expense);
  }, []);

  const searchConfig = useMemo(
    () => ({
      placeholder: "Search expenses...",
      value: searchQuery,
      onChange: setSearchQuery,
      colSpan: "half" as const,
    }),
    [searchQuery],
  );

  const filterConfigs = useMemo(
    () => [
      {
        name: "status",
        value: statusFilter,
        onChange: setStatusFilter,
        options: STATUS_FILTER_OPTIONS,
        placeholder: "All Statuses",
      },
      {
        name: "sort",
        value: sortBy,
        onChange: setSortBy,
        options: SORT_FILTER_OPTIONS,
        placeholder: "Sort By",
        colSpan: "auto" as const,
      },
    ],
    [statusFilter, sortBy],
  );

  // Empty State - No Expenses Created Yet
  if (initialExpenses.length === 0) {
    return (
      <>
        <EmptyStateCard
          icon={Receipt}
          title="SUBMIT YOUR FIRST EXPENSE"
          description="Track receipts, AI OCR processing, and automated expense management all in one place."
          buttonText="SUBMIT EXPENSE"
          onButtonClick={() => setShowCreateModal(true)}
          steps={EMPTY_STATE_STEPS}
          showButton={true}
        />

        {/* Create Expense Modal */}
        {showCreateModal && (
          <CreateExpenseModal
            projects={projects}
            tasks={tasks}
            onClose={() => setShowCreateModal(false)}
            companyId={companyId}
          />
        )}
      </>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Filters - Sticky on Mobile */}
      <div className="sticky top-0 md:relative z-40 md:z-auto pt-[env(safe-area-inset-top)] md:pt-0 bg-white md:bg-transparent">
        <FilterBar searchConfig={searchConfig} filters={filterConfigs}>
          {/* Project Filter with expense counts and total amounts */}
          <ExpenseProjectFilter
            projects={projects}
            selectedProjectId={projectFilter}
            onProjectChange={setProjectFilter}
            expenseCount={currentExpenseCount}
            projectExpenseCounts={projectExpenseCounts}
            projectExpenseAmounts={projectExpenseAmounts}
          />
        </FilterBar>
      </div>

      {/* No Results State */}
      {filteredExpenses.length === 0 ? (
        <div className="relative">
          <div className="absolute inset-0 border-2 border-dashed border-construction-red/20 rounded-xl transform rotate-1" />

          <div className="relative flex flex-col items-center justify-center py-20 px-8 bg-gradient-to-br from-gray-50 to-white rounded-xl border-2 border-dashed border-gray-300">
            {/* Warning Icon */}
            <motion.div
              className="mb-6 p-6 bg-gradient-to-br from-construction-red/10 to-construction-red/5 rounded-2xl border-2 border-construction-red/20"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, type: "spring" }}
            >
              <ShieldAlert className="h-16 w-16 text-construction-red" />
            </motion.div>

            <h3 className="text-3xl font-black text-construction-red mb-3">
              NO EXPENSES FOUND
            </h3>

            <p className="text-gray-600 font-medium mb-8 max-w-md text-center text-lg">
              No expenses match your current filters. Adjust search criteria or
              clear all filters.
            </p>

            <Button
              size="lg"
              onClick={handleClearFilters}
              className="h-12 px-8 bg-white border-2 border-construction-red hover:bg-construction-red hover:text-white transition-all shadow-construction font-black group"
            >
              <X className="mr-2 h-5 w-5 group-hover:rotate-90 transition-transform" />
              CLEAR ALL FILTERS
            </Button>
          </div>
        </div>
      ) : (
        /* Expense Grid with Staggered Animation */
        <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {filteredExpenses.map((expense, index) => (
            <motion.div
              key={expense.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: index < 20 ? index * 0.05 : 0,
                duration: 0.5,
                type: "spring",
                stiffness: 200,
                damping: 20,
              }}
              onClick={() => handleExpenseSelect(expense)}
            >
              <ExpenseCard expense={expense} />
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Expense Modal */}
      {showCreateModal && (
        <CreateExpenseModal
          projects={projects}
          tasks={tasks}
          onClose={() => setShowCreateModal(false)}
          companyId={companyId}
        />
      )}

      {/* Expense Detail Modal */}
      {selectedExpense && (
        <ExpenseDetailModal
          expense={selectedExpense}
          onClose={() => setSelectedExpense(null)}
          userRole={userRole}
        />
      )}
    </div>
  );
}
