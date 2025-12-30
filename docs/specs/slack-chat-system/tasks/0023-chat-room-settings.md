# Task 0023: Chat Room Settings

## Phase
Phase 6: Advanced Features

## Overview
Implement chat room settings including name/description editing and transcript export.

## Subtasks

### 23.1 Create `components/chat/ChatSettings.tsx` component
- Display for project chat rooms when user has GC Admin/PM role
- Allow editing chat room name and description
- Show read-only member list with roles
- Note: members cannot be manually added/removed (synced from project_team)

### 23.2 Implement chat transcript export (GC Admin only)
- Add "Export Chat" button in ChatSettings for GC Admin
- Generate downloadable file with all messages, timestamps, sender names
- Include attachment URLs in export
- Format as plain text or JSON

## Files to Create/Modify
- `components/chat/ChatSettings.tsx` (new)
- `components/chat/ChatMemberList.tsx` (new)
- `app/actions/chat.ts` (add updateChatRoom, exportTranscript)
- `components/chat/ChatRoomHeader.tsx` (modify for settings button)

## Dependencies
- Task 0001-0004: Core Chat MVP

## Acceptance Criteria
- [ ] GC Admin/PM can edit room name and description
- [ ] Member list displays with roles
- [ ] Members sync from project_team (not editable)
- [ ] GC Admin can export chat transcript
- [ ] Export includes all messages and attachments

## References
- Requirements: Req 12.1-12.5
- Design: Chat Room Management section
