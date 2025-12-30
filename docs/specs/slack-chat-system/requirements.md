# Requirements Document

## Introduction

This document specifies the requirements for a Slack-like real-time chat system for GenHub PWA. The chat system enables seamless team communication for construction project collaboration with deep integration into existing GenHub entities (projects, tasks, materials, expenses). The system supports project-specific chat rooms that are automatically created for each project, direct messaging between team members, entity references with rich previews, file sharing, push notifications, and optional KakaoTalk integration for the Korean market.

The chat system leverages Supabase Realtime for real-time message delivery, presence, and typing indicators. It integrates with the existing `project_team`, `notifications`, and `attachments` tables while introducing new tables for chat rooms, participants, messages, and reactions.

---

## Requirements

### Requirement 1: Project Chat Rooms

**User Story:** As a project team member, I want each project to have a dedicated chat room so that all project-related communication is centralized and accessible to the project team.

#### Acceptance Criteria

1. WHEN a new project is created THEN the system SHALL automatically create a corresponding chat room with type 'project' and link it to the project_id
2. WHEN a user is added to the project_team table THEN the system SHALL automatically add them as a participant to the project's chat room
3. WHEN a user is removed from the project_team table THEN the system SHALL remove them as a participant from the project's chat room
4. WHEN a user navigates to `/app/chat` THEN the system SHALL display a list of all project chat rooms the user has access to, sorted by most recent message
5. WHEN a user opens a project chat room THEN the system SHALL display messages in chronological order with sender information, timestamps, and read status
6. IF a user is not a member of the project_team THEN the system SHALL deny access to the project chat room
7. WHEN viewing messages THEN the system SHALL show the sender's avatar, name, timestamp, and message content
8. WHEN a user sends a message THEN the system SHALL deliver it to all room participants in real-time (< 500ms latency)

---

### Requirement 2: Threaded Replies

**User Story:** As a team member, I want to reply to specific messages in a thread so that conversations stay organized and contextual.

#### Acceptance Criteria

1. WHEN viewing a message THEN the system SHALL display a "Reply in thread" action
2. WHEN a user clicks "Reply in thread" THEN the system SHALL open a thread panel showing the original message and all replies
3. WHEN a message has replies THEN the system SHALL display a reply count indicator below the message (e.g., "3 replies")
4. WHEN a user clicks the reply count indicator THEN the system SHALL open the thread panel
5. WHEN a user sends a reply in a thread THEN the system SHALL store it with a `reply_to_id` referencing the parent message
6. WHEN a new reply is added to a thread THEN the system SHALL notify the original message author and thread participants
7. WHEN viewing the main chat THEN the system SHALL NOT display threaded replies inline (only show them in the thread panel)

---

### Requirement 3: Message Reactions

**User Story:** As a team member, I want to react to messages with emojis so that I can quickly acknowledge or respond to messages without typing.

#### Acceptance Criteria

1. WHEN hovering over a message THEN the system SHALL display a reaction picker trigger
2. WHEN a user clicks the reaction picker THEN the system SHALL display a curated set of construction-relevant emojis (thumbs up, check mark, hard hat, tools, warning, etc.)
3. WHEN a user selects an emoji THEN the system SHALL add the reaction to the message and display it below the message content
4. IF a user has already reacted with the same emoji THEN clicking it again SHALL remove the reaction
5. WHEN multiple users react with the same emoji THEN the system SHALL display a count next to the emoji (e.g., "3")
6. WHEN a user hovers over a reaction THEN the system SHALL show a tooltip with the names of users who reacted
7. WHEN a user receives a reaction on their message THEN the system SHALL NOT create a notification (reactions are silent acknowledgments)

---

### Requirement 4: Typing Indicators

**User Story:** As a team member, I want to see when others are typing so that I know a response is coming and avoid sending duplicate messages.

#### Acceptance Criteria

1. WHEN a user starts typing in a chat room THEN the system SHALL broadcast a typing indicator to all other room participants
2. WHEN one user is typing THEN the system SHALL display "[User name] is typing..." below the message input
3. WHEN multiple users are typing THEN the system SHALL display "[User 1], [User 2] are typing..." or "[User 1] and 2 others are typing..." if more than 2
4. WHEN a user stops typing for 3 seconds THEN the system SHALL remove their typing indicator
5. WHEN a user sends a message THEN the system SHALL immediately remove their typing indicator
6. Typing indicators SHALL be ephemeral and NOT stored in the database (use Supabase Broadcast)

---

### Requirement 5: Online Presence

**User Story:** As a team member, I want to see who is currently online in a chat room so that I know if I can expect a quick response.

#### Acceptance Criteria

