'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle,
  Link2,
  Unlink,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Zap,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  getKakaoConnection,
  disconnectKakao,
  updateTwoWaySync,
} from '@/app/actions/kakao';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// ============================================
// Types
// ============================================

interface ConnectionState {
  isConnected: boolean;
  kakaoUserId?: string;
  sendbirdUserId?: string;
  twoWaySync: boolean;
  connectedAt?: string;
}

// ============================================
// Main Component
// ============================================

export function KakaoTalkSettings() {
  console.log('[KakaoTalkSettings] Rendering component');

  const [connectionState, setConnectionState] = useState<ConnectionState>({
    isConnected: false,
    twoWaySync: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [isTogglingSync, setIsTogglingSync] = useState(false);
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);

  // ============================================
  // Fetch Connection Status
  // ============================================

  const fetchConnectionStatus = async () => {
    console.log('[KakaoTalkSettings] Fetching connection status...');
    setIsLoading(true);

    try {
      const result = await getKakaoConnection();
      console.log('[KakaoTalkSettings] Connection result:', result);

      if (result.success && result.connection) {
        setConnectionState({
          isConnected: true,
          kakaoUserId: result.connection.kakao_user_id,
          sendbirdUserId: result.connection.sendbird_user_id,
          twoWaySync: result.connection.two_way_sync,
          connectedAt: result.connection.connected_at,
        });
      } else {
        setConnectionState({
          isConnected: false,
          twoWaySync: false,
        });
      }
    } catch (error) {
      console.error('[KakaoTalkSettings] Error fetching connection:', error);
      toast.error('Failed to load KakaoTalk connection status');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConnectionStatus();
  }, []);

  // ============================================
  // Handlers
  // ============================================

  const handleConnect = () => {
    console.log('[KakaoTalkSettings] Initiating KakaoTalk OAuth flow...');
    toast.loading('Redirecting to KakaoTalk...', { id: 'kakao-connect' });
    window.location.href = '/api/kakao/connect';
  };

  const handleDisconnect = async () => {
    console.log('[KakaoTalkSettings] Disconnecting KakaoTalk account...');
    setIsDisconnecting(true);

    try {
      const result = await disconnectKakao();
      console.log('[KakaoTalkSettings] Disconnect result:', result);

      if (result.success) {
        toast.success('KakaoTalk account disconnected successfully');
        setConnectionState({
          isConnected: false,
          twoWaySync: false,
        });
        setShowDisconnectConfirm(false);
      } else {
        toast.error(result.error || 'Failed to disconnect KakaoTalk');
      }
    } catch (error) {
      console.error('[KakaoTalkSettings] Error disconnecting:', error);
      toast.error('Unexpected error disconnecting KakaoTalk');
    } finally {
      setIsDisconnecting(false);
    }
  };

  const handleSyncToggle = async (enabled: boolean) => {
    console.log('[KakaoTalkSettings] Toggling two-way sync to:', enabled);
    setIsTogglingSync(true);

    try {
      const result = await updateTwoWaySync(enabled);
      console.log('[KakaoTalkSettings] Sync toggle result:', result);

      if (result.success) {
        setConnectionState((prev) => ({
          ...prev,
          twoWaySync: enabled,
        }));
        toast.success(
          enabled
            ? 'Two-way message sync enabled'
            : 'Two-way message sync disabled'
        );
      } else {
        toast.error(result.error || 'Failed to update sync setting');
      }
    } catch (error) {
      console.error('[KakaoTalkSettings] Error toggling sync:', error);
      toast.error('Unexpected error updating sync setting');
    } finally {
      setIsTogglingSync(false);
    }
  };

  // ============================================
  // Render Loading State
  // ============================================

  if (isLoading) {
    return (
      <div className="bg-white border-2 border-gray-200 rounded-xl shadow-construction">
        <div className="p-6 md:p-8">
          <div className="flex items-center justify-center gap-3 py-8">
            <Loader2 className="h-6 w-6 animate-spin text-construction-blue" />
            <p className="text-base font-semibold text-gray-500">
              Loading connection status...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // Render Main UI
  // ============================================

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-3 md:space-y-4"
    >
      {/* Connection Status Card */}
      <div className="bg-white border-2 border-gray-200 rounded-xl shadow-construction overflow-hidden">
        <div className="p-4 md:p-5 space-y-4">
          {/* Status Badge */}
          <AnimatePresence mode="wait">
            {connectionState.isConnected ? (
              <motion.div
                key="connected"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="inline-flex items-center gap-3 px-4 py-3 bg-[#059669]/10 border border-[#059669]/30 rounded-xl"
              >
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center bg-[#059669]/20 rounded-lg"
                >
                  <CheckCircle2 className="h-6 w-6 text-[#059669]" />
                </motion.div>
                <div>
                  <p className="text-base font-bold text-[#059669]">
                    Connected
                  </p>
                  <p className="text-sm text-[#059669]/70">
                    All communications synced
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="disconnected"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="inline-flex items-center gap-3 px-4 py-3 bg-gray-100 border border-gray-300 rounded-xl"
              >
                <div className="min-w-[44px] min-h-[44px] flex items-center justify-center bg-gray-200 rounded-lg">
                  <XCircle className="h-6 w-6 text-gray-500" />
                </div>
                <div>
                  <p className="text-base font-bold text-gray-600">
                    Not Connected
                  </p>
                  <p className="text-sm text-gray-500">
                    No active integration
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Connected: Show Details & Sync Toggle */}
          {connectionState.isConnected && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-3 pt-2"
            >
              {/* Connection Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex items-center justify-between p-3 md:p-4 bg-gray-50 border border-gray-200 rounded-xl min-h-[56px]">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4 text-construction-blue" />
                    <span className="text-xs font-bold text-gray-600 uppercase">
                      KakaoTalk ID
                    </span>
                  </div>
                  <span className="text-sm font-mono font-bold text-construction-blue">
                    {connectionState.kakaoUserId}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 md:p-4 bg-gray-50 border border-gray-200 rounded-xl min-h-[56px]">
                  <div className="flex items-center gap-2">
                    <Link2 className="h-4 w-4 text-gray-500" />
                    <span className="text-xs font-bold text-gray-600 uppercase">
                      Sendbird ID
                    </span>
                  </div>
                  <span className="text-sm font-mono font-bold text-gray-700">
                    {connectionState.sendbirdUserId}
                  </span>
                </div>
              </div>

              {/* Two-Way Sync Toggle - Touch-friendly */}
              <div className="flex items-center justify-between p-4 bg-[#F59E0B]/5 border border-[#F59E0B]/30 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="min-w-[44px] min-h-[44px] flex items-center justify-center bg-[#F59E0B]/20 rounded-lg">
                    <Zap className="h-5 w-5 text-[#F59E0B]" />
                  </div>
                  <div>
                    <p className="text-base font-bold text-construction-blue">
                      Two-Way Sync
                    </p>
                    <p className="text-sm text-gray-500">
                      {connectionState.twoWaySync
                        ? 'Messages sync bidirectionally'
                        : 'One-way sync only'}
                    </p>
                  </div>
                </div>

                <div
                  className={cn(
                    'flex flex-col items-center gap-1.5 p-2 -m-2 rounded-lg',
                    'min-w-[60px] min-h-[60px] justify-center',
                    isTogglingSync && 'opacity-50'
                  )}
                >
                  <Switch
                    checked={connectionState.twoWaySync}
                    onCheckedChange={handleSyncToggle}
                    disabled={isTogglingSync}
                    className={cn(
                      'data-[state=checked]:bg-[#059669] data-[state=unchecked]:bg-gray-300',
                      'scale-110',
                      isTogglingSync && 'cursor-wait'
                    )}
                  />
                  <span className="text-xs font-bold text-gray-500 uppercase">
                    {connectionState.twoWaySync ? 'ON' : 'OFF'}
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Disconnected: Show Benefits & Connect Button */}
          {!connectionState.isConnected && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-4 pt-2"
            >
              {/* Benefits List */}
              <div className="p-4 bg-construction-blue/5 border-l-4 border-construction-blue rounded-r-xl">
                <p className="text-sm font-bold text-construction-blue mb-2">
                  Connect to enable:
                </p>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <ChevronRight className="h-4 w-4 text-construction-blue shrink-0" />
                    <span>Sync messages between GenHub and KakaoTalk</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <ChevronRight className="h-4 w-4 text-construction-blue shrink-0" />
                    <span>Receive notifications via KakaoTalk</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <ChevronRight className="h-4 w-4 text-construction-blue shrink-0" />
                    <span>Enable two-way team communication</span>
                  </li>
                </ul>
              </div>

              {/* Connect Button - Touch-friendly with 56px height */}
              <button
                onClick={handleConnect}
                className={cn(
                  'w-full h-14 px-6',
                  'bg-construction-blue text-white',
                  'font-bold text-base',
                  'rounded-xl',
                  'flex items-center justify-center gap-3',
                  'active:scale-[0.98] active:bg-construction-blue/90',
                  'transition-all duration-150',
                  'shadow-sm'
                )}
              >
                <Link2 className="h-5 w-5" />
                Connect KakaoTalk Account
                <ArrowRight className="h-5 w-5 ml-auto" />
              </button>
            </motion.div>
          )}
        </div>
      </div>

      {/* Disconnect Section (only when connected) */}
      {connectionState.isConnected && (
        <AnimatePresence mode="wait">
          {showDisconnectConfirm ? (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <div className="bg-[#DC2626]/5 border-2 border-[#DC2626]/30 rounded-xl overflow-hidden">
                <div className="p-4 md:p-5 space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="min-w-[44px] min-h-[44px] flex items-center justify-center bg-[#DC2626]/10 rounded-lg shrink-0">
                      <AlertTriangle className="h-5 w-5 text-[#DC2626]" />
                    </div>
                    <div className="pt-1">
                      <p className="text-base font-bold text-[#DC2626]">
                        Confirm Disconnection
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        This will disconnect your KakaoTalk account and disable all message sync.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={handleDisconnect}
                      disabled={isDisconnecting}
                      className={cn(
                        'flex-1 h-12 px-4',
                        'bg-[#DC2626] text-white',
                        'font-bold text-sm',
                        'rounded-xl',
                        'flex items-center justify-center gap-2',
                        'active:scale-[0.98] active:bg-[#DC2626]/90',
                        'transition-all duration-150',
                        isDisconnecting && 'opacity-50 pointer-events-none'
                      )}
                    >
                      {isDisconnecting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Disconnecting...
                        </>
                      ) : (
                        <>
                          <Unlink className="h-4 w-4" />
                          Confirm Disconnect
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => setShowDisconnectConfirm(false)}
                      disabled={isDisconnecting}
                      className={cn(
                        'flex-1 h-12 px-4',
                        'bg-white text-gray-700',
                        'font-bold text-sm',
                        'rounded-xl',
                        'border-2 border-gray-300',
                        'flex items-center justify-center',
                        'active:scale-[0.98] active:bg-gray-50',
                        'transition-all duration-150'
                      )}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <button
                onClick={() => setShowDisconnectConfirm(true)}
                className={cn(
                  'w-full h-12 px-4',
                  'bg-white text-[#DC2626]',
                  'font-semibold text-sm',
                  'rounded-xl',
                  'border-2 border-[#DC2626]/30',
                  'flex items-center justify-center gap-2',
                  'active:scale-[0.98] active:bg-[#DC2626]/5',
                  'transition-all duration-150'
                )}
              >
                <Unlink className="h-4 w-4" />
                Disconnect KakaoTalk
                <ChevronRight className="h-4 w-4 ml-auto" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </motion.div>
  );
}
