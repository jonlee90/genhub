"use client";

import { useState, useEffect, useCallback } from "react";
import { ResponsiveModal } from "@/components/ui/ResponsiveModal";
import Check from "lucide-react/icons/check";
import X from "lucide-react/icons/x";
import Loader2 from "lucide-react/icons/loader-2";
import { cn } from "@/lib/utils";

type ParseProgressOverlayProps = {
  planUploadId: string;
  onComplete: () => void;
};

type PageStatus = {
  pageNumber: number;
  status: "pending" | "parsing" | "parsed" | "parse_failed";
};

export function ParseProgressOverlay({
  planUploadId,
  onComplete,
}: ParseProgressOverlayProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [pages, setPages] = useState<PageStatus[]>([]);
  const [parsedCount, setParsedCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Poll for parse status
  const pollParseStatus = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/estimates/parse-status?planUploadId=${planUploadId}`,
      );
      if (!response.ok) throw new Error("Failed to fetch parse status");

      const data = await response.json();

      setPages(data.pages || []);
      setTotalPages(data.totalPages || 0);
      setParsedCount(data.parsedCount || 0);

      // Check if all complete
      if (data.allComplete) {
        setIsOpen(false);
        onComplete();
      }
    } catch (error) {
      console.error("[ParseProgressOverlay] Poll error:", error);
    }
  }, [planUploadId, onComplete]);

  // Start polling
  useEffect(() => {
    if (!isOpen) return;

    pollParseStatus();
    const interval = setInterval(pollParseStatus, 2000);

    return () => clearInterval(interval);
  }, [isOpen, pollParseStatus]);

  const getPageIcon = (status: PageStatus["status"]) => {
    switch (status) {
      case "pending":
        return (
          <div className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-600" />
        );
      case "parsing":
        return (
          <Loader2 className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-spin" />
        );
      case "parsed":
        return <Check className="w-4 h-4 text-green-600 dark:text-green-400" />;
      case "parse_failed":
        return <X className="w-4 h-4 text-red-600 dark:text-red-400" />;
    }
  };

  const progressPercentage =
    totalPages > 0 ? (parsedCount / totalPages) * 100 : 0;

  return (
    <ResponsiveModal
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      title="Parsing Plan with AI"
      closeOnBackdropClick={false}
      closeOnEscape={false}
    >
      <div className="space-y-6 pb-[env(safe-area-inset-bottom)]">
        {/* Progress bar */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {parsedCount} of {totalPages} pages
            </span>
            <span className="text-sm font-bold text-construction-blue dark:text-construction-blue">
              {Math.round(progressPercentage)}%
            </span>
          </div>

          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-construction-blue transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Pages list */}
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {pages.map((page) => (
            <div
              key={page.pageNumber}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg border",
                page.status === "parsed"
                  ? "bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-900/40"
                  : page.status === "parse_failed"
                    ? "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-900/40"
                    : page.status === "parsing"
                      ? "bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-900/40"
                      : "bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700",
              )}
            >
              {getPageIcon(page.status)}
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Page {page.pageNumber}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400 ml-auto">
                {page.status === "parsing"
                  ? "Parsing..."
                  : page.status === "parsed"
                    ? "Complete"
                    : page.status === "parse_failed"
                      ? "Failed"
                      : "Pending"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </ResponsiveModal>
  );
}
