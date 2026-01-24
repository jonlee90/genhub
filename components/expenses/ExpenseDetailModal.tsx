"use client";

import { useState, useTransition, useCallback } from "react";
import { ResponsiveModal } from "@/components/ui/ResponsiveModal";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Receipt,
  CheckCircle2,
  XCircle,
  FileText,
  Image as ImageIcon,
  AlertCircle,
  Trash2,
} from "lucide-react";
import { CreatorBadge } from "@/components/ui/CreatorBadge";
import { reviewExpense, deleteExpense } from "@/app/actions/expenses";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { m as motion } from "framer-motion";

interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  expense_date: string;
  vendor_name: string | null;
  receipt_url: string | null;
  status: "submitted" | "under_review" | "approved" | "rejected" | "paid";
  created_at: string;
  project: {
    id: string;
    name: string;
  } | null;
  task?: {
    id: string;
    title: string;
  } | null;
  submitter?: {
    id: string;
    name: string;
    email: string;
  } | null;
  reviewer?: {
    id: string;
    name: string;
    email: string;
  } | null;
}

interface ExpenseDetailModalProps {
  expense: Expense;
  onClose: () => void;
}

const STATUS_CONFIG = {
  submitted: {
    label: "Submitted",
    color: "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600",
    icon: FileText,
  },
  under_review: {
    label: "Under Review",
    color:
      "bg-construction-blue/10 text-construction-blue border-construction-blue",
    icon: AlertCircle,
  },
  approved: {
    label: "Approved",
    color:
      "bg-construction-green/10 text-construction-green border-construction-green/30",
    icon: CheckCircle2,
  },
  rejected: {
    label: "Rejected",
    color:
      "bg-construction-red/10 text-construction-red border-construction-red/30",
    icon: XCircle,
  },
  paid: {
    label: "Paid",
    color:
      "bg-construction-green/10 text-construction-green border-construction-green/30",
    icon: CheckCircle2,
  },
};

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
});

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
});

const formatCurrency = (amount: number) => currencyFormatter.format(amount);
const formatDate = (date: string) => dateFormatter.format(new Date(date));

