'use client';

import { useState } from 'react';
import {
  Move,
  RotateCw,
  ZoomIn,
  Maximize2,
  Box,
  Grid3x3,
  Ruler,
  Slice,
  RotateCcw,
  Eye,
  Layers,
} from 'lucide-react';
import { cn } from '@/lib/utils';
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
                activeMode === mode
                  ? 'bg-[#001B51] text-white'
                  : 'bg-white text-gray-700 hover:text-[#001B51]'
              )}
              title={label}
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
            'group'
          )}
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
                    'text-gray-700 hover:text-[#001B51]'
                  )}
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
          'group'
        )}
        title="Reset View"
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
