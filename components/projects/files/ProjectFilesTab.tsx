/**
 * ProjectFilesTab Component
 * - Main container for Files & Photos feature
 * - Sub-navigation: Photos | Documents | All Files
 * - State management for selected files, filters
 * - Coordinates search, bulk actions, and content sections
 */

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Image, FileText, Folder, Upload, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { SearchFilterPanel } from './SearchFilterPanel';
import { BulkActionToolbar } from './BulkActionToolbar';
import { PhotoGallerySection } from './PhotoGallerySection';
import { DocumentsSection } from './DocumentsSection';
import { getProjectFiles } from '@/app/actions/project-files';
import { getProjectPhotosWithReceipts } from '@/app/actions/project-photos';
import { toast } from 'sonner';

interface ProjectFilesTabProps {
  projectId: string;
  initialFiles?: any[];
  initialPhotos?: any[];
}

type TabView = 'photos' | 'documents' | 'all';

export function ProjectFilesTab({
  projectId,
  initialFiles = [],
  initialPhotos = [],
}: ProjectFilesTabProps) {
  console.log('[ProjectFilesTab] Rendering for project:', projectId);

  // Tab state
  const [activeView, setActiveView] = useState<TabView>('photos');

  // Data state
  const [files, setFiles] = useState(initialFiles);
  const [photos, setPhotos] = useState(initialPhotos);
  const [loading, setLoading] = useState(false);

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Filter state
  const [filters, setFilters] = useState({
    search: '',
    category: [],
    dateFrom: undefined,
    dateTo: undefined,
    uploadedBy: [],
    fileType: [],
    source: [],
    showReceipts: true,
  });

  // Debug: Fetch data on mount or filter change
  useEffect(() => {
    fetchData();
  }, [filters, activeView]);

  const fetchData = async () => {
    console.log('[ProjectFilesTab] Fetching data with filters:', filters);
    setLoading(true);

    try {
      if (activeView === 'photos' || activeView === 'all') {
        const result = await getProjectPhotosWithReceipts(projectId, {
          category: filters.category.length > 0 ? filters.category : undefined,
          search: filters.search || undefined,
          dateFrom: filters.dateFrom,
          dateTo: filters.dateTo,
          source: filters.source.length > 0 ? filters.source : undefined,
          showReceipts: filters.showReceipts,
        });

        if (result.error) {
          toast.error(`Failed to load photos: ${result.error}`);
        } else {
          setPhotos(result.data || []);
        }
      }

      if (activeView === 'documents' || activeView === 'all') {
        const result = await getProjectFiles(projectId, {
          category: filters.category.length > 0 ? filters.category : undefined,
          search: filters.search || undefined,
          dateFrom: filters.dateFrom,
          dateTo: filters.dateTo,
          uploadedBy: filters.uploadedBy.length > 0 ? filters.uploadedBy : undefined,
          fileType: filters.fileType.length > 0 ? filters.fileType : undefined,
        });

        if (result.error) {
          toast.error(`Failed to load files: ${result.error}`);
        } else {
          setFiles(result.data || []);
        }
      }
    } catch (error) {
      console.error('[ProjectFilesTab] Fetch error:', error);
      toast.error('Failed to load files');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters: any) => {
    console.log('[ProjectFilesTab] Filters changed:', newFilters);
    setFilters(newFilters);
    setSelectedIds(new Set()); // Clear selection on filter change
  };

  const handleSelectToggle = (id: string) => {
    const newSelection = new Set(selectedIds);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedIds(newSelection);
  };

  const handleSelectAll = () => {
    const allIds =
      activeView === 'photos'
        ? photos.map((p) => p.id)
        : activeView === 'documents'
        ? files.map((f) => f.id)
        : [...photos.map((p) => p.id), ...files.map((f) => f.id)];

    setSelectedIds(new Set(allIds));
  };

  const handleClearSelection = () => {
    setSelectedIds(new Set());
  };

  const handleBulkAction = async (action: 'download' | 'delete' | 'move') => {
    console.log('[ProjectFilesTab] Bulk action:', action, selectedIds.size);
    // Action handlers will be implemented in components
  };

  return (
    <div className="space-y-6">
      {/* Debug: Sub-navigation */}
      <div className="flex items-center gap-2 border-b border-gray-200">
        <Button
          variant="ghost"
          onClick={() => setActiveView('photos')}
          className={cn(
            'relative px-4 py-2 rounded-none border-b-2 transition-colors',
            activeView === 'photos'
              ? 'border-[#001B51] text-[#001B51]'
              : 'border-transparent text-gray-600 hover:text-[#001B51]'
          )}
        >
          <Image className="h-4 w-4 mr-2" />
          Photos
          {photos.length > 0 && (
            <span className="ml-2 px-2 py-0.5 bg-gray-100 rounded-full text-xs">
              {photos.length}
            </span>
          )}
        </Button>

        <Button
          variant="ghost"
          onClick={() => setActiveView('documents')}
          className={cn(
            'relative px-4 py-2 rounded-none border-b-2 transition-colors',
            activeView === 'documents'
              ? 'border-[#001B51] text-[#001B51]'
              : 'border-transparent text-gray-600 hover:text-[#001B51]'
          )}
        >
          <FileText className="h-4 w-4 mr-2" />
          Documents
          {files.length > 0 && (
            <span className="ml-2 px-2 py-0.5 bg-gray-100 rounded-full text-xs">
              {files.length}
            </span>
          )}
        </Button>

        <Button
          variant="ghost"
          onClick={() => setActiveView('all')}
          className={cn(
            'relative px-4 py-2 rounded-none border-b-2 transition-colors',
            activeView === 'all'
              ? 'border-[#001B51] text-[#001B51]'
              : 'border-transparent text-gray-600 hover:text-[#001B51]'
          )}
        >
          <Folder className="h-4 w-4 mr-2" />
          All Files
          {(photos.length + files.length) > 0 && (
            <span className="ml-2 px-2 py-0.5 bg-gray-100 rounded-full text-xs">
              {photos.length + files.length}
            </span>
          )}
        </Button>
      </div>

      {/* Debug: Search and filter panel */}
      <SearchFilterPanel
        filters={filters}
        onFilterChange={handleFilterChange}
        onClear={() =>
          setFilters({
            search: '',
            category: [],
            dateFrom: undefined,
            dateTo: undefined,
            uploadedBy: [],
            fileType: [],
            source: [],
            showReceipts: true,
          })
        }
        viewType={activeView}
      />

      {/* Debug: Bulk action toolbar (visible when items selected) */}
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <BulkActionToolbar
            selectedCount={selectedIds.size}
            onDownload={() => handleBulkAction('download')}
            onDelete={() => handleBulkAction('delete')}
            onMove={() => handleBulkAction('move')}
            onClear={handleClearSelection}
          />
        )}
      </AnimatePresence>

      {/* Debug: Content sections */}
      <div className="relative">
        {loading && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10">
            <Loader2 className="h-6 w-6 text-[#001B51] animate-spin" />
          </div>
        )}

        <AnimatePresence mode="wait">
          {activeView === 'photos' && (
            <motion.div
              key="photos"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <PhotoGallerySection
                photos={photos}
                selectedIds={selectedIds}
                onSelectToggle={handleSelectToggle}
                onSelectAll={handleSelectAll}
                onRefresh={fetchData}
                projectId={projectId}
              />
            </motion.div>
          )}

          {activeView === 'documents' && (
            <motion.div
              key="documents"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <DocumentsSection
                files={files}
                selectedIds={selectedIds}
                onSelectToggle={handleSelectToggle}
                onSelectAll={handleSelectAll}
                onRefresh={fetchData}
                projectId={projectId}
              />
            </motion.div>
          )}

          {activeView === 'all' && (
            <motion.div
              key="all"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <PhotoGallerySection
                photos={photos}
                selectedIds={selectedIds}
                onSelectToggle={handleSelectToggle}
                onSelectAll={handleSelectAll}
                onRefresh={fetchData}
                projectId={projectId}
              />
              <DocumentsSection
                files={files}
                selectedIds={selectedIds}
                onSelectToggle={handleSelectToggle}
                onSelectAll={handleSelectAll}
                onRefresh={fetchData}
                projectId={projectId}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
