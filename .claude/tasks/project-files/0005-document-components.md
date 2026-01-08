# Task 0005: Document Components (List, Uploader, Preview, Versioning)

## Status
- **Phase**: 5 - Frontend Documents
- **Agent**: agent-frontend-engineer
- **Estimated Effort**: 4-5 hours
- **Dependencies**: Task 0003 (Core Components)
- **Approved**: DRAFT

---

## Overview

Build document-specific UI components: category-based list with accordion, batch file uploader, file preview modal, and version history display.

---

## Objectives

1. Create `DocumentsSection` with category accordion organization
2. Create `DocumentCategoryList` for collapsible category sections
3. Create `ProjectFileUploader` for batch document upload
4. Create `FilePreviewModal` for PDF/document preview
5. Create `FileVersionHistory` modal for version tracking
6. Implement file type icons and download actions

---

## Requirements Reference

- **REQ-4**: Document Upload with File Type Validation
- **REQ-5**: Document Categorization & Folder Structure
- **REQ-7**: File Preview & Download
- **REQ-8**: File Versioning & Audit Trail
- **REQ-9**: Bulk Actions & File Management

---

## Files to Create

### Component 1: DocumentsSection
- **Path**: `components/projects/files/DocumentsSection.tsx`
- **Type**: Client Component
- **Purpose**: Main document list with category organization

### Component 2: DocumentCategoryList
- **Path**: `components/projects/files/DocumentCategoryList.tsx`
- **Type**: Client Component
- **Purpose**: Collapsible accordion section for each category

### Component 3: ProjectFileUploader
- **Path**: `components/projects/files/ProjectFileUploader.tsx`
- **Type**: Client Component
- **Purpose**: Batch file upload with category selection

### Component 4: FilePreviewModal
- **Path**: `components/projects/files/FilePreviewModal.tsx`
- **Type**: Client Component
- **Purpose**: PDF preview, file details, download/delete actions

### Component 5: FileVersionHistory
- **Path**: `components/projects/files/FileVersionHistory.tsx`
- **Type**: Client Component
- **Purpose**: Version history modal with rollback support

---

## Implementation Details

### Existing Pattern Reference

**Reuse from**: `components/projects/spatial/FileUploader.tsx`
- Batch upload queue logic
- Individual progress bars per file
- Concurrent upload limit (3 files)
- File type validation

### Component 1: DocumentsSection.tsx

