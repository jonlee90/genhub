# Task 0005: Enhance TaskActivityLog with Timeline

**Component**: `components/tasks/TaskActivityLog.tsx`
**Aceternity Components**: Timeline
**Priority**: MEDIUM
**Estimated Effort**: 3-4 hours

## Objective
Create vertical timeline with construction-themed activity icons and relative timestamps for task activity history.

## Requirements

### Core Features
1. **Timeline Component Integration**
   - Vertical timeline layout
   - Construction-blue connecting line
   - Activity dots color-coded by type
   - Responsive spacing between items
   - Auto-scroll to latest activity

2. **Construction-Themed Icons**
   - Wrench: Task updates
   - MessageSquare: Comments
   - User: Assignment changes
   - Calendar: Due date changes
   - Settings: Status/priority changes
   - HardHat: Construction-specific actions
   - All icons from Lucide React

3. **Relative Timestamps**
   - "Just now", "2 minutes ago", "1 hour ago"
   - "Yesterday at 3:45 PM"
   - Automatic updates (live)
   - Tooltip with exact timestamp on hover
   - Construction-themed timestamp styling

4. **Activity Type Color-Coding**
   - Updates: Construction-blue dot
   - Comments: Construction-accent (amber) dot
   - Assignments: Construction-green dot
   - Status changes: Construction-red dot (if critical)
   - Due date changes: Construction-yellow dot

5. **Smooth Animations**
   - Fade-in for new activities
   - Slide-in from right for latest item
   - Pulse animation on dot for real-time updates
   - Stagger effect when loading history

6. **Infinite Scroll**
   - Load more activities on scroll
   - Skeleton loaders for loading states
   - "End of activity" indicator
   - Virtual scrolling for 1000+ activities

### Construction Theme Integration
- Industrial typography for activity descriptions
- Construction icons throughout
- Blueprint-style timeline connector line
- Heavy emphasis on recent activities

## Technical Implementation

### Dependencies
```typescript
import { Timeline } from '@/components/ui/aceternity/timeline';
import {
  Wrench, MessageSquare, User, Calendar,
  Settings, HardHat, Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
```

### Activity Icon Mapping
```typescript
const activityIcons = {
  update: Wrench,
  comment: MessageSquare,
  assignment: User,
  due_date: Calendar,
  status: Settings,
  construction: HardHat
};

const activityColors = {
  update: 'bg-construction-blue',
  comment: 'bg-construction-accent',
  assignment: 'bg-construction-green',
  status: 'bg-construction-red',
  due_date: 'bg-construction-yellow'
};
```

### Timeline Item Animation
```typescript
const itemVariants = {
  hidden: { opacity: 0, x: 20 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.05,
      duration: 0.3,
      ease: 'easeOut'
    }
  })
};
```

### Relative Time
```typescript
const getRelativeTime = (timestamp: Date) => {
  const distance = formatDistanceToNow(timestamp, { addSuffix: true });

  // Custom construction-themed labels
  return distance
    .replace('less than a minute', 'just now')
    .replace('about', '~');
};
```

## Acceptance Criteria

- [ ] Vertical timeline displays all activities correctly
- [ ] Timeline connector line is construction-blue
- [ ] Activity dots are color-coded by type
- [ ] Activity icons match construction theme
- [ ] Relative timestamps display correctly ("2 hours ago")
- [ ] Timestamps update automatically every minute
- [ ] Hover tooltip shows exact timestamp
- [ ] New activities fade in smoothly
- [ ] Latest activity slides in from right
- [ ] Loading history shows stagger animation (50ms delay each)
- [ ] Infinite scroll loads more activities
- [ ] Skeleton loaders match construction theme
- [ ] Virtual scrolling works for 1000+ activities
- [ ] Mobile-responsive with proper spacing
- [ ] Auto-scrolls to latest activity on mount

## Testing Checklist

