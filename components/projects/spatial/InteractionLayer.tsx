'use client';

// Debug: Interaction layer for 3D viewer
// P2.7 - Click detection, highlighting, tooltips

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Box, MousePointer2 } from 'lucide-react';
import type { Viewer } from '@xeokit/xeokit-sdk';
import { use3DInteraction } from '@/lib/hooks/use-3d-interaction';
import type { IntersectionResult } from '@/lib/hooks/use-3d-interaction';
import { cn } from '@/lib/utils';

// Debug: Component props (enhanced for Phase 3)
export interface InteractionLayerProps {
  viewer: Viewer | null;
  userRole?: string; // NEW: Permission control
  onCanvasClick?: (event: CanvasClickEvent) => void; // NEW: Unified click handler
  onElementClick?: (result: IntersectionResult) => void; // Legacy: kept for backwards compatibility
  onSurfaceClick?: (position: { x: number; y: number; z: number }, normal: { x: number; y: number; z: number }) => void; // Legacy
  className?: string;
}

// Debug: Canvas click event (for Phase 3 context menu)
export interface CanvasClickEvent {
  screenX: number;
  screenY: number;
  worldPosition: { x: number; y: number; z: number };
  normal: { x: number; y: number; z: number };
  elementId?: string;
}

/**
 * InteractionLayer - 3D object interaction overlay (Phase 3 enhanced)
 * Features:
 * - Click/tap detection on 3D elements
 * - Right-click for context menu (GC/PM only)
 * - Highlighted elements with auto-fade
 * - Hover tooltip with element name (desktop)
 * - Touch-hold for element info (mobile)
 */
