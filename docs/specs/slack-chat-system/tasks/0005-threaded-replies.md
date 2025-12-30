# Task 0005: Threaded Replies

## Phase
Phase 2: Rich Features

## Overview
Add support for threaded conversations allowing users to reply to specific messages in a focused thread panel.

## Subtasks

### 5.1 Add thread support to message sending
- Update `sendMessage` to accept optional `replyToId` parameter
- Store `reply_to_id` in messages table referencing parent message
- Create notification for parent message author when reply is added

### 5.2 Create `components/chat/MessageThread.tsx` thread panel component
- Display parent message at top of panel
- List all replies chronologically below parent
- Include MessageInput at bottom for adding replies
- Add close button to return to main chat view

### 5.3 Add thread indicators to MessageItem
- Display reply count indicator below message (e.g., "3 replies")
- Make reply count clickable to open thread panel
- Add "Reply in thread" action to hover menu
- Filter threaded replies from main message list display

### 5.4 Write integration tests for threaded replies
- Test creating a reply to a message
- Test that replies don't appear in main chat
- Test reply count updates correctly
- Test notifications are created for thread participants

## Files to Create/Modify
- `app/actions/chat.ts` (modify sendMessage)
- `components/chat/MessageThread.tsx` (new)
- `components/chat/MessageItem.tsx` (modify for thread indicators)
- `components/chat/ChatLayout.tsx` (modify for thread panel)
- `__tests__/integration/threads.test.ts` (new)

## Dependencies
- Task 0001-0004: Core Chat MVP

## Acceptance Criteria
- [ ] Users can reply to any message
- [ ] Replies appear in thread panel, not main chat
- [ ] Reply count displays accurately on parent message
- [ ] Thread panel shows full conversation context
- [ ] Parent message author gets notification on reply

## References
- Requirements: Req 2.1-2.7
- Design: Components section
