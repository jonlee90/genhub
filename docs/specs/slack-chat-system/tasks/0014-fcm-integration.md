# Task 0014: FCM Integration

## Phase
Phase 4: Push Notifications

## Overview
Integrate Firebase Cloud Messaging for sending push notifications and implement badge count updates.

## Subtasks

### 14.1 Create Supabase Edge Function for sending push notifications
- Create `supabase/functions/send-push-notification/index.ts`
- Accept userId, title, body, data (roomId, url) as input
- Fetch user's push subscriptions from database
- Send push via FCM API for each subscription
- Return count of successful sends

### 14.2 Integrate push triggers into message sending flow
- After message insert, identify offline recipients (not currently active in room)
- Call Edge Function with notification payload
- Respect muted rooms (check muted_until before sending)
- Always send for @mentions (override mute)
- Rate limit: max 5 non-critical pushes per hour per user

### 14.3 Implement app badge count updates
- Calculate total unread messages across all rooms
- Update PWA badge using `navigator.setAppBadge()` API
- Clear badge when all messages are read

## Files to Create/Modify
- `supabase/functions/send-push-notification/index.ts` (new)
- `app/actions/chat.ts` (modify sendMessage for push triggers)
- `lib/hooks/useBadgeCount.ts` (new)
- `app/app/layout.tsx` (modify for badge updates)

## Dependencies
- Task 0012: Service Worker Setup
- Task 0013: Push Subscription Management

## Acceptance Criteria
- [ ] Edge Function sends push notifications via FCM
- [ ] New messages trigger push for offline users
- [ ] Muted rooms don't receive pushes (except @mentions)
- [ ] Badge count reflects total unread messages
- [ ] Rate limiting prevents notification spam

## References
- Requirements: Req 9.4, Req 9.7-9.10
- Design: Push Notification System section
