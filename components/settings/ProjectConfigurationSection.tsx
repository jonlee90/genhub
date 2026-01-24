'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FilterTabs, type FilterTab } from '@/components/ui/FilterTabs';
import { BlueprintBackground } from '@/components/shared';
import { PullToRefresh } from '@/components/mobile/PullToRefresh';
import { useIsMobile } from '@/lib/hooks/useMediaQuery';
import { ProjectTypeManager } from './ProjectTypeManager';
import { TaskTypeManager } from './TaskTypeManager';
import { PhaseTemplateManager } from './PhaseTemplateManager';
import { TaskTemplateManager } from './TaskTemplateManager';
import { getProjectTypes, type ProjectTypeWithCount } from '@/app/actions/project-types';
import { getPhaseTemplates, type PhaseTemplateWithTasks } from '@/app/actions/phase-templates';
import { getAllTaskTypes } from '@/app/actions/task-types';
import { toast } from 'sonner';
import type { TaskTypeConfigsRow } from '@/types/db/tables/tasks';
// Direct Lucide imports for performance
import Wrench from 'lucide-react/icons/wrench';
import Tag from 'lucide-react/icons/tag';
import Route from 'lucide-react/icons/route';
import ListChecks from 'lucide-react/icons/list-checks';

type TabId = 'project-types' | 'task-types' | 'phase-templates' | 'task-templates';

const CONFIG_TABS: FilterTab[] = [
  { value: 'project-types', label: 'Projects', icon: Wrench },
  { value: 'task-types', label: 'Tasks', icon: Tag },
  { value: 'phase-templates', label: 'Phases', icon: Route },
  { value: 'task-templates', label: 'Templates', icon: ListChecks },
];

/**
 * ProjectConfigurationSection - Redesigned with FilterTabs component
 * Matches Projects and Tasks page patterns with mobile/desktop layouts
 * Mobile: PullToRefresh + sticky tabs + industrial header
 * Desktop: BlueprintBackground + grid tabs + card container
 *
 * Performance Optimization:
 * - Lifts shared data fetching to parent to eliminate redundant network calls
 * - Shares projectTypes, selectedProjectTypeId, and phaseTemplates across child managers
 * - Child components receive data via props instead of fetching independently
 */
