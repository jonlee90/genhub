# Design: Mobile PWA Optimization

> Technical design for transforming GenHub into a native-feel iOS mobile app

**Status**: Phase 2 - Technical Design
**Requirement**: [requirement.md](./requirement.md) - APPROVED
**Primary Skill**: `.claude/skills/frontend/mobile-pwa-design/SKILL.md`

---

## Architecture Overview

This is a **frontend-only** feature with no database changes. The work focuses on:

1. **New Mobile Primitives** - Reusable gesture-enabled components
2. **Component Conversions** - Table-to-card transformations
3. **Page Optimizations** - Mobile-first layouts
4. **Performance Enhancements** - Skeletons, virtual scrolling, optimistic UI

```
┌─────────────────────────────────────────────────────────────────┐
│                        App Shell (Existing)                      │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │BottomNav ✓  │  │  Header ✓   │  │ BaseModal ✓ │  Existing    │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
├─────────────────────────────────────────────────────────────────┤
│                    New Mobile Primitives                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │SwipeableCard│  │PullToRefresh│  │SkeletonCard │  P0/P1       │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │StickySubmit │  │TouchButton  │  │MobileInput  │  P1/P2       │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
├─────────────────────────────────────────────────────────────────┤
│                    Responsive Wrappers                           │
│  ┌─────────────────────────────────────────────────┐            │
│  │ ResponsiveTable: Table (desktop) | Cards (mobile)│            │
│  └─────────────────────────────────────────────────┘            │
└─────────────────────────────────────────────────────────────────┘
```

---

## Database Schema

**No database changes required.**

This feature is purely frontend - all data contracts remain unchanged.

---

## Server Actions

**No new Server Actions required.**

Existing actions will be called with optimistic UI patterns on the client side.

---

## Dependencies

### Existing (Already Installed)
```json
{
  "framer-motion": "^12.23.26",      // Animations, gestures
  "@tanstack/react-virtual": "^3.13.13"  // Virtual scrolling
}
```

### To Add
```json
{
  "@use-gesture/react": "^10.3.1"   // Advanced gesture handling (optional - can use native touch events)
}
```

**Decision**: Start with native touch events (as shown in skill patterns). Only add `@use-gesture/react` if native implementation proves insufficient for complex gestures.

---

## Component Architecture

### New Components (Priority Order)

#### P0: SwipeableCard

**Purpose**: Reusable card with left/right swipe actions (delete, complete, archive)

**Location**: `components/mobile/SwipeableCard.tsx`

```typescript
// Props Interface
interface SwipeableCardProps {
  children: React.ReactNode

  // Left swipe reveals right action (e.g., delete)
  rightAction?: {
    icon: LucideIcon
    label: string
    color: string        // Tailwind text color
    bgColor: string      // Tailwind bg color
    onAction: () => void | Promise<void>
  }

  // Right swipe reveals left action (e.g., complete)
  leftAction?: {
    icon: LucideIcon
    label: string
    color: string
    bgColor: string
    onAction: () => void | Promise<void>
  }

  // Configuration
  actionWidth?: number   // Default: 80px
  threshold?: number     // Swipe trigger threshold, default: 60px
  disabled?: boolean

  // Callbacks
  onSwipeStart?: () => void
  onSwipeEnd?: () => void
}

// Implementation Notes:
// - Use native touch events (touchstart, touchmove, touchend)
// - Apply resistance curve at edges: Math.sign(diff) * Math.min(Math.abs(diff), maxPull)
// - Animate with transform (GPU accelerated)
// - Prioritize vertical scroll over horizontal swipe (AC-29)
// - Support haptic feedback via navigator.vibrate(10) when action triggers
```

**Behavior Specification**:
| State | translateX | Visual |
|-------|------------|--------|
| Idle | 0 | Card at rest |
| Swiping right | 0 to actionWidth | Left action reveals |
| Swiping left | 0 to -actionWidth | Right action reveals |
| Past threshold | > threshold | Action icon scales up |
| Release past threshold | Snap to 0, trigger action | Action executes |
| Release before threshold | Animate to 0 or snap to actionWidth | Show action button |

---

#### P0: TaskList Mobile View

**Purpose**: Convert table-based TaskList to responsive card grid on mobile

**Location**: Modify existing `components/tasks/TaskList.tsx`

```typescript
// Add mobile detection
const isMobile = useIsMobile() // from lib/hooks/useMediaQuery

// Conditional render
return isMobile ? (
  <TaskListMobile tasks={tasks} onTaskClick={onTaskClick} />
) : (
  <TaskListTable tasks={tasks} onTaskClick={onTaskClick} />
)
```

