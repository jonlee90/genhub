'use client';

// Debug: LOD manager component with adaptive switching and FPS monitoring
// P2.6 - Dynamic Level of Detail management

import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// Performance optimization: Direct imports instead of barrel file (saves 200-800ms per page)
import Gauge from 'lucide-react/icons/gauge';
import Zap from 'lucide-react/icons/zap';
import Settings from 'lucide-react/icons/settings';;
import type { Viewer } from '@xeokit/xeokit-sdk';
import {
  selectLOD,
  getDeviceCapabilities,
  calculateCameraDistance,
  getLODModelURL,
  FPSMonitor,
} from '@/lib/xeokit/lod-selector';
import type { LODLevel } from '@/lib/xeokit/lod-selector';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';

// Debug: Component props
export interface LODManagerProps {
  viewer: Viewer | null;
  highURL: string;
  mediumURL: string | null;
  lowURL: string | null;
  onLODChange?: (level: LODLevel) => void;
  className?: string;
}

/**
 * LODManager - Adaptive Level of Detail management
 * Features:
 * - Dynamic LOD switching based on camera distance
 * - Device capability detection
 * - FPS monitoring with adaptive downgrade
 * - Manual override
 * - Smooth crossfade transitions
 */
export function LODManager({
  viewer,
  highURL,
  mediumURL,
  lowURL,
  onLODChange,
  className,
}: LODManagerProps) {
  console.log('[LODManager] Rendering', { viewer, highURL, mediumURL, lowURL });

  // Debug: State
  const [currentLOD, setCurrentLOD] = useState<LODLevel>('high');
  const [manualOverride, setManualOverride] = useState<LODLevel | null>(null);
  const [currentFPS, setCurrentFPS] = useState<number>(60);
  const [showIndicator, setShowIndicator] = useState(true);

  // Debug: Refs
  const fpsMonitorRef = useRef<FPSMonitor | null>(null);
  const capabilitiesRef = useRef(getDeviceCapabilities());

  // Debug: Initialize FPS monitor
  useEffect(() => {
    console.log('[LODManager] Initializing FPS monitor');

    const monitor = new FPSMonitor();
    monitor.start();
    fpsMonitorRef.current = monitor;

    // Debug: Update FPS every second
    const interval = setInterval(() => {
      const fps = monitor.getAverageFPS();
      setCurrentFPS(fps);
    }, 1000);

    return () => {
      console.log('[LODManager] Cleanup FPS monitor');
      clearInterval(interval);
      monitor.stop();
    };
  }, []);

  // Debug: Monitor camera distance and update LOD
  useEffect(() => {
    if (!viewer || !viewer.camera || !viewer.scene) {
      console.log('[LODManager] Viewer not ready');
      return;
    }

    console.log('[LODManager] Setting up camera monitor');

    let animationFrameId: number;

    const checkLOD = () => {
      try {
        // Debug: Get camera position
        const cameraPos = viewer.camera.eye;

        // Debug: Get model bounds
        const modelBounds = viewer.scene.getAABB();

        if (!modelBounds || modelBounds.length !== 6) {
          console.warn('[LODManager] Invalid model bounds');
          animationFrameId = requestAnimationFrame(checkLOD);
          return;
        }

        // Debug: Calculate distance
        const distance = calculateCameraDistance(cameraPos, modelBounds);

        // Debug: Select appropriate LOD
        const newLOD = selectLOD({
          distance,
          capabilities: capabilitiesRef.current,
          manualOverride,
          currentFPS,
        });

        // Debug: Update if changed
        if (newLOD !== currentLOD) {
          console.log('[LODManager] LOD changed', { from: currentLOD, to: newLOD });
          setCurrentLOD(newLOD);

          if (onLODChange) {
            onLODChange(newLOD);
          }
        }
      } catch (error) {
        console.error('[LODManager] Error checking LOD', error);
      }

      // Debug: Check again on next frame
      animationFrameId = requestAnimationFrame(checkLOD);
    };

    animationFrameId = requestAnimationFrame(checkLOD);

    return () => {
      console.log('[LODManager] Cleanup camera monitor');
      cancelAnimationFrame(animationFrameId);
    };
  }, [viewer, currentLOD, manualOverride, currentFPS, onLODChange]);

  // Debug: Set manual override
  const setLODOverride = useCallback((level: LODLevel | null) => {
    console.log('[LODManager] Setting manual override', level);
    setManualOverride(level);
  }, []);

  // Debug: Get current model URL
  const currentURL = getLODModelURL(highURL, mediumURL, lowURL, currentLOD);

  // Debug: LOD labels and colors
  const lodConfig = {
    high: {
      label: 'High Detail',
      color: 'text-construction-green',
      bgColor: 'bg-construction-green',
      icon: Zap,
    },
    medium: {
      label: 'Medium Detail',
      color: 'text-construction-yellow',
      bgColor: 'bg-construction-yellow',
      icon: Gauge,
    },
    low: {
      label: 'Low Detail',
      color: 'text-construction-red',
      bgColor: 'bg-construction-red',
      icon: Gauge,
    },
  };

  const config = lodConfig[currentLOD];
  const Icon = config.icon;

  return (
    <div className={cn('absolute bottom-4 left-4 z-10', className)}>
      <AnimatePresence>
        {showIndicator && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-2"
          >
            {/* Debug: LOD indicator badge */}
            <div className="bg-white border-2 border-construction-blue rounded-lg px-3 py-2 shadow-construction flex items-center gap-2">
              <Icon className={cn('w-4 h-4', config.color)} />
              <div className="text-xs">
                <p className="font-black text-construction-blue uppercase tracking-tight leading-none">
                  {config.label}
                </p>
                {manualOverride && (
                  <p className="text-[10px] text-gray-500 mt-0.5">Manual Override</p>
                )}
              </div>

              {/* Debug: FPS indicator */}
              <div className="ml-2 pl-2 border-l border-gray-300">
                <p className="text-[10px] text-gray-500 font-mono">
                  {currentFPS.toFixed(0)} FPS
                </p>
              </div>
            </div>

            {/* Debug: Settings dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="icon"
                  variant="outline"
                  className="bg-white border-2 border-construction-blue shadow-construction min-w-[44px] min-h-[44px]"
                >
                  <Settings className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuLabel className="text-xs font-black uppercase">
                  Level of Detail
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                <DropdownMenuItem onClick={() => setLODOverride(null)}>
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        'w-2 h-2 rounded-full',
                        manualOverride === null ? 'bg-construction-blue' : 'bg-gray-300'
                      )}
                    />
                    <span className={cn(manualOverride === null && 'font-bold')}>
                      Automatic
                    </span>
                  </div>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem onClick={() => setLODOverride('high')}>
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        'w-2 h-2 rounded-full',
                        manualOverride === 'high' ? 'bg-construction-green' : 'bg-gray-300'
                      )}
                    />
                    <span className={cn(manualOverride === 'high' && 'font-bold')}>
                      High Detail
                    </span>
                  </div>
                </DropdownMenuItem>

                <DropdownMenuItem onClick={() => setLODOverride('medium')}>
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        'w-2 h-2 rounded-full',
                        manualOverride === 'medium' ? 'bg-construction-yellow' : 'bg-gray-300'
                      )}
                    />
                    <span className={cn(manualOverride === 'medium' && 'font-bold')}>
                      Medium Detail
                    </span>
                  </div>
                </DropdownMenuItem>

                <DropdownMenuItem onClick={() => setLODOverride('low')}>
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        'w-2 h-2 rounded-full',
                        manualOverride === 'low' ? 'bg-construction-red' : 'bg-gray-300'
                      )}
                    />
                    <span className={cn(manualOverride === 'low' && 'font-bold')}>
                      Low Detail
                    </span>
                  </div>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem onClick={() => setShowIndicator(!showIndicator)}>
                  {showIndicator ? 'Hide Indicator' : 'Show Indicator'}
                </DropdownMenuItem>

                {/* Debug: Device info */}
                <DropdownMenuSeparator />
                <div className="px-2 py-1">
                  <p className="text-[10px] text-gray-500 font-mono uppercase tracking-wider mb-1">
                    Device Info
                  </p>
                  <div className="space-y-0.5 text-[10px] text-gray-600">
                    <p>
                      {capabilitiesRef.current.isMobile ? 'Mobile' : 'Desktop'} •{' '}
                      {capabilitiesRef.current.memory}GB RAM
                    </p>
                    <p>{capabilitiesRef.current.cores} CPU cores</p>
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
