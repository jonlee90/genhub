'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Building2, MapPin, FileText, DollarSign, Layers, Box } from 'lucide-react';
import { motion } from 'framer-motion';
import { MetroJourney } from './MetroJourney';
import { ProjectExpenseSummary } from './ProjectExpenseSummary';
import { IFCUploader } from './spatial/IFCUploader';
import { ModelManagementPanel } from './spatial/ModelManagementPanel';
import { ViewerToolbar } from './spatial/ViewerToolbar';
import { ModelStatsDisplay } from './spatial/ModelStatsDisplay';
import { MarkerAnnotationPanel } from './spatial/MarkerAnnotationPanel';
import { deleteModelVersion, replaceActiveModel } from '@/app/actions/spatial';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import dynamic from 'next/dynamic';

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
import type { ExpenseStats } from '@/app/actions/projects';

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
  activeModel?: any;
}

export function ProjectOverview({ project, projects = [], teamMembers = [], phaseTaskStats = [], expenseStats, activeModel }: ProjectOverviewProps) {
  console.log('[ProjectOverview] Rendering with expense stats:', expenseStats);

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
          {/* Project Description */}
          <Card className="border-2 border-gray-200 shadow-construction relative overflow-hidden group">
            {/* Subtle animated gradient overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-construction-blue/[0.02] via-transparent to-construction-accent/[0.02] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <CardHeader className="border-b-2 border-gray-100 bg-gradient-to-r from-gray-50 to-white relative">
              <CardTitle className="text-lg font-black text-construction-blue flex items-center gap-2">
                <div className="p-1.5 bg-construction-blue/10 rounded-lg">
                  <FileText className="h-4 w-4" />
                </div>
                Project Description
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 relative">
              {project.description ? (
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{project.description}</p>
              ) : (
                <p className="text-gray-400 italic">No description provided for this project.</p>
              )}
            </CardContent>
          </Card>


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


   

   
        
        </motion.div>

        {/* Sidebar Column - 1/3 */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: hasPhases ? 0.35 : 0.15 }}
          className="space-y-6"
        >
         
          {/* Client Information */}
          {project.client_name && (
            <Card className="border-2 border-gray-200 shadow-construction relative overflow-hidden group">
  
              <CardContent className="p-4 space-y-4 relative">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-construction-blue/10 rounded-lg border border-construction-blue/20">
                    <Building2 className="h-5 w-5 text-construction-blue" />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Client Name</div>
                    <div className="text-sm font-bold text-gray-900 mt-0.5">{project.client_name}</div>
                  </div>
                </div>

                {project.client_email && (
                  <div>
                    <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Email</div>
                    <a
                      href={`mailto:${project.client_email}`}
                      className="text-sm text-construction-blue hover:underline font-medium"
                    >
                      {project.client_email}
                    </a>
                  </div>
                )}

                {project.client_phone && (
                  <div>
                    <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Phone</div>
                    <a
                      href={`tel:${project.client_phone}`}
                      className="text-sm text-construction-blue hover:underline font-medium"
                    >
                      {project.client_phone}
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
            {/* Project Timeline */}
            {(project.start_date || project.end_date) && (
              <Card className="border-2 border-gray-200 shadow-construction relative overflow-hidden group">
                <CardContent className="p-5 space-y-5 relative">
                  {project.start_date && (
                    <div className="space-y-2">
                      <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Start Date</div>
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-construction-blue/10 rounded-lg border-2 border-construction-blue/20">
                          <Calendar className="h-5 w-5 text-construction-blue" />
                        </div>
                        <div>
                          <div className="text-2xl font-black text-construction-blue">
                            {new Date(project.start_date).getDate()}
                          </div>
                          <div className="text-sm font-bold text-gray-600">
                            {new Date(project.start_date).toLocaleDateString('en-US', {
                              month: 'short',
                              year: 'numeric',
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  {project.end_date && (
                    <div className="space-y-2">
                      <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Target End</div>
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-construction-accent/10 rounded-lg border-2 border-construction-accent/20">
                          <Calendar className="h-5 w-5 text-construction-accent" />
                        </div>
                        <div>
                          <div className="text-2xl font-black text-construction-accent">
                            {new Date(project.end_date).getDate()}
                          </div>
                          <div className="text-sm font-bold text-gray-600">
                            {new Date(project.end_date).toLocaleDateString('en-US', {
                              month: 'short',
                              year: 'numeric',
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

           {/* Project Details Card */}
           <Card className="border-2 border-gray-200 shadow-construction relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-b from-gray-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <CardHeader className="border-b-2 border-gray-100 bg-gradient-to-r from-gray-50 to-white relative">
              <CardTitle className="text-sm font-black text-gray-700 uppercase tracking-wider">
                Project Details
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4 relative">
              {/* Project ID */}
              <div>
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Project ID</div>
                <div className="text-sm font-mono text-gray-900 bg-gray-50 px-3 py-2 rounded border border-gray-200">
                  {project.id.substring(0, 8)}...
                </div>
              </div>

              {/* Created Date */}
              {project.created_at && (
                <div>
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Created</div>
                  <div className="text-sm font-bold text-gray-900">{formatDate(project.created_at)}</div>
                </div>
              )}

              {/* Last Updated */}
              {project.updated_at && (
                <div>
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Last Updated</div>
                  <div className="text-sm font-bold text-gray-900">{formatDate(project.updated_at)}</div>
                </div>
              )}
            </CardContent>
          </Card>

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

            {/* 3D Viewer with Toolbar */}
            <div className="relative h-[600px] md:h-[800px]">
              <SpatialViewer
                projectId={project.id}
                modelHighURL={activeModel?.xkt_file_url}
                modelMediumURL={activeModel?.model_medium_url}
                modelLowURL={activeModel?.model_low_url}
                thumbnailURL={activeModel?.thumbnail_url}
                projectType={project.project_type}
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