```tsx
/**
 * DocumentsSection Component
 * - Groups files by category
 * - Collapsible category sections
 * - Empty state with upload CTA
 * - Checkbox selection for bulk actions
 */

'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Upload, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { BaseModal } from '@/components/ui/modal';
import { DocumentCategoryList } from './DocumentCategoryList';
import { ProjectFileUploader } from './ProjectFileUploader';

interface DocumentsSectionProps {
  files: any[];
  selectedIds: Set<string>;
  onSelectToggle: (id: string) => void;
  onSelectAll: () => void;
  onRefresh: () => void;
  projectId: string;
}

const CATEGORIES = [
  { key: 'contracts', label: 'Contracts & Agreements' },
  { key: 'permits', label: 'Permits & Approvals' },
  { key: 'drawings', label: 'Drawings & Blueprints' },
  { key: 'reports', label: 'Reports' },
  { key: 'financial', label: 'Financial' },
  { key: 'safety', label: 'Safety & Compliance' },
  { key: 'meeting_notes', label: 'Meeting Notes' },
  { key: 'specifications', label: 'Specifications' },
  { key: 'general', label: 'General' },
];

export function DocumentsSection({
  files,
  selectedIds,
  onSelectToggle,
  onSelectAll,
  onRefresh,
  projectId,
}: DocumentsSectionProps) {
  console.log('[DocumentsSection] Rendering with files:', files.length);

  const [showUploader, setShowUploader] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['contracts', 'permits', 'drawings']) // Default expanded
  );

  // Group files by category
  const filesByCategory = files.reduce((acc, file) => {
    const category = file.category || 'general';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(file);
    return acc;
  }, {} as Record<string, any[]>);

  // Empty state
  if (files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
        <div className="p-4 bg-construction-blue/10 rounded-full mb-4">
          <FileText className="h-12 w-12 text-construction-blue" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">No Documents Yet</h3>
        <p className="text-sm text-gray-500 mb-6 text-center max-w-sm">
          Upload contracts, permits, drawings, and other project documents to keep everything
          organized in one place.
        </p>
        <Button onClick={() => setShowUploader(true)} className="bg-construction-blue">
          <Upload className="h-4 w-4 mr-2" />
          Upload Documents
        </Button>

        {/* Uploader modal */}
        <BaseModal
          isOpen={showUploader}
          onClose={() => setShowUploader(false)}
          title="Upload Documents"
        >
          <ProjectFileUploader
            projectId={projectId}
            onComplete={() => {
              setShowUploader(false);
              onRefresh();
            }}
            onCancel={() => setShowUploader(false)}
          />
        </BaseModal>
      </div>
    );
  }

  const toggleCategory = (categoryKey: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryKey)) {
      newExpanded.delete(categoryKey);
    } else {
      newExpanded.add(categoryKey);
    }
    setExpandedCategories(newExpanded);
  };

  return (
    <div className="space-y-4">
      {/* Header with select all and upload */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Checkbox
            checked={selectedIds.size === files.length}
            onCheckedChange={onSelectAll}
            id="select-all-files"
          />
          <label htmlFor="select-all-files" className="text-sm text-gray-600 cursor-pointer">
            Showing {files.length} {files.length === 1 ? 'document' : 'documents'}
          </label>
        </div>

        <Button onClick={() => setShowUploader(true)} className="bg-construction-blue">
          <Upload className="h-4 w-4 mr-2" />
          Upload Documents
        </Button>
      </div>

      {/* Category sections */}
      <div className="space-y-2">
        {CATEGORIES.map((category) => {
          const categoryFiles = filesByCategory[category.key] || [];
          if (categoryFiles.length === 0) return null;

          return (
            <DocumentCategoryList
              key={category.key}
              category={category}
              files={categoryFiles}
              isExpanded={expandedCategories.has(category.key)}
              onToggle={() => toggleCategory(category.key)}
              selectedIds={selectedIds}
              onSelectToggle={onSelectToggle}
              onRefresh={onRefresh}
            />
          );
        })}
      </div>

      {/* Uploader modal */}
      <BaseModal
        isOpen={showUploader}
        onClose={() => setShowUploader(false)}
        title="Upload Documents"
      >
        <ProjectFileUploader
          projectId={projectId}
          onComplete={() => {
            setShowUploader(false);
            onRefresh();
          }}
          onCancel={() => setShowUploader(false)}
        />
      </BaseModal>
    </div>
  );
}
```

### Component 2: DocumentCategoryList.tsx

