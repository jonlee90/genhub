'use client';

// Debug: Camera control UI for 3D viewer
// P2.3 - Camera presets, fit-to-view, reset, first-person mode, URL persistence

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
// Performance optimization: Direct imports instead of barrel file (saves 200-800ms per page)
import Maximize2 from 'lucide-react/icons/maximize-2';
import RotateCw from 'lucide-react/icons/rotate-cw';
import Home from 'lucide-react/icons/home';
import Eye from 'lucide-react/icons/eye';
import Box from 'lucide-react/icons/box';
import ArrowUpRight from 'lucide-react/icons/arrow-up-right';
import Square from 'lucide-react/icons/square';
import Layers from 'lucide-react/icons/layers';
import type { Viewer } from '@xeokit/xeokit-sdk';
import { getCameraPreset, updateCameraURL } from '@/lib/xeokit/camera-presets';
import type { CameraPreset } from '@/lib/xeokit/camera-presets';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

// Debug: Component props
export interface CameraControlsProps {
  viewer: Viewer | null;
  className?: string;
}

/**
 * CameraControls - UI for camera navigation
 * Features:
 * - Preset views (Top, Front, Side, Isometric)
 * - Fit to view
 * - Reset camera
 * - First-person mode toggle
 * - URL persistence for sharing
 */
