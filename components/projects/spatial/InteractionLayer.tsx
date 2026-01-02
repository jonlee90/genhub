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

// Debug: Component props
export interface InteractionLayerProps {
  viewer: Viewer | null;
  onElementClick?: (result: IntersectionResult) => void;
  onSurfaceClick?: (position: { x: number; y: number; z: number }, normal: { x: number; y: number; z: number }) => void;
  className?: string;
}

/**
 * InteractionLayer - 3D object interaction overlay
 * Features:
 * - Click/tap detection on 3D elements
 * - Highlighted elements with auto-fade
 * - Hover tooltip with element name (desktop)
 * - Touch-hold for element info (mobile)
 */
export function InteractionLayer({
  viewer,
  onElementClick,
  onSurfaceClick,
  className,
}: InteractionLayerProps) {
  console.log('[InteractionLayer] Rendering', { viewer });

  // Debug: Use interaction hook
  const { hoveredElement, highlightedElement, setupInteraction, clearInteraction } =
    use3DInteraction({
      onElementClick,
      onSurfaceClick,
      highlightDuration: 2000,
      touchHoldDuration: 1000,
    });

  // Debug: Setup interaction when viewer ready
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
