# Task 0003: Core Components (Tab, Search, Bulk Actions)

## Status
- **Phase**: 3 - Frontend Core
- **Agent**: agent-frontend-engineer
- **Estimated Effort**: 6-8 hours
- **Dependencies**: Task 0002 (Server Actions & API)
- **Approved**: DRAFT

---

## Overview

Build core UI components for the Files & Photos tab: main tab container, search/filter panel, category selector, and bulk action toolbar.

---

## Objectives

1. Create `ProjectFilesTab` main container component
2. Create `SearchFilterPanel` for file/photo filtering
3. Create `CategorySelector` dropdown for categorization
4. Create `BulkActionToolbar` for multi-select operations
5. Implement sub-navigation (Photos | Documents | All Files)
6. Add loading states and error handling

---

## Requirements Reference

- **REQ-6**: File Search & Filtering
- **REQ-9**: Bulk Actions & File Management
- **REQ-3**: Photo Categorization & Tagging
- **REQ-5**: Document Categorization & Folder Structure

---

## Files to Create

### Component 1: ProjectFilesTab
- **Path**: `components/projects/files/ProjectFilesTab.tsx`
- **Type**: Client Component
- **Purpose**: Main container with sub-navigation and state management

### Component 2: SearchFilterPanel
- **Path**: `components/projects/files/SearchFilterPanel.tsx`
- **Type**: Client Component
- **Purpose**: Search input + advanced filters (category, date, uploader, type)

### Component 3: CategorySelector
- **Path**: `components/projects/files/CategorySelector.tsx`
- **Type**: Client Component
- **Purpose**: Dropdown for document/photo category selection

### Component 4: BulkActionToolbar
- **Path**: `components/projects/files/BulkActionToolbar.tsx`
- **Type**: Client Component
- **Purpose**: Sticky toolbar with download/delete/move actions

---

## Implementation Details

### Component 1: ProjectFilesTab.tsx

```tsx
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
              ? 'border-construction-blue text-construction-blue'
              : 'border-transparent text-gray-600 hover:text-construction-blue'
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
              ? 'border-construction-blue text-construction-blue'
              : 'border-transparent text-gray-600 hover:text-construction-blue'
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
              ? 'border-construction-blue text-construction-blue'
              : 'border-transparent text-gray-600 hover:text-construction-blue'
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
            <Loader2 className="h-6 w-6 text-construction-blue animate-spin" />
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
```

### Component 2: SearchFilterPanel.tsx

