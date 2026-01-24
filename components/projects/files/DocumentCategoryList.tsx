/**
 * DocumentCategoryList Component
 * - Collapsible accordion section for each category
 * - File list with icons, metadata, actions
 * - Checkbox selection per file
 * - Version badge for files with version_number > 1
 */

"use client";

import { useState, useCallback } from "react";
import { m as motion, AnimatePresence } from "framer-motion";
// Performance optimization: Direct imports instead of barrel file (saves 200-800ms per page)
import ChevronDown from "lucide-react/icons/chevron-down";
import ChevronRight from "lucide-react/icons/chevron-right";
import FileText from "lucide-react/icons/file-text";
import File from "lucide-react/icons/file";
import Image from "lucide-react/icons/image";
import Archive from "lucide-react/icons/archive";
import Download from "lucide-react/icons/download";
import Trash2 from "lucide-react/icons/trash-2";
import History from "lucide-react/icons/history";
import Eye from "lucide-react/icons/eye";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn, formatDate } from "@/lib/utils";
import { FilePreviewModal } from "./FilePreviewModal";
import { FileVersionHistory } from "./FileVersionHistory";
import { deleteProjectFile } from "@/app/actions/project-files";
import { toast } from "sonner";

interface DocumentCategoryListProps {
  category: { key: string; label: string; icon?: string };
  files: any[];
  isExpanded: boolean;
  onToggle: () => void;
  selectedIds: Set<string>;
  onSelectToggle: (id: string) => void;
  onRefresh: () => void;
}

/**
 * Get appropriate icon based on file MIME type
 */
function getFileIcon(fileType: string) {
  if (fileType?.startsWith("image/")) return Image;
  if (fileType === "application/pdf") return FileText;
  if (
    fileType?.includes("zip") ||
    fileType?.includes("rar") ||
    fileType?.includes("7z") ||
    fileType?.includes("archive")
  ) {
    return Archive;
  }
  return File;
}

/**
 * Format file size for display
 */