**TaskListMobile Sub-component**:
```typescript
interface TaskListMobileProps {
  tasks: Task[]
  onTaskClick: (task: Task) => void
  onComplete?: (taskId: string) => void
  onDelete?: (taskId: string) => void
}

// Implementation:
// - Wrap each TaskCard in SwipeableCard
// - Left swipe: Complete action (green)
// - Right swipe: Delete action (red)
// - Use existing TaskCard component
// - Apply touch-manipulation class for smooth gestures
```

---

#### P1: PullToRefresh

**Purpose**: Wrapper component that adds pull-to-refresh gesture to any scrollable content

**Location**: `components/mobile/PullToRefresh.tsx`

```typescript
interface PullToRefreshProps {
  children: React.ReactNode
  onRefresh: () => Promise<void>
  disabled?: boolean
  threshold?: number      // Default: 80px
  maxPull?: number        // Default: 120px
}

type RefreshState = 'idle' | 'pulling' | 'ready' | 'refreshing'

// Implementation Notes:
// - Only activate when scrollTop === 0
// - Apply resistance curve: diff * 0.4
// - Show rotating arrow that flips when ready
// - Show spinner during refresh
// - Use Loader2 from lucide-react for spinner
```

**Visual States**:
```
idle:       [content]
pulling:    ↓ (rotates with pull distance)
            [content offset down]
ready:      ↑ "Release to refresh"
            [content offset down]
refreshing: ⟳ (spinning)
            [content offset 60px]
```

---

#### P1: BaseModal Enhancements

**Purpose**: Enhance existing BaseModal with drag-to-dismiss and improved animations

**Location**: Modify `components/ui/BaseModal/index.tsx`

**Enhancements**:
```typescript
// Add to BaseModal props
interface BaseModalProps {
  // ... existing props

  // New props for mobile enhancement
  enableDragToDismiss?: boolean  // Default: true on mobile
  snapPoints?: number[]          // Default: [0.5, 0.9] = 50%, 90% height
  initialSnap?: number           // Default: 0 (first snap point)
  onSnapChange?: (snapIndex: number) => void
}

// Implementation using framer-motion:
// - Use motion.div with drag="y" on mobile
// - dragConstraints={{ top: 0 }}
// - dragElastic={0.2}
// - Handle drag end to dismiss or snap
// - Spring animation: stiffness: 400, damping: 35
```

**Drag-to-Dismiss Logic**:
```typescript
const handleDragEnd = (_, info) => {
  // Dismiss if:
  // 1. Velocity > 500px/s downward, OR
  // 2. Dragged past 60% of screen height
  if (info.velocity.y > 500 || info.point.y > window.innerHeight * 0.6) {
    onClose()
  } else {
    // Snap back with spring animation
    animate(y, 0, { type: 'spring', stiffness: 400, damping: 30 })
  }
}
```

---

#### P1: SkeletonCard

**Purpose**: Loading placeholder that matches card dimensions

**Location**: `components/mobile/SkeletonCard.tsx`

```typescript
interface SkeletonCardProps {
  variant?: 'task' | 'project' | 'expense' | 'material' | 'team'
  className?: string
}

// Implementation:
// - Use animate-pulse for shimmer effect
// - Match exact dimensions of real cards
// - Include placeholder for all visual elements (badge, title, metadata)
```

**Variant Specifications**:
| Variant | Elements |
|---------|----------|
| task | Type badge, title (2 lines), date + assignee row |
| project | Image placeholder, title, progress bar |
| expense | Amount, vendor, date, status badge |
| material | Name, quantity, unit price |
| team | Avatar, name, role, status |

---

#### P2: StickySubmitButton

**Purpose**: Fixed-bottom submit button for forms

**Location**: `components/mobile/StickySubmitButton.tsx`

```typescript
interface StickySubmitButtonProps {
  children: React.ReactNode
  onClick?: () => void
  type?: 'submit' | 'button'
  disabled?: boolean
  loading?: boolean
  variant?: 'primary' | 'danger'
  className?: string
}

// Positioning:
// - fixed bottom-20 (above bottom nav)
// - left-4 right-4
// - pb-[env(safe-area-inset-bottom)]
// - Gradient fade overlay above button
```

---

#### P2: TouchButton

**Purpose**: Standardized touch-optimized button with haptic feedback

**Location**: `components/mobile/TouchButton.tsx`