1. WHEN a user opens a chat room THEN the system SHALL display a list of online participants with green presence indicators
2. WHEN a user is offline or away THEN the system SHALL display a gray presence indicator
3. WHEN a user becomes active in the app THEN the system SHALL update their presence to "online" within 5 seconds
4. WHEN a user closes the app or is inactive for 5 minutes THEN the system SHALL update their presence to "away"
5. WHEN viewing the chat room header THEN the system SHALL show the count of online members (e.g., "3 online")
6. Presence data SHALL be ephemeral and NOT stored in the database (use Supabase Realtime Presence)

---

### Requirement 6: Entity References (@mentions)

**User Story:** As a project manager, I want to reference GenHub entities (projects, tasks, materials, expenses, users) in messages so that my team can quickly access relevant information.

#### Acceptance Criteria

1. WHEN a user types `@` in the message input THEN the system SHALL display an autocomplete dropdown with entity type options: project, task, material, expense, user
2. WHEN a user types `@project:` THEN the system SHALL display a searchable list of projects the user has access to
3. WHEN a user types `@task:` THEN the system SHALL display a searchable list of tasks from the current project (if in project chat) or all accessible tasks (if in DM)
4. WHEN a user types `@material:` THEN the system SHALL display a searchable list of materials from the company's catalog
5. WHEN a user types `@expense:` THEN the system SHALL display a searchable list of recent expenses
6. WHEN a user types `@[username]` THEN the system SHALL display a searchable list of users in the current chat room
7. WHEN a user selects an entity THEN the system SHALL insert a formatted reference token and store the entity type and ID in the message's `entity_references` JSONB field
8. WHEN a message with entity references is displayed THEN the system SHALL render them as rich preview cards showing:
   - Project: name, status, health score, completion percentage
   - Task: title, status badge, priority, assignee, due date
   - Material: product name, price, stock status, thumbnail image
   - Expense: description, amount, status, vendor name
   - User: avatar, name, role (clicking navigates to profile)
9. WHEN a user is mentioned (@username) THEN the system SHALL create a notification of type 'mention' for that user
10. WHEN clicking an entity reference card THEN the system SHALL navigate to the entity's detail page

---

### Requirement 7: Direct Messaging (DMs)

**User Story:** As a user, I want to send private messages to other team members so that I can have confidential 1:1 conversations.

#### Acceptance Criteria

1. WHEN a user navigates to `/app/chat` THEN the system SHALL display a "Direct Messages" section separate from project chats
2. WHEN a user clicks "New Message" THEN the system SHALL display a user search to start a new DM conversation
3. WHEN a user selects a recipient THEN the system SHALL either open an existing DM room or create a new one
4. IF a DM room already exists between two users THEN the system SHALL NOT create a duplicate room
5. WHEN viewing DMs THEN the system SHALL sort conversations by most recent message activity
6. WHEN a user has unread messages in a DM THEN the system SHALL display an unread count badge
7. DM chat rooms SHALL have type 'dm' and support all features of project chats (threads, reactions, typing, presence, file sharing)
8. WHEN viewing a DM conversation THEN the system SHALL only show the two participants (no additional members can be added)
9. IF both users are in the same company THEN DM access SHALL be allowed regardless of project membership

---

### Requirement 8: File & Photo Sharing

**User Story:** As a field worker, I want to share photos and documents in chat so that I can quickly communicate site conditions and share important files.

#### Acceptance Criteria

1. WHEN composing a message THEN the system SHALL display an attachment button
2. WHEN a user clicks the attachment button THEN the system SHALL allow file selection via file picker or drag-and-drop
3. The system SHALL support the following file formats:
   - Images: jpg, jpeg, png, gif, webp (with thumbnail preview)
   - Documents: pdf, doc, docx, xls, xlsx
   - Archives: zip
4. WHEN a user uploads a file larger than 10MB THEN the system SHALL display an error message and prevent the upload
5. WHEN a file is uploaded THEN the system SHALL store it in Vercel Blob and create an entry in the `message_attachments` table
6. WHEN a file is uploaded in a project chat THEN the system SHALL also create a record in the `attachments` table with entity_type 'chat_room' and entity_id matching the chat_room_id
7. WHEN viewing an image attachment THEN the system SHALL display a thumbnail; clicking SHALL open a lightbox preview
8. WHEN viewing a document attachment THEN the system SHALL display a file icon, name, and size; clicking SHALL download the file with the original filename preserved
9. WHEN multiple files are attached to a message THEN the system SHALL display them in a grid layout (max 4 visible, "+N more" if exceeding)
10. WHEN uploading THEN the system SHALL display a progress indicator and allow cancellation

---

### Requirement 9: Push Notifications (PWA)

**User Story:** As a field worker, I want to receive push notifications on my phone even when the app is closed so that I never miss important messages.

#### Acceptance Criteria

