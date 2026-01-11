# Mobile Patterns Reference

> Detailed navigation, gesture, and animation patterns for native mobile feel

---

## Navigation Patterns

### 1. Bottom Tab Navigation

The primary navigation pattern for GenHub mobile. Users expect this from native apps.

**When to Use:**
- Main app navigation (3-5 primary destinations)
- Persistent access to core features
- Field workers need quick one-tap access

```tsx
// Full implementation with active states and haptic feedback
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Package,
  Menu
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavItem {
  href: string
  icon: React.ElementType
  label: string
  badge?: number
}

const navItems: NavItem[] = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { href: '/projects', icon: FolderKanban, label: 'Projects' },
  { href: '/tasks', icon: CheckSquare, label: 'Tasks', badge: 3 },
  { href: '/materials', icon: Package, label: 'Materials' },
  { href: '/more', icon: Menu, label: 'More' },
]

export function BottomTabNav() {
  const pathname = usePathname()

  const handleTap = () => {
    // Trigger haptic feedback on supported devices
    if ('vibrate' in navigator) {
      navigator.vibrate(10)
    }
  }

  return (
    <nav className="
      fixed bottom-0 left-0 right-0 z-50
      bg-white/95 backdrop-blur-sm
      border-t border-gray-200
      pb-[env(safe-area-inset-bottom)]
      md:hidden
    ">
      <div className="flex justify-around items-stretch h-16">
        {navItems.map(({ href, icon: Icon, label, badge }) => {
          const isActive = pathname === href || pathname.startsWith(`${href}/`)

          return (
            <Link
              key={href}
              href={href}
              onClick={handleTap}
              className={cn(
                // Base styles
                "flex flex-col items-center justify-center flex-1",
                "min-w-0 px-1 py-2",
                "transition-all duration-150 ease-out",

                // Touch feedback
                "active:bg-gray-100 active:scale-95",

                // Color states
                isActive
                  ? "text-[#001B51]"
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              <div className="relative">
                <Icon className={cn(
                  "w-6 h-6",
                  isActive && "stroke-[2.5px]"
                )} />

                {/* Notification badge */}
                {badge && badge > 0 && (
                  <span className="
                    absolute -top-1 -right-1
                    min-w-[18px] h-[18px]
                    bg-[#DC2626] text-white
                    text-xs font-bold
                    rounded-full
                    flex items-center justify-center
                    px-1
                  ">
                    {badge > 99 ? '99+' : badge}
                  </span>
                )}
              </div>

              <span className={cn(
                "text-[11px] mt-1 truncate max-w-full",
                isActive ? "font-semibold" : "font-medium"
              )}>
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
```

### 2. Stack Navigation (Drill-Down)

For hierarchical navigation within a section.

```tsx
// components/mobile/StackHeader.tsx
'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft, MoreVertical } from 'lucide-react'

interface StackHeaderProps {
  title: string
  subtitle?: string
  onBack?: () => void
  actions?: React.ReactNode
}

export function StackHeader({ title, subtitle, onBack, actions }: StackHeaderProps) {
  const router = useRouter()

  const handleBack = () => {
    if (onBack) {
      onBack()
    } else {
      router.back()
    }
  }

  return (
    <header className="
      sticky top-0 z-40
      bg-white/95 backdrop-blur-sm
      border-b border-gray-100
      pt-[env(safe-area-inset-top)]
    ">
      <div className="flex items-center h-14 px-2">
        {/* Back button */}
        <button
          onClick={handleBack}
          className="
            p-3 -ml-1 mr-1
            rounded-full
            active:bg-gray-100
            transition-colors duration-150
          "
          aria-label="Go back"
        >
          <ArrowLeft className="w-6 h-6 text-[#001B51]" />
        </button>

        {/* Title area */}
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-semibold text-[#001B51] truncate">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-gray-500 truncate">
              {subtitle}
            </p>
          )}
        </div>

        {/* Actions */}
        {actions && (
          <div className="flex items-center gap-1">
            {actions}
          </div>
        )}
      </div>
    </header>
  )
}

// Usage example
<StackHeader
  title="Task Details"
  subtitle="Kitchen Renovation"
  actions={
    <button className="p-3 rounded-full active:bg-gray-100">
      <MoreVertical className="w-5 h-5 text-gray-600" />
    </button>
  }
/>
```