```tsx
/**
 * DocumentCategoryList Component
 * - Collapsible accordion section for category
 * - File list with icons, metadata, actions
 * - Checkbox selection
 */

'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, FileText, File, Image, Archive, Download, Trash2, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { FilePreviewModal } from './FilePreviewModal';
import { FileVersionHistory } from './FileVersionHistory';

interface DocumentCategoryListProps {
  category: { key: string; label: string };
  files: any[];
  isExpanded: boolean;
  onToggle: () => void;
  selectedIds: Set<string>;
  onSelectToggle: (id: string) => void;
  onRefresh: () => void;
}

function getFileIcon(fileType: string) {
  if (fileType.startsWith('image/')) return Image;
  if (fileType === 'application/pdf') return FileText;
  if (fileType.includes('zip') || fileType.includes('archive')) return Archive;
  return File;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocumentCategoryList({
  category,
  files,
  isExpanded,
  onToggle,
  selectedIds,
  onSelectToggle,
  onRefresh,
}: DocumentCategoryListProps) {
  const [previewFile, setPreviewFile] = useState<any | null>(null);
  const [versionHistoryFile, setVersionHistoryFile] = useState<any | null>(null);

  return (
    <div className="border-2 border-gray-200 rounded-lg overflow-hidden">
      {/* Category header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-3">
          {isExpanded ? (
            <ChevronDown className="h-5 w-5 text-gray-500" />
          ) : (
            <ChevronUp className="h-5 w-5 text-gray-500" />
          )}
          <h3 className="text-sm font-bold text-gray-900 uppercase">{category.label}</h3>
          <span className="px-2 py-0.5 bg-gray-200 rounded-full text-xs text-gray-600">
            {files.length} {files.length === 1 ? 'file' : 'files'}
          </span>
        </div>
      </button>

      {/* File list */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="divide-y divide-gray-200">
              {files.map((file) => {
                const FileIcon = getFileIcon(file.file_type);

                return (
                  <div
                    key={file.id}
                    className={cn(
                      'flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors',
                      selectedIds.has(file.id) && 'bg-construction-blue/5'
                    )}
                  >
                    {/* Selection checkbox */}
                    <Checkbox
                      checked={selectedIds.has(file.id)}
                      onCheckedChange={() => onSelectToggle(file.id)}
                    />

                    {/* File icon */}
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <FileIcon className="h-5 w-5 text-gray-600" />
                    </div>

                    {/* File metadata */}
                    <div className="flex-1 min-w-0">
                      <button
                        onClick={() => setPreviewFile(file)}
                        className="text-sm font-medium text-gray-900 hover:text-construction-blue transition-colors truncate block w-full text-left"
                      >
                        {file.filename}
                      </button>
                      <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                        <span>{formatFileSize(file.file_size)}</span>
                        <span>•</span>
                        <span>
                          {new Date(file.created_at).toLocaleDateString()} by{' '}
                          {file.uploader?.name || 'Unknown'}
                        </span>
                        {file.version_number > 1 && (
                          <>
                            <span>•</span>
                            <button
                              onClick={() => setVersionHistoryFile(file)}
                              className="flex items-center gap-1 text-construction-blue hover:underline"
                            >
                              <History className="h-3 w-3" />
                              v{file.version_number}
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          // Download file
                          window.open(file.file_url, '_blank');
                        }}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={async () => {
                          // Delete file (to be implemented)
                          console.log('Delete file:', file.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Preview modal */}
      {previewFile && (
        <FilePreviewModal
          file={previewFile}
          onClose={() => setPreviewFile(null)}
          onDelete={(fileId) => {
            setPreviewFile(null);
            onRefresh();
          }}
        />
      )}

      {/* Version history modal */}
      {versionHistoryFile && (
        <FileVersionHistory
          fileId={versionHistoryFile.id}
          onClose={() => setVersionHistoryFile(null)}
        />
      )}
    </div>
  );
}
```

### Component 3: ProjectFileUploader.tsx

