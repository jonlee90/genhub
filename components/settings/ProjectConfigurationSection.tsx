'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ProjectTypeManager } from './ProjectTypeManager';
import { Wrench, Tag, Route, ListChecks } from 'lucide-react';

/**
 * ProjectConfigurationSection - Tabbed interface for managing project configuration
 * Debug: Client component with tab navigation for project types, task types, phase templates, and task templates
 */
export function ProjectConfigurationSection() {
  console.log('[ProjectConfigurationSection] Rendering configuration tabs');

  const [activeTab, setActiveTab] = useState<'project-types' | 'task-types' | 'phase-templates' | 'task-templates'>('project-types');

  const tabs = [
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
      comingSoon: true,
    },
    {
      id: 'phase-templates' as const,
      label: 'Phase Templates',
      icon: Route,
      description: 'Auto-populate project phases',
      comingSoon: true,
    },
    {
      id: 'task-templates' as const,
      label: 'Task Templates',
      icon: ListChecks,
      description: 'Pre-built task checklists',
      comingSoon: true,
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

        {activeTab === 'task-types' && (
          <div className="text-center py-12">
            <Tag className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">Task Types</h3>
            <p className="text-gray-500 max-w-md mx-auto">
              Task type management coming soon. Define custom task categories for your construction workflows.
            </p>
          </div>
        )}

        {activeTab === 'phase-templates' && (
          <div className="text-center py-12">
            <Route className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">Phase Templates</h3>
            <p className="text-gray-500 max-w-md mx-auto">
              Phase template management coming soon. Create reusable phase structures for different project types.
            </p>
          </div>
        )}

        {activeTab === 'task-templates' && (
          <div className="text-center py-12">
            <ListChecks className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">Task Templates</h3>
            <p className="text-gray-500 max-w-md mx-auto">
              Task template management coming soon. Build pre-configured task checklists for each phase.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
