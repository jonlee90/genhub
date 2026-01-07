'use client';

import { useState, useRef } from 'react';
import { Calendar, Building2, MapPin, DollarSign, Box, User, Mail, Phone } from 'lucide-react';
import { motion } from 'framer-motion';
import { MetroJourney } from './MetroJourney';
import { ProjectExpenseSummary } from './ProjectExpenseSummary';
import { ProjectTaskSummary } from './ProjectTaskSummary';
import { IFCUploader } from './spatial/IFCUploader';
import { ModelManagementPanel } from './spatial/ModelManagementPanel';
import { ViewerToolbar } from './spatial/ViewerToolbar';
import { ModelStatsDisplay } from './spatial/ModelStatsDisplay';
import { MarkerAnnotationPanel } from './spatial/MarkerAnnotationPanel';
import { deleteModelVersion, replaceActiveModel } from '@/app/actions/spatial';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import dynamic from 'next/dynamic';
import { InfoCard } from './InfoCard';

// Dynamically import SpatialViewer to avoid SSR issues with xeokit SDK
const SpatialViewer = dynamic(
  () => import('./spatial/SpatialViewer').then(mod => ({ default: mod.SpatialViewer })),
  { ssr: false }
);

interface PhaseStats {
  phaseId: string;
  totalTasks: number;
  completedTasks: number;
  blockedTasks: number;
  overdueTasks: number;
}

// Fix C2: Import ExpenseStats instead of duplicating
import type { ExpenseStats, TaskStats } from '@/app/actions/projects';

interface ProjectOverviewProps {
  project: any;
  projects?: Array<{
    id: string;
    name: string;
    project_phases?: Array<{
      id: string;
      name: string;
      order_index: number;
    }>;
  }>;
  teamMembers?: Array<{
    id: string;
    name: string;
    email: string;
    avatar_url: string | null;
  }>;
  phaseTaskStats?: PhaseStats[];
  expenseStats?: ExpenseStats;
  taskStats?: TaskStats;
  activeModel?: any;
  userRole?: string; // NEW: For spatial viewer permissions
}