1. WHEN a user first accesses the chat feature THEN the system SHALL prompt for push notification permission with a clear opt-in explanation
2. WHEN a user grants permission THEN the system SHALL register their device with FCM (Android/Desktop) or APNs (iOS 16.4+ Home Screen install)
3. WHEN a user grants permission THEN the system SHALL store the push subscription in the `push_subscriptions` table
4. The system SHALL send push notifications for:
   - New messages in project chats the user belongs to (unless muted)
   - New direct messages
   - @mentions of the user
   - Replies to the user's messages
5. Push notifications SHALL include: sender name, message preview (truncated to 100 chars), and the chat room name
6. WHEN a user clicks a push notification THEN the system SHALL navigate to the specific message in the chat
7. WHEN a user has the app open and focused on the chat room THEN the system SHALL NOT send a push notification
8. The system SHALL display an unread badge count on the app icon (sum of all unread messages)
9. WHEN a user mutes a chat room THEN the system SHALL stop sending push notifications for that room
10. The system SHALL limit push notifications to a maximum of 5 per hour per user for non-critical messages (mentions and DMs are always sent)

---

### Requirement 10: Notification Preferences

**User Story:** As a user, I want to control which notifications I receive so that I'm not overwhelmed by alerts.

#### Acceptance Criteria

1. WHEN a user navigates to Settings > Notifications THEN the system SHALL display chat notification preferences
2. The system SHALL allow users to configure preferences per channel:
   - In-app notifications (always on, cannot be disabled)
   - Push notifications (on/off, default: on)
   - Email notifications (on/off, default: off for chat)
3. The system SHALL allow users to mute specific chat rooms:
   - WHEN a user mutes a room THEN they still receive in-app notifications but not push/email
   - Mute duration options: 1 hour, 8 hours, 24 hours, 7 days, until turned off
4. WHEN viewing the chat list THEN muted rooms SHALL display a muted icon
5. WHEN a user is mentioned in a muted room THEN the system SHALL still send push notification (mentions override mute)
6. WHEN a user's notification preferences are updated THEN the system SHALL apply changes immediately

---

### Requirement 11: KakaoTalk Integration

**User Story:** As a Korean user, I want to receive project notifications via KakaoTalk so that I don't miss important updates on my preferred messaging platform.

#### Acceptance Criteria

1. WHEN a user navigates to Settings > Integrations THEN the system SHALL display a "Connect KakaoTalk" option
2. WHEN a user clicks "Connect KakaoTalk" THEN the system SHALL initiate OAuth with KakaoTalk using the Sendbird or Sinch API
3. WHEN KakaoTalk is connected THEN the system SHALL display the linked KakaoTalk ID and a "Disconnect" option
4. WHEN KakaoTalk is connected THEN the user MAY enable two-way sync:
   - Messages sent from GenHub chat appear in KakaoTalk
   - Messages sent via KakaoTalk appear in GenHub chat
5. The system SHALL support KakaoTalk AlimTalk (template notifications) for:
   - Task assignments
   - Expense approvals/rejections
   - Project milestone updates
6. IF KakaoTalk is connected AND two-way sync is enabled THEN messages SHALL appear in both platforms with a sync indicator
7. IF KakaoTalk message sync fails THEN the system SHALL log the failure and retry up to 3 times
8. WHEN a user disconnects KakaoTalk THEN the system SHALL stop syncing but preserve historical messages

---

### Requirement 12: Chat Room Management

**User Story:** As a GC Admin, I want to manage chat room settings and membership so that I can maintain organized communication.

#### Acceptance Criteria

1. WHEN viewing a project chat room settings THEN GC Admin/PM SHALL see options to:
   - Change chat room name (default: project name)
   - Set chat room description
   - View member list
2. WHEN viewing the member list THEN GC Admin/PM SHALL see all participants with their roles
3. GC Admin/PM SHALL NOT be able to manually add/remove members from project chats (membership is auto-synced from project_team)
4. WHEN a user leaves a project team THEN the system SHALL remove them from the chat but preserve their message history
5. WHEN viewing chat room settings THEN any member SHALL be able to:
   - Mute/unmute notifications
   - Search message history
   - Export chat transcript (GC Admin only)

---

### Requirement 13: Message Search

**User Story:** As a project manager, I want to search chat message history so that I can find past conversations and decisions.

#### Acceptance Criteria

1. WHEN in a chat room THEN the system SHALL display a search icon in the header
2. WHEN a user clicks search THEN the system SHALL display a search input field
3. WHEN a user enters a search query THEN the system SHALL search message content and display matching results
4. Search results SHALL display: message snippet with highlighted match, sender name, timestamp, and chat room name
5. WHEN a user clicks a search result THEN the system SHALL navigate to that message in context (showing messages before/after)
6. The system SHALL support searching across all accessible chat rooms from `/app/chat`
7. WHEN searching entity references THEN the system SHALL match the entity name (not just the reference token)

---

### Requirement 14: Message Actions

