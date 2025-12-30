# Task 0010: @mention Autocomplete

## Phase
Phase 3: Entity References

## Overview
Implement @mention autocomplete for referencing projects, tasks, materials, expenses, and users in chat messages.

## Subtasks

### 10.1 Create `components/chat/EntityReference.tsx` autocomplete component
- Trigger on @ character in message input
- Show entity type filter options: @project:, @task:, @material:, @expense:, @[username]
- Implement searchable dropdown with keyboard navigation (arrow keys, Enter to select)
- Return reference token in format: `@[type:id:displayName]`

### 10.2 Create entity search server actions
- Implement `searchProjects(query)` - projects user has access to
- Implement `searchTasks(query, projectId?)` - tasks from current project or all accessible
- Implement `searchMaterials(query)` - materials from company catalog
- Implement `searchExpenses(query)` - recent expenses
- Implement `searchUsers(query, roomId)` - users in current chat room

### 10.3 Parse and store entity references in messages
- Extract reference tokens from message content on send
- Store in entity_references JSONB array: `[{type, id}]`
- Replace tokens with display text in rendered content
- Create mention notification for @user references

## Files to Create/Modify
- `components/chat/EntityReference.tsx` (new)
- `components/chat/EntityAutocomplete.tsx` (new)
- `app/actions/chat-search.ts` (new)
- `app/actions/chat.ts` (modify sendMessage for entity parsing)
- `components/chat/MessageInput.tsx` (modify for @ trigger)

## Dependencies
- Task 0001-0004: Core Chat MVP

## Acceptance Criteria
- [ ] Typing @ shows autocomplete dropdown
- [ ] All entity types searchable with results
- [ ] Keyboard navigation works (arrows, Enter, Escape)
- [ ] Selected entity inserts reference token
- [ ] @user mentions trigger notifications

## References
- Requirements: Req 6.1-6.7, Req 6.9
- Design: Components section
