'use client';

import { useState } from 'react';
import { CreateProjectForm } from '@/components/projects/CreateProjectForm';

/**
 * New Project Page
 *
 * Standalone page for creating a new project.
 * Uses CreateProjectForm in non-modal mode.
 */
export default function NewProjectPage() {
  const [isOpen] = useState(true);

  return (
    <CreateProjectForm
      isOpen={isOpen}
      onClose={() => {
        // In page mode, navigation away is handled by router
      }}
      onSuccess={() => {
        // Redirect happens in CreateProjectForm
      }}
      isModal={false}
    />
  );
}
