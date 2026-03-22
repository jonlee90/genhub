"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import Filter from "lucide-react/icons/filter";
import Plus from "lucide-react/icons/plus";
import X from "lucide-react/icons/x";

interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  expense_date: string;
  vendor_name?: string | null;
  payment_method?: string | null;
  store_account?: string | null;
  status: string;
  project?: { id: string; name: string } | null;
  task?: { id: string; title: string } | null;
}

interface ProjectExpensesProps {
  projectId: string;
  expenses: Expense[];
  onAddExpense: () => void;
  onRefresh: () => void;
}

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

function getStatusColor(status: string) {
  switch (status) {
    case "approved":
    case "paid":
      return "bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400";
    case "under_review":
      return "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400";
    case "rejected":
      return "bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400";
    default:
      return "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400";
  }
}

function ExpenseRow({ expense }: { expense: Expense }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">
              {expense.description}
            </p>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5 text-xs text-gray-500 dark:text-gray-400">
              <span className="capitalize">{expense.category}</span>
              {expense.vendor_name ? (
                <>
                  <span>·</span>
                  <span>{expense.vendor_name}</span>
                  {expense.store_account ? (
                    <span className="text-gray-400">
                      ({expense.store_account})
                    </span>
                  ) : null}
                </>
              ) : null}
              <span>·</span>
              <span>
                {dateFormatter.format(new Date(expense.expense_date))}
              </span>
            </div>
            {expense.payment_method ? (
              <span className="inline-block mt-1 px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs font-medium text-gray-600 dark:text-gray-300">
                {expense.payment_method}
              </span>
            ) : null}
          </div>
          <div className="text-right shrink-0">
            <div className="font-bold text-gray-900 dark:text-gray-100">
              {currencyFormatter.format(expense.amount)}
            </div>
            <span
              className={cn(
                "inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-semibold capitalize",
                getStatusColor(expense.status),
              )}
            >
              {expense.status.replace("_", " ")}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProjectExpenses({
  expenses,
  onAddExpense,
}: ProjectExpensesProps) {
  const [vendorFilter, setVendorFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  // Derive unique filter options
  const vendors = useMemo(() => {
    const set = new Set<string>();
    expenses.forEach((e) => {
      if (e.vendor_name) set.add(e.vendor_name);
    });
    return Array.from(set).sort();
  }, [expenses]);

  const paymentMethods = useMemo(() => {
    const set = new Set<string>();
    expenses.forEach((e) => {
      if (e.payment_method) set.add(e.payment_method);
    });
    return Array.from(set).sort();
  }, [expenses]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    expenses.forEach((e) => set.add(e.category));
    return Array.from(set).sort();
  }, [expenses]);

  // Filtered expenses
  const filtered = useMemo(() => {
    return expenses.filter((e) => {
      if (vendorFilter && e.vendor_name !== vendorFilter) return false;
      if (paymentFilter && e.payment_method !== paymentFilter) return false;
      if (categoryFilter && e.category !== categoryFilter) return false;
      return true;
    });
  }, [expenses, vendorFilter, paymentFilter, categoryFilter]);

  // Vendor summary when filtered
  const vendorSummary = useMemo(() => {
    if (!vendorFilter) return null;
    const total = filtered.reduce((sum, e) => sum + e.amount, 0);
    return { count: filtered.length, total };
  }, [filtered, vendorFilter]);

  const hasFilters = vendorFilter || paymentFilter || categoryFilter;

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400">
          <Filter className="h-3.5 w-3.5" />
          Filter:
        </div>

        <select
          value={vendorFilter}
          onChange={(e) => setVendorFilter(e.target.value)}
          className={cn(
            "text-xs border-2 border-gray-200 dark:border-gray-600 rounded-lg px-2 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300",
            "min-h-[44px] active:scale-[0.97] transition-all",
            vendorFilter
              ? "border-construction-blue text-construction-blue"
              : "",
          )}
          aria-label="Filter by vendor"
        >
          <option value="">All Vendors</option>
          {vendors.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>

        <select
          value={paymentFilter}
          onChange={(e) => setPaymentFilter(e.target.value)}
          className={cn(
            "text-xs border-2 border-gray-200 dark:border-gray-600 rounded-lg px-2 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300",
            "min-h-[44px] active:scale-[0.97] transition-all",
            paymentFilter
              ? "border-construction-blue text-construction-blue"
              : "",
          )}
          aria-label="Filter by payment method"
        >
          <option value="">All Methods</option>
          {paymentMethods.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className={cn(
            "text-xs border-2 border-gray-200 dark:border-gray-600 rounded-lg px-2 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300",
            "min-h-[44px] active:scale-[0.97] transition-all",
            categoryFilter
              ? "border-construction-blue text-construction-blue"
              : "",
          )}
          aria-label="Filter by category"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c} value={c} className="capitalize">
              {c}
            </option>
          ))}
        </select>

        {hasFilters ? (
          <button
            onClick={() => {
              setVendorFilter("");
              setPaymentFilter("");
              setCategoryFilter("");
            }}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-500 min-h-[44px] px-2 active:scale-[0.97] transition-all"
          >
            <X className="h-3.5 w-3.5" />
            Clear
          </button>
        ) : null}

        <div className="ml-auto">
          <button
            onClick={onAddExpense}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-xl font-bold text-xs",
              "bg-construction-blue text-white shadow-md",
              "hover:bg-construction-blue/90 active:scale-[0.97] transition-all",
              "min-h-[44px] min-w-[44px]",
            )}
          >
            <Plus className="h-4 w-4" />
            Add Expense
          </button>
        </div>
      </div>

      {/* Vendor summary banner */}
      {vendorSummary ? (
        <div className="px-4 py-2.5 bg-construction-blue/10 dark:bg-blue-950/30 rounded-xl text-sm font-semibold text-construction-blue dark:text-blue-300">
          {vendorFilter}: {vendorSummary.count} expense
          {vendorSummary.count !== 1 ? "s" : ""},{" "}
          {currencyFormatter.format(vendorSummary.total)} total
        </div>
      ) : null}

      {/* Expense list */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-gray-500 dark:text-gray-400 text-sm">
            {hasFilters
              ? "No expenses match your filters"
              : "No expenses for this project yet"}
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700 px-4">
            {filtered.map((expense) => (
              <ExpenseRow key={expense.id} expense={expense} />
            ))}
          </div>
        )}
      </div>

      {filtered.length > 0 ? (
        <div className="text-xs text-right text-gray-500 dark:text-gray-400">
          {filtered.length} expense{filtered.length !== 1 ? "s" : ""} ·{" "}
          {currencyFormatter.format(filtered.reduce((s, e) => s + e.amount, 0))}{" "}
          total
        </div>
      ) : null}
    </div>
  );
}
