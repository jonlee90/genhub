# Task 0001: Enhance TaskCard with Draggable Card Effects

**Component**: `components/tasks/TaskCard.tsx`
**Aceternity Components**: Draggable Card + Card Stack
**Priority**: CRITICAL
**Estimated Effort**: 4-6 hours

## Objective
Add smooth drag animations and priority color-coded borders to task cards with construction theme integration.

## Requirements

### Core Features
1. **Draggable Card Integration**
   - Integrate Aceternity Draggable Card component
   - Smooth drag animations with GPU acceleration
   - Card lifts with depth shadow when dragging
   - Snap-back animation if dropped in invalid location

2. **Card Stack Effect**
   - Show stacked preview when multiple tasks are selected
   - Implement card selection mechanism
   - Stack animation with offset and scale

3. **Priority Color-Coding**
   - Red left border: High priority tasks
   - Yellow left border: Medium priority tasks
   - Green left border: Low priority tasks
   - Border width: 4px with smooth transition

4. **Animated Status Badges**
   - Smooth transitions between status states
   - Construction-themed badge colors
   - Pulse animation for "in_progress" status

5. **Material Icon Badge**
   - Wrench icon for tasks with materials
   - Position: Top-right corner
   - Construction-accent color (#F59E0B)

### Construction Theme Integration
- Use construction color palette throughout
- Hard hat icon for task type indicator
- Industrial typography (font-black for task titles)
- Blueprint-style subtle grid pattern on card background

## Technical Implementation

### Dependencies
```typescript
import { DraggableCard } from '@/components/ui/aceternity/draggable-card';
import { Wrench, AlertTriangle, Clock, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
```

### Priority Border Classes
```typescript
const priorityBorders = {
  high: 'border-l-4 border-construction-red',
  medium: 'border-l-4 border-construction-yellow',
  low: 'border-l-4 border-construction-green',
};
```

### Drag Animation
```typescript
const dragAnimation = {
  drag: {
    scale: 1.05,
    rotate: 2,
    boxShadow: '0 10px 20px rgba(0, 27, 81, 0.3)'
  },
  rest: {
    scale: 1,
    rotate: 0,
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
  }
};
```

## Acceptance Criteria

- [ ] Task cards have smooth drag animations at 60fps
- [ ] Priority borders display correctly with proper colors
- [ ] Status badges animate smoothly on state change
- [ ] Cards lift with depth shadow when dragged
- [ ] Multiple selected cards show stacked preview (3-card max visible)
- [ ] Material icon badge (wrench) appears when task.has_materials === true
- [ ] Construction theme colors applied throughout
- [ ] Mobile touch drag works smoothly
- [ ] Keyboard accessibility for drag-and-drop (Space to grab)
- [ ] Screen reader announces drag state

## Testing Checklist

### Visual Testing
- [ ] Test all priority levels (high, medium, low)
- [ ] Test all status badges (to_do, in_progress, done, blocked)
- [ ] Test material badge visibility
- [ ] Verify construction color palette consistency
- [ ] Test on light and dark backgrounds

### Functional Testing
- [ ] Drag and drop works in Kanban columns
- [ ] Multiple card selection works
- [ ] Card stack preview renders correctly
- [ ] Snap-back animation works for invalid drops
- [ ] Status transitions are smooth

### Performance Testing
- [ ] Drag animations run at 60fps
- [ ] No layout shift during drag (CLS < 0.1)
- [ ] Memory usage acceptable with 100+ cards
- [ ] Mobile performance on low-end devices

### Accessibility Testing
- [ ] Keyboard drag (Space to grab, arrows to move)
- [ ] Screen reader announces "Dragging task: [name]"
- [ ] Focus indicators visible during keyboard navigation
- [ ] Respects prefers-reduced-motion

## Implementation Steps

1. **Install Dependencies** (if needed)
   ```bash
   # Verify @dnd-kit is installed
   npm list @dnd-kit/core @dnd-kit/sortable
   ```

2. **Create Draggable Card Wrapper**
   - Wrap existing TaskCard with Aceternity Draggable Card
   - Add motion.div for animations
   - Implement drag state handling

3. **Add Priority Borders**
   - Map task.priority to border color classes
   - Add smooth border transitions

4. **Implement Status Badges**
   - Create StatusBadge component with animations
   - Add construction-themed colors
   - Implement pulse animation for in_progress

5. **Add Material Badge**
   - Conditional render based on task.has_materials
   - Position in top-right corner
   - Use Wrench icon from Lucide

6. **Test and Refine**
   - Test all scenarios
   - Optimize animations
   - Ensure accessibility

## Construction Theme Colors

```css
/* Priority Borders */
--priority-high: #DC2626;     /* Red */
--priority-medium: #FFB627;   /* Yellow */
--priority-low: #059669;      /* Green */

/* Status Badges */
--status-todo: #6B7280;       /* Gray */
--status-in-progress: #001B51; /* Blue */
--status-done: #059669;       /* Green */
--status-blocked: #DC2626;    /* Red */

/* Material Badge */
--material-badge: #F59E0B;    /* Amber */
```

## Success Metrics

| Metric | Target |
|--------|--------|
| Drag FPS | 60fps consistently |
| Drag Latency | < 16ms |
| User Engagement | +20% hover interactions |
| Task Completion | -5% time (easier to move tasks) |

---

**Created**: 2025-12-05
**Status**: Ready for Implementation
