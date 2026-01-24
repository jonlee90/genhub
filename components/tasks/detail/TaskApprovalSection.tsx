/**
 * TaskApprovalSection - Approval workflow UI
 * Extracted from TaskDetail.tsx for better maintainability
 */
"use client";

import { useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ResponsiveModal } from "@/components/ui/ResponsiveModal";
import {
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
  Ban,
  ThumbsUp,
  MessageSquare,
} from "lucide-react";
import { updateApprovalStatus } from "@/app/actions/tasks";
import { cn, formatDate } from "@/lib/utils";
import type { ApprovalStatus, UserRole } from "@/types/db/enums";

const APPROVAL_STATUS_CONFIG: Record<
  ApprovalStatus,
  {
    label: string;
    color: string;
    bgColor: string;
    icon: typeof CheckCircle2;
  }
> = {
  pending: {
    label: "Pending Approval",
    color: "text-amber-700 dark:text-amber-300",
    bgColor:
      "bg-amber-100 border-amber-300 dark:bg-amber-950/30 dark:border-amber-900/40",
    icon: Clock,
  },
  approved: {
    label: "Approved",
    color: "text-green-700 dark:text-green-300",
    bgColor:
      "bg-green-100 border-green-300 dark:bg-green-950/30 dark:border-green-900/40",
    icon: CheckCircle2,
  },
  rejected: {
    label: "Rejected",
    color: "text-red-700 dark:text-red-300",
    bgColor:
      "bg-red-100 border-red-300 dark:bg-red-950/30 dark:border-red-900/40",
    icon: Ban,
  },
  revision_requested: {
    label: "Revision Requested",
    color: "text-orange-700 dark:text-orange-300",
    bgColor:
      "bg-orange-100 border-orange-300 dark:bg-orange-950/30 dark:border-orange-900/40",
    icon: RotateCcw,
  },
};

interface TaskApprovalData {
  id: string;
  approval_status: ApprovalStatus | null;
  approval_notes: string | null;
  approved_by: string | null;
  approved_at: string | null;
}

interface TaskApprovalSectionProps {
  task: TaskApprovalData;
  userRole: UserRole;
  onSuccess: () => void;
  onError: (error: string) => void;
}

