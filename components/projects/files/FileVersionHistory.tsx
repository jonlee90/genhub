/**
 * FileVersionHistory Component
 * - Lists all versions for a file
 * - Download any version
 * - Restore version button (placeholder)
 * - Uses getFileVersionHistory from server action
 */

'use client';

import { useState, useEffect } from 'react';
import { Download, RotateCcw, Loader2, Clock, FileText, CheckCircle2 } from 'lucide-react';
import { BaseModal } from '@/components/ui/BaseModal';
import { Button } from '@/components/ui/button';
import { getFileVersionHistory } from '@/app/actions/project-files';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface FileVersionHistoryProps {
  fileId: string;
  filename?: string;
  onClose: () => void;
}

interface FileVersion {
  id: string;
  filename: string;
  file_url: string;
  file_size: number;
  version_number: number;
  created_at: string;
  category?: string;
  client_visible?: boolean | null;
  company_id?: string;
  uploader?: { id?: string; name?: string; avatar_url?: string } | null;
}

/**
 * Format file size for display
 */
function formatFileSize(bytes: number): string {
  if (!bytes || bytes === 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Format date for display with time
 * Note: Local function includes time formatting - differs from shared utils formatDate
 */
function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return 'Unknown date';
  }
}

export function FileVersionHistory({ fileId, filename, onClose }: FileVersionHistoryProps) {
  console.log('[FileVersionHistory] Rendering for file:', fileId);

  const [loading, setLoading] = useState(true);
  const [versions, setVersions] = useState<FileVersion[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchVersionHistory();
  }, [fileId]);

  const fetchVersionHistory = async () => {
    console.log('[FileVersionHistory] Fetching version history');
    setLoading(true);
    setError(null);

    try {
      const result = await getFileVersionHistory(fileId);

      if (result.error) {
        console.error('[FileVersionHistory] Error:', result.error);
        setError(result.error);
        toast.error(`Failed to load version history: ${result.error}`);
      } else {
        console.log('[FileVersionHistory] Loaded versions:', result.data?.length);
        // Cast to FileVersion[] since the server returns a compatible shape
        setVersions((result.data || []) as FileVersion[]);
      }
    } catch (err) {
      console.error('[FileVersionHistory] Fetch error:', err);
      setError('Failed to load version history');
      toast.error('Failed to load version history');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (version: FileVersion) => {
    console.log('[FileVersionHistory] Downloading version:', version.version_number);
    window.open(version.file_url, '_blank');
  };

  const handleRestore = (version: FileVersion) => {
    console.log('[FileVersionHistory] Restore requested for version:', version.version_number);
    toast.info('Version restore coming soon', {
      description: `Restoring to v${version.version_number} will be available in a future update.`,
    });
  };

  return (
    <BaseModal
      isOpen={true}
      onClose={onClose}
      title="Version History"
      subtitle={filename || 'Document versions'}
      icon={Clock}
      maxWidth="lg"
    >
      <div className="space-y-3">
        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 text-[#001B51] animate-spin" />
              <p className="text-sm text-gray-500">Loading version history...</p>
            </div>
          </div>
        )}

        {/* Error state */}
        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="p-3 bg-red-100 rounded-full mb-3">
              <FileText className="h-6 w-6 text-red-600" />
            </div>
            <p className="text-sm text-red-600 font-medium mb-2">{error}</p>
            <Button variant="outline" onClick={fetchVersionHistory} size="sm">
              Try Again
            </Button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && versions.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="p-3 bg-gray-100 rounded-full mb-3">
              <Clock className="h-6 w-6 text-gray-400" />
            </div>
            <p className="text-sm text-gray-600 font-medium">No version history</p>
            <p className="text-xs text-gray-500 mt-1">This is the only version of this file</p>
          </div>
        )}

        {/* Version list */}
        {!loading && !error && versions.length > 0 && (
          <div className="space-y-2">
            {versions.map((version, index) => {
              const isCurrent = index === 0;

              return (
                <motion.div
                  key={version.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={cn(
                    'border-2 rounded-lg p-4 transition-all duration-200',
                    isCurrent
                      ? 'border-[#001B51]/30 bg-[#001B51]/5'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    {/* Version info */}
                    <div className="flex-1 min-w-0">
                      {/* Version badges */}
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span
                          className={cn(
                            'inline-flex items-center px-2 py-1 rounded text-xs font-bold',
                            isCurrent
                              ? 'bg-[#001B51] text-white'
                              : 'bg-gray-200 text-gray-700'
                          )}
                        >
                          v{version.version_number}
                        </span>
                        {isCurrent && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-bold">
                            <CheckCircle2 className="h-3 w-3" />
                            CURRENT
                          </span>
                        )}
                      </div>

                      {/* Filename */}
                      <p className="text-sm font-medium text-gray-900 truncate mb-1">
                        {version.filename}
                      </p>

                      {/* Metadata */}
                      <div className="flex items-center gap-2 text-xs text-gray-500 flex-wrap">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(version.created_at)}
                        </span>
                        {version.uploader?.name && (
                          <>
                            <span className="text-gray-300">|</span>
                            <span>{version.uploader.name}</span>
                          </>
                        )}
                        <span className="text-gray-300">|</span>
                        <span>{formatFileSize(version.file_size)}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {/* Download button */}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownload(version)}
                        className="h-8 px-3"
                        title="Download this version"
                      >
                        <Download className="h-4 w-4" />
                      </Button>

                      {/* Restore button - only for older versions */}
                      {!isCurrent && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleRestore(version)}
                          className="h-8 px-3 bg-[#3C3C3C] hover:bg-[#4C4C4C] text-white"
                          title="Restore this version"
                        >
                          <RotateCcw className="h-4 w-4 mr-1" />
                          Restore
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Footer info */}
        {!loading && !error && versions.length > 1 && (
          <div className="pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              {versions.length} version{versions.length !== 1 ? 's' : ''} available.
              Restoring a version will create a new version with that content.
            </p>
          </div>
        )}
      </div>
    </BaseModal>
  );
}
