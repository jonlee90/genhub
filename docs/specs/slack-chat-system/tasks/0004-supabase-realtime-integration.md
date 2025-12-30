# Task 0004: Supabase Realtime Integration

## Phase
Phase 1: Core Chat (MVP)

## Overview
Implement real-time message delivery using Supabase Realtime with optimistic UI updates and connection recovery.

## Subtasks

### 4.1 Create `lib/hooks/useMessages.ts` hook for real-time messages
- Subscribe to `postgres_changes` INSERT events on messages table filtered by chat_room_id
- Subscribe to UPDATE events for edit/delete handling
- On new message: fetch full message with sender info, append to state
- On update: update message in state (content, edited_at, deleted_at)
- Clean up subscription on unmount

### 4.2 Create `lib/hooks/useChatRooms.ts` hook for room updates
- Subscribe to changes in chat_participants for current user
- Update unread counts when new messages arrive
- Re-sort rooms by last message activity

### 4.3 Implement optimistic UI for sending messages
- Add message to UI immediately with "sending" status
- Update message status to "sent" on successful insert
- Show error state and retry option on failure

### 4.4 Implement Realtime connection recovery
- Detect connection drops (CHANNEL_ERROR status)
- Implement exponential backoff reconnection (max 5 retries)
- Show "Reconnecting..." indicator in UI when disconnected
- Queue messages locally during disconnection

## Files to Create/Modify
- `lib/hooks/useMessages.ts` (new)
- `lib/hooks/useChatRooms.ts` (new)
- `components/chat/MessageList.tsx` (modify to use hooks)
- `components/chat/ChatRoomList.tsx` (modify to use hooks)
- `components/chat/ConnectionStatus.tsx` (new)

## Dependencies
- Task 0001: Database Schema & Migrations
- Task 0002: Server Actions for Basic Messaging
- Task 0003: Chat UI Components

## Acceptance Criteria
- [ ] New messages appear instantly without page refresh
- [ ] Message edits/deletes reflect in real-time
- [ ] Unread counts update when new messages arrive
- [ ] Optimistic UI shows messages immediately on send
- [ ] Connection recovery works after network interruption

## References
- Requirements: Req 1.8
- Design: Real-time Integration section, Error Handling
- Technical Constraints: Risks - Realtime Connection Limits
