'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ChatRoomItem } from './ChatRoomItem';
import { NewDMModal } from './NewDMModal';
import { ChatRoomWithUnread } from '@/types/chat.types';
import { Building2, MessageSquare, MessageCircle, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface User {
  id: string;
  name: string;
  email?: string;
  avatar_url?: string;
  role?: string;
}

interface ChatRoomListProps {
  rooms: ChatRoomWithUnread[];
  activeRoomId: string | null;
  onRoomSelect: (roomId: string) => void;
  totalUnread?: number;
  companyUsers?: User[]; // Company users for DM creation
}

// Debug: Chat room list with project/DM sections
export function ChatRoomList({ rooms, activeRoomId, onRoomSelect, totalUnread, companyUsers = [] }: ChatRoomListProps) {
  console.log('[ChatRoomList] Rendering with rooms:', rooms.length, 'Company users:', companyUsers.length, 'Total unread:', totalUnread);

  // Debug: State for New DM Modal
  const [showNewDMModal, setShowNewDMModal] = useState(false);

  // Debug: Sort rooms by most recent activity
  const sortedRooms = useMemo(() => {
    const sorted = [...rooms].sort((a, b) => {
      const aTime = a.last_message?.created_at || a.created_at;
      const bTime = b.last_message?.created_at || b.created_at;
      return new Date(bTime).getTime() - new Date(aTime).getTime();
    });
    console.log('[ChatRoomList] Sorted rooms by activity');
    return sorted;
  }, [rooms]);

  // Debug: Separate project and DM rooms
  const projectRooms = sortedRooms.filter((r) => r.type === 'project');
  const dmRooms = sortedRooms.filter((r) => r.type === 'dm');

  console.log('[ChatRoomList] Project rooms:', projectRooms.length, 'DM rooms:', dmRooms.length);

  return (
    <div className="flex flex-col h-full">
      {/* Debug: Header with blueprint-style title */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 border-b-2 border-gray-200 bg-gradient-to-br from-construction-blue/5 to-transparent"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black uppercase tracking-tight text-construction-blue">
            Messages
          </h2>
          {/* Debug: Total unread badge */}
          {totalUnread && totalUnread > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center justify-center min-w-[24px] h-6 px-2 bg-red-500 text-white text-xs font-bold rounded-full"
            >
              {totalUnread > 99 ? '99+' : totalUnread}
            </motion.div>
          )}
        </div>
        <p className="text-xs font-mono text-construction-blue/60 mt-0.5">
          COMM_SYSTEM_v1.0
        </p>
      </motion.div>

      {/* Debug: Room List - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        {/* Debug: Direct Messages Section (Top Priority) */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          {/* Section header with "New Message" button */}
          <div className="sticky top-0 z-10 px-4 py-3 bg-white/95 backdrop-blur-sm border-b border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-construction-blue" />
                <span className="text-xs font-black uppercase tracking-wider text-construction-blue">
                  Direct Messages
                </span>
              </div>
              {/* New Message Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  console.log('[ChatRoomList] Opening New DM Modal');
                  setShowNewDMModal(true);
                }}
                className="h-7 px-2 text-xs font-bold text-construction-blue hover:bg-construction-blue/10 hover:text-construction-blue border border-construction-blue/20"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                New
              </Button>
            </div>
            <div className="h-px bg-gradient-to-r from-construction-blue/20 to-transparent" />
          </div>

          {/* DM Room List */}
          {dmRooms.length > 0 ? (
            dmRooms.map((room, index) => (
              <ChatRoomItem
                key={room.id}
                room={room}
                isActive={room.id === activeRoomId}
                onSelect={() => onRoomSelect(room.id)}
                index={index}
              />
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="px-4 py-8 text-center"
            >
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-xs text-gray-500 font-medium mb-2">No direct messages yet</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowNewDMModal(true)}
                className="text-xs border-construction-blue/30 text-construction-blue hover:bg-construction-blue/5"
              >
                <Plus className="w-3 h-3 mr-1" />
                Start a conversation
              </Button>
            </motion.div>
          )}
        </motion.div>

        {/* Debug: Project Chats Section */}
        {projectRooms.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="mt-4"
          >
            {/* Section header with industrial badge style */}
            <div className="sticky top-0 z-10 px-4 py-3 bg-white/95 backdrop-blur-sm border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-construction-blue" />
                <span className="text-xs font-black uppercase tracking-wider text-construction-blue">
                  Project Chats
                </span>
                <div className="h-px flex-1 bg-gradient-to-r from-construction-blue/20 to-transparent" />
              </div>
            </div>
            {projectRooms.map((room, index) => (
              <ChatRoomItem
                key={room.id}
                room={room}
                isActive={room.id === activeRoomId}
                onSelect={() => onRoomSelect(room.id)}
                index={index}
              />
            ))}
          </motion.div>
        )}

        {/* Debug: Empty State (no rooms at all) */}
        {rooms.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col items-center justify-center py-16 px-6 text-center"
          >
            <div className="w-16 h-16 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center mb-4">
              <MessageCircle className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-sm font-bold text-gray-900 mb-1">No Chat Rooms Yet</h3>
            <p className="text-xs text-gray-500 max-w-[200px] mb-4">
              Chat rooms will appear here when you join projects or start conversations.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowNewDMModal(true)}
              className="text-xs border-construction-blue/30 text-construction-blue hover:bg-construction-blue/5"
            >
              <Plus className="w-3 h-3 mr-1" />
              Start a conversation
            </Button>
          </motion.div>
        )}
      </div>

      {/* Debug: New DM Modal */}
      <NewDMModal
        open={showNewDMModal}
        onClose={() => {
          console.log('[ChatRoomList] Closing New DM Modal');
          setShowNewDMModal(false);
        }}
        companyUsers={companyUsers}
      />
    </div>
  );
}
