# Skill: Mobile PWA Design

> Native-feel mobile patterns for GenHub construction PWA

## When to Use

- Converting desktop UI to mobile-first
- Building new mobile screens with native feel
- Adding gestures, animations, or pull-to-refresh
- Optimizing PWA performance and offline support
- Creating bottom sheets, swipe actions, or mobile navigation

## Prerequisites

- GenHub design system colors (see DESIGN_SYSTEM.md)
- Mobile-first responsive patterns (see responsive.md)
- Field worker context (outdoor use, gloves, bright sun)

---

## Quick Reference

### Core Philosophy

| Principle | Implementation |
|-----------|----------------|
| **Native Feel** | 60fps animations, spring physics, no jank |
| **Touch-First** | 44px minimum tap targets, generous spacing |
| **Field-Ready** | High contrast, large text, glove-friendly |
| **Offline-First** | Optimistic UI, background sync, cached data |
| **Performance** | < 100ms interaction response, instant feedback |

### GenHub Color Tokens (Mobile)

```tsx
// Primary actions - high contrast for outdoor visibility
className="bg-[#001B51] text-white"        // Navy - primary CTA
className="bg-[#059669] text-white"        // Green - success/complete
className="bg-[#DC2626] text-white"        // Red - destructive/urgent

// Touch feedback states
className="active:bg-[#001B51]/80"         // Press state
className="active:scale-[0.98]"            // Subtle shrink on tap
```

---

## Native Navigation Patterns

### Bottom Tab Navigation

```tsx
// components/mobile/BottomNav.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, FolderKanban, CheckSquare, Package, Menu } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { href: '/projects', icon: FolderKanban, label: 'Projects' },
  { href: '/tasks', icon: CheckSquare, label: 'Tasks' },
  { href: '/materials', icon: Package, label: 'Materials' },
  { href: '/more', icon: Menu, label: 'More' },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="
      fixed bottom-0 left-0 right-0 z-50
      bg-white border-t border-gray-200
      pb-[env(safe-area-inset-bottom)]
      md:hidden
    ">
      <div className="flex justify-around items-center h-16">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center justify-center",
                "min-w-[64px] h-full px-3",
                "transition-colors duration-150",
                "active:bg-gray-100",
                isActive
                  ? "text-[#001B51]"
                  : "text-gray-500"
              )}
            >
              <Icon className={cn(
                "w-6 h-6 mb-1",
                isActive && "stroke-[2.5px]"
              )} />
              <span className={cn(
                "text-xs",
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

### Page Layout with Bottom Nav

```tsx
// app/(mobile)/layout.tsx
import { BottomNav } from '@/components/mobile/BottomNav'