### Visual Testing
- [ ] Timeline connector line is straight and construction-blue
- [ ] Activity dots are color-coded correctly
- [ ] Icons are construction-themed and clearly visible
- [ ] Timestamps are readable and properly formatted
- [ ] Spacing between items is consistent
- [ ] Responsive layout works on mobile

### Functional Testing
- [ ] All activity types display correctly
- [ ] Timestamps update automatically
- [ ] Hover tooltip shows exact date/time
- [ ] Infinite scroll loads more activities
- [ ] Virtual scrolling prevents performance issues
- [ ] Auto-scroll to latest works on mount
- [ ] Real-time updates appear instantly

### Performance Testing
- [ ] Timeline renders 100+ items without lag
- [ ] Scroll is smooth at 60fps
- [ ] Animations are GPU-accelerated
- [ ] Virtual scrolling works for 1000+ items
- [ ] No memory leaks with auto-updating timestamps

### Accessibility Testing
- [ ] Timeline has semantic HTML structure
- [ ] Activity descriptions are screen-reader friendly
- [ ] Timestamps have aria-label with full date
- [ ] Focus indicators visible on interactive items
- [ ] Keyboard navigation works (arrow keys)
- [ ] Respects prefers-reduced-motion

## Implementation Steps

1. **Create Timeline Component**
   - Build vertical timeline structure
   - Add construction-blue connector line
   - Implement activity dot placement
   - Ensure responsive spacing

2. **Add Activity Icons**
   - Map activity types to Lucide icons
   - Color-code icons with construction palette
   - Size icons appropriately (16-20px)
   - Test all activity types

3. **Implement Relative Timestamps**
   - Use date-fns for formatting
   - Set up auto-update interval (60s)
   - Add hover tooltip with exact time
   - Style timestamps with construction theme

4. **Add Animations**
   - Implement fade-in for new activities
   - Add slide-in from right for latest
   - Create stagger effect for history load
   - Test smooth transitions

5. **Implement Infinite Scroll**
   - Set up Intersection Observer
   - Load more activities on scroll
   - Add skeleton loaders
   - Implement virtual scrolling

6. **Optimize Performance**
   - Use React.memo for activity items
   - Implement virtual scrolling for large lists
   - Debounce timestamp updates
   - Profile and optimize

## Construction Theme Elements

### Timeline Connector
```css
.timeline-connector {
  position: absolute;
  left: 20px;
  top: 0;
  bottom: 0;
  width: 2px;
  background: linear-gradient(
    to bottom,
    var(--construction-blue),
    var(--construction-blue) 50%,
    transparent
  );
}
```

### Activity Item
```typescript
<motion.div
  variants={itemVariants}
  custom={index}
  className="flex gap-4 pb-6 relative"
>
  {/* Activity dot */}
  <div className={cn(
    "w-10 h-10 rounded-full flex items-center justify-center border-2 border-white shadow-construction z-10",
    activityColors[activity.type]
  )}>
    <ActivityIcon className="w-5 h-5 text-white" />
  </div>

  {/* Activity content */}
  <div className="flex-1">
    <p className="text-sm font-bold text-gray-900">
      {activity.description}
    </p>
    <p className="text-xs text-gray-500 font-medium mt-1">
      {getRelativeTime(activity.timestamp)}
    </p>
  </div>
</motion.div>
```

### Timestamp Tooltip
```typescript
<Tooltip>
  <TooltipTrigger>
    <span className="text-xs text-construction-blue font-mono">
      {relativeTime}
    </span>
  </TooltipTrigger>
  <TooltipContent>
    <p className="text-xs">
      {format(timestamp, 'PPpp')}
    </p>
  </TooltipContent>
</Tooltip>
```

## Success Metrics

| Metric | Target |
|--------|--------|
| Timeline Render Time | < 100ms for 50 items |
| Scroll FPS | 60fps |
| Timestamp Update Accuracy | ±5 seconds |
| User Activity View Time | +20% |
| Real-time Update Latency | < 1 second |

---

**Created**: 2025-12-05
**Status**: Ready for Implementation
