# Slack-like Chat System - Implementation Tasks

## Overview

This document provides an actionable implementation plan for the Slack-like Chat System feature based on the approved requirements and design documents. Tasks are organized into 6 phases, following a test-driven, incremental approach.

**References:**
- Requirements: `docs/specs/slack-chat-system/requirements.md`
- Design: `docs/specs/slack-chat-system/design.md`

---

## Phase 1: Core Chat (MVP)

### 1. Database Schema & Migrations

- [ ] 1.1 Create chat system database migration with all core tables
  - Create `chat_rooms` table with company_id, project_id, type ('project'/'dm'), name, description columns
  - Create `chat_participants` table with user_id, chat_room_id, role, last_read_at, muted_until columns
  - Create `messages` table with sender_id, content, reply_to_id, entity_references JSONB, edited_at, deleted_at columns
  - Add appropriate indexes for performance (chat_room_id, created_at DESC, sender_id)
  - Enable Supabase Realtime: `ALTER PUBLICATION supabase_realtime ADD TABLE messages;`
  - Save migration to `supabase/migrations/YYYYMMDDHHMMSS_create_chat_tables.sql`
  - References: Req 1.1-1.8, Req 15.1-15.5

- [ ] 1.2 Create RLS policies for chat tables
  - Add `chat_rooms` SELECT policy: users can view rooms they participate in
  - Add `chat_rooms` INSERT policy: users can create DM rooms in their company
  - Add `chat_participants` SELECT policy: users can view participants of their rooms
  - Add `chat_participants` UPDATE policy: users can update their own participation (mute, last_read_at)
  - Add `messages` SELECT policy: users can view messages in their rooms
  - Add `messages` INSERT policy: users can send messages to rooms they participate in
  - Add `messages` UPDATE policy: users can edit/delete their own messages
  - Run `mcp__supabase__get_advisors type:"security"` to verify policies
  - References: Req 1.6, Technical Constraints - Security

- [ ] 1.3 Create database triggers for project-chat synchronization
  - Create trigger `on_project_created_create_chat_room`: auto-creates chat room when project is created
  - Create trigger `on_project_team_member_added`: auto-adds participant when user joins project_team
  - Create trigger `on_project_team_member_removed`: removes participant when user leaves project_team
  - Create helper function `get_unread_count(chat_room_id, user_id)` for unread message counting
  - Test triggers by creating a project and verifying chat room + participants are created
  - References: Req 1.1-1.3, Req 12.3-12.4

- [ ] 1.4 Generate TypeScript types for chat tables
  - Run `mcp__supabase__generate_typescript_types`
  - Create `types/chat.types.ts` with extended interfaces (MessageWithSender, ChatRoomWithUnread, ReactionSummary)
  - Export EntityReference type for @mentions: `{type: 'user'|'task'|'project'|'material'|'expense', id: string}`
  - References: Design - Data Models

### 2. Server Actions for Basic Messaging

- [ ] 2.1 Create `app/actions/chat.ts` with core message actions
  - Implement `sendMessage(formData)` action with Zod validation (chatRoomId, content, replyToId, entityReferences)
  - Verify user is participant before sending
  - Insert message to database
  - Revalidate chat path after sending
  - Add debug logging for message flow
  - References: Req 1.8, Design - API Design

- [ ] 2.2 Implement chat room query actions in `app/actions/chat-queries.ts`
  - Implement `getChatRooms()` to fetch all rooms user participates in with unread counts
  - Implement `getMessages(chatRoomId, cursor?, limit?)` with pagination support (50 messages default)
  - Include sender info, reaction counts, attachment counts, reply counts in message queries
  - Order rooms by last message activity, messages by created_at DESC
  - References: Req 1.4-1.5, Req 1.7

- [ ] 2.3 Implement `markMessagesAsRead(chatRoomId)` action
  - Update `last_read_at` in chat_participants for current user
  - Revalidate chat paths to update unread badges
  - Call this action when user opens a chat room
  - References: Req 15.1-15.4

- [ ] 2.4 Write unit tests for chat server actions
  - Test authentication validation (reject unauthenticated users)
  - Test message content validation (min 1 char, max 10000 chars)
  - Test participant verification (reject non-participants)
  - Test pagination logic for getMessages
  - Create test file: `__tests__/actions/chat.test.ts`
  - References: Design - Testing Strategy

### 3. Chat UI Components