export default function MobileLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] bg-gray-50">
      <main className="pb-20"> {/* Space for bottom nav */}
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
```

---

## Touch Interaction Patterns

### Touch-Optimized Button

```tsx
// Primary mobile button with feedback
<button className="
  w-full h-14 px-6
  bg-[#001B51] text-white
  font-semibold text-base
  rounded-xl
  flex items-center justify-center gap-2

  /* Touch feedback */
  active:scale-[0.98]
  active:bg-[#001B51]/90

  /* Smooth transitions */
  transition-all duration-150

  /* Disabled state */
  disabled:opacity-50 disabled:pointer-events-none
">
  <Plus className="w-5 h-5" />
  Add Task
</button>
```

### Swipeable List Item

```tsx
// components/mobile/SwipeableItem.tsx
'use client'

import { useState, useRef } from 'react'
import { Trash2, Check } from 'lucide-react'

interface SwipeableItemProps {
  children: React.ReactNode
  onSwipeLeft?: () => void   // Delete action
  onSwipeRight?: () => void  // Complete action
}

export function SwipeableItem({ children, onSwipeLeft, onSwipeRight }: SwipeableItemProps) {
  const [translateX, setTranslateX] = useState(0)
  const startX = useRef(0)
  const threshold = 80

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    const diff = e.touches[0].clientX - startX.current
    // Limit swipe distance and add resistance at edges
    const limited = Math.sign(diff) * Math.min(Math.abs(diff), 120)
    setTranslateX(limited)
  }

  const handleTouchEnd = () => {
    if (translateX > threshold && onSwipeRight) {
      onSwipeRight()
    } else if (translateX < -threshold && onSwipeLeft) {
      onSwipeLeft()
    }
    setTranslateX(0)
  }

  return (
    <div className="relative overflow-hidden rounded-xl bg-white">
      {/* Left action (swipe right to reveal) */}
      <div className="absolute inset-y-0 left-0 w-20 bg-[#059669] flex items-center justify-center">
        <Check className="w-6 h-6 text-white" />
      </div>

      {/* Right action (swipe left to reveal) */}
      <div className="absolute inset-y-0 right-0 w-20 bg-[#DC2626] flex items-center justify-center">
        <Trash2 className="w-6 h-6 text-white" />
      </div>

      {/* Main content */}
      <div
        className="relative bg-white transition-transform duration-200 ease-out"
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
```

### Pull-to-Refresh

```tsx
// components/mobile/PullToRefresh.tsx
'use client'

import { useState, useRef } from 'react'
import { Loader2 } from 'lucide-react'

interface PullToRefreshProps {
  children: React.ReactNode
  onRefresh: () => Promise<void>
}

export function PullToRefresh({ children, onRefresh }: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const startY = useRef(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const threshold = 80

  const handleTouchStart = (e: React.TouchEvent) => {
    if (containerRef.current?.scrollTop === 0) {
      startY.current = e.touches[0].clientY
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startY.current === 0 || isRefreshing) return

    const diff = e.touches[0].clientY - startY.current
    if (diff > 0) {
      // Apply resistance (pull distance is 40% of actual movement)
      setPullDistance(Math.min(diff * 0.4, 120))
    }
  }

  const handleTouchEnd = async () => {
    if (pullDistance > threshold && !isRefreshing) {
      setIsRefreshing(true)
      await onRefresh()
      setIsRefreshing(false)
    }
    setPullDistance(0)
    startY.current = 0
  }

  return (
    <div
      ref={containerRef}
      className="h-full overflow-y-auto"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull indicator */}
      <div
        className="flex items-center justify-center transition-all duration-200"
        style={{ height: isRefreshing ? 60 : pullDistance }}
      >
        {(pullDistance > 0 || isRefreshing) && (
          <Loader2
            className={`w-6 h-6 text-[#001B51] ${isRefreshing ? 'animate-spin' : ''}`}
            style={{
              transform: `rotate(${pullDistance * 3}deg)`,
              opacity: Math.min(pullDistance / threshold, 1)
            }}
          />
        )}
      </div>

      {children}
    </div>
  )
}
```

---

## Bottom Sheet Pattern

```tsx
// components/mobile/BottomSheet.tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BottomSheetProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  snapPoints?: number[] // [0.3, 0.6, 0.9] = 30%, 60%, 90% of screen
}

export function BottomSheet({
  isOpen,
  onClose,
  title,
  children,
  snapPoints = [0.5, 0.9]
}: BottomSheetProps) {
  const [currentSnap, setCurrentSnap] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const startY = useRef(0)
  const sheetRef = useRef<HTMLDivElement>(null)

  const height = snapPoints[currentSnap] * 100

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      setCurrentSnap(0)
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const handleDragStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY
    setIsDragging(true)
  }

  const handleDragEnd = (e: React.TouchEvent) => {
    const endY = e.changedTouches[0].clientY
    const diff = endY - startY.current
    setIsDragging(false)

    if (diff > 100) {
      // Dragged down significantly
      if (currentSnap === 0) {
        onClose()
      } else {
        setCurrentSnap(prev => Math.max(0, prev - 1))
      }
    } else if (diff < -100) {
      // Dragged up significantly
      setCurrentSnap(prev => Math.min(snapPoints.length - 1, prev + 1))
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50",
          "bg-white rounded-t-2xl",
          "shadow-xl",
          isDragging ? "" : "transition-all duration-300 ease-out"
        )}
        style={{
          height: `${height}vh`,
          paddingBottom: 'env(safe-area-inset-bottom)'
        }}
      >
        {/* Drag handle */}
        <div
          className="flex flex-col items-center pt-3 pb-2 cursor-grab active:cursor-grabbing"
          onTouchStart={handleDragStart}
          onTouchEnd={handleDragEnd}
        >
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-4 pb-3 border-b">
            <h2 className="text-lg font-semibold text-[#001B51]">{title}</h2>
            <button
              onClick={onClose}
              className="p-2 -mr-2 rounded-full hover:bg-gray-100 active:bg-gray-200"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {children}
        </div>
      </div>
    </>
  )
}
```

---

## Mobile Card Patterns

### Task Card (Mobile-Optimized)

```tsx
// components/mobile/TaskCard.tsx
import { cn } from '@/lib/utils'
import { Clock, MapPin, User } from 'lucide-react'

