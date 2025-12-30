# Task 0021: Message Search

## Phase
Phase 6: Advanced Features

## Overview
Implement full-text search across chat messages with context navigation.

## Subtasks

### 21.1 Implement `searchMessages(query, chatRoomId?)` server action
- Use PostgreSQL full-text search on message content
- Filter by chat_room_id if provided, otherwise search all accessible rooms
- Return message with highlighted match, sender name, timestamp, room name
- Limit results to 50 messages
- Match entity names from entity_references, not just tokens

### 21.2 Create `components/chat/SearchMessages.tsx` component
- Add search icon to chat room header
- Display search input field on click
- Show search results with message snippets and context
- Navigate to message in context on result click
- Support searching across all rooms from /app/chat

## Files to Create/Modify
- `app/actions/chat-search.ts` (add searchMessages)
- `components/chat/SearchMessages.tsx` (new)
- `components/chat/SearchResult.tsx` (new)
- `components/chat/ChatRoomHeader.tsx` (modify for search icon)
- `supabase/migrations/YYYYMMDDHHMMSS_messages_fts_index.sql` (new)

## Dependencies
- Task 0001-0004: Core Chat MVP

## Acceptance Criteria
- [ ] Search finds messages containing query
- [ ] Results show message snippet with highlighted match
- [ ] Clicking result navigates to message in context
- [ ] Search works within single room or across all rooms
- [ ] Entity references searchable by display name

## References
- Requirements: Req 13.1-13.7
- Design: Search Implementation section
