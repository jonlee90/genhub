"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { CreateProjectForm } from "./CreateProjectForm";
import type { ProjectTypeConfigsRow } from "@/types/db/tables/projects";

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  projectTypes?: ProjectTypeConfigsRow[];
}

/**
 * CreateProjectModal Component
 *
 * Industrial-strength modal for project creation.
 * Form now handles its own ResponsiveModal wrapper (like TaskModal).
 * This component manages open/close state and success callbacks.
 *
 * Performance: Accepts prefetched projectTypes from server to avoid fetching in modal.
 */
export function CreateProjectModal({
  isOpen,
  onClose,
  onSuccess,
  projectTypes = [],
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
      projectTypes={projectTypes}
    />
  );
}
