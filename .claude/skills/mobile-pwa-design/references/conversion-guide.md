# Web-to-Mobile Conversion Guide

> Converting desktop patterns to native mobile feel for GenHub

---

## Quick Conversion Reference

| Desktop Pattern | Mobile Pattern | Notes |
|-----------------|----------------|-------|
| Data table | Card list | Swipeable cards with actions |
| Sidebar navigation | Bottom tabs | 3-5 primary destinations |
| Dropdown menu | Bottom sheet | Full-width, easier to reach |
| Modal dialog | Full-screen or bottom sheet | Context dependent |
| Hover tooltips | Long-press menu | No hover on touch |
| Right-click context | Long-press + haptic | With vibration feedback |
| Pagination | Infinite scroll | Pull-to-refresh at top |
| Multi-column layout | Single column | Stack vertically |
| Breadcrumbs | Back button + header | Stack navigation |
| Icon-only buttons | Icon + label | Clarity on mobile |

---

## Table to Card Conversion

### Before (Desktop Table)

```tsx
// Desktop table - works on md+ screens
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Task</TableHead>
      <TableHead>Status</TableHead>
      <TableHead>Due Date</TableHead>
      <TableHead>Assignee</TableHead>
      <TableHead className="w-[50px]" />
    </TableRow>
  </TableHeader>
  <TableBody>
    {tasks.map(task => (
      <TableRow key={task.id}>
        <TableCell>{task.title}</TableCell>
        <TableCell><StatusBadge status={task.status} /></TableCell>
        <TableCell>{formatDate(task.dueDate)}</TableCell>
        <TableCell>{task.assignee?.name}</TableCell>
        <TableCell>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>Edit</DropdownMenuItem>
              <DropdownMenuItem>Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

### After (Mobile Cards)

```tsx
// Mobile card list - use on screens < md
<div className="space-y-3 px-4">
  {tasks.map(task => (
    <SwipeableRow
      key={task.id}
      leftAction={{
        icon: CheckCircle,
        color: 'text-white',
        bgColor: '#059669',
        label: 'Done',
        onAction: () => completeTask(task.id)
      }}
      rightAction={{
        icon: Trash2,
        color: 'text-white',
        bgColor: '#DC2626',
        label: 'Delete',
        onAction: () => deleteTask(task.id)
      }}
    >
      <button
        onClick={() => openTaskDetail(task)}
        className="
          w-full text-left
          bg-white rounded-xl p-4
          border-l-4
          active:scale-[0.99] active:bg-gray-50
          transition-all duration-150
        "
        style={{
          borderLeftColor: statusColors[task.status]
        }}
      >
        {/* Primary info - always visible */}
        <h3 className="font-semibold text-[#001B51] text-base">
          {task.title}
        </h3>

        {/* Secondary info - horizontal scroll if needed */}
        <div className="flex items-center gap-3 mt-2 text-sm text-gray-600">
          <StatusBadge status={task.status} />

          {task.dueDate && (
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {formatRelativeDate(task.dueDate)}
            </span>
          )}

          {task.assignee && (
            <span className="flex items-center gap-1">
              <User className="w-4 h-4" />
              {task.assignee.name}
            </span>
          )}
        </div>
      </button>
    </SwipeableRow>
  ))}
</div>
```

### Responsive Implementation

```tsx
// Combined responsive component
export function TaskList({ tasks }: { tasks: Task[] }) {
  return (
    <>
      {/* Desktop: Table */}
      <div className="hidden md:block">
        <TaskTable tasks={tasks} />
      </div>

      {/* Mobile: Cards */}
      <div className="md:hidden">
        <TaskCardList tasks={tasks} />
      </div>
    </>
  )
}
```

---

## Sidebar to Bottom Nav Conversion

### Before (Desktop Sidebar)

```tsx
// Desktop sidebar - visible on lg+ screens
<aside className="hidden lg:flex flex-col w-64 border-r bg-white">
  <div className="p-4 border-b">
    <Logo />
  </div>

  <nav className="flex-1 p-4">
    <ul className="space-y-2">
      {navItems.map(item => (
        <li key={item.href}>
          <Link
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg",
              "hover:bg-gray-100 transition-colors",
              isActive && "bg-[#001B51]/10 text-[#001B51]"
            )}
          >
            <item.icon className="w-5 h-5" />
            <span>{item.label}</span>
            {item.badge && <Badge>{item.badge}</Badge>}
          </Link>
        </li>
      ))}
    </ul>
  </nav>

  <div className="p-4 border-t">
    <UserMenu />
  </div>
</aside>
```

### After (Mobile Bottom Nav)

```tsx
// Mobile bottom nav - visible on < lg screens
<nav className="
  fixed bottom-0 left-0 right-0 z-50
  bg-white border-t border-gray-200
  pb-[env(safe-area-inset-bottom)]
  lg:hidden