export function CameraControls({ viewer, className }: CameraControlsProps) {
  console.log('[CameraControls] Rendering', { viewer });

  // Debug: State
  const [isFirstPerson, setIsFirstPerson] = useState(false);
  const [activePreset, setActivePreset] = useState<CameraPreset | null>(null);

  // Debug: Apply camera preset
  const applyPreset = useCallback(
    (preset: CameraPreset) => {
      console.log('[CameraControls] Applying preset', preset);

      if (!viewer || !viewer.scene) {
        console.warn('[CameraControls] Viewer not ready');
        return;
      }

      // Debug: Get model bounds
      const aabb = viewer.scene.getAABB();
      if (!aabb || aabb.length !== 6) {
        console.warn('[CameraControls] Invalid AABB', aabb);
        return;
      }

      // Debug: Get preset params
      const params = getCameraPreset(preset, aabb);

      // Debug: Fly camera to preset
      viewer.cameraFlight.flyTo(params, () => {
        console.log('[CameraControls] Camera flight complete', preset);

        // Debug: Update URL for sharing
        if (params.eye && params.look) {
          updateCameraURL(params.eye, params.look);
        }
      });

      setActivePreset(preset);
    },
    [viewer]
  );

  // Debug: Fit all objects to view
  const fitToView = useCallback(() => {
    console.log('[CameraControls] Fit to view');

    if (!viewer || !viewer.scene) {
      console.warn('[CameraControls] Viewer not ready');
      return;
    }

    const aabb = viewer.scene.getAABB();
    if (!aabb || aabb.length !== 6) {
      console.warn('[CameraControls] Invalid AABB', aabb);
      return;
    }

    viewer.cameraFlight.flyTo({
      aabb,
      duration: 0.8,
    });

    setActivePreset(null);
  }, [viewer]);

  // Debug: Reset camera to initial view
  const resetCamera = useCallback(() => {
    console.log('[CameraControls] Reset camera');
    applyPreset('reset');
  }, [applyPreset]);

  // Debug: Toggle first-person navigation mode
  const toggleFirstPerson = useCallback(() => {
    console.log('[CameraControls] Toggle first-person mode');

    if (!viewer || !viewer.cameraControl) {
      console.warn('[CameraControls] Viewer not ready');
      return;
    }

    const newMode = !isFirstPerson;
    setIsFirstPerson(newMode);

    // Debug: Switch camera control mode
    viewer.cameraControl.navMode = newMode ? 'firstPerson' : 'orbit';
    console.log('[CameraControls] Navigation mode', viewer.cameraControl.navMode);
  }, [viewer, isFirstPerson]);

  // Debug: Desktop layout - fixed top-right panel
  return (
    <div className={cn('absolute top-4 right-4 z-10', className)}>
      {/* Debug: Mobile - bottom sheet with dropdown */}
      <div className="md:hidden">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="lg"
              className="bg-white border-2 border-construction-blue text-construction-blue hover:bg-construction-blue hover:text-white shadow-construction min-w-[44px] min-h-[44px]"
            >
              <Box className="w-5 h-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={() => applyPreset('top')}>
              <ArrowUpRight className="w-4 h-4 mr-2" />
              Top View
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => applyPreset('front')}>
              <Square className="w-4 h-4 mr-2" />
              Front View
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => applyPreset('side')}>
              <Square className="w-4 h-4 mr-2 rotate-90" />
              Side View
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => applyPreset('isometric')}>
              <Layers className="w-4 h-4 mr-2" />
              Isometric View
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={fitToView}>
              <Maximize2 className="w-4 h-4 mr-2" />
              Fit to View
            </DropdownMenuItem>
            <DropdownMenuItem onClick={resetCamera}>
              <Home className="w-4 h-4 mr-2" />
              Reset Camera
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={toggleFirstPerson}>
              <Eye className="w-4 h-4 mr-2" />
              {isFirstPerson ? 'Orbit Mode' : 'First-Person Mode'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Debug: Desktop - expanded control panel */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        className="hidden md:flex flex-col gap-2 bg-white border-2 border-construction-blue rounded-lg p-3 shadow-construction"
      >
        {/* Debug: Preset views grid */}
        <div className="grid grid-cols-2 gap-2 pb-2 border-b-2 border-gray-200">
          <Button
            size="sm"
            variant={activePreset === 'top' ? 'default' : 'outline'}
            onClick={() => applyPreset('top')}
            className={cn(
              'flex flex-col items-center gap-1 h-auto py-2',
              activePreset === 'top' && 'bg-construction-blue text-white'
            )}
            title="Top View (Z-axis)"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span className="text-xs font-bold">TOP</span>
          </Button>

          <Button
            size="sm"
            variant={activePreset === 'front' ? 'default' : 'outline'}
            onClick={() => applyPreset('front')}
            className={cn(
              'flex flex-col items-center gap-1 h-auto py-2',
              activePreset === 'front' && 'bg-construction-blue text-white'
            )}
            title="Front View (Y-axis)"
          >
            <Square className="w-4 h-4" />
            <span className="text-xs font-bold">FRONT</span>
          </Button>

          <Button
            size="sm"
            variant={activePreset === 'side' ? 'default' : 'outline'}
            onClick={() => applyPreset('side')}
            className={cn(
              'flex flex-col items-center gap-1 h-auto py-2',
              activePreset === 'side' && 'bg-construction-blue text-white'
            )}
            title="Side View (X-axis)"
          >
            <Square className="w-4 h-4 rotate-90" />
            <span className="text-xs font-bold">SIDE</span>
          </Button>

          <Button
            size="sm"
            variant={activePreset === 'isometric' ? 'default' : 'outline'}
            onClick={() => applyPreset('isometric')}
            className={cn(
              'flex flex-col items-center gap-1 h-auto py-2',
              activePreset === 'isometric' && 'bg-construction-blue text-white'
            )}
            title="Isometric View (3D)"
          >
            <Layers className="w-4 h-4" />
            <span className="text-xs font-bold">ISO</span>
          </Button>
        </div>

        {/* Debug: Utility controls */}
        <div className="flex flex-col gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={fitToView}
            className="flex items-center justify-start gap-2 text-xs font-bold"
          >
            <Maximize2 className="w-4 h-4" />
            Fit to View
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={resetCamera}
            className="flex items-center justify-start gap-2 text-xs font-bold"
          >
            <Home className="w-4 h-4" />
            Reset Camera
          </Button>

          <Button
            size="sm"
            variant={isFirstPerson ? 'default' : 'outline'}
            onClick={toggleFirstPerson}
            className={cn(
              'flex items-center justify-start gap-2 text-xs font-bold',
              isFirstPerson && 'bg-construction-blue text-white'
            )}
          >
            <Eye className="w-4 h-4" />
            {isFirstPerson ? 'Orbit Mode' : 'First-Person'}
          </Button>
        </div>

        {/* Debug: Keyboard hints */}
        <div className="pt-2 border-t-2 border-gray-200">
          <p className="text-[10px] text-gray-500 font-mono uppercase tracking-wider mb-1">
            Keyboard
          </p>
          <div className="space-y-0.5 text-[10px] text-gray-600">
            <p>
              <kbd className="px-1 bg-gray-100 border border-gray-300 rounded text-[9px]">
                WASD
              </kbd>{' '}
              Move
            </p>
            <p>
              <kbd className="px-1 bg-gray-100 border border-gray-300 rounded text-[9px]">
                +/-
              </kbd>{' '}
              Zoom
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
