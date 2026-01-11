# Responsive Design Reference

> Mobile-first responsive patterns for GenHub PWA

Last updated: 2026-01-09

---

## Breakpoints

### Tailwind Breakpoints
```
sm:  640px   - Large phones, small tablets
md:  768px   - Tablets
lg:  1024px  - Small laptops
xl:  1280px  - Desktops
2xl: 1536px  - Large screens
```

### Design Targets
| Device | Width | Primary Context |
|--------|-------|-----------------|
| Mobile | 375px | Field workers on job site |
| Tablet | 768px | Supervisors with tablets |
| Desktop | 1280px | Office/PM station |

---

## Mobile-First Approach

### Pattern
```tsx
// Start with mobile, add desktop overrides
<div className="
  p-4           // Mobile: 16px padding
  md:p-6        // Tablet: 24px padding
  lg:p-8        // Desktop: 32px padding
">
```

### Critical Mobile Requirements
```
1. Touch targets: 44px minimum
2. Font size: 16px minimum (prevents iOS zoom)
3. Tap spacing: 8px between interactive elements
4. Bottom nav: Keep primary actions within thumb reach
```

---

## Layout Patterns

### Sidebar Navigation
```tsx
// Mobile: Hidden, toggle with hamburger
// Desktop: Fixed sidebar

// AppLayout.tsx
<div className="flex min-h-screen">
  {/* Mobile overlay sidebar */}
  <div className={cn(
    "fixed inset-y-0 left-0 z-50 w-64 bg-white transform transition-transform lg:relative lg:translate-x-0",
    isSidebarOpen ? "translate-x-0" : "-translate-x-full"
  )}>
    <Sidebar />
  </div>

  {/* Mobile backdrop */}
  {isSidebarOpen && (
    <div
      className="fixed inset-0 z-40 bg-black/50 lg:hidden"
      onClick={() => setSidebarOpen(false)}
    />
  )}

  {/* Main content */}
  <main className="flex-1 lg:ml-0">
    {children}
  </main>
</div>
```

### Grid Layouts
```tsx
// Card grid: 1 col mobile → 2 col tablet → 3 col desktop
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {items.map(item => <Card key={item.id} />)}
</div>

// Dashboard widgets
<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
  <StatWidget />
  <StatWidget />
  <StatWidget />
  <StatWidget />
</div>
```

### Stack to Row
```tsx
// Mobile: vertical stack, Desktop: horizontal row
<div className="flex flex-col md:flex-row gap-4">
  <div className="md:w-1/3">Sidebar content</div>
  <div className="md:w-2/3">Main content</div>
</div>
```

---

## Component Patterns

### Tables → Cards on Mobile
```tsx
// Desktop: Table view
// Mobile: Card view

export function DataList({ items, view }: Props) {
  return (
    <>
      {/* Mobile: Cards */}
      <div className="md:hidden space-y-3">
        {items.map(item => (
          <Card key={item.id}>
            <CardHeader>{item.title}</CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-2 text-sm">
                <dt className="text-gray-500">Status</dt>
                <dd>{item.status}</dd>
                <dt className="text-gray-500">Due</dt>
                <dd>{item.dueDate}</dd>
              </dl>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Desktop: Table */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Due</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map(item => (
              <TableRow key={item.id}>
                <TableCell>{item.title}</TableCell>
                <TableCell>{item.status}</TableCell>
                <TableCell>{item.dueDate}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  )
}
```

### Modals → Full Screen on Mobile
```tsx
// BaseModal responsive behavior
<BaseModal
  isOpen={isOpen}
  onClose={onClose}
  title="Edit Task"
  className="
    w-full h-full
    md:w-[500px] md:h-auto md:max-h-[90vh]
    md:rounded-lg
  "
>
  {/* Content */}
</BaseModal>
```

### Bottom Sheets on Mobile
```tsx
// Mobile: Slide up from bottom
// Desktop: Standard modal

<div className={cn(
  "fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-xl",
  "md:inset-auto md:left-1/2 md:-translate-x-1/2 md:top-1/2 md:-translate-y-1/2",
  "md:rounded-lg md:max-w-md",
  isOpen ? "translate-y-0" : "translate-y-full md:scale-95 md:opacity-0"
)}>
```

---

## Mobile Task Patterns

