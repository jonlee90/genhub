'use client';

import { AlertTriangle, RefreshCw, Monitor, Smartphone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';

export interface WebGLFallbackProps {
  /** Handler for retry/refresh action */
  onRetry?: () => void;
  /** Additional class names */
  className?: string;
}

/**
 * User-friendly fallback component displayed when WebGL is not available.
 * Provides clear explanation and actionable suggestions.
 */
export function WebGLFallback({ onRetry, className }: WebGLFallbackProps) {
  return (
    <div
      className={cn(
        'h-full w-full flex items-center justify-center p-4',
        'bg-gray-50',
        className
      )}
    >
      <Card
        className={cn(
          'max-w-sm w-full p-6',
          'border-2 border-gray-200 shadow-lg',
          'bg-white'
        )}
      >
        {/* Warning Icon */}
        <div className="flex justify-center mb-4">
          <div
            className={cn(
              'p-4 rounded-full',
              'bg-amber-50 border-2 border-amber-200'
            )}
          >
            <AlertTriangle
              className="w-8 h-8 text-amber-500"
              strokeWidth={2}
              aria-hidden="true"
            />
          </div>
        </div>

        {/* Heading */}
        <h2
          className={cn(
            'text-xl font-bold text-center text-[#001B51] mb-2',
            'uppercase tracking-tight'
          )}
        >
          3D Viewer Not Available
        </h2>

        {/* Description */}
        <p className="text-sm text-gray-600 text-center mb-6 leading-relaxed">
          Your browser or device doesn&apos;t support WebGL, which is required
          for the 3D spatial viewer.
        </p>

        {/* Suggestions */}
        <div className="space-y-3 mb-6">
          <div className="flex items-start gap-3 text-sm text-gray-700">
            <Monitor className="w-5 h-5 text-[#001B51] flex-shrink-0 mt-0.5" />
            <span>
              Try using a modern browser like Chrome, Firefox, or Edge
            </span>
          </div>
          <div className="flex items-start gap-3 text-sm text-gray-700">
            <Smartphone className="w-5 h-5 text-[#001B51] flex-shrink-0 mt-0.5" />
            <span>
              Update your browser to the latest version
            </span>
          </div>
        </div>

        {/* Retry Button */}
        {onRetry && (
          <button
            onClick={onRetry}
            className={cn(
              'w-full min-h-[44px] px-6 py-3',
              'flex items-center justify-center gap-2',
              'bg-[#001B51] text-white',
              'font-semibold text-base rounded-xl',
              'active:scale-[0.98] active:bg-[#001B51]/90',
              'transition-all duration-150',
              'focus:outline-none focus:ring-2 focus:ring-[#001B51] focus:ring-offset-2'
            )}
            aria-label="Retry loading the 3D viewer"
          >
            <RefreshCw className="w-5 h-5" aria-hidden="true" />
            Try Again
          </button>
        )}

        {/* Technical note */}
        <p className="text-xs text-gray-400 text-center mt-4 font-mono">
          WebGL 2.0 required for 3D rendering
        </p>
      </Card>
    </div>
  );
}
