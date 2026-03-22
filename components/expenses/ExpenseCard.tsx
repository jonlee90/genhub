"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import {
  Receipt,
  FileText,
  Image as ImageIcon,
  Calendar,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ExpenseCardProps, ExpenseStatus } from "@/types/db/expense";
import { EXPENSE_STATUS_CONFIG } from "@/types/db/expense";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
});

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const formatCurrency = (amount: number) => currencyFormatter.format(amount);
const formatDate = (date: string) => dateFormatter.format(new Date(date));

export const ExpenseCard = React.memo(
  function ExpenseCard({ expense }: ExpenseCardProps) {
    const statusConfig = EXPENSE_STATUS_CONFIG[expense.status as ExpenseStatus];

    return (
      <div className="group relative h-full cursor-pointer">
        {/* Decorative background - construction theme */}
        <div className="absolute inset-0 bg-gradient-to-br from-construction-blue/5 dark:from-blue-600/10 to-transparent rounded-xl transform group-hover:scale-105 transition-transform" />

        <div className="relative h-full bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl shadow-construction hover:shadow-construction-lg transition-all overflow-hidden flex flex-col">
          {/* Receipt/Image header */}
          <div
            className={cn(
              "relative h-32 md:h-40 border-b-2 flex items-center justify-center",
              expense.receipt_url
                ? "bg-gradient-to-br from-construction-blue/10 to-construction-blue/5 dark:from-blue-600/20 dark:to-blue-600/10 border-construction-blue/20 dark:border-blue-600/30"
                : "bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-700 dark:to-gray-800 border-gray-200 dark:border-gray-700",
            )}
          >
            {expense.receipt_url ? (
              <ImageIcon className="h-12 w-12 md:h-16 md:w-16 text-construction-blue dark:text-blue-400 opacity-40" />
            ) : (
              <FileText className="h-12 w-12 md:h-16 md:w-16 text-gray-400 dark:text-gray-500 opacity-40" />
            )}

            {/* Status badge - top right */}
            <div className="absolute top-2 right-2">
              <Badge
                className={cn("font-bold border-2 text-xs", statusConfig.color)}
              >
                {statusConfig.label}
              </Badge>
            </div>

            {/* Receipt indicator - top left */}
            {expense.receipt_url && (
              <div className="absolute top-2 left-2 p-1.5 bg-white dark:bg-gray-800 rounded-lg border-2 border-construction-blue/20 dark:border-blue-600/30 shadow-sm">
                <Receipt className="h-3 w-3 text-construction-blue dark:text-blue-400" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 p-4 md:p-5 space-y-3 flex flex-col">
            {/* Amount - prominent display */}
            <div className="text-2xl md:text-3xl font-black text-construction-blue dark:text-blue-400 leading-none">
              {formatCurrency(expense.amount)}
            </div>

            {/* Description */}
            <h3 className="font-bold text-gray-900 dark:text-gray-100 line-clamp-2 text-sm md:text-base leading-tight min-h-[2.5rem]">
              {expense.description}
            </h3>

            {/* Category and Vendor */}
            <div className="flex flex-wrap items-center gap-2 text-xs md:text-sm">
              <Badge variant="outline" className="font-semibold capitalize">
                {expense.category}
              </Badge>
              {expense.vendor_name && (
                <>
                  <span className="text-gray-400 dark:text-gray-600">•</span>
                  <span className="text-gray-600 dark:text-gray-400 font-medium truncate">
                    {expense.vendor_name}
                    {expense.store_account ? (
                      <span className="text-gray-400 ml-1">
                        ({expense.store_account})
                      </span>
                    ) : null}
                  </span>
                </>
              )}
            </div>

            {/* Payment Method badge */}
            {expense.payment_method ? (
              <div>
                <span className="inline-block px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs font-medium text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
                  {expense.payment_method}
                </span>
              </div>
            ) : null}

            {/* Spacer */}
            <div className="flex-1" />

            {/* Footer - Project and Date */}
            <div className="space-y-2 pt-3 border-t-2 border-gray-100 dark:border-gray-700">
              {/* Project */}
              <div className="flex items-center gap-2 text-xs md:text-sm">
                <Building2 className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500 shrink-0" />
                <span className="text-gray-600 dark:text-gray-400 truncate">
                  {expense.project?.name || "No project"}
                </span>
              </div>

              {/* Date */}
              <div className="flex items-center gap-2 text-xs md:text-sm">
                <Calendar className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500 shrink-0" />
                <span className="text-gray-600 dark:text-gray-400">
                  {formatDate(expense.expense_date)}
                </span>
              </div>
            </div>

            {/* Hover indicator */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-construction-blue dark:bg-blue-600 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
          </div>
        </div>
      </div>
    );
  },
  (prev, next) =>
    prev.expense.id === next.expense.id &&
    prev.expense.status === next.expense.status &&
    prev.expense.amount === next.expense.amount,
);
