import { Tables } from './database.types';

// Base types from database
export type ChatRoom = Tables<'chat_rooms'>;
export type ChatParticipant = Tables<'chat_participants'>;
export type Message = Tables<'messages'>;
export type MessageReaction = Tables<'message_reactions'>;

// Entity reference types for @mentions
export type EntityType = 'user' | 'task' | 'project' | 'material' | 'expense';
export type EntityReferenceType = EntityType; // Alias for backwards compatibility

export interface EntityReference {
  type: EntityType;
  id: string;
  displayName?: string; // Optional for display in UI
}

// Search result type for autocomplete
export interface SearchResult {
  id: string;
  name: string;
  type: EntityType;
  metadata?: Record<string, any>; // Type-specific data (e.g., status, price, etc.)
}

// Extended types with relationships

export interface MessageWithSender extends Message {
  sender: {
    id: string;
    name: string;
    avatar_url: string | null;
    email: string;
  };
  reply_to?: MessageWithSender;  // For threaded replies
  reactions?: MessageReactionGroup[];  // Grouped reactions
}

// Reaction types

export interface MessageReactionGroup {
  emoji: string;
  count: number;
  hasReacted: boolean;  // Whether current user has reacted with this emoji
  users: Array<{
    id: string;
    name: string;
    avatar_url: string | null;
  }>;
}

export interface MessageReactionWithUser extends MessageReaction {
  user: {
    id: string;
    name: string;
    avatar_url: string | null;
  };
}

export interface ChatRoomWithUnread extends ChatRoom {
  unread_count: number;
  last_message?: MessageWithSender;
  participant_count: number;
  muted_until?: string | null;  // From current user's participant record
}

export interface ChatRoomWithParticipants extends ChatRoom {
  participants: Array<
    ChatParticipant & {
      user: {
        id: string;
        name: string;
        avatar_url: string | null;
        email: string;
      };
    }
  >;
}

export interface ChatRoomDetail extends ChatRoomWithParticipants {
  unread_count: number;
  last_message?: MessageWithSender;
  project?: {
    id: string;
    name: string;
  };
}

// Type guards

export function isProjectRoom(room: ChatRoom): boolean {
  return room.type === 'project' && room.project_id !== null;
}

export function isDMRoom(room: ChatRoom): boolean {
  return room.type === 'dm';
}

export function isMessageDeleted(message: Message): boolean {
  return message.deleted_at !== null;
}

export function isMessageEdited(message: Message): boolean {
  return message.edited_at !== null;
}

// Utility types

export interface CreateChatRoomInput {
  company_id: string;
  project_id?: string;
  type: 'project' | 'dm';
  name?: string;
  description?: string;
}

export interface CreateMessageInput {
  chat_room_id: string;
  sender_id: string;
  content: string;
  reply_to_id?: string;
  entity_references?: EntityReference[];
}

export interface UpdateChatParticipantInput {
  last_read_at?: string;
  muted_until?: string | null;
}

export interface UpdateMessageInput {
  content?: string;
  edited_at?: string;
  deleted_at?: string | null;
}

// Real-time payload types (for Supabase Realtime)

export interface MessageRealtimePayload {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: Message;
  old: Message;
}

export interface ChatParticipantRealtimePayload {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: ChatParticipant;
  old: ChatParticipant;
}

// Construction-themed emoji reactions
// These are curated emojis that align with the construction industry theme

export const CONSTRUCTION_EMOJIS = [
  { emoji: '👍', label: 'Thumbs up', category: 'general' },
  { emoji: '✅', label: 'Check mark', category: 'general' },
  { emoji: '🏗️', label: 'Construction site', category: 'construction' },
  { emoji: '🔨', label: 'Hammer', category: 'tools' },
  { emoji: '🔧', label: 'Wrench', category: 'tools' },
  { emoji: '⚠️', label: 'Warning', category: 'safety' },
  { emoji: '🚧', label: 'Construction sign', category: 'construction' },
  { emoji: '📋', label: 'Clipboard', category: 'planning' },
  { emoji: '💰', label: 'Money', category: 'finance' },
  { emoji: '🏢', label: 'Building', category: 'construction' },
] as const;

export type ConstructionEmoji = typeof CONSTRUCTION_EMOJIS[number]['emoji'];