```tsx
/**
 * ProjectFileUploader Component
 * - Batch upload (multiple files at once)
 * - Category selection dropdown
 * - Client-visible checkbox
 * - Individual progress bars per file
 * - Concurrent upload limit (3 files)
 */

'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, Loader2, AlertCircle, CheckCircle, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { CategorySelector } from './CategorySelector';
import { toast } from 'sonner';

interface ProjectFileUploaderProps {
  projectId: string;
  category?: string;
  onComplete: () => void;
  onCancel?: () => void;
}

interface FileQueueItem {
  file: File;
  id: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
}

export function ProjectFileUploader({
  projectId,
  category: defaultCategory,
  onComplete,
  onCancel,
}: ProjectFileUploaderProps) {
  console.log('[ProjectFileUploader] Rendering for project:', projectId);

  const [queue, setQueue] = useState<FileQueueItem[]>([]);
  const [category, setCategory] = useState(defaultCategory || 'general');
  const [clientVisible, setClientVisible] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFilesSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newItems: FileQueueItem[] = Array.from(files).map((file) => ({
      file,
      id: `${file.name}-${Date.now()}-${Math.random()}`,
      status: 'pending',
      progress: 0,
    }));

    setQueue((prev) => [...prev, ...newItems]);
    console.log('[ProjectFileUploader] Added files to queue:', newItems.length);

    // Start uploading
    uploadQueue([...queue, ...newItems]);
  };

  const uploadQueue = async (items: FileQueueItem[]) => {
    const pending = items.filter((item) => item.status === 'pending');
    const uploading = items.filter((item) => item.status === 'uploading');

    // Max 3 concurrent uploads
    const available = 3 - uploading.length;
    const toUpload = pending.slice(0, available);

    for (const item of toUpload) {
      uploadFile(item);
    }
  };

  const uploadFile = async (item: FileQueueItem) => {
    console.log('[ProjectFileUploader] Uploading file:', item.file.name);

    // Update status to uploading
    setQueue((prev) =>
      prev.map((qi) => (qi.id === item.id ? { ...qi, status: 'uploading' as const } : qi))
    );

    try {
      // Validate file size (50MB max)
      if (item.file.size > 50 * 1024 * 1024) {
        throw new Error('File too large (max 50MB)');
      }

      const formData = new FormData();
      formData.append('file', item.file);
      formData.append('projectId', projectId);
      formData.append('category', category);
      formData.append('clientVisible', clientVisible.toString());

      // Simulate progress
      const progressInterval = setInterval(() => {
        setQueue((prev) =>
          prev.map((qi) =>
            qi.id === item.id ? { ...qi, progress: Math.min(qi.progress + 10, 90) } : qi
          )
        );
      }, 200);

      const response = await fetch('/api/project-files/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      // Success
      setQueue((prev) =>
        prev.map((qi) =>
          qi.id === item.id ? { ...qi, status: 'success' as const, progress: 100 } : qi
        )
      );

      console.log('[ProjectFileUploader] Upload success:', item.file.name);
    } catch (err) {
      console.error('[ProjectFileUploader] Upload error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';

      setQueue((prev) =>
        prev.map((qi) =>
          qi.id === item.id
            ? { ...qi, status: 'error' as const, progress: 0, error: errorMessage }
            : qi
        )
      );
    }

    // Check if all done
    setQueue((prev) => {
      const allDone = prev.every((qi) => qi.status === 'success' || qi.status === 'error');
      if (allDone) {
        const successCount = prev.filter((qi) => qi.status === 'success').length;
        const errorCount = prev.filter((qi) => qi.status === 'error').length;

        if (errorCount === 0) {
          toast.success(`${successCount} files uploaded successfully`);
          setTimeout(() => onComplete(), 1000);
        } else {
          toast.error(`${errorCount} files failed to upload`);
        }
      }

      return prev;
    });

    // Continue uploading pending items
    uploadQueue(queue);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleFilesSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div className="space-y-4">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.dwg,.dxf,.svg,image/*,.zip,.rar,.7z"
        onChange={(e) => handleFilesSelect(e.target.files)}
        className="hidden"
      />

      {/* Category selector */}
      {queue.length === 0 && (
        <CategorySelector type="document" value={category} onChange={setCategory} />
      )}

      {/* Client visible checkbox */}
      {queue.length === 0 && (
        <div className="flex items-center gap-2">
          <Checkbox
            id="client-visible"
            checked={clientVisible}
            onCheckedChange={(checked) => setClientVisible(checked as boolean)}
          />
          <label htmlFor="client-visible" className="text-sm text-gray-700 cursor-pointer">
            Visible to client in portal
          </label>
        </div>
      )}

      {/* Upload queue */}
      <AnimatePresence>
        {queue.length > 0 && (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {queue.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="border-2 border-gray-200 rounded-lg p-3"
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-gray-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{item.file.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                        <motion.div
                          className={cn(
                            'h-full',
                            item.status === 'success'
                              ? 'bg-green-500'
                              : item.status === 'error'
                              ? 'bg-red-500'
                              : 'bg-construction-blue'
                          )}
                          initial={{ width: 0 }}
                          animate={{ width: `${item.progress}%` }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 w-12 text-right">
                        {item.status === 'success'
                          ? 'Done'
                          : item.status === 'error'
                          ? 'Error'
                          : `${item.progress}%`}
                      </span>
                    </div>
                    {item.error && (
                      <p className="text-xs text-red-600 mt-1">{item.error}</p>
                    )}
                  </div>
                  {item.status === 'success' && (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  )}
                  {item.status === 'error' && <AlertCircle className="h-5 w-5 text-red-500" />}
                  {item.status === 'uploading' && (
                    <Loader2 className="h-5 w-5 text-construction-blue animate-spin" />
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Upload zone */}
      {queue.length === 0 && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className={cn(
            'border-2 border-dashed border-gray-300 rounded-lg p-8',
            'hover:border-construction-blue hover:bg-gray-50 transition-colors',
            'cursor-pointer'
          )}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="flex flex-col items-center gap-4">
            <div className="p-3 bg-construction-blue/10 rounded-full">
              <Upload className="h-8 w-8 text-construction-blue" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-900 mb-1">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-gray-500">
                PDF, Word, Excel, CAD, Images, Archives • Max 50MB per file
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Cancel button */}
      {onCancel && queue.length === 0 && (
        <Button variant="outline" onClick={onCancel} className="w-full">
          Cancel
        </Button>
      )}
    </div>
  );
}
```

