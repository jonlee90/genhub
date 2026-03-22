"use client";

import { useState, useEffect } from "react";
import { ResponsiveModal } from "@/components/ui/ResponsiveModal";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import History from "lucide-react/icons/history";
import { getTemplateVersionHistory } from "@/app/actions/templates";

type VersionHistoryData = {
  version: number;
  changelog: string[];
  updated_at: string;
};

export function TemplateVersionHistory({
  isOpen,
  onClose,
  templateId,
  templateName,
}: {
  isOpen: boolean;
  onClose: () => void;
  templateId: string;
  templateName: string;
}) {
  const [versionData, setVersionData] = useState<VersionHistoryData | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;

    async function loadVersionHistory() {
      try {
        setIsLoading(true);
        const result = await getTemplateVersionHistory(templateId);

        if (!isMounted) return;

        if (result.success && result.data) {
          setVersionData(result.data as unknown as VersionHistoryData);
        } else {
          toast.error(result.error || "Failed to load version history");
        }
      } catch (err) {
        if (!isMounted) return;
        console.error("[TemplateVersionHistory] Load error:", err);
        toast.error("Failed to load version history");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadVersionHistory();

    return () => {
      isMounted = false;
    };
  }, [isOpen, templateId]);

  return (
    <ResponsiveModal
      isOpen={isOpen}
      onClose={onClose}
      icon={History}
      title={`Version History: ${templateName}`}
      maxWidth="lg"
      snapPoints={["half", "full"]}
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-construction-blue border-t-transparent rounded-full animate-spin" />
        </div>
      ) : versionData ? (
        <div className="space-y-4">
          <div className="p-4 rounded-lg border-2 bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900/40">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                  Version {versionData.version}
                </h4>
                <Badge
                  variant="outline"
                  className="border-green-500 text-green-700 dark:text-green-400"
                >
                  Current
                </Badge>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-600 dark:text-gray-400">
                  Last Updated:
                </span>
                <span className="ml-2 text-gray-900 dark:text-gray-100">
                  {new Date(versionData.updated_at).toLocaleString()}
                </span>
              </div>

              {versionData.changelog && versionData.changelog.length > 0 ? (
                <div>
                  <span className="text-gray-600 dark:text-gray-400">
                    Changelog:
                  </span>
                  <div className="mt-2 space-y-1">
                    {versionData.changelog.map((entry, index) => (
                      <div
                        key={index}
                        className="text-gray-900 dark:text-gray-100 pl-4 border-l-2 border-gray-300 dark:border-gray-600"
                      >
                        {entry}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
            Template versioning tracks all modifications to ensure pricing
            consistency
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-sm text-gray-500 dark:text-gray-400">
          No version history available
        </div>
      )}
    </ResponsiveModal>
  );
}
