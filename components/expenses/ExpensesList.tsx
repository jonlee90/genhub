"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Receipt, X, ShieldAlert, Wrench, DollarSign } from "lucide-react";
import { ExpenseCard } from "./ExpenseCard";
import { FilterBar } from "@/components/ui/FilterBar";
import { ExpenseProjectFilter } from "./ExpenseProjectFilter";
import { CreateExpenseModal } from "./CreateExpenseModal";
import { ExpenseDetailModal } from "./ExpenseDetailModal";
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

export function ExpensesList({
  initialExpenses,
  projects,
  tasks,
  searchParams,
  companyId,
}: ExpensesListProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedExpense, setSelectedExpense] =
    useState<ExpenseWithRelations | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("created_at");

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
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (expense) =>
          expense.description.toLowerCase().includes(query) ||
          expense.vendor_name?.toLowerCase().includes(query) ||
          expense.category.toLowerCase().includes(query),
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
  }, [initialExpenses, searchQuery, statusFilter, projectFilter, sortBy]);

  // Calculate current expense count for the selected project
  const currentExpenseCount = useMemo(() => {
    if (projectFilter === "all") {
      return initialExpenses.length;
    }
    return projectExpenseCounts[projectFilter] || 0;
  }, [projectFilter, initialExpenses.length, projectExpenseCounts]);

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
      <div className="relative">
        {/* Industrial Frame - hidden on mobile */}
        <div className="hidden md:block absolute inset-0 border-4 border-construction-blue/10 rounded-2xl transform rotate-1" />
        <div className="hidden md:block absolute inset-0 border-4 border-construction-accent/10 rounded-2xl transform -rotate-1" />

        <div className="relative flex flex-col items-center justify-center py-12 md:py-24 px-4 md:px-8 bg-gradient-to-br from-gray-50 via-white to-gray-50 rounded-xl md:rounded-2xl border-2 border-gray-200 shadow-construction-lg">
          {/* Construction Site Illustration */}
          <div className="relative mb-6 md:mb-8">
            {/* Receipt Icon - Central */}
            <motion.div
              className="relative z-10"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, type: "spring", stiffness: 200 }}
            >
              <div className="relative p-5 md:p-8 bg-gradient-to-br from-construction-blue to-blue-700 rounded-2xl md:rounded-3xl shadow-construction-xl">
                <Receipt className="h-12 w-12 md:h-20 md:w-20 text-white" />
                <div className="absolute -top-1 -right-1 md:-top-2 md:-right-2 w-4 h-4 md:w-6 md:h-6 bg-construction-accent rounded-full animate-pulse" />
              </div>
            </motion.div>

            {/* Floating Tools - hidden on small mobile */}
            <motion.div
              className="hidden sm:block absolute -left-10 md:-left-12 top-6 md:top-8 p-2 md:p-3 bg-white rounded-lg md:rounded-xl shadow-construction border-2 border-gray-200"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              <DollarSign className="h-4 w-4 md:h-6 md:w-6 text-construction-accent" />
            </motion.div>

            <motion.div
              className="hidden sm:block absolute -right-10 md:-right-12 top-8 md:top-12 p-2 md:p-3 bg-white rounded-lg md:rounded-xl shadow-construction border-2 border-gray-200"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              <Wrench className="h-4 w-4 md:h-6 md:w-6 text-construction-blue" />
            </motion.div>
          </div>

          {/* Heavy Industrial Typography */}
          <motion.h2
            className="text-2xl sm:text-3xl md:text-5xl font-black text-center mb-3 md:mb-4 bg-gradient-to-r from-construction-blue via-construction-blue to-blue-700 bg-clip-text text-transparent leading-tight"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            SUBMIT YOUR
            <br />
            FIRST EXPENSE
          </motion.h2>

          <motion.p
            className="text-sm md:text-lg text-gray-600 font-medium mb-6 md:mb-10 max-w-xl text-center leading-relaxed px-4"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            Track receipts, AI OCR processing, and automated expense management
            all in one place.
          </motion.p>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.6 }}
          >
            <Button
              size="lg"
              onClick={() => setShowCreateModal(true)}
              className="relative h-12 md:h-16 px-6 md:px-10 bg-gradient-to-r from-construction-blue to-blue-700 hover:from-construction-blue/90 hover:to-blue-700/90 shadow-construction-xl hover:shadow-2xl transition-all group overflow-hidden text-sm md:text-lg font-black text-white"
            >
              <div className="absolute inset-0 bg-construction-accent opacity-0 group-hover:opacity-20 transition-opacity" />
              <Receipt className="mr-2 md:mr-3 h-5 w-5 md:h-6 md:w-6 group-hover:rotate-12 transition-transform" />
              SUBMIT EXPENSE
            </Button>
          </motion.div>

          {/* Industrial Process Steps */}
          <div className="mt-8 md:mt-12 grid grid-cols-3 gap-2 md:gap-6 max-w-2xl w-full">
            {EMPTY_STATE_STEPS.map((step, index) => (
              <motion.div
                key={step.num}
                className="relative group"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.7 + index * 0.1, duration: 0.6 }}
              >
                <div className="flex flex-col items-center p-2 md:p-4 bg-white border-2 border-gray-200 rounded-lg md:rounded-xl hover:border-construction-blue transition-all shadow-construction hover:shadow-construction-lg">
                  <div className="flex items-center justify-center w-8 h-8 md:w-12 md:h-12 rounded-lg bg-construction-blue/10 border-2 border-construction-blue/20 mb-2 md:mb-3 group-hover:scale-110 transition-transform">
                    <step.icon className="h-4 w-4 md:h-6 md:w-6 text-construction-blue" />
                  </div>
                  <div className="text-lg md:text-2xl font-black text-construction-blue mb-0.5 md:mb-1">
                    {step.num}
                  </div>
                  <p className="text-[10px] md:text-sm font-bold text-gray-600 text-center">
                    {step.label}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Create Expense Modal */}
        {showCreateModal && (
          <CreateExpenseModal
            projects={projects}
            tasks={tasks}
            onClose={() => setShowCreateModal(false)}
            companyId={companyId}
          />
        )}
      </div>
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
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("all");
                setProjectFilter("all");
                setSortBy("created_at");
              }}
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
                delay: index * 0.05,
                duration: 0.5,
                type: "spring",
                stiffness: 200,
                damping: 20,
              }}
              onClick={() => setSelectedExpense(expense)}
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
        />
      )}
    </div>
  );
}
