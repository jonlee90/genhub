"use client";

import { memo } from "react";
import Image from "next/image";
import FileText from "lucide-react/icons/file-text";
import X from "lucide-react/icons/x";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type UploadedFile = {
  id: string;
  name: string;
  url: string;
  type: string;
  pageType?: string | null;
};

type UploadThumbnailGridProps = {
  files: UploadedFile[];
  onRemove?: (fileId: string) => void;
};

// Page type badge mapping
const PAGE_TYPE_CONFIG: Record<
  string,
  { label: string; bgClass: string; textClass: string }
> = {
  floor_plan: {
    label: "Floor Plan",
    bgClass: "bg-blue-500/15 dark:bg-blue-500/20",
    textClass: "text-blue-700 dark:text-blue-300",
  },
  elevation: {
    label: "Elevation",
    bgClass: "bg-purple-500/15 dark:bg-purple-500/20",
    textClass: "text-purple-700 dark:text-purple-300",
  },
  detail: {
    label: "Detail",
    bgClass: "bg-amber-500/15 dark:bg-amber-500/20",
    textClass: "text-amber-700 dark:text-amber-300",
  },
  section: {
    label: "Section",
    bgClass: "bg-teal-500/15 dark:bg-teal-500/20",
    textClass: "text-teal-700 dark:text-teal-300",
  },
  site_plan: {
    label: "Site Plan",
    bgClass: "bg-green-500/15 dark:bg-green-500/20",
    textClass: "text-green-700 dark:text-green-300",
  },
  unknown: {
    label: "Unknown",
    bgClass: "bg-gray-500/15 dark:bg-gray-500/20",
    textClass: "text-gray-700 dark:text-gray-300",
  },
};

// Memoized thumbnail component
const ThumbnailCard = memo(function ThumbnailCard({
  file,
  onRemove,
}: {
  file: UploadedFile;
  onRemove?: (fileId: string) => void;
}) {
  const isImage = file.type.startsWith("image/");
  const isPdf = file.type === "application/pdf";
  const pageTypeConfig =
    PAGE_TYPE_CONFIG[file.pageType || "unknown"] || PAGE_TYPE_CONFIG.unknown;

  return (
    <div className="relative group">
      <div
        className={cn(
          "relative aspect-[4/3] rounded-lg overflow-hidden",
          "border-2 border-gray-200 dark:border-gray-700",
          "bg-gray-50 dark:bg-gray-800",
          "transition-all hover:border-construction-blue dark:hover:border-construction-blue",
        )}
      >
        {/* Thumbnail */}
        {isImage ? (
          <Image
            src={file.url}
            alt={file.name}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 50vw, 25vw"
          />
        ) : isPdf ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <FileText className="w-12 h-12 text-gray-400 dark:text-gray-500" />
          </div>
        ) : null}

        {/* Remove button */}
        {onRemove ? (
          <button
            onClick={() => onRemove(file.id)}
            className={cn(
              "absolute top-2 right-2 z-10",
              "w-6 h-6 rounded-full",
              "bg-red-500 text-white",
              "flex items-center justify-center",
              "opacity-0 group-hover:opacity-100",
              "hover:bg-red-600 active:bg-red-700 active:scale-95",
              "dark:bg-red-600 dark:hover:bg-red-700 dark:active:bg-red-800",
              "transition-all",
            )}
            aria-label={`Remove ${file.name}`}
          >
            <X className="w-4 h-4" />
          </button>
        ) : null}

        {/* Page type badge */}
        {file.pageType ? (
          <div className="absolute bottom-2 left-2 z-10">
            <Badge
              className={cn(
                "text-xs font-medium px-2 py-0.5",
                pageTypeConfig.bgClass,
                pageTypeConfig.textClass,
              )}
            >
              {pageTypeConfig.label}
            </Badge>
          </div>
        ) : null}
      </div>

      {/* File name */}
      <p
        className={cn(
          "mt-2 text-xs text-gray-600 dark:text-gray-400",
          "truncate text-center",
        )}
        title={file.name}
      >
        {file.name}
      </p>
    </div>
  );
});

export function UploadThumbnailGrid({
  files,
  onRemove,
}: UploadThumbnailGridProps) {
  if (files.length === 0) {
    return null;
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          Uploaded Files ({files.length})
        </h3>
      </div>

      <div className={cn("grid gap-4", "grid-cols-2 md:grid-cols-4")}>
        {files.map((file) => (
          <ThumbnailCard key={file.id} file={file} onRemove={onRemove} />
        ))}
      </div>
    </div>
  );
}