**User Story:** As a team member, I want to perform actions on messages so that I can manage my chat history.

#### Acceptance Criteria

1. WHEN hovering over a user's own message THEN the system SHALL display an actions menu with: Edit, Delete
2. WHEN a user edits a message THEN the system SHALL update the message content and display "(edited)" indicator
3. WHEN a user deletes a message THEN the system SHALL soft-delete (set `deleted_at` timestamp) and display "This message was deleted" placeholder
4. WHEN hovering over another user's message THEN the system SHALL display: React, Reply, Copy text
5. WHEN a user copies message text THEN the system SHALL copy plain text to clipboard (strip formatting)
6. IF a message has attachments AND is deleted THEN the attachments SHALL remain accessible for 30 days before permanent deletion

---

### Requirement 15: Unread Message Tracking

**User Story:** As a user, I want to see which messages I haven't read so that I can catch up on conversations.

#### Acceptance Criteria

1. WHEN a user opens a chat room THEN the system SHALL mark all visible messages as read and update `last_read_at` in chat_participants
2. WHEN viewing the chat list THEN unread rooms SHALL display with a bold title and unread message count
3. WHEN entering a chat room with unread messages THEN the system SHALL display a "New Messages" divider above the first unread message
4. WHEN a user scrolls to load older messages THEN the system SHALL NOT mark them as unread
5. The unread count in the navigation sidebar SHALL reflect total unread messages across all chat rooms

---

## Technical Constraints

### Database Schema
- New tables required: `chat_rooms`, `chat_participants`, `messages`, `message_reactions`, `message_attachments`, `push_subscriptions`
- Must use existing `next_auth.uid()` for user identification
- Must follow existing RLS patterns with company_id scoping
- Messages table must enable Supabase Realtime: `ALTER PUBLICATION supabase_realtime ADD TABLE messages;`

### Real-time Architecture
- Use Supabase Realtime for message delivery (PostgreSQL CDC)
- Use Supabase Realtime Presence for online status
- Use Supabase Broadcast for typing indicators
- Target message delivery latency: < 500ms

### File Storage
- Use Vercel Blob for file uploads (existing integration)
- Max file size: 10MB
- Generate thumbnails for images server-side

### Push Notifications
- Use Firebase Cloud Messaging (FCM) for Android/Desktop
- Service Worker for background push handling
- Store subscriptions in `push_subscriptions` table

### Performance Requirements
- Message list must virtualize (render only visible messages)
- Paginate messages: load 50 initial, then load more on scroll
- Cache recent messages locally for offline access

### Security
- RLS policies must ensure users can only access chat rooms they belong to
- File uploads must be scanned for malware
- Rate limit message sending: max 30 messages/minute per user

---

## Dependencies

1. **Existing Tables**: `project_team`, `projects`, `user_profiles`, `company_users`, `attachments`, `notifications`
2. **External Services**:
   - Supabase Realtime (included in Supabase)
   - Firebase Cloud Messaging (new integration required)
   - Sendbird or Sinch API (for KakaoTalk, new integration required)
3. **Frontend Libraries**:
   - `@supabase/realtime-js` (Realtime client)
   - `react-virtualized` or `@tanstack/react-virtual` (message list virtualization)
   - PWA Service Worker updates for push notifications

---

## Risks & Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Supabase Realtime connection drops | Messages delayed/lost | Medium | Implement reconnection logic, queue messages locally |
| Push notification permission denied | Users miss messages | High | Clear opt-in explanation, fallback to in-app |
| KakaoTalk API rate limits | Sync failures | Medium | Queue messages, implement retry with exponential backoff |
| Large chat rooms (100+ users) slow down | Performance degradation | Low | Implement pagination, virtualization, optimize queries |
| File upload abuse (large files, spam) | Storage costs, bandwidth | Medium | Enforce 10MB limit, rate limit uploads, scan for abuse |

---

## Phased Implementation Approach

### Phase 1: Core Chat (MVP)
- Chat room creation (project & DM)
- Basic message sending/receiving with Supabase Realtime
- Message list with virtualization
- Unread message tracking
- Chat room participant management (auto-sync with project_team)

### Phase 2: Rich Features
- Threaded replies
- Message reactions
- Typing indicators
- Online presence
- File & photo sharing

### Phase 3: Entity References
- @mention autocomplete
- Entity reference rendering (rich preview cards)
- Entity navigation from chat

### Phase 4: Notifications
- Push notification infrastructure (FCM + Service Worker)
- Notification preferences
- Muting chat rooms
- Unread badge on app icon

### Phase 5: KakaoTalk Integration
- KakaoTalk OAuth connection
- AlimTalk template notifications
- Two-way message sync (optional)

### Phase 6: Advanced Features
- Message search
- Message editing/deletion
- Chat transcript export
- Analytics (message counts, response times)