### 3. Floating Action Button (FAB)

For primary creation actions.

```tsx
// components/mobile/FloatingActionButton.tsx
'use client'

import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FABProps {
  onClick: () => void
  icon?: React.ElementType
  label?: string
  extended?: boolean
}

export function FloatingActionButton({
  onClick,
  icon: Icon = Plus,
  label,
  extended = false
}: FABProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        // Position above bottom nav
        "fixed z-40",
        "right-4 bottom-24",

        // Appearance
        "bg-[#001B51] text-white",
        "shadow-lg shadow-[#001B51]/30",

        // Touch feedback
        "active:scale-95 active:shadow-md",
        "transition-all duration-150 ease-out",

        // Size and shape
        extended
          ? "h-14 px-6 rounded-full flex items-center gap-2"
          : "w-14 h-14 rounded-full flex items-center justify-center"
      )}
    >
      <Icon className="w-6 h-6" />
      {extended && label && (
        <span className="font-semibold">{label}</span>
      )}
    </button>
  )
}

// Usage
<FloatingActionButton
  onClick={() => setShowCreateModal(true)}
  extended
  label="New Task"
/>
```

### 4. Segmented Control

For filtering within a view (alternative to tabs).

```tsx
// components/mobile/SegmentedControl.tsx
'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

interface Segment {
  value: string
  label: string
}

interface SegmentedControlProps {
  segments: Segment[]
  value: string
  onChange: (value: string) => void
}

export function SegmentedControl({ segments, value, onChange }: SegmentedControlProps) {
  return (
    <div className="
      flex p-1
      bg-gray-100 rounded-xl
    ">
      {segments.map((segment) => (
        <button
          key={segment.value}
          onClick={() => onChange(segment.value)}
          className={cn(
            "flex-1 py-2.5 px-4",
            "text-sm font-medium",
            "rounded-lg",
            "transition-all duration-200",

            value === segment.value
              ? "bg-white text-[#001B51] shadow-sm"
              : "text-gray-600 active:bg-gray-200"
          )}
        >
          {segment.label}
        </button>
      ))}
    </div>
  )
}

// Usage
const [filter, setFilter] = useState('all')

<SegmentedControl
  segments={[
    { value: 'all', label: 'All' },
    { value: 'pending', label: 'Pending' },
    { value: 'completed', label: 'Done' },
  ]}
  value={filter}
  onChange={setFilter}
/>
```

---

## Gesture Patterns

### 1. Pull-to-Refresh (Full Implementation)

