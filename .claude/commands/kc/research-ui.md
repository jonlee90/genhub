# Command: /kc:research-ui

> World-class UI research and component design for GenHub PWA

## Usage

```
/kc:research-ui [component-type or feature]
```

**Examples:**
- `/kc:research-ui kanban-board`
- `/kc:research-ui data-table`
- `/kc:research-ui onboarding-wizard`
- `/kc:research-ui mobile-navigation`

---

## Purpose

This command initiates comprehensive UI/UX research to design production-grade components that:
1. Follow GenHub's construction-themed design system
2. Are mobile-first and PWA-optimized
3. Meet WCAG 2.1 AA accessibility standards
4. Use modern 2024-2025 UI patterns
5. Integrate seamlessly with existing component library

---

## PHASE 1: Research Protocol

### 1.1 Web Search (Modern Patterns)

Search for current best practices using these queries:
- `[component-type] UI pattern 2025`
- `[component-type] mobile UX best practices`
- `[component-type] accessibility patterns`
- `[component-type] React implementation`

### 1.2 Aceternity UI Lookup

Use Context7 MCP to find relevant Aceternity components:
```
mcp__plugin_context7_context7__resolve-library-id
libraryName: "aceternity-ui"
query: "[component description]"
```

Then query the docs:
```
mcp__plugin_context7_context7__query-docs
libraryId: "/aceternity/aceternity-ui"
query: "[specific component or pattern]"
```

**Note:** Aceternity is selectively used in GenHub for:
- BackgroundBoxes (decorative backgrounds)
- AnimatedTooltip (enhanced tooltips)
- PlaceholdersVanishInput (animated inputs)
- NOT as the primary component library

### 1.3 Reference Existing Patterns

Before designing, review these GenHub components:
```
components/mobile/SwipeableCard.tsx    - Touch gestures, haptic feedback
components/mobile/FloatingActionButton.tsx - Mobile FAB pattern
components/mobile/SegmentedControl.tsx - iOS-style tabs
components/ui/BaseModal/index.tsx      - Bottom sheet modal system
components/dashboard/KPICard.tsx       - Variant system, skeletons
components/ui/button.tsx               - CVA pattern reference
```

---

## PHASE 2: GenHub Design System Compliance

### 2.1 Color System (EXACT VALUES)

```css
/* Primary */
--construction-blue: #001B51;          /* Primary brand - Navy */
--construction-accent: #3C3C3C;        /* Dark gray */
--construction-accent-light: #7A7A7A;  /* Mid gray */

/* Status */
--construction-green: #059669;         /* Success, on track */
--construction-red: #DC2626;           /* Error, delayed */
--construction-yellow: #FBBF24;        /* Warning */
--construction-gray: #64748B;          /* Neutral */
```

**Tailwind Usage:**
```tsx
// Primary actions
className="bg-[#001B51] text-white"
className="text-[#001B51]"

// Status indicators
className="bg-[#059669] text-white"  // Success
className="bg-[#DC2626] text-white"  // Error
className="bg-[#FBBF24] text-white"  // Warning

// Do NOT use generic: bg-primary, bg-blue-600, etc.
```

### 2.2 Typography (SYSTEM FONTS ONLY)

```css
font-family: Arial, Helvetica, sans-serif;
```

| Element | Desktop | Mobile | Class |
|---------|---------|--------|-------|
| Page Title | 32px | 24px | `text-2xl md:text-3xl font-bold` |
| Section Title | 24px | 20px | `text-xl md:text-2xl font-semibold` |
| Card Title | 20px | 18px | `text-lg md:text-xl font-semibold` |
| Body | 16px | 16px | `text-base` |
| Small | 14px | 14px | `text-sm` |
| Caption | 12px | 12px | `text-xs` |

**Industrial Headers (Page Titles):**
```tsx
<h1 className="text-2xl md:text-5xl font-black tracking-tighter text-[#001B51] uppercase">
  PAGE TITLE
</h1>
```

**FORBIDDEN:** Custom fonts, Work Sans, IBM Plex Mono, any @font-face

### 2.3 Spacing Scale

| Token | Value | Usage |
|-------|-------|-------|
| 1 | 4px | Tight gaps |
| 2 | 8px | Small gaps |
| 3 | 12px | Card padding (mobile) |
| 4 | 16px | Default padding |
| 6 | 24px | Section spacing |
| 8 | 32px | Large padding |

```tsx
// Responsive spacing pattern
<div className="p-3 md:p-4 lg:p-6">
<div className="space-y-3 md:space-y-4">
<div className="gap-2 md:gap-3">
```

