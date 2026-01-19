/**
 * FilePreviewModal Component
 * - PDF preview using iframe
 * - Image preview using img tag
 * - Non-previewable files show download CTA
 * - File details grid: category, size, uploaded by, date
 * - Download and Delete actions
 */

"use client";

import { useState } from "react";
// Performance optimization: Direct imports instead of barrel file (saves 200-800ms per page)
import Download from "lucide-react/icons/download";
import Trash2 from "lucide-react/icons/trash-2";
import FileText from "lucide-react/icons/file-text";
import ExternalLink from "lucide-react/icons/external-link";
import Loader2 from "lucide-react/icons/loader-2";
import { ResponsiveModal } from "@/components/ui/ResponsiveModal";
import { Button } from "@/components/ui/button";
import { deleteProjectFile } from "@/app/actions/project-files";
import { toast } from "sonner";

interface FilePreviewModalProps {
  file: {
    id: string;
    filename: string;
    file_type: string;
    file_size: number;
    file_url: string;
    category: string;
    created_at: string;
    uploader?: { name?: string };
    version_number?: number;
    client_visible?: boolean;
  };
  onClose: () => void;
  onDelete: (fileId: string) => void;
}

/**
 * Format file size for display
 */
function formatFileSize(bytes: number): string {
  if (!bytes || bytes === 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Format category for display
 */
function formatCategory(category: string): string {
  return category
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function FilePreviewModal({
  file,
  onClose,
  onDelete,
}: FilePreviewModalProps) {
  console.log("[FilePreviewModal] Rendering for file:", file.id, file.filename);

  const [isDeleting, setIsDeleting] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(true);

  const isPDF = file.file_type === "application/pdf";
  const isImage = file.file_type?.startsWith("image/");
  const canPreview = isPDF || isImage;

  const handleDownload = () => {
    console.log("[FilePreviewModal] Downloading file:", file.id);
    window.open(file.file_url, "_blank");
  };

  const handleDelete = async () => {
    if (
      !confirm(`Delete "${file.filename}"?\n\nThis action cannot be undone.`)
    ) {
      return;
    }

    console.log("[FilePreviewModal] Deleting file:", file.id);
    setIsDeleting(true);

    try {
      const result = await deleteProjectFile(file.id);

      if (result.error) {
        toast.error(`Delete failed: ${result.error}`);
        setIsDeleting(false);
      } else {
        toast.success("File deleted");
        onDelete(file.id);
      }
    } catch (err) {
      console.error("[FilePreviewModal] Delete error:", err);
      toast.error("Failed to delete file");
      setIsDeleting(false);
    }
  };

  return (
    <ResponsiveModal
      isOpen={true}
      onClose={onClose}
      title={file.filename}
      icon={FileText}
      maxWidth="2xl"
      rightActions={
        <div className="flex items-center gap-2">
          <Button
            onClick={handleDownload}
            className="bg-[#001B51] hover:bg-[#001B51]/90 text-white font-bold"
          >
            <Download className="h-4 w-4 mr-2" />
            DOWNLOAD
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
            className="font-bold"
          >
            {isDeleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                DELETE
              </>
            )}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Preview area */}
        <div className="relative rounded-lg overflow-hidden border-2 border-gray-200 bg-gray-50">
          {/* PDF Preview */}
          {isPDF && (
            <div className="relative">
              {previewLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
                  <Loader2 className="h-8 w-8 text-[#001B51] animate-spin" />
                </div>
              )}
              <iframe
                src={`${file.file_url}#toolbar=0&navpanes=0`}
                className="w-full h-[400px] bg-white"
                title={`Preview of ${file.filename}`}
                onLoad={() => setPreviewLoading(false)}
              />
            </div>
          )}

          {/* Image Preview */}
          {isImage && (
            <div className="relative flex items-center justify-center p-4 min-h-[200px]">
              {previewLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
                  <Loader2 className="h-8 w-8 text-[#001B51] animate-spin" />
                </div>
              )}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={file.file_url}
                alt={file.filename}
                className="max-w-full max-h-[400px] object-contain rounded shadow-sm"
                onLoad={() => setPreviewLoading(false)}
                onError={() => setPreviewLoading(false)}
              />
            </div>
          )}

          {/* Non-previewable files */}
          {!canPreview && (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <div className="p-4 bg-gray-200 rounded-2xl mb-4">
                <FileText className="h-12 w-12 text-gray-400" />
              </div>
              <p className="text-sm text-gray-600 mb-1 font-medium">
                Preview not available
              </p>
              <p className="text-xs text-gray-500 mb-4">
                This file type cannot be previewed in the browser
              </p>
              <Button
                onClick={handleDownload}
                variant="secondary"
                className="font-bold"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open in new tab
              </Button>
            </div>
          )}
        </div>

        {/* File details grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div>
            <p className="text-xs text-gray-500 uppercase font-bold tracking-wide mb-1">
              Category
            </p>
            <p className="text-sm text-gray-900 font-medium">
              {formatCategory(file.category)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-bold tracking-wide mb-1">
              Size
            </p>
            <p className="text-sm text-gray-900 font-medium">
              {formatFileSize(file.file_size)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-bold tracking-wide mb-1">
              Uploaded By
            </p>
            <p className="text-sm text-gray-900 font-medium">
              {file.uploader?.name || "Unknown"}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-bold tracking-wide mb-1">
              Date
            </p>
            <p className="text-sm text-gray-900 font-medium">
              {new Date(file.created_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
        </div>

        {/* Additional info row */}
        <div className="flex items-center gap-4 text-sm text-gray-500">
          {file.version_number && file.version_number > 1 && (
            <span className="px-2 py-1 bg-[#001B51]/10 text-[#001B51] rounded font-bold text-xs">
              Version {file.version_number}
            </span>
          )}
          {file.client_visible && (
            <span className="px-2 py-1 bg-green-100 text-green-700 rounded font-bold text-xs">
              Client Visible
            </span>
          )}
          <span className="text-xs text-gray-400 ml-auto">
            Type: {file.file_type || "Unknown"}
          </span>
        </div>
      </div>
    </ResponsiveModal>
  );
}
