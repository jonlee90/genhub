'use client';

import { useState, useTransition, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
// Direct Lucide imports for performance
import Home from 'lucide-react/icons/home';
import Coffee from 'lucide-react/icons/coffee';
import UtensilsCrossed from 'lucide-react/icons/utensils-crossed';
import Building2 from 'lucide-react/icons/building-2';
import Factory from 'lucide-react/icons/factory';
import Upload from 'lucide-react/icons/upload';
import Eye from 'lucide-react/icons/eye';
import RotateCcw from 'lucide-react/icons/rotate-ccw';
import Check from 'lucide-react/icons/check';
import AlertCircle from 'lucide-react/icons/alert-circle';
import Loader2 from 'lucide-react/icons/loader-2';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatFileSize } from '@/lib/format-utils';
import { ModelUploadModal } from './ModelUploadModal';
import { ModelPreviewModal } from './ModelPreviewModal';
import { resetToSystemDefault } from '@/app/actions/default-models';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

// Map icon names to Lucide icons
const ICON_MAP: Record<string, LucideIcon> = {
  home: Home,
  residential: Home,
  coffee: Coffee,
  cafe: Coffee,
  utensilscrossed: UtensilsCrossed,
  restaurant: UtensilsCrossed,
  building2: Building2,
  commercial: Building2,
  factory: Factory,
  industrial: Factory,
};

interface DefaultModelCardProps {
  projectTypeConfigId: string;
  projectTypeName: string;
  projectTypeDescription: string | null;
  iconName: string | null;
  systemDefault: {
    id: string;
    name: string;
    description: string | null;
    file_size_bytes: number;
    element_count: number | null;
    xkt_file_url: string;
  } | null;
  companyCustom: {
    id: string;
    modelId: string;
    fileSize: number;
    elementCount: number | null;
    uploadedAt: string;
    xktUrl: string | null;
  } | null;
}