### 2.4 Icon Rules (LUCIDE ONLY)

```tsx
import {
  // Navigation
  LayoutDashboard, FolderKanban, CheckSquare, Package, Receipt,

  // Construction Context
  HardHat, Hammer, Wrench, Building2, Truck,

  // Actions
  Plus, Edit, Trash2, Search, Filter, MoreVertical,

  // Status
  AlertCircle, CheckCircle, Clock, AlertTriangle, XCircle,

  // Common
  ArrowLeft, ChevronDown, ChevronRight, X, Loader2,
} from "lucide-react";

// Sizing
<Icon className="w-4 h-4" />  // Small (buttons, badges)
<Icon className="w-5 h-5" />  // Default (navigation, inline)
<Icon className="w-6 h-6" />  // Large (headers, sections)
```

**FORBIDDEN:** FontAwesome, Heroicons, Material Icons, custom SVGs

### 2.5 Modal Rules (CRITICAL)

**ALWAYS use `<BaseModal>` - NEVER `<Dialog>` directly**

```tsx
import { BaseModal } from '@/components/ui/BaseModal';

<BaseModal
  isOpen={isOpen}
  onClose={onClose}
  title="Modal Title"
  icon={HardHat}
  rightActions={<Button>Save</Button>}
>
  {/* Content */}
</BaseModal>
```

**BaseModal provides:**
- Bottom sheet on mobile with drag-to-dismiss
- Centered modal on desktop
- Construction-themed header with icon
- Safe area handling
- Accessibility compliance

---

## PHASE 3: Mobile PWA Requirements

### 3.1 Touch-First Design

```tsx
// MINIMUM 44px tap targets
className="min-h-[44px] min-w-[44px]"
className="h-11 w-11"  // 44px
className="h-12"       // 48px (preferred)
className="h-14"       // 56px (FAB)

// Touch feedback - use active: NOT hover:
className="active:scale-95 active:bg-gray-100"

// Touch manipulation for smooth scrolling
className="touch-manipulation"
```

### 3.2 Safe Area Handling

```tsx
// Bottom navigation/FAB spacing
className="pb-[env(safe-area-inset-bottom)]"
className="bottom-24 mb-[env(safe-area-inset-bottom)]"

// Full height with safe areas
className="min-h-[100dvh]"  // NOT min-h-screen or 100vh

// Safe area padding
className="pt-[env(safe-area-inset-top)]"
className="px-[max(1rem,env(safe-area-inset-left))]"
```

### 3.3 Haptic Feedback Pattern

```tsx
const triggerHaptic = (intensity: 'light' | 'medium' | 'heavy' = 'light') => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    const durations = { light: 10, medium: 15, heavy: 25 };
    navigator.vibrate(durations[intensity]);
  }
};

// Usage in handlers
const handleClick = () => {
  triggerHaptic('light');
  // ... action
};
```

### 3.4 Responsive Breakpoints

```tsx
// Mobile-first approach
className="
  flex flex-col           // Mobile: stack
  md:flex-row            // Tablet+: row
  lg:grid lg:grid-cols-3 // Desktop: grid
"

// Breakpoints
// sm: 640px  - Large phones
// md: 768px  - Tablets (primary breakpoint)
// lg: 1024px - Desktop
// xl: 1280px - Large desktop

// Hide/show by device
className="md:hidden"     // Mobile only
className="hidden md:flex" // Tablet+ only
```

### 3.5 Gesture Support Template

```tsx
// Swipe gesture pattern (see SwipeableCard.tsx)
const SWIPE_THRESHOLD = 60;  // pixels to trigger action
const RESISTANCE = 0.5;       // edge resistance factor

// Drag-to-dismiss pattern (see BaseModal)
const DRAG_DISMISS_VELOCITY = 500;     // px/s for fast swipe
const DRAG_DISMISS_THRESHOLD = 0.6;    // 60% of height
```

---

## PHASE 4: Component Architecture

### 4.1 CVA Variant Pattern (REQUIRED)

```tsx
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const componentVariants = cva(
  // Base styles (always applied)
  "inline-flex items-center justify-center font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-[#001B51] text-white active:bg-[#001B51]/90",
        secondary: "bg-gray-100 text-gray-900 active:bg-gray-200",
        ghost: "bg-transparent active:bg-gray-100",
        destructive: "bg-[#DC2626] text-white active:bg-[#DC2626]/90",
      },
      size: {
        sm: "h-9 px-3 text-sm",
        md: "h-11 px-4 text-base",      // 44px - touch friendly
        lg: "h-12 px-6 text-base",
        icon: "h-11 w-11",               // 44px square
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

export interface ComponentProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof componentVariants> {
  // Additional props
}
```

