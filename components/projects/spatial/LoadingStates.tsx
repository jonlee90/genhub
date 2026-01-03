/**
 * P5.8 - Loading States Component
 * Comprehensive loading states with progress, cancellation
 * Construction-themed design
 */

'use client';

import { Loader2, Download, Zap, Eye, X } from 'lucide-react';
import { cn } from '@/lib/utils';

console.log('[LoadingStates] Component loaded');

export interface LoadingState {
  stage: 'downloading' | 'parsing' | 'rendering' | 'idle';
  progress: number; // 0-100
  estimatedTime?: number; // seconds remaining
  cancellable?: boolean;
}

export interface LoadingStatesProps {
  state: LoadingState;
  onCancel?: () => void;
  className?: string;
}

/**
 * Loading overlay with progress tracking
 */
export function LoadingStates({
  state,
  onCancel,
  className,
}: LoadingStatesProps) {
  console.log('[LoadingStates] Rendering:', state);

  if (state.stage === 'idle') {
    return null;
  }

  // Stage-specific content
  const stageConfig = {
    downloading: {
      icon: Download,
      title: 'Downloading Model',
      description: 'Fetching 3D model data from server',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    parsing: {
      icon: Zap,
      title: 'Processing Model',
      description: 'Parsing geometry and materials',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
    rendering: {
      icon: Eye,
      title: 'Rendering Scene',
      description: 'Preparing first frame',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
  };

  const config = stageConfig[state.stage];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'absolute inset-0 flex items-center justify-center',
        'bg-white/95 backdrop-blur-sm z-50',
        className
      )}
    >
      <div className="bg-white border-2 border-[#001B51] rounded-lg shadow-construction max-w-md w-full mx-4 p-6">
        {/* Header with icon */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={cn('p-2 rounded-lg', config.bgColor)}>
              <Icon className={cn('w-6 h-6', config.color)} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#001B51]">
                {config.title}
              </h3>
              <p className="text-sm text-gray-600">{config.description}</p>
            </div>
          </div>

          {/* Cancel button */}
          {state.cancellable && onCancel && (
            <button
              onClick={onCancel}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              aria-label="Cancel loading"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          )}
        </div>

        {/* Progress bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Progress: {Math.round(state.progress)}%
            </span>
            {state.estimatedTime && state.estimatedTime > 0 && (
              <span className="text-sm text-gray-500">
                ~{Math.round(state.estimatedTime)}s remaining
              </span>
            )}
          </div>

          <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full transition-all duration-300 rounded-full',
                'bg-[#001B51]'
              )}
              style={{ width: `${state.progress}%` }}
            />
          </div>
        </div>

        {/* Loading spinner */}
        <div className="flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-[#001B51] animate-spin" />
        </div>
      </div>
    </div>
  );
}

/**
 * Minimal loading spinner (for inline use)
 */
export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <Loader2 className={cn('text-[#001B51] animate-spin', sizeClasses[size])} />
  );
}

/**
 * Model download progress indicator
 */
export function ModelDownloadProgress({
  progress,
  fileName,
  fileSize,
  onCancel,
}: {
  progress: number;
  fileName: string;
  fileSize?: number;
  onCancel?: () => void;
}) {
  console.log('[ModelDownloadProgress] Rendering:', { progress, fileName });

  return (
    <div className="bg-white border-2 border-gray-200 rounded-lg p-4 shadow-construction">
      <div className="flex items-center gap-3 mb-3">
        <Download className="w-5 h-5 text-[#001B51]" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {fileName}
          </p>
          {fileSize && (
            <p className="text-xs text-gray-500">
              {(fileSize / 1024 / 1024).toFixed(2)} MB
            </p>
          )}
        </div>
        {onCancel && (
          <button
            onClick={onCancel}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            aria-label="Cancel download"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        )}
      </div>

      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-[#001B51] transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <p className="text-xs text-gray-500 mt-2 text-right">
        {Math.round(progress)}%
      </p>
    </div>
  );
}
