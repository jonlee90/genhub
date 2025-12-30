'use client';

/**
 * ConnectionStatus - Real-time connection indicator
 *
 * Shows connection status in the chat UI:
 * - Connected: Green dot (hidden by default)
 * - Disconnected: Red warning with reconnect button
 * - Reconnecting: Yellow pulsing indicator with retry count
 */

import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, WifiOff, RefreshCw, AlertCircle } from 'lucide-react';
import type { ConnectionState } from '@/lib/hooks/useRealtimeConnection';
import { cn } from '@/lib/utils';

interface ConnectionStatusProps {
  state: ConnectionState;
  retryCount?: number;
  maxRetries?: number;
  onReconnect?: () => void;
  className?: string;
  showWhenConnected?: boolean;
}

// Debug: Connection status indicator component
export function ConnectionStatus({
  state,
  retryCount = 0,
  maxRetries = 5,
  onReconnect,
  className,
  showWhenConnected = false,
}: ConnectionStatusProps) {
  console.log('[ConnectionStatus] Rendering state:', state, 'retry:', retryCount);

  // Debug: Don't show if connected and showWhenConnected is false
  if (state === 'connected' && !showWhenConnected) {
    return null;
  }

  return (
    <AnimatePresence mode="wait">
      {state === 'connected' && showWhenConnected && (
        <motion.div
          key="connected"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className={cn(
            'flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg',
            className
          )}
        >
          <div className="relative">
            <Wifi className="h-4 w-4 text-green-600" />
            <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full" />
          </div>
          <span className="text-xs font-mono font-semibold text-green-700">CONNECTED</span>
        </motion.div>
      )}

      {state === 'connecting' && (
        <motion.div
          key="connecting"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className={cn(
            'flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg',
            className
          )}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          >
            <RefreshCw className="h-4 w-4 text-blue-600" />
          </motion.div>
          <span className="text-xs font-mono font-semibold text-blue-700">CONNECTING...</span>
        </motion.div>
      )}

      {state === 'reconnecting' && (
        <motion.div
          key="reconnecting"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className={cn(
            'flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg',
            className
          )}
        >
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <AlertCircle className="h-4 w-4 text-amber-600" />
          </motion.div>
          <div className="flex flex-col">
            <span className="text-xs font-mono font-semibold text-amber-700">
              RECONNECTING...
            </span>
            <span className="text-[10px] font-mono text-amber-600">
              Attempt {retryCount}/{maxRetries}
            </span>
          </div>
        </motion.div>
      )}

      {state === 'disconnected' && (
        <motion.div
          key="disconnected"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className={cn(
            'flex items-center gap-3 px-4 py-2 bg-red-50 border-2 border-red-200 rounded-lg',
            className
          )}
        >
          <div className="flex items-center gap-2">
            <WifiOff className="h-4 w-4 text-red-600" />
            <div className="flex flex-col">
              <span className="text-xs font-mono font-bold text-red-700">DISCONNECTED</span>
              <span className="text-[10px] font-mono text-red-600">
                Messages may not update in real-time
              </span>
            </div>
          </div>
          {onReconnect && (
            <button
              onClick={onReconnect}
              className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-md transition-colors"
            >
              <RefreshCw className="h-3 w-3" />
              Reconnect
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Debug: Compact inline status indicator
interface CompactConnectionStatusProps {
  state: ConnectionState;
  className?: string;
}

export function CompactConnectionStatus({ state, className }: CompactConnectionStatusProps) {
  const statusConfig = {
    connected: {
      color: 'bg-green-500',
      title: 'Connected',
    },
    connecting: {
      color: 'bg-blue-500',
      title: 'Connecting...',
    },
    reconnecting: {
      color: 'bg-amber-500',
      title: 'Reconnecting...',
    },
    disconnected: {
      color: 'bg-red-500',
      title: 'Disconnected',
    },
  };

  const config = statusConfig[state];

  return (
    <div className={cn('relative', className)} title={config.title}>
      <div className={cn('w-2 h-2 rounded-full', config.color)}>
        {(state === 'connecting' || state === 'reconnecting') && (
          <motion.div
            className={cn('absolute inset-0 rounded-full', config.color)}
            animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        )}
      </div>
    </div>
  );
}