```typescript
interface TouchButtonProps {
  children: React.ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'  // sm=44px, md=48px, lg=56px
  fullWidth?: boolean
  disabled?: boolean
  loading?: boolean
  icon?: LucideIcon
  iconPosition?: 'left' | 'right'
  haptic?: boolean  // Default: true
}

// Touch feedback:
// - active:scale-[0.97]
// - active:opacity-90
// - transition-all duration-100
// - Haptic: navigator.vibrate(10) on press
```

---

#### P2: MobileInput

**Purpose**: Standardized form input with proper sizing and keyboard hints

**Location**: `components/mobile/MobileInput.tsx`

```typescript
interface MobileInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string

  // Mobile-specific
  inputMode?: 'text' | 'decimal' | 'numeric' | 'tel' | 'email' | 'url'
  enterKeyHint?: 'enter' | 'done' | 'go' | 'next' | 'search' | 'send'
}

// Styling:
// - h-14 (56px) minimum height
// - text-base (16px) to prevent iOS zoom
// - rounded-xl borders
// - Focus ring with construction-blue
```

---

### Responsive Wrapper Components

#### ResponsiveTable

**Purpose**: Single component that renders table (desktop) or cards (mobile)

**Location**: `components/shared/ResponsiveTable.tsx`

```typescript
interface ResponsiveTableProps<T> {
  data: T[]
  columns: Column<T>[]        // For desktop table
  renderCard: (item: T) => React.ReactNode  // For mobile cards

  // Mobile-specific
  swipeActions?: {
    left?: SwipeAction
    right?: SwipeAction
  }
  onItemClick?: (item: T) => void

  // Loading states
  loading?: boolean
  skeletonCount?: number

  // Empty state
  emptyIcon?: LucideIcon
  emptyTitle?: string
  emptyDescription?: string
}
```

---

## Animation Specifications

### Timing Guidelines

| Animation | Duration | Easing | Use Case |
|-----------|----------|--------|----------|
| Micro-interaction | 100-150ms | ease-out | Button press, checkbox toggle |
| Card tap | 150ms | ease-out | scale(0.98) + bg change |
| Page transition | 200-300ms | ease-out | Navigation between pages |
| Modal open | 200-300ms | spring(400, 35) | Bottom sheet slide up |
| Modal close | 150-200ms | ease-in | Faster dismiss |
| Pull-to-refresh | 300ms | spring | Snap to loading position |
| Swipe action | 200ms | ease-out | Card snap back |
| List item stagger | 50ms | ease-out | Per-item delay on load |

### Spring Physics (Framer Motion)

```typescript
// Bottom sheet spring
const sheetSpring = {
  type: 'spring',
  stiffness: 400,
  damping: 35
}

// Bounce back spring (swipe overshoot)
const bounceSpring = {
  type: 'spring',
  stiffness: 500,
  damping: 30
}

// Gentle spring (list animations)
const gentleSpring = {
  type: 'spring',
  stiffness: 300,
  damping: 25
}
```

### CSS Classes for Touch Feedback

```css
/* Add to global styles or Tailwind config */

/* Standard tap feedback */
.touch-feedback {
  @apply active:scale-[0.98] active:opacity-90 transition-all duration-100;
}

/* Button tap feedback */
.touch-feedback-button {
  @apply active:scale-[0.97] active:bg-opacity-80 transition-all duration-100;
}

/* Card tap feedback */
.touch-feedback-card {
  @apply active:scale-[0.99] active:bg-gray-50 transition-all duration-150;
}

/* Prevent text selection during gestures */
.touch-manipulation {
  touch-action: manipulation;
  -webkit-user-select: none;
  user-select: none;
}
```

---

## Page-Level Optimizations

### Dashboard (`app/app/page.tsx`)

**Current**: Static widget grid
**Target**: Mobile-first widget layout with swipeable KPI cards

```typescript
// Mobile layout structure
<div className="min-h-[100dvh] pb-20">
  {/* Greeting + Quick Actions */}
  <header className="px-4 pt-4 pb-2">
    <h1>Good morning, {user.name}</h1>
    <QuickActionsRow /> {/* Horizontal scroll of action buttons */}
  </header>

  {/* KPI Cards - Horizontal swipe */}
  <section className="overflow-x-auto snap-x snap-mandatory">
    <KPICardsRow kpis={kpis} />
  </section>

  {/* Widget Stack - Vertical scroll */}
  <PullToRefresh onRefresh={refreshDashboard}>
    <div className="space-y-4 px-4">
      <RecentTasksWidget />
      <UpcomingDeadlinesWidget />
      <TeamActivityWidget />
    </div>
  </PullToRefresh>
</div>
```

