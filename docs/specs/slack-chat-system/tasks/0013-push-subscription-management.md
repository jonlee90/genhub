# Task 0013: Push Subscription Management

## Phase
Phase 4: Push Notifications

## Overview
Manage push notification subscriptions including registration, storage, and permission handling.

## Subtasks

### 13.1 Create `push_subscriptions` table migration
- Add columns: user_id, endpoint, platform, p256dh_key, auth_key, user_agent, last_used_at
- Add unique constraint on (user_id, endpoint)
- Add RLS policy: users can manage their own subscriptions

### 13.2 Implement push subscription server actions
- Create `registerPushSubscription(subscription)` action
- Create `unregisterPushSubscription(endpoint)` action
- Upsert subscription on registration, delete on unregister
- Update last_used_at on successful push delivery

### 13.3 Create push permission request UI
- Display opt-in explanation on first chat access
- Request notification permission using browser API
- Get FCM token on permission grant
- Store subscription using registerPushSubscription action
- Handle permission denied gracefully with fallback messaging

## Files to Create/Modify
- `supabase/migrations/YYYYMMDDHHMMSS_push_subscriptions.sql` (new)
- `app/actions/push.ts` (new)
- `components/chat/PushPermissionPrompt.tsx` (new)
- `lib/hooks/usePushNotifications.ts` (new)

## Dependencies
- Task 0012: Service Worker Setup

## Acceptance Criteria
- [ ] Push subscriptions table created with proper schema
- [ ] Users can grant push permission via UI prompt
- [ ] FCM token stored in database successfully
- [ ] Permission denied handled gracefully
- [ ] Unsubscribe removes subscription from database

## References
- Requirements: Req 9.1-9.3
- Design: Database Schema section
