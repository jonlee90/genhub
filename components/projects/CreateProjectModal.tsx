'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { HardHat } from 'lucide-react';
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

  console.log('[CreateProjectModal] Rendering:', { isOpen });

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      console.log('[CreateProjectModal] Modal opened, resetting form');
      setFormKey(Date.now());
    }
  }, [isOpen]);

  // Handle close with cleanup
  const handleClose = () => {
    console.log('[CreateProjectModal] Closing modal');
    onClose();
    // Reset form on close
    setTimeout(() => {
      setFormKey(Date.now());
    }, 300); // Wait for modal close animation
  };

  const handleSuccess = (projectId: string) => {
    console.log('[CreateProjectModal] Project created:', projectId);
    // Close modal
    handleClose();
    // Refresh page to show new project
    router.refresh();
    // Call optional success callback
    onSuccess?.();
  };

  if (!isOpen) return null;

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
