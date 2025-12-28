# Task 0004: Enhance TaskDetail with Expandable Sections

**Component**: `components/tasks/TaskDetail.tsx`
**Aceternity Components**: Expandable Card + Container Scroll Animation
**Priority**: HIGH
**Estimated Effort**: 4-6 hours

## Objective
Add expandable sections with scroll-triggered animations and construction-themed tabbed interface for task details.

## Requirements

### Core Features
1. **Expandable Card Sections**
   - Smooth expand/collapse animations
   - Accordion-style sections (Details, Dependencies, Activity)
   - One section expanded at a time (optional multi-expand)
   - Animated chevron icons indicating state
   - Remember last expanded state in localStorage

2. **Container Scroll Animation**
   - Fade-in animations as sections scroll into view
   - Parallax effect for section headers
   - Progressive disclosure of content
   - Smooth scroll behavior
   - Anchor links to jump to sections

3. **Tabbed Interface**
   - Tabs for Details / Activity / Dependencies
   - Construction-themed tab design
   - Animated tab indicator (sliding underline)
   - Smooth content transitions
   - Deep linking support (URL fragments)

4. **Construction-Themed Sections**
   - Details: Task description, materials, budget
   - Activity: Timeline of changes with icons
   - Dependencies: Predecessor/successor tasks with connecting lines
   - Each section has construction icon header

5. **Mobile Optimization**
   - Touch-friendly section headers (≥ 44px)
   - Swipe gestures to switch tabs
   - Collapsible sections to save screen space
   - Bottom sheet style on mobile
   - Pull-to-refresh for activity updates

### Construction Theme Integration
- Industrial section headers with hard hat icons
- Blueprint-style connecting lines for dependencies
- Construction-blue accent colors
- Heavy typography for section titles
- Wrench icon for expandable sections

## Technical Implementation

### Dependencies
```typescript
import { ExpandableCard } from '@/components/ui/aceternity/expandable-card';
import { ContainerScrollAnimation } from '@/components/ui/aceternity/container-scroll-animation';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ChevronDown, ChevronUp, Wrench, Calendar, Link as LinkIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
```

### Expandable Section
```typescript
const SectionVariants = {
  collapsed: {
    height: 0,
    opacity: 0,
    transition: { duration: 0.3, ease: 'easeInOut' }
  },
  expanded: {
    height: 'auto',
    opacity: 1,
    transition: { duration: 0.3, ease: 'easeInOut' }
  }
};
```

### Tab Indicator Animation
```typescript
<motion.div
  layoutId="tabIndicator"
  className="absolute bottom-0 h-1 bg-construction-blue"
  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
/>
```

### Scroll Fade-In
```typescript
const fadeInVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' }
  }
};
```

## Acceptance Criteria

- [ ] Sections expand/collapse smoothly (300ms animation)
- [ ] Chevron icons rotate to indicate state (180° rotation)
- [ ] Only one section expanded at a time (accordion mode)
- [ ] Last expanded section remembered in localStorage
- [ ] Scroll animations trigger at correct viewport positions
- [ ] Fade-in effect is smooth and subtle
- [ ] Tabs switch smoothly with sliding indicator
- [ ] Tab indicator uses construction-blue color
- [ ] Content transitions are animated (fade/slide)
- [ ] Deep linking works (e.g., #activity)
- [ ] Mobile swipe gestures work for tab switching
- [ ] Touch targets are ≥ 44px on mobile
- [ ] Construction icons display in section headers
- [ ] Keyboard navigation works (Tab, Enter, Escape)
- [ ] Screen reader announces expanded/collapsed states

## Testing Checklist

### Visual Testing
- [ ] Expand/collapse animations are smooth
- [ ] Chevron icons rotate correctly
- [ ] Tab indicator slides smoothly
- [ ] Construction theme colors consistent
- [ ] Section headers have construction icons
- [ ] Typography follows industrial style
- [ ] Responsive on all screen sizes

### Functional Testing
- [ ] Click to expand/collapse sections
- [ ] Click tabs to switch content
- [ ] Deep links navigate to correct tab/section
- [ ] localStorage persists expanded state
- [ ] Swipe gestures work on mobile
- [ ] Anchor links scroll to sections
- [ ] Edit task details inline

### Performance Testing
- [ ] Animations run at 60fps
- [ ] No layout shift during expand/collapse
- [ ] Scroll performance with long content
- [ ] Tab switching is instant (< 50ms)
- [ ] Works smoothly with 100+ activity items

### Accessibility Testing
- [ ] Keyboard navigation (Tab, arrows, Enter, Escape)
- [ ] Screen reader announces "Expanded" / "Collapsed"
- [ ] Focus indicators visible
- [ ] ARIA attributes correct (aria-expanded, role="tablist")
- [ ] Respects prefers-reduced-motion

## Implementation Steps

1. **Create Expandable Sections**
   - Build Section component with expand/collapse
   - Add motion.div for animations
   - Implement chevron icon rotation
   - Add localStorage for state persistence

2. **Implement Tabs**
   - Create TabBar component
   - Add sliding indicator animation
   - Implement tab switching logic
   - Add deep linking support

3. **Add Scroll Animations**
   - Integrate ContainerScrollAnimation
   - Set up Intersection Observer
   - Implement fade-in variants
   - Test trigger points

4. **Design Section Layouts**
   - Details section: form fields with construction theme
   - Activity section: timeline component
   - Dependencies section: task graph with connecting lines
   - Add construction icons to headers

5. **Optimize for Mobile**
   - Add swipe gesture detection
   - Implement bottom sheet style
   - Ensure touch targets ≥ 44px
   - Test on various mobile devices

6. **Add Construction Theme**
   - Style headers with industrial typography
   - Use construction-blue for accents
   - Add hard hat / wrench icons
   - Apply blueprint-style subtle patterns

## Construction Theme Elements

### Section Header
```typescript
<motion.button
  onClick={toggleSection}
  className="flex items-center justify-between w-full px-6 py-4 bg-gradient-to-r from-construction-blue/5 to-transparent border-l-4 border-construction-blue"
>
  <div className="flex items-center gap-3">
    <Wrench className="w-5 h-5 text-construction-blue" />
    <h3 className="text-lg font-black text-gray-900 uppercase">
      {section.title}
    </h3>
  </div>
  <ChevronDown
    className={cn(
      "w-5 h-5 text-construction-blue transition-transform duration-300",
      isExpanded && "rotate-180"
    )}
  />
</motion.button>
```

### Tab Indicator
```css
.tab-indicator {
  position: absolute;
  bottom: 0;
  height: 3px;
  background: linear-gradient(
    to right,
    var(--construction-blue),
    var(--construction-accent)
  );
  border-radius: 2px 2px 0 0;
}
```

### Dependency Graph
```typescript
<svg className="w-full h-auto">
  <defs>
    <marker id="arrowhead" markerWidth="10" markerHeight="7"
      refX="9" refY="3.5" orient="auto">
      <polygon points="0 0, 10 3.5, 0 7" fill="#001B51" />
    </marker>
  </defs>
  {/* Task nodes and connecting lines */}
</svg>
```

## Success Metrics

| Metric | Target |
|--------|--------|
| Expand/Collapse FPS | 60fps |
| Tab Switch Time | < 50ms |
| Scroll Animation FPS | 60fps |
| User Section Views | +25% |
| Task Edit Time | -15% |

---

**Created**: 2025-12-05
**Status**: Ready for Implementation
