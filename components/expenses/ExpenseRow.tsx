"use client";

import React, { useMemo } from "react";
import Receipt from "lucide-react/icons/receipt";
import { Badge } from "@/components/ui/badge";
import { cn, formatDate } from "@/lib/utils";
import type { ExpenseWithRelations } from "@/types/db/expense";
import { getCategoryMeta } from "@/lib/constants/expense-categories";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
});

const formatCurrency = (amount: number) => currencyFormatter.format(amount);

interface ExpenseRowProps {
  expense: ExpenseWithRelations;
  onClick: () => void;
}

export const ExpenseRow = React.memo(
  function ExpenseRow({ expense, onClick }: ExpenseRowProps) {
    const payee = useMemo(
      () =>
        expense.subcontractor?.company_name ||
        expense.vendor_name ||
        expense.description,
      [expense.subcontractor, expense.vendor_name, expense.description],
    );

    const projectName = expense.project?.name || "No project";
    const formattedDate = formatDate(expense.expense_date, {
      includeYear: true,
    });
    const formattedAmount = formatCurrency(expense.amount);
    const hasReceipt = Boolean(expense.receipt_url);

    const meta = getCategoryMeta(expense.category);
    const CategoryIcon = meta.icon;

    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "w-full text-left min-h-[56px] px-4 py-3",
          "border-b border-gray-100 dark:border-gray-800 last:border-b-0",
          "transition-colors cursor-pointer",
          "hover:bg-gray-50/50 dark:hover:bg-gray-800/50",
          "active:bg-gray-50 dark:active:bg-gray-800",
        )}
      >
        {/* Mobile: stacked 2-line layout */}
        <div className="flex flex-col gap-1 md:hidden">
          {/* Line 1: icon + payee + amount */}
          <div className="flex items-center gap-2">
            <CategoryIcon className={cn("h-4 w-4 shrink-0", meta.iconClass)} />
            <span className="flex-1 min-w-0 truncate font-semibold text-sm text-gray-900 dark:text-gray-100">
              {payee}
            </span>
            <span className="shrink-0 font-bold text-sm tabular-nums text-construction-blue dark:text-blue-400">
              {formattedAmount}
            </span>
          </div>

          {/* Line 2: category · project · date + receipt indicator */}
          <div className="flex items-center gap-1.5 pl-6 text-xs text-gray-500 dark:text-gray-400">
            <span className="capitalize truncate">{expense.category}</span>
            <span className="text-gray-300 dark:text-gray-600">·</span>
            <span className="truncate">{projectName}</span>
            <span className="text-gray-300 dark:text-gray-600">·</span>
            <span className="whitespace-nowrap tabular-nums">
              {formattedDate}
            </span>
            {hasReceipt ? (
              <Receipt className="h-3.5 w-3.5 shrink-0 text-construction-blue dark:text-blue-400" />
            ) : null}
          </div>
        </div>

        {/* Desktop: aligned table columns */}
        <div className="hidden md:grid md:grid-cols-[minmax(0,2fr)_132px_minmax(0,1.5fr)_104px_120px] md:items-center md:gap-4">
          {/* Payee */}
          <div className="flex items-center gap-2 min-w-0">
            <CategoryIcon className={cn("h-4 w-4 shrink-0", meta.iconClass)} />
            <span className="truncate font-semibold text-sm text-gray-900 dark:text-gray-100">
              {payee}
            </span>
            {hasReceipt ? (
              <Receipt className="h-3.5 w-3.5 shrink-0 text-gray-400 dark:text-gray-500" />
            ) : null}
          </div>

          {/* Category */}
          <div className="min-w-0">
            <Badge
              variant="outline"
              className={cn("font-semibold capitalize", meta.badgeClass)}
            >
              {expense.category}
            </Badge>
          </div>

          {/* Project */}
          <span className="truncate text-sm text-gray-600 dark:text-gray-400">
            {projectName}
          </span>

          {/* Date */}
          <span className="text-right whitespace-nowrap tabular-nums text-sm text-gray-600 dark:text-gray-400">
            {formattedDate}
          </span>

          {/* Amount */}
          <span className="text-right whitespace-nowrap font-bold text-sm tabular-nums text-construction-blue dark:text-blue-400">
            {formattedAmount}
          </span>
        </div>
      </button>
    );
  },
  (prev, next) => {
    const a = prev.expense;
    const b = next.expense;
    // Compare every field the row renders so edits don't leave stale rows.
    return (
      a.id === b.id &&
      a.amount === b.amount &&
      a.category === b.category &&
      a.description === b.description &&
      a.vendor_name === b.vendor_name &&
      a.receipt_url === b.receipt_url &&
      a.expense_date === b.expense_date &&
      a.project?.name === b.project?.name &&
      a.subcontractor?.company_name === b.subcontractor?.company_name &&
      prev.onClick === next.onClick
    );
  },
);
