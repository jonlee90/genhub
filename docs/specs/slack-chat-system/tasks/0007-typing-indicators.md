# Task 0007: Typing Indicators

## Phase
Phase 2: Rich Features

## Overview
Implement real-time typing indicators using Supabase Broadcast for ephemeral state.

## Subtasks

### 7.1 Create `lib/hooks/useTypingIndicator.ts` hook
- Use Supabase Broadcast channel for ephemeral typing state
- Broadcast typing start when user begins typing
- Broadcast typing stop after 3 seconds of no input or on message send
- Track typing users in component state

### 7.2 Create `components/chat/TypingIndicator.tsx` component
- Display "[User name] is typing..." for single user
- Display "[User 1], [User 2] are typing..." for 2 users
- Display "[User 1] and 2 others are typing..." for 3+ users
- Position below message input area
- Auto-remove typing indicator after 3 seconds timeout

## Files to Create/Modify
- `lib/hooks/useTypingIndicator.ts` (new)
- `components/chat/TypingIndicator.tsx` (new)
- `components/chat/MessageInput.tsx` (modify to trigger typing events)
- `components/chat/ChatLayout.tsx` (modify to include indicator)

## Dependencies
- Task 0001-0004: Core Chat MVP

## Acceptance Criteria
- [ ] Typing indicator appears when other user types
- [ ] Indicator disappears after 3 seconds of no typing
- [ ] Multiple typing users display correctly
- [ ] No database writes for typing state (ephemeral only)

## References
- Requirements: Req 4.1-4.6
- Design: Real-time Integration section (Broadcast)