interface TaskCardProps {
  task: {
    id: string
    title: string
    status: 'pending' | 'in_progress' | 'completed'
    dueDate?: string
    location?: string
    assignee?: string
  }
  onTap?: () => void
}

const statusColors = {
  pending: 'border-l-gray-400',
  in_progress: 'border-l-[#F59E0B]',
  completed: 'border-l-[#059669]',
}

export function TaskCard({ task, onTap }: TaskCardProps) {
  return (
    <button
      onClick={onTap}
      className={cn(
        "w-full text-left",
        "bg-white rounded-xl p-4",
        "border-l-4 shadow-sm",
        "active:scale-[0.99] active:bg-gray-50",
        "transition-all duration-150",
        statusColors[task.status]
      )}
    >
      <h3 className="font-semibold text-[#001B51] text-base mb-2">
        {task.title}
      </h3>

      <div className="flex flex-wrap gap-3 text-sm text-gray-600">
        {task.dueDate && (
          <span className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {task.dueDate}
          </span>
        )}
        {task.location && (
          <span className="flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            {task.location}
          </span>
        )}
        {task.assignee && (
          <span className="flex items-center gap-1">
            <User className="w-4 h-4" />
            {task.assignee}
          </span>
        )}
      </div>
    </button>
  )
}
```

### Project Card (Horizontal Scroll)

```tsx
// Horizontal scrolling project cards
<div className="
  flex gap-4 overflow-x-auto
  px-4 -mx-4
  pb-2
  snap-x snap-mandatory
  scrollbar-hide
">
  {projects.map(project => (
    <div
      key={project.id}
      className="
        flex-shrink-0 w-72
        snap-start
        bg-white rounded-xl p-4
        border border-gray-100
        shadow-sm
      "
    >
      <h3 className="font-semibold text-[#001B51]">{project.name}</h3>
      <p className="text-sm text-gray-600 mt-1">{project.address}</p>
      <div className="mt-3 flex items-center gap-2">
        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#059669] rounded-full"
            style={{ width: `${project.progress}%` }}
          />
        </div>
        <span className="text-xs font-medium text-gray-600">
          {project.progress}%
        </span>
      </div>
    </div>
  ))}
</div>
```

---

## Animation Patterns

### Page Transitions

```tsx
// Using CSS transitions for page-like feel
// components/mobile/PageTransition.tsx
'use client'

import { usePathname } from 'next/navigation'
import { useRef, useEffect, useState } from 'react'

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [isAnimating, setIsAnimating] = useState(false)
  const prevPathname = useRef(pathname)

  useEffect(() => {
    if (prevPathname.current !== pathname) {
      setIsAnimating(true)
      const timer = setTimeout(() => setIsAnimating(false), 200)
      prevPathname.current = pathname
      return () => clearTimeout(timer)
    }
  }, [pathname])

  return (
    <div
      className={`
        transition-all duration-200 ease-out
        ${isAnimating ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0'}
      `}
    >
      {children}
    </div>
  )
}
```

### Loading States

```tsx
// Skeleton loader for mobile cards
<div className="space-y-3">
  {[1, 2, 3].map(i => (
    <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
      <div className="h-5 bg-gray-200 rounded w-3/4 mb-3" />
      <div className="flex gap-3">
        <div className="h-4 bg-gray-100 rounded w-20" />
        <div className="h-4 bg-gray-100 rounded w-24" />
      </div>
    </div>
  ))}
