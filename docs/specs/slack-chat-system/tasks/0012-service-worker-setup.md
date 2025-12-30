# Task 0012: Service Worker Setup

## Phase
Phase 4: Push Notifications

## Overview
Configure Firebase Messaging Service Worker for receiving and displaying push notifications.

## Subtasks

### 12.1 Create Firebase Messaging Service Worker
- Create `public/firebase-messaging-sw.js` file
- Initialize Firebase with project credentials
- Handle background message events
- Display notification with sender name, message preview, chat room name
- Handle notification click to navigate to specific message

### 12.2 Update existing Service Worker for push compatibility
- Modify `public/sw.js` or `next.config.js` PWA config
- Import Firebase messaging scripts
- Register for push notifications on app load
- Handle foreground messages appropriately

## Files to Create/Modify
- `public/firebase-messaging-sw.js` (new)
- `public/sw.js` (modify or integrate)
- `next.config.js` (modify PWA config if needed)
- `lib/firebase.ts` (new - Firebase client initialization)
- `app/app/layout.tsx` (modify for SW registration)

## Dependencies
- Task 0001-0004: Core Chat MVP

## Acceptance Criteria
- [ ] Service Worker registers successfully
- [ ] Background notifications display when app is closed
- [ ] Notification click opens correct chat room
- [ ] Foreground messages handled appropriately
- [ ] Firebase credentials properly configured

## References
- Requirements: Req 9.5-9.6
- Design: Push Notification System section
