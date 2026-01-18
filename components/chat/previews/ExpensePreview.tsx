"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { DollarSign, Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EntityPreviewSkeleton, EntityPreviewError } from "../EntityPreview";
import { useRouter } from "next/navigation";

interface ExpensePreviewProps {
  id: string;
}

interface ExpenseData {
  id: string;
  description: string;
  amount: number;
  status: string;
  vendor_name: string | null;
}

// Debug: Expense preview card component
export function ExpensePreview({ id }: ExpensePreviewProps) {
  const [expense, setExpense] = useState<ExpenseData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  console.log("[ExpensePreview] Rendering for expense:", id);

  // Debug: Fetch expense data
  useEffect(() => {
    async function fetchExpense() {
      console.log("[ExpensePreview] Fetching expense data:", id);

      try {
        const response = await fetch(
          `/api/chat/entity-preview?type=expense&id=${id}`,
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch expense");
        }

        console.log("[ExpensePreview] Expense data loaded:", data);
        setExpense(data);
      } catch (err: any) {
        console.error("[ExpensePreview] Error fetching expense:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }

    fetchExpense();
  }, [id]);

  // Debug: Loading state
  if (isLoading) {
    return <EntityPreviewSkeleton />;
  }

  // Debug: Error state
  if (error || !expense) {
    return <EntityPreviewError error={error || "Expense not found"} />;
  }

  // Debug: Status badge variant
  const statusVariant = getStatusVariant(expense.status);

  return (
    <motion.div
      onClick={() => router.push(`/app/expenses?id=${id}`)}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "w-full max-w-md bg-white border-2 border-construction-blue rounded-xl p-4",
        "hover:shadow-construction-lg transition-all duration-200 cursor-pointer",
        "group",
      )}
    >
      {/* Debug: Header with icon and description */}
      <div className="flex items-start gap-3 mb-3">
        <div className="p-2 bg-construction-green/10 rounded-lg border-2 border-construction-green/20 shrink-0">
          <DollarSign className="h-5 w-5 text-construction-green" />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-base font-black text-construction-blue group-hover:text-blue-700 transition-colors mb-2">
            {expense.description}
          </h3>

          <div className="flex items-center gap-2">
            <Badge
              className={cn(
                "text-[10px] font-bold px-2 py-0.5",
                statusVariant.bg,
                statusVariant.text,
              )}
            >
              {expense.status}
            </Badge>
          </div>
        </div>
      </div>

      {/* Debug: Amount (large, prominent) */}
      <div className="bg-gradient-to-br from-construction-green/5 to-construction-green/10 rounded-lg border-2 border-construction-green/20 p-4 mb-3">
        <div className="flex items-center justify-center gap-2">
          <DollarSign className="h-6 w-6 text-construction-green" />
          <span className="text-3xl font-black text-construction-green">
            {expense.amount.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Debug: Vendor name */}
      {expense.vendor_name && (
        <div className="flex items-center gap-2 text-gray-600">
          <Building2 className="h-4 w-4" />
          <span className="text-sm">{expense.vendor_name}</span>
        </div>
      )}

      {/* Debug: Footer hint */}
      <div className="mt-3 pt-3 border-t-2 border-gray-100">
        <p className="text-[10px] font-mono text-gray-500">
          Click to view expense details
        </p>
      </div>
    </motion.div>
  );
}

// Debug: Helper function for status badge variants
function getStatusVariant(status: string): { bg: string; text: string } {
  const variants: Record<string, { bg: string; text: string }> = {
    pending: {
      bg: "bg-construction-yellow/20",
      text: "text-construction-yellow",
    },
    approved: {
      bg: "bg-construction-green/20",
      text: "text-construction-green",
    },
    rejected: { bg: "bg-construction-red/20", text: "text-construction-red" },
  };

  return variants[status.toLowerCase()] || variants.pending;
}
