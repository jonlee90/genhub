"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { CreateProjectForm } from "./CreateProjectForm";

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

/**
 * CreateProjectModal Component
 *
 * Industrial-strength modal for project creation.
 * Form now handles its own ResponsiveModal wrapper (like TaskModal).
 * This component manages open/close state and success callbacks.
 */
export function CreateProjectModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateProjectModalProps) {
  const router = useRouter();

  // Performance optimization: Memoize event handlers to prevent recreation on every render
  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleSuccess = useCallback(
    (_projectId: string) => {
      // Close modal
      handleClose();
      // Refresh page to show new project
      router.refresh();
      // Call optional success callback
      onSuccess?.();
    },
    [handleClose, router, onSuccess],
  );

  // Always render the form, let ResponsiveModal handle visibility
  return (
    <CreateProjectForm
      isOpen={isOpen}
      onClose={handleClose}
      onSuccess={handleSuccess}
      isModal={true}
    />
  );
}