- [ ] 3.1 Create `app/app/chat/page.tsx` server component
  - Fetch initial chat rooms using `getChatRooms()` action
  - Pass rooms data to ChatLayout client component
  - Handle loading and error states with appropriate UI
  - References: Req 1.4, Design - Components

- [ ] 3.2 Create `components/chat/ChatLayout.tsx` client component
  - Implement responsive layout: sidebar (room list) + main area (active room)
  - Mobile: full-screen room view with back button
  - Desktop: 300px sidebar + expandable main area
  - Track activeRoomId in component state
  - Use construction theme colors (#001B51 primary)
  - References: Req 1.4, Design - Components

- [ ] 3.3 Create `components/chat/ChatRoomList.tsx` component
  - Display project chats and DMs in separate sections
  - Show room name, last message preview, timestamp
  - Display unread count badge on rooms with unread messages
  - Sort rooms by most recent message activity
  - Highlight currently active room
  - References: Req 1.4, Req 7.5-7.6

- [ ] 3.4 Create `components/chat/ChatRoomItem.tsx` component
  - Display room avatar (project icon or user avatar for DMs)
  - Show room name with bold styling when unread > 0
  - Display last message preview (truncated to 50 chars)
  - Show relative timestamp (e.g., "2m", "1h", "Yesterday")
  - Display muted icon if room is muted
  - References: Req 10.4, Req 15.2

- [ ] 3.5 Create `components/chat/MessageList.tsx` with virtualization
  - Use @tanstack/react-virtual for performance with large message lists
  - Implement infinite scroll: load 50 older messages on scroll up
  - Display "New Messages" divider above first unread message
  - Auto-scroll to bottom when new message arrives (if already at bottom)
  - Show loading spinner during message fetch
  - References: Req 15.3, Technical Constraints - Performance

- [ ] 3.6 Create `components/chat/MessageItem.tsx` component
  - Display sender avatar, name, and timestamp
  - Render message content with proper formatting
  - Show "(edited)" indicator if message was edited
  - Show "This message was deleted" placeholder for deleted messages
  - Display hover actions menu (Reply, React, Copy, Edit/Delete for own messages)
  - References: Req 1.7, Req 14.1-14.6

- [ ] 3.7 Create `components/chat/MessageInput.tsx` component
  - Implement auto-resizing textarea (min 1 row, max 5 rows)
  - Add Send button (also send on Enter, Shift+Enter for newline)
  - Add attachment button (placeholder for Phase 2)
  - Disable send button when input is empty
  - Clear input after successful send
  - References: Req 1.8

### 4. Supabase Realtime Integration

- [ ] 4.1 Create `lib/hooks/useMessages.ts` hook for real-time messages
  - Subscribe to `postgres_changes` INSERT events on messages table filtered by chat_room_id
  - Subscribe to UPDATE events for edit/delete handling
  - On new message: fetch full message with sender info, append to state
  - On update: update message in state (content, edited_at, deleted_at)
  - Clean up subscription on unmount
  - References: Req 1.8, Design - Real-time Integration

- [ ] 4.2 Create `lib/hooks/useChatRooms.ts` hook for room updates
  - Subscribe to changes in chat_participants for current user
  - Update unread counts when new messages arrive
  - Re-sort rooms by last message activity
  - References: Req 15.2, Req 15.5

- [ ] 4.3 Implement optimistic UI for sending messages
  - Add message to UI immediately with "sending" status
  - Update message status to "sent" on successful insert
  - Show error state and retry option on failure
  - References: Design - State Management

- [ ] 4.4 Implement Realtime connection recovery
  - Detect connection drops (CHANNEL_ERROR status)
  - Implement exponential backoff reconnection (max 5 retries)
  - Show "Reconnecting..." indicator in UI when disconnected
  - Queue messages locally during disconnection
  - References: Design - Error Handling, Technical Constraints - Risks

---

## Phase 2: Rich Features

### 5. Threaded Replies

- [ ] 5.1 Add thread support to message sending
  - Update `sendMessage` to accept optional `replyToId` parameter
  - Store `reply_to_id` in messages table referencing parent message
  - Create notification for parent message author when reply is added
  - References: Req 2.5-2.6

- [ ] 5.2 Create `components/chat/MessageThread.tsx` thread panel component
  - Display parent message at top of panel
  - List all replies chronologically below parent
  - Include MessageInput at bottom for adding replies
  - Add close button to return to main chat view
  - References: Req 2.2, Req 2.7

- [ ] 5.3 Add thread indicators to MessageItem
  - Display reply count indicator below message (e.g., "3 replies")
  - Make reply count clickable to open thread panel
  - Add "Reply in thread" action to hover menu
  - Filter threaded replies from main message list display
  - References: Req 2.1, Req 2.3-2.4

- [ ] 5.4 Write integration tests for threaded replies
  - Test creating a reply to a message
  - Test that replies don't appear in main chat
  - Test reply count updates correctly
  - Test notifications are created for thread participants
  - References: Design - Testing Strategy

### 6. Message Reactions

- [ ] 6.1 Create `message_reactions` table migration
  - Add columns: message_id, user_id, emoji, created_at
  - Add unique constraint on (message_id, user_id, emoji)
  - Add RLS policies: users can view reactions in their rooms, manage their own reactions
  - References: Req 3.1-3.7

- [ ] 6.2 Implement `toggleReaction(messageId, emoji)` server action
  - Check if reaction exists, remove if yes, add if no
  - No notification on reaction (silent acknowledgment per Req 3.7)
  - Revalidate message to update reaction display
  - References: Req 3.4, Design - API Design

- [ ] 6.3 Create `components/chat/MessageReactions.tsx` component
  - Display grouped reactions below message with emoji + count
  - Highlight reactions where current user has reacted
  - Show tooltip with reactor names on hover
  - References: Req 3.3, Req 3.5-3.6

- [ ] 6.4 Create reaction picker with construction-themed emojis
  - Include curated emojis: thumbs up, check mark, hard hat, hammer, wrench, warning, construction sign, clipboard, money, building
  - Trigger picker on hover menu "React" action
  - Close picker after emoji selection
  - References: Req 3.1-3.2, Design - Appendix (Construction Emojis)

### 7. Typing Indicators

- [ ] 7.1 Create `lib/hooks/useTypingIndicator.ts` hook
  - Use Supabase Broadcast channel for ephemeral typing state
  - Broadcast typing start when user begins typing
  - Broadcast typing stop after 3 seconds of no input or on message send
  - Track typing users in component state
  - References: Req 4.1, Req 4.4-4.6

- [ ] 7.2 Create `components/chat/TypingIndicator.tsx` component
  - Display "[User name] is typing..." for single user
  - Display "[User 1], [User 2] are typing..." for 2 users
  - Display "[User 1] and 2 others are typing..." for 3+ users
  - Position below message input area
  - Auto-remove typing indicator after 3 seconds timeout
  - References: Req 4.2-4.3

### 8. Online Presence

- [ ] 8.1 Create `lib/hooks/usePresence.ts` hook
  - Use Supabase Realtime Presence for tracking online users
  - Track current user with name and avatar in presence state
  - Update presence state on sync/join/leave events
  - Set user as "away" after 5 minutes of inactivity
  - References: Req 5.1-5.4, Req 5.6

- [ ] 8.2 Create `components/chat/OnlinePresence.tsx` component
  - Display green dot for online users, gray for offline/away
  - Show online member count in chat room header (e.g., "3 online")
  - Show presence indicator next to user avatars in participant list
  - References: Req 5.1-5.2, Req 5.5

### 9. File & Photo Sharing

- [ ] 9.1 Create `message_attachments` table migration
  - Add columns: message_id, file_name, file_url, file_type, file_size, thumbnail_url
  - Add CHECK constraint for file_size <= 10MB (10485760 bytes)
  - Add RLS policies for viewing attachments in participant rooms
  - References: Req 8.4, Technical Constraints - File Storage

- [ ] 9.2 Implement `uploadAttachment(formData)` server action
  - Validate file size (max 10MB) and type (jpg, png, gif, webp, pdf, doc, docx, xls, xlsx, zip)
  - Upload file to Vercel Blob storage
  - Create message_attachments record with file metadata
  - Optionally create attachments table record for project chat files
  - References: Req 8.3-8.6

- [ ] 9.3 Create `components/chat/FileUploader.tsx` component
  - Support file picker button and drag-and-drop
  - Show upload progress indicator
  - Allow cancellation of in-progress uploads
  - Display error for files exceeding 10MB limit
  - Support paste image from clipboard
  - References: Req 8.1-8.2, Req 8.10

- [ ] 9.4 Create `components/chat/FilePreview.tsx` component
  - Display image thumbnails with lightbox on click
  - Display file icon, name, and size for documents
  - Download file with original filename on click
  - Show grid layout for multiple attachments (max 4 visible, "+N more")
  - References: Req 8.7-8.9

---

## Phase 3: Entity References

### 10. @mention Autocomplete

- [ ] 10.1 Create `components/chat/EntityReference.tsx` autocomplete component
  - Trigger on @ character in message input
  - Show entity type filter options: @project:, @task:, @material:, @expense:, @[username]
  - Implement searchable dropdown with keyboard navigation (arrow keys, Enter to select)
  - Return reference token in format: `@[type:id:displayName]`
  - References: Req 6.1-6.7

- [ ] 10.2 Create entity search server actions
  - Implement `searchProjects(query)` - projects user has access to
  - Implement `searchTasks(query, projectId?)` - tasks from current project or all accessible
  - Implement `searchMaterials(query)` - materials from company catalog
  - Implement `searchExpenses(query)` - recent expenses
  - Implement `searchUsers(query, roomId)` - users in current chat room
  - References: Req 6.2-6.6

- [ ] 10.3 Parse and store entity references in messages
  - Extract reference tokens from message content on send
  - Store in entity_references JSONB array: `[{type, id}]`
  - Replace tokens with display text in rendered content
  - Create mention notification for @user references
  - References: Req 6.7, Req 6.9

### 11. Rich Preview Cards

- [ ] 11.1 Create `components/chat/EntityPreview.tsx` component
  - Accept entity type and ID props
  - Fetch entity data on mount
  - Render type-specific preview card
  - Make card clickable to navigate to entity detail page
  - References: Req 6.8, Req 6.10

- [ ] 11.2 Implement preview card variants for each entity type
  - Project: name, status badge, health score, completion percentage bar
  - Task: title, status badge, priority indicator, assignee avatar, due date
  - Material: product name, price, stock status badge, thumbnail image
  - Expense: description, formatted amount, status badge, vendor name
  - User: avatar, name, role badge, clickable to profile
  - References: Req 6.8

- [ ] 11.3 Integrate entity previews into MessageItem rendering
  - Parse entity_references from message data
  - Render EntityPreview cards inline within message content
  - Handle loading and error states gracefully
  - Cache entity data to avoid redundant fetches
  - References: Req 6.8

---

## Phase 4: Push Notifications

### 12. Service Worker Setup

- [ ] 12.1 Create Firebase Messaging Service Worker
  - Create `public/firebase-messaging-sw.js` file
  - Initialize Firebase with project credentials
  - Handle background message events
  - Display notification with sender name, message preview, chat room name
  - Handle notification click to navigate to specific message
  - References: Req 9.5-9.6, Design - Push Notification System

- [ ] 12.2 Update existing Service Worker for push compatibility
  - Modify `public/sw.js` or `next.config.js` PWA config
  - Import Firebase messaging scripts
  - Register for push notifications on app load
  - Handle foreground messages appropriately
  - References: Technical Constraints - Push Notifications

### 13. Push Subscription Management

- [ ] 13.1 Create `push_subscriptions` table migration
  - Add columns: user_id, endpoint, platform, p256dh_key, auth_key, user_agent, last_used_at
  - Add unique constraint on (user_id, endpoint)
  - Add RLS policy: users can manage their own subscriptions
  - References: Req 9.3, Design - Database Schema

- [ ] 13.2 Implement push subscription server actions
  - Create `registerPushSubscription(subscription)` action
  - Create `unregisterPushSubscription(endpoint)` action
  - Upsert subscription on registration, delete on unregister
  - Update last_used_at on successful push delivery
  - References: Design - API Design

- [ ] 13.3 Create push permission request UI
  - Display opt-in explanation on first chat access
  - Request notification permission using browser API
  - Get FCM token on permission grant
  - Store subscription using registerPushSubscription action
  - Handle permission denied gracefully with fallback messaging
  - References: Req 9.1-9.2

### 14. FCM Integration

- [ ] 14.1 Create Supabase Edge Function for sending push notifications
  - Create `supabase/functions/send-push-notification/index.ts`
  - Accept userId, title, body, data (roomId, url) as input
  - Fetch user's push subscriptions from database
  - Send push via FCM API for each subscription
  - Return count of successful sends
  - References: Design - Push Notification System

- [ ] 14.2 Integrate push triggers into message sending flow
  - After message insert, identify offline recipients (not currently active in room)
  - Call Edge Function with notification payload
  - Respect muted rooms (check muted_until before sending)
  - Always send for @mentions (override mute)
  - Rate limit: max 5 non-critical pushes per hour per user
  - References: Req 9.4, Req 9.7, Req 9.9-9.10

- [ ] 14.3 Implement app badge count updates
  - Calculate total unread messages across all rooms
  - Update PWA badge using `navigator.setAppBadge()` API
  - Clear badge when all messages are read
  - References: Req 9.8

### 15. Notification Preferences UI

- [ ] 15.1 Create `components/settings/ChatNotificationPreferences.tsx` component
  - Add to Settings page under Notifications section
  - Toggle for push notifications (on/off, default: on)
  - Toggle for email notifications (on/off, default: off for chat)
  - Note that in-app notifications are always on
  - References: Req 10.1-10.2

- [ ] 15.2 Implement chat room muting functionality
  - Create `muteChatRoom(chatRoomId, mutedUntil)` server action
  - Add mute options: 1 hour, 8 hours, 24 hours, 7 days, until turned off
  - Update muted_until in chat_participants table
  - Display muted icon on muted rooms in chat list
  - References: Req 10.3-10.4

- [ ] 15.3 Implement mention override for muted rooms
  - Check for @user references matching current user
  - Send push notification even if room is muted for mentions
  - Display notification with "You were mentioned" emphasis
  - References: Req 10.5

---

## Phase 5: KakaoTalk Integration

### 16. Sendbird Setup

- [ ] 16.1 Create `kakao_connections` table migration
  - Add columns: user_id, kakao_user_id, sendbird_user_id, two_way_sync, connected_at, disconnected_at, access_token (encrypted), refresh_token (encrypted)
  - Add unique constraint on user_id
  - Add RLS policy: users can manage their own connection
  - References: Design - Database Schema

- [ ] 16.2 Create `lib/services/kakao.ts` service class
  - Implement KakaoService class with Sendbird API integration
  - Add `connectKakaoAccount(userId, authCode)` method for OAuth exchange
  - Add `disconnectKakaoAccount(userId)` method
  - Add `sendAlimTalk(userId, template)` method for template notifications
  - Add `syncMessage(userId, message)` method for two-way sync
  - References: Design - KakaoTalk Integration

### 17. OAuth Connection Flow

- [ ] 17.1 Create KakaoTalk OAuth callback API route
  - Create `app/api/kakao/callback/route.ts`
  - Exchange authorization code for tokens via Sendbird
  - Store connection in kakao_connections table
  - Redirect to settings page with success/error message
  - References: Req 11.2

- [ ] 17.2 Create `components/settings/KakaoTalkSettings.tsx` component
  - Display "Connect KakaoTalk" button when not connected
  - Show linked KakaoTalk ID and "Disconnect" button when connected
  - Add toggle for two-way message sync
  - Initiate OAuth flow on connect button click
  - References: Req 11.1, Req 11.3-11.4

### 18. AlimTalk Templates

- [ ] 18.1 Register AlimTalk templates with Sendbird
  - Create template for task assignments
  - Create template for expense approvals/rejections
  - Create template for project milestone updates
  - Store template codes in environment variables or config
  - References: Req 11.5

- [ ] 18.2 Integrate AlimTalk sending for key events
  - Send task assignment notification via AlimTalk if user has KakaoTalk connected
  - Send expense approval/rejection notification
  - Send project milestone notification
  - Handle send failures with retry logic (up to 3 times)
  - References: Req 11.5, Req 11.7

### 19. Two-Way Sync (Optional)

- [ ] 19.1 Implement message sync from GenHub to KakaoTalk
  - After sending message in GenHub, check if sender has two_way_sync enabled
  - Call `syncMessage` to forward message to KakaoTalk
  - Display sync indicator on successfully synced messages
  - References: Req 11.4, Req 11.6

- [ ] 19.2 Create webhook for incoming KakaoTalk messages
  - Create `app/api/kakao/webhook/route.ts`
  - Verify webhook signature from Sendbird
  - Parse incoming message and find matching chat room
  - Insert message into GenHub chat with external_source indicator
  - References: Req 11.4, Req 11.6

---

## Phase 6: Advanced Features

### 20. Direct Messaging

- [ ] 20.1 Create `components/chat/NewDMModal.tsx` component
  - Display user search input
  - Search company users using autocomplete
  - Show user avatar, name, and role in results
  - Create or open existing DM room on user selection
  - References: Req 7.1-7.3

- [ ] 20.2 Implement `createDMRoom(recipientUserId)` server action
  - Check for existing DM room between users using RPC function `find_dm_room`
  - Return existing room if found, create new if not
  - Add both users as participants with 'member' role
  - Ensure DM rooms have type = 'dm' and no project_id
  - References: Req 7.4, Req 7.8

- [ ] 20.3 Add DM section to ChatRoomList
  - Separate project chats and DMs into distinct sections
  - Show "New Message" button to open NewDMModal
  - Display recipient's avatar and name for DM rooms
  - Sort DMs by most recent message activity
  - References: Req 7.1, Req 7.5-7.6

### 21. Message Search

- [ ] 21.1 Implement `searchMessages(query, chatRoomId?)` server action
  - Use PostgreSQL full-text search on message content
  - Filter by chat_room_id if provided, otherwise search all accessible rooms
  - Return message with highlighted match, sender name, timestamp, room name
  - Limit results to 50 messages
  - Match entity names from entity_references, not just tokens
  - References: Req 13.3-13.7

- [ ] 21.2 Create `components/chat/SearchMessages.tsx` component
  - Add search icon to chat room header
  - Display search input field on click
  - Show search results with message snippets and context
  - Navigate to message in context on result click
  - Support searching across all rooms from /app/chat
  - References: Req 13.1-13.5

### 22. Message Editing & Deletion

- [ ] 22.1 Implement `editMessage(messageId, newContent)` server action
  - Validate user is message sender
  - Update content and set edited_at timestamp
  - Revalidate chat paths
  - References: Req 14.2

- [ ] 22.2 Implement `deleteMessage(messageId)` server action
  - Validate user is message sender
  - Soft delete by setting deleted_at timestamp
  - Keep attachments accessible for 30 days
  - Revalidate chat paths
  - References: Req 14.3, Req 14.6

- [ ] 22.3 Add edit/delete functionality to MessageItem UI
  - Show Edit and Delete in hover menu for user's own messages
  - Open inline edit mode with textarea on Edit click
  - Show confirmation dialog before Delete
  - Display "(edited)" indicator after edit
  - Display "This message was deleted" after delete
  - References: Req 14.1-14.3

### 23. Chat Room Settings

- [ ] 23.1 Create `components/chat/ChatSettings.tsx` component
  - Display for project chat rooms when user has GC Admin/PM role
  - Allow editing chat room name and description
  - Show read-only member list with roles
  - Note: members cannot be manually added/removed (synced from project_team)
  - References: Req 12.1-12.3

- [ ] 23.2 Implement chat transcript export (GC Admin only)
  - Add "Export Chat" button in ChatSettings for GC Admin
  - Generate downloadable file with all messages, timestamps, sender names
  - Include attachment URLs in export
  - Format as plain text or JSON
  - References: Req 12.5

---

## Testing Requirements

### Integration Tests

- [ ] Write integration tests for complete message flow
  - Create DM room between two users
  - Send message from user 1
  - Verify user 2 receives message via Realtime
  - Verify unread count updates correctly
  - Create test file: `__tests__/integration/chat-flow.test.ts`

### E2E Tests

- [ ] Write E2E tests for real-time message delivery
  - Open two browser contexts (simulate two users)
  - User 1 sends message
  - Verify User 2 sees message in < 1 second
  - Create test file: `e2e/chat.spec.ts`
  - References: Design - Testing Strategy

---

## Acceptance Criteria Mapping

| Requirement | Task(s) |
|-------------|---------|
| Req 1 (Project Chat Rooms) | 1.1-1.4, 2.1-2.4, 3.1-3.7, 4.1-4.4 |
| Req 2 (Threaded Replies) | 5.1-5.4 |
| Req 3 (Message Reactions) | 6.1-6.4 |
| Req 4 (Typing Indicators) | 7.1-7.2 |
| Req 5 (Online Presence) | 8.1-8.2 |
| Req 6 (Entity References) | 10.1-10.3, 11.1-11.3 |
| Req 7 (Direct Messaging) | 20.1-20.3 |
| Req 8 (File Sharing) | 9.1-9.4 |
| Req 9 (Push Notifications) | 12.1-12.2, 13.1-13.3, 14.1-14.3 |
| Req 10 (Notification Preferences) | 15.1-15.3 |
| Req 11 (KakaoTalk Integration) | 16.1-16.2, 17.1-17.2, 18.1-18.2, 19.1-19.2 |
| Req 12 (Chat Room Management) | 23.1-23.2 |
| Req 13 (Message Search) | 21.1-21.2 |
| Req 14 (Message Actions) | 22.1-22.3 |
| Req 15 (Unread Tracking) | 2.3, 3.3, 4.2 |
