'use client';

// P3.1 - Click-to-place marker functionality
// Features: Placement mode toggle, 3D position preview, quick form, mobile-friendly

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// Performance optimization: Direct imports instead of barrel file (saves 200-800ms per page)
import MapPin from 'lucide-react/icons/map-pin';
import X from 'lucide-react/icons/x';
import Check from 'lucide-react/icons/check';
import FileText from 'lucide-react/icons/file-text';
import Image from 'lucide-react/icons/image';
import AlertCircle from 'lucide-react/icons/alert-circle';
import TrendingUp from 'lucide-react/icons/trending-up';
import Package from 'lucide-react/icons/package';;
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useMarkerPlacement } from '@/hooks/use-marker-placement';
import { useCreateMarker } from '@/hooks/use-marker-mutations';
import type { IntersectionResult } from '@/lib/hooks/use-3d-interaction';
import type { SpatialMarkerType } from '@/types/db/spatial';

// Debug: Component props
export interface MarkerPlacementProps {
  projectId: string;
  modelId: string | null;
  onSurfaceClick?: (result: IntersectionResult) => void;
  className?: string;
}

// Debug: Marker type options (matching database enum)
const MARKER_TYPES: Array<{ value: SpatialMarkerType; label: string; icon: any }> = [
  { value: 'note', label: 'Note', icon: FileText },
  { value: 'photo', label: 'Photo', icon: Image },
  { value: 'issue', label: 'Issue', icon: AlertCircle },
  { value: 'safety', label: 'Safety', icon: AlertCircle },
  { value: 'progress', label: 'Progress', icon: TrendingUp },
  { value: 'material', label: 'Material', icon: Package },
  { value: 'inspection', label: 'Inspection', icon: FileText },
  { value: 'rfi', label: 'RFI', icon: FileText },
];

/**
 * MarkerPlacement - Click-to-place marker component
 * Features:
 * - Toggle placement mode (cursor changes to crosshair)
 * - 3D surface click preview
 * - Quick form: type, title, description
 * - Confirm/cancel actions
 * - Mobile-friendly touch support
 */