function formatFileSize(bytes: number): string {
  if (!bytes || bytes === 0) return "0 B";
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
  console.log(
    "[DocumentCategoryList] Rendering category:",
    category.key,
    "files:",
    files.length,
  );

  const [previewFile, setPreviewFile] = useState<any | null>(null);
  const [versionHistoryFile, setVersionHistoryFile] = useState<any | null>(
    null,
  );
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Performance optimization: Memoize event handlers to prevent recreation on every render
  const handleDelete = useCallback(
    async (file: any, e: React.MouseEvent) => {
      e.stopPropagation();

      if (!confirm(`Delete "${file.filename}"? This cannot be undone.`)) {
        return;
      }

      console.log("[DocumentCategoryList] Deleting file:", file.id);
      setDeletingId(file.id);

      try {
        const result = await deleteProjectFile(file.id);
        if (result.error) {
          toast.error(`Failed to delete: ${result.error}`);
        } else {
          toast.success("File deleted");
          onRefresh();
        }
      } catch (err) {
        console.error("[DocumentCategoryList] Delete error:", err);
        toast.error("Failed to delete file");
      } finally {
        setDeletingId(null);
      }
    },
    [onRefresh],
  );

  const handleDownload = useCallback((file: any, e: React.MouseEvent) => {
    e.stopPropagation();
    console.log("[DocumentCategoryList] Downloading file:", file.id);
    window.open(file.file_url, "_blank");
  }, []);

  return (
    <div className="border-2 border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-900 shadow-sm">
      {/* Category header - clickable accordion toggle */}
      <button
        onClick={onToggle}
        className={cn(
          "w-full flex items-center justify-between p-4",
          "bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900",
          "hover:from-gray-100 hover:to-gray-50 dark:hover:from-gray-700 dark:hover:to-gray-800",
          "transition-colors duration-200",
          "focus:outline-none focus:ring-2 focus:ring-[var(--construction-blue)]/20 focus:ring-inset",
        )}
        aria-expanded={isExpanded}
        aria-controls={`category-${category.key}-content`}
      >
        <div className="flex items-center gap-3">
          {/* Expand/collapse chevron */}
          <div className="text-gray-400">
            {isExpanded ? (
              <ChevronDown className="h-5 w-5" />
            ) : (
              <ChevronRight className="h-5 w-5" />
            )}
          </div>

          {/* Category label */}
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wide">
            {category.label}
          </h3>

          {/* File count badge */}
          <span className="px-2 py-0.5 bg-construction-blue/10 text-construction-blue rounded-full text-xs font-bold">
            {files.length}
          </span>
        </div>

        {/* Total size indicator */}
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {formatFileSize(
            files.reduce((sum, f) => sum + (f.file_size || 0), 0),
          )}
        </span>
      </button>

      {/* File list with animation */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            id={`category-${category.key}-content`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="divide-y divide-gray-100 dark:divide-gray-800 border-t border-gray-200 dark:border-gray-700">
              {files.map((file) => {
                const FileIcon = getFileIcon(file.file_type);
                const isSelected = selectedIds.has(file.id);
                const isDeleting = deletingId === file.id;

                return (
                  <div
                    key={file.id}
                    className={cn(
                      "flex items-center gap-3 p-3",
                      "transition-colors duration-150",
                      isSelected && "bg-construction-blue/5",
                      !isSelected &&
                        "hover:bg-gray-50 dark:hover:bg-gray-800/50",
                      isDeleting && "opacity-50 pointer-events-none",
                    )}
                  >
                    {/* Selection checkbox */}
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => onSelectToggle(file.id)}
                      aria-label={`Select ${file.filename}`}
                    />

                    {/* File icon */}
                    <div
                      className={cn(
                        "flex-shrink-0 p-2 rounded-lg",
                        file.file_type === "application/pdf"
                          ? "bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400"
                          : file.file_type?.startsWith("image/")
                            ? "bg-purple-50 text-purple-600 dark:bg-purple-950/30 dark:text-purple-400"
                            : file.file_type?.includes("zip") ||
                                file.file_type?.includes("archive")
                              ? "bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400"
                              : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
                      )}
                    >
                      <FileIcon className="h-5 w-5" />
                    </div>

                    {/* File info - clickable for preview */}
                    <div className="flex-1 min-w-0">
                      <button
                        onClick={() => setPreviewFile(file)}
                        className="text-left w-full group"
                      >
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate group-hover:text-construction-blue transition-colors">
                          {file.filename}
                        </p>
                      </button>
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex-wrap">
                        <span>{formatFileSize(file.file_size)}</span>
                        <span className="text-gray-300 dark:text-gray-700">
                          |
                        </span>
                        <span>{formatDate(file.created_at)}</span>
                        {file.uploader?.name && (
                          <>
                            <span className="text-gray-300 dark:text-gray-700">
                              |
                            </span>
                            <span className="text-gray-600 dark:text-gray-300 dark:text-gray-700">
                              {file.uploader.name}
                            </span>
                          </>
                        )}
                        {/* Version badge - clickable for history */}
                        {file.version_number > 1 && (
                          <>
                            <span className="text-gray-300 dark:text-gray-700">
                              |
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setVersionHistoryFile(file);
                              }}
                              className={cn(
                                "inline-flex items-center gap-1 px-1.5 py-0.5 rounded",
                                "bg-construction-blue/10 text-construction-blue font-bold",
                                "hover:bg-construction-blue/20 transition-colors",
                              )}
                            >
                              <History className="h-3 w-3" />v
                              {file.version_number}
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {/* Preview button */}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setPreviewFile(file)}
                        className="h-8 w-8 p-0 text-gray-500 dark:text-gray-400 hover:text-construction-blue hover:bg-construction-blue/10"
                        title="Preview"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>

                      {/* Download button */}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => handleDownload(file, e)}
                        className="h-8 w-8 p-0 text-gray-500 dark:text-gray-400 hover:text-construction-blue hover:bg-construction-blue/10"
                        title="Download"
                      >
                        <Download className="h-4 w-4" />
                      </Button>

                      {/* Delete button */}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => handleDelete(file, e)}
                        disabled={isDeleting}
                        className="h-8 w-8 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
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
          onDelete={() => {
            setPreviewFile(null);
            onRefresh();
          }}
        />
      )}

      {/* Version history modal */}
      {versionHistoryFile && (
        <FileVersionHistory
          fileId={versionHistoryFile.id}
          filename={versionHistoryFile.filename}
          onClose={() => setVersionHistoryFile(null)}
        />
      )}
    </div>
  );
}
