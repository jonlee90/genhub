"use client";

import { useState } from "react";
import { ResponsiveModal } from "@/components/ui/ResponsiveModal";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import AlertCircle from "lucide-react/icons/alert-circle";
import { useActionWithError } from "@/hooks/useActionWithError";
import { ErrorBanner } from "@/components/shared/ErrorBanner";

interface BlockedReasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}

export function BlockedReasonModal({
  isOpen,
  onClose,
  onConfirm,
}: BlockedReasonModalProps) {
  const [reason, setReason] = useState("");
  const { error, setError, clearError } = useActionWithError();

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!reason.trim()) {
      setError("Please enter a reason for blocking this task");
      return;
    }

    onConfirm(reason.trim());
    setReason("");
    clearError();
  };

  const handleClose = () => {
    setReason("");
    clearError();
    onClose();
  };

  return (
    <ResponsiveModal
      isOpen={isOpen}
      onClose={handleClose}
      icon={AlertCircle}
      title="Block Task"
      theme="high"
      maxWidth="md"
      showNavigation={true}
      onBack={handleClose}
      onContinue={handleSubmit}
      backLabel="Cancel"
      continueLabel="Block Task"
      continueDisabled={!reason.trim()}
    >
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label
              htmlFor="reason"
              className="font-bold text-gray-700 dark:text-gray-300"
            >
              Reason for blocking
            </Label>
            <Textarea
              id="reason"
              placeholder="e.g., Waiting for materials delivery, Need client approval..."
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                clearError();
              }}
              rows={3}
              autoFocus
              className="border-2 border-gray-300 dark:border-gray-600 focus:border-construction-red dark:focus:border-construction-red bg-white dark:bg-gray-900"
            />
          </div>

          {/* Error Banner */}
          {error && <ErrorBanner error={error} onDismiss={clearError} />}
        </div>
      </form>
    </ResponsiveModal>
  );
}
