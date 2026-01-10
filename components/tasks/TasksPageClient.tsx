'use client';

import { useState } from 'react';
import { TaskBoard } from './TaskBoard';
import { TaskModalTrigger } from './TaskModalTrigger';
import { ProjectFilterHeader } from './ProjectFilterHeader';
import type { Database } from '@/types/database.types';

type Task = Database['public']['Tables']['tasks']['Row'] & {
  assignee?: {
    id: string;
    name: string;
    email: string;
    avatar_url: string | null;
  } | null;
  project?: {
    id: string;
    name: string;
  } | null;
  phase?: {
    id: string;
    name: string;
  } | null;
};

type Phase = {
  id: string;
  name: string;
  order_index: number;
};

type Project = {
  id: string;
  name: string;
  status?: string;
  health_score?: number | null;
  completion_percentage?: number | null;
  project_phases?: Phase[];
};

type TeamMember = {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
};

type TopTeamMember = {
  id: string;
  name: string;
  avatar_url?: string;
  completed_tasks: number;
};

type TaskDependency = Database['public']['Tables']['task_dependencies']['Row'];

interface TasksPageClientProps {
  tasks: Task[];
  projects: Project[];
  teamMembers: TeamMember[];
  taskDependencies: TaskDependency[];
  topTeamMembers: TopTeamMember[];
  initialView: 'kanban' | 'list';
}

export function TasksPageClient({
  tasks,
  projects,
  teamMembers,
  taskDependencies,
  topTeamMembers,
  initialView,
}: TasksPageClientProps) {
  const [projectFilter, setProjectFilter] = useState<string>('all');

  return (
    <div className="flex-1 space-y-4 md:space-y-6 p-4 md:p-8 pt-4 md:pt-6 relative overflow-hidden">
      {/* Blueprint Grid Background */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
            linear-gradient(to right, currentColor 1px, transparent 1px),
            linear-gradient(to bottom, currentColor 1px, transparent 1px)
          `,
            backgroundSize: '40px 40px',
            color: '#001B51',
          }}
        />
      </div>

      {/* Industrial Header with Blueprint Aesthetic */}
      <div className="relative">
        {/* Construction border */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-construction-blue" />

        <div className="flex flex-col gap-4 pt-2 md:pt-4">
          {/* Title Row */}
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1 md:space-y-3">
              {/* Main Title - Heavy Industrial Typography */}
              <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-construction-blue leading-none">
                TASKS
              </h1>
            </div>

            {/* Action Button with Construction Theme */}
            <TaskModalTrigger projects={projects} teamMembers={teamMembers} />
          </div>

          {/* Prominent Project Filter */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <ProjectFilterHeader
              projects={projects}
              selectedProjectId={projectFilter}
              onProjectChange={setProjectFilter}
            />

            {/* Selected project indicator on mobile */}
            {projectFilter !== 'all' && (
              <div className="sm:hidden text-xs text-gray-500">
                Showing tasks for selected project only
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Task Board with external project filter */}
      <TaskBoard
        initialTasks={tasks}
        taskDependencies={taskDependencies}
        projects={projects}
        teamMembers={teamMembers}
        initialView={initialView}
        topTeamMembers={topTeamMembers}
        externalProjectFilter={projectFilter}
        onExternalProjectFilterChange={setProjectFilter}
      />

      {/* Decorative bottom border */}
      <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
    </div>
  );
}
