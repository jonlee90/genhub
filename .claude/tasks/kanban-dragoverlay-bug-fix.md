# Kanban Board DragOverlay Bug Fix

## Date: 2025-12-27

## Bug Description
When clicking on a task card in the "TO DO" column (and potentially other columns), a duplicate of the task card appeared in the top-left corner of the screen. The original card remained visible (dimmed) in its column. This behavior was unintended and confusing to users.

## Root Cause Analysis

The issue was caused by the `PointerSensor` activation constraint being too sensitive:

### Original Configuration (BUGGY):
```typescript
useSensor(PointerSensor, {
  activationConstraint: {
    distance: 8, // Only 8 pixels - TOO SENSITIVE
  },
})
```

### The Problem:
1. When a user clicked on a task card, any micro-movement of the mouse (just 8 pixels) would trigger the drag start event
2. This happened BEFORE the click event could properly fire
3. When drag started, it set `activeTask` state to the clicked task
4. The `DragOverlay` component then rendered this task at the cursor position
5. Result: Duplicate card appeared while the original remained dimmed (standard drag preview behavior)

### Why It Seemed Column-Specific:
The bug appeared to be specific to the "TO DO" column, but it was actually happening across all columns. The "TO DO" column was simply the first/leftmost column, making the visual artifact more noticeable when the DragOverlay appeared in the top-left.

## The Fix

### Changes Made to `components/tasks/KanbanBoard.tsx`:

#### 1. Updated Sensor Configuration (Lines 88-101):
```typescript
const sensors = useSensors(
  useSensor(PointerSensor, {
    activationConstraint: {
      distance: 15, // Increased from 8 to prevent accidental drags on click
      delay: 100, // 100ms delay - must hold pointer down before drag starts
      tolerance: 5, // Allow 5px of movement during delay without canceling
    },
  }),
  useSensor(KeyboardSensor, {
    coordinateGetter: sortableKeyboardCoordinates,
  })
);
```

**Key Improvements:**
- **distance: 15**: Increased from 8 pixels to 15 pixels - requires more deliberate movement
- **delay: 100**: Added 100ms delay - user must hold pointer down for 100ms before drag activates
- **tolerance: 5**: Allows 5 pixels of micro-movement during the delay without canceling the drag

This combination ensures that:
- Quick clicks don't trigger drag (< 100ms)
- Small mouse jiggles during click don't trigger drag (< 5px tolerance during delay)
- Intentional drags still work smoothly (hold + move > 15px)

#### 2. Enhanced Drag Start Handler (Lines 112-121):
```typescript
const handleDragStart = (event: DragStartEvent) => {
  // Debug: Only set active task if event is valid (not a canceled click)
  const task = optimisticTasks.find((t) => t.id === event.active.id);
  if (task) {
    setActiveTask(task);
    setIsDragging(true);
    console.log('[KanbanBoard] Drag started for task:', task.title);
  }
};
```

**Improvements:**
- Added validation to only set `activeTask` if task exists
- Added debug logging to track when drag actually starts
- Clearer code structure

### Changes Made to `components/tasks/TaskCard.tsx`:

#### Enhanced Click Handler (Lines 154-166):
```typescript
<div
  onClick={(e) => {
    // Debug: Only trigger modal if not dragging AND not in drag preview
    if (!isSortableDragging && !isDragging) {
      console.log('[TaskCard] Click handler fired for task:', task.title);
      onTaskClick?.(task);
    } else {
      console.log('[TaskCard] Click prevented - dragging:', isSortableDragging, 'isDragOverlay:', isDragging);
    }
  }}
  className="relative"
>
```

**Improvements:**
- Added check for both `isSortableDragging` (dnd-kit internal state) AND `isDragging` (our custom prop)
- Added debug logging to track click events and why they're prevented
- Prevents click from firing if card is in drag preview overlay

## Testing Checklist

To verify the fix works correctly:

- [x] Click task cards in "TO DO" column - should NOT show duplicate
- [x] Click task cards in other columns - should NOT show duplicate
- [x] Quick clicks should immediately open task modal
- [x] Intentional drag should work after holding for 100ms and moving 15px
- [x] Drag preview should only appear during actual drag operations
- [x] Task modal should not open when dragging
- [x] Mobile touch interactions should still work (touch-and-hold to drag)

## Debug Logging Added

The following console logs were added for debugging:

1. `[KanbanBoard] Drag started for task:` - Logs when drag actually starts
2. `[TaskCard] Click handler fired for task:` - Logs when click successfully fires
3. `[TaskCard] Click prevented - dragging:` - Logs when click is blocked due to drag state

These can be removed in production or kept for ongoing debugging.

## Files Modified

1. `components/tasks/KanbanBoard.tsx` (Lines 88-121)
   - Updated PointerSensor configuration
   - Enhanced handleDragStart with validation and logging

2. `components/tasks/TaskCard.tsx` (Lines 154-166)
   - Enhanced click handler with dual drag state checks
   - Added debug logging

## Related Issues

- DragOverlay positioning is handled by dnd-kit and CSS in `app/globals.css` (lines 235-260)
- The `touch-manipulation` class ensures proper mobile touch handling
- No CSS changes were needed for this fix - it was purely a sensor configuration issue

## Prevention

To prevent similar issues in the future:

1. Always use appropriate activation constraints for drag sensors:
   - Desktop/mouse: `distance: 10-15px` + `delay: 100-200ms`
   - Mobile/touch: `distance: 5-10px` + `delay: 150-300ms` (longer delay for touch)

2. Always validate task existence before setting drag state

3. Always check both `isSortableDragging` and custom drag state in click handlers

4. Add debug logging during development to catch accidental drag triggers

## Performance Impact

The added 100ms delay and increased distance threshold have minimal performance impact:
- Drag operations feel slightly more deliberate (positive UX - prevents accidents)
- Click operations remain instant
- No impact on rendering or state management performance
