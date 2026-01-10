'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { HardHat } from 'lucide-react';
import { CreateProjectModal } from './CreateProjectModal';
import type { Database } from '@/types/database.types';

type Project = Database['public']['Tables']['projects']['Row'] & {
  project_phases?: Array<{
    id: string;
    status: string;
    completion_percentage: number | null;
  }>;
};

interface ProjectsPageClientProps {
  role: string | null;
}

/**
 * ProjectsPageClient Component
 *
 * Client-side component for the "Create Project" button and modal.
 * Separated from the server component to enable modal state management.
 */
export function ProjectsPageClient({ role }: ProjectsPageClientProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  console.log('[ProjectsPageClient] Rendering with role:', role);

  // Only show button for authorized roles
  if (role !== 'gc_admin' && role !== 'project_manager') {
    return null;
  }

  return (
    <>
      {/* Create Project Button */}
      <Button
        size="lg"
        onClick={() => {
          console.log('[ProjectsPageClient] Opening create project modal');
          setIsCreateModalOpen(true);
        }}
        className="relative h-11 md:h-14 px-4 md:px-8 bg-gradient-to-r from-construction-blue to-blue-700 hover:from-construction-blue/90 hover:to-blue-700/90 shadow-construction-lg hover:shadow-construction-xl transition-all group overflow-hidden text-white"
      >
        <HardHat className="mr-1.5 md:mr-2 h-4 w-4 md:h-5 md:w-5 group-hover:rotate-12 transition-transform" />
        <span className="font-black text-sm md:text-base">NEW</span>
        <span className="hidden sm:inline font-black text-sm md:text-base ml-1">PROJECT</span>
      </Button>

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          console.log('[ProjectsPageClient] Closing create project modal');
          setIsCreateModalOpen(false);
        }}
        onSuccess={() => {
          console.log('[ProjectsPageClient] Project created successfully');
          // Modal will auto-close and refresh will happen
        }}
      />
    </>
  );
}