```tsx
// components/mobile/PullToRefresh.tsx
'use client'

import { useState, useRef, useCallback } from 'react'
import { Loader2, ArrowDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PullToRefreshProps {
  children: React.ReactNode
  onRefresh: () => Promise<void>
  disabled?: boolean
}

type RefreshState = 'idle' | 'pulling' | 'ready' | 'refreshing'

export function PullToRefresh({
  children,
  onRefresh,
  disabled = false
}: PullToRefreshProps) {
  const [state, setState] = useState<RefreshState>('idle')
  const [pullDistance, setPullDistance] = useState(0)

  const containerRef = useRef<HTMLDivElement>(null)
  const startY = useRef(0)
  const currentY = useRef(0)

  const threshold = 80
  const maxPull = 120

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled || state === 'refreshing') return

    const scrollTop = containerRef.current?.scrollTop ?? 0
    if (scrollTop <= 0) {
      startY.current = e.touches[0].clientY
      setState('pulling')
    }
  }, [disabled, state])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (state !== 'pulling' && state !== 'ready') return

    currentY.current = e.touches[0].clientY
    const diff = currentY.current - startY.current

    if (diff > 0) {
      // Apply resistance curve for natural feel
      const resistance = 0.4
      const distance = Math.min(diff * resistance, maxPull)
      setPullDistance(distance)

      if (distance >= threshold) {
        setState('ready')
      } else {
        setState('pulling')
      }
    }
  }, [state])

  const handleTouchEnd = useCallback(async () => {
    if (state === 'ready') {
      setState('refreshing')
      setPullDistance(60) // Snap to loading position

      try {
        await onRefresh()
      } finally {
        setState('idle')
        setPullDistance(0)
      }
    } else {
      setState('idle')
      setPullDistance(0)
    }

    startY.current = 0
    currentY.current = 0
  }, [state, onRefresh])

  const progress = Math.min(pullDistance / threshold, 1)

  return (
    <div
      ref={containerRef}
      className="h-full overflow-y-auto overscroll-y-contain"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull indicator */}
      <div
        className={cn(
          "flex items-center justify-center",
          "overflow-hidden",
          state === 'refreshing' ? 'transition-all duration-300' : ''
        )}
        style={{ height: pullDistance }}
      >
        {state === 'refreshing' ? (
          <Loader2 className="w-6 h-6 text-[#001B51] animate-spin" />
        ) : (
          <div
            className="flex flex-col items-center"
            style={{
              opacity: progress,
              transform: `scale(${0.5 + progress * 0.5})`
            }}
          >
            <ArrowDown
              className={cn(
                "w-6 h-6 text-[#001B51] transition-transform duration-200",
                state === 'ready' && "rotate-180"
              )}
            />
            <span className="text-xs text-gray-500 mt-1">
              {state === 'ready' ? 'Release to refresh' : 'Pull to refresh'}
            </span>
          </div>
        )}
      </div>

      {children}
    </div>
  )
}
```

### 2. Swipe Actions (Left/Right)

```tsx
// components/mobile/SwipeableRow.tsx
'use client'

import { useRef, useState, useCallback } from 'react'
import { Trash2, CheckCircle, Archive } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SwipeAction {
  icon: React.ElementType
  color: string
  bgColor: string
  onAction: () => void
  label: string
}

interface SwipeableRowProps {
  children: React.ReactNode
  leftAction?: SwipeAction
  rightAction?: SwipeAction
}

export function SwipeableRow({
  children,
  leftAction,
  rightAction
}: SwipeableRowProps) {
  const [translateX, setTranslateX] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)

  const startX = useRef(0)
  const startTranslateX = useRef(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const actionWidth = 80
  const triggerThreshold = 60

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX
    startTranslateX.current = translateX
    setIsAnimating(false)
  }, [translateX])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const diff = e.touches[0].clientX - startX.current
    let newTranslate = startTranslateX.current + diff

    // Limit movement based on available actions
    const maxLeft = rightAction ? actionWidth : 0
    const maxRight = leftAction ? actionWidth : 0

    // Add resistance at edges
    if (newTranslate > maxRight) {
      newTranslate = maxRight + (newTranslate - maxRight) * 0.2
    } else if (newTranslate < -maxLeft) {
      newTranslate = -maxLeft + (newTranslate + maxLeft) * 0.2
    }

    setTranslateX(newTranslate)
  }, [leftAction, rightAction])

  const handleTouchEnd = useCallback(() => {
    setIsAnimating(true)

    // Trigger action if past threshold
    if (translateX > triggerThreshold && leftAction) {
      leftAction.onAction()
      setTranslateX(0)
    } else if (translateX < -triggerThreshold && rightAction) {
      rightAction.onAction()
      setTranslateX(0)
    } else if (Math.abs(translateX) > 20) {
      // Snap to show action button
      const snapTo = translateX > 0
        ? (leftAction ? actionWidth : 0)
        : (rightAction ? -actionWidth : 0)
      setTranslateX(snapTo)
    } else {
      setTranslateX(0)
    }
  }, [translateX, leftAction, rightAction])

  const handleClose = useCallback(() => {
    setIsAnimating(true)
    setTranslateX(0)
  }, [])

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden rounded-xl"
    >
      {/* Left action (revealed on swipe right) */}
      {leftAction && (
        <div
          className="absolute inset-y-0 left-0 flex items-center justify-center"
          style={{
            width: actionWidth,
            backgroundColor: leftAction.bgColor
          }}
        >
          <button
            onClick={() => {
              leftAction.onAction()
              handleClose()
            }}
            className="flex flex-col items-center p-2"
          >
            <leftAction.icon className={`w-6 h-6 ${leftAction.color}`} />
            <span className={`text-xs mt-1 ${leftAction.color}`}>
              {leftAction.label}
            </span>
          </button>
        </div>
      )}

      {/* Right action (revealed on swipe left) */}
      {rightAction && (
        <div
          className="absolute inset-y-0 right-0 flex items-center justify-center"
          style={{
            width: actionWidth,
            backgroundColor: rightAction.bgColor
          }}
        >
          <button
            onClick={() => {
              rightAction.onAction()
              handleClose()
            }}
            className="flex flex-col items-center p-2"
          >
            <rightAction.icon className={`w-6 h-6 ${rightAction.color}`} />
            <span className={`text-xs mt-1 ${rightAction.color}`}>
              {rightAction.label}
            </span>
          </button>
        </div>
      )}

      {/* Main content */}
      <div
        className={cn(
          "relative bg-white",
          isAnimating && "transition-transform duration-200 ease-out"
        )}
        style={{ transform: `translateX(${translateX}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>
    </div>
  )
}

