'use client';

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
// Performance optimization: Direct imports instead of barrel file (saves 200-800ms per page)
import ZoomIn from 'lucide-react/icons/zoom-in';
import ZoomOut from 'lucide-react/icons/zoom-out';
import RotateCw from 'lucide-react/icons/rotate-cw';
import Move from 'lucide-react/icons/move';
import MapPin from 'lucide-react/icons/map-pin';
import Ruler from 'lucide-react/icons/ruler';
import Download from 'lucide-react/icons/download';
import Layers from 'lucide-react/icons/layers';
import ChevronDown from 'lucide-react/icons/chevron-down';;
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export interface FloorPlan {
  id: string;
  name: string;
  url: string;
  floorIndex: number;
  pixelsPerMeter?: number; // Calibration for measurements
}

export interface FloorPlanMarker {
  id: string;
  title: string;
  description?: string;
  x: number; // Canvas pixel coordinates
  y: number;
  floorIndex: number;
  type: 'issue' | 'note' | 'task' | 'approval';
  status: 'open' | 'in_progress' | 'resolved';
}

export interface FloorPlanViewerProps {
  floorPlans: FloorPlan[];
  markers?: FloorPlanMarker[];
  onMarkerPlaced?: (x: number, y: number, floorIndex: number) => void;
  onMarkerClick?: (marker: FloorPlanMarker) => void;
  placementMode?: boolean;
  className?: string;
}

/**
 * FloorPlanViewer - 2D floor plan viewer with pan/zoom/rotate
 * Fallback when no 3D model is available
 * - Upload floor plans (PNG, JPG, PDF)
 * - 2D canvas with pan/zoom/rotate
 * - Click to place 2D markers (x,y coords, z=floor index)
 * - Multi-floor switcher dropdown
 * - Measurement ruler tool
 * - Export annotated PDF
 */