export function ExpenseDetailModal({
  expense,
  onClose,
}: ExpenseDetailModalProps) {
  const [isPending, startTransition] = useTransition();
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewAction, setReviewAction] = useState<"approve" | "reject" | null>(
    null,
  );
  const [reviewNotes, setReviewNotes] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { toast } = useToast();

  const statusConfig = STATUS_CONFIG[expense.status];
  const StatusIcon = statusConfig.icon;

  const canReview =
    expense.status === "submitted" || expense.status === "under_review";

  const handleReview = (action: "approve" | "reject") => {
    setReviewAction(action);
    setShowReviewForm(true);
  };

  const handleSubmitReview = () => {
    if (!reviewAction) return;

    startTransition(async () => {
      // DEBUG: reviewExpense expects snake_case params: id, status, approval_notes
      const result = await reviewExpense({
        id: expense.id,
        status: reviewAction === "approve" ? "approved" : "rejected",
        approval_notes: reviewNotes || undefined,
      });

      if (result.success) {
        toast({
          title:
            reviewAction === "approve"
              ? "Expense Approved"
              : "Expense Rejected",
          description: `The expense has been ${reviewAction}d.`,
        });
        onClose();
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to review expense",
          variant: "destructive",
        });
      }
    });
  };

  // DEBUG: Delete expense handler - only works for submitted expenses or admin
  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteExpense(expense.id);

      if (result.success) {
        toast({
          title: "Expense Deleted",
          description: "The expense has been permanently deleted.",
        });
        onClose();
      } else {
        toast({
          title: "Error",
          description:
            result.error ||
            "Failed to delete expense. You may not have permission.",
          variant: "destructive",
        });
        setShowDeleteConfirm(false);
      }
    });
  };

  // Can delete if status is 'submitted' (user's own expense before approval)
  const canDelete = expense.status === "submitted";

  // Compute navigation state based on modal mode
  const getBackHandler = useCallback(() => {
    if (showReviewForm) {
      setShowReviewForm(false);
      setReviewAction(null);
      setReviewNotes("");
    } else if (showDeleteConfirm) {
      setShowDeleteConfirm(false);
    } else {
      onClose();
    }
  }, [showReviewForm, showDeleteConfirm, onClose]);

  const getContinueHandler = useCallback(() => {
    if (showReviewForm && reviewAction) {
      handleSubmitReview();
    } else if (showDeleteConfirm) {
      handleDelete();
    } else if (canReview) {
      // Default to approve when in review mode
      handleReview("approve");
    }
  }, [showReviewForm, reviewAction, showDeleteConfirm, canReview]);

  const getContinueLabel = (): string => {
    if (showReviewForm && reviewAction) {
      if (isPending) return "Processing...";
      return `Confirm ${reviewAction === "approve" ? "Approval" : "Rejection"}`;
    }
    if (showDeleteConfirm) {
      return isPending ? "Deleting..." : "Delete Permanently";
    }
    if (canReview) {
      return "Approve";
    }
    return "Close";
  };

  const getBackLabel = (): string => {
    if (showReviewForm || showDeleteConfirm) {
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
      badges={
        <Badge
          className={cn("font-semibold border-2 px-3 py-2", statusConfig.color)}
        >
          <StatusIcon className="h-4 w-4 mr-1" />
          {statusConfig.label}
        </Badge>
      }
      theme="default"
      maxWidth="4xl"
      showNavigation={true}
      onBack={getBackHandler}
      backLabel={getBackLabel()}
      onContinue={canReview || showReviewForm || showDeleteConfirm ? getContinueHandler : undefined}
      continueLabel={getContinueLabel()}
      continueDisabled={isPending}
    >
      <div className="space-y-6">
        {/* Receipt Image */}
        {expense.receipt_url && (
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
        )}

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
              <Label className="text-sm font-bold text-gray-600 dark:text-gray-400">Amount</Label>
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
                {formatDate(expense.expense_date)}
              </p>
            </div>

            {expense.vendor_name && (
              <div>
                <Label className="text-sm font-bold text-gray-600 dark:text-gray-400">
                  Vendor
                </Label>
                <p className="text-base font-semibold text-gray-900 dark:text-gray-100 mt-1">
                  {expense.vendor_name}
                </p>
              </div>
            )}

            <div>
              <Label className="text-sm font-bold text-gray-600 dark:text-gray-400">Project</Label>
              <p className="text-base font-semibold text-gray-900 dark:text-gray-100 mt-1">
                {expense.project?.name || "N/A"}
              </p>
            </div>

            {expense.task && (
              <div className="md:col-span-2">
                <Label className="text-sm font-bold text-gray-600 dark:text-gray-400">Task</Label>
                <p className="text-base font-semibold text-gray-900 dark:text-gray-100 mt-1">
                  {expense.task.title}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Submission & Review Info */}
        <div className="bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg p-6 space-y-3">
          <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg mb-4">Timeline</h3>

          {/* Created By - Industrial Metadata Tag */}
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
                {formatDate(expense.created_at)}
              </p>
            </div>
          </div>

          {expense.reviewer &&
            (expense.status === "approved" ||
              expense.status === "rejected") && (
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "p-2 rounded-lg",
                    expense.status === "approved"
                      ? "bg-construction-green/10"
                      : "bg-construction-red/10",
                  )}
                >
                  {expense.status === "approved" ? (
                    <CheckCircle2 className="h-5 w-5 text-construction-green" />
                  ) : (
                    <XCircle className="h-5 w-5 text-construction-red" />
                  )}
                </div>
                <div>
                  <Label className="text-sm font-bold text-gray-600 dark:text-gray-400">
                    {expense.status === "approved" ? "Approved" : "Rejected"}
                  </Label>
                  <p className="text-sm text-gray-900 dark:text-gray-100">
                    {expense.reviewer.name}
                  </p>
                </div>
              </div>
            )}
        </div>

        {/* Delete Expense Action - only for submitted expenses */}
        {canDelete && !showDeleteConfirm && (
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 font-bold transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              Delete Expense
            </button>
          </div>
        )}

        {/* Delete Confirmation */}
        {showDeleteConfirm && (
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
        )}
      </div>
    </ResponsiveModal>
  );
}
