# Task 0020: Direct Messaging

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
- [ ] Users can start DM with any company member
- [ ] Existing DM rooms are found instead of duplicated
- [ ] DMs display separately from project chats
- [ ] DM rooms show recipient's avatar and name
- [ ] New Message button opens user search

## References
- Requirements: Req 7.1-7.8
- Design: Direct Messaging section
