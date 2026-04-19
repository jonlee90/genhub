"use client";

import { useState, useEffect } from "react";
import { m as motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { DollarSign, Building2 } from "lucide-react";
import { EntityPreviewSkeleton, EntityPreviewError } from "../EntityPreview";
import { useRouter } from "next/navigation";

interface ExpensePreviewProps {
  id: string;
}

interface ExpenseData {
  id: string;
  description: string;
  amount: number;
  vendor_name: string | null;
}

export function ExpensePreview({ id }: ExpensePreviewProps) {
  const [expense, setExpense] = useState<ExpenseData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchExpense() {
      try {
        const response = await fetch(
          `/api/chat/entity-preview?type=expense&id=${id}`,
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch expense");
        }

        setExpense(data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to fetch expense");
      } finally {
        setIsLoading(false);
      }
    }

    fetchExpense();
  }, [id]);

  if (isLoading) {
    return <EntityPreviewSkeleton />;
  }

  if (error || !expense) {
    return <EntityPreviewError error={error || "Expense not found"} />;
  }

  return (
    <motion.div
      onClick={() => router.push(`/app/expenses?id=${id}`)}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "w-full max-w-md bg-white dark:bg-gray-800 border-2 border-construction-blue dark:border-construction-blue/60 rounded-xl p-4",
        "hover:shadow-construction-lg transition-all duration-200 cursor-pointer",
        "group",
      )}
    >
      {/* Header with icon and description */}
      <div className="flex items-start gap-3 mb-3">
        <div className="p-2 bg-construction-green/10 dark:bg-construction-green/20 rounded-lg border-2 border-construction-green/20 dark:border-construction-green/40 shrink-0">
          <DollarSign className="h-5 w-5 text-construction-green" />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-base font-black text-construction-blue group-hover:text-blue-700 transition-colors">
            {expense.description}
          </h3>
        </div>
      </div>

      {/* Amount (large, prominent) */}
      <div className="bg-gradient-to-br from-construction-green/5 dark:from-construction-green/10 to-construction-green/10 dark:to-construction-green/20 rounded-lg border-2 border-construction-green/20 dark:border-construction-green/40 p-4 mb-3">
        <div className="flex items-center justify-center gap-2">
          <DollarSign className="h-6 w-6 text-construction-green" />
          <span className="text-3xl font-black text-construction-green">
            {expense.amount.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Vendor name */}
      {expense.vendor_name ? (
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
          <Building2 className="h-4 w-4" />
          <span className="text-sm">{expense.vendor_name}</span>
        </div>
      ) : null}

      {/* Footer hint */}
      <div className="mt-3 pt-3 border-t-2 border-gray-100 dark:border-gray-700">
        <p className="text-[10px] font-mono text-gray-500 dark:text-gray-400">
          Click to view expense details
        </p>
      </div>
    </motion.div>
  );
}
