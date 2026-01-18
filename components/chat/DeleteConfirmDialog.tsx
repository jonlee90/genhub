"use client";

/**
 * DeleteConfirmDialog - Message deletion confirmation with industrial design
 *
 * Features:
 * - Uses BaseModal for consistent modal behavior
 * - Danger theme with warning styling
 * - Delete and Cancel actions
 * - Loading state during deletion
 * - Construction-themed destructive action design
 *
 * Refactored to use BaseModal (2026-01-16)
 */

import { useState } from "react";
import { cn } from "@/lib/utils";
// Performance optimization: Direct imports instead of barrel file
import Trash2 from "lucide-react/icons/trash-2";
import X from "lucide-react/icons/x";
import AlertTriangle from "lucide-react/icons/alert-triangle";
import Loader2 from "lucide-react/icons/loader-2";
import { deleteMessage } from "@/app/actions/chat";
import { toast } from "sonner";
import { BaseModal } from "@/components/ui/BaseModal";
import { Button } from "@/components/ui/button";

interface DeleteConfirmDialogProps {
  isOpen: boolean;
  messageId: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Delete confirmation dialog using BaseModal
 * Refactored from custom AnimatePresence implementation
 */
export function DeleteConfirmDialog({
  isOpen,
  messageId,
  onConfirm,
  onCancel,
}: DeleteConfirmDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      const result = await deleteMessage(messageId);

      if (result.success) {
        toast.success("Message deleted");
        onConfirm();
      } else {
        toast.error(result.error || "Failed to delete message");
      }
    } catch (_error) {
      toast.error("An error occurred while deleting the message");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onCancel}
      icon={AlertTriangle}
      title="Delete Message"
      subtitle="This action cannot be undone"
      theme="danger"
      maxWidth="sm"
      closeOnBackdropClick={!isDeleting}
      closeOnEscape={!isDeleting}
      rightActions={
        <>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isDeleting}
            className="font-semibold"
          >
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </>
            )}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-700 leading-relaxed">
          Are you sure you want to delete this message? This will permanently
          remove the message from the chat room for all participants.
        </p>

        {/* Warning callout */}
        <div
          className={cn(
            "p-4 rounded-lg",
            "bg-red-50",
            "border-l-4 border-red-500",
          )}
        >
          <div className="flex gap-3">
            <Trash2 className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-red-600 uppercase tracking-wide">
                Warning
              </p>
              <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                The message will be replaced with a placeholder indicating it
                was deleted. Replies and reactions will be preserved.
              </p>
            </div>
          </div>
        </div>
      </div>
    </BaseModal>
  );
}