export function ProjectOverview({ project, projects = [], teamMembers = [], phaseTaskStats = [], expenseStats, taskStats, activeModel, userRole = 'field_worker' }: ProjectOverviewProps) {
  console.log('[ProjectOverview] Rendering with expense stats:', expenseStats, 'task stats:', taskStats, 'userRole:', userRole);

  const [isDeleting, setIsDeleting] = useState(false);
  const [isReplacing, setIsReplacing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const hasPhases = project.project_phases && project.project_phases.length > 0;

  // Handler: Delete active model
  const handleDeleteModel = async () => {
    if (!activeModel?.id) {
      toast.error('No active model to delete');
      return;
    }

    // Confirm deletion
    const confirmed = window.confirm(
      'Are you sure you want to delete this 3D model? This action cannot be undone.\n\n' +
      'Note: You can only delete non-active models. If this is the active model, please upload a replacement first.'
    );

    if (!confirmed) return;

    console.log('[ProjectOverview] Deleting model:', activeModel.id);
    setIsDeleting(true);

    try {
      const result = await deleteModelVersion(activeModel.id);

      if ('error' in result) {
        toast.error(result.error);
      } else {
        toast.success('3D model deleted successfully');
        router.refresh(); // Refresh to update UI
      }
    } catch (error) {
      console.error('[ProjectOverview] Delete error:', error);
      toast.error('Failed to delete model');
    } finally {
      setIsDeleting(false);
    }
  };

  // Handler: Replace active model
  const handleReplaceModel = () => {
    console.log('[ProjectOverview] Replace model clicked');
    // Trigger file input
    fileInputRef.current?.click();
  };

  // Handler: File selected for replacement
  const handleFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log('[ProjectOverview] File selected for replacement:', file.name);

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.ifc')) {
      toast.error('Please select an IFC file');
      return;
    }

    // Validate file size (max 500MB)
    const maxSize = 500 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('File size exceeds 500MB limit');
      return;
    }

    setIsReplacing(true);

    try {
      const result = await replaceActiveModel(project.id, file);

      if ('error' in result) {
        toast.error(result.error);
      } else {
        toast.success('3D model replaced successfully. Processing will begin shortly.');
        router.refresh(); // Refresh to show new model
      }
    } catch (error) {
      console.error('[ProjectOverview] Replace error:', error);
      toast.error('Failed to replace model');
    } finally {
      setIsReplacing(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Project Journey - Full Width Hero Section */}
      {hasPhases && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="relative"
        >

          <MetroJourney
            phases={project.project_phases || []}
            tasks={project.tasks || []}
            phaseStats={phaseTaskStats}
            projectId={project.id}
            projects={projects}
            teamMembers={teamMembers}
          />
        </motion.div>
      )}

      {/* Two-Column Layout: Main Content + Sidebar */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content Column - 2/3 */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: hasPhases ? 0.3 : 0 }}
          className="lg:col-span-2 space-y-6"
        >
 

          {/* Expense Summary Widget */}
          {expenseStats && project.budget && project.budget > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.5 }}
            >
              <ProjectExpenseSummary
                expenseStats={expenseStats}
                budget={project.budget}
              />
            </motion.div>
          )}

          {/* Task Summary Widget */}
          {taskStats && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.6 }}
            >
              <ProjectTaskSummary
                taskStats={taskStats}
              />
            </motion.div>
          )}

        </motion.div>

        {/* Sidebar Column - 1/3 */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: hasPhases ? 0.35 : 0.15 }}
          className="space-y-6"
        >
          {/* Client Information */}
          {(project.client_name || project.client_email || project.client_phone) && (
            <InfoCard
              headerIcon={User}
              headerTitle="Client Information"
              headerDescription="Primary contact"
              columns={1}
              fields={[
                {
                  label: 'Name',
                  value: project.client_name,
                  show: !!project.client_name,
                },
                {
                  label: 'Email',
                  value: project.client_email,
                  icon: Mail,
                  href: project.client_email,
                  hrefType: 'email',
                  show: !!project.client_email,
                },
                {
                  label: 'Phone',
                  value: project.client_phone,
                  icon: Phone,
                  href: project.client_phone,
                  hrefType: 'tel',
                  show: !!project.client_phone,
                },
              ]}
              footerContent={
                (project.created_at || project.updated_at) && (
                  <div className="border-t-2 border-gray-100 pt-4 mt-4 space-y-3 col-span-full">
                    {project.created_at && (
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                          Created
                        </div>
                        <div className="text-xs font-medium text-gray-600">
                          {formatDate(project.created_at)}
                        </div>
                      </div>
                    )}
                    {project.updated_at && (
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                          Last Updated
                        </div>
                        <div className="text-xs font-medium text-gray-600">
                          {formatDate(project.updated_at)}
                        </div>
                      </div>
                    )}
                  </div>
                )
              }
            />
          )}

        </motion.div>
      </div>

      {/* 3D Spatial Viewer Section - Full Width at Bottom */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="space-y-4 md:space-y-6"
      >
        {activeModel?.xkt_file_url || project.project_type === 'residential' ? (
          <>
            {/* Hidden file input for model replacement */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".ifc"
              onChange={handleFileSelected}
              className="hidden"
            />

            {/* Section Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-construction-blue rounded-lg">
                <Box className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold">3D Spatial Viewer</h2>
                <p className="text-sm text-gray-600">Visualize and interact with the project model</p>
              </div>
            </div>

            {/* Model Management Panel - only show when there's an active model */}
            {activeModel?.xkt_file_url && (
              <div className="relative">
                {(isReplacing || isDeleting) && (
                  <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
                    <div className="text-center">
                      <div className="w-8 h-8 border-4 border-[#001B51] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                      <p className="text-sm font-semibold text-gray-700">
                        {isReplacing ? 'Uploading new model...' : 'Deleting model...'}
                      </p>
                    </div>
                  </div>
                )}
                <ModelManagementPanel
                  model={activeModel}
                  onReplace={handleReplaceModel}
                  onDelete={handleDeleteModel}
                  onQualityChange={(quality) => {
                    console.log('[ProjectOverview] Quality changed', { quality });
                    // TODO: Update viewer quality
                  }}
                />
              </div>
            )}

            {/* 3D Viewer with Toolbar (Phase 3 enhanced) */}
            <div className="relative h-[600px] md:h-[800px]">
              <SpatialViewer
                projectId={project.id}
                modelHighURL={activeModel?.xkt_file_url}
                modelMediumURL={activeModel?.model_medium_url}
                modelLowURL={activeModel?.model_low_url}
                thumbnailURL={activeModel?.thumbnail_url}
                projectType={project.project_type}
                userRole={userRole}
                teamMembers={teamMembers}
                phases={project.project_phases || []}
                projectTasks={project.tasks || []}
                onMarkerPlacement={(marker) => {
                  console.log('[ProjectOverview] Marker placed:', marker.id);
                  // Phase 4 will handle marker detail panel
                }}
              />

              {/* Viewer Toolbar Overlay */}
              <ViewerToolbar
                viewer={null}
                onCameraPreset={(preset) => {
                  console.log('[ProjectOverview] Camera preset', { preset });
                  // TODO: Apply camera preset
                }}
                onInteractionMode={(mode) => {
                  console.log('[ProjectOverview] Interaction mode', { mode });
                  // TODO: Change interaction mode
                }}
                onResetView={() => {
                  console.log('[ProjectOverview] Reset view');
                  // TODO: Reset camera view
                }}
              />
            </div>

            {/* Bottom Grid: Stats + Markers */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
              <ModelStatsDisplay
                stats={{
                  objectCount: activeModel?.element_count || (project.project_type === 'residential' ? 7 : undefined),
                  fileSize: activeModel?.file_size_bytes,
                  processingStatus: activeModel?.processing_status || (project.project_type === 'residential' ? 'ready' : undefined),
                }}
              />

              <MarkerAnnotationPanel
                markers={[]}
                onAddMarker={() => {
                  console.log('[ProjectOverview] Add marker clicked');
                  // TODO: Enable marker placement mode
                }}
                onMarkerClick={(markerId) => {
                  console.log('[ProjectOverview] Marker clicked', { markerId });
                  // TODO: Navigate to marker in 3D view
                }}
                onFilterChange={(category) => {
                  console.log('[ProjectOverview] Filter changed', { category });
                  // TODO: Filter markers in 3D view
                }}
              />
            </div>
          </>
        ) : (
          <IFCUploader
            projectId={project.id}
            onUploadComplete={(modelId) => {
              console.log('[ProjectOverview] Upload complete', { modelId });
              router.refresh(); // Refresh to load new model
            }}
          />
        )}
      </motion.div>
    </div>
  );
}
