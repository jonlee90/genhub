/**
 * P5.8 - Error Boundary Component
 * Catches React errors in 3D viewer and shows recovery UI
 * Construction-themed design
 */

'use client';

import { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Mail, WifiOff, Globe, Database, X } from 'lucide-react';
import { cn } from '@/lib/utils';

console.log('[ErrorBoundary] Component loaded');

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: any) => void;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: any;
}

/**
 * Error Boundary for 3D Spatial Viewer
 */
export class SpatialViewerErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    console.error('[ErrorBoundary] Error caught:', error);
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('[ErrorBoundary] Component error:', error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });

    // Call optional error callback
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log to analytics (if available)
    if (typeof window !== 'undefined' && (window as any).analytics) {
      (window as any).analytics.track('3d_viewer_error', {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
      });
    }
  }

  handleReset = () => {
    console.log('[ErrorBoundary] Resetting error boundary');
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = () => {
    console.log('[ErrorBoundary] Reloading page');
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <ErrorCrashRecoveryUI
          error={this.state.error}
          onReset={this.handleReset}
          onReload={this.handleReload}
        />
      );
    }

    return this.props.children;
  }
}

/**
 * Crash recovery UI
 */
function ErrorCrashRecoveryUI({
  error,
  onReset,
  onReload,
}: {
  error: Error | null;
  onReset: () => void;
  onReload: () => void;
}) {
  console.log('[ErrorCrashRecoveryUI] Rendering');

  return (
    <div className="flex items-center justify-center min-h-[400px] bg-gray-50 p-4">
      <div className="bg-white border-2 border-red-500 rounded-lg shadow-construction max-w-lg w-full p-6">
        {/* Icon & Title */}
        <div className="flex items-start gap-3 mb-4">
          <div className="p-2 bg-red-50 rounded-lg">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-red-600">
              3D Viewer Crashed
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Something went wrong while rendering the 3D model. The error has been logged.
            </p>
          </div>
        </div>

        {/* Error details (collapsed by default) */}
        {error && (
          <details className="mb-4">
            <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
              Error details (for support)
            </summary>
            <pre className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded text-xs overflow-auto max-h-32">
              {error.message}
            </pre>
          </details>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={onReset}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 px-4 py-2',
              'bg-[#001B51] text-white rounded-lg',
              'hover:bg-[#001B51]/90 transition-colors',
              'font-medium text-sm'
            )}
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>

          <button
            onClick={onReload}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 px-4 py-2',
              'border-2 border-gray-300 text-gray-700 rounded-lg',
              'hover:bg-gray-50 transition-colors',
              'font-medium text-sm'
            )}
          >
            <RefreshCw className="w-4 h-4" />
            Reload Page
          </button>
        </div>

        {/* Support link */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <a
            href="mailto:support@genhub.com?subject=3D Viewer Error"
            className="text-sm text-[#001B51] hover:underline flex items-center gap-1"
          >
            <Mail className="w-4 h-4" />
            Contact Support
          </a>
        </div>
      </div>
    </div>
  );
}

/**
 * Error state components for specific errors
 */

export interface ErrorStateProps {
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function ErrorState({
  title,
  description,
  action,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-center min-h-[400px] p-4',
        className
      )}
    >
      <div className="text-center max-w-md">
        <div className="inline-flex p-3 bg-red-50 rounded-full mb-4">
          <AlertTriangle className="w-8 h-8 text-red-600" />
        </div>

        <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-600 mb-4">{description}</p>