### Component 4: FilePreviewModal.tsx

```tsx
/**
 * FilePreviewModal Component
 * - PDF preview (iframe)
 * - File details (size, date, uploader, category)
 * - Download button
 * - Delete button
 */

'use client';

import { Download, Trash2, X, FileText } from 'lucide-react';
import { BaseModal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { deleteProjectFile } from '@/app/actions/project-files';
import { toast } from 'sonner';

interface FilePreviewModalProps {
  file: any;
  onClose: () => void;
  onDelete: (fileId: string) => void;
}

export function FilePreviewModal({ file, onClose, onDelete }: FilePreviewModalProps) {
  console.log('[FilePreviewModal] Rendering file:', file.id);

  const isPDF = file.file_type === 'application/pdf';
  const isImage = file.file_type.startsWith('image/');

  const handleDelete = async () => {
    if (!confirm('Delete this file? This cannot be undone.')) {
      return;
    }

    console.log('[FilePreviewModal] Deleting file:', file.id);
    const result = await deleteProjectFile(file.id);

    if (result.error) {
      toast.error(`Delete failed: ${result.error}`);
    } else {
      toast.success('File deleted');
      onDelete(file.id);
    }
  };

  return (
    <BaseModal isOpen={true} onClose={onClose} title={file.filename}>
      <div className="space-y-4">
        {/* Preview */}
        {isPDF && (
          <iframe
            src={file.file_url}
            className="w-full h-96 border-2 border-gray-200 rounded-lg"
            title={file.filename}
          />
        )}

        {isImage && (
          <img
            src={file.file_url}
            alt={file.filename}
            className="w-full h-auto max-h-96 object-contain border-2 border-gray-200 rounded-lg"
          />
        )}

        {!isPDF && !isImage && (
          <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg">
            <FileText className="h-16 w-16 text-gray-400 mb-4" />
            <p className="text-sm text-gray-600 mb-2">Preview not available</p>
            <p className="text-xs text-gray-500">Click download to view this file</p>
          </div>
        )}

        {/* File details */}
        <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg text-sm">
          <div>
            <p className="text-xs text-gray-500 uppercase font-bold mb-1">Category</p>
            <p className="text-gray-900">{file.category}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-bold mb-1">Size</p>
            <p className="text-gray-900">
              {(file.file_size / (1024 * 1024)).toFixed(2)} MB
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-bold mb-1">Uploaded By</p>
            <p className="text-gray-900">{file.uploader?.name || 'Unknown'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-bold mb-1">Date</p>
            <p className="text-gray-900">
              {new Date(file.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            onClick={() => window.open(file.file_url, '_blank')}
            className="flex-1 bg-construction-blue"
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>
    </BaseModal>
  );
}
```

### Component 5: FileVersionHistory.tsx