export function MarkerPlacement({
  projectId,
  modelId,
  onSurfaceClick,
  className,
}: MarkerPlacementProps) {
  console.log('[MarkerPlacement] Rendering', { projectId, modelId });

  // Debug: Hooks
  const {
    state,
    preview,
    formData,
    isPlacementMode,
    startPlacement,
    cancelPlacement,
    setPreview,
    setFormData,
    setState,
    reset,
  } = useMarkerPlacement();

  const { mutate: createMarker, isLoading: isCreating } = useCreateMarker();

  // Debug: Handle surface click from parent (InteractionLayer)
  useEffect(() => {
    if (state === 'placing' && onSurfaceClick) {
      // Debug: Wrapped handler to capture click and show preview
      const handleClick = (result: IntersectionResult) => {
        console.log('[MarkerPlacement] Surface clicked:', result);

        setPreview({
          position: result.position,
          normal: result.normal,
          elementId: result.elementId,
          elementType: result.entityType,
        });

        setState('confirming');
      };

      // Note: onSurfaceClick should be called from parent, not directly here
      // This effect just tracks state changes
    }
  }, [state, onSurfaceClick, setPreview, setState]);

  // Debug: Handle confirm
  const handleConfirm = async () => {
    if (!preview) {
      console.warn('[MarkerPlacement] No preview data');
      return;
    }

    if (!formData.title.trim()) {
      console.warn('[MarkerPlacement] Title is required');
      return;
    }

    console.log('[MarkerPlacement] Confirming marker creation');

    setState('creating');

    const result = await createMarker({
      project_id: projectId,
      model_id: modelId,
      type: formData.type,
      status: 'open',
      title: formData.title.trim(),
      description: formData.description?.trim() || null,
      position_x: preview.position.x,
      position_y: preview.position.y,
      position_z: preview.position.z,
      normal_x: preview.normal.x,
      normal_y: preview.normal.y,
      normal_z: preview.normal.z,
      element_id: preview.elementId || null,
      element_type: preview.elementType || null,
      floor_id: preview.floorId || null,
      floor_name: preview.floorName || null,
    });

    if (result) {
      console.log('[MarkerPlacement] Marker created successfully');
      reset();
    } else {
      console.error('[MarkerPlacement] Failed to create marker');
      setState('confirming'); // Back to form
    }
  };

  // Debug: Handle cancel
  const handleCancel = () => {
    console.log('[MarkerPlacement] Canceling placement');
    cancelPlacement();
  };

  // Debug: Get icon for marker type
  const getTypeIcon = (type: SpatialMarkerType) => {
    const option = MARKER_TYPES.find((t) => t.value === type);
    return option?.icon || FileText;
  };

  return (
    <div className={cn('relative', className)}>
      {/* Debug: Placement mode button */}
      {!isPlacementMode && (
        <Button
          onClick={startPlacement}
          className="bg-[#001B51] hover:bg-[#001B51]/90 text-white shadow-lg"
          size="lg"
        >
          <MapPin className="w-5 h-5 mr-2" />
          Place Marker
        </Button>
      )}

      {/* Debug: Placement mode active indicator */}
      <AnimatePresence>
        {state === 'placing' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-0 left-0 right-0 md:relative"
          >
            <div className="bg-[#001B51] text-white px-4 py-3 rounded-lg shadow-lg flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <MapPin className="w-5 h-5 animate-pulse" />
                  <div className="absolute inset-0 bg-white/20 rounded-full animate-ping" />
                </div>
                <div>
                  <p className="font-bold text-sm uppercase tracking-wide">Placement Mode Active</p>
                  <p className="text-xs text-white/70">Click on 3D surface to place marker</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                className="text-white hover:bg-white/10"
              >
                <X className="w-4 h-4 mr-1" />
                Cancel
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Debug: Quick form (confirming state) */}
      <AnimatePresence>
        {state === 'confirming' && preview && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm md:absolute md:inset-auto md:top-20 md:left-1/2 md:-translate-x-1/2"
          >
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-md border-2 border-[#001B51]">
              {/* Debug: Header */}
              <div className="bg-gradient-to-r from-[#001B51] to-[#3C3C3C] px-6 py-4 rounded-t-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/10 rounded-lg">
                      <MapPin className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-white uppercase tracking-tight">
                        Create Marker
                      </h3>
                      <p className="text-xs text-white/70">
                        Position: ({preview.position.x.toFixed(2)}, {preview.position.y.toFixed(2)}, {preview.position.z.toFixed(2)})
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Debug: Form */}
              <div className="p-6 space-y-4">
                {/* Debug: Type selector */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-[#001B51] uppercase tracking-wide">
                    Marker Type
                  </label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData({ type: value as SpatialMarkerType })}
                  >
                    <SelectTrigger className="border-2 border-gray-200 focus:border-[#001B51]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MARKER_TYPES.map((type) => {
                        const Icon = type.icon;
                        return (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center gap-2">
                              <Icon className="w-4 h-4" />
                              <span>{type.label}</span>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                {/* Debug: Title input */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-[#001B51] uppercase tracking-wide">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ title: e.target.value })}
                    placeholder="Enter marker title..."
                    maxLength={100}
                    className="border-2 border-gray-200 focus:border-[#001B51]"
                    autoFocus
                  />
                  <p className="text-xs text-gray-500">
                    {formData.title.length}/100 characters
                  </p>
                </div>

                {/* Debug: Description textarea */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-[#001B51] uppercase tracking-wide">
                    Description
                  </label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ description: e.target.value })}
                    placeholder="Add optional description..."
                    rows={3}
                    className="border-2 border-gray-200 focus:border-[#001B51] resize-none"
                  />
                </div>
              </div>

              {/* Debug: Actions */}
              <div className="flex items-center gap-3 px-6 py-4 bg-gray-50 rounded-b-lg border-t">
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isCreating}
                  className="flex-1"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirm}
                  disabled={!formData.title.trim() || isCreating}
                  className="flex-1 bg-[#001B51] hover:bg-[#001B51]/90"
                >
                  {isCreating ? (
                    <>
                      <div className="w-4 h-4 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Create Marker
                    </>
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Debug: Crosshair cursor overlay (placement mode) */}
      {state === 'placing' && (
        <style jsx global>{`
          canvas {
            cursor: crosshair !important;
          }
        `}</style>
      )}
    </div>
  );
}
