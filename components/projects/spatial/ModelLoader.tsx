'use client';

// Debug: Model loading UI with progress, errors, and retry
// P2.5 - ModelLoader component

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, AlertCircle, RotateCw, X, HardHat } from 'lucide-react';
import { useModelLoading } from '@/lib/hooks/use-model-loading';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

// Debug: Component props
export interface ModelLoaderProps {
  modelUrl: string;
  thumbnailUrl?: string;
  onLoadSuccess?: (data: any) => void;
  onLoadError?: (error: any) => void;
  className?: string;
}

/**
 * ModelLoader - Visual loading state for 3D models
 * Features:
 * - Progress bar (0-50% download, 50-100% parsing)
 * - Error UI with retry
 * - Skeleton loader with thumbnail blur
 * - Smooth transitions
 */
export function ModelLoader({
  modelUrl,
  thumbnailUrl,
  onLoadSuccess,
  onLoadError,
  className,
}: ModelLoaderProps) {
  console.log('[ModelLoader] Rendering', { modelUrl, thumbnailUrl });

  // Debug: Use loading hook
  const { state, progress, error, retryCount, loadModel, retry, cancel } = useModelLoading();
  const isMountedRef = useRef(true);

  // FIX: Track mount/unmount and cleanup properly
  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      console.log('[ModelLoader] Component unmounting');
      isMountedRef.current = false;
      // Cancel any in-flight loads
      if (state === 'downloading' || state === 'parsing') {
        cancel();
      }
    };
  }, [state, cancel]);

  // Debug: Auto-load when URL changes
  useEffect(() => {
    if (modelUrl && isMountedRef.current) {
      console.log('[ModelLoader] Auto-loading model', modelUrl);
      loadModel(modelUrl, onLoadSuccess);
    }

    // FIX: Return cleanup to cancel if URL changes while loading
    return () => {
      if (state === 'downloading' || state === 'parsing') {
        console.log('[ModelLoader] URL changed during load, cancelling');
        cancel();
      }
    };
  }, [modelUrl]); // Only depend on modelUrl, not loadModel/cancel to prevent infinite loops

  // Debug: Notify error callback
  useEffect(() => {
    if (error && onLoadError && isMountedRef.current) {
      onLoadError(error);
    }
  }, [error, onLoadError]);

  // Debug: Ready state - fade out loader
  if (state === 'ready') {
    return (
      <motion.div
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        className={cn('pointer-events-none', className)}
      >
        <div className="flex items-center justify-center h-full bg-construction-blue/5">
          <p className="text-sm font-bold text-construction-blue">Model Ready</p>
        </div>
      </motion.div>
    );
  }

  // Debug: Idle state - show placeholder
  if (state === 'idle') {
    return (
      <div className={cn('flex items-center justify-center h-full bg-gray-100', className)}>
        <div className="text-center">
          <HardHat className="w-12 h-12 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No model loaded</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('relative h-full overflow-hidden', className)}>
      {/* Debug: Thumbnail background with blur */}
      {thumbnailUrl && (
        <div
          className="absolute inset-0 bg-cover bg-center filter blur-md scale-110"
          style={{ backgroundImage: `url(${thumbnailUrl})` }}
        />
      )}

      {/* Debug: Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-construction-blue/10 to-construction-blue/30 backdrop-blur-sm" />

      {/* Debug: Content */}
      <div className="relative h-full flex items-center justify-center p-4">
        <AnimatePresence mode="wait">
          {/* Debug: Loading state */}
          {(state === 'downloading' || state === 'parsing') && (
            <motion.div
              key="loading"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              className="bg-white border-2 border-construction-blue rounded-lg p-6 shadow-construction max-w-md w-full"
            >
              {/* Debug: Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-6 h-6 text-construction-blue animate-spin" />
                  <div>
                    <p className="font-black text-construction-blue uppercase text-sm tracking-tight">
                      {state === 'downloading' ? 'Downloading Model' : 'Processing Model'}
                    </p>
                    <p className="text-xs text-gray-600">
                      {state === 'downloading'
                        ? 'Fetching 3D geometry...'
                        : 'Parsing IFC structure...'}
                    </p>
                  </div>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={cancel}
                  className="shrink-0"
                  title="Cancel"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Debug: Progress bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono text-gray-600">
                  <span>{progress}%</span>
                  <span>
                    {state === 'downloading' ? 'Download' : 'Parse'} (
                    {state === 'downloading' ? '0-50%' : '50-100%'})
                  </span>
                </div>
                <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
                  {/* Debug: Background gradient */}
                  <div className="absolute inset-0 bg-gradient-to-r from-construction-blue/10 to-construction-blue/20" />

                  {/* Debug: Progress fill */}
                  <motion.div
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-construction-blue to-construction-blue/80 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                  />

                  {/* Debug: Animated shimmer */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                </div>
              </div>

              {/* Debug: Stage indicators */}
              <div className="flex gap-2 mt-4">
                <div
                  className={cn(
                    'flex-1 h-1 rounded-full transition-colors',
                    progress >= 50 ? 'bg-construction-blue' : 'bg-gray-300'
                  )}
                />
                <div
                  className={cn(
                    'flex-1 h-1 rounded-full transition-colors',
                    progress === 100 ? 'bg-construction-blue' : 'bg-gray-300'
                  )}
                />
              </div>
            </motion.div>
          )}

          {/* Debug: Error state */}
          {state === 'error' && error && (
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              className="bg-white border-2 border-red-500 rounded-lg p-6 shadow-construction max-w-md w-full"
            >
              {/* Debug: Header */}
              <div className="flex items-start gap-3 mb-4">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <div className="flex-1">
                  <p className="font-black text-red-600 uppercase text-sm tracking-tight mb-1">
                    {error.type === 'network' && 'Network Error'}
                    {error.type === 'parse' && 'Parse Error'}
                    {error.type === 'webgl' && 'WebGL Error'}
                    {error.type === 'auth' && 'Access Denied'}
                  </p>
                  <p className="text-sm text-gray-700">{error.message}</p>
                </div>
              </div>

              {/* Debug: Retry info */}
              {error.retryable && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
                  <p className="text-xs text-gray-600">
                    {retryCount > 0 ? (
                      <>
                        Retry attempt {retryCount}/3
                        {retryCount < 3 && '. Retrying with exponential backoff...'}
                      </>
                    ) : (
                      'You can retry loading the model.'
                    )}
                  </p>
                </div>
              )}

              {/* Debug: Actions */}
              <div className="flex gap-3">
                {error.retryable && retryCount < 3 && (
                  <Button
                    onClick={retry}
                    className="flex-1 bg-construction-blue hover:bg-blue-700"
                  >
                    <RotateCw className="w-4 h-4 mr-2" />
                    Retry Loading
                  </Button>
                )}
                <Button onClick={cancel} variant="outline" className="flex-1">
                  Close
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
