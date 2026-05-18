"use client";

import { useState, useTransition, useCallback } from "react";
import { ResponsiveModal } from "@/components/ui/ResponsiveModal";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Receipt,
  FileText,
  Image as ImageIcon,
  Trash2,
  Pencil,
} from "lucide-react";
import { CreatorBadge } from "@/components/ui/CreatorBadge";
import { deleteExpense } from "@/app/actions/expenses";
import { toast } from "sonner";
import Image from "next/image";
import { m as motion } from "framer-motion";
import { formatDate } from "@/lib/utils";
import type { ExpenseDetailModalProps } from "@/types/db/expense";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
});

const formatCurrency = (amount: number) => currencyFormatter.format(amount);

export function ExpenseDetailModal({
  expense,
  onClose,
  userRole,
  onEdit,
  onDelete,
  currentUserId,
}: ExpenseDetailModalProps) {
  const [isPending, startTransition] = useTransition();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isAdmin = userRole === "admin";
  const canDelete = isAdmin;
  const canEdit = isAdmin || expense.submitter?.id === currentUserId;

  const handleDelete = useCallback(() => {
    startTransition(async () => {
      const result = await deleteExpense(expense.id);

      if (result.success) {
        toast.success("The expense has been permanently deleted.");
        onDelete?.();
        onClose();
      } else {
        toast.error(
          result.error ||
            "Failed to delete expense. You may not have permission.",
        );
        setShowDeleteConfirm(false);
      }
    });
  }, [expense.id, onClose]);

  const getBackHandler = useCallback(() => {
    if (showDeleteConfirm) {
      setShowDeleteConfirm(false);
    } else {
      onClose();
    }
  }, [showDeleteConfirm, onClose]);

  const getContinueHandler = useCallback(() => {
    if (showDeleteConfirm) {
      handleDelete();
    }
  }, [showDeleteConfirm, handleDelete]);

  const getContinueLabel = (): string => {
    if (showDeleteConfirm) {
      return isPending ? "Deleting..." : "Delete Permanently";
    }
    return "Close";
  };

  const getBackLabel = (): string => {
    if (showDeleteConfirm) {
      return "Cancel";
    }
    return "Close";
  };

  return (
    <ResponsiveModal
      isOpen={true}
      onClose={onClose}
      icon={Receipt}
      title="Expense Details"
      theme="default"
      maxWidth="4xl"
      showNavigation={true}
      onBack={getBackHandler}
      backLabel={getBackLabel()}
      onContinue={showDeleteConfirm ? getContinueHandler : undefined}
      continueLabel={getContinueLabel()}
      continueDisabled={isPending}
    >
      <div className="space-y-6">
        {/* Receipt Image */}
        {expense.receipt_url ? (
          <div className="bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Receipt Image
            </h3>
            <div className="relative w-full h-96 bg-white dark:bg-gray-900 rounded-lg overflow-hidden border-2 border-gray-200 dark:border-gray-700">
              <Image
                src={expense.receipt_url}
                alt="Receipt"
                fill
                className="object-contain"
              />
            </div>
          </div>
        ) : null}

        {/* Expense Information */}
        <div className="bg-white dark:bg-gray-850 border-2 border-gray-200 dark:border-gray-700 rounded-lg p-6 space-y-4">
          <h3 className="font-bold text-construction-blue text-lg mb-4">
            Expense Information
          </h3>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label className="text-sm font-bold text-gray-600 dark:text-gray-400">
                Description
              </Label>
              <p className="text-base font-semibold text-gray-900 dark:text-gray-100 mt-1">
                {expense.description}
              </p>
            </div>

            <div>
              <Label className="text-sm font-bold text-gray-600 dark:text-gray-400">
                Amount
              </Label>
              <p className="text-2xl font-black text-construction-blue mt-1">
                {formatCurrency(expense.amount)}
              </p>
            </div>

            <div>
              <Label className="text-sm font-bold text-gray-600 dark:text-gray-400">
                Category
              </Label>
              <Badge
                variant="outline"
                className="mt-1 capitalize font-semibold"
              >
                {expense.category}
              </Badge>
            </div>

            <div>
              <Label className="text-sm font-bold text-gray-600 dark:text-gray-400">
                Expense Date
              </Label>
              <p className="text-base font-semibold text-gray-900 dark:text-gray-100 mt-1">
                {formatDate(expense.expense_date, { includeYear: true })}
              </p>
            </div>

            {expense.vendor_name ? (
              <div>
                <Label className="text-sm font-bold text-gray-600 dark:text-gray-400">
                  Vendor
                </Label>
                <p className="text-base font-semibold text-gray-900 dark:text-gray-100 mt-1">
                  {expense.vendor_name}
                </p>
              </div>
            ) : null}

            {expense.subcontractor?.company_name ? (
              <div>
                <Label className="text-sm font-bold text-gray-600 dark:text-gray-400">
                  Subcontractor
                </Label>
                <p className="text-base font-semibold text-construction-blue dark:text-blue-400 mt-1">
                  {expense.subcontractor.company_name}
                </p>
              </div>
            ) : null}

            <div>
              <Label className="text-sm font-bold text-gray-600 dark:text-gray-400">
                Project
              </Label>
              <p className="text-base font-semibold text-gray-900 dark:text-gray-100 mt-1">
                {expense.project?.name || "N/A"}
              </p>
            </div>

            {expense.task ? (
              <div className="md:col-span-2">
                <Label className="text-sm font-bold text-gray-600 dark:text-gray-400">
                  Task
                </Label>
                <p className="text-base font-semibold text-gray-900 dark:text-gray-100 mt-1">
                  {expense.task.title}
                </p>
              </div>
            ) : null}
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg p-6 space-y-3">
          <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg mb-4">
            Timeline
          </h3>

          <CreatorBadge
            creatorName={expense.submitter?.name || "Unknown User"}
            createdAt={expense.created_at}
            variant="default"
          />

          <div className="flex items-center gap-3">
            <div className="p-2 bg-construction-blue/10 rounded-lg">
              <FileText className="h-5 w-5 text-construction-blue" />
            </div>
            <div>
              <Label className="text-sm font-bold text-gray-600 dark:text-gray-400">
                Submitted
              </Label>
              <p className="text-sm text-gray-900 dark:text-gray-100">
                {formatDate(expense.created_at, { includeYear: true })}
              </p>
            </div>
          </div>
        </div>

        {/* Edit Expense Action */}
        {canEdit && !showDeleteConfirm ? (
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onEdit}
              className="w-full flex items-center justify-center gap-2 px-4 min-h-[44px] rounded-lg border-2 border-construction-blue dark:border-blue-500 text-construction-blue dark:text-blue-400 hover:bg-construction-blue hover:text-white dark:hover:bg-blue-600 dark:hover:text-white active:bg-construction-blue/90 dark:active:bg-blue-700 font-bold transition-colors"
            >
              <Pencil className="h-4 w-4" />
              Edit Expense
            </button>
          </div>
        ) : null}

        {/* Delete Expense Action */}
        {canDelete && !showDeleteConfirm ? (
          <div className="mt-3">
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full flex items-center justify-center gap-2 px-4 min-h-[44px] rounded-lg border-2 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 active:bg-red-100 dark:active:bg-red-900/40 font-bold transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              Delete Expense
            </button>
          </div>
        ) : null}

        {/* Delete Confirmation */}
        {showDeleteConfirm ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-construction-red/5 border-2 border-construction-red/30 rounded-lg p-6 space-y-4"
          >
            <h3 className="font-bold text-lg text-construction-red flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Delete Expense
            </h3>
            <p className="text-gray-700 dark:text-gray-300">
              Are you sure you want to delete this expense? This action cannot
              be undone.
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 italic">
              Click "Delete Permanently" in the footer to confirm deletion.
            </p>
          </motion.div>
        ) : null}
      </div>
    </ResponsiveModal>
  );
}
