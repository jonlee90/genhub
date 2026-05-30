"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { m as motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import Receipt from "lucide-react/icons/receipt";
import X from "lucide-react/icons/x";
import ShieldAlert from "lucide-react/icons/shield-alert";
import Wrench from "lucide-react/icons/wrench";
import DollarSign from "lucide-react/icons/dollar-sign";
import ChevronUp from "lucide-react/icons/chevron-up";
import ChevronDown from "lucide-react/icons/chevron-down";
import { ExpenseRow } from "./ExpenseRow";
import { FilterBar } from "@/components/ui/FilterBar";
import { ExpenseProjectFilter } from "./ExpenseProjectFilter";
import { EmptyStateCard } from "@/components/ui/EmptyStateCard";
import { InfiniteScrollSentinel } from "@/components/ui/InfiniteScrollSentinel";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { CATEGORY_FILTER_OPTIONS } from "@/lib/constants/expense-categories";
import { formatCurrency } from "@/lib/utils";
import {
  getExpensesPage,
  getExpensesSummary,
  type ExpenseQueryFilters,
} from "@/app/actions/expenses";
import type {
  ExpenseWithRelations,
  ExpensesListProps,
} from "@/types/db/expense";

const PAGE_SIZE = 30;

const SORT_FILTER_OPTIONS = [
  { label: "Latest First", value: "created_at" },
  { label: "Expense Date", value: "date" },
  { label: "Amount (High to Low)", value: "amount_high" },
  { label: "Amount (Low to High)", value: "amount_low" },
  { label: "Description (A-Z)", value: "description" },
];

const DATE_RANGE_OPTIONS = [
  { label: "All Time", value: "all" },
  { label: "This Month", value: "month" },
  { label: "Last 30 Days", value: "last30" },
  { label: "This Year", value: "year" },
];

const RECEIPT_OPTIONS = [
  { label: "All Expenses", value: "all" },
  { label: "With Receipt", value: "with" },
  { label: "Without Receipt", value: "without" },
];

const EMPTY_STATE_STEPS = [
  { num: "01", label: "Upload", icon: Receipt },
  { num: "02", label: "Track", icon: DollarSign },
  { num: "03", label: "Manage", icon: Wrench },
];

const CreateExpenseModal = dynamic(
  () => import("./CreateExpenseModal").then((mod) => mod.CreateExpenseModal),
  { ssr: false },
);

const ExpenseDetailModal = dynamic(
  () => import("./ExpenseDetailModal").then((mod) => mod.ExpenseDetailModal),
  { ssr: false },
);

type SortValue = NonNullable<ExpenseQueryFilters["sort"]>;
type ReceiptFilter = NonNullable<ExpenseQueryFilters["hasReceipt"]>;
type DateRangeFilter = NonNullable<ExpenseQueryFilters["dateRange"]>;

