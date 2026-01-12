'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ProjectTypeManager } from './ProjectTypeManager';
import { TaskTypeManager } from './TaskTypeManager';
import { PhaseTemplateManager } from './PhaseTemplateManager';
import { TaskTemplateManager } from './TaskTemplateManager';
import { Wrench, Tag, Route, ListChecks } from 'lucide-react';

/**
 * ProjectConfigurationSection - Mobile-first tabbed interface for project configuration
 * Touch-friendly tabs with 44px minimum tap targets
 * Client component with tab navigation for project types, task types, phase templates, and task templates
 */
export function ProjectConfigurationSection() {
  console.log('[ProjectConfigurationSection] Rendering configuration tabs');

  const [activeTab, setActiveTab] = useState<'project-types' | 'task-types' | 'phase-templates' | 'task-templates'>('project-types');

  const tabs: Array<{ id: 'project-types' | 'task-types' | 'phase-templates' | 'task-templates'; label: string; shortLabel: string; icon: typeof Wrench; description: string; comingSoon?: boolean }> = [
    {
      id: 'project-types' as const,
      label: 'Project Types',
      shortLabel: 'Projects',
      icon: Wrench,
      description: 'Define project categories',
    },
    {
      id: 'task-types' as const,
      label: 'Task Types',
      shortLabel: 'Tasks',
      icon: Tag,
      description: 'Categorize work types',
    },
    {
      id: 'phase-templates' as const,
      label: 'Phase Templates',
      shortLabel: 'Phases',
      icon: Route,
      description: 'Auto-populate project phases',
    },
    {
      id: 'task-templates' as const,
      label: 'Task Templates',
      shortLabel: 'Templates',
      icon: ListChecks,
      description: 'Pre-built task checklists',
    },
  ];

  return (
    <div className="border-2 border-gray-200 rounded-xl shadow-construction bg-white overflow-hidden">
      {/* Tab navigation bar - touch-friendly with 44px+ height */}
      <div className="border-b-2 border-gray-200 bg-gray-50/80">
        <nav className="flex overflow-x-auto scrollbar-hide snap-x snap-mandatory">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => !tab.comingSoon && setActiveTab(tab.id)}
                disabled={tab.comingSoon}
                className={cn(
                  // Base styles with touch-friendly sizing
                  'flex items-center justify-center gap-2',
                  'min-h-[52px] md:min-h-[56px]',
                  'px-4 md:px-6',
                  'font-bold text-sm md:text-base',
                  'border-b-3 md:border-b-4',
                  'whitespace-nowrap',
                  'snap-start',
                  'flex-1 md:flex-initial',
                  // Transition and feedback
                  'transition-all duration-150',
                  'active:bg-gray-100',
                  // Active state
                  isActive
                    ? 'border-[#001B51] text-[#001B51] bg-white'
                    : tab.comingSoon
                    ? 'border-transparent text-gray-400 cursor-not-allowed'
                    : 'border-transparent text-gray-600 active:text-[#001B51]'
                )}
              >
                <Icon className={cn(
                  'h-5 w-5',
                  isActive && 'text-[#001B51]'
                )} />
                {/* Short label on mobile, full label on desktop */}
                <span className="md:hidden">{tab.shortLabel}</span>
                <span className="hidden md:inline">{tab.label}</span>
                {tab.comingSoon && (
                  <span className="text-xs px-1.5 py-0.5 bg-gray-200 text-gray-500 rounded">
                    Soon
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab content area */}
      <div className="p-4 md:p-6">
        {activeTab === 'project-types' && <ProjectTypeManager />}
        {activeTab === 'task-types' && <TaskTypeManager />}
        {activeTab === 'phase-templates' && <PhaseTemplateManager />}
        {activeTab === 'task-templates' && <TaskTemplateManager />}
      </div>
    </div>
  );
}
