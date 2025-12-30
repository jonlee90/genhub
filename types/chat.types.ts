import { Tables } from './database.types';

// Base types from database
export type ChatRoom = Tables<'chat_rooms'>;
export type ChatParticipant = Tables<'chat_participants'>;
export type Message = Tables<'messages'>;

// Entity reference types for @mentions
export type EntityReferenceType = 'user' | 'task' | 'project' | 'material' | 'expense';

export interface EntityReference {
  type: EntityReferenceType;
  id: string;
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
}

export interface ChatRoomWithUnread extends ChatRoom {
  unread_count: number;
  last_message?: MessageWithSender;
  participant_count: number;
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
