'use client';

import { useState } from 'react';
// Performance optimization: Direct imports instead of barrel file (saves 200-800ms per page)
import Move from 'lucide-react/icons/move';
import RotateCw from 'lucide-react/icons/rotate-cw';
import ZoomIn from 'lucide-react/icons/zoom-in';
import Maximize2 from 'lucide-react/icons/maximize2';
import Box from 'lucide-react/icons/box';
import Grid3x3 from 'lucide-react/icons/grid3x3';
import Ruler from 'lucide-react/icons/ruler';
import Slice from 'lucide-react/icons/slice';
import RotateCcw from 'lucide-react/icons/rotate-ccw';
import Eye from 'lucide-react/icons/eye';
import Layers from 'lucide-react/icons/layers';;
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/lib/hooks/useMediaQuery';
import type { Viewer } from '@xeokit/xeokit-sdk';

export type CameraPreset = 'top' | 'front' | 'side' | 'isometric';
export type InteractionMode = 'pan' | 'rotate' | 'zoom' | 'measure' | 'section';

export interface ViewerToolbarProps {
  viewer: Viewer | null;
  onCameraPreset?: (preset: CameraPreset) => void;
  onInteractionMode?: (mode: InteractionMode) => void;
  onResetView?: () => void;
  className?: string;
}