        {action && (
          <button
            onClick={action.onClick}
            className={cn(
              'px-6 py-2 bg-[#001B51] text-white rounded-lg',
              'hover:bg-[#001B51]/90 transition-colors',
              'font-medium text-sm'
            )}
          >
            {action.label}
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Network error state
 */
export function NetworkErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <ErrorState
      title="Network Error"
      description="Failed to load 3D model. Please check your internet connection and try again."
      action={{
        label: 'Retry',
        onClick: onRetry,
      }}
    />
  );
}

/**
 * WebGL not supported state
 */
export function WebGLNotSupportedState() {
  return (
    <div className="flex items-center justify-center min-h-[400px] p-4">
      <div className="bg-white border-2 border-yellow-500 rounded-lg shadow-construction max-w-lg w-full p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="p-2 bg-yellow-50 rounded-lg">
            <Globe className="w-6 h-6 text-yellow-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-yellow-600">
              WebGL Not Supported
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Your browser does not support WebGL, which is required for 3D rendering.
            </p>
          </div>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded p-4">
          <p className="text-sm text-gray-700 font-medium mb-2">
            Recommended actions:
          </p>
          <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
            <li>Update your browser to the latest version</li>
            <li>Enable hardware acceleration in browser settings</li>
            <li>Try a different browser (Chrome, Firefox, Edge)</li>
          </ul>
        </div>

        <div className="mt-4">
          <a
            href="https://get.webgl.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-[#001B51] hover:underline"
          >
            Learn more about WebGL →
          </a>
        </div>
      </div>
    </div>
  );
}

/**
 * Model corrupt error state
 */
export function ModelCorruptState({ onRetry }: { onRetry: () => void }) {
  return (
    <ErrorState
      title="Model File Corrupt"
      description="The 3D model file appears to be corrupted or invalid. Please re-upload the model."
      action={{
        label: 'Try Again',
        onClick: onRetry,
      }}
    />
  );
}

/**
 * Permission denied state
 */
export function PermissionDeniedState() {
  return (
    <ErrorState
      title="Permission Denied"
      description="You don't have permission to view this 3D model. Please contact your project administrator."
    />
  );
}

/**
 * Quota exceeded state
 */
export function QuotaExceededState({ onClearCache }: { onClearCache: () => void }) {
  return (
    <div className="flex items-center justify-center min-h-[400px] p-4">
      <div className="bg-white border-2 border-orange-500 rounded-lg shadow-construction max-w-lg w-full p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="p-2 bg-orange-50 rounded-lg">
            <Database className="w-6 h-6 text-orange-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-orange-600">
              Storage Quota Exceeded
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Your device storage is full. Clear old cached data to load new models.
            </p>
          </div>
        </div>

        <button
          onClick={onClearCache}
          className={cn(
            'w-full px-4 py-2 bg-orange-600 text-white rounded-lg',
            'hover:bg-orange-700 transition-colors',
            'font-medium text-sm'
          )}
        >
          Clear Cached Data
        </button>
      </div>
    </div>
  );
}

/**
 * Empty state (no model uploaded)
 */
export function NoModelUploadedState({ onUpload }: { onUpload: () => void }) {
  return (
    <div className="flex items-center justify-center min-h-[400px] p-4">
      <div className="text-center max-w-md">
        <div className="inline-flex p-4 bg-gray-100 rounded-full mb-4">
          <AlertTriangle className="w-10 h-10 text-gray-400" />
        </div>

        <h3 className="text-lg font-bold text-gray-900 mb-2">
          No 3D Model Uploaded
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          Upload an IFC or XKT file to view the 3D model in this viewer.
        </p>

        <button
          onClick={onUpload}
          className={cn(
            'px-6 py-2 bg-[#001B51] text-white rounded-lg',
            'hover:bg-[#001B51]/90 transition-colors',
            'font-medium text-sm'
          )}
        >
          Upload Model
        </button>
      </div>
    </div>
  );
}

/**
 * Model processing state
 */
export function ModelProcessingState() {
  return (
    <div className="flex items-center justify-center min-h-[400px] p-4">
      <div className="text-center max-w-md">
        <div className="inline-flex p-4 bg-blue-50 rounded-full mb-4">
          <RefreshCw className="w-10 h-10 text-blue-600 animate-spin" />
        </div>

        <h3 className="text-lg font-bold text-gray-900 mb-2">
          Processing Model
        </h3>
        <p className="text-sm text-gray-600">
          Your 3D model is being converted to XKT format. This may take a few minutes.
        </p>
      </div>
    </div>
  );
}