### Scroll-Based Header Visibility
```tsx
// Header shows when results count element is 133px or less from viewport top
const [showHeader, setShowHeader] = useState(false);

useEffect(() => {
  const scrollContainer = pullToRefreshRef.current?.getScrollContainer();
  if (!scrollContainer) return;

  const checkResultsPosition = () => {
    const rect = resultsCountRef.current.getBoundingClientRect();
    setShowHeader(rect.top <= 133);
  };

  scrollContainer.addEventListener('scroll', checkResultsPosition, { passive: true });
  return () => scrollContainer.removeEventListener('scroll', checkResultsPosition);
}, []);

// Header transitions
<header className={cn(
  'fixed top-0 left-0 right-0 z-30',
  'bg-white/95 backdrop-blur-sm border-b border-gray-200',
  'transition-all duration-200 ease-out will-change-transform',
  showHeader
    ? 'translate-y-0 opacity-100 pointer-events-auto'
    : '-translate-y-full opacity-0 pointer-events-none'
)} />
```

### Mobile Status Tabs (Horizontal Scroll)
```tsx
<div className="overflow-x-auto scrollbar-hide">
  <div className="flex gap-2 py-3 min-w-max">
    {STATUS_TABS.map((tab) => (
      <button
        key={tab.value}
        onClick={() => setStatus(tab.value)}
        className={cn(
          'flex items-center gap-2 px-4 py-2.5 rounded-lg font-bold text-sm min-h-[44px]',
          isActive
            ? 'bg-construction-blue text-white shadow-construction-lg'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        )}
      >
        {tab.label}
        <span className={cn(
          'min-w-[20px] h-5 px-1.5 rounded-full text-xs font-black',
          isActive ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'
        )}>
          {tab.count}
        </span>
      </button>
    ))}
  </div>
</div>
```

### Mobile Kanban (Tab-Based Single Column)
```tsx
// Mobile: show one column at a time with tab navigation
<div className="md:hidden">
  {/* Sticky status tabs */}
  <div className="sticky top-0 z-20 bg-white border-b-2 border-gray-200 mb-4 -mx-4 px-4">
    <div className="overflow-x-auto scrollbar-hide">
      <div className="flex gap-2 py-3 min-w-max">
        {COLUMNS.map(column => (
          <motion.button
            key={column.id}
            onClick={() => setMobileActiveStatus(column.id)}
            className={cn(
              'relative flex items-center gap-2 px-4 py-2.5 rounded-lg font-bold text-sm min-h-[44px]',
              isActive
                ? 'bg-construction-blue text-white'
                : 'bg-gray-100 text-gray-700'
            )}
            whileTap={{ scale: 0.95 }}
          >
            {isActive && (
              <motion.div
                layoutId="mobileActiveTab"
                className="absolute inset-0 bg-construction-blue rounded-lg"
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              />
            )}
            <span className="relative z-10">{column.shortTitle}</span>
            <span className="relative z-10 px-1.5 rounded-full text-xs font-black">
              {count}
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  </div>

  {/* Single column view based on active tab */}
  {COLUMNS.map(column => (
    <motion.div
      key={column.id}
      animate={{ display: isActive ? 'block' : 'none' }}
    >
      {isActive && <KanbanColumn {...column} isMobile />}
    </motion.div>
  ))}
</div>
```

### Swipe Actions on Task Cards
```tsx
<SwipeableCard
  onSwipeRight={task.status !== 'completed' ? () => handleComplete(task) : undefined}
  onSwipeLeft={() => handleDelete(task)}
  leftActionIcon={<Check className="w-6 h-6" />}
  rightActionIcon={<Trash2 className="w-6 h-6" />}
>
  <button
    onClick={() => onTaskClick?.(task)}
    className={cn(
      'w-full text-left p-4',
      'border-l-4 border-[#001B51]',
      'active:bg-gray-50 transition-colors'
    )}
  >
    {/* Task content */}
  </button>
</SwipeableCard>
```

### Pull-to-Refresh Pattern
```tsx
<PullToRefresh
  ref={pullToRefreshRef}
  onRefresh={async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
    router.refresh();
  }}
  className="flex-1"
>
  <div className="p-4 pb-32">
    {/* Page content */}
  </div>
</PullToRefresh>
```