// Usage
<SwipeableRow
  leftAction={{
    icon: CheckCircle,
    color: 'text-white',
    bgColor: '#059669',
    label: 'Done',
    onAction: () => markComplete(task.id)
  }}
  rightAction={{
    icon: Trash2,
    color: 'text-white',
    bgColor: '#DC2626',
    label: 'Delete',
    onAction: () => deleteTask(task.id)
  }}
>
  <TaskCard task={task} />
</SwipeableRow>
```

### 3. Long Press Menu

```tsx
// components/mobile/LongPressMenu.tsx
'use client'

import { useState, useRef, useCallback } from 'react'
import { cn } from '@/lib/utils'

interface MenuItem {
  label: string
  icon?: React.ElementType
  onClick: () => void
  destructive?: boolean
}

interface LongPressMenuProps {
  children: React.ReactNode
  items: MenuItem[]
}

export function LongPressMenu({ children, items }: LongPressMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })

  const longPressTimer = useRef<NodeJS.Timeout>()
  const touchStart = useRef({ x: 0, y: 0 })

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStart.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    }

    longPressTimer.current = setTimeout(() => {
      // Trigger haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate(50)
      }

      setPosition({
        x: touchStart.current.x,
        y: touchStart.current.y
      })
      setIsOpen(true)
    }, 500)
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const dx = Math.abs(e.touches[0].clientX - touchStart.current.x)
    const dy = Math.abs(e.touches[0].clientY - touchStart.current.y)

    // Cancel if moved too much
    if (dx > 10 || dy > 10) {
      clearTimeout(longPressTimer.current)
    }
  }, [])

  const handleTouchEnd = useCallback(() => {
    clearTimeout(longPressTimer.current)
  }, [])

  const handleItemClick = useCallback((item: MenuItem) => {
    item.onClick()
    setIsOpen(false)
  }, [])

  return (
    <>
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onContextMenu={(e) => e.preventDefault()}
      >
        {children}
      </div>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-50 bg-black/20"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu */}
          <div
            className="
              fixed z-50
              bg-white rounded-xl
              shadow-xl
              overflow-hidden
              min-w-[200px]
              animate-in zoom-in-95 fade-in duration-150
            "
            style={{
              left: position.x,
              top: position.y,
              transform: 'translate(-50%, -100%) translateY(-8px)'
            }}
          >
            {items.map((item, index) => (
              <button
                key={index}
                onClick={() => handleItemClick(item)}
                className={cn(
                  "w-full px-4 py-3",
                  "flex items-center gap-3",
                  "text-left text-base",
                  "active:bg-gray-100",
                  "transition-colors duration-150",
                  item.destructive
                    ? "text-[#DC2626]"
                    : "text-gray-900",
                  index > 0 && "border-t border-gray-100"
                )}
              >
                {item.icon && <item.icon className="w-5 h-5" />}
                {item.label}
              </button>
            ))}
          </div>
        </>
      )}
    </>
  )
}

