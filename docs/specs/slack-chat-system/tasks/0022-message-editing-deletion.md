# Task 0022: Message Editing & Deletion

## Phase
Phase 6: Advanced Features

## Overview
Implement message editing and soft deletion functionality.

## Subtasks

### 22.1 Implement `editMessage(messageId, newContent)` server action
- Validate user is message sender
- Update content and set edited_at timestamp
- Revalidate chat paths

### 22.2 Implement `deleteMessage(messageId)` server action
- Validate user is message sender
- Soft delete by setting deleted_at timestamp
- Keep attachments accessible for 30 days
- Revalidate chat paths

### 22.3 Add edit/delete functionality to MessageItem UI
- Show Edit and Delete in hover menu for user's own messages
- Open inline edit mode with textarea on Edit click
- Show confirmation dialog before Delete
- Display "(edited)" indicator after edit
- Display "This message was deleted" after delete

## Files to Create/Modify
- `app/actions/chat.ts` (add editMessage, deleteMessage)
- `components/chat/MessageItem.tsx` (modify for edit/delete UI)
- `components/chat/EditMessageForm.tsx` (new)
- `components/chat/DeleteConfirmDialog.tsx` (new)

## Dependencies
- Task 0001-0004: Core Chat MVP

## Acceptance Criteria
- [ ] Users can edit their own messages
- [ ] Edited messages show "(edited)" indicator
- [ ] Users can delete their own messages
- [ ] Deleted messages show "This message was deleted"
- [ ] Only message sender can edit/delete

## References
- Requirements: Req 14.1-14.6
- Design: Message Actions section
