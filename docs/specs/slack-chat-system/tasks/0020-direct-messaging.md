# Task 0020: Direct Messaging

**Status:** ✅ COMPLETED (2025-12-30)

## Phase
Phase 6: Advanced Features

## Overview
Implement private 1:1 direct messaging between company users.

## Subtasks

### 20.1 Create `components/chat/NewDMModal.tsx` component
- Display user search input
- Search company users using autocomplete
- Show user avatar, name, and role in results
- Create or open existing DM room on user selection

### 20.2 Implement `createDMRoom(recipientUserId)` server action
- Check for existing DM room between users using RPC function `find_dm_room`
- Return existing room if found, create new if not
- Add both users as participants with 'member' role
- Ensure DM rooms have type = 'dm' and no project_id

### 20.3 Add DM section to ChatRoomList
- Separate project chats and DMs into distinct sections
- Show "New Message" button to open NewDMModal
- Display recipient's avatar and name for DM rooms
- Sort DMs by most recent message activity

## Files to Create/Modify
- `components/chat/NewDMModal.tsx` (new)
- `app/actions/chat.ts` (add createDMRoom)
- `components/chat/ChatRoomList.tsx` (modify for DM section)
- `supabase/migrations/YYYYMMDDHHMMSS_find_dm_room_function.sql` (new)

## Dependencies
- Task 0001-0004: Core Chat MVP

## Acceptance Criteria
- [x] Users can start DM with any company member
- [x] Existing DM rooms are found instead of duplicated
- [x] DMs display separately from project chats
- [x] DM rooms show recipient's avatar and name
- [x] New Message button opens user search

## Security Fixes Applied
After implementation, 2 critical and 2 high-priority security vulnerabilities were identified and fixed:

- **C1: Authorization Bypass** - Fixed `find_dm_room` RPC function to verify caller is a participant (prevents DM enumeration)
- **C2: Race Condition** - Implemented PostgreSQL advisory locks to prevent duplicate DM creation
- **H1: Rollback Failures** - Improved error handling when rolling back failed room creation
- **H2: Null Validation** - Added companyId null checks to prevent authorization bypass

**Documentation:** See [SECURITY-FIXES-TASK-0020.md](../../SECURITY-FIXES-TASK-0020.md) for complete details.

## Database Migrations Created
- Migration 032: `find_dm_room` RPC function with authorization checks
- Migration 033: Advisory locks and duplicate detection trigger

## References
- Requirements: Req 7.1-7.8
- Design: Direct Messaging section
- Security Fixes: SECURITY-FIXES-TASK-0020.md
