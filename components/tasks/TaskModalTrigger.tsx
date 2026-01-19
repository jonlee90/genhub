'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Wrench } from 'lucide-react';
import type { TaskProject, TeamMember } from '@/types/db/task';

// Dynamic import TaskModal to reduce initial bundle
const TaskModal = dynamic(
  () => import('./TaskModal').then(mod => ({ default: mod.TaskModal })),
  { ssr: false }
);

interface TaskModalTriggerProps {
  projects: TaskProject[];
  teamMembers: TeamMember[];
  preselectedProjectId?: string;
  preselectedPhaseId?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  label?: string;
  className?: string;
  onOpen?: () => void;
}

export function TaskModalTrigger({
  projects,
  teamMembers,
  preselectedProjectId,
  preselectedPhaseId,
  variant = 'default',
  size = 'lg',
  label = 'NEW TASK',
  className,
  onOpen,
}: TaskModalTriggerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const handleOpen = () => {
    onOpen?.(); // Trigger data fetch if provided
    setIsOpen(true);
  };

  const handleSuccess = () => {
    setIsOpen(false);
    router.refresh(); // Refresh the page to show the new task
  };

  return (
    <>
      <Button
        onClick={handleOpen}
        size={size}
        variant={variant}
        className={
          className || (variant === 'default'
            ? 'relative h-11 md:h-14 px-4 md:px-8 bg-gradient-to-r from-construction-blue to-blue-700 hover:from-construction-blue/90 hover:to-blue-700/90 shadow-construction-lg hover:shadow-construction-xl transition-all group overflow-hidden text-white'
            : '')
        }
      >
   
        <Wrench className="mr-1.5 md:mr-2 h-4 w-4 md:h-5 md:w-5 group-hover:rotate-12 transition-transform" />
        <span className="font-black text-sm md:text-base">{label}</span>
      </Button>

      {/* Only render modal when open (lazy load on first open) */}
      {isOpen && (
        <TaskModal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          mode="create"
          projects={projects}
          teamMembers={teamMembers}
          preselectedProjectId={preselectedProjectId}
          preselectedPhaseId={preselectedPhaseId}
          onSuccess={handleSuccess}
        />
      )}
    </>
  );
}