// Usage
<LongPressMenu
  items={[
    { label: 'Edit', icon: Edit, onClick: () => handleEdit() },
    { label: 'Share', icon: Share2, onClick: () => handleShare() },
    { label: 'Delete', icon: Trash2, onClick: () => handleDelete(), destructive: true },
  ]}
>
  <TaskCard task={task} />
</LongPressMenu>
```

---

## Animation Patterns

### 1. Micro-Interactions

```tsx
// Touch feedback animations using Tailwind
// These are essential for native feel

// Button press effect
<button className="
  active:scale-[0.97]
  active:opacity-90
  transition-all duration-100
">

// Card press effect
<div className="
  active:scale-[0.99]
  active:bg-gray-50
  transition-all duration-150
">

// Icon button with ring
<button className="
  active:scale-90
  focus:ring-2 focus:ring-[#001B51]/20
  transition-all duration-100
">

// Checkbox toggle
<div className={cn(
  "w-6 h-6 rounded-md border-2 transition-all duration-200",
  checked
    ? "bg-[#001B51] border-[#001B51] scale-105"
    : "bg-white border-gray-300"
)}>
```

### 2. List Item Animations

```tsx
// Staggered list animation
'use client'

import { useEffect, useState } from 'react'

export function AnimatedList({ items, renderItem }) {
  const [visibleItems, setVisibleItems] = useState<string[]>([])

  useEffect(() => {
    items.forEach((item, index) => {
      setTimeout(() => {
        setVisibleItems(prev => [...prev, item.id])
      }, index * 50) // 50ms stagger
    })
  }, [items])

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div
          key={item.id}
          className={cn(
            "transition-all duration-300 ease-out",
            visibleItems.includes(item.id)
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-4"
          )}
        >
          {renderItem(item)}
        </div>
      ))}
    </div>
  )
}
```

### 3. Page Transitions

```tsx
// Slide transitions for stack navigation
'use client'

import { usePathname } from 'next/navigation'
import { useRef, useLayoutEffect, useState } from 'react'

type Direction = 'forward' | 'backward' | 'none'

export function SlideTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [direction, setDirection] = useState<Direction>('none')
  const [isAnimating, setIsAnimating] = useState(false)
  const pathHistory = useRef<string[]>([])

  useLayoutEffect(() => {
    const history = pathHistory.current
    const lastPath = history[history.length - 1]

    if (!lastPath) {
      pathHistory.current = [pathname]
      return
    }

    // Determine direction based on history
    const lastIndex = history.indexOf(pathname)
    if (lastIndex === history.length - 2) {
      // Going back
      setDirection('backward')
      pathHistory.current = history.slice(0, -1)
    } else {
      // Going forward
      setDirection('forward')
      pathHistory.current = [...history, pathname]
    }

    setIsAnimating(true)
    const timer = setTimeout(() => setIsAnimating(false), 300)
    return () => clearTimeout(timer)
  }, [pathname])

  const getTransformClass = () => {
    if (!isAnimating) return 'translate-x-0 opacity-100'

    if (direction === 'forward') {
      return 'animate-slide-in-right'
    } else if (direction === 'backward') {
      return 'animate-slide-in-left'
    }
    return ''
  }

  return (
    <div className={cn("transition-all duration-300", getTransformClass())}>
      {children}
    </div>
  )
}