">
  <div className="flex justify-around h-16">
    {/* Only show 4-5 primary items */}
    {navItems.slice(0, 5).map(item => {
      const isActive = pathname.startsWith(item.href)

      return (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "flex flex-col items-center justify-center flex-1",
            "active:bg-gray-100",
            isActive ? "text-[#001B51]" : "text-gray-500"
          )}
        >
          <div className="relative">
            <item.icon className="w-6 h-6" />
            {item.badge && (
              <span className="
                absolute -top-1 -right-1
                w-4 h-4 bg-[#DC2626] text-white
                text-[10px] font-bold rounded-full
                flex items-center justify-center
              ">
                {item.badge}
              </span>
            )}
          </div>
          <span className="text-[11px] mt-1 font-medium">
            {item.label}
          </span>
        </Link>
      )
    })}
  </div>
</nav>
```

### Combined Layout

```tsx
// app/(main)/layout.tsx
export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] flex">
      {/* Desktop sidebar */}
      <DesktopSidebar />

      {/* Main content */}
      <main className="
        flex-1
        pb-20 lg:pb-0  /* Space for mobile nav */
        lg:ml-64      /* Space for desktop sidebar */
      ">
        {children}
      </main>

      {/* Mobile bottom nav */}
      <MobileBottomNav />
    </div>
  )
}
```

---

## Modal to Bottom Sheet Conversion

### Before (Desktop Modal)

```tsx
// Desktop modal - centered, fixed width
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent className="max-w-md">
    <DialogHeader>
      <DialogTitle>Add New Task</DialogTitle>
    </DialogHeader>

    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Task Name</Label>
        <Input placeholder="Enter task name" />
      </div>

      <div>
        <Label>Priority</Label>
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={() => setIsOpen(false)}>
          Cancel
        </Button>
        <Button type="submit">Create Task</Button>
      </DialogFooter>
    </form>
  </DialogContent>
