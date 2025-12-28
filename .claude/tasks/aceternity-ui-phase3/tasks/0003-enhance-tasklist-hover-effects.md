# Task 0003: Enhance TaskList with Table and Text Hover Effects

**Component**: `components/tasks/TaskList.tsx`
**Aceternity Components**: Table + Text Hover Effect
**Priority**: HIGH
**Estimated Effort**: 3-5 hours

## Objective
Add hoverable rows with subtle highlights, animated status badges, and construction-themed table design.

## Requirements

### Core Features
1. **Table Component Pattern**
   - Clean, construction-themed table design
   - Alternating row backgrounds (subtle)
   - Responsive table layout (collapses on mobile)
   - Sticky header row on scroll
   - Construction-blue header background

2. **Text Hover Effect**
   - Task names with hover underline effect
   - Smooth color transition on hover
   - Construction-blue hover color
   - Cursor pointer for clickable tasks

3. **Row Highlight**
   - Subtle background change on row hover
   - Construction-blue tint (5% opacity)
   - Smooth 200ms transition
   - Selected row has persistent highlight

4. **Animated Status Badges**
   - Construction-themed status colors
   - Smooth transitions between states
   - Pulse animation for "in_progress" status
   - Icon + text in badge

5. **Construction Icons**
   - Wrench icon for tasks with materials
   - Calendar icon for due dates
   - User icon for assignees
   - Hard hat icon for construction tasks
   - All icons from Lucide React

6. **Sorting and Filtering**
   - Animated sort icon rotations
   - Smooth transitions when reordering
   - Filter chips with construction theme
   - Clear filters button with X animation

### Construction Theme Integration
- Heavy typography for headers (font-black)
- Construction color palette for status badges
- Industrial icons throughout
- Blueprint-style subtle grid in background

## Technical Implementation

### Dependencies
```typescript
import { TextHoverEffect } from '@/components/ui/aceternity/text-hover-effect';
import { Wrench, Calendar, User, HardHat, ArrowUpDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
```

### Table Structure
```typescript
<table className="w-full border-collapse">
  <thead className="sticky top-0 bg-construction-blue text-white z-10">
    {/* Header cells with sort icons */}
  </thead>
  <tbody>
    {/* Rows with hover effects */}
  </tbody>
</table>
```

### Row Hover Animation
```typescript
const rowVariants = {
  idle: {
    backgroundColor: 'rgba(255, 255, 255, 0)'
  },
  hover: {
    backgroundColor: 'rgba(0, 27, 81, 0.05)',
    transition: { duration: 0.2 }
  }
};
```

### Status Badge Component
```typescript
const statusConfig = {
  to_do: { color: 'bg-gray-200 text-gray-700', icon: null },
  in_progress: { color: 'bg-construction-blue text-white', icon: Wrench, animate: true },
  done: { color: 'bg-construction-green text-white', icon: CheckCircle },
  blocked: { color: 'bg-construction-red text-white', icon: AlertTriangle }
};
```

## Acceptance Criteria

- [ ] Table has construction-themed styling
- [ ] Header row is sticky on scroll
- [ ] Header background is construction-blue
- [ ] Rows highlight with construction-blue tint (5%) on hover
- [ ] Hover transitions are smooth (200ms)
- [ ] Task names have text hover effect with underline
- [ ] Status badges display with correct construction colors
- [ ] "in_progress" badges have pulse animation
- [ ] Construction icons display correctly (wrench, calendar, user)
- [ ] Sorting works with animated icon rotations
- [ ] Filtering works with construction-themed chips
- [ ] Table is responsive (collapses to cards on mobile)
- [ ] Keyboard navigation works (arrow keys)
- [ ] Screen reader announces row content

## Testing Checklist

### Visual Testing
- [ ] Table matches construction theme
- [ ] Header is properly styled with construction-blue
- [ ] Row hover effects are subtle and professional
- [ ] Status badges match construction color palette
- [ ] Icons are construction-themed and clearly visible
- [ ] Responsive layout works on mobile (320px+)

### Functional Testing
- [ ] Click task name to open details
- [ ] Sorting works for all columns
- [ ] Filtering updates table smoothly
- [ ] Multi-select rows with checkboxes
- [ ] Bulk actions work on selected rows
- [ ] Pagination works smoothly

### Performance Testing
- [ ] Table renders 100+ rows without lag
- [ ] Hover effects are 60fps
- [ ] Sorting is near-instant (< 100ms)
- [ ] Filtering doesn't cause jank
- [ ] Virtual scrolling works for 1000+ rows

### Accessibility Testing
- [ ] Table has proper ARIA roles
- [ ] Header cells use scope="col"
- [ ] Sortable headers are keyboard accessible
- [ ] Screen reader announces sort direction
- [ ] Focus indicators visible on all interactive elements
- [ ] Respects prefers-reduced-motion (no pulse animations)

## Implementation Steps

1. **Create Table Structure**
   - Build table with semantic HTML
   - Add construction-themed header styling
   - Implement sticky header on scroll
   - Make header background construction-blue

2. **Add Row Hover Effects**
   - Wrap rows with motion.tr
   - Implement hover variants
   - Add construction-blue tint
   - Test smooth transitions

3. **Implement Text Hover**
   - Apply TextHoverEffect to task names
   - Add construction-blue hover color
   - Ensure cursor pointer on hover
   - Test click navigation

4. **Create Status Badges**
   - Build StatusBadge component
   - Map status to construction colors
   - Add pulse animation for "in_progress"
   - Include status icons

5. **Add Construction Icons**
   - Import Lucide icons
   - Map icons to data types
   - Style with construction colors
   - Ensure proper sizing (16-20px)

6. **Implement Sorting**
   - Add sort state management
   - Animate sort icon rotations
   - Smooth reorder transitions
   - Test with large datasets

7. **Make Responsive**
   - Collapse to card layout on mobile
   - Ensure touch targets ≥ 44px
   - Test on various screen sizes
   - Optimize for tablet landscape

## Construction Theme Elements

### Table Header
```typescript
<thead className="sticky top-0 bg-construction-blue text-white shadow-construction z-10">
  <tr>
    <th className="px-6 py-4 text-left text-sm font-black uppercase tracking-wider">
      Task
    </th>
    {/* More headers */}
  </tr>
</thead>
```

### Status Badge
```typescript
<motion.span
  className={cn(
    "inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold",
    statusConfig[status].color
  )}
  animate={status === 'in_progress' ? { scale: [1, 1.05, 1] } : {}}
  transition={{ duration: 2, repeat: Infinity }}
>
  {statusConfig[status].icon && <Icon className="w-3 h-3" />}
  {status.replace('_', ' ').toUpperCase()}
</motion.span>
```

### Row Hover
```css
.task-row:hover {
  background-color: rgba(0, 27, 81, 0.05);
  transition: background-color 0.2s ease;
}
```

## Success Metrics

| Metric | Target |
|--------|--------|
| Row Hover FPS | 60fps |
| Sort Performance | < 100ms for 100 rows |
| Filter Performance | < 50ms |
| Mobile Tap Response | < 100ms |
| User Engagement | +10% task views |

---

**Created**: 2025-12-05
**Status**: Ready for Implementation