### Tasks Page (`app/app/tasks/page.tsx`)

**Current**: Table with filters in header
**Target**: Card list with filter bottom sheet

```typescript
// Mobile layout structure
<div className="min-h-[100dvh] pb-20">
  {/* Sticky header with search + filter button */}
  <header className="sticky top-0 z-30 bg-white border-b px-4 py-3">
    <SearchInput placeholder="Search tasks..." />
    <div className="flex gap-2 mt-2">
      <SegmentedControl segments={statusFilters} />
      <FilterButton onClick={() => setShowFilters(true)} count={activeFilterCount} />
    </div>
  </header>

  {/* Task list with pull-to-refresh */}
  <PullToRefresh onRefresh={refreshTasks}>
    <TaskListMobile
      tasks={filteredTasks}
      onTaskClick={openTaskModal}
      onComplete={handleComplete}
      onDelete={handleDelete}
    />
  </PullToRefresh>

  {/* Filter bottom sheet */}
  <BaseModal
    isOpen={showFilters}
    onClose={() => setShowFilters(false)}
    title="Filters"
  >
    <TaskFilters filters={filters} onChange={setFilters} />
  </BaseModal>

  {/* FAB for create */}
  <FloatingActionButton onClick={() => setShowCreate(true)} />
</div>
```

### Team Page (`app/app/team/page.tsx`)

**Current**: TeamMemberTable
**Target**: Card list with swipe actions

```typescript
// Mobile layout
<PullToRefresh onRefresh={refreshTeam}>
  <div className="space-y-3 px-4 py-4">
    {members.map(member => (
      <SwipeableCard
        key={member.id}
        rightAction={{
          icon: UserMinus,
          label: 'Remove',
          bgColor: 'bg-red-500',
          color: 'text-white',
          onAction: () => handleRemove(member.id)
        }}
      >
        <TeamMemberCard member={member} onClick={() => openMemberModal(member)} />
      </SwipeableCard>
    ))}
  </div>
</PullToRefresh>
```

---

## Performance Optimizations

### 1. Skeleton Loading Pattern

```typescript
// Hook for unified loading state
function useListData<T>(fetchFn: () => Promise<T[]>) {
  const [data, setData] = useState<T[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const refresh = async () => {
    setIsRefreshing(true)
    const newData = await fetchFn()
    setData(newData)
    setIsRefreshing(false)
  }

  return { data, isLoading, isRefreshing, refresh }
}

// Usage with skeleton
{isLoading ? (
  <TaskListSkeleton count={5} />
) : (
  <TaskListMobile tasks={tasks} />
)}
```

### 2. Virtual Scrolling (Lists > 100 items)

```typescript
import { useVirtualizer } from '@tanstack/react-virtual'

function VirtualTaskList({ tasks }: { tasks: Task[] }) {
  const parentRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: tasks.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 120, // Estimated card height
    overscan: 5,
  })

  // Disable virtualization for small lists (AC-32)
  if (tasks.length < 5) {
    return <TaskListSimple tasks={tasks} />
  }

  return (
    <div ref={parentRef} className="h-full overflow-auto">
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map(virtualItem => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            <TaskCard task={tasks[virtualItem.index]} />
          </div>
        ))}
      </div>
    </div>
  )
}
```

### 3. Optimistic UI Updates

```typescript
// Pattern for instant feedback on mutations
function useOptimisticMutation<T>(
  mutationFn: (data: T) => Promise<void>,
  optimisticUpdate: (data: T) => void,
  rollback: () => void
) {
  const [isPending, startTransition] = useTransition()

  const mutate = async (data: T) => {
    // Immediate optimistic update
    optimisticUpdate(data)

    startTransition(async () => {
      try {
        await mutationFn(data)
      } catch (error) {
        // Rollback on failure
        rollback()
        toast.error('Action failed. Please try again.')
      }
    })
  }

  return { mutate, isPending }
}

// Usage
const { mutate: completeTask } = useOptimisticMutation(
  (taskId) => completeTaskAction(taskId),
  (taskId) => setTasks(prev => prev.map(t =>
    t.id === taskId ? { ...t, status: 'completed' } : t
  )),
  () => refetchTasks()
)
```

### 4. Image Lazy Loading

