'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import type { Viewer } from '@xeokit/xeokit-sdk';
import { ThreeDViewerCanvas } from './3DViewerCanvas';
import { CameraControls } from './CameraControls';
import { MessageSquare, Eye, Info, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { SpatialMarker } from '@/types/spatial';

export interface ClientSpatialViewerProps {
  projectId: string;
  modelHighURL?: string | null;
  thumbnailURL?: string;
  markers: SpatialMarker[];
  onRequestInformation?: (markerId: string, message: string) => Promise<void>;
  className?: string;
}

/**
 * ClientSpatialViewer - Read-only 3D viewer for client portal
 * - Filters markers: only shows is_client_visible = true
 * - Hide all edit/create/delete UI
 * - "Request Information" button creates client note
 * - Simplified controls, tablet/iPad optimized
 */
export function ClientSpatialViewer({
  projectId,
  modelHighURL,
  thumbnailURL,
  markers,
  onRequestInformation,
  className,
}: ClientSpatialViewerProps) {
  console.log('[ClientSpatialViewer] Rendering', {
    projectId,
    modelHighURL,
    markerCount: markers.length,
  });

  const [viewer, setViewer] = useState<Viewer | null>(null);
  const [isModelReady, setIsModelReady] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState<SpatialMarker | null>(null);
  const [requestMessage, setRequestMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRequestDialog, setShowRequestDialog] = useState(false);

  // Filter markers: only show client-visible ones
  const clientVisibleMarkers = useMemo(() => {
    console.log('[ClientSpatialViewer] Filtering client-visible markers');
    return markers.filter((m) => m.is_client_visible === true);
  }, [markers]);

  const handleViewerReady = useCallback((viewerInstance: Viewer) => {
    console.log('[ClientSpatialViewer] Viewer ready');
    setViewer(viewerInstance);
    setIsModelReady(true);
  }, []);

  const handleMarkerClick = useCallback((marker: SpatialMarker) => {
    console.log('[ClientSpatialViewer] Marker clicked:', marker.id);
    setSelectedMarker(marker);
    setShowRequestDialog(false);
    setRequestMessage('');
  }, []);

  const handleRequestInfo = useCallback(
    async (marker: SpatialMarker) => {
      console.log('[ClientSpatialViewer] Request information for marker:', marker.id);
      setSelectedMarker(marker);
      setShowRequestDialog(true);
    },
    []
  );

  const handleSubmitRequest = useCallback(async () => {
    if (!selectedMarker || !requestMessage.trim()) return;

    console.log('[ClientSpatialViewer] Submitting request:', {
      markerId: selectedMarker.id,
      message: requestMessage,
    });

    setIsSubmitting(true);

    try {
      if (onRequestInformation) {
        await onRequestInformation(selectedMarker.id, requestMessage);
      }

      setShowRequestDialog(false);
      setRequestMessage('');
      setSelectedMarker(null);
    } catch (err) {
      console.error('[ClientSpatialViewer] Request submission error:', err);
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedMarker, requestMessage, onRequestInformation]);

  const getMarkerIcon = (type: string) => {
    switch (type) {
      case 'issue':
        return '⚠️';
      case 'note':
        return '📝';
      case 'task':
        return '✓';
      case 'approval':
        return '⏱️';
      default:
        return '📍';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-gray-400 text-white';
      case 'in_progress':
        return 'bg-[#FFB627] text-gray-900';
      case 'resolved':
        return 'bg-[#059669] text-white';
      default:
        return 'bg-gray-400 text-white';
    }
  };

  return (
    <div className={cn('relative w-full h-full bg-gray-50', className)}>
      {/* Client View Badge */}
      <div className="absolute top-4 left-4 z-30 bg-[#001B51] text-white px-4 py-2 rounded-lg shadow-lg">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4" />
          <span className="text-sm font-bold uppercase tracking-wide">Client View</span>
        </div>
      </div>

      {/* 3D Viewer Canvas */}
      <ThreeDViewerCanvas
        projectId={projectId}
        modelUrl={modelHighURL}
        onReady={handleViewerReady}
        className="absolute inset-0"
      />

      {/* Camera Controls (Read-only) */}
      {viewer && isModelReady && <CameraControls viewer={viewer} />}

      {/* Client-Visible Markers Panel */}
      {isModelReady && (
        <div className="absolute bottom-4 left-4 right-4 md:left-4 md:right-auto md:w-96 z-20">
          <Card className="border-2 border-gray-200 shadow-construction bg-white">
            <div className="border-b-2 border-gray-200 bg-gray-50 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#001B51] rounded-lg">
                  <Info className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 uppercase tracking-tight text-sm">
                    Project Information
                  </h3>
                  <p className="text-xs text-gray-500 font-mono">
                    {clientVisibleMarkers.length} items
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 space-y-2 max-h-[400px] overflow-y-auto">
              {clientVisibleMarkers.length === 0 ? (
                <div className="text-center py-8">
                  <Info className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">No information markers</p>
                </div>
              ) : (
                clientVisibleMarkers.map((marker) => (
                  <button
                    key={marker.id}
                    onClick={() => handleMarkerClick(marker)}
                    className={cn(
                      'w-full p-3 rounded-lg border-2 text-left transition-all',
                      'hover:border-[#001B51] hover:bg-blue-50/30',
                      selectedMarker?.id === marker.id
                        ? 'border-[#001B51] bg-blue-50/50'
                        : 'border-gray-200'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl flex-shrink-0">
                        {getMarkerIcon(marker.type)}
                      </span>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className="font-semibold text-sm text-gray-900">
                            {marker.title}
                          </h4>
                          <Badge
                            className={cn('text-xs px-2 py-0.5', getStatusColor(marker.status))}
                          >
                            {marker.status}
                          </Badge>
                        </div>

                        {marker.description && (
                          <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                            {marker.description}
                          </p>
                        )}

                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRequestInfo(marker);
                            }}
                            className={cn(
                              'px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wide',
                              'bg-[#001B51] text-white hover:bg-[#002666] transition-colors',
                              'flex items-center gap-1.5'
                            )}
                          >
                            <MessageSquare className="w-3 h-3" />
                            Request Info
                          </button>
                        </div>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Request Information Dialog */}
      {showRequestDialog && selectedMarker && (
        <div className="absolute inset-0 z-40 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="border-2 border-gray-200 shadow-construction bg-white max-w-md w-full">
            <div className="border-b-2 border-gray-200 bg-gray-50 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#001B51] rounded-lg">
                  <MessageSquare className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 uppercase tracking-tight text-sm">
                    Request Information
                  </h3>
                  <p className="text-xs text-gray-500 font-mono">{selectedMarker.title}</p>
                </div>
              </div>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Your Message
                </label>
                <textarea
                  value={requestMessage}
                  onChange={(e) => setRequestMessage(e.target.value)}
                  placeholder="What would you like to know about this item?"
                  rows={4}
                  className={cn(
                    'w-full px-3 py-2 rounded-lg',
                    'border-2 border-gray-200 focus:border-[#001B51] focus:outline-none',
                    'text-sm resize-none'
                  )}
                  disabled={isSubmitting}
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowRequestDialog(false);
                    setRequestMessage('');
                  }}
                  disabled={isSubmitting}
                  className={cn(
                    'flex-1 px-4 py-2 rounded-lg font-semibold text-sm uppercase tracking-wide',
                    'bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors',
                    'disabled:opacity-50 disabled:cursor-not-allowed'
                  )}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitRequest}
                  disabled={!requestMessage.trim() || isSubmitting}
                  className={cn(
                    'flex-1 px-4 py-2 rounded-lg font-semibold text-sm uppercase tracking-wide',
                    'bg-[#001B51] text-white hover:bg-[#002666] transition-colors',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    'flex items-center justify-center gap-2'
                  )}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send Request
                    </>
                  )}
                </button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