export function ViewerToolbar({
  viewer,
  onCameraPreset,
  onInteractionMode,
  onResetView,
  className,
}: ViewerToolbarProps) {
  console.log('[ViewerToolbar] Rendering', { hasViewer: !!viewer });

  const isMobile = useIsMobile();
  const [activeMode, setActiveMode] = useState<InteractionMode>('rotate');
  const [showCameraMenu, setShowCameraMenu] = useState(false);

  const handleCameraPreset = (preset: CameraPreset) => {
    console.log('[ViewerToolbar] Camera preset', { preset });
    onCameraPreset?.(preset);
    setShowCameraMenu(false);
  };

  const handleInteractionMode = (mode: InteractionMode) => {
    console.log('[ViewerToolbar] Interaction mode', { mode });
    setActiveMode(mode);
    onInteractionMode?.(mode);
  };

  const handleResetView = () => {
    console.log('[ViewerToolbar] Reset view');
    onResetView?.();
  };

  const toolbarButtons = [
    {
      mode: 'pan' as InteractionMode,
      icon: Move,
      label: 'Pan',
      shortcut: 'P',
    },
    {
      mode: 'rotate' as InteractionMode,
      icon: RotateCw,
      label: 'Rotate',
      shortcut: 'R',
    },
    {
      mode: 'zoom' as InteractionMode,
      icon: ZoomIn,
      label: 'Zoom',
      shortcut: 'Z',
    },
    {
      mode: 'measure' as InteractionMode,
      icon: Ruler,
      label: 'Measure',
      shortcut: 'M',
    },
    {
      mode: 'section' as InteractionMode,
      icon: Slice,
      label: 'Section',
      shortcut: 'S',
    },
  ];

  const cameraPresets = [
    { preset: 'top' as CameraPreset, icon: Grid3x3, label: 'Top View' },
    { preset: 'front' as CameraPreset, icon: Eye, label: 'Front View' },
    { preset: 'side' as CameraPreset, icon: Layers, label: 'Side View' },
    { preset: 'isometric' as CameraPreset, icon: Box, label: 'Isometric' },
  ];

  // Mobile layout: Fixed bottom bar with horizontal buttons
  if (isMobile) {
    return (
      <div
        className={cn(
          'fixed bottom-20 left-1/2 -translate-x-1/2 z-20',
          'bg-white border-2 border-gray-200 rounded-xl shadow-construction',
          'px-2 py-2',
          'pb-[max(0.5rem,env(safe-area-inset-bottom))]',
          'transition-all duration-300',
          className
        )}
      >
        <div className="flex items-center gap-1">
          {/* Interaction Mode Buttons */}
          {toolbarButtons.map(({ mode, icon: Icon, label }) => (
            <button
              key={mode}
              onClick={() => handleInteractionMode(mode)}
              className={cn(
                'min-w-[44px] min-h-[44px]',
                'flex items-center justify-center',
                'rounded-lg',
                'transition-all duration-150',
                'active:scale-[0.98]',
                activeMode === mode
                  ? 'bg-[#001B51] text-white active:bg-[#001B51]/90'
                  : 'bg-gray-50 text-gray-700 active:bg-gray-100'
              )}
              title={label}
              aria-label={label}
              aria-pressed={activeMode === mode}
            >
              <Icon className="w-5 h-5" />
            </button>
          ))}

          {/* Divider */}
          <div className="w-px h-8 bg-gray-200 mx-1" />

          {/* Camera Button */}
          <div className="relative">
            <button
              onClick={() => setShowCameraMenu(!showCameraMenu)}
              className={cn(
                'min-w-[44px] min-h-[44px]',
                'flex items-center justify-center',
                'rounded-lg',
                'bg-gray-50 text-[#001B51]',
                'transition-all duration-150',
                'active:scale-[0.98] active:bg-gray-100'
              )}
              title="Camera Presets"
              aria-label="Camera Presets"
              aria-expanded={showCameraMenu}
              aria-haspopup="menu"
            >
              <Maximize2 className="w-5 h-5" />
            </button>

            {/* Camera Preset Menu - positioned above on mobile */}
            {showCameraMenu && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 min-w-[160px] bg-white border-2 border-gray-200 rounded-xl shadow-construction overflow-hidden">
                <div className="h-1 bg-[#001B51]" />
                <div className="p-2">
                  {cameraPresets.map(({ preset, icon: Icon, label }) => (
                    <button
                      key={preset}
                      onClick={() => handleCameraPreset(preset)}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-3 rounded-lg',
                        'min-h-[44px]',
                        'transition-all duration-150',
                        'text-gray-700',
                        'active:scale-[0.98] active:bg-gray-100'
                      )}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium text-sm">{label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Reset Button */}
          <button
            onClick={handleResetView}
            className={cn(
              'min-w-[44px] min-h-[44px]',
              'flex items-center justify-center',
              'rounded-lg',
              'bg-gray-50 text-gray-700',
              'transition-all duration-150',
              'active:scale-[0.98] active:bg-gray-100'
            )}
            title="Reset View"
            aria-label="Reset View"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  // Desktop layout: Floating panel top-right (existing behavior)
  return (
    <div
      className={cn(
        'absolute top-4 right-4 z-20',
        'flex flex-col gap-2',
        'transition-all duration-300',
        className
      )}
    >
      {/* Interaction Mode Toolbar */}
      <div className="bg-white border-2 border-gray-200 rounded-lg shadow-construction overflow-hidden">
        {/* Technical header strip */}
        <div className="h-1 bg-[#001B51]" />

        <div className="p-2 flex flex-col gap-1">
          {toolbarButtons.map(({ mode, icon: Icon, label, shortcut }) => (
            <button
              key={mode}
              onClick={() => handleInteractionMode(mode)}
              className={cn(
                'group relative flex items-center gap-3 px-3 py-2 rounded',
                'transition-all duration-200',
                'hover:bg-gray-50',
                'active:scale-[0.98]',
                activeMode === mode
                  ? 'bg-[#001B51] text-white active:bg-[#001B51]/90'
                  : 'bg-white text-gray-700 hover:text-[#001B51]'
              )}
              title={label}
              aria-label={label}
              aria-pressed={activeMode === mode}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />

              <span className="font-semibold text-sm uppercase tracking-wide hidden lg:block">
                {label}
              </span>

              <span
                className={cn(
                  'ml-auto text-xs font-mono px-1.5 py-0.5 rounded hidden lg:block',
                  activeMode === mode ? 'bg-white/20' : 'bg-gray-100 text-gray-500'
                )}
              >
                {shortcut}
              </span>

              {/* Active indicator */}
              {activeMode === mode && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Camera Presets Dropdown */}
      <div className="relative">
        <button
          onClick={() => setShowCameraMenu(!showCameraMenu)}
          className={cn(
            'w-full bg-white border-2 border-gray-200 rounded-lg shadow-construction',
            'px-4 py-3 flex items-center gap-3',
            'hover:bg-gray-50 transition-colors',
            'active:scale-[0.98]',
            'group'
          )}
          aria-label="Camera Presets"
          aria-expanded={showCameraMenu}
          aria-haspopup="menu"
        >
          <Maximize2 className="w-5 h-5 text-[#001B51]" />
          <span className="font-semibold text-sm uppercase tracking-wide text-gray-900 hidden lg:block">
            Camera
          </span>
        </button>

        {/* Camera Preset Menu */}
        {showCameraMenu && (
          <div className="absolute top-full right-0 mt-2 min-w-[180px] bg-white border-2 border-gray-200 rounded-lg shadow-construction overflow-hidden">
            <div className="h-1 bg-[#001B51]" />

            <div className="p-2">
              {cameraPresets.map(({ preset, icon: Icon, label }) => (
                <button
                  key={preset}
                  onClick={() => handleCameraPreset(preset)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 rounded',
                    'hover:bg-gray-50 transition-colors',
                    'active:scale-[0.98]',
                    'text-gray-700 hover:text-[#001B51]'
                  )}
                  aria-label={label}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-semibold text-sm uppercase tracking-wide">{label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Reset View Button */}
      <button
        onClick={handleResetView}
        className={cn(
          'bg-white border-2 border-gray-200 rounded-lg shadow-construction',
          'px-4 py-3 flex items-center gap-3',
          'hover:bg-[#001B51] hover:text-white hover:border-[#001B51]',
          'transition-all duration-200',
          'active:scale-[0.98]',
          'group'
        )}
        title="Reset View"
        aria-label="Reset View"
      >
        <RotateCcw className="w-5 h-5 text-gray-700 group-hover:text-white" />
        <span className="font-semibold text-sm uppercase tracking-wide text-gray-900 group-hover:text-white hidden lg:block">
          Reset
        </span>
      </button>

      {/* Technical annotation */}
      <div className="px-2 py-1 text-[10px] font-mono text-gray-400 uppercase tracking-wider hidden lg:block">
        CTRL+Tools
      </div>
    </div>
  );
}