export function FloorPlanViewer({
  floorPlans,
  markers = [],
  onMarkerPlaced,
  onMarkerClick,
  placementMode = false,
  className,
}: FloorPlanViewerProps) {
  console.log('[FloorPlanViewer] Rendering', {
    floorPlansCount: floorPlans.length,
    markersCount: markers.length,
    placementMode,
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentFloorIndex, setCurrentFloorIndex] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  // Performance optimization: Lazy state initialization to avoid object recreation on every render
  const [pan, setPan] = useState(() => ({ x: 0, y: 0 }));
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState(() => ({ x: 0, y: 0 }));
  const [isRulerMode, setIsRulerMode] = useState(false);
  const [rulerPoints, setRulerPoints] = useState<Array<{ x: number; y: number }>>([]);
  const [floorImage, setFloorImage] = useState<HTMLImageElement | null>(null);

  const currentFloorPlan = floorPlans[currentFloorIndex];

  // Performance optimization: Memoize filtered markers by current floor
  const currentFloorMarkers = useMemo(() =>
    markers.filter((m) => m.floorIndex === currentFloorIndex)
  , [markers, currentFloorIndex]);

  // Load floor plan image
  useEffect(() => {
    if (!currentFloorPlan) return;

    console.log('[FloorPlanViewer] Loading floor plan:', currentFloorPlan.name);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      console.log('[FloorPlanViewer] Floor plan loaded');
      setFloorImage(img);
    };
    img.onerror = () => {
      console.error('[FloorPlanViewer] Failed to load floor plan');
    };
    img.src = currentFloorPlan.url;
  }, [currentFloorPlan]);

  // Draw canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || !floorImage) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to container
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;

    // Clear canvas
    ctx.fillStyle = '#f9fafb';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Save context
    ctx.save();

    // Apply transformations (translate → rotate → scale)
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    ctx.translate(centerX + pan.x, centerY + pan.y);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(zoom, zoom);

    // Draw floor plan image (centered)
    const imgWidth = floorImage.width;
    const imgHeight = floorImage.height;
    ctx.drawImage(floorImage, -imgWidth / 2, -imgHeight / 2, imgWidth, imgHeight);

    // Draw markers
    currentFloorMarkers.forEach((marker) => {
      const markerX = marker.x - imgWidth / 2;
      const markerY = marker.y - imgHeight / 2;

      // Marker pin
      ctx.fillStyle = marker.status === 'resolved' ? '#059669' : '#DC2626';
      ctx.beginPath();
      ctx.arc(markerX, markerY, 8, 0, Math.PI * 2);
      ctx.fill();

      // White border
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Label background
      ctx.fillStyle = 'rgba(0, 27, 81, 0.9)';
      const label = marker.title.substring(0, 20);
      const labelWidth = ctx.measureText(label).width + 16;
      ctx.fillRect(markerX + 12, markerY - 12, labelWidth, 24);

      // Label text
      ctx.fillStyle = '#fff';
      ctx.font = '12px sans-serif';
      ctx.fillText(label, markerX + 20, markerY + 4);
    });

    // Draw ruler line if in ruler mode
    if (isRulerMode && rulerPoints.length > 0) {
      ctx.strokeStyle = '#FFB627';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      rulerPoints.forEach((point, i) => {
        const x = point.x - imgWidth / 2;
        const y = point.y - imgHeight / 2;
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        // Draw point
        ctx.fillStyle = '#FFB627';
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw distance label if 2 points
      if (rulerPoints.length === 2 && currentFloorPlan.pixelsPerMeter) {
        const dx = rulerPoints[1].x - rulerPoints[0].x;
        const dy = rulerPoints[1].y - rulerPoints[0].y;
        const pixelDistance = Math.sqrt(dx * dx + dy * dy);
        const meters = pixelDistance / currentFloorPlan.pixelsPerMeter;

        const midX = (rulerPoints[0].x + rulerPoints[1].x) / 2 - imgWidth / 2;
        const midY = (rulerPoints[0].y + rulerPoints[1].y) / 2 - imgHeight / 2;

        ctx.fillStyle = 'rgba(255, 182, 39, 0.9)';
        ctx.fillRect(midX - 30, midY - 12, 60, 24);
        ctx.fillStyle = '#000';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${meters.toFixed(2)}m`, midX, midY + 4);
        ctx.textAlign = 'left';
      }
    }

    // Restore context
    ctx.restore();
  }, [floorImage, zoom, rotation, pan, currentFloorMarkers, isRulerMode, rulerPoints, currentFloorPlan]);

  // Canvas click handlers
  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas || !floorImage) return;

      const rect = canvas.getBoundingClientRect();
      const canvasX = e.clientX - rect.left;
      const canvasY = e.clientY - rect.top;

      // Transform to image coordinates
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const transformedX = (canvasX - centerX - pan.x) / zoom;
      const transformedY = (canvasY - centerY - pan.y) / zoom;

      // Rotate back
      const cos = Math.cos((-rotation * Math.PI) / 180);
      const sin = Math.sin((-rotation * Math.PI) / 180);
      const rotatedX = transformedX * cos - transformedY * sin;
      const rotatedY = transformedX * sin + transformedY * cos;

      // Convert to image coordinates
      const imgX = rotatedX + floorImage.width / 2;
      const imgY = rotatedY + floorImage.height / 2;

      console.log('[FloorPlanViewer] Canvas clicked at:', { imgX, imgY });

      // Ruler mode
      if (isRulerMode) {
        setRulerPoints((prev) => {
          if (prev.length >= 2) {
            return [{ x: imgX, y: imgY }];
          }
          return [...prev, { x: imgX, y: imgY }];
        });
        return;
      }

      // Check if clicked on existing marker
      const clickedMarker = currentFloorMarkers.find((m) => {
        const dx = m.x - imgX;
        const dy = m.y - imgY;
        return Math.sqrt(dx * dx + dy * dy) < 20 / zoom; // 20px hit radius
      });

      if (clickedMarker) {
        console.log('[FloorPlanViewer] Marker clicked:', clickedMarker.id);
        onMarkerClick?.(clickedMarker);
        return;
      }

      // Placement mode
      if (placementMode && onMarkerPlaced) {
        console.log('[FloorPlanViewer] Marker placed at:', { imgX, imgY, currentFloorIndex });
        onMarkerPlaced(imgX, imgY, currentFloorIndex);
      }
    },
    [
      floorImage,
      zoom,
      rotation,
      pan,
      currentFloorMarkers,
      isRulerMode,
      placementMode,
      onMarkerPlaced,
      onMarkerClick,
      currentFloorIndex,
    ]
  );

  // Pan handlers
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isRulerMode || placementMode) return;
    setIsPanning(true);
    setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  }, [isRulerMode, placementMode, pan]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isPanning) return;
      setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
    },
    [isPanning, panStart]
  );

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  // Zoom controls
  const handleZoomIn = () => setZoom((z) => Math.min(z * 1.2, 5));
  const handleZoomOut = () => setZoom((z) => Math.max(z / 1.2, 0.1));
  const handleRotate = () => setRotation((r) => (r + 90) % 360);
  const handleResetView = () => {
    setZoom(1);
    setRotation(0);
    setPan({ x: 0, y: 0 });
  };

  const handleToggleRuler = () => {
    setIsRulerMode((prev) => !prev);
    setRulerPoints([]);
  };

  const handleExportPDF = async () => {
    console.log('[FloorPlanViewer] Exporting annotated PDF');
    // TODO: Implement PDF export with markers
    alert('PDF export coming soon!');
  };

  if (floorPlans.length === 0) {
    return (
      <div className={cn('relative w-full h-full bg-gray-50 flex items-center justify-center', className)}>
        <div className="text-center">
          <Layers className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 font-semibold">No floor plans uploaded</p>
          <p className="text-sm text-gray-500 mt-1">Upload a floor plan to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('relative w-full h-full bg-gray-50', className)} ref={containerRef}>
      {/* Floor Plan Canvas */}
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className={cn(
          'w-full h-full',
          isPanning ? 'cursor-grabbing' : placementMode ? 'cursor-crosshair' : isRulerMode ? 'cursor-crosshair' : 'cursor-grab'
        )}
      />

      {/* Floor Switcher */}
      <div className="absolute top-4 left-4 z-20">
        <Card className="border-2 border-gray-200 shadow-construction bg-white">
          <button className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 transition-colors">
            <Layers className="w-4 h-4 text-[#001B51]" />
            <span className="font-semibold text-sm">{currentFloorPlan.name}</span>
            {floorPlans.length > 1 && <ChevronDown className="w-4 h-4 text-gray-400" />}
          </button>

          {floorPlans.length > 1 && (
            <div className="border-t-2 border-gray-200">
              {floorPlans.map((plan, index) => (
                <button
                  key={plan.id}
                  onClick={() => setCurrentFloorIndex(index)}
                  className={cn(
                    'w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors',
                    index === currentFloorIndex ? 'bg-blue-50 text-[#001B51] font-semibold' : ''
                  )}
                >
                  {plan.name}
                </button>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Controls */}
      <div className="absolute top-4 right-4 z-20 space-y-2">
        {/* Zoom Controls */}
        <Card className="border-2 border-gray-200 shadow-construction bg-white p-2 space-y-2">
          <button
            onClick={handleZoomIn}
            className="w-full p-2 hover:bg-gray-100 rounded transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-5 h-5 text-[#001B51] mx-auto" />
          </button>
          <button
            onClick={handleZoomOut}
            className="w-full p-2 hover:bg-gray-100 rounded transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-5 h-5 text-[#001B51] mx-auto" />
          </button>
          <button
            onClick={handleRotate}
            className="w-full p-2 hover:bg-gray-100 rounded transition-colors"
            title="Rotate 90°"
          >
            <RotateCw className="w-5 h-5 text-[#001B51] mx-auto" />
          </button>
          <button
            onClick={handleResetView}
            className="w-full p-2 hover:bg-gray-100 rounded transition-colors"
            title="Reset View"
          >
            <Move className="w-5 h-5 text-[#001B51] mx-auto" />
          </button>
        </Card>

        {/* Tool Controls */}
        <Card className="border-2 border-gray-200 shadow-construction bg-white p-2 space-y-2">
          <button
            onClick={handleToggleRuler}
            className={cn(
              'w-full p-2 rounded transition-colors',
              isRulerMode ? 'bg-[#FFB627] text-white' : 'hover:bg-gray-100'
            )}
            title="Measure Distance"
          >
            <Ruler className={cn('w-5 h-5 mx-auto', isRulerMode ? 'text-white' : 'text-[#001B51]')} />
          </button>
          <button
            onClick={handleExportPDF}
            className="w-full p-2 hover:bg-gray-100 rounded transition-colors"
            title="Export PDF"
          >
            <Download className="w-5 h-5 text-[#001B51] mx-auto" />
          </button>
        </Card>
      </div>

      {/* Status Badge */}
      <div className="absolute bottom-4 left-4 z-20">
        <Badge className="bg-[#001B51] text-white px-3 py-1.5 text-xs font-mono">
          Zoom: {(zoom * 100).toFixed(0)}% | Rotation: {rotation}° | Markers: {currentFloorMarkers.length}
        </Badge>
      </div>

      {/* Placement Mode Hint */}
      {placementMode && (
        <div className="absolute bottom-4 right-4 z-20">
          <Card className="border-2 border-[#001B51] shadow-construction bg-white px-4 py-2">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#001B51]" />
              <span className="text-sm font-semibold text-[#001B51]">Click to place marker</span>
            </div>
          </Card>
        </div>
      )}

      {/* Ruler Mode Hint */}
      {isRulerMode && (
        <div className="absolute bottom-4 right-4 z-20">
          <Card className="border-2 border-[#FFB627] shadow-construction bg-white px-4 py-2">
            <div className="flex items-center gap-2">
              <Ruler className="w-4 h-4 text-[#FFB627]" />
              <span className="text-sm font-semibold text-[#FFB627]">
                {rulerPoints.length === 0
                  ? 'Click first point'
                  : rulerPoints.length === 1
                  ? 'Click second point'
                  : 'Measurement complete'}
              </span>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