```tsx
/**
 * FileVersionHistory Component
 * - List of all versions for a file
 * - Download any version
 * - Restore older version (sets as current)
 */

'use client';

import { useState, useEffect } from 'react';
import { Download, RotateCcw, Loader2, Clock } from 'lucide-react';
import { BaseModal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { getFileVersionHistory } from '@/app/actions/project-files';
import { toast } from 'sonner';

interface FileVersionHistoryProps {
  fileId: string;
  onClose: () => void;
}

export function FileVersionHistory({ fileId, onClose }: FileVersionHistoryProps) {
  console.log('[FileVersionHistory] Rendering for file:', fileId);

  const [loading, setLoading] = useState(true);
  const [versions, setVersions] = useState<any[]>([]);

  useEffect(() => {
    fetchVersions();
  }, [fileId]);

  const fetchVersions = async () => {
    setLoading(true);
    const result = await getFileVersionHistory(fileId);

    if (result.error) {
      toast.error(`Failed to load version history: ${result.error}`);
      onClose();
    } else {
      setVersions(result.data || []);
    }

    setLoading(false);
  };

  return (
    <BaseModal isOpen={true} onClose={onClose} title="Version History">
      <div className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 text-construction-blue animate-spin" />
          </div>
        ) : (
          versions.map((version, index) => (
            <div
              key={version.id}
              className="border-2 border-gray-200 rounded-lg p-4 hover:border-construction-blue transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-1 bg-construction-blue/10 text-construction-blue text-xs font-bold rounded">
                      v{version.version_number}
                    </span>
                    {index === 0 && (
                      <span className="px-2 py-1 bg-green-500/10 text-green-700 text-xs font-bold rounded">
                        CURRENT
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-gray-900">{version.filename}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                    <Clock className="h-3 w-3" />
                    <span>
                      {new Date(version.created_at).toLocaleString()} by{' '}
                      {version.uploader?.name || 'Unknown'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {(version.file_size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(version.file_url, '_blank')}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  {index !== 0 && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        // Restore version (to be implemented)
                        console.log('Restore version:', version.id);
                        toast.info('Restore version feature coming soon');
                      }}
                    >
                      <RotateCcw className="h-4 w-4 mr-1" />
                      Restore
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </BaseModal>
  );
}
```

---

## Acceptance Criteria

- [x] DocumentsSection groups files by category
- [x] Category sections are collapsible (accordion pattern)
- [x] Empty state shows upload CTA
- [x] DocumentCategoryList displays file icon based on type
- [x] File metadata shows size, date, uploader
- [x] Version badge visible for files with version_number > 1
- [x] ProjectFileUploader supports batch upload (multiple files)
- [x] Concurrent upload limit of 3 files enforced
- [x] Individual progress bars per file in queue
- [x] FilePreviewModal shows PDF preview (iframe)
- [x] Image preview works for image files
- [x] Non-previewable files show download CTA
- [x] FileVersionHistory lists all versions
- [x] Download button works for any version
- [x] Restore version button available (placeholder)

---

## Testing Checklist

```tsx
// Test category accordion
<DocumentsSection files={mockFiles} ... />
// Click category header → verify expands/collapses

// Test batch upload
// Select 5 files → verify queue shows all 5
// Verify only 3 upload concurrently

// Test PDF preview
// Click PDF file → verify iframe preview loads

// Test version history
// Upload file with same name (v2) → click version badge → verify history modal

// Test file type icons
// Upload PDF, Word, Excel, Image → verify correct icons shown
```

---

## Notes

- **Category Organization**: Follow construction industry standards (REQ-5)
- **Batch Upload**: Max 3 concurrent uploads (per design constraint)
- **PDF Preview**: Use iframe with `src={file_url}` (REQ-7)
- **Version Tracking**: Use `parent_file_id` chain (REQ-8)
- **File Icons**: Lucide icons only (PDF=FileText, Image=Image, Archive=Archive, Default=File)

---

## References

- **Existing Pattern**: `components/projects/spatial/FileUploader.tsx`
- **Design Document**: `.claude/docs/design/project-files-upload.md`
- **UI Rules**: `.claude/docs/law/UI_RULES.md`

---

**END OF TASK 0005**
