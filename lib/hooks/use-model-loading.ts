// Debug: Custom hook for 3D model loading state management
// P2.5 - useModelLoading with progress tracking, retry logic, and cancellation

import { useState, useCallback, useRef } from 'react';

// Debug: Loading states
export type ModelLoadingState = 'idle' | 'downloading' | 'parsing' | 'ready' | 'error';

// Debug: Error types (discriminated union)
export type ModelLoadingError =
  | { type: 'network'; message: string; retryable: true }
  | { type: 'parse'; message: string; retryable: true }
  | { type: 'webgl'; message: string; retryable: false }
  | { type: 'auth'; message: string; retryable: false };

// Debug: Hook return type
export interface UseModelLoadingReturn {
  state: ModelLoadingState;
  progress: number;
  error: ModelLoadingError | null;
  retryCount: number;
  loadModel: (url: string, onSuccess?: (data: any) => void) => Promise<void>;
  retry: () => void;
  cancel: () => void;
  reset: () => void;
}

/**
 * useModelLoading - Manage 3D model loading lifecycle
 * Features:
 * - Progress tracking (0-50% download, 50-100% parsing)
 * - Retry with exponential backoff (max 3 attempts)
 * - Cancellation via AbortController
 * - Error categorization
 */
export function useModelLoading(): UseModelLoadingReturn {
  console.log('[useModelLoading] Hook initialized');

  // Debug: State
  const [state, setState] = useState<ModelLoadingState>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<ModelLoadingError | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Debug: Refs for cleanup
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastUrlRef = useRef<string | null>(null);
  const onSuccessCallbackRef = useRef<((data: any) => void) | null>(null);

  /**
   * Load model from URL with progress tracking
   */
  const loadModel = useCallback(async (url: string, onSuccess?: (data: any) => void) => {
    console.log('[useModelLoading] Loading model', { url, retryCount });

    // Debug: Store URL and callback for retry
    lastUrlRef.current = url;
    onSuccessCallbackRef.current = onSuccess || null;

    // Debug: Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Debug: Create new abort controller
    abortControllerRef.current = new AbortController();
    const { signal } = abortControllerRef.current;

    // Debug: Reset state
    setState('downloading');
    setProgress(0);
    setError(null);

    try {
      // Debug: Fetch model file with streaming progress
      const response = await fetch(url, { signal });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw {
            type: 'auth',
            message: 'Access denied. Please check permissions.',
            retryable: false,
          } as ModelLoadingError;
        }
        throw {
          type: 'network',
          message: `Failed to download model (${response.status})`,
          retryable: true,
        } as ModelLoadingError;
      }

      // Debug: Get content length for progress calculation
      const contentLength = response.headers.get('content-length');
      const total = contentLength ? parseInt(contentLength, 10) : 0;

      console.log('[useModelLoading] Download started', { total });

      // Debug: Stream download with progress
      const reader = response.body?.getReader();
      if (!reader) {
        throw {
          type: 'network',
          message: 'Failed to read response body',
          retryable: true,
        } as ModelLoadingError;
      }

      let received = 0;
      const chunks: Uint8Array[] = [];

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        chunks.push(value);
        received += value.length;

        // Debug: Update download progress (0-50%)
        if (total > 0) {
          const downloadProgress = Math.floor((received / total) * 50);
          setProgress(downloadProgress);
          console.log('[useModelLoading] Download progress', {
            received,
            total,
            progress: downloadProgress,
          });
        }
      }

      // Debug: Combine chunks into single array buffer
      const arrayBuffer = new Uint8Array(
        chunks.reduce((acc, chunk) => acc + chunk.length, 0)
      );
      let position = 0;
      for (const chunk of chunks) {
        arrayBuffer.set(chunk, position);
        position += chunk.length;
      }

      console.log('[useModelLoading] Download complete, parsing...');

      // Debug: Transition to parsing state
      setState('parsing');
      setProgress(50);

      // Debug: Simulate parsing progress (50-100%)
      // In real implementation, xeokit would provide parse progress
      const parseInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 95) {
            clearInterval(parseInterval);
            return 95;
          }
          return prev + 5;
        });
      }, 100);

      // Debug: Pass buffer to callback
      if (onSuccess) {
        onSuccess(arrayBuffer.buffer);
      }

      clearInterval(parseInterval);

      // Debug: Complete
      setState('ready');
      setProgress(100);
      setRetryCount(0);

      console.log('[useModelLoading] Model loaded successfully');
    } catch (err) {
      console.error('[useModelLoading] Load error', err);

      // Debug: Handle abort
      if (signal.aborted) {
        console.log('[useModelLoading] Load cancelled');
        setState('idle');
        setProgress(0);
        return;
      }

      // Debug: Categorize error
      let modelError: ModelLoadingError;

      if (typeof err === 'object' && err !== null && 'type' in err) {
        modelError = err as ModelLoadingError;
      } else if (err instanceof TypeError) {
        modelError = {
          type: 'network',
          message: 'Network error. Please check your connection.',
          retryable: true,
        };
      } else {
        modelError = {
          type: 'parse',
          message: err instanceof Error ? err.message : String(err),
          retryable: true,
        };
      }

      setState('error');
      setError(modelError);
    }
  }, [retryCount]);

  /**
   * Retry loading with exponential backoff
   * Max 3 attempts: 1s, 2s, 4s
   */
  const retry = useCallback(() => {
    console.log('[useModelLoading] Retry attempt', { retryCount });

    if (!lastUrlRef.current) {
      console.warn('[useModelLoading] No URL to retry');
      return;
    }

    if (retryCount >= 3) {
      console.warn('[useModelLoading] Max retry attempts reached');
      return;
    }

    if (error && !error.retryable) {
      console.warn('[useModelLoading] Error is not retryable');
      return;
    }

    // Debug: Exponential backoff delay
    const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
    console.log('[useModelLoading] Retrying in', delay, 'ms');

    setRetryCount((prev) => prev + 1);

    setTimeout(() => {
      loadModel(lastUrlRef.current!, onSuccessCallbackRef.current || undefined);
    }, delay);
  }, [retryCount, error, loadModel]);

  /**
   * Cancel ongoing load
   */
  const cancel = useCallback(() => {
    console.log('[useModelLoading] Cancelling load');

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    setState('idle');
    setProgress(0);
    setError(null);
  }, []);

  /**
   * Reset to initial state
   */
  const reset = useCallback(() => {
    console.log('[useModelLoading] Resetting state');

    cancel();
    setRetryCount(0);
    lastUrlRef.current = null;
    onSuccessCallbackRef.current = null;
  }, [cancel]);

  return {
    state,
    progress,
    error,
    retryCount,
    loadModel,
    retry,
    cancel,
    reset,
  };
}
