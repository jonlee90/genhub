'use client';

/**
 * DeleteConfirmDialog - Message deletion confirmation with industrial design
 *
 * Features:
 * - Modal confirmation dialog with warning styling
 * - Delete and Cancel actions
 * - Loading state during deletion
 * - Construction-themed destructive action design
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Trash2, X, AlertTriangle, Loader2 } from 'lucide-react';
import { deleteMessage } from '@/app/actions/chat';
import { toast } from 'sonner';

interface DeleteConfirmDialogProps {
  isOpen: boolean;
  messageId: string;
  onConfirm: () => void;
  onCancel: () => void;
}

// Debug: Delete confirmation dialog with construction warning design
export function DeleteConfirmDialog({
  isOpen,
  messageId,
  onConfirm,
  onCancel,
}: DeleteConfirmDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  console.log('[DeleteConfirmDialog] Rendering:', { isOpen, messageId });

  // Debug: Handle delete action
  const handleDelete = async () => {
    console.log('[DeleteConfirmDialog] Deleting message:', messageId);
    setIsDeleting(true);

    try {
      const result = await deleteMessage(messageId);

      if (result.success) {
        console.log('[DeleteConfirmDialog] Message deleted successfully');
        toast.success('Message deleted');
        onConfirm();
      } else {
        console.error('[DeleteConfirmDialog] Delete failed:', result.error);
        toast.error(result.error || 'Failed to delete message');
      }
    } catch (error) {
      console.error('[DeleteConfirmDialog] Delete error:', error);
      toast.error('An error occurred while deleting the message');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Debug: Backdrop with warning tint */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="fixed inset-0 bg-construction-red/10 backdrop-blur-sm z-[100]"
          />

          {/* Debug: Confirmation modal with industrial warning design */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[101]',
              'w-full max-w-md mx-4',
              'bg-white rounded-xl shadow-construction-xl',
              'border-4 border-construction-red/30',
              'overflow-hidden'
            )}
          >
            {/* Debug: Warning header with diagonal stripes (construction zone pattern) */}
            <div className="relative bg-gradient-to-r from-construction-red to-red-600 px-6 py-4">
              {/* Diagonal warning stripes overlay */}
              <div
                className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage: `repeating-linear-gradient(
                    45deg,
                    transparent,
                    transparent 10px,
                    white 10px,
                    white 20px
                  )`,
                }}
              />

              <div className="relative flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm animate-pulse">
                  <AlertTriangle className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-black text-white tracking-tight uppercase">
                    Delete Message
                  </h2>
                  <p className="text-xs font-mono text-white/80 mt-0.5">
                    This action cannot be undone
                  </p>
                </div>
                <button
                  onClick={onCancel}
                  disabled={isDeleting}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
                  aria-label="Close dialog"
                >
                  <X className="h-5 w-5 text-white" />
                </button>
              </div>
            </div>

            {/* Debug: Content */}
            <div className="p-6">
              <p className="text-sm text-gray-700 leading-relaxed">
                Are you sure you want to delete this message? This will permanently remove the
                message from the chat room for all participants.
              </p>

              {/* Debug: Warning callout with stamped border */}
              <div
                className={cn(
                  'mt-4 p-4 rounded-lg',
                  'bg-construction-red/5',
                  'border-l-4 border-construction-red'
                )}
              >
                <div className="flex gap-3">
                  <Trash2 className="h-5 w-5 text-construction-red shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-construction-red uppercase tracking-wide">
                      Warning
                    </p>
                    <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                      The message will be replaced with a placeholder indicating it was deleted.
                      Replies and reactions will be preserved.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Debug: Action buttons with industrial stamped style */}
            <div className="px-6 pb-6 flex gap-3">
              {/* Cancel button */}
              <button
                onClick={onCancel}
                disabled={isDeleting}
                className={cn(
                  'flex-1 px-4 py-3 rounded-lg',
                  'border-2 border-gray-300 bg-white',
                  'font-bold text-sm text-gray-700 uppercase tracking-wide',
                  'hover:bg-gray-50 hover:border-gray-400',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  'transition-all duration-200',
                  'flex items-center justify-center gap-2'
                )}
              >
                <X className="h-4 w-4" />
                Cancel
              </button>

              {/* Delete button with destructive stamped metal design */}
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className={cn(
                  'flex-1 px-4 py-3 rounded-lg',
                  'border-2 border-construction-red bg-construction-red',
                  'font-black text-sm text-white uppercase tracking-wide',
                  'hover:bg-red-700 hover:border-red-700 hover:shadow-lg',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  'transition-all duration-200',
                  'flex items-center justify-center gap-2',
                  'shadow-md'
                )}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
