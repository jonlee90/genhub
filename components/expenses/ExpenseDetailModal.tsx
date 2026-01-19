"use client";

import { useState, useTransition } from "react";
import { ResponsiveModal } from "@/components/ui/ResponsiveModal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Receipt,
  CheckCircle2,
  XCircle,
  Loader2,
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
import { motion } from "framer-motion";

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
    color: "bg-gray-100 text-gray-700 border-gray-300",
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
      leftActions={
        <>
          {/* Review Notes Input (in footer when reviewing) */}
          {showReviewForm && reviewAction && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex-1 space-y-2"
            >
              <Label
                htmlFor="notes"
                className={cn(
                  "text-sm font-bold",
                  reviewAction === "approve"
                    ? "text-construction-green"
                    : "text-construction-red",
                )}
              >
                {reviewAction === "approve"
                  ? "Approval Notes (Optional)"
                  : "Rejection Notes (Optional)"}
              </Label>
              <Textarea
                id="notes"
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                className={cn(
                  "border-2 min-h-[80px] resize-none",
                  reviewAction === "approve"
                    ? "border-construction-green/30 focus:border-construction-green"
                    : "border-construction-red/30 focus:border-construction-red",
                )}
                placeholder={
                  reviewAction === "approve"
                    ? "Add any approval notes..."
                    : "Provide a reason for rejection..."
                }
                rows={2}
              />
            </motion.div>
          )}

          {/* Standard buttons when not in review mode */}
          {!showReviewForm && (
            <>
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              {canDelete && !showDeleteConfirm && (
                <Button
                  onClick={() => setShowDeleteConfirm(true)}
                  variant="outline"
                  className="border-construction-red text-construction-red hover:bg-construction-red hover:text-white font-bold"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              )}
            </>
          )}

          {/* Show Cancel button when in review or delete mode */}
          {(showReviewForm || showDeleteConfirm) && (
            <Button
              variant="outline"
              onClick={() => {
                if (showReviewForm) {
                  setShowReviewForm(false);
                  setReviewAction(null);
                  setReviewNotes("");
                } else {
                  setShowDeleteConfirm(false);
                }
              }}
              disabled={isPending}
              className="ml-auto"
            >
              Cancel
            </Button>
          )}
        </>
      }
      rightActions={
        <>
          {/* Initial review buttons */}
          {canReview && !showReviewForm && !showDeleteConfirm && (
            <>
              <Button
                onClick={() => handleReview("reject")}
                variant="outline"
                className="border-construction-red text-construction-red hover:bg-construction-red hover:text-white font-bold"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </Button>
              <Button
                onClick={() => handleReview("approve")}
                className="bg-construction-green hover:bg-construction-green/90 text-white font-bold"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Approve
              </Button>
            </>
          )}
          {/* Confirm review action button */}
          {showReviewForm && reviewAction && (
            <Button
              onClick={handleSubmitReview}
              disabled={isPending}
              className={cn(
                "text-white font-bold",
                reviewAction === "approve"
                  ? "bg-construction-green hover:bg-construction-green/90"
                  : "bg-construction-red hover:bg-construction-red/90",
              )}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                `Confirm ${reviewAction === "approve" ? "Approval" : "Rejection"}`
              )}
            </Button>
          )}
          {/* Confirm delete button */}
          {showDeleteConfirm && (
            <Button
              onClick={handleDelete}
              disabled={isPending}
              className="bg-construction-red hover:bg-construction-red/90 text-white font-bold"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Permanently
                </>
              )}
            </Button>
          )}
        </>
      }
    >
      <div className="space-y-6">
        {/* Receipt Image */}
        {expense.receipt_url && (
          <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-4">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Receipt Image
            </h3>
            <div className="relative w-full h-96 bg-white rounded-lg overflow-hidden border-2 border-gray-200">
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
        <div className="bg-white border-2 border-gray-200 rounded-lg p-6 space-y-4">
          <h3 className="font-bold text-construction-blue text-lg mb-4">
            Expense Information
          </h3>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label className="text-sm font-bold text-gray-600">
                Description
              </Label>
              <p className="text-base font-semibold text-gray-900 mt-1">
                {expense.description}
              </p>
            </div>

            <div>
              <Label className="text-sm font-bold text-gray-600">Amount</Label>
              <p className="text-2xl font-black text-construction-blue mt-1">
                {formatCurrency(expense.amount)}
              </p>
            </div>

            <div>
              <Label className="text-sm font-bold text-gray-600">
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
              <Label className="text-sm font-bold text-gray-600">
                Expense Date
              </Label>
              <p className="text-base font-semibold text-gray-900 mt-1">
                {formatDate(expense.expense_date)}
              </p>
            </div>

            {expense.vendor_name && (
              <div>
                <Label className="text-sm font-bold text-gray-600">
                  Vendor
                </Label>
                <p className="text-base font-semibold text-gray-900 mt-1">
                  {expense.vendor_name}
                </p>
              </div>
            )}

            <div>
              <Label className="text-sm font-bold text-gray-600">Project</Label>
              <p className="text-base font-semibold text-gray-900 mt-1">
                {expense.project?.name || "N/A"}
              </p>
            </div>

            {expense.task && (
              <div className="md:col-span-2">
                <Label className="text-sm font-bold text-gray-600">Task</Label>
                <p className="text-base font-semibold text-gray-900 mt-1">
                  {expense.task.title}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Submission & Review Info */}
        <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-6 space-y-3">
          <h3 className="font-bold text-gray-900 text-lg mb-4">Timeline</h3>

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
              <Label className="text-sm font-bold text-gray-600">
                Submitted
              </Label>
              <p className="text-sm text-gray-900">
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
                  <Label className="text-sm font-bold text-gray-600">
                    {expense.status === "approved" ? "Approved" : "Rejected"}
                  </Label>
                  <p className="text-sm text-gray-900">
                    {expense.reviewer.name}
                  </p>
                </div>
              </div>
            )}
        </div>

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
            <p className="text-gray-700">
              Are you sure you want to delete this expense? This action cannot
              be undone.
            </p>
            <p className="text-sm text-gray-600 italic">
              Click "Delete Permanently" in the footer to confirm deletion.
            </p>
          </motion.div>
        )}
      </div>
    </ResponsiveModal>
  );
}
