"use client";

import { cn } from "@/lib/utils";
import DollarSign from "lucide-react/icons/dollar-sign";
import TrendingUp from "lucide-react/icons/trending-up";
import Receipt from "lucide-react/icons/receipt";
import Wallet from "lucide-react/icons/wallet";
import type { FinancialSummary } from "@/app/actions/project-financials";

interface FinancialSummaryBarProps {
  summary: FinancialSummary;
}

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const formatCurrency = (amount: number) => currencyFormatter.format(amount);

function getRemainingColor(summary: FinancialSummary) {
  if (!summary.hasBudget) return "text-gray-600 dark:text-gray-400";
  const pct = summary.percentUsed;
  if (pct > 100) return "text-red-600 dark:text-red-400";
  if (pct >= 75) return "text-yellow-600 dark:text-yellow-400";
  return "text-green-600 dark:text-green-400";
}

interface MetricProps {
  icon: React.ElementType;
  label: string;
  value: string;
  valueClass?: string;
  subLabel?: string;
}

function Metric({
  icon: Icon,
  label,
  value,
  valueClass,
  subLabel,
}: MetricProps) {
  return (
    <div className="flex flex-col gap-1 p-3 sm:p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <div
        className={cn(
          "text-xl font-black tabular-nums leading-none",
          valueClass,
        )}
      >
        {value}
      </div>
      {subLabel ? (
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {subLabel}
        </div>
      ) : null}
    </div>
  );
}

export function FinancialSummaryBar({ summary }: FinancialSummaryBarProps) {
  const remainingColor = getRemainingColor(summary);

  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
      <Metric
        icon={DollarSign}
        label="Total Budget"
        value={
          summary.hasBudget ? formatCurrency(summary.totalBudget) : "Not set"
        }
        valueClass="text-construction-blue dark:text-blue-400"
      />
      <Metric
        icon={Receipt}
        label="Expenses"
        value={formatCurrency(summary.totalSpent)}
        valueClass="text-gray-800 dark:text-gray-200"
      />
      <Metric
        icon={TrendingUp}
        label="Sub Payments"
        value={formatCurrency(summary.subPayments)}
        valueClass="text-gray-800 dark:text-gray-200"
      />
      <Metric
        icon={Wallet}
        label="Remaining"
        value={summary.hasBudget ? formatCurrency(summary.netRemaining) : "—"}
        valueClass={remainingColor}
        subLabel={
          summary.hasBudget
            ? `${Math.round(summary.percentUsed)}% used`
            : undefined
        }
      />
    </div>
  );
}
