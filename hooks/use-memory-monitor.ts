/**
 * P5.7 - Memory Monitor Hook
 * React hook for monitoring memory usage in components
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  getMemoryUsage,
  type MemoryStats,
  startMemoryMonitoring,
} from '@/lib/xeokit/memory-manager';
import type { Viewer } from '@xeokit/xeokit-sdk';

console.log('[useMemoryMonitor] Hook module loaded');

export interface UseMemoryMonitorOptions {
  enabled?: boolean;
  interval?: number;
  viewer?: Viewer | null;
  onWarning?: (stats: MemoryStats) => void;
  onCritical?: (stats: MemoryStats) => void;
}

export interface UseMemoryMonitorReturn {
  stats: MemoryStats | null;
  isMonitoring: boolean;
  refresh: () => void;
}

/**
 * Hook to monitor memory usage
 */
export function useMemoryMonitor(
  options: UseMemoryMonitorOptions = {}
): UseMemoryMonitorReturn {
  const {
    enabled = true,
    interval = 5000,
    viewer,
    onWarning,
    onCritical,
  } = options;

  console.log('[useMemoryMonitor] Hook initialized:', { enabled, interval });

  const [stats, setStats] = useState<MemoryStats | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);

  // Refresh stats manually
  const refresh = useCallback(() => {
    console.log('[useMemoryMonitor] Refreshing stats');
    const newStats = getMemoryUsage();
    setStats(newStats);
  }, []);

  // Start monitoring
  useEffect(() => {
    if (!enabled) {
      console.log('[useMemoryMonitor] Monitoring disabled');
      setIsMonitoring(false);
      return;
    }

    console.log('[useMemoryMonitor] Starting monitoring');
    setIsMonitoring(true);

    // Initial refresh
    refresh();

    // If viewer provided, use full monitoring with auto-cleanup
    if (viewer) {
      const stopMonitoring = startMemoryMonitoring(
        viewer,
        interval,
        (stats) => {
          console.log('[useMemoryMonitor] Warning callback');
          setStats(stats);
          if (onWarning) {
            onWarning(stats);
          }
        },
        (stats) => {
          console.log('[useMemoryMonitor] Critical callback');
          setStats(stats);
          if (onCritical) {
            onCritical(stats);
          }
        }
      );

      return () => {
        console.log('[useMemoryMonitor] Cleanup: stopping monitoring');
        stopMonitoring();
        setIsMonitoring(false);
      };
    }

    // Otherwise, simple interval-based monitoring
    const monitorInterval = setInterval(() => {
      const newStats = getMemoryUsage();
      setStats(newStats);

      if (newStats.level === 'warning' && onWarning) {
        onWarning(newStats);
      }

      if (newStats.level === 'critical' && onCritical) {
        onCritical(newStats);
      }
    }, interval);

    return () => {
      console.log('[useMemoryMonitor] Cleanup: clearing interval');
      clearInterval(monitorInterval);
      setIsMonitoring(false);
    };
  }, [enabled, interval, viewer, onWarning, onCritical, refresh]);

  return {
    stats,
    isMonitoring,
    refresh,
  };
}