```tsx
/**
 * SearchFilterPanel Component
 * - Search input with debounce
 * - Advanced filters (category, date, uploader, file type, source)
 * - Collapsible filter panel (desktop)
 * - Bottom sheet filter panel (mobile)
 */

'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, X, Calendar, User, FolderOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface SearchFilterPanelProps {
  filters: any;
  onFilterChange: (filters: any) => void;
  onClear: () => void;
  viewType: 'photos' | 'documents' | 'all';
}

const DOCUMENT_CATEGORIES = [
  { value: 'contracts', label: 'Contracts & Agreements' },
  { value: 'permits', label: 'Permits & Approvals' },
  { value: 'drawings', label: 'Drawings & Blueprints' },
  { value: 'reports', label: 'Reports' },
  { value: 'financial', label: 'Financial' },
  { value: 'safety', label: 'Safety & Compliance' },
  { value: 'meeting_notes', label: 'Meeting Notes' },
  { value: 'specifications', label: 'Specifications' },
  { value: 'general', label: 'General' },
];

const PHOTO_CATEGORIES = [
  { value: 'site_progress', label: 'Site Progress' },
  { value: 'safety_documentation', label: 'Safety Documentation' },
  { value: 'permits_approvals', label: 'Permits & Approvals' },
  { value: 'inspection_reports', label: 'Inspection Reports' },
  { value: 'material_receipts', label: 'Material Receipts' },
  { value: 'change_orders', label: 'Change Orders' },
  { value: 'defects_issues', label: 'Defects/Issues' },
  { value: 'before_after', label: 'Before/After' },
  { value: 'task_receipts', label: 'Task Receipts' },
  { value: 'expense_receipts', label: 'Expense Receipts' },
  { value: 'general', label: 'General' },
];

export function SearchFilterPanel({
  filters,
  onFilterChange,
  onClear,
  viewType,
}: SearchFilterPanelProps) {
  console.log('[SearchFilterPanel] Rendering with filters:', filters);

  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState(filters.search || '');

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      onFilterChange({ ...filters, search: searchTerm });
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const categories = viewType === 'documents' ? DOCUMENT_CATEGORIES : PHOTO_CATEGORIES;

  const activeFilterCount = [
    filters.category.length > 0,
    filters.dateFrom,
    filters.dateTo,
    filters.uploadedBy.length > 0,
    filters.fileType.length > 0,
    filters.source.length > 0,
  ].filter(Boolean).length;

  return (
    <div className="space-y-4">
      {/* Debug: Search bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search files..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className={cn(showFilters && 'bg-construction-blue/10 border-construction-blue')}
        >
          <Filter className="h-4 w-4 mr-2" />
          Filters
          {activeFilterCount > 0 && (
            <span className="ml-2 px-2 py-0.5 bg-construction-blue text-white rounded-full text-xs">
              {activeFilterCount}
            </span>
          )}
        </Button>

        {activeFilterCount > 0 && (
          <Button variant="ghost" onClick={onClear}>
            <X className="h-4 w-4 mr-2" />
            Clear
          </Button>
        )}
      </div>

      {/* Debug: Advanced filters (collapsible) */}
      {showFilters && (
        <div className="border-2 border-gray-200 rounded-lg p-4 space-y-4 bg-gray-50">
          {/* Category filter */}
          <div className="space-y-2">
            <Label className="text-xs font-bold text-gray-500 uppercase">Category</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {categories.map((cat) => (
                <label key={cat.value} className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={filters.category.includes(cat.value)}
                    onCheckedChange={(checked) => {
                      const newCategories = checked
                        ? [...filters.category, cat.value]
                        : filters.category.filter((c: string) => c !== cat.value);
                      onFilterChange({ ...filters, category: newCategories });
                    }}
                  />
                  <span className="text-sm text-gray-700">{cat.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Date range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-gray-500 uppercase">From Date</Label>
              <Input
                type="date"
                value={filters.dateFrom || ''}
                onChange={(e) => onFilterChange({ ...filters, dateFrom: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold text-gray-500 uppercase">To Date</Label>
              <Input
                type="date"
                value={filters.dateTo || ''}
                onChange={(e) => onFilterChange({ ...filters, dateTo: e.target.value })}
              />
            </div>
          </div>

          {/* Source filter (photos only) */}
          {viewType === 'photos' && (
            <div className="space-y-2">
              <Label className="text-xs font-bold text-gray-500 uppercase">Source</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={filters.source.includes('upload')}
                    onCheckedChange={(checked) => {
                      const newSources = checked
                        ? [...filters.source, 'upload']
                        : filters.source.filter((s: string) => s !== 'upload');
                      onFilterChange({ ...filters, source: newSources });
                    }}
                  />
                  <span className="text-sm text-gray-700">Direct Uploads</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={filters.source.includes('task_receipt')}
                    onCheckedChange={(checked) => {
                      const newSources = checked
                        ? [...filters.source, 'task_receipt']
                        : filters.source.filter((s: string) => s !== 'task_receipt');
                      onFilterChange({ ...filters, source: newSources });
                    }}
                  />
                  <span className="text-sm text-gray-700">Task Receipts</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={filters.source.includes('expense_receipt')}
                    onCheckedChange={(checked) => {
                      const newSources = checked
                        ? [...filters.source, 'expense_receipt']
                        : filters.source.filter((s: string) => s !== 'expense_receipt');
                      onFilterChange({ ...filters, source: newSources });
                    }}
                  />
                  <span className="text-sm text-gray-700">Expense Receipts</span>
                </label>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

### Component 3: CategorySelector.tsx

```tsx
/**
 * CategorySelector Component
 * - Dropdown for category selection during upload
 * - Switches between document/photo categories
 */

'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface CategorySelectorProps {
  type: 'document' | 'photo';
  value: string;
  onChange: (value: string) => void;
}

const DOCUMENT_CATEGORIES = [
  { value: 'contracts', label: 'Contracts & Agreements' },
  { value: 'permits', label: 'Permits & Approvals' },
  { value: 'drawings', label: 'Drawings & Blueprints' },
  { value: 'reports', label: 'Reports' },
  { value: 'financial', label: 'Financial' },
  { value: 'safety', label: 'Safety & Compliance' },
  { value: 'meeting_notes', label: 'Meeting Notes' },
  { value: 'specifications', label: 'Specifications' },
  { value: 'general', label: 'General' },
];