export function DefaultModelCard({
  projectTypeConfigId,
  projectTypeName,
  projectTypeDescription,
  iconName,
  systemDefault,
  companyCustom,
}: DefaultModelCardProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Determine which icon to use (memoized to prevent recalculation on every render)
  const Icon = useMemo(() => {
    const key = (iconName || projectTypeName).toLowerCase().replace(/\s+/g, '');
    return ICON_MAP[key] || Building2;
  }, [iconName, projectTypeName]);

  // Determine current status
  const isUsingCustom = !!companyCustom;
  const currentModel = isUsingCustom ? companyCustom : systemDefault;

  // Handle preview (fixed dependencies - removed derived state)
  const handlePreview = useCallback(() => {
    if (isUsingCustom && companyCustom) {
      setPreviewUrl(companyCustom.xktUrl);
      setShowPreviewModal(true);
    } else if (!isUsingCustom && systemDefault) {
      setPreviewUrl(systemDefault.xkt_file_url);
      setShowPreviewModal(true);
    }
  }, [isUsingCustom, companyCustom, systemDefault]);

  return (
    <>
      <div className="border-2 border-gray-200 rounded-lg p-4 md:p-6 shadow-construction hover:shadow-construction-lg transition-all duration-200 bg-white">
        {/* Header with Icon and Title */}
        <div className="flex items-start gap-4 mb-4">
          {/* Icon */}
          <div className="p-3 bg-[#001B51] rounded-lg shrink-0">
            <Icon className="w-6 h-6 md:w-7 md:h-7 text-white" />
          </div>

          {/* Title and Description */}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg md:text-xl font-bold text-[#001B51] uppercase tracking-tight">
              {projectTypeName}
            </h3>
            {projectTypeDescription && (
              <p className="text-sm text-gray-600 mt-1">{projectTypeDescription}</p>
            )}
          </div>

          {/* Status Badge */}
          {isUsingCustom ? (
            <Badge className="bg-[#059669]/10 text-[#059669] border-[#059669]/30 shrink-0">
              <Check className="w-3 h-3 mr-1" />
              Custom
            </Badge>
          ) : (
            <Badge className="bg-gray-100 text-gray-700 border-gray-300 shrink-0">
              System Default
            </Badge>
          )}
        </div>

        {/* Model Info */}
        {currentModel ? (
          <div className="space-y-3 mb-4">
            {/* Model Name (for system defaults) */}
            {!isUsingCustom && systemDefault && (
              <div>
                <p className="text-sm font-semibold text-gray-700">{systemDefault.name}</p>
                {systemDefault.description && (
                  <p className="text-xs text-gray-500 mt-1">{systemDefault.description}</p>
                )}
              </div>
            )}

            {/* Metadata Grid */}
            <div className="grid grid-cols-2 gap-3 bg-gray-50 p-3 rounded-lg border border-gray-200">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide font-mono">File Size</p>
                <p className="text-sm font-bold text-[#001B51] font-mono">
                  {formatFileSize('fileSize' in currentModel ? currentModel.fileSize : (currentModel as { file_size_bytes: number }).file_size_bytes)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide font-mono">Elements</p>
                <p className="text-sm font-bold text-[#001B51] font-mono">
                  {('elementCount' in currentModel
                    ? currentModel.elementCount
                    : (currentModel as { element_count?: number }).element_count)?.toLocaleString() || 'N/A'}
                </p>
              </div>
            </div>

            {/* Upload Date (for custom models) */}
            {isUsingCustom && companyCustom && (
              <div className="text-xs text-gray-500">
                Uploaded: {new Date(companyCustom.uploadedAt).toLocaleDateString()}
              </div>
            )}
          </div>
        ) : (
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2 text-yellow-700">
              <AlertCircle className="w-4 h-4" />
              <p className="text-sm font-semibold">No default model available</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          {/* Upload Custom Model */}
          <Button
            onClick={() => setShowUploadModal(true)}
            variant="outline"
            size="sm"
            className={cn(
              'flex-1 min-w-[140px] border-2 transition-colors',
              isUsingCustom
                ? 'border-[#059669] text-[#059669] hover:bg-[#059669]/10'
                : 'border-[#001B51] text-[#001B51] hover:bg-[#001B51]/10'
            )}
          >
            <Upload className="w-4 h-4 mr-2" />
            {isUsingCustom ? 'Replace Custom' : 'Upload Custom'}
          </Button>

          {/* Preview Model */}
          {currentModel && (
            <Button
              onClick={handlePreview}
              variant="outline"
              size="sm"
              className="flex-1 min-w-[120px] border-2 border-gray-300 text-gray-700 hover:bg-gray-100"
            >
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </Button>
          )}

          {/* Reset to System Default (only if custom is set) */}
          {isUsingCustom && (
            <Button
              onClick={() => {
                if (!confirm(`Reset ${projectTypeName} to system default model?\n\nThis will remove your custom model and use the GenHub default instead. This action cannot be undone.`)) {
                  return;
                }

                startTransition(async () => {
                  const result = await resetToSystemDefault(projectTypeConfigId);

                  if (result.success) {
                    toast({
                      title: 'Reset Successful',
                      description: `${projectTypeName} has been reset to the system default model.`,
                      variant: 'default',
                    });

                    router.refresh();
                  } else {
                    toast({
                      title: 'Reset Failed',
                      description: 'An error occurred while resetting to the system default.',
                      variant: 'destructive',
                    });
                  }
                });
              }}
              variant="outline"
              size="sm"
              disabled={isPending}
              className="border-2 border-[#DC2626] text-[#DC2626] hover:bg-[#DC2626]/10 disabled:opacity-50"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Resetting...
                </>
              ) : (
                <>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <ModelUploadModal
          projectTypeConfigId={projectTypeConfigId}
          projectTypeName={projectTypeName}
          onClose={() => setShowUploadModal(false)}
        />
      )}

      {/* Preview Modal */}
      {showPreviewModal && previewUrl && (
        <ModelPreviewModal
          modelUrl={previewUrl}
          projectTypeName={projectTypeName}
          onClose={() => {
            setShowPreviewModal(false);
            setPreviewUrl(null);
          }}
        />
      )}
    </>
  );
}
