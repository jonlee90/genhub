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
}

export function TaskModalTrigger({
  projects,
  teamMembers,
  preselectedProjectId,
  preselectedPhaseId,
  variant = 'default',
  size = 'lg',
  label = 'NEW TASK',
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
          variant === 'default'
            ? 'relative h-14 px-8 bg-gradient-to-r from-construction-blue to-blue-700 hover:from-construction-blue/90 hover:to-blue-700/90 shadow-construction-lg hover:shadow-construction-xl transition-all group overflow-hidden text-white'
            : ''
        }
      >
        {variant === 'default' && (
          <div className="absolute inset-0 bg-construction-accent opacity-0 group-hover:opacity-10 transition-opacity" />
        )}
        <Wrench className="mr-2 h-5 w-5 group-hover:rotate-12 transition-transform" />
        <span className="font-black text-base">{label}</span>
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
