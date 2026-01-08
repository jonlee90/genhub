'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ProjectTypeManager } from './ProjectTypeManager';
import { TaskTypeManager } from './TaskTypeManager';
import { PhaseTemplateManager } from './PhaseTemplateManager';
import { TaskTemplateManager } from './TaskTemplateManager';
import { Wrench, Tag, Route, ListChecks } from 'lucide-react';

/**
 * ProjectConfigurationSection - Tabbed interface for managing project configuration
 * Debug: Client component with tab navigation for project types, task types, phase templates, and task templates
 */
export function ProjectConfigurationSection() {
  console.log('[ProjectConfigurationSection] Rendering configuration tabs');

  const [activeTab, setActiveTab] = useState<'project-types' | 'task-types' | 'phase-templates' | 'task-templates'>('project-types');

  const tabs: Array<{ id: 'project-types' | 'task-types' | 'phase-templates' | 'task-templates'; label: string; icon: typeof Wrench; description: string; comingSoon?: boolean }> = [
    {
      id: 'project-types' as const,
      label: 'Project Types',
      icon: Wrench,
      description: 'Define project categories',
    },
    {
      id: 'task-types' as const,
      label: 'Task Types',
      icon: Tag,
      description: 'Categorize work types',
    },
    {
      id: 'phase-templates' as const,
      label: 'Phase Templates',
      icon: Route,
      description: 'Auto-populate project phases',
    },
    {
      id: 'task-templates' as const,
      label: 'Task Templates',
      icon: ListChecks,
      description: 'Pre-built task checklists',
    },
  ];

  return (
    <div className="border-2 border-gray-200 rounded-lg shadow-construction bg-white overflow-hidden">
      {/* Debug: Tab navigation bar */}
      <div className="border-b-2 border-gray-200 bg-gray-50/50">
        <nav className="flex overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => !tab.comingSoon && setActiveTab(tab.id)}
                disabled={tab.comingSoon}
                className={cn(
                  'flex items-center gap-2 px-4 md:px-6 py-3 md:py-4 font-bold text-sm md:text-base border-b-2 transition-all whitespace-nowrap',
                  activeTab === tab.id
                    ? 'border-construction-blue text-construction-blue bg-white'
                    : tab.comingSoon
                    ? 'border-transparent text-gray-400 cursor-not-allowed'
                    : 'border-transparent text-gray-600 hover:text-construction-blue hover:border-gray-300'
                )}
              >
                <Icon className="h-4 w-4 md:h-5 md:w-5" />
                <span>{tab.label}</span>
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

      {/* Debug: Tab content area */}
      <div className="p-4 md:p-6">
        {activeTab === 'project-types' && <ProjectTypeManager />}
        {activeTab === 'task-types' && <TaskTypeManager />}
        {activeTab === 'phase-templates' && <PhaseTemplateManager />}
        {activeTab === 'task-templates' && <TaskTemplateManager />}
      </div>
    </div>
  );
}
