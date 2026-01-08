'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Wrench } from 'lucide-react';
import { TaskModal } from './TaskModal';

interface TaskModalTriggerProps {
  projects: Array<{
    id: string;
    name: string;
    project_phases?: Array<{
      id: string;
      name: string;
      order_index: number;
    }>;
  }>;
  teamMembers: Array<{
    id: string;
    name: string;
    email: string;
    avatar_url: string | null;
  }>;
  preselectedProjectId?: string;
  preselectedPhaseId?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  label?: string;
  className?: string;
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
}: TaskModalTriggerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const handleSuccess = () => {
    setIsOpen(false);
    router.refresh(); // Refresh the page to show the new task
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        size={size}
        variant={variant}
        className={
          className || (variant === 'default'
            ? 'relative h-11 md:h-14 px-4 md:px-8 bg-gradient-to-r from-construction-blue to-blue-700 hover:from-construction-blue/90 hover:to-blue-700/90 shadow-construction-lg hover:shadow-construction-xl transition-all group overflow-hidden text-white'
            : '')
        }
      >
        {variant === 'default' && (
          <div className="absolute inset-0 bg-construction-accent opacity-0 group-hover:opacity-10 transition-opacity" />
        )}
        <Wrench className="mr-1.5 md:mr-2 h-4 w-4 md:h-5 md:w-5 group-hover:rotate-12 transition-transform" />
        <span className="font-black text-sm md:text-base">{label}</span>
      </Button>

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
    </>
  );
}
