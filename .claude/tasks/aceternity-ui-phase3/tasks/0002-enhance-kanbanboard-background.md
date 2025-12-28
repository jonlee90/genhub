# Task 0002: Enhance KanbanBoard with Background Boxes

**Component**: `components/tasks/KanbanBoard.tsx`
**Aceternity Components**: Background Boxes + custom drag
**Priority**: CRITICAL
**Estimated Effort**: 5-7 hours

## Objective
Add industrial grid pattern background and enhance column transitions for smooth drag-and-drop experience with construction theme.

## Requirements

### Core Features
1. **Background Boxes Integration**
   - Industrial grid pattern at 3% opacity
   - Blueprint-style grid with construction blue color
   - Fixed background (doesn't scroll with content)
   - Box size: 40px × 40px

2. **Column Glow Effect**
   - Glow when task is dragged over column
   - Construction-blue glow color
   - Smooth fade-in/fade-out transitions
   - Different glow for valid vs invalid drop zones

3. **Smooth Column Transitions**
   - Animated card movements between columns
   - Reorder animations within columns
   - Stagger effect for multiple card movements
   - Spring physics for natural feel

4. **Construction-Themed Empty States**
   - Hard hat icon for empty columns
   - "No tasks yet" message with construction language
   - "Start building" CTA with blueprint icon
   - Subtle pulse animation on empty state icon

5. **Mobile Touch Optimization**
   - Touch-friendly drag handles
   - Haptic feedback on drag start (if supported)
   - Auto-scroll when dragging near edges
   - Long-press to initiate drag on mobile

### Construction Theme Integration
- Industrial grid background pattern
- Construction-blue (#001B51) color scheme
- Heavy typography for column headers (font-black)
- Blueprint-style decorative elements

## Technical Implementation

### Dependencies
```typescript
import { BackgroundBoxes } from '@/components/ui/aceternity/background-boxes';
import { DndContext, DragOverlay } from '@dnd-kit/core';
import { SortableContext } from '@dnd-kit/sortable';
import { HardHat, Package, Hammer } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
```

### Background Pattern
```typescript
<div className="fixed inset-0 pointer-events-none opacity-[0.03] z-0">
  <BackgroundBoxes boxSize={40} className="text-construction-blue" />
</div>
```

### Column Glow Animation
```typescript
const columnGlowVariants = {
  idle: {
    boxShadow: '0 0 0 rgba(0, 27, 81, 0)'
  },
  dragOver: {
    boxShadow: '0 0 20px rgba(0, 27, 81, 0.4), inset 0 0 10px rgba(0, 27, 81, 0.2)',
    borderColor: 'rgba(0, 27, 81, 0.5)'
  }
};
```

### Card Transition
```typescript
const cardTransition = {
  type: 'spring',
  stiffness: 300,
  damping: 30,
  mass: 0.8
};
```

## Acceptance Criteria

- [ ] Industrial grid background pattern visible at 3% opacity
- [ ] Grid uses construction-blue color (#001B51)
- [ ] Background is fixed (doesn't scroll)
- [ ] Columns glow with construction-blue when task dragged over
- [ ] Glow fades in/out smoothly (300ms transition)
- [ ] Card transitions between columns are smooth with spring physics
- [ ] Multiple card movements use stagger effect (50ms delay each)
- [ ] Empty columns show construction-themed empty state
- [ ] Empty state icon pulses subtly
- [ ] Drag-and-drop works on desktop (mouse)
- [ ] Drag-and-drop works on mobile (touch)
- [ ] Long-press initiates drag on mobile (500ms)
- [ ] Auto-scroll works when dragging near edges
- [ ] Performance is 60fps during all drag operations

## Testing Checklist

### Visual Testing
- [ ] Background grid is visible but subtle (3% opacity)
- [ ] Grid color matches construction-blue
- [ ] Column glow is construction-themed
- [ ] Empty state icons and text are construction-themed
- [ ] Typography is heavy/industrial (font-black)
- [ ] Responsive on all screen sizes

### Functional Testing
- [ ] Drag cards between all columns
- [ ] Drag cards to reorder within same column
- [ ] Drag multiple cards simultaneously
- [ ] Drop validation works (can't drop in invalid zones)
- [ ] Auto-scroll triggers near viewport edges
- [ ] Undo/redo works with drag operations

### Performance Testing
- [ ] 60fps during drag operations
- [ ] No frame drops with 100+ cards
- [ ] Background grid doesn't cause repaints
- [ ] Column glow animations are GPU-accelerated
- [ ] Mobile performance acceptable on low-end devices

### Accessibility Testing
- [ ] Keyboard drag-and-drop (Space to grab, arrows to move, Space to drop)
- [ ] Screen reader announces column names
- [ ] Screen reader announces drag state changes
- [ ] Focus indicators visible
- [ ] Respects prefers-reduced-motion

### Mobile Testing
- [ ] Touch drag works smoothly
- [ ] Long-press (500ms) initiates drag
- [ ] Haptic feedback on drag start (if supported)
- [ ] Touch targets are ≥ 44px
- [ ] No accidental drags on scroll
- [ ] Auto-scroll works with touch

## Implementation Steps

1. **Add Background Boxes**
   - Import BackgroundBoxes component
   - Position as fixed background layer
   - Set 3% opacity with construction-blue color
   - Ensure z-index layering is correct

2. **Implement Column Glow**
   - Create motion.div wrapper for columns
   - Add dragOver state detection
   - Implement glow animation variants
   - Test smooth transitions

3. **Enhance Drag Transitions**
   - Configure spring physics for card movements
   - Add stagger effect for multiple cards
   - Implement reorder animations
   - Test smoothness on various devices

4. **Create Empty State**
   - Design empty state component with construction theme
   - Add Hard hat icon with pulse animation
   - Write construction-themed copy
   - Implement CTA button

5. **Optimize for Mobile**
   - Add long-press detection (500ms)
   - Implement touch-friendly drag handles
   - Add auto-scroll logic
   - Test on actual mobile devices

6. **Performance Optimization**
   - Use CSS transform for animations
   - Implement virtual scrolling if needed
   - Lazy load off-screen columns
   - Profile and optimize

## Construction Theme Elements

### Column Headers
```typescript
<h2 className="text-xl font-black tracking-tight text-construction-blue uppercase">
  {column.name}
</h2>
```

### Empty State
```typescript
<motion.div className="flex flex-col items-center justify-center py-12">
  <motion.div
    animate={{ y: [0, -10, 0] }}
    transition={{ duration: 2, repeat: Infinity }}
  >
    <HardHat className="w-16 h-16 text-construction-blue/30" />
  </motion.div>
  <p className="mt-4 text-lg font-bold text-gray-600">No tasks yet</p>
  <p className="text-sm text-gray-500">Start building your workflow</p>
</motion.div>
```

### Grid Background
```css
.kanban-background {
  background-image:
    linear-gradient(to right, currentColor 1px, transparent 1px),
    linear-gradient(to bottom, currentColor 1px, transparent 1px);
  background-size: 40px 40px;
  color: #001B51;
  opacity: 0.03;
}
```

## Success Metrics

| Metric | Target |
|--------|--------|
| Drag FPS | 60fps |
| Column Transition Time | < 300ms |
| Background Render Cost | < 5ms |
| Mobile Touch Response | < 100ms |
| User Task Moves | +15% (easier to use) |

---

**Created**: 2025-12-05
**Status**: Ready for Implementation