```typescript
// Use next/image with blur placeholder
<Image
  src={project.thumbnail}
  alt={project.name}
  fill
  sizes="(max-width: 768px) 100vw, 50vw"
  placeholder="blur"
  blurDataURL={project.thumbnailBlur || PLACEHOLDER_BLUR}
  className="object-cover"
  loading="lazy"
/>

// Fallback for failed images (AC-36)
const [imgError, setImgError] = useState(false)

{imgError ? (
  <ImagePlaceholder onRetry={() => setImgError(false)} />
) : (
  <Image onError={() => setImgError(true)} ... />
)}
```

---

## Offline Support Enhancements

### Offline Indicator Component

```typescript
// components/mobile/OfflineIndicator.tsx
'use client'

import { WifiOff, Wifi, RefreshCw } from 'lucide-react'
import { useOnlineStatus } from '@/lib/hooks/useOnlineStatus'

export function OfflineIndicator() {
  const { isOnline, wasOffline, pendingCount } = useOnlineStatus()

  if (isOnline && !wasOffline && pendingCount === 0) return null

  return (
    <div className={cn(
      "fixed top-0 left-0 right-0 z-[100]",
      "pt-[env(safe-area-inset-top)]",
      isOnline ? "bg-green-600" : "bg-red-600"
    )}>
      <div className="flex items-center justify-center gap-2 py-2">
        {isOnline ? (
          pendingCount > 0 ? (
            <>
              <RefreshCw className="w-4 h-4 text-white animate-spin" />
              <span className="text-sm text-white">
                Syncing {pendingCount} changes...
              </span>
            </>
          ) : (
            <>
              <Wifi className="w-4 h-4 text-white" />
              <span className="text-sm text-white">Back online</span>
            </>
          )
        ) : (
          <>
            <WifiOff className="w-4 h-4 text-white" />
            <span className="text-sm text-white">
              Offline - changes will sync later
            </span>
          </>
        )}
      </div>
    </div>
  )
}
```

### Enhanced useOnlineStatus Hook

```typescript
// lib/hooks/useOnlineStatus.ts
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true)
  const [wasOffline, setWasOffline] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)

  // ... existing online/offline listeners

  // Track pending mutations count
  useEffect(() => {
    const checkPending = async () => {
      const count = await syncQueue.getCount()
      setPendingCount(count)
    }

    checkPending()
    const interval = setInterval(checkPending, 5000)
    return () => clearInterval(interval)
  }, [])

  return { isOnline, wasOffline, pendingCount }
}
```

---

## Integration Points

### How Components Connect

```
┌─────────────────────────────────────────────────────────────────┐
│                        Page Component                            │
│  (e.g., app/app/tasks/page.tsx)                                 │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ PullToRefresh                                           │    │
│  │   onRefresh={async () => {                              │    │
│  │     revalidatePath('/app/tasks') // Server revalidation │    │
│  │   }}                                                    │    │
│  │                                                         │    │
│  │   ┌─────────────────────────────────────────────────┐   │    │
│  │   │ ResponsiveTable / TaskListMobile                │   │    │
│  │   │                                                 │   │    │
│  │   │   ┌─────────────────────────────────────────┐   │   │    │
│  │   │   │ SwipeableCard                           │   │   │    │
│  │   │   │   onAction={async () => {               │   │   │    │
│  │   │   │     // Optimistic update                │   │   │    │
│  │   │   │     updateLocalState(taskId, 'done')    │   │   │    │
│  │   │   │     // Server action                    │   │   │    │
│  │   │   │     await completeTaskAction(taskId)    │   │   │    │
│  │   │   │   }}                                    │   │   │    │
│  │   │   │                                         │   │   │    │
│  │   │   │   ┌─────────────────────────────────┐   │   │   │    │
│  │   │   │   │ TaskCard (existing)             │   │   │   │    │
│  │   │   │   │   onClick={openTaskModal}       │   │   │   │    │
│  │   │   │   └─────────────────────────────────┘   │   │   │    │
│  │   │   └─────────────────────────────────────────┘   │   │    │
│  │   └─────────────────────────────────────────────────┘   │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ BaseModal (bottom sheet on mobile)                      │    │
│  │   Task detail / edit form                               │    │
│  │   Uses StickySubmitButton for form submit               │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌────────────────────┐                                         │
│  │ FloatingActionButton│ → Opens create task modal              │
│  └────────────────────┘                                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## File Structure

```
components/
├── mobile/                         # New mobile primitives
│   ├── SwipeableCard.tsx          # P0: Swipe gesture card
│   ├── PullToRefresh.tsx          # P1: Pull-to-refresh wrapper
│   ├── SkeletonCard.tsx           # P1: Loading placeholders
│   ├── StickySubmitButton.tsx     # P2: Fixed bottom submit
│   ├── TouchButton.tsx            # P2: Touch-optimized button
│   ├── MobileInput.tsx            # P2: Touch-optimized input
│   ├── FloatingActionButton.tsx   # P2: FAB for create actions
│   ├── SegmentedControl.tsx       # P2: Filter tabs
│   ├── OfflineIndicator.tsx       # P2: Online/offline banner
│   └── index.ts                   # Barrel export
│
├── shared/                         # Responsive components
│   ├── ResponsiveTable.tsx        # Table (desktop) or cards (mobile)
│   └── index.ts
│
├── tasks/
│   ├── TaskList.tsx               # MODIFY: Add mobile detection
│   ├── TaskListMobile.tsx         # NEW: Mobile card view
│   ├── TaskCard.tsx               # MODIFY: Add touch-feedback class
│   └── TaskListSkeleton.tsx       # NEW: Loading skeleton
│
├── team/
│   ├── TeamMemberTable.tsx        # MODIFY: Add responsive wrapper
│   ├── TeamMemberCard.tsx         # NEW: Mobile card variant
│   └── TeamListSkeleton.tsx       # NEW: Loading skeleton
│
├── ui/
│   └── BaseModal/
│       └── index.tsx              # MODIFY: Add drag-to-dismiss
│
lib/
├── hooks/
│   ├── useMediaQuery.ts           # EXISTS: Add useIsMobile export
│   ├── useOnlineStatus.ts         # NEW: Online/offline detection
│   └── useOptimisticMutation.ts   # NEW: Optimistic update pattern
│
└── offline/
    └── syncQueue.ts               # NEW: IndexedDB mutation queue