export function ExpensesList({
  initialExpenses,
  initialHasMore,
  aggregates,
  projects,
  tasks,
  companyId,
  userRole,
  currentUserId,
}: ExpensesListProps) {
  const router = useRouter();
  const company = companyId ?? "";

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedExpense, setSelectedExpense] =
    useState<ExpenseWithRelations | null>(null);
  const [editingExpense, setEditingExpense] =
    useState<ExpenseWithRelations | null>(null);

  // Filter state
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [category, setCategory] = useState<string>("all");
  const [hasReceipt, setHasReceipt] = useState<ReceiptFilter>("all");
  const [dateRange, setDateRange] = useState<DateRangeFilter>("all");
  const [sortBy, setSortBy] = useState<SortValue>("created_at");
  // Bumped after a create/edit so the paginated list refetches page 0
  const [refreshVersion, setRefreshVersion] = useState(0);

  // Debounce search input -> debouncedSearch (300ms)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchInput.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const filters = useMemo<ExpenseQueryFilters>(
    () => ({
      search: debouncedSearch || undefined,
      projectId: projectFilter,
      category,
      hasReceipt,
      dateRange,
      sort: sortBy,
    }),
    [debouncedSearch, projectFilter, category, hasReceipt, dateRange, sortBy],
  );

  const resetKey = useMemo(
    () => `${JSON.stringify(filters)}::${refreshVersion}`,
    [filters, refreshVersion],
  );

  const fetchPage = useCallback(
    async (offset: number) => {
      const result = await getExpensesPage(company, filters, offset, PAGE_SIZE);
      return {
        items: result.data.expenses,
        hasMore: result.data.hasMore,
      };
    },
    // resetKey captures all filter values; company is stable
    [company, resetKey], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const { items, isLoading, isError, hasMore, sentinelRef } =
    useInfiniteScroll<ExpenseWithRelations>({
      initialItems: initialExpenses,
      initialHasMore,
      pageSize: PAGE_SIZE,
      resetKey,
      fetchPage,
    });

  // Filtered result count + total ($) bar. Seed from unfiltered aggregates,
  // refetch whenever filters change.
  const [summary, setSummary] = useState({
    count: aggregates.totalCount,
    totalAmount: aggregates.totalAmount,
  });
  const didMountSummary = useRef(false);

  useEffect(() => {
    if (!didMountSummary.current) {
      didMountSummary.current = true;
      return; // initial state already matches unfiltered aggregates
    }
    let active = true;
    getExpensesSummary(company, filters).then((result) => {
      if (active) setSummary(result);
    });
    return () => {
      active = false;
    };
  }, [company, resetKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleClearFilters = useCallback(() => {
    setSearchInput("");
    setDebouncedSearch("");
    setProjectFilter("all");
    setCategory("all");
    setHasReceipt("all");
    setDateRange("all");
    setSortBy("created_at");
  }, []);

  const handleExpenseSelect = useCallback((expense: ExpenseWithRelations) => {
    setSelectedExpense(expense);
  }, []);

  const handleEdit = useCallback(() => {
    setEditingExpense(selectedExpense);
    setSelectedExpense(null);
  }, [selectedExpense]);

  // After a create/edit: refresh server props (aggregates) AND refetch the list
  const handleMutationSuccess = useCallback(() => {
    setRefreshVersion((v) => v + 1);
    router.refresh();
  }, [router]);

  // Sortable desktop headers
  const handleSortPayee = useCallback(() => setSortBy("description"), []);
  const handleSortDate = useCallback(() => setSortBy("date"), []);
  const handleSortAmount = useCallback(
    () =>
      setSortBy((prev) =>
        prev === "amount_high" ? "amount_low" : "amount_high",
      ),
    [],
  );

  const currentExpenseCount = useMemo(() => {
    if (projectFilter === "all") return aggregates.totalCount;
    return aggregates.projectCounts[projectFilter] ?? 0;
  }, [projectFilter, aggregates]);

  const searchConfig = useMemo(
    () => ({
      placeholder: "Search expenses...",
      value: searchInput,
      onChange: setSearchInput,
      colSpan: "half" as const,
    }),
    [searchInput],
  );

  const filterConfigs = useMemo(
    () => [
      {
        name: "category",
        value: category,
        onChange: setCategory,
        options: CATEGORY_FILTER_OPTIONS,
        placeholder: "All Categories",
        colSpan: "auto" as const,
      },
      {
        name: "dateRange",
        value: dateRange,
        onChange: (v: string) => setDateRange(v as DateRangeFilter),
        options: DATE_RANGE_OPTIONS,
        placeholder: "All Time",
        colSpan: "auto" as const,
      },
      {
        name: "receipt",
        value: hasReceipt,
        onChange: (v: string) => setHasReceipt(v as ReceiptFilter),
        options: RECEIPT_OPTIONS,
        placeholder: "All Expenses",
        colSpan: "auto" as const,
      },
      {
        name: "sort",
        value: sortBy,
        onChange: (v: string) => setSortBy(v as SortValue),
        options: SORT_FILTER_OPTIONS,
        placeholder: "Sort By",
        colSpan: "auto" as const,
      },
    ],
    [category, dateRange, hasReceipt, sortBy],
  );

  // Empty State - No Expenses Created Yet (company-wide)
  if (aggregates.totalCount === 0) {
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

        {showCreateModal ? (
          <CreateExpenseModal
            projects={projects}
            tasks={tasks}
            onClose={() => setShowCreateModal(false)}
            companyId={companyId}
          />
        ) : null}
      </>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Filters - Sticky on Mobile */}
      <div className="sticky top-0 md:relative z-40 md:z-auto pt-[env(safe-area-inset-top)] md:pt-0 bg-white dark:bg-gray-900 md:bg-transparent md:dark:bg-transparent">
        <FilterBar searchConfig={searchConfig} filters={filterConfigs}>
          <ExpenseProjectFilter
            projects={projects}
            selectedProjectId={projectFilter}
            onProjectChange={setProjectFilter}
            expenseCount={currentExpenseCount}
            projectExpenseCounts={aggregates.projectCounts}
            projectExpenseAmounts={aggregates.projectAmounts}
          />
        </FilterBar>
      </div>

      {/* Result count + total bar (reflects active filters) */}
      <div className="flex items-center justify-between gap-2 px-3 md:px-4 py-2 md:py-2.5 bg-gradient-to-r from-construction-blue/5 to-transparent rounded-lg border-l-4 border-construction-blue/30">
        <span className="text-sm font-semibold text-construction-blue dark:text-blue-400">
          {summary.count} {summary.count === 1 ? "expense" : "expenses"}
        </span>
        <span className="flex items-center gap-1 text-sm font-bold tabular-nums text-construction-blue dark:text-blue-400">
          <DollarSign className="h-3.5 w-3.5" />
          {formatCurrency(summary.totalAmount)}
        </span>
      </div>

      {/* No Results State (filters matched nothing) */}
      {items.length === 0 && !isLoading ? (
        <div className="relative">
          <div className="absolute inset-0 border-2 border-dashed border-construction-red/20 rounded-xl transform rotate-1" />

          <div className="relative flex flex-col items-center justify-center py-20 px-8 bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-900 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700">
            <motion.div
              className="mb-6 p-6 bg-gradient-to-br from-construction-red/10 to-construction-red/5 rounded-2xl border-2 border-construction-red/20"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.2, type: "spring" }}
            >
              <ShieldAlert className="h-16 w-16 text-construction-red" />
            </motion.div>

            <h3 className="text-3xl font-black text-construction-red mb-3">
              NO EXPENSES FOUND
            </h3>

            <p className="text-gray-600 dark:text-gray-400 font-medium mb-8 max-w-md text-center text-lg">
              No expenses match your current filters. Adjust search criteria or
              clear all filters.
            </p>

            <Button
              size="lg"
              onClick={handleClearFilters}
              className="min-h-[44px] h-12 px-8 bg-white dark:bg-gray-800 border-2 border-construction-red hover:bg-construction-red hover:text-white active:scale-[0.98] transition-all shadow-construction font-black group"
            >
              <X className="mr-2 h-5 w-5 group-hover:rotate-90 transition-transform" />
              CLEAR ALL FILTERS
            </Button>
          </div>
        </div>
      ) : (
        /* Expense List */
        <div className="bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-xl shadow-construction overflow-hidden">
          {/* Desktop-only sortable column header */}
          <div className="hidden md:grid md:grid-cols-[minmax(0,2fr)_132px_minmax(0,1.5fr)_104px_120px] md:gap-4 px-4 py-2 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700 text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
            <button
              type="button"
              onClick={handleSortPayee}
              className="flex items-center gap-1 text-left hover:text-construction-blue dark:hover:text-blue-400 transition-colors"
            >
              Payee
              {sortBy === "description" ? (
                <ChevronUp className="h-3 w-3" />
              ) : null}
            </button>
            <span>Category</span>
            <span>Project</span>
            <button
              type="button"
              onClick={handleSortDate}
              className="flex items-center justify-end gap-1 text-right hover:text-construction-blue dark:hover:text-blue-400 transition-colors"
            >
              Date
              {sortBy === "date" ? <ChevronDown className="h-3 w-3" /> : null}
            </button>
            <button
              type="button"
              onClick={handleSortAmount}
              className="flex items-center justify-end gap-1 text-right hover:text-construction-blue dark:hover:text-blue-400 transition-colors"
            >
              Amount
              {sortBy === "amount_high" ? (
                <ChevronDown className="h-3 w-3" />
              ) : sortBy === "amount_low" ? (
                <ChevronUp className="h-3 w-3" />
              ) : null}
            </button>
          </div>

          {items.map((expense, index) => (
            <motion.div
              key={expense.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: index < PAGE_SIZE ? Math.min(index, 15) * 0.02 : 0,
                duration: 0.2,
                type: "spring",
                stiffness: 200,
                damping: 20,
              }}
            >
              <ExpenseRow
                expense={expense}
                onClick={() => handleExpenseSelect(expense)}
              />
            </motion.div>
          ))}

          <InfiniteScrollSentinel
            sentinelRef={sentinelRef}
            isLoading={isLoading}
            hasMore={hasMore}
            itemCount={items.length}
          />

          {isError ? (
            <div className="px-4 py-3 text-center text-sm text-construction-red">
              Failed to load more expenses. Scroll to retry.
            </div>
          ) : null}
        </div>
      )}

      {/* Create Expense Modal */}
      {showCreateModal ? (
        <CreateExpenseModal
          projects={projects}
          tasks={tasks}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            handleMutationSuccess();
          }}
          companyId={companyId}
        />
      ) : null}

      {/* Expense Detail Modal */}
      {selectedExpense ? (
        <ExpenseDetailModal
          expense={selectedExpense}
          onClose={() => setSelectedExpense(null)}
          userRole={userRole}
          onEdit={handleEdit}
          currentUserId={currentUserId}
        />
      ) : null}

      {/* Edit Expense Modal */}
      {editingExpense ? (
        <CreateExpenseModal
          projects={projects}
          tasks={tasks}
          expense={editingExpense}
          onClose={() => setEditingExpense(null)}
          onSuccess={() => {
            setEditingExpense(null);
            handleMutationSuccess();
          }}
          companyId={companyId}
        />
      ) : null}
    </div>
  );
}
