"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { AddSubcontractorForm } from "./AddSubcontractorForm";

interface AddSubcontractorModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
}

/**
 * AddSubcontractorModal Component
 *
 * Modal wrapper for subcontractor creation.
 * Form handles its own ResponsiveModal wrapper (like CreateProjectModal and TaskModal).
 * This component manages open/close state and success callbacks.
 */
export function AddSubcontractorModal({
  isOpen,
  onClose,
  companyId,
}: AddSubcontractorModalProps) {
  const router = useRouter();

  // Performance optimization: Memoize event handlers to prevent recreation on every render
  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleSuccess = useCallback(() => {
    // Close modal
    handleClose();
    // Refresh page to show new subcontractor
    router.refresh();
  }, [handleClose, router]);

  // Always render the form, let ResponsiveModal handle visibility
  return (
    <AddSubcontractorForm
      isOpen={isOpen}
      onClose={handleClose}
      companyId={companyId}
      onSuccess={handleSuccess}
    />
  );
}