const PHOTO_CATEGORIES = [
  { value: 'site_progress', label: 'Site Progress' },
  { value: 'safety_documentation', label: 'Safety Documentation' },
  { value: 'permits_approvals', label: 'Permits & Approvals' },
  { value: 'inspection_reports', label: 'Inspection Reports' },
  { value: 'material_receipts', label: 'Material Receipts' },
  { value: 'change_orders', label: 'Change Orders' },
  { value: 'defects_issues', label: 'Defects/Issues' },
  { value: 'before_after', label: 'Before/After' },
  { value: 'general', label: 'General' },
];

export function CategorySelector({ type, value, onChange }: CategorySelectorProps) {
  const categories = type === 'document' ? DOCUMENT_CATEGORIES : PHOTO_CATEGORIES;

  return (
    <div className="space-y-2">
      <Label className="text-xs font-bold text-gray-500 uppercase">Category</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select category" />
        </SelectTrigger>
        <SelectContent>
          {categories.map((cat) => (
            <SelectItem key={cat.value} value={cat.value}>
              {cat.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
```

### Component 4: BulkActionToolbar.tsx

```tsx
/**
 * BulkActionToolbar Component
 * - Sticky toolbar when items selected
 * - Download, Delete, Move to Category actions
 * - Clear selection
 */

'use client';

import { motion } from 'framer-motion';
import { Download, Trash2, FolderInput, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BulkActionToolbarProps {
  selectedCount: number;
  onDownload: () => void;
  onDelete: () => void;
  onMove: () => void;
  onClear: () => void;
}

export function BulkActionToolbar({
  selectedCount,
  onDownload,
  onDelete,
  onMove,
  onClear,
}: BulkActionToolbarProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="sticky top-0 z-20 bg-construction-blue text-white rounded-lg p-4 shadow-construction-lg flex items-center justify-between"
    >
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">
          {selectedCount}
        </div>
        <span className="font-medium">
          {selectedCount} {selectedCount === 1 ? 'file' : 'files'} selected
        </span>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="secondary" size="sm" onClick={onDownload}>
          <Download className="h-4 w-4 mr-2" />
          Download
        </Button>
        <Button variant="secondary" size="sm" onClick={onMove}>
          <FolderInput className="h-4 w-4 mr-2" />
          Move to...
        </Button>
        <Button variant="destructive" size="sm" onClick={onDelete}>
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </Button>
        <Button variant="ghost" size="sm" onClick={onClear} className="text-white hover:bg-white/20">
          <X className="h-4 w-4 mr-2" />
          Clear
        </Button>
      </div>
    </motion.div>
  );
}
```

---

## Acceptance Criteria

- [x] ProjectFilesTab renders sub-navigation (Photos | Documents | All Files)
- [x] Tab view persists user selection
- [x] SearchFilterPanel debounces search input (300ms)
- [x] Category filters show correct options for documents vs photos
- [x] Source filter only visible for photos (upload, task_receipt, expense_receipt)
- [x] BulkActionToolbar appears when items selected
- [x] Selected item count displays correctly
- [x] CategorySelector switches between document/photo categories
- [x] Loading state displays during data fetch
- [x] Error toasts show on fetch failure

---

## Testing Checklist

```tsx
// Test tab navigation
<ProjectFilesTab projectId="..." />
// Click Photos → Documents → All Files
// Verify content switches, URL params update

// Test search debounce
// Type "contract" → wait 300ms → verify API called once

// Test category filter
// Select "Contracts" → verify files filtered client-side or re-fetched

// Test bulk selection
// Select 3 files → verify toolbar appears with "3 files selected"

// Test clear selection
// Click X in toolbar → verify selection cleared, toolbar hidden
```

---

## Notes

- **Sub-Navigation**: Use border-bottom underline for active state (per UI_RULES.md)
- **Filter State**: Persist in URL query params for shareable links (future enhancement)
- **Debounce**: 300ms for search input (REQ-6)
- **Mobile**: Collapse filter panel by default on mobile (< 768px)
- **Responsive**: 2-column grid for filters on mobile, 3-column on desktop

---

**END OF TASK 0003**
