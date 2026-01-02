'use client';

import { useState } from 'react';
import { CreateProjectForm } from './CreateProjectForm';

/**
 * CreateProjectFormPage
 *
 * Wrapper component for using CreateProjectForm in a standalone page (not in a modal).
 * Manages the isOpen state to make the form always visible.
 */
export function CreateProjectFormPage() {
  const [isOpen] = useState(true); // Always open in page mode

  console.log('[CreateProjectFormPage] Rendering page mode form');

  return (
    <CreateProjectForm
      isOpen={isOpen}
      onClose={() => {
        // In page mode, onClose is not really used (user navigates away via router)
        console.log('[CreateProjectFormPage] Close requested - user should navigate away');
      }}
      onSuccess={(projectId) => {
        console.log('[CreateProjectFormPage] Project created:', projectId);
        // Redirect happens in CreateProjectForm
      }}
      isModal={false}
    />
  );
}
