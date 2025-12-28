'use client';

import { useState, useTransition } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Receipt, CheckCircle2, XCircle, Loader2, FileText, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { reviewExpense } from '@/app/actions/expenses';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { motion } from 'framer-motion';

interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  expense_date: string;
  vendor_name: string | null;
  receipt_url: string | null;
  status: 'submitted' | 'under_review' | 'approved' | 'rejected';
  created_at: string;
  project: {
    id: string;
    name: string;
  };
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
    label: 'Submitted',
    color: 'bg-gray-100 text-gray-700 border-gray-300',
    icon: FileText,
  },
  under_review: {
    label: 'Under Review',
    color: 'bg-construction-blue/10 text-construction-blue border-construction-blue',
    icon: AlertCircle,
  },
  approved: {
    label: 'Approved',
    color: 'bg-construction-green/10 text-construction-green border-construction-green/30',
    icon: CheckCircle2,
  },
  rejected: {
    label: 'Rejected',
    color: 'bg-construction-red/10 text-construction-red border-construction-red/30',
    icon: XCircle,
  },
};

export function ExpenseDetailModal({ expense, onClose }: ExpenseDetailModalProps) {
  const [isPending, startTransition] = useTransition();
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const { toast } = useToast();

  const statusConfig = STATUS_CONFIG[expense.status];
  const StatusIcon = statusConfig.icon;

  const canReview = expense.status === 'submitted' || expense.status === 'under_review';

  const handleReview = (action: 'approve' | 'reject') => {
    setReviewAction(action);
    setShowReviewForm(true);
  };

  const handleSubmitReview = () => {
    if (!reviewAction) return;

    startTransition(async () => {
      const result = await reviewExpense({
        expenseId: expense.id,
        action: reviewAction,
        reviewNotes: reviewNotes || undefined,
      });

      if (result.success) {
        toast({
          title: reviewAction === 'approve' ? 'Expense Approved' : 'Expense Rejected',
          description: `The expense has been ${reviewAction}d.`,
        });
        onClose();
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to review expense',
          variant: 'destructive',
        });
      }
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-black text-construction-blue flex items-center gap-2">
              <Receipt className="h-6 w-6" />
              Expense Details
            </DialogTitle>
            <Badge className={cn('font-semibold border-2 px-3 py-2', statusConfig.color)}>
              <StatusIcon className="h-4 w-4 mr-1" />
              {statusConfig.label}
            </Badge>
          </div>
        </DialogHeader>

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
            <h3 className="font-bold text-construction-blue text-lg mb-4">Expense Information</h3>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label className="text-sm font-bold text-gray-600">Description</Label>
                <p className="text-base font-semibold text-gray-900 mt-1">{expense.description}</p>
              </div>

              <div>
                <Label className="text-sm font-bold text-gray-600">Amount</Label>
                <p className="text-2xl font-black text-construction-blue mt-1">{formatCurrency(expense.amount)}</p>
              </div>

              <div>
                <Label className="text-sm font-bold text-gray-600">Category</Label>
                <Badge variant="outline" className="mt-1 capitalize font-semibold">
                  {expense.category}
                </Badge>
              </div>

              <div>
                <Label className="text-sm font-bold text-gray-600">Expense Date</Label>
                <p className="text-base font-semibold text-gray-900 mt-1">{formatDate(expense.expense_date)}</p>
              </div>

              {expense.vendor_name && (
                <div>
                  <Label className="text-sm font-bold text-gray-600">Vendor</Label>
                  <p className="text-base font-semibold text-gray-900 mt-1">{expense.vendor_name}</p>
                </div>
              )}

              <div>
                <Label className="text-sm font-bold text-gray-600">Project</Label>
                <p className="text-base font-semibold text-gray-900 mt-1">{expense.project.name}</p>
              </div>

              {expense.task && (
                <div className="md:col-span-2">
                  <Label className="text-sm font-bold text-gray-600">Task</Label>
                  <p className="text-base font-semibold text-gray-900 mt-1">{expense.task.title}</p>
                </div>
              )}
            </div>
          </div>

          {/* Submission & Review Info */}
          <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-6 space-y-3">
            <h3 className="font-bold text-gray-900 text-lg mb-4">Timeline</h3>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-construction-blue/10 rounded-lg">
                <FileText className="h-5 w-5 text-construction-blue" />
              </div>
              <div>
                <Label className="text-sm font-bold text-gray-600">Submitted</Label>
                <p className="text-sm text-gray-900">
                  {expense.submitter?.name} on {formatDate(expense.created_at)}
                </p>
              </div>
            </div>

            {expense.reviewer && (expense.status === 'approved' || expense.status === 'rejected') && (
              <div className="flex items-center gap-3">
                <div className={cn(
                  "p-2 rounded-lg",
                  expense.status === 'approved' ? 'bg-construction-green/10' : 'bg-construction-red/10'
                )}>
                  {expense.status === 'approved' ? (
                    <CheckCircle2 className="h-5 w-5 text-construction-green" />
                  ) : (
                    <XCircle className="h-5 w-5 text-construction-red" />
                  )}
                </div>
                <div>
                  <Label className="text-sm font-bold text-gray-600">
                    {expense.status === 'approved' ? 'Approved' : 'Rejected'}
                  </Label>
                  <p className="text-sm text-gray-900">
                    {expense.reviewer.name}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Review Form (if reviewing) */}
          {showReviewForm && reviewAction && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "border-2 rounded-lg p-6 space-y-4",
                reviewAction === 'approve'
                  ? 'bg-construction-green/5 border-construction-green/30'
                  : 'bg-construction-red/5 border-construction-red/30'
              )}
            >
              <h3 className={cn(
                "font-bold text-lg flex items-center gap-2",
                reviewAction === 'approve' ? 'text-construction-green' : 'text-construction-red'
              )}>
                {reviewAction === 'approve' ? (
                  <>
                    <CheckCircle2 className="h-5 w-5" />
                    Approve Expense
                  </>
                ) : (
                  <>
                    <XCircle className="h-5 w-5" />
                    Reject Expense
                  </>
                )}
              </h3>

              <div className="space-y-2">
                <Label htmlFor="notes" className="text-sm font-bold text-gray-700">
                  Notes (Optional)
                </Label>
                <Textarea
                  id="notes"
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  className="border-2"
                  placeholder={reviewAction === 'approve'
                    ? 'Add any approval notes...'
                    : 'Provide a reason for rejection...'
                  }
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowReviewForm(false);
                    setReviewAction(null);
                    setReviewNotes('');
                  }}
                  disabled={isPending}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmitReview}
                  disabled={isPending}
                  className={cn(
                    "text-white font-bold",
                    reviewAction === 'approve'
                      ? 'bg-construction-green hover:bg-construction-green/90'
                      : 'bg-construction-red hover:bg-construction-red/90'
                  )}
                >
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    `Confirm ${reviewAction === 'approve' ? 'Approval' : 'Rejection'}`
                  )}
                </Button>
              </div>
            </motion.div>
          )}

          {/* Actions */}
          <div className="flex justify-between items-center pt-4 border-t-2 border-gray-200">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>

            {canReview && !showReviewForm && (
              <div className="flex gap-3">
                <Button
                  onClick={() => handleReview('reject')}
                  variant="outline"
                  className="border-construction-red text-construction-red hover:bg-construction-red hover:text-white font-bold"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
                <Button
                  onClick={() => handleReview('approve')}
                  className="bg-construction-green hover:bg-construction-green/90 text-white font-bold"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Approve
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
