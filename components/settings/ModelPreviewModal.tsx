"use client";

import { ResponsiveModal } from "@/components/ui/ResponsiveModal";
import { Button } from "@/components/ui/button";
import { Eye, X } from "lucide-react";
import { SpatialViewer } from "@/components/projects/spatial/SpatialViewer";

interface ModelPreviewModalProps {
  modelUrl: string;
  projectTypeName: string;
  onClose: () => void;
}

export function ModelPreviewModal({
  modelUrl,
  projectTypeName,
  onClose,
}: ModelPreviewModalProps) {
  return (
    <ResponsiveModal
      isOpen={true}
      onClose={onClose}
      icon={Eye}
      title={`Preview: ${projectTypeName} Default Model`}
      subtitle="3D model preview with interactive camera controls"
      maxWidth="4xl"
      theme="default"
      closeOnBackdropClick={true}
      closeOnEscape={true}
      showFooter={false}
    >
      <div className="space-y-4">
        {/* Info Banner */}
        <div className="bg-blue-50 dark:bg-blue-950 border-l-4 border-construction-blue p-4 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Use your mouse to rotate, pan, and zoom the model. This is a preview
            of the default model that will be loaded when creating new{" "}
            {projectTypeName} projects.
          </p>
        </div>

        {/* 3D Viewer Container */}
        <div className="border-2 border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
          <div className="h-[60vh] min-h-[400px] relative">
            <SpatialViewer
              userRole="viewer"
              projectId="preview-default-model"
              modelHighURL={modelUrl}
              className="w-full h-full"
            />
          </div>
        </div>

        {/* Model Metadata */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-mono">
              Type
            </p>
            <p className="text-sm font-bold text-construction-blue">
              {projectTypeName}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-mono">
              Format
            </p>
            <p className="text-sm font-bold text-construction-blue font-mono">XKT</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-mono">
              Status
            </p>
            <p className="text-sm font-bold text-[#059669]">Ready</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-mono">
              Preview
            </p>
            <p className="text-sm font-bold text-construction-blue">Live</p>
          </div>
        </div>

        {/* Close Button */}
        <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            onClick={onClose}
            variant="outline"
            className="border-2 border-gray-300 dark:border-gray-600"
          >
            <X className="w-4 h-4 mr-2" />
            Close Preview
          </Button>
        </div>
      </div>
    </ResponsiveModal>
  );
}