```

---

## Tailwind Config Additions

```javascript
// tailwind.config.js additions
module.exports = {
  theme: {
    extend: {
      animation: {
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'slide-in-left': 'slideInLeft 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        slideInRight: {
          from: { transform: 'translateX(100%)', opacity: '0' },
          to: { transform: 'translateX(0)', opacity: '1' },
        },
        slideInLeft: {
          from: { transform: 'translateX(-100%)', opacity: '0' },
          to: { transform: 'translateX(0)', opacity: '1' },
        },
        slideUp: {
          from: { transform: 'translateY(100%)' },
          to: { transform: 'translateY(0)' },
        },
      },
    },
  },
}
```

---

## Accessibility Considerations

| Requirement | Implementation |
|-------------|----------------|
| Touch targets 44x44px | All buttons/cards use min-h-[44px] min-w-[44px] |
| Focus indicators | Focus ring on all interactive elements |
| Screen reader | Swipe actions have aria-label, announce changes |
| Reduced motion | Check `prefers-reduced-motion`, disable animations |
| Color contrast | Use design system colors (already WCAG AA) |

```typescript
// Respect reduced motion preference
const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')

// In animations
const animationDuration = prefersReducedMotion ? 0 : 200
```

---

## Testing Strategy

### Manual Testing Checklist

| Test | Device | Expected |
|------|--------|----------|
| Swipe left on task | iOS Safari | Red delete action reveals |
| Swipe right on task | iOS Safari | Green complete action reveals |
| Pull down on list | iOS Safari | Refresh triggers, spinner shows |
| Tap task card | iOS Safari | Visual feedback within 50ms |
| Open modal | iOS Safari | Bottom sheet slides up smoothly |
| Drag modal down | iOS Safari | Dismisses when past threshold |
| Scroll long list | iOS Safari | 60fps maintained |
| Go offline | Any | Offline banner appears |
| Mutation while offline | Any | Optimistic UI + pending indicator |
| Come back online | Any | Changes sync automatically |

### Lighthouse Targets

| Metric | Target |
|--------|--------|
| Performance | ≥90 |
| PWA | 100 |
| Best Practices | ≥90 |
| Accessibility | ≥90 |

---

## Status

**Phase 2: Technical Design** - ✅ APPROVED

---

## Next Steps

Upon approval:
1. **Phase 3: Implementation Plan** (`/kc:spec mobile-pwa-optimization --mode=plan`)
   - Atomic task breakdown
   - Agent assignments (frontend-engineer only)
   - Dependency ordering
   - Sprint sequencing (P0 → P1 → P2 → P3)
