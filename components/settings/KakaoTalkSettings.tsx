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
  RefreshCw,
  ChevronRight,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  getKakaoConnection,
  disconnectKakao,
  updateTwoWaySync,
} from '@/app/actions/kakao';
import { toast } from 'sonner';

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

    // Redirect to OAuth endpoint
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
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative overflow-hidden rounded-lg border-4 border-[#3C3C3C] bg-gradient-to-br from-gray-50 to-gray-100 p-8"
      >
        {/* Riveted border effect */}
        <RivetedBorder />

        <div className="flex items-center justify-center gap-3 py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[#001B51]" />
          <p className="text-lg font-bold text-[#3C3C3C] uppercase font-['IBM_Plex_Mono']">
            Loading connection status...
          </p>
        </div>
      </motion.div>
    );
  }

  // ============================================
  // Render Main UI
  // ============================================

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, type: 'spring', stiffness: 100 }}
      className="relative overflow-hidden rounded-lg border-4 border-[#3C3C3C] bg-white shadow-2xl"
    >
      {/* Riveted border effect */}
      <RivetedBorder />

      {/* Diagonal hazard stripes background */}
      <div
        className="absolute top-0 right-0 w-32 h-32 opacity-5"
        style={{
          backgroundImage: `repeating-linear-gradient(
            45deg,
            #FFB627,
            #FFB627 10px,
            transparent 10px,
            transparent 20px
          )`,
        }}
      />

      <div className="relative z-10 p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 pb-4 border-b-2 border-[#3C3C3C]">
          <div className="p-3 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-lg shadow-lg transform -rotate-3">
            <MessageCircle className="h-7 w-7 text-[#001B51]" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-[#001B51] uppercase tracking-wider font-['Work_Sans']">
              KakaoTalk Integration
            </h3>
            <p className="text-sm text-[#7A7A7A] font-['IBM_Plex_Mono'] mt-1">
              MESSAGING CONTROL • Connect external communications
            </p>
          </div>
        </div>

        {/* Connection Status */}
        <AnimatePresence mode="wait">
          {connectionState.isConnected ? (
            <ConnectedState
              connectionState={connectionState}
              isDisconnecting={isDisconnecting}
              isTogglingSync={isTogglingSync}
              showDisconnectConfirm={showDisconnectConfirm}
              onDisconnect={handleDisconnect}
              onCancelDisconnect={() => setShowDisconnectConfirm(false)}
              onShowDisconnectConfirm={() => setShowDisconnectConfirm(true)}
              onSyncToggle={handleSyncToggle}
            />
          ) : (
            <DisconnectedState onConnect={handleConnect} />
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ============================================
// Sub-Components
// ============================================

function RivetedBorder() {
  return (
    <>
      {/* Top border with rivets */}
      <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-r from-[#3C3C3C] via-[#7A7A7A] to-[#3C3C3C]">
        <div className="flex justify-around items-center h-full px-4">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-[#1a1a1a] border border-gray-600 shadow-inner"
            />
          ))}
        </div>
      </div>

      {/* Bottom border with rivets */}
      <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-r from-[#3C3C3C] via-[#7A7A7A] to-[#3C3C3C]">
        <div className="flex justify-around items-center h-full px-4">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-[#1a1a1a] border border-gray-600 shadow-inner"
            />
          ))}
        </div>
      </div>
    </>
  );
}

// ============================================
// Connected State
// ============================================

interface ConnectedStateProps {
  connectionState: ConnectionState;
  isDisconnecting: boolean;
  isTogglingSync: boolean;
  showDisconnectConfirm: boolean;
  onDisconnect: () => void;
  onCancelDisconnect: () => void;
  onShowDisconnectConfirm: () => void;
  onSyncToggle: (enabled: boolean) => void;
}

function ConnectedState({
  connectionState,
  isDisconnecting,
  isTogglingSync,
  showDisconnectConfirm,
  onDisconnect,
  onCancelDisconnect,
  onShowDisconnectConfirm,
  onSyncToggle,
}: ConnectedStateProps) {
  return (
    <motion.div
      key="connected"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Status Badge */}
      <motion.div
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="inline-flex items-center gap-3 px-5 py-3 bg-gradient-to-r from-green-50 to-emerald-50 border-3 border-green-500 rounded-lg shadow-lg"
      >
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <CheckCircle2 className="h-6 w-6 text-green-600" />
        </motion.div>
        <div>
          <p className="text-lg font-black text-green-700 uppercase font-['Work_Sans']">
            Connection Active
          </p>
          <p className="text-xs text-green-600 font-['IBM_Plex_Mono']">
            System operational • All communications synced
          </p>
        </div>
      </motion.div>

      {/* Connection Details */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="space-y-3"
      >
        <div className="flex items-center justify-between p-4 bg-gray-50 border-2 border-gray-300 rounded-md">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#001B51] rounded">
              <MessageCircle className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#3C3C3C] uppercase font-['IBM_Plex_Mono']">
                KakaoTalk User ID
              </p>
              <p className="text-xs text-gray-500">Primary identifier</p>
            </div>
          </div>
          <p className="text-base font-mono font-bold text-[#001B51] bg-blue-50 px-3 py-1 rounded border border-blue-200">
            {connectionState.kakaoUserId}
          </p>
        </div>

        <div className="flex items-center justify-between p-4 bg-gray-50 border-2 border-gray-300 rounded-md">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#3C3C3C] rounded">
              <Link2 className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#3C3C3C] uppercase font-['IBM_Plex_Mono']">
                Sendbird User ID
              </p>
              <p className="text-xs text-gray-500">Messaging platform</p>
            </div>
          </div>
          <p className="text-base font-mono font-bold text-[#3C3C3C] bg-gray-100 px-3 py-1 rounded border border-gray-300">
            {connectionState.sendbirdUserId}
          </p>
        </div>
      </motion.div>

      {/* Two-Way Sync Toggle */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="relative overflow-hidden border-4 border-[#FFB627] bg-gradient-to-br from-yellow-50 to-amber-50 rounded-lg p-5 shadow-lg"
      >
        {/* Hazard pattern */}
        <div
          className="absolute top-0 left-0 w-full h-2"
          style={{
            backgroundImage: `repeating-linear-gradient(
              45deg,
              #FFB627,
              #FFB627 10px,
              #000 10px,
              #000 20px
            )`,
          }}
        />

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-3">
            <Zap className="h-6 w-6 text-[#FFB627]" />
            <div>
              <p className="text-base font-black text-[#001B51] uppercase font-['Work_Sans']">
                Two-Way Message Sync
              </p>
              <p className="text-xs text-[#7A7A7A] font-['IBM_Plex_Mono'] mt-1">
                {connectionState.twoWaySync
                  ? 'ENABLED • Messages sync bidirectionally'
                  : 'DISABLED • One-way sync only'}
              </p>
            </div>
          </div>

          <button
            onClick={() => onSyncToggle(!connectionState.twoWaySync)}
            disabled={isTogglingSync}
            className="relative"
          >
            <motion.div
              animate={{
                backgroundColor: connectionState.twoWaySync
                  ? '#059669'
                  : '#9CA3AF',
              }}
              className="w-16 h-8 rounded-full shadow-inner border-2 border-black/20"
            >
              <motion.div
                animate={{
                  x: connectionState.twoWaySync ? 32 : 2,
                }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-lg border-2 border-black/10 flex items-center justify-center"
              >
                {isTogglingSync ? (
                  <Loader2 className="h-3 w-3 animate-spin text-[#001B51]" />
                ) : connectionState.twoWaySync ? (
                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                ) : (
                  <XCircle className="h-3 w-3 text-gray-400" />
                )}
              </motion.div>
            </motion.div>
          </button>
        </div>
      </motion.div>

      {/* Disconnect Section */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <AnimatePresence mode="wait">
          {showDisconnectConfirm ? (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="border-4 border-red-500 bg-gradient-to-br from-red-50 to-orange-50 rounded-lg p-6 space-y-4"
            >
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-7 w-7 text-red-600 flex-shrink-0 mt-1" />
                <div>
                  <p className="text-lg font-black text-red-700 uppercase font-['Work_Sans']">
                    Confirm Disconnection
                  </p>
                  <p className="text-sm text-red-600 font-['IBM_Plex_Mono'] mt-2">
                    This will disconnect your KakaoTalk account and disable all
                    message sync. This action cannot be undone.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={onDisconnect}
                  disabled={isDisconnecting}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-black uppercase py-6 text-base shadow-lg transform hover:scale-105 transition-all border-2 border-red-800"
                >
                  {isDisconnecting ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      Disconnecting...
                    </>
                  ) : (
                    <>
                      <Unlink className="h-5 w-5 mr-2" />
                      Confirm Disconnect
                    </>
                  )}
                </Button>

                <Button
                  onClick={onCancelDisconnect}
                  disabled={isDisconnecting}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-black uppercase py-6 text-base shadow-lg transform hover:scale-105 transition-all border-2 border-gray-800"
                >
                  Cancel
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Button
                onClick={onShowDisconnectConfirm}
                className="w-full bg-gradient-to-r from-red-50 to-orange-50 hover:from-red-100 hover:to-orange-100 text-red-700 border-3 border-red-500 font-black uppercase py-6 text-base shadow-lg transform hover:scale-105 transition-all"
              >
                <Unlink className="h-5 w-5 mr-2" />
                Disconnect KakaoTalk
                <ChevronRight className="h-5 w-5 ml-auto" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

// ============================================
// Disconnected State
// ============================================

interface DisconnectedStateProps {
  onConnect: () => void;
}

function DisconnectedState({ onConnect }: DisconnectedStateProps) {
  return (
    <motion.div
      key="disconnected"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Status Badge */}
      <motion.div
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="inline-flex items-center gap-3 px-5 py-3 bg-gray-50 border-3 border-gray-300 rounded-lg shadow-md"
      >
        <XCircle className="h-6 w-6 text-gray-500" />
        <div>
          <p className="text-lg font-black text-gray-700 uppercase font-['Work_Sans']">
            Not Connected
          </p>
          <p className="text-xs text-gray-500 font-['IBM_Plex_Mono']">
            No active KakaoTalk integration
          </p>
        </div>
      </motion.div>

      {/* Info Panel */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="border-2 border-[#FFB627] bg-gradient-to-br from-yellow-50 to-amber-50 rounded-lg p-6 space-y-4"
      >
        <div className="flex items-start gap-3">
          <div className="p-2 bg-[#FFB627] rounded">
            <MessageCircle className="h-5 w-5 text-[#001B51]" />
          </div>
          <div className="flex-1">
            <p className="text-base font-black text-[#001B51] uppercase font-['Work_Sans'] mb-2">
              Connect KakaoTalk
            </p>
            <ul className="space-y-2 text-sm text-[#3C3C3C] font-['IBM_Plex_Mono']">
              <li className="flex items-start gap-2">
                <ChevronRight className="h-4 w-4 text-[#FFB627] flex-shrink-0 mt-0.5" />
                <span>Sync messages between GenHub and KakaoTalk</span>
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight className="h-4 w-4 text-[#FFB627] flex-shrink-0 mt-0.5" />
                <span>Receive notifications via KakaoTalk</span>
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight className="h-4 w-4 text-[#FFB627] flex-shrink-0 mt-0.5" />
                <span>Enable two-way communication with your team</span>
              </li>
            </ul>
          </div>
        </div>
      </motion.div>

      {/* Connect Button */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <Button
          onClick={onConnect}
          className="w-full bg-gradient-to-r from-[#001B51] to-[#003080] hover:from-[#002970] hover:to-[#004090] text-white font-black uppercase py-7 text-lg shadow-2xl transform hover:scale-105 transition-all border-2 border-[#FFB627]"
        >
          <Link2 className="h-6 w-6 mr-3" />
          Connect KakaoTalk Account
          <ChevronRight className="h-6 w-6 ml-auto" />
        </Button>
      </motion.div>
    </motion.div>
  );
}
