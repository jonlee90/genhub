# Task 0011: Rich Preview Cards

## Phase
Phase 3: Entity References

## Overview
Render entity references as rich preview cards showing relevant entity details inline in messages.

## Subtasks

### 11.1 Create `components/chat/EntityPreview.tsx` component
- Accept entity type and ID props
- Fetch entity data on mount
- Render type-specific preview card
- Make card clickable to navigate to entity detail page

### 11.2 Implement preview card variants for each entity type
- Project: name, status badge, health score, completion percentage bar
- Task: title, status badge, priority indicator, assignee avatar, due date
- Material: product name, price, stock status badge, thumbnail image
- Expense: description, formatted amount, status badge, vendor name
- User: avatar, name, role badge, clickable to profile

### 11.3 Integrate entity previews into MessageItem rendering
- Parse entity_references from message data
- Render EntityPreview cards inline within message content
- Handle loading and error states gracefully
- Cache entity data to avoid redundant fetches

## Files to Create/Modify
- `components/chat/EntityPreview.tsx` (new)
- `components/chat/previews/ProjectPreview.tsx` (new)
- `components/chat/previews/TaskPreview.tsx` (new)
- `components/chat/previews/MaterialPreview.tsx` (new)
- `components/chat/previews/ExpensePreview.tsx` (new)
- `components/chat/previews/UserPreview.tsx` (new)
- `components/chat/MessageItem.tsx` (modify for preview rendering)

## Dependencies
- Task 0010: @mention Autocomplete

## Acceptance Criteria
- [ ] Entity references render as preview cards
- [ ] Each entity type has appropriate preview design
- [ ] Clicking preview navigates to entity detail
- [ ] Loading states display while fetching entity data
- [ ] Cache prevents redundant API calls

## References
- Requirements: Req 6.8, Req 6.10
- Design: Components section