// Add to tailwind.config.js
// animation: {
//   'slide-in-right': 'slideInRight 0.3s ease-out',
//   'slide-in-left': 'slideInLeft 0.3s ease-out',
// },
// keyframes: {
//   slideInRight: {
//     from: { transform: 'translateX(100%)', opacity: '0' },
//     to: { transform: 'translateX(0)', opacity: '1' },
//   },
//   slideInLeft: {
//     from: { transform: 'translateX(-100%)', opacity: '0' },
//     to: { transform: 'translateX(0)', opacity: '1' },
//   },
// },
```

### 4. Spring Physics for Sheets

```tsx
// Spring-like motion for bottom sheets
'use client'

// For complex spring animations, use Framer Motion
// npm install framer-motion

import { motion, useMotionValue, useTransform, animate } from 'framer-motion'

export function SpringBottomSheet({
  isOpen,
  onClose,
  children
}: {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
}) {
  const y = useMotionValue(0)

  const handleDragEnd = (_, info) => {
    if (info.velocity.y > 500 || info.point.y > window.innerHeight * 0.6) {
      onClose()
    } else {
      animate(y, 0, {
        type: 'spring',
        stiffness: 400,
        damping: 30
      })
    }
  }

  if (!isOpen) return null

  return (
    <>
      <motion.div
        className="fixed inset-0 bg-black/50 z-40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      <motion.div
        className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{
          type: 'spring',
          stiffness: 400,
          damping: 35
        }}
        drag="y"
        dragConstraints={{ top: 0 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        style={{ y }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {children}
      </motion.div>
    </>
  )
}
```

---

## Loading States

### 1. Skeleton Loaders

```tsx
// components/mobile/Skeleton.tsx
import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse bg-gray-200 rounded",
        className
      )}
    />
  )
}

// Task card skeleton
export function TaskCardSkeleton() {
  return (
    <div className="bg-white rounded-xl p-4 border-l-4 border-l-gray-200">
      <Skeleton className="h-5 w-3/4 mb-3" />
      <div className="flex gap-3">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
  )
}

// List skeleton
export function TaskListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <TaskCardSkeleton key={i} />
      ))}
    </div>
  )
}
```

### 2. Optimistic Updates

```tsx
// Optimistic UI pattern for instant feedback
'use client'

import { useState, useTransition } from 'react'
import { completeTaskAction } from '@/app/actions/tasks'

export function TaskItem({ task }) {
  const [isPending, startTransition] = useTransition()
  const [optimisticComplete, setOptimisticComplete] = useState(false)

  const handleComplete = () => {
    // Immediately show as complete
    setOptimisticComplete(true)

    startTransition(async () => {
      const result = await completeTaskAction(task.id)
      if (!result.success) {
        // Revert on failure
        setOptimisticComplete(false)
      }
    })
  }

  const isComplete = optimisticComplete || task.status === 'completed'

  return (
    <div className={cn(
      "p-4 rounded-xl transition-all duration-300",
      isComplete && "opacity-60",
      isPending && "pointer-events-none"
    )}>
      <button onClick={handleComplete}>
        <CheckCircle className={cn(
          "w-6 h-6 transition-colors",
          isComplete ? "text-[#059669]" : "text-gray-300"
        )} />
      </button>
      {/* ... rest of card */}
    </div>
  )
}
```

---

## Best Practices Summary

### Touch Targets

| Element | Minimum Size | Recommended |
|---------|--------------|-------------|
| Buttons | 44x44px | 48x48px |
| Icons | 44x44px hit area | Include padding |
| List items | 44px height | 56-72px |
| Form inputs | 44px height | 48-56px |

### Animation Timing

| Animation Type | Duration | Easing |
|----------------|----------|--------|
| Micro-interaction | 100-150ms | ease-out |
| Page transition | 200-300ms | ease-out |
| Modal open | 200-300ms | ease-out |
| Modal close | 150-200ms | ease-in |
| Pull-to-refresh | 300ms | spring |

### Performance Tips

1. Use `transform` and `opacity` for animations (GPU accelerated)
2. Avoid animating `width`, `height`, `top`, `left`
3. Use `will-change` sparingly for known animations
4. Keep 60fps - test on real devices
5. Use `passive: true` for scroll/touch listeners