export function InteractionLayer({
  viewer,
  userRole,
  onCanvasClick,
  onElementClick,
  onSurfaceClick,
  className,
}: InteractionLayerProps) {
  console.log('[InteractionLayer] Rendering Phase 3', { viewer, userRole });

  // Debug: Permission check for context menu
  const canEditMarkers = userRole === 'admin' || userRole === 'project_manager';

  // Debug: Use interaction hook (legacy)
  const { hoveredElement, highlightedElement, setupInteraction, clearInteraction } =
    use3DInteraction({
      onElementClick,
      onSurfaceClick,
      highlightDuration: 2000,
      touchHoldDuration: 1000,
    });

  // Debug: Setup right-click handler for context menu (Phase 3)
  useEffect(() => {
    if (!viewer || !onCanvasClick || !canEditMarkers) return;

    const canvas = viewer.scene.canvas.canvas;

    const handleRightClick = (e: MouseEvent) => {
      e.preventDefault();
      console.log('[InteractionLayer] Right-click detected', { x: e.clientX, y: e.clientY });

      const canvasRect = canvas.getBoundingClientRect();
      const screenX = e.clientX - canvasRect.left;
      const screenY = e.clientY - canvasRect.top;

      // Raycast to get 3D position
      const pickResult = viewer.scene.pick({
        canvasPos: [screenX, screenY],
        pickSurface: true,
      });

      console.log('[InteractionLayer] Pick result:', pickResult);

      if (pickResult && pickResult.worldPos && pickResult.worldNormal) {
        const event: CanvasClickEvent = {
          screenX: e.clientX,
          screenY: e.clientY,
          worldPosition: {
            x: pickResult.worldPos[0],
            y: pickResult.worldPos[1],
            z: pickResult.worldPos[2],
          },
          normal: {
            x: pickResult.worldNormal[0],
            y: pickResult.worldNormal[1],
            z: pickResult.worldNormal[2],
          },
          elementId: pickResult.entity?.id,
        };

        onCanvasClick(event);
      }
    };

    canvas.addEventListener('contextmenu', handleRightClick);
    console.log('[InteractionLayer] Right-click handler registered');

    return () => {
      canvas.removeEventListener('contextmenu', handleRightClick);
      console.log('[InteractionLayer] Right-click handler removed');
    };
  }, [viewer, onCanvasClick, canEditMarkers]);

  // Debug: Phase 6 - Touch gesture controls for mobile
  useEffect(() => {
    if (!viewer) return;

    const canvas = viewer.scene.canvas.canvas;
    if (!canvas) return;

    let touchStartTime = 0;
    let touchTimer: NodeJS.Timeout | null = null;
    let initialDistance = 0;
    let initialMidpoint = { x: 0, y: 0 };
    let lastTouchPos = { x: 0, y: 0 };

    // Single touch start (potential long-press or drag)
    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      console.log('[InteractionLayer] Touch start:', e.touches.length, 'touches');

      if (e.touches.length === 1) {
        // Start long-press timer
        touchStartTime = Date.now();
        lastTouchPos = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
        };

        touchTimer = setTimeout(() => {
          handleLongPress(e.touches[0]);
        }, 500);
      } else if (e.touches.length === 2) {
        // Two-finger gesture (pinch/pan)
        if (touchTimer) clearTimeout(touchTimer);

        const touch1 = e.touches[0];
        const touch2 = e.touches[1];

        // Calculate initial distance (for pinch)
        initialDistance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY
        );

        // Calculate midpoint (for pan)
        initialMidpoint = {
          x: (touch1.clientX + touch2.clientX) / 2,
          y: (touch1.clientY + touch2.clientY) / 2,
        };
      }
    };

    // Touch move (rotate/zoom/pan)
    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();

      // Cancel long-press if moved
      if (touchTimer) {
        clearTimeout(touchTimer);
        touchTimer = null;
      }

      if (e.touches.length === 1) {
        // Single finger drag: rotate camera
        const touch = e.touches[0];
        const movementX = touch.clientX - lastTouchPos.x;
        const movementY = touch.clientY - lastTouchPos.y;

        // xeokit SDK methods not in type definitions
        const cameraControl = viewer.cameraControl as unknown as {
          orbitYaw: (amount: number) => void;
          orbitPitch: (amount: number) => void;
        };
        cameraControl.orbitYaw(movementX * 0.5);
        cameraControl.orbitPitch(movementY * 0.5);

        lastTouchPos = {
          x: touch.clientX,
          y: touch.clientY,
        };

        console.log('[InteractionLayer] Single finger drag - rotate camera');
      } else if (e.touches.length === 2) {
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];

        // Calculate current distance (for pinch)
        const currentDistance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY
        );

        // xeokit SDK methods not in type definitions
        const cameraControl = viewer.cameraControl as unknown as {
          dolly: (amount: number) => void;
          pan: (delta: [number, number, number]) => void;
        };

        // Pinch zoom
        const zoomDelta = (currentDistance - initialDistance) * 0.01;
        cameraControl.dolly(-zoomDelta);
        initialDistance = currentDistance;

        // Calculate current midpoint (for pan)
        const currentMidpoint = {
          x: (touch1.clientX + touch2.clientX) / 2,
          y: (touch1.clientY + touch2.clientY) / 2,
        };

        // Pan
        const panX = currentMidpoint.x - initialMidpoint.x;
        const panY = currentMidpoint.y - initialMidpoint.y;

        cameraControl.pan([panX * 0.1, panY * 0.1, 0]);
        initialMidpoint = currentMidpoint;

        console.log('[InteractionLayer] Two finger gesture - pinch/pan');
      }
    };

    // Touch end (tap or cancel long-press)
    const handleTouchEnd = (e: TouchEvent) => {
      if (touchTimer) {
        clearTimeout(touchTimer);
        touchTimer = null;

        // Short tap (click)
        if (Date.now() - touchStartTime < 500 && e.changedTouches.length === 1) {
          handleTap(e.changedTouches[0]);
        }
      }
    };

    // Long-press handler (context menu for GC/PM)
    const handleLongPress = (touch: Touch) => {
      console.log('[InteractionLayer] Long-press detected');

      if (!canEditMarkers) {
        console.log('[InteractionLayer] User role does not have edit permission');
        return;
      }

      const canvasRect = canvas.getBoundingClientRect();
      const screenX = touch.clientX - canvasRect.left;
      const screenY = touch.clientY - canvasRect.top;

      const pickResult = viewer.scene.pick({
        canvasPos: [screenX, screenY],
        pickSurface: true,
      });

      if (pickResult && pickResult.worldPos && pickResult.worldNormal && onCanvasClick) {
        const event: CanvasClickEvent = {
          screenX: touch.clientX,
          screenY: touch.clientY,
          worldPosition: {
            x: pickResult.worldPos[0],
            y: pickResult.worldPos[1],
            z: pickResult.worldPos[2],
          },
          normal: {
            x: pickResult.worldNormal[0],
            y: pickResult.worldNormal[1],
            z: pickResult.worldNormal[2],
          },
          elementId: pickResult.entity?.id,
        };

        onCanvasClick(event);
      }
    };

    // Tap handler
    const handleTap = (touch: Touch) => {
      console.log('[InteractionLayer] Tap detected');

      const canvasRect = canvas.getBoundingClientRect();
      const screenX = touch.clientX - canvasRect.left;
      const screenY = touch.clientY - canvasRect.top;

      const pickResult = viewer.scene.pick({
        canvasPos: [screenX, screenY],
        pickSurface: false,
      });

      // Check if tapped on a marker (handled by marker component)
      console.log('[InteractionLayer] Tap pick result:', pickResult);
    };

    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });

    console.log('[InteractionLayer] Touch gesture handlers registered');

    return () => {
      if (touchTimer) clearTimeout(touchTimer);
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
      console.log('[InteractionLayer] Touch gesture handlers removed');
    };
  }, [viewer, canEditMarkers, onCanvasClick]);

  // Debug: Setup interaction when viewer ready (legacy)
  useEffect(() => {
    if (viewer) {
      console.log('[InteractionLayer] Setting up interaction');
      setupInteraction(viewer);

      return () => {
        console.log('[InteractionLayer] Clearing interaction');
        clearInteraction();
      };
    }
  }, [viewer, setupInteraction, clearInteraction]);

  return (
    <div className={cn('pointer-events-none absolute inset-0 z-20', className)}>
      {/* Debug: Hover tooltip (desktop) */}
      <AnimatePresence>
        {hoveredElement && (
          <motion.div
            key={hoveredElement.elementId}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.15 }}
            className="absolute"
            style={{
              left: hoveredElement.position.x + 12,
              top: hoveredElement.position.y + 12,
            }}
          >
            <div className="bg-construction-blue text-white px-3 py-2 rounded-lg shadow-construction flex items-center gap-2 max-w-xs">
              <Box className="w-4 h-4 shrink-0" />
              <div className="text-xs">
                <p className="font-bold leading-none">{hoveredElement.elementName}</p>
                <p className="text-white/70 text-[10px] mt-1 font-mono">
                  ID: {hoveredElement.elementId.slice(0, 8)}...
                </p>
              </div>
            </div>

            {/* Debug: Tooltip arrow */}
            <div
              className="absolute w-2 h-2 bg-construction-blue transform rotate-45"
              style={{
                left: -4,
                top: 12,
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Debug: Highlight indicator */}
      <AnimatePresence>
        {highlightedElement && (
          <motion.div
            key="highlight-indicator"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="absolute top-4 left-1/2 transform -translate-x-1/2"
          >
            <div className="bg-white border-2 border-construction-blue rounded-lg px-4 py-2 shadow-construction flex items-center gap-2">
              <MousePointer2 className="w-4 h-4 text-construction-blue" />
              <div className="text-xs">
                <p className="font-black text-construction-blue uppercase tracking-tight leading-none">
                  Element Selected
                </p>
                <p className="text-gray-600 text-[10px] mt-0.5 font-mono">
                  {highlightedElement.slice(0, 12)}...
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Debug: Click instruction hint (show only on first load) */}
      {!hoveredElement && !highlightedElement && (
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 md:bottom-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.5 }}
            className="bg-white/90 backdrop-blur-sm border border-gray-300 rounded-lg px-3 py-2 shadow-sm"
          >
            <p className="text-xs text-gray-600 flex items-center gap-2">
              <MousePointer2 className="w-3 h-3" />
              <span className="hidden md:inline">Click on elements to select</span>
              <span className="md:hidden">Tap elements to select</span>
            </p>
          </motion.div>
        </div>
      )}
    </div>
  );
}
