/**
 * DocumentsSection Component
 * - Groups files by category with accordion organization
 * - Empty state with upload CTA
 * - Header with checkbox for select all, file count, upload button
 * - Clean industrial construction aesthetic
 */

"use client";

import { useState, useMemo, useCallback } from "react";
import { m as motion, AnimatePresence } from "framer-motion";
// Performance optimization: Direct imports instead of barrel file (saves 200-800ms per page)
import Upload from "lucide-react/icons/upload";
import FolderOpen from "lucide-react/icons/folder-open";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ResponsiveModal } from "@/components/ui/ResponsiveModal";
import { DocumentCategoryList } from "./DocumentCategoryList";
import { ProjectFileUploader } from "./ProjectFileUploader";

interface DocumentsSectionProps {
  files: any[];
  selectedIds: Set<string>;
  onSelectToggle: (id: string) => void;
  onSelectAll: () => void;
  onRefresh: () => void;
  projectId: string;
}

const CATEGORIES = [
  { key: "contracts", label: "Contracts & Agreements", icon: "📄" },
  { key: "permits", label: "Permits & Approvals", icon: "📋" },
  { key: "drawings", label: "Drawings & Blueprints", icon: "📐" },
  { key: "reports", label: "Reports", icon: "📊" },
  { key: "financial", label: "Financial", icon: "💰" },
  { key: "safety", label: "Safety & Compliance", icon: "⚠️" },
  { key: "meeting_notes", label: "Meeting Notes", icon: "📝" },
  { key: "specifications", label: "Specifications", icon: "📏" },
  { key: "general", label: "General", icon: "📁" },
];

export function DocumentsSection({
  files,
  selectedIds,
  onSelectToggle,
  onSelectAll,
  onRefresh,
  projectId,
}: DocumentsSectionProps) {
  console.log("[DocumentsSection] Rendering with", files.length, "files");

  const [showUploader, setShowUploader] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(["contracts", "permits", "drawings"]), // Default expanded
  );

  // Performance optimization: Memoize grouped files to prevent recalculation on every render
  const filesByCategory = useMemo(() => {
    return files.reduce(
      (acc, file) => {
        const category = file.category || "general";
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push(file);
        return acc;
      },
      {} as Record<string, any[]>,
    );
  }, [files]);

  console.log(
    "[DocumentsSection] Files grouped by category:",
    Object.keys(filesByCategory),
  );

  // Performance optimization: Memoize selection state calculations
  const allSelected = useMemo(
    () => files.length > 0 && selectedIds.size === files.length,
    [files.length, selectedIds.size],
  );
  const someSelected = useMemo(
    () => selectedIds.size > 0 && selectedIds.size < files.length,
    [selectedIds.size, files.length],
  );

  // Performance optimization: Memoize event handlers to prevent recreation on every render
  const toggleCategory = useCallback(
    (categoryKey: string) => {
      console.log("[DocumentsSection] Toggling category:", categoryKey);
      const newExpanded = new Set(expandedCategories);
      if (newExpanded.has(categoryKey)) {
        newExpanded.delete(categoryKey);
      } else {
        newExpanded.add(categoryKey);
      }
      setExpandedCategories(newExpanded);
    },
    [expandedCategories],
  );

  const handleUploadComplete = useCallback(() => {
    console.log("[DocumentsSection] Upload complete, refreshing");
    setShowUploader(false);
    onRefresh();
  }, [onRefresh]);

  // Empty state
  if (files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
        {/* Icon container with industrial feel */}
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-construction-blue/10 rounded-full blur-xl" />
          <div className="relative p-5 bg-gradient-to-br from-[var(--construction-blue)] to-[var(--construction-blue)]/80 rounded-2xl shadow-lg">
            <FolderOpen className="h-10 w-10 text-white" strokeWidth={1.5} />
          </div>
        </div>

        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2 tracking-tight">
          No Documents Yet
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 text-center max-w-sm leading-relaxed">
          Upload contracts, permits, drawings, and other project documents to
          keep everything organized in one place.
        </p>

        <Button
          onClick={() => setShowUploader(true)}
          className="bg-construction-blue hover:bg-construction-blue/90 text-white font-bold px-6 py-2.5 shadow-md transition-all duration-200 hover:shadow-lg"
        >
          <Upload className="h-4 w-4 mr-2" />
          UPLOAD DOCUMENTS
        </Button>

        {/* Uploader modal */}
        <ResponsiveModal
          isOpen={showUploader}
          onClose={() => setShowUploader(false)}
          title="Upload Documents"
          icon={Upload}
          maxWidth="lg"
        >
          <ProjectFileUploader
            projectId={projectId}
            onComplete={handleUploadComplete}
            onCancel={() => setShowUploader(false)}
          />
        </ResponsiveModal>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with select all and upload */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <Checkbox
            checked={
              allSelected ? true : someSelected ? "indeterminate" : false
            }
            onCheckedChange={() => onSelectAll()}
            id="select-all-files"
            aria-label="Select all files"
          />
          <label
            htmlFor="select-all-files"
            className="text-sm text-gray-600 dark:text-gray-300 cursor-pointer select-none"
          >
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {files.length}
            </span>{" "}
            {files.length === 1 ? "document" : "documents"}
            {selectedIds.size > 0 && (
              <span className="ml-2 text-construction-blue">
                ({selectedIds.size} selected)
              </span>
            )}
          </label>
        </div>

        <Button
          onClick={() => setShowUploader(true)}
          className="bg-construction-blue hover:bg-construction-blue/90 text-white font-bold shadow-sm"
        >
          <Upload className="h-4 w-4 mr-2" />
          UPLOAD
        </Button>
      </div>

      {/* Category sections */}
      <div className="space-y-3">
        <AnimatePresence mode="sync">
          {CATEGORIES.map((category) => {
            const categoryFiles = filesByCategory[category.key] || [];
            if (categoryFiles.length === 0) return null;

            return (
              <motion.div
                key={category.key}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <DocumentCategoryList
                  category={category}
                  files={categoryFiles}
                  isExpanded={expandedCategories.has(category.key)}
                  onToggle={() => toggleCategory(category.key)}
                  selectedIds={selectedIds}
                  onSelectToggle={onSelectToggle}
                  onRefresh={onRefresh}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Uploader modal */}
      <ResponsiveModal
        isOpen={showUploader}
        onClose={() => setShowUploader(false)}
        title="Upload Documents"
        icon={Upload}
        maxWidth="lg"
      >
        <ProjectFileUploader
          projectId={projectId}
          onComplete={handleUploadComplete}
          onCancel={() => setShowUploader(false)}
        />
      </ResponsiveModal>
    </div>
  );
}