### 4.2 forwardRef Pattern (REQUIRED for base components)

```tsx
import { forwardRef } from 'react';

export interface ComponentProps
  extends React.HTMLAttributes<HTMLDivElement> {
  // Props
}

export const Component = forwardRef<HTMLDivElement, ComponentProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("base-classes", className)}
        {...props}
      />
    );
  }
);

Component.displayName = "Component";
```

### 4.3 Framer Motion Configs

```tsx
import { motion, AnimatePresence } from 'framer-motion';

// Spring animations (snappy, physical)
const springConfig = {
  type: "spring",
  stiffness: 400,  // 300-400 range
  damping: 30,     // 24-35 range
};

// Fade in/out
const fadeVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

// Slide up (for modals, bottom sheets)
const slideUpVariants = {
  hidden: { y: "100%", opacity: 0 },
  visible: { y: 0, opacity: 1 },
  exit: { y: "100%", opacity: 0 },
};

// Scale (for cards, buttons)
const scaleVariants = {
  initial: { scale: 0.95, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  exit: { scale: 0.95, opacity: 0 },
  tap: { scale: 0.98 },
};

// Usage
<motion.div
  variants={fadeVariants}
  initial="hidden"
  animate="visible"
  exit="exit"
  transition={springConfig}
>
```

### 4.4 Skeleton Loading Pattern

```tsx
function ComponentSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Match exact component structure */}
      <div className="flex items-center gap-3 p-4">
        <div className="h-10 w-10 bg-gray-200 rounded-lg" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-24 bg-gray-200 rounded" />
          <div className="h-3 w-32 bg-gray-200 rounded" />
        </div>
      </div>
    </div>
  );
}

// In component
if (isLoading) {
  return <ComponentSkeleton />;
}
```

### 4.5 Props Interface Template

```tsx
interface ComponentProps {
  /** Primary content */
  children?: React.ReactNode;

  /** Visual variant */
  variant?: 'default' | 'success' | 'warning' | 'danger';

  /** Size variant */
  size?: 'sm' | 'md' | 'lg';

  /** Icon from Lucide */
  icon?: LucideIcon;

  /** Click handler */
  onClick?: () => void;

  /** Loading state - shows skeleton */
  isLoading?: boolean;

  /** Disabled state */
  disabled?: boolean;

  /** Accessible label (required for icon-only) */
  ariaLabel?: string;

  /** Additional className */
  className?: string;
}
```

---

## PHASE 5: Quality Checklists

### 5.1 Mobile PWA Checklist

Before finalizing design:

- [ ] **Tap targets**: All interactive elements >= 44px
- [ ] **Touch feedback**: Uses `active:` states, not `hover:`
- [ ] **Safe areas**: Bottom nav/FAB respects safe-area-inset-bottom
- [ ] **Full height**: Uses `min-h-[100dvh]` not `100vh`
- [ ] **Touch manipulation**: Scroll areas have `touch-manipulation`
- [ ] **Haptic feedback**: Defined for key interactions
- [ ] **No hover-only**: All hover states have touch equivalents
- [ ] **Swipe gestures**: Consider for lists and dismissible items
- [ ] **Font size**: Minimum 16px for inputs (prevents iOS zoom)

### 5.2 Accessibility Checklist

- [ ] **Semantic HTML**: Uses button, nav, main, section, article appropriately
- [ ] **ARIA labels**: Icon-only buttons have aria-label
- [ ] **Focus indicators**: `focus:ring-2 focus:ring-offset-2 focus:ring-[#001B51]`
- [ ] **Color contrast**: 4.5:1 minimum for text
- [ ] **Screen reader**: Hidden decorative elements with `aria-hidden="true"`
- [ ] **Keyboard nav**: All interactive elements focusable and operable
- [ ] **Role attributes**: Correct roles for custom widgets
- [ ] **Live regions**: Dynamic content announced with aria-live

### 5.3 Performance Checklist

- [ ] **Bundle size**: No heavy dependencies (check npm bundle size)
- [ ] **Animation**: GPU-accelerated (transform, opacity only)
- [ ] **Lazy loading**: Large components use dynamic import
- [ ] **Memoization**: useMemo/useCallback for expensive operations
- [ ] **Virtualization**: Lists > 50 items use react-window
- [ ] **Image optimization**: Next/Image with proper sizing

### 5.4 GenHub Rules Compliance

