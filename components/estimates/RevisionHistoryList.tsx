"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ResponsiveModal } from "@/components/ui/ResponsiveModal";
import { RevisionDiffView } from "@/components/estimates/RevisionDiffView";
import Clock from "lucide-react/icons/clock";
import GitCompare from "lucide-react/icons/git-compare";
import Loader2 from "lucide-react/icons/loader-2";
import Plus from "lucide-react/icons/plus";
import Minus from "lucide-react/icons/minus";
import Edit from "lucide-react/icons/edit";

interface RevisionVersion {
  id: string;
  created_at: string;
  created_by: string;
  notes: string | null;
  diff_results: {
    summary: {
      added: number;
      removed: number;
      modified: number;
      totalCostDelta: number;
    };
  };
}

interface RevisionHistoryListProps {
  estimateId: string;
  revisions: RevisionVersion[];
  onCreateRevision?: () => void;
}

export function RevisionHistoryList({
  estimateId,
  revisions,
  onCreateRevision,
}: RevisionHistoryListProps) {
  const [selectedRevisionId, setSelectedRevisionId] = useState<string | null>(
    null,
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleViewDiff = (revisionId: string) => {
    setSelectedRevisionId(revisionId);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedRevisionId(null);
  };

  if (revisions.length === 0) {
    return (
      <div className="p-8 text-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
        <GitCompare className="w-12 h-12 mx-auto mb-3 text-gray-400 dark:text-gray-600" />
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          No revisions yet
        </p>
        {onCreateRevision ? (
          <Button
            variant="default"
            onClick={onCreateRevision}
            className="min-h-[44px] active:scale-95 bg-construction-blue hover:bg-construction-blue/90 dark:bg-construction-blue dark:hover:bg-construction-blue/90"
          >
            Create First Revision
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {revisions.map((revision, index) => {
          const isLatest = index === 0;
          const summary = revision.diff_results?.summary;

          return (
            <div
              key={revision.id}
              className="relative p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
            >
              {/* Timeline connector */}
              {index < revisions.length - 1 ? (
                <div className="absolute left-[22px] top-[52px] w-[2px] h-[calc(100%+12px)] bg-gray-200 dark:bg-gray-700" />
              ) : null}

              <div className="flex items-start gap-4">
                {/* Timeline dot */}
                <div
                  className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                    isLatest
                      ? "bg-construction-blue"
                      : "bg-gray-300 dark:bg-gray-600"
                  }`}
                >
                  <Clock
                    className={`w-3 h-3 ${isLatest ? "text-white" : "text-gray-600 dark:text-gray-400"}`}
                  />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                          Revision {revisions.length - index}
                        </h4>
                        {isLatest ? (
                          <Badge
                            variant="outline"
                            className="text-xs border-construction-blue text-construction-blue dark:text-construction-blue"
                          >
                            Latest
                          </Badge>
                        ) : null}
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {new Date(revision.created_at).toLocaleString()}
                      </p>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDiff(revision.id)}
                      className="min-h-[44px] active:scale-95"
                    >
                      <GitCompare className="w-4 h-4 mr-2" />
                      View Diff
                    </Button>
                  </div>

                  {/* Change Summary */}
                  {summary ? (
                    <div className="flex flex-wrap gap-3 mb-2">
                      {summary.added > 0 ? (
                        <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                          <Plus className="w-3 h-3" />
                          <span>{summary.added} added</span>
                        </div>
                      ) : null}
                      {summary.removed > 0 ? (
                        <div className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
                          <Minus className="w-3 h-3" />
                          <span>{summary.removed} removed</span>
                        </div>
                      ) : null}
                      {summary.modified > 0 ? (
                        <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                          <Edit className="w-3 h-3" />
                          <span>{summary.modified} modified</span>
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  {/* Cost Delta */}
                  {summary && summary.totalCostDelta !== 0 ? (
                    <div
                      className={`inline-flex items-center gap-1 text-xs font-medium ${
                        summary.totalCostDelta > 0
                          ? "text-red-600 dark:text-red-400"
                          : "text-green-600 dark:text-green-400"
                      }`}
                    >
                      Cost Impact: {summary.totalCostDelta > 0 ? "+" : ""}$
                      {Math.abs(summary.totalCostDelta).toLocaleString()}
                    </div>
                  ) : null}

                  {/* Notes */}
                  {revision.notes ? (
                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">
                      {revision.notes}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Diff Modal */}
      {selectedRevisionId ? (
        <ResponsiveModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          title="Revision Comparison"
        >
          <RevisionDiffView
            revisionId={selectedRevisionId}
            onClose={handleCloseModal}
          />
        </ResponsiveModal>
      ) : null}
    </>
  );
}
