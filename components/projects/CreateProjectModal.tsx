'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
// Performance optimization: Direct imports instead of barrel file (saves 200-800ms per page)
import FolderKanban from 'lucide-react/icons/folder-kanban';
import { CreateProjectForm } from './CreateProjectForm';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

/**
 * CreateProjectModal Component
 *
 * Industrial-strength modal for project creation.
 * Form now handles its own BaseModal wrapper (like TaskModal).
 * This component manages open/close state and success callbacks.
 */
export function CreateProjectModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateProjectModalProps) {
  const router = useRouter();
  const [formKey, setFormKey] = useState(0);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormKey(Date.now());
    }
  }, [isOpen]);

  // Performance optimization: Memoize event handlers to prevent recreation on every render
  const handleClose = useCallback(() => {
    onClose();
    // Reset form on close
    setTimeout(() => {
      setFormKey(Date.now());
    }, 300); // Wait for modal close animation
  }, [onClose]);

  const handleSuccess = useCallback((projectId: string) => {
    // Close modal
    handleClose();
    // Refresh page to show new project
    router.refresh();
    // Call optional success callback
    onSuccess?.();
  }, [handleClose, router, onSuccess]);

  // Always render the form, let BaseModal handle visibility
  return (
    <CreateProjectForm
      key={formKey}
      isOpen={isOpen}
      onClose={handleClose}
      onSuccess={handleSuccess}
      isModal={true}
    />
  );
}