- [ ] **Modals**: Uses `<BaseModal>` only, NEVER `<Dialog>`
- [ ] **Icons**: Lucide React only
- [ ] **Colors**: Exact hex values (#001B51, #059669, etc.)
- [ ] **Fonts**: System fonts only (Arial, Helvetica, sans-serif)
- [ ] **No Supabase**: Client components never import Supabase
- [ ] **Decoration**: Minimal, no gratuitous animations

---

## PHASE 6: Output Format

### 6.1 Research Summary

```markdown
## UI Research: [Component Type]

### Recommended Approach
[1-2 sentence summary of the recommended implementation]

### Modern Patterns Identified
1. **[Pattern Name]**: [Description and when to use]
2. **[Pattern Name]**: [Description and when to use]
3. **[Pattern Name]**: [Description and when to use]

### Aceternity Components (if applicable)
- [Component]: [Use case and customization needed]
- [Component]: [Use case and customization needed]

### External Dependencies (if needed)
- `[package]`: [Purpose and bundle size]
```

### 6.2 Component Specification

````markdown
## Component: [ComponentName]

### Purpose
[What problem this component solves]

### Props Interface
```tsx
interface [ComponentName]Props {
  // Complete typed interface with JSDoc comments
}
```

### Variants
| Variant | Use Case | Visual |
|---------|----------|--------|
| default | [When to use] | [Description] |
| success | [When to use] | Green accent |
| warning | [When to use] | Yellow accent |
| danger | [When to use] | Red accent |

### Animation Specification
```tsx
const animationConfig = {
  // Exact Framer Motion config
};
```

### Skeleton Loading
```tsx
// Exact skeleton structure
```

### Usage Example
```tsx
// Complete usage example with common props
```

### Mobile Considerations
- [Specific mobile adaptations]
- [Gesture support if applicable]
- [Safe area handling]

### Accessibility Notes
- [Required ARIA attributes]
- [Keyboard interaction]
- [Screen reader behavior]
````

### 6.3 Integration Notes

````markdown
## Integration Guide

### File Location
`components/[category]/[ComponentName].tsx`

### Imports Required
```tsx
// List all imports
```

### Works With
- `[ExistingComponent]`: [How they integrate]
- `[ExistingPattern]`: [Integration approach]

### State Management
[How component handles state, if stateful]

### Server vs Client
- [ ] Client component (`'use client'`)
- [ ] Server component compatible
````

---

## Example Output

When given `/kc:research-ui expense-card`:

````markdown
## UI Research: Expense Card

### Recommended Approach
Create a swipeable expense card using SwipeableCard wrapper with construction-themed status indicators and amount formatting.

### Modern Patterns Identified
1. **Swipe Actions**: iOS-style swipe to reveal approve/reject actions
2. **Status Badges**: Pill-shaped badges with semantic colors
3. **Receipt Preview**: Thumbnail with tap-to-expand modal

### Aceternity Components
None required - custom implementation using existing patterns

### External Dependencies
None - uses existing SwipeableCard and BaseModal

---

## Component: ExpenseCard

### Props Interface
```tsx
interface ExpenseCardProps {
  /** Expense data */
  expense: {
    id: string;
    description: string;
    amount: number;
    status: 'pending' | 'approved' | 'rejected';
    category: string;
    submittedBy: string;
    submittedAt: Date;
    receiptUrl?: string;
  };

  /** Called when expense is approved */
  onApprove?: (id: string) => void;

  /** Called when expense is rejected */
  onReject?: (id: string) => void;

  /** Called when card is tapped */
  onPress?: (id: string) => void;

  /** Loading state */
  isLoading?: boolean;

  /** Additional className */
  className?: string;
}
```

### Variants
| Status | Badge Color | Border |
|--------|-------------|--------|
| pending | Gray bg | Left border gray |
| approved | Green bg (#059669) | Left border green |
| rejected | Red bg (#DC2626) | Left border red |

### Animation Specification
```tsx
const cardAnimation = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, x: -100 },
  transition: { type: "spring", stiffness: 400, damping: 30 }
};
```

### Mobile Considerations
- Swipe right: Approve (green action)
- Swipe left: Reject (red action)
- Haptic feedback on swipe threshold
- 44px minimum touch targets for all buttons

### Accessibility Notes
- `role="article"` for the card
- Status communicated via `aria-label`
- Swipe actions also available as visible buttons for non-touch users
````

---

## See Also

- `docs/frontend/DESIGN_SYSTEM.md` - Complete design system
- `skills/frontend/list-patterns.md` - List/card patterns
- `components/mobile/` - Mobile component reference
- `components/ui/BaseModal/` - Modal system reference
