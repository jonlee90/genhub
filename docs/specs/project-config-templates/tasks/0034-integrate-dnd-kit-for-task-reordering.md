# Task 6.2: Integrate @dnd-kit for task reordering ✅ COMPLETED

## Objective
Add drag-and-drop for tasks.

## References
- Requirements §4.6

## Acceptance Criteria
- ✅ Drag-and-drop works smoothly
- ✅ Order persists via `reorderTaskTemplates` server action
- ✅ Visual feedback during drag (gradient glow, opacity)
- ✅ Cursor changes (grab/grabbing)
- ✅ Reverts on error with toast notification
- ✅ Keyboard accessibility

## Implementation Notes
- Uses @dnd-kit packages already installed from PhaseTemplateManager
- SortableContext with verticalListSortingStrategy
- Optimistic UI updates with revert on server error
- Drag handles with GripVertical icon
- Touch and pointer sensor support
