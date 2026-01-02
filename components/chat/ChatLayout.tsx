'use client';

/**
 * ChatLayout - Main chat layout with real-time room updates
 *
 * Features:
 * - Responsive layout (desktop sidebar + room, mobile full-screen)
 * - Real-time room list updates via useChatRooms hook
 * - Connection status indicator
 * - Room selection and navigation
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ChatRoomList } from './ChatRoomList';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { ConnectionStatus, CompactConnectionStatus } from './ConnectionStatus';
import { PushPermissionPrompt } from './PushPermissionPrompt';
import { MuteRoomDropdown } from './MuteRoomDropdown';
import { SearchMessages } from './SearchMessages';
import { ChatSettings } from './ChatSettings';
import { ArrowLeft, Users, Settings, MoreVertical, Search } from 'lucide-react';
import { ChatRoomWithUnread, MessageWithSender } from '@/types/chat.types';
import { useChatRooms } from '@/lib/hooks/useChatRooms';

interface CompanyUser {
  id: string;
  name: string;
  email?: string;
  avatar_url?: string;
  role?: string;
}

interface ChatLayoutProps {
  initialRooms: ChatRoomWithUnread[];
  companyUsers?: CompanyUser[];
  userContext: {
    userId: string;
    userName: string;
    companyId: string;
  };
}

// Debug: Main chat layout with responsive sidebar and message area
export function ChatLayout({ initialRooms, companyUsers = [], userContext }: ChatLayoutProps) {
  console.log('[ChatLayout] Received companyUsers:', companyUsers.length);
  console.log('[ChatLayout] User context:', userContext.userId, userContext.userName);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(true);
  const [replyTo, setReplyTo] = useState<MessageWithSender | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Debug: Store optimistic UI functions from MessageList
  const [optimisticFunctions, setOptimisticFunctions] = useState<{
    addOptimisticMessage: (message: any) => void;
    confirmMessage: (tempId: string, realMessage: MessageWithSender) => void;
    failMessage: (tempId: string, error: string) => void;
  } | null>(null);

  // Debug: Handle mobile detection (avoids hydration mismatch)
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Debug: Use real-time chat rooms hook
  const {
    rooms,
    totalUnread,
    isConnected,
    connectionError,
    updateRoomUnread,
  } = useChatRooms({
    userId: userContext.userId,
    companyId: userContext.companyId,
    initialRooms,
    onUnreadChange: (roomId, count) => {
      console.log('[ChatLayout] Unread changed for room:', roomId, 'count:', count);
    },
    onNewRoom: (room) => {
      console.log('[ChatLayout] New room added:', room.id);
    },
  });

  console.log('[ChatLayout] Rendering with rooms:', rooms.length, 'Active room:', activeRoomId);

  // Debug: Get active room data
  const activeRoom = rooms.find((r) => r.id === activeRoomId);

  // Debug: Handle room selection with mobile sidebar toggle
  const handleRoomSelect = (roomId: string) => {
    console.log('[ChatLayout] Room selected:', roomId);
    setActiveRoomId(roomId);

    // On mobile, hide sidebar when room selected
    if (isMobile) {
      setIsMobileSidebarOpen(false);
    }
  };

  // Debug: Handle back to rooms list on mobile
  const handleBackToRooms = () => {
    console.log('[ChatLayout] Back to rooms');
    setActiveRoomId(null);
    setIsMobileSidebarOpen(true);
  };

  // Debug: Handle reply action
  const handleReply = (message: MessageWithSender) => {
    console.log('[ChatLayout] Reply to message:', message.id);
    setReplyTo(message);
  };

  // Debug: Handle new message - update unread count for active room to 0
  const handleNewMessage = (message: MessageWithSender) => {
    console.log('[ChatLayout] New message in room:', message.chat_room_id);
    // If the new message is in the active room, keep unread at 0
    if (message.chat_room_id === activeRoomId) {
      updateRoomUnread(activeRoomId, 0);
    }
  };

  // Debug: Determine connection state for UI
  const connectionState = isConnected
    ? 'connected'
    : connectionError
      ? 'disconnected'
      : 'connecting';

  return (
    <>
      {/* Debug: Push Permission Prompt - Show on first visit */}
      <PushPermissionPrompt />

      <div className="flex h-full bg-gray-50 overflow-hidden">
        {/* Debug: Sidebar - Desktop: always visible, Mobile: conditional */}
      <AnimatePresence mode="wait">
        {(isMobileSidebarOpen || !isMobile) && (
          <motion.div
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={cn(
              'border-r-2 border-gray-200 bg-white',
              'md:w-[300px] md:flex md:flex-col',
              'w-full flex flex-col',
              // Blueprint-inspired subtle grid overlay
              'relative before:absolute before:inset-0 before:bg-[linear-gradient(rgba(0,27,81,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,27,81,0.02)_1px,transparent_1px)] before:bg-[size:20px_20px] before:pointer-events-none'
            )}
          >
            {/* Debug: Connection status at top of sidebar - only show errors */}
            {connectionError && (
              <div className="px-4 pt-2">
                <ConnectionStatus state="disconnected" />
              </div>
            )}

            <ChatRoomList
              rooms={rooms}
              activeRoomId={activeRoomId}
              onRoomSelect={handleRoomSelect}
              totalUnread={totalUnread}
              companyUsers={companyUsers}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Debug: Main Area - Desktop: always visible, Mobile: show when room selected */}
      <div
        className={cn(
          'flex flex-col flex-1 min-w-0',
          // Mobile: show when room selected
          activeRoomId ? 'flex' : 'hidden md:flex'
        )}
      >
        {activeRoomId && activeRoom ? (
          <>
            {/* Debug: Room Header */}
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="h-16 border-b-2 border-gray-200 bg-white flex items-center justify-between px-4 md:px-6 shrink-0"
            >
              <div className="flex items-center gap-3">
                {/* Debug: Mobile back button */}
                <button
                  onClick={handleBackToRooms}
                  className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ArrowLeft className="h-5 w-5 text-gray-700" />
                </button>

                <div className="flex items-center gap-2">
                  {/* Debug: Compact connection status - only show errors */}
                  {connectionError && <CompactConnectionStatus state="disconnected" />}
                  <div>
                    <h2 className="text-lg font-bold text-construction-blue">
                      {activeRoom.name}
                    </h2>
                    <p className="text-xs text-gray-500 font-mono">
                      {activeRoom.participant_count} participant
                      {activeRoom.participant_count !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              </div>

              {/* Debug: Room actions */}
              <div className="flex items-center gap-2">
                {/* Debug: Search messages button */}
                <button
                  onClick={() => {
                    console.log('[ChatLayout] Opening search');
                    setIsSearchOpen(true);
                  }}
                  className="p-2 hover:bg-construction-blue/10 rounded-lg transition-colors group"
                  title="Search messages"
                >
                  <Search className="h-5 w-5 text-gray-600 group-hover:text-construction-blue transition-colors" />
                </button>

                {/* Debug: Mute room dropdown */}
                <MuteRoomDropdown
                  chatRoomId={activeRoomId}
                  isMuted={!!(activeRoom.muted_until && new Date(activeRoom.muted_until) > new Date())}
                  mutedUntil={activeRoom.muted_until}
                />

                {/* Debug: Settings button (only for project rooms) */}
                {activeRoom.type === 'project' && (
                  <button
                    onClick={() => {
                      console.log('[ChatLayout] Opening settings');
                      setIsSettingsOpen(true);
                    }}
                    className="p-2 hover:bg-construction-blue/10 rounded-lg transition-colors group"
                    title="Room settings"
                  >
                    <Settings className="h-5 w-5 text-gray-600 group-hover:text-construction-blue transition-colors" />
                  </button>
                )}
              </div>
            </motion.div>

            {/* Debug: Message List with real-time updates */}
            <MessageList
              chatRoomId={activeRoomId}
              onReply={handleReply}
              onNewMessage={handleNewMessage}
              onOptimisticFunctionsReady={setOptimisticFunctions}
            />

            {/* Debug: Message Input */}
            {optimisticFunctions && (
              <MessageInput
                chatRoomId={activeRoomId}
                replyTo={replyTo}
                onCancelReply={() => setReplyTo(null)}
                userId={userContext.userId}
                userName={userContext.userName}
                addOptimisticMessage={optimisticFunctions.addOptimisticMessage}
                confirmMessage={optimisticFunctions.confirmMessage}
                failMessage={optimisticFunctions.failMessage}
              />
            )}
          </>
        ) : (
          // Debug: Empty state when no room selected
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="flex-1 flex flex-col items-center justify-center p-8 text-center"
          >
            <div className="relative mb-6">
              {/* Blueprint-style decorative circle */}
              <div className="absolute inset-0 bg-construction-blue/5 rounded-full blur-2xl" />
              <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-construction-blue/10 to-construction-blue/5 border-2 border-dashed border-construction-blue/30 flex items-center justify-center">
                <Users className="h-12 w-12 text-construction-blue/60" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Select a Chat to Start Messaging
            </h3>
            <p className="text-sm text-gray-500 max-w-sm">
              Choose a project chat or direct message from the sidebar to begin
              collaborating with your team.
            </p>
          </motion.div>
        )}
      </div>
      </div>

      {/* Debug: Search Messages Modal */}
      <SearchMessages
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        currentRoomId={activeRoomId || undefined}
        currentRoomName={activeRoom?.name}
      />

      {/* Debug: Chat Settings Modal (only for project rooms) */}
      {activeRoom && activeRoom.type === 'project' && (
        <ChatSettings
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          roomId={activeRoomId!}
          roomType={activeRoom.type}
          initialName={activeRoom.name}
          initialDescription={activeRoom.description}
        />
      )}
    </>
  );
}