</div>

// Inline loading spinner
<button disabled className="flex items-center justify-center gap-2 h-14 ...">
  <Loader2 className="w-5 h-5 animate-spin" />
  Saving...
</button>
```

---

## Form Patterns (Mobile)

### Mobile-Optimized Form

```tsx
<form className="space-y-4 px-4">
  {/* Large, touch-friendly inputs */}
  <div className="space-y-2">
    <label className="text-sm font-medium text-gray-700">
      Task Name
    </label>
    <input
      type="text"
      className="
        w-full h-14 px-4
        text-base /* Prevents iOS zoom */
        border border-gray-200 rounded-xl
        focus:border-[#001B51] focus:ring-1 focus:ring-[#001B51]
        placeholder:text-gray-400
      "
      placeholder="Enter task name"
    />
  </div>

  {/* Full-width select */}
  <div className="space-y-2">
    <label className="text-sm font-medium text-gray-700">
      Priority
    </label>
    <select className="
      w-full h-14 px-4
      text-base
      border border-gray-200 rounded-xl
      bg-white
      appearance-none
      bg-[url('data:image/svg+xml,...')] bg-no-repeat bg-right-4
    ">
      <option value="low">Low</option>
      <option value="medium">Medium</option>
      <option value="high">High</option>
    </select>
  </div>

  {/* Date picker - native on mobile */}
  <div className="space-y-2">
    <label className="text-sm font-medium text-gray-700">
      Due Date
    </label>
    <input
      type="date"
      className="
        w-full h-14 px-4
        text-base
        border border-gray-200 rounded-xl
      "
    />
  </div>

  {/* Submit button - sticky at bottom */}
  <div className="fixed bottom-20 left-4 right-4 pb-4 bg-gradient-to-t from-gray-50 pt-4">
    <button
      type="submit"
      className="
        w-full h-14
        bg-[#001B51] text-white
        font-semibold rounded-xl
        active:scale-[0.98] active:bg-[#001B51]/90
        transition-all duration-150
      "
    >
      Create Task
    </button>
  </div>
</form>
```

---

## Anti-Patterns

| Pattern | Problem | Fix |
|---------|---------|-----|
| Hamburger menu only | Hidden navigation | Use bottom tabs |
| Hover states | No hover on touch | Use `active:` states |
| Small tap targets | Hard to tap | 44px minimum |
| Fixed px heights | Cuts off content | Use `min-h-[100dvh]` |
| `100vh` on mobile | Address bar issues | Use `100dvh` |
| Tiny text | Hard to read outdoors | 16px minimum |
| Complex gestures | Confusing | Swipe + tap only |
| Slow animations | Feels laggy | < 200ms duration |

---

## Viewport Units

```tsx
// ALWAYS use dynamic viewport units on mobile
// This handles iOS Safari address bar correctly

// Full screen height
className="min-h-[100dvh]"  // Dynamic viewport height

// Sticky header with correct offset
className="h-[100dvh] pt-16 pb-20"  // Room for header + bottom nav

// Fixed bottom elements
<div className="
  fixed bottom-0 left-0 right-0
  pb-[env(safe-area-inset-bottom)]
">
```

---

## Checklist

### Before Shipping Mobile UI

- [ ] All tap targets 44px minimum
- [ ] Text 16px+ (no iOS zoom)
- [ ] Using `dvh` not `vh` for heights
- [ ] Safe area insets for notches
- [ ] `active:` states for all interactive elements
- [ ] 60fps animations (test on real device)
- [ ] Works offline (skeleton states)
- [ ] Pull-to-refresh if scrollable list
- [ ] Bottom nav for primary navigation
- [ ] High contrast for outdoor use

---

## References

For detailed patterns, see:

- `references/mobile-patterns.md` - Navigation, gestures, animations
- `references/pwa-optimization.md` - Service workers, caching, offline
- `references/conversion-guide.md` - Web-to-mobile conversion

---

## Affected Documentation

After mobile PWA work:
- Update `frontend/COMPONENTS.md` if new mobile components
- Test with Lighthouse PWA audit
- Run `/kc:sync-docs` to update indexes