### Bottom Sheet for Filters
```tsx
<BottomSheet
  isOpen={showFilterSheet}
  onClose={() => setShowFilterSheet(false)}
  title="Filters"
  description="Filter tasks by project"
>
  <div className="px-5 py-4 space-y-6">
    {/* Filter options with 44px touch targets */}
    <div className="space-y-3">
      <label className="text-sm font-semibold text-gray-700">Project</label>
      <div className="space-y-2">
        {projects.map(project => (
          <button
            key={project.id}
            onClick={() => {
              setProjectFilter(project.id);
              setShowFilterSheet(false);
            }}
            className={cn(
              'w-full h-12 px-4 rounded-xl text-left font-medium transition-colors',
              selected ? 'bg-[#001B51] text-white' : 'bg-gray-100 text-gray-700'
            )}
          >
            {project.name}
          </button>
        ))}
      </div>
    </div>
  </div>
</BottomSheet>
```

---

## Touch Optimization

### Touch Targets
```tsx
// Minimum 44x44px for touch
<Button className="h-11 min-w-[44px] px-4">
  Action
</Button>

// Icon buttons
<Button size="icon" className="h-11 w-11">
  <Plus className="h-5 w-5" />
</Button>
```

### Swipe Actions
```tsx
// Use for list items on mobile
<div className="relative overflow-hidden">
  <div
    className="absolute right-0 inset-y-0 flex items-center bg-red-500 px-4"
    style={{ transform: `translateX(${100 - swipeProgress}%)` }}
  >
    <Trash className="h-5 w-5 text-white" />
  </div>
  <div
    className="relative bg-white"
    style={{ transform: `translateX(-${swipeProgress}px)` }}
  >
    {/* List item content */}
  </div>
</div>
```

### Pull to Refresh
```tsx
// For lists that need refresh
const { pullProgress, isRefreshing, handlers } = usePullToRefresh({
  onRefresh: async () => {
    await refetch()
  }
})

<div {...handlers} className="overflow-auto">
  {isRefreshing && <Loader className="animate-spin" />}
  {/* List content */}
</div>
```

---

## Navigation Patterns

### Mobile Bottom Navigation
```tsx
// Fixed bottom nav for mobile, hide on desktop
<nav className="
  fixed bottom-0 inset-x-0 z-40
  bg-white border-t
  md:hidden
">
  <div className="flex justify-around py-2">
    <NavItem href="/app" icon={Home} label="Home" />
    <NavItem href="/app/projects" icon={Folder} label="Projects" />
    <NavItem href="/app/tasks" icon={CheckSquare} label="Tasks" />
    <NavItem href="/app/chat" icon={MessageSquare} label="Chat" />
  </div>
</nav>

// Add padding to main content
<main className="pb-16 md:pb-0">
  {children}
</main>
```

### Floating Action Button
```tsx
// FAB for primary action on mobile
<Button
  className="
    fixed bottom-20 right-4 z-30
    h-14 w-14 rounded-full shadow-lg
    md:hidden
  "
  onClick={onAdd}
>
  <Plus className="h-6 w-6" />
</Button>
```

---

## Text & Typography

### Responsive Text
```tsx
// Headings scale with viewport
<h1 className="text-2xl md:text-3xl lg:text-4xl font-bold">
  Page Title
</h1>

// Body text stays readable
<p className="text-base md:text-lg leading-relaxed">
  Content text
</p>
```

### Truncation
```tsx
// Single line truncate
<p className="truncate">Long text that will be cut off...</p>

// Multi-line clamp
<p className="line-clamp-2 md:line-clamp-3">
  Long description that needs multiple lines...
</p>
```

---

## Testing Checklist

### Mobile (375px)
- [ ] All touch targets ≥ 44px
- [ ] No horizontal scroll
- [ ] Bottom nav accessible
- [ ] Forms don't zoom on focus
- [ ] Modals full-screen or bottom sheet

### Tablet (768px)
- [ ] Sidebar toggleable
- [ ] Grid layouts 2 columns
- [ ] Tables visible (not cards)
- [ ] Touch-friendly spacing

### Desktop (1280px)
- [ ] Sidebar always visible
- [ ] Grid layouts 3-4 columns
- [ ] Full table views
- [ ] Keyboard navigation works

---

## See Also

- `skills/frontend/responsive.md` - Responsive patterns skill
- `docs/frontend/DESIGN_SYSTEM.md` - Design tokens
- `docs/frontend/LAYOUTS.md` - Layout patterns