export function ProjectConfigurationSection() {
  const [activeTab, setActiveTab] = useState<TabId>('project-types');
  const router = useRouter();

  // Shared state for project types and phases (used by multiple managers)
  const [projectTypes, setProjectTypes] = useState<ProjectTypeWithCount[]>([]);
  const [selectedProjectTypeId, setSelectedProjectTypeId] = useState<string>('');
  const [phaseTemplates, setPhaseTemplates] = useState<PhaseTemplateWithTasks[]>([]);
  const [selectedPhaseTemplateId, setSelectedPhaseTemplateId] = useState<string>('');
  const [selectedPhaseForTask, setSelectedPhaseForTask] = useState<string>('');
  const [taskTypes, setTaskTypes] = useState<TaskTypeConfigsRow[]>([]);
  const [isLoadingProjectTypes, setIsLoadingProjectTypes] = useState(true);
  const [isLoadingPhases, setIsLoadingPhases] = useState(false);
  const [isLoadingTaskTypes, setIsLoadingTaskTypes] = useState(true);

  // Mobile detection (hydration-safe)
  const isMobileQuery = useIsMobile();
  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => setHasMounted(true), []);
  const isMobile = hasMounted && isMobileQuery;

  // Load project types (shared by ProjectTypeManager, PhaseTemplateManager, TaskTemplateManager)
  // Following rerender-dependencies: removed selectedProjectTypeId from deps to avoid unnecessary re-creations
  const loadProjectTypes = useCallback(async () => {
    setIsLoadingProjectTypes(true);
    const result = await getProjectTypes();
    if (result.projectTypes) {
      setProjectTypes(result.projectTypes);
      // Auto-select first active project type for phase/task templates
      const activeTypes = result.projectTypes.filter((pt) => pt.is_active);
      // Use functional setState to avoid dependency on selectedProjectTypeId
      setSelectedProjectTypeId((current) => {
        // Only set if not already set
        return current || (activeTypes.length > 0 ? activeTypes[0].id : '');
      });
    } else if (result.error) {
      console.error('[ProjectConfigurationSection] Error loading project types:', result.error);
      toast.error(result.error);
    }
    setIsLoadingProjectTypes(false);
  }, []);

  // Load phase templates (shared by PhaseTemplateManager and TaskTemplateManager)
  // Following rerender-dependencies: removed selectedPhaseTemplateId from deps
  const loadPhaseTemplates = useCallback(async (projectTypeId: string) => {
    setIsLoadingPhases(true);
    const result = await getPhaseTemplates(projectTypeId);
    if (result.phaseTemplates) {
      const phases = result.phaseTemplates;
      setPhaseTemplates(phases);
      // Use functional setState to avoid dependency on selectedPhaseTemplateId
      setSelectedPhaseTemplateId((current) => {
        // Only set if not already set
        return current || (phases.length > 0 ? phases[0].id : '');
      });
    } else if (result.error) {
      console.error('[ProjectConfigurationSection] Error loading phase templates:', result.error);
      toast.error(result.error);
    }
    setIsLoadingPhases(false);
  }, []);

  // Load task types (used by TaskTypeManager)
  // Following rerender-dependencies: no reactive dependencies needed
  const loadTaskTypes = useCallback(async () => {
    setIsLoadingTaskTypes(true);
    const result = await getAllTaskTypes();
    if (result.taskTypes) {
      setTaskTypes(result.taskTypes);
    } else if (result.error) {
      console.error('[ProjectConfigurationSection] Error loading task types:', result.error);
      toast.error(result.error);
    }
    setIsLoadingTaskTypes(false);
  }, []);

  // Refresh handlers for child components to call after mutations
  const refreshProjectTypes = useCallback(() => {
    loadProjectTypes();
  }, [loadProjectTypes]);

  const refreshPhaseTemplates = useCallback(() => {
    if (selectedProjectTypeId) {
      loadPhaseTemplates(selectedProjectTypeId);
    }
  }, [selectedProjectTypeId, loadPhaseTemplates]);

  const refreshTaskTypes = useCallback(() => {
    loadTaskTypes();
  }, [loadTaskTypes]);

  // Load project types on mount
  useEffect(() => {
    loadProjectTypes();
  }, [loadProjectTypes]);

  // Load phase templates when project type changes
  useEffect(() => {
    if (selectedProjectTypeId) {
      loadPhaseTemplates(selectedProjectTypeId);
    }
  }, [selectedProjectTypeId, loadPhaseTemplates]);

  // Load task types on mount
  useEffect(() => {
    loadTaskTypes();
  }, [loadTaskTypes]);

  // Pull-to-refresh handler
  // Following async-parallel: Use Promise.all() for independent operations
  const handleRefresh = useCallback(async () => {
    // Read current selectedProjectTypeId to avoid dependency
    const currentProjectTypeId = selectedProjectTypeId;
    await Promise.all([
      loadProjectTypes(),
      loadTaskTypes(),
      currentProjectTypeId ? loadPhaseTemplates(currentProjectTypeId) : Promise.resolve()
    ]);
  }, [loadProjectTypes, loadTaskTypes, loadPhaseTemplates, selectedProjectTypeId]);

  // Tab change handler
  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value as TabId);
  }, []);

  // Handle "Add Task" from PhaseTemplateManager - switch to task templates tab with phase selected
  const handleAddTaskToPhase = useCallback((phaseId: string) => {
    setSelectedPhaseForTask(phaseId);
    setActiveTab('task-templates');
    // Scroll to top for better UX
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Wrap phase template change handler to clear selectedPhaseForTask when user manually changes phase
  const handlePhaseTemplateChange = useCallback((id: string) => {
    setSelectedPhaseTemplateId(id);
    setSelectedPhaseForTask(''); // Clear the override when user manually selects
  }, []);

  // Mobile layout
  if (isMobile) {
    return (
      <div className="flex flex-col h-full">
        <PullToRefresh onRefresh={handleRefresh} className="flex-1">
          <div className="p-4 pb-32">
            <BlueprintBackground />

            {/* Industrial Header */}
            <div className="relative mb-4">
              <div className="absolute top-0 left-0 right-0 h-1 bg-construction-blue dark:bg-blue-400" />
              <h1 className="text-3xl font-black tracking-tighter text-construction-blue dark:text-blue-400 leading-none pt-2 uppercase">
                CONFIGURATION
              </h1>
            </div>

            {/* FilterTabs - sticky */}
            <div className="sticky top-0 z-30 -mx-4 px-4 py-2 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border-b border-gray-100 dark:border-gray-700">
              <FilterTabs
                tabs={CONFIG_TABS}
                value={activeTab}
                onChange={handleTabChange}
                showCounts={false}
                useStatusGradients={false}
                layoutId="configTabs"
              />
            </div>

            {/* Active Manager */}
            <div className="mt-4">
              {activeTab === 'project-types' && (
                <ProjectTypeManager
                  projectTypes={projectTypes}
                  isLoading={isLoadingProjectTypes}
                  onRefresh={refreshProjectTypes}
                />
              )}
              {activeTab === 'task-types' && (
                <TaskTypeManager
                  taskTypes={taskTypes}
                  isLoading={isLoadingTaskTypes}
                  onRefresh={refreshTaskTypes}
                />
              )}
              {activeTab === 'phase-templates' && (
                <PhaseTemplateManager
                  projectTypes={projectTypes}
                  selectedProjectTypeId={selectedProjectTypeId}
                  onProjectTypeChange={setSelectedProjectTypeId}
                  phaseTemplates={phaseTemplates}
                  isLoadingProjectTypes={isLoadingProjectTypes}
                  isLoadingPhases={isLoadingPhases}
                  onRefreshPhases={refreshPhaseTemplates}
                  onAddTaskToPhase={handleAddTaskToPhase}
                />
              )}
              {activeTab === 'task-templates' && (
                <TaskTemplateManager
                  projectTypes={projectTypes}
                  selectedProjectTypeId={selectedProjectTypeId}
                  onProjectTypeChange={setSelectedProjectTypeId}
                  phaseTemplates={phaseTemplates}
                  selectedPhaseTemplateId={selectedPhaseForTask || selectedPhaseTemplateId}
                  onPhaseTemplateChange={handlePhaseTemplateChange}
                  taskTypes={taskTypes}
                  isLoadingProjectTypes={isLoadingProjectTypes}
                  isLoadingPhases={isLoadingPhases}
                  onRefreshPhases={refreshPhaseTemplates}
                />
              )}
            </div>
          </div>
        </PullToRefresh>
      </div>
    );
  }

  // Desktop layout
  return (
    <div className="flex-1 space-y-4 md:space-y-6 p-4 md:p-8 pt-4 md:pt-6 relative overflow-hidden">
      <BlueprintBackground />

      {/* Industrial Header */}
      <div className="relative">
        <div className="absolute top-0 left-0 right-0 h-1 bg-construction-blue dark:bg-blue-400" />
        <div className="pt-2 md:pt-4">
          <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-construction-blue dark:text-blue-400 leading-none uppercase">
            PROJECT CONFIGURATION
          </h1>
          <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mt-2">
            Manage project types, task types, and templates
          </p>
        </div>
      </div>

      {/* FilterTabs - grid layout on desktop */}
      <FilterTabs
        tabs={CONFIG_TABS}
        value={activeTab}
        onChange={handleTabChange}
        showCounts={false}
        useStatusGradients={false}
        layoutId="configTabs"
      />

      {/* Card container */}
      <div className="border-2 border-gray-200 dark:border-gray-700 rounded-xl shadow-construction bg-white dark:bg-gray-800 p-4 md:p-6">
        {activeTab === 'project-types' && (
          <ProjectTypeManager
            projectTypes={projectTypes}
            isLoading={isLoadingProjectTypes}
            onRefresh={refreshProjectTypes}
          />
        )}
        {activeTab === 'task-types' && (
          <TaskTypeManager
            taskTypes={taskTypes}
            isLoading={isLoadingTaskTypes}
            onRefresh={refreshTaskTypes}
          />
        )}
        {activeTab === 'phase-templates' && (
          <PhaseTemplateManager
            projectTypes={projectTypes}
            selectedProjectTypeId={selectedProjectTypeId}
            onProjectTypeChange={setSelectedProjectTypeId}
            phaseTemplates={phaseTemplates}
            isLoadingProjectTypes={isLoadingProjectTypes}
            isLoadingPhases={isLoadingPhases}
            onRefreshPhases={refreshPhaseTemplates}
            onAddTaskToPhase={handleAddTaskToPhase}
          />
        )}
        {activeTab === 'task-templates' && (
          <TaskTemplateManager
            projectTypes={projectTypes}
            selectedProjectTypeId={selectedProjectTypeId}
            onProjectTypeChange={setSelectedProjectTypeId}
            phaseTemplates={phaseTemplates}
            selectedPhaseTemplateId={selectedPhaseForTask || selectedPhaseTemplateId}
            onPhaseTemplateChange={handlePhaseTemplateChange}
            taskTypes={taskTypes}
            isLoadingProjectTypes={isLoadingProjectTypes}
            isLoadingPhases={isLoadingPhases}
            onRefreshPhases={refreshPhaseTemplates}
          />
        )}
      </div>

      {/* Decorative bottom border */}
      <div className="h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-700 to-transparent" />
    </div>
  );
}
