"use client";

import Image from "next/image";
import { useState, useEffect, useCallback } from "react";
import { Paperclip } from "lucide-react";
import { FileText } from "lucide-react";
import { Image as ImageIcon } from "lucide-react";
import { Loader2 } from "lucide-react";
import { Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { getTaskAttachments } from "@/app/actions/tasks";
import { useActionWithError } from "@/hooks/useActionWithError";
import { ErrorBanner } from "@/components/shared/ErrorBanner";

interface Attachment {
  id: string;
  file_name: string;
  file_url: string;
  file_type?: string | null;
  file_size?: number | null;
  thumbnail_url?: string | null;
  created_at: string;
}

export interface AttachmentsTabProps {
  taskId: string;
}

/**
 * AttachmentsTab - Display attachments linked to task
 * Separates images (grid view with preview) from files (list view with download)
 * Images open in new tab on click, files download
 */
export function AttachmentsTab({ taskId }: AttachmentsTabProps) {
  // Component state
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const { error, setError, clearError } = useActionWithError();

  // Fetch attachments on mount
  useEffect(() => {
    const fetchAttachments = async () => {
      setLoading(true);
      setError(null);

      const result = await getTaskAttachments(taskId);

      if (result.error) {
        setError(result.error);
        setAttachments([]);
      } else if (result.data) {
        setAttachments(result.data);
      }

      setLoading(false);
    };

    fetchAttachments();
  }, [taskId, setError]);

  // Format file size helper
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "Unknown size";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-[#001B51]" />
        <p className="text-sm text-gray-500">Loading attachments...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return <ErrorBanner error={error} onDismiss={clearError} />;
  }

  // Empty state
  if (attachments.length === 0) {
    return (
      <div className="text-center py-12">
        <Paperclip className="h-16 w-16 mx-auto mb-3 text-gray-300" />
        <p className="text-gray-500 font-semibold">No attachments</p>
        <p className="text-sm text-gray-400 mt-1">Files and images will appear here when uploaded</p>
      </div>
    );
  }

  // Separate images from other files
  const images = attachments.filter(a => a.file_type?.startsWith("image/"));
  const files = attachments.filter(a => !a.file_type?.startsWith("image/"));

  return (
    <div className="space-y-6">
      {/* Images Section */}
      {images.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <ImageIcon className="h-5 w-5 text-[#001B51]" />
            <h3 className="font-bold uppercase text-sm text-[#001B51]">
              Images ({images.length})
            </h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {images.map(image => (
              <button
                key={image.id}
                onClick={() => window.open(image.file_url, "_blank")}
                className={cn(
                  "aspect-square rounded-lg overflow-hidden",
                  "border-2 border-gray-200 hover:border-[#001B51]",
                  "transition-all duration-200 hover:shadow-lg",
                  "relative group"
                )}
                aria-label={`View ${image.file_name}`}
              >
                <Image
                  src={image.thumbnail_url || image.file_url}
                  alt={image.file_name}
                  fill
                  className="w-full h-full object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
                {/* Overlay on hover */}
                <div className={cn(
                  "absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100",
                  "transition-opacity duration-200",
                  "flex items-center justify-center"
                )}>
                  <ImageIcon className="h-8 w-8 text-white" />
                </div>
                {/* File name label */}
                <div className={cn(
                  "absolute bottom-0 left-0 right-0 bg-black/70 p-2",
                  "opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                )}>
                  <p className="text-xs text-white truncate">{image.file_name}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Files Section */}
      {files.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <FileText className="h-5 w-5 text-[#001B51]" />
            <h3 className="font-bold uppercase text-sm text-[#001B51]">
              Files ({files.length})
            </h3>
          </div>

          <div className="space-y-2">
            {files.map(file => (
              <a
                key={file.id}
                href={file.file_url}
                download={file.file_name}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "flex items-center gap-3 p-3",
                  "border-2 border-gray-200 rounded-lg",
                  "hover:border-[#001B51] hover:bg-gray-50",
                  "transition-all duration-200",
                  "group"
                )}
              >
                {/* File icon */}
                <div className="p-2 bg-gray-100 rounded group-hover:bg-[#001B51] transition-colors">
                  <FileText className="h-6 w-6 text-gray-600 group-hover:text-white transition-colors" />
                </div>

                {/* File details */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-900 truncate">
                    {file.file_name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(file.file_size ?? undefined)}
                    {file.file_type && ` • ${file.file_type.split("/")[1]?.toUpperCase()}`}
                  </p>
                </div>

                {/* Download icon */}
                <Download className="h-5 w-5 text-gray-400 group-hover:text-[#001B51] transition-colors shrink-0" />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="border-t border-gray-200 pt-4 text-xs text-gray-500">
        <p>
          Total: {attachments.length} attachment{attachments.length !== 1 ? "s" : ""}
          {images.length > 0 && ` (${images.length} image${images.length !== 1 ? "s" : ""})`}
          {files.length > 0 && ` (${files.length} file${files.length !== 1 ? "s" : ""})`}
        </p>
      </div>
    </div>
  );
}
