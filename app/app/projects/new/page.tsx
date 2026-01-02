import { CreateProjectFormPage } from '@/components/projects/CreateProjectFormPage';

export const metadata = {
  title: 'New Project | GenHub',
  description: 'Create a new construction project',
};

/**
 * New Project Page
 *
 * Standalone page for creating a new project.
 * Uses CreateProjectFormPage wrapper which internally uses CreateProjectForm
 * in non-modal mode with BaseModal wrapper (matching TaskModal design).
 */
export default function NewProjectPage() {
  return <CreateProjectFormPage />;
}