export function TaskApprovalSection({
  task,
  userRole,
  onSuccess,
  onError,
}: TaskApprovalSectionProps) {
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalAction, setApprovalAction] = useState<ApprovalStatus | null>(
    null,
  );
  const [approvalNotes, setApprovalNotes] = useState("");
  const [isUpdatingApproval, setIsUpdatingApproval] = useState(false);

  const canApprove = userRole === "admin" || userRole === "project_manager";

  const handleApprovalAction = useCallback(async (action: ApprovalStatus) => {
    setApprovalAction(action);
    setApprovalNotes("");
    setShowApprovalModal(true);
  }, []);

  const handleApprovalCancel = useCallback(() => {
    setShowApprovalModal(false);
    setApprovalAction(null);
    setApprovalNotes("");
  }, []);

  const executeApproval = useCallback(
    async (status: ApprovalStatus, notes: string) => {
      setIsUpdatingApproval(true);
      try {
        const result = await updateApprovalStatus(
          task.id,
          status,
          notes || undefined,
        );

        if (!result.success) {
          onError(result.error);
        } else {
          setShowApprovalModal(false);
          setApprovalAction(null);
          setApprovalNotes("");
          onSuccess();
        }
      } finally {
        setIsUpdatingApproval(false);
      }
    },
    [task.id, onError, onSuccess],
  );

  const handleApprovalConfirm = useCallback(async () => {
    if (!approvalAction) return;

    await executeApproval(approvalAction, approvalNotes);
  }, [approvalAction, approvalNotes, executeApproval]);

  if (!task.approval_status) {
    return null;
  }

  const approvalConfig = APPROVAL_STATUS_CONFIG[task.approval_status];
  const StatusIcon = approvalConfig.icon;

  return (
    <>
      <Card className="border-2 border-gray-200 dark:border-gray-700">
        <CardContent className="p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Approval Status
          </h2>

          {/* Current Status */}
          <div
            className={cn(
              "border-2 rounded-lg p-4 mb-4",
              approvalConfig.bgColor,
            )}
          >
            <div className="flex items-center gap-3 mb-2">
              <StatusIcon className={cn("w-6 h-6", approvalConfig.color)} />
              <h3 className={cn("text-lg font-bold", approvalConfig.color)}>
                {approvalConfig.label}
              </h3>
            </div>

            {task.approval_notes && (
              <div className="mt-3 pt-3 border-t border-current/20">
                <div className="flex items-start gap-2">
                  <MessageSquare
                    className={cn("w-4 h-4 mt-0.5", approvalConfig.color)}
                  />
                  <div>
                    <p className="text-sm font-medium mb-1">Notes:</p>
                    <p className="text-sm">{task.approval_notes}</p>
                  </div>
                </div>
              </div>
            )}

            {task.approved_at && (
              <div className="mt-3 pt-3 border-t border-current/20 text-sm">
                <p>
                  <span className="font-medium">
                    {task.approval_status === "approved"
                      ? "Approved"
                      : "Reviewed"}{" "}
                    on:
                  </span>{" "}
                  {formatDate(task.approved_at)}
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {canApprove && task.approval_status === "pending" && (
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => handleApprovalAction("approved")}
                className="bg-green-600 hover:bg-green-700 text-white gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                Approve
              </Button>
              <Button
                onClick={() => handleApprovalAction("revision_requested")}
                variant="outline"
                className="border-orange-300 text-orange-700 hover:bg-orange-50 dark:border-orange-900/40 dark:text-orange-300 dark:hover:bg-orange-950/30 gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Request Revision
              </Button>
              <Button
                onClick={() => handleApprovalAction("rejected")}
                variant="outline"
                className="border-red-300 text-red-700 hover:bg-red-50 dark:border-red-900/40 dark:text-red-300 dark:hover:bg-red-950/30 gap-2"
              >
                <Ban className="w-4 h-4" />
                Reject
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Approval Modal */}
      <ResponsiveModal
        isOpen={showApprovalModal}
        onClose={handleApprovalCancel}
        title={
          approvalAction
            ? `${APPROVAL_STATUS_CONFIG[approvalAction].label}`
            : "Approval"
        }
        icon={
          approvalAction
            ? APPROVAL_STATUS_CONFIG[approvalAction].icon
            : ThumbsUp
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {approvalAction === "approved" &&
              "Confirm that this task meets the required standards and can proceed."}
            {approvalAction === "revision_requested" &&
              "Provide specific feedback on what needs to be revised."}
            {approvalAction === "rejected" &&
              "Explain why this task cannot be approved."}
          </p>

          <div className="space-y-2">
            <Label
              htmlFor="approval-notes"
              className="text-gray-700 dark:text-gray-300"
            >
              Notes{" "}
              {approvalAction !== "approved" && (
                <span className="text-red-500">*</span>
              )}
            </Label>
            <Textarea
              id="approval-notes"
              value={approvalNotes}
              onChange={(e) => setApprovalNotes(e.target.value)}
              placeholder={
                approvalAction === "approved"
                  ? "Add any additional notes (optional)"
                  : "Provide detailed feedback (required)"
              }
              rows={4}
              required={approvalAction !== "approved"}
              className="bg-white dark:bg-gray-900"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={handleApprovalCancel}
              disabled={isUpdatingApproval}
            >
              Cancel
            </Button>
            <Button
              onClick={handleApprovalConfirm}
              disabled={
                isUpdatingApproval ||
                (approvalAction !== "approved" && !approvalNotes.trim())
              }
              className={cn(
                "gap-2",
                approvalAction === "approved" &&
                  "bg-green-600 hover:bg-green-700 text-white",
                approvalAction === "revision_requested" &&
                  "bg-orange-600 hover:bg-orange-700 text-white",
                approvalAction === "rejected" &&
                  "bg-red-600 hover:bg-red-700 text-white",
              )}
            >
              {isUpdatingApproval ? (
                <>
                  <Clock className="w-4 h-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Confirm
                </>
              )}
            </Button>
          </div>
        </div>
      </ResponsiveModal>
    </>
  );
}
