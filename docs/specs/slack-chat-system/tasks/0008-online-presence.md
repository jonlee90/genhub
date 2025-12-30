# Task 0008: Online Presence

## Phase
Phase 2: Rich Features

## Overview
Implement online presence tracking using Supabase Realtime Presence API.

## Subtasks

### 8.1 Create `lib/hooks/usePresence.ts` hook
- Use Supabase Realtime Presence for tracking online users
- Track current user with name and avatar in presence state
- Update presence state on sync/join/leave events
- Set user as "away" after 5 minutes of inactivity

### 8.2 Create `components/chat/OnlinePresence.tsx` component
- Display green dot for online users, gray for offline/away
- Show online member count in chat room header (e.g., "3 online")
- Show presence indicator next to user avatars in participant list

## Files to Create/Modify
- `lib/hooks/usePresence.ts` (new)
- `components/chat/OnlinePresence.tsx` (new)
- `components/chat/ChatRoomHeader.tsx` (new or modify existing)
- `components/chat/ChatRoomItem.tsx` (modify for DM presence)

## Dependencies
- Task 0001-0004: Core Chat MVP

## Acceptance Criteria
- [ ] Online users show green dot indicator
- [ ] Offline/away users show gray indicator
- [ ] Online count displays in room header
- [ ] User becomes "away" after 5 minutes idle
- [ ] Presence updates in real-time

## References
- Requirements: Req 5.1-5.6
- Design: Real-time Integration section (Presence)
