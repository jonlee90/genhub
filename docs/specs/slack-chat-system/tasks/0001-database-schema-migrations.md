# Task 0001: Database Schema & Migrations

## Phase
Phase 1: Core Chat (MVP)

## Overview
Create the foundational database tables, indexes, and Realtime configuration for the chat system.

## Subtasks

### 1.1 Create chat system database migration with all core tables
- Create `chat_rooms` table with company_id, project_id, type ('project'/'dm'), name, description columns
- Create `chat_participants` table with user_id, chat_room_id, role, last_read_at, muted_until columns
- Create `messages` table with sender_id, content, reply_to_id, entity_references JSONB, edited_at, deleted_at columns
- Add appropriate indexes for performance (chat_room_id, created_at DESC, sender_id)
- Enable Supabase Realtime: `ALTER PUBLICATION supabase_realtime ADD TABLE messages;`
- Save migration to `supabase/migrations/YYYYMMDDHHMMSS_create_chat_tables.sql`

### 1.2 Create RLS policies for chat tables
- Add `chat_rooms` SELECT policy: users can view rooms they participate in
- Add `chat_rooms` INSERT policy: users can create DM rooms in their company
- Add `chat_participants` SELECT policy: users can view participants of their rooms
- Add `chat_participants` UPDATE policy: users can update their own participation (mute, last_read_at)
- Add `messages` SELECT policy: users can view messages in their rooms
- Add `messages` INSERT policy: users can send messages to rooms they participate in
- Add `messages` UPDATE policy: users can edit/delete their own messages
- Run `mcp__supabase__get_advisors type:"security"` to verify policies

### 1.3 Create database triggers for project-chat synchronization
- Create trigger `on_project_created_create_chat_room`: auto-creates chat room when project is created
- Create trigger `on_project_team_member_added`: auto-adds participant when user joins project_team
- Create trigger `on_project_team_member_removed`: removes participant when user leaves project_team
- Create helper function `get_unread_count(chat_room_id, user_id)` for unread message counting
- Test triggers by creating a project and verifying chat room + participants are created

### 1.4 Generate TypeScript types for chat tables
- Run `mcp__supabase__generate_typescript_types`
- Create `types/chat.types.ts` with extended interfaces (MessageWithSender, ChatRoomWithUnread, ReactionSummary)
- Export EntityReference type for @mentions: `{type: 'user'|'task'|'project'|'material'|'expense', id: string}`

## Files to Create/Modify
- `supabase/migrations/YYYYMMDDHHMMSS_create_chat_tables.sql`
- `supabase/migrations/YYYYMMDDHHMMSS_chat_rls_policies.sql`
- `supabase/migrations/YYYYMMDDHHMMSS_chat_triggers.sql`
- `types/database.types.ts` (regenerated)
- `types/chat.types.ts` (new)

## Dependencies
- None (foundational task)

## Acceptance Criteria
- [ ] All chat tables created with proper columns and constraints
- [ ] RLS policies pass security advisor checks
- [ ] Triggers automatically create chat rooms for new projects
- [ ] TypeScript types are generated and extended interfaces are available

## References
- Requirements: Req 1.1-1.8, Req 15.1-15.5
- Design: Database Schema section
