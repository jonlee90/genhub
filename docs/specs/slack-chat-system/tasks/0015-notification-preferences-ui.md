# Task 0015: Notification Preferences UI

## Phase
Phase 4: Push Notifications

## Overview
Build UI for managing notification preferences including global toggles and per-room muting.

## Subtasks

### 15.1 Create `components/settings/ChatNotificationPreferences.tsx` component
- Add to Settings page under Notifications section
- Toggle for push notifications (on/off, default: on)
- Toggle for email notifications (on/off, default: off for chat)
- Note that in-app notifications are always on

### 15.2 Implement chat room muting functionality
- Create `muteChatRoom(chatRoomId, mutedUntil)` server action
- Add mute options: 1 hour, 8 hours, 24 hours, 7 days, until turned off
- Update muted_until in chat_participants table
- Display muted icon on muted rooms in chat list

### 15.3 Implement mention override for muted rooms
- Check for @user references matching current user
- Send push notification even if room is muted for mentions
- Display notification with "You were mentioned" emphasis

## Files to Create/Modify
- `components/settings/ChatNotificationPreferences.tsx` (new)
- `app/app/settings/page.tsx` (modify to include chat prefs)
- `app/actions/chat.ts` (add muteChatRoom)
- `components/chat/ChatRoomItem.tsx` (modify for mute icon)
- `components/chat/MuteRoomDropdown.tsx` (new)

## Dependencies
- Task 0013: Push Subscription Management
- Task 0014: FCM Integration

## Acceptance Criteria
- [ ] Notification preferences accessible in settings
- [ ] Push notifications can be toggled on/off
- [ ] Rooms can be muted with duration options
- [ ] Muted rooms show muted icon
- [ ] @mentions override mute setting

## References
- Requirements: Req 10.1-10.5
- Design: Notification Preferences section
