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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
      <Card className="border-2 border-gray-200 shadow-construction">
        <CardContent className="p-8">
          <div className="flex items-center justify-center gap-3 py-8">
            <Loader2 className="h-6 w-6 animate-spin text-construction-blue" />
            <p className="text-base font-bold text-gray-500 uppercase">
              Loading connection status...
            </p>
          </div>
        </CardContent>
      </Card>
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
      className="space-y-4"
    >
      {/* Connection Status Card */}
      <Card className="border-2 border-gray-200 shadow-construction">
        <CardContent className="p-4 md:p-6 space-y-4">
          {/* Status Badge */}
          <AnimatePresence mode="wait">
            {connectionState.isConnected ? (
              <motion.div
                key="connected"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="inline-flex items-center gap-2 px-3 py-2 bg-construction-green/10 border border-construction-green/30 rounded-lg"
              >
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <CheckCircle2 className="h-5 w-5 text-construction-green" />
                </motion.div>
                <div>
                  <p className="text-sm font-bold text-construction-green uppercase">
                    Connected
                  </p>
                  <p className="text-xs text-construction-green/70">
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
                className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg"
              >
                <XCircle className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-sm font-bold text-gray-600 uppercase">
                    Not Connected
                  </p>
                  <p className="text-xs text-gray-500">
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
                <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
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

                <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
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

              {/* Two-Way Sync Toggle */}
              <div className="flex items-center justify-between p-4 bg-construction-yellow/5 border border-construction-yellow/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <Zap className="h-5 w-5 text-construction-yellow" />
                  <div>
                    <p className="text-sm font-bold text-construction-blue uppercase">
                      Two-Way Sync
                    </p>
                    <p className="text-xs text-gray-500">
                      {connectionState.twoWaySync
                        ? 'Messages sync bidirectionally'
                        : 'One-way sync only'}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-1">
                  <Switch
                    checked={connectionState.twoWaySync}
                    onCheckedChange={handleSyncToggle}
                    disabled={isTogglingSync}
                    className={cn(
                      'data-[state=checked]:bg-construction-green data-[state=unchecked]:bg-gray-300',
                      isTogglingSync && 'opacity-50 cursor-wait'
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
              <div className="p-4 bg-construction-blue/5 border-l-4 border-construction-blue rounded-r-lg">
                <p className="text-sm font-bold text-construction-blue mb-2">
                  Connect to enable:
                </p>
                <ul className="space-y-1.5 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <ChevronRight className="h-4 w-4 text-construction-blue" />
                    Sync messages between GenHub and KakaoTalk
                  </li>
                  <li className="flex items-center gap-2">
                    <ChevronRight className="h-4 w-4 text-construction-blue" />
                    Receive notifications via KakaoTalk
                  </li>
                  <li className="flex items-center gap-2">
                    <ChevronRight className="h-4 w-4 text-construction-blue" />
                    Enable two-way team communication
                  </li>
                </ul>
              </div>

              {/* Connect Button */}
              <Button
                onClick={handleConnect}
                className="w-full h-12 bg-construction-blue hover:bg-construction-blue/90 text-white font-bold uppercase shadow-construction hover:shadow-construction-lg transition-all"
              >
                <Link2 className="h-5 w-5 mr-2" />
                Connect KakaoTalk Account
                <ChevronRight className="h-5 w-5 ml-auto" />
              </Button>
            </motion.div>
          )}
        </CardContent>
      </Card>

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
              <Card className="border-2 border-construction-red/50 bg-construction-red/5">
                <CardContent className="p-4 md:p-6 space-y-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-6 w-6 text-construction-red shrink-0 mt-0.5" />
                    <div>
                      <p className="text-base font-bold text-construction-red uppercase">
                        Confirm Disconnection
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        This will disconnect your KakaoTalk account and disable all message sync. This action cannot be undone.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={handleDisconnect}
                      disabled={isDisconnecting}
                      className="flex-1 bg-construction-red hover:bg-construction-red/90 text-white font-bold uppercase"
                    >
                      {isDisconnecting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Disconnecting...
                        </>
                      ) : (
                        <>
                          <Unlink className="h-4 w-4 mr-2" />
                          Confirm Disconnect
                        </>
                      )}
                    </Button>

                    <Button
                      onClick={() => setShowDisconnectConfirm(false)}
                      disabled={isDisconnecting}
                      variant="outline"
                      className="flex-1 font-bold uppercase"
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              key="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Button
                onClick={() => setShowDisconnectConfirm(true)}
                variant="outline"
                className="w-full h-11 border-2 border-construction-red/30 text-construction-red hover:bg-construction-red/5 font-bold uppercase"
              >
                <Unlink className="h-4 w-4 mr-2" />
                Disconnect KakaoTalk
                <ChevronRight className="h-4 w-4 ml-auto" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </motion.div>
  );
}