</Dialog>
```

### After (Mobile Bottom Sheet)

```tsx
// Mobile bottom sheet - slides up from bottom
<BottomSheet
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Add New Task"
>
  <form onSubmit={handleSubmit} className="space-y-4">
    {/* Touch-friendly inputs */}
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700">
        Task Name
      </label>
      <input
        type="text"
        placeholder="Enter task name"
        className="
          w-full h-14 px-4
          text-base
          border border-gray-200 rounded-xl
          focus:border-[#001B51] focus:ring-1 focus:ring-[#001B51]
        "
      />
    </div>

    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700">
        Priority
      </label>
      {/* Native select on mobile for better UX */}
      <select className="
        w-full h-14 px-4
        text-base
        border border-gray-200 rounded-xl
        bg-white
      ">
        <option value="">Select priority</option>
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
      </select>
    </div>

    {/* Full-width submit button */}
    <button
      type="submit"
      className="
        w-full h-14
        bg-[#001B51] text-white
        font-semibold rounded-xl
        active:scale-[0.98]
        transition-all duration-150
        mt-6
      "
    >
      Create Task
    </button>
  </form>
</BottomSheet>
```

### Responsive Modal/Sheet

```tsx
// Use hook to detect and render appropriate component
'use client'

import { useMediaQuery } from '@/lib/hooks/useMediaQuery'
import { BaseModal } from '@/components/ui/BaseModal'
import { BottomSheet } from '@/components/mobile/BottomSheet'

interface ResponsiveModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

export function ResponsiveModal({
  isOpen,
  onClose,
  title,
  children
}: ResponsiveModalProps) {
  const isMobile = useMediaQuery('(max-width: 767px)')

  if (isMobile) {
    return (
      <BottomSheet isOpen={isOpen} onClose={onClose} title={title}>
        {children}
      </BottomSheet>
    )
  }

  return (
    <BaseModal isOpen={isOpen} onOpenChange={onClose} title={title}>
      {children}
    </BaseModal>
  )
}
```

---

## Form Conversion

### Desktop Form Patterns to Avoid on Mobile

| Desktop Pattern | Mobile Issue | Solution |
|-----------------|--------------|----------|
| Multi-column forms | Too cramped | Single column |
| Small inputs (32-36px) | Hard to tap | 48-56px height |
| Date pickers (custom) | Poor UX | Native `<input type="date">` |
| Dropdowns | Small targets | Bottom sheet or native select |
| Inline validation | Covers input | Below-input validation |
| Submit + Cancel buttons | Confusing order | Full-width primary only |

### Before (Desktop Form)

```tsx
<form className="grid grid-cols-2 gap-4">
  <div>
    <Label>First Name</Label>
    <Input className="h-9" />
  </div>
  <div>
    <Label>Last Name</Label>
    <Input className="h-9" />
  </div>
  <div className="col-span-2">
    <Label>Email</Label>
    <Input type="email" className="h-9" />
  </div>
  <div className="col-span-2 flex justify-end gap-2">
    <Button variant="outline" size="sm">Cancel</Button>
    <Button size="sm">Save</Button>
  </div>
</form>
```

### After (Mobile Form)

```tsx
<form className="space-y-4 px-4">
  {/* Single column, larger inputs */}
  <div className="space-y-2">
    <label className="text-sm font-medium text-gray-700">
      First Name
    </label>
    <input
      type="text"
      className="
        w-full h-14 px-4
        text-base  /* 16px prevents iOS zoom */
        border border-gray-200 rounded-xl
        focus:border-[#001B51] focus:ring-2 focus:ring-[#001B51]/20
        focus:outline-none
        placeholder:text-gray-400
      "
      placeholder="Enter first name"
    />
  </div>

  <div className="space-y-2">
    <label className="text-sm font-medium text-gray-700">
      Last Name
    </label>
    <input
      type="text"
      className="
        w-full h-14 px-4
        text-base
        border border-gray-200 rounded-xl
        focus:border-[#001B51] focus:ring-2 focus:ring-[#001B51]/20
        focus:outline-none
      "
      placeholder="Enter last name"
    />
  </div>

  <div className="space-y-2">
    <label className="text-sm font-medium text-gray-700">
      Email
    </label>
    <input
      type="email"
      inputMode="email"  /* Show email keyboard */
      autoCapitalize="none"
      autoCorrect="off"
      className="
        w-full h-14 px-4
        text-base
        border border-gray-200 rounded-xl
        focus:border-[#001B51] focus:ring-2 focus:ring-[#001B51]/20
        focus:outline-none
      "
      placeholder="you@example.com"
    />
  </div>

  {/* Sticky submit at bottom */}
  <div className="
    fixed bottom-20 left-0 right-0
    px-4 py-4
    bg-gradient-to-t from-white via-white to-transparent
  ">
    <button
      type="submit"
      className="
        w-full h-14
        bg-[#001B51] text-white
        font-semibold text-base
        rounded-xl
        active:scale-[0.98] active:bg-[#001B51]/90
        transition-all duration-150
        disabled:opacity-50 disabled:pointer-events-none
      "
    >
      Save Changes
    </button>
  </div>
</form>
```

### Input Types for Mobile

```tsx
// Phone number - numeric keyboard
<input
  type="tel"
  inputMode="tel"
  className="..."
/>

// Price/currency - numeric with decimal
<input
  type="text"
  inputMode="decimal"
  pattern="[0-9]*\.?[0-9]*"
  className="..."
/>

// Quantity - integer only
<input
  type="text"
  inputMode="numeric"
  pattern="[0-9]*"
  className="..."
/>

// Search - shows search button on keyboard
<input
  type="search"
  enterKeyHint="search"
  className="..."
/>

// Date - native picker
<input
  type="date"
  className="..."
/>

// Time - native picker
<input
  type="time"
  className="..."
/>
```

---

## Touch Target Conversion

### Minimum Touch Targets

```tsx
// WRONG: Too small
<button className="p-1 text-sm">
  <X className="w-3 h-3" />
</button>

// CORRECT: 44px minimum
<button className="
  p-3 -m-2  /* Extend touch area with negative margin */
  rounded-full
  active:bg-gray-100
  transition-colors
">
  <X className="w-5 h-5" />
</button>

// CORRECT: Icon button with explicit size
<button className="
  w-11 h-11
  flex items-center justify-center
  rounded-full
  active:bg-gray-100
  transition-colors
">
  <X className="w-5 h-5" />
</button>
```

### List Items

```tsx
// WRONG: Tight list items
<li className="py-1 px-2 text-sm">
  {item.name}
</li>

// CORRECT: Touch-friendly list items
<li>
  <button className="
    w-full text-left
    py-4 px-4
    flex items-center gap-3
    active:bg-gray-50
    transition-colors
  ">
    <item.icon className="w-5 h-5 text-gray-500" />
    <span className="flex-1 text-base">{item.name}</span>
    <ChevronRight className="w-5 h-5 text-gray-400" />
  </button>
</li>
```

### Checkbox/Radio

```tsx
// WRONG: Small checkbox
<input type="checkbox" className="w-4 h-4" />

// CORRECT: Touch-friendly checkbox
<label className="
  flex items-center gap-3
  py-3 px-4
  -mx-4
  active:bg-gray-50
  cursor-pointer
">
  <div className="relative">
    <input
      type="checkbox"
      className="sr-only peer"
    />
    <div className="
      w-6 h-6
      border-2 border-gray-300 rounded-md
      peer-checked:border-[#001B51] peer-checked:bg-[#001B51]
      transition-colors
    ">
      <Check className="
        w-4 h-4 text-white
        absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
        opacity-0 peer-checked:opacity-100
        transition-opacity
      " />
    </div>
  </div>
  <span className="text-base">Option label</span>
</label>
```

---

## Hover to Active State Conversion

### Button States

```tsx
// Desktop: hover states
<button className="
  bg-[#001B51] text-white
  hover:bg-[#001B51]/90
  transition-colors
">

// Mobile: active (press) states
<button className="
  bg-[#001B51] text-white
  active:bg-[#001B51]/80
  active:scale-[0.98]
  transition-all duration-150
">
```

### Card States

```tsx
// Desktop: hover effects
<div className="
  bg-white rounded-lg
  hover:shadow-md
  hover:border-[#001B51]
  transition-all
">

// Mobile: active effects
<button className="
  w-full text-left
  bg-white rounded-xl
  active:bg-gray-50
  active:scale-[0.99]
  transition-all duration-150
">
```

### Link States

```tsx
// Desktop: hover underline
<a className="text-[#001B51] hover:underline">

// Mobile: active opacity
<a className="text-[#001B51] active:opacity-70">
```

---

## Pagination to Infinite Scroll

### Before (Desktop Pagination)

```tsx
<div className="flex items-center justify-between mt-4">
  <span className="text-sm text-gray-600">
    Showing {start}-{end} of {total}
  </span>
  <div className="flex gap-2">
    <Button
      variant="outline"
      size="sm"
      disabled={page === 1}
      onClick={() => setPage(p => p - 1)}
    >
      Previous
    </Button>
    <Button
      variant="outline"
      size="sm"
      disabled={page === totalPages}
      onClick={() => setPage(p => p + 1)}
    >
      Next
    </Button>
  </div>
</div>
```

### After (Mobile Infinite Scroll)

```tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import { Loader2 } from 'lucide-react'

export function InfiniteTaskList() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [hasMore, setHasMore] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const loaderRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          loadMore()
        }
      },
      { rootMargin: '100px' }
    )

    if (loaderRef.current) {
      observer.observe(loaderRef.current)
    }

    return () => observer.disconnect()
  }, [hasMore, isLoading])

  const loadMore = async () => {
    setIsLoading(true)
    const newTasks = await fetchTasks({ offset: tasks.length, limit: 20 })
    setTasks(prev => [...prev, ...newTasks])
    setHasMore(newTasks.length === 20)
    setIsLoading(false)
  }

  return (
    <PullToRefresh onRefresh={async () => {
      const newTasks = await fetchTasks({ offset: 0, limit: 20 })
      setTasks(newTasks)
      setHasMore(newTasks.length === 20)
    }}>
      <div className="space-y-3 px-4 pb-4">
        {tasks.map(task => (
          <TaskCard key={task.id} task={task} />
        ))}

        {/* Loading indicator */}
        <div ref={loaderRef} className="py-4 flex justify-center">
          {isLoading && (
            <Loader2 className="w-6 h-6 text-[#001B51] animate-spin" />
          )}
          {!hasMore && tasks.length > 0 && (
            <span className="text-sm text-gray-500">
              No more tasks
            </span>
          )}
        </div>
      </div>
    </PullToRefresh>
  )
}
```

---

## Step-by-Step Conversion Checklist

### For Any Desktop Component

1. **Identify the interaction pattern**
   - [ ] What's the primary action?
   - [ ] What are secondary actions?
   - [ ] How is information structured?

2. **Convert navigation**
   - [ ] Sidebar → Bottom tabs (primary) or hamburger (secondary)
   - [ ] Breadcrumbs → Back button
   - [ ] Tabs → Segmented control or swipe pages

3. **Convert layout**
   - [ ] Multi-column → Single column
   - [ ] Tables → Card lists
   - [ ] Fixed widths → Full width
   - [ ] Horizontal layouts → Vertical stacks

4. **Convert interactions**
   - [ ] Hover → Active states
   - [ ] Right-click → Long-press
   - [ ] Tooltips → Inline text or bottom sheets
   - [ ] Dropdowns → Bottom sheets or native selects

5. **Optimize touch**
   - [ ] All targets 44px minimum
   - [ ] Adequate spacing between targets
   - [ ] Visual feedback on press
   - [ ] Generous padding

6. **Add mobile patterns**
   - [ ] Pull-to-refresh for lists
   - [ ] Swipe actions for list items
   - [ ] Bottom sheets for contextual content
   - [ ] Sticky headers and footers

7. **Test on device**
   - [ ] Test on real phone
   - [ ] Test with one hand
   - [ ] Test in bright light
   - [ ] Test with slow network
