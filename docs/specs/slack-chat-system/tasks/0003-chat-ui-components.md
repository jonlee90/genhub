# Task 0003: Chat UI Components

## Phase
Phase 1: Core Chat (MVP)

## Overview
Build the core UI components for the chat interface including layout, room list, message list, and input.

## Subtasks

### 3.1 Create `app/app/chat/page.tsx` server component
- Fetch initial chat rooms using `getChatRooms()` action
- Pass rooms data to ChatLayout client component
- Handle loading and error states with appropriate UI

### 3.2 Create `components/chat/ChatLayout.tsx` client component
- Implement responsive layout: sidebar (room list) + main area (active room)
- Mobile: full-screen room view with back button
- Desktop: 300px sidebar + expandable main area
- Track activeRoomId in component state
- Use construction theme colors (#001B51 primary)

### 3.3 Create `components/chat/ChatRoomList.tsx` component
- Display project chats and DMs in separate sections
- Show room name, last message preview, timestamp
- Display unread count badge on rooms with unread messages
- Sort rooms by most recent message activity
- Highlight currently active room

### 3.4 Create `components/chat/ChatRoomItem.tsx` component
- Display room avatar (project icon or user avatar for DMs)
- Show room name with bold styling when unread > 0
- Display last message preview (truncated to 50 chars)
- Show relative timestamp (e.g., "2m", "1h", "Yesterday")
- Display muted icon if room is muted

### 3.5 Create `components/chat/MessageList.tsx` with virtualization
- Use @tanstack/react-virtual for performance with large message lists
- Implement infinite scroll: load 50 older messages on scroll up
- Display "New Messages" divider above first unread message
- Auto-scroll to bottom when new message arrives (if already at bottom)
- Show loading spinner during message fetch

### 3.6 Create `components/chat/MessageItem.tsx` component
- Display sender avatar, name, and timestamp
- Render message content with proper formatting
- Show "(edited)" indicator if message was edited
- Show "This message was deleted" placeholder for deleted messages
- Display hover actions menu (Reply, React, Copy, Edit/Delete for own messages)

### 3.7 Create `components/chat/MessageInput.tsx` component
- Implement auto-resizing textarea (min 1 row, max 5 rows)
- Add Send button (also send on Enter, Shift+Enter for newline)
- Add attachment button (placeholder for Phase 2)
- Disable send button when input is empty
- Clear input after successful send

## Files to Create/Modify
- `app/app/chat/page.tsx` (new)
- `components/chat/ChatLayout.tsx` (new)
- `components/chat/ChatRoomList.tsx` (new)
- `components/chat/ChatRoomItem.tsx` (new)
- `components/chat/MessageList.tsx` (new)
- `components/chat/MessageItem.tsx` (new)
- `components/chat/MessageInput.tsx` (new)

## Dependencies
- Task 0001: Database Schema & Migrations
- Task 0002: Server Actions for Basic Messaging

## Acceptance Criteria
- [ ] Chat page loads and displays room list
- [ ] Clicking a room shows messages in that room
- [ ] Messages display sender info, content, and timestamp
- [ ] Message input sends messages successfully
- [ ] Mobile layout works with full-screen room view
- [ ] Unread badges display correctly

## References
- Requirements: Req 1.4, Req 1.7-1.8, Req 7.5-7.6, Req 14.1-14.6, Req 15.2-15.3
- Design: Components section
