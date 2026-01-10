# Skill: Responsive Design

> Mobile-first responsive patterns for GenHub

## When to Use

- All new pages and components
- Fixing mobile layout issues
- Adapting desktop designs for mobile
- Field worker optimization (job site usage)

## Prerequisites

- GenHub is **mobile-first** (field workers on job sites)
- Minimum tap target: 44px

---

## Quick Reference

### Breakpoints
```
sm:  480px   Mobile landscape
md:  768px   Tablet
lg:  1024px  Desktop
xl:  1280px  Large desktop
```

### Mobile-First Pattern
```tsx
// Start with mobile, add larger breakpoints
<div className="
  p-4           // Mobile: 16px padding
  md:p-6        // Tablet: 24px padding
  lg:p-8        // Desktop: 32px padding
">
```

### Common Responsive Patterns
```tsx
// Text sizing
<h1 className="text-2xl md:text-3xl lg:text-4xl">

// Grid columns
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

// Flex direction
<div className="flex flex-col md:flex-row gap-4">

// Show/hide
<div className="hidden md:block">Desktop only</div>
<div className="md:hidden">Mobile only</div>

// Spacing
<div className="space-y-4 md:space-y-6">
```

---

## Page Layout Patterns

### Standard Page Container
```tsx
<div className="flex-1 space-y-4 md:space-y-6 p-4 md:p-6 lg:p-8">
  {/* Content */}
</div>
```

### Two-Column Layout
```tsx
<div className="flex flex-col lg:flex-row gap-6">
  {/* Main content - full width on mobile, 2/3 on desktop */}
  <div className="w-full lg:w-2/3">
    <MainContent />
  </div>

  {/* Sidebar - full width on mobile, 1/3 on desktop */}
  <div className="w-full lg:w-1/3">
    <Sidebar />
  </div>
</div>
```

### Sidebar Layout
```tsx
<div className="flex min-h-screen">
  {/* Sidebar - hidden on mobile, shown on md+ */}
  <aside className="hidden md:flex md:w-64 lg:w-72 flex-col border-r">
    <SidebarContent />
  </aside>

  {/* Mobile bottom nav */}
  <nav className="fixed bottom-0 left-0 right-0 md:hidden bg-white border-t">
    <MobileNav />
  </nav>

  {/* Main content */}
  <main className="flex-1 pb-16 md:pb-0">
    {/* pb-16 for mobile nav clearance */}
    <PageContent />
  </main>
</div>
```

---

## Component Patterns

### Card Grid
```tsx
// 1 column mobile, 2 tablet, 3 desktop
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {items.map(item => <Card key={item.id} item={item} />)}
</div>
```

### Button Groups
```tsx
// Stack on mobile, row on tablet+
<div className="flex flex-col md:flex-row gap-3">
  <Button variant="outline" className="w-full md:w-auto">
    Cancel
  </Button>
  <Button className="w-full md:w-auto bg-[#001B51]">
    Save
  </Button>
</div>
```

### Form Layout
```tsx
<form className="space-y-4">
  {/* Full width on mobile, two columns on tablet+ */}
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div className="space-y-2">
      <Label>First Name</Label>
      <Input className="h-12 md:h-10" />
    </div>
    <div className="space-y-2">
      <Label>Last Name</Label>
      <Input className="h-12 md:h-10" />
    </div>
  </div>

  {/* Full width fields */}
  <div className="space-y-2">
    <Label>Description</Label>
    <Textarea className="min-h-[100px]" />
  </div>
</form>
```

### Tables → Cards on Mobile
```tsx
// Desktop: Table
<div className="hidden md:block">
  <Table>
    <TableHeader>...</TableHeader>
    <TableBody>...</TableBody>
  </Table>
</div>

// Mobile: Cards
<div className="md:hidden space-y-3">
  {items.map(item => (
    <MobileItemCard key={item.id} item={item} />
  ))}
</div>
```

---

## Touch Optimization

### Tap Targets
```tsx
// Minimum 44px for touch targets
<button className="
  h-12             // 48px height
  min-w-[44px]     // Minimum width
  p-3              // Adequate padding
">

// Icon buttons
<Button size="icon" className="h-11 w-11">
  <Plus className="w-5 h-5" />
</Button>

// Clickable list items
<div className="p-4 -m-4">  // Extend tap area with negative margin
  <span>Click me</span>
</div>
```

### Touch-Friendly Inputs
```tsx
// Larger inputs on mobile
<Input className="
  h-12           // Mobile: 48px height
  md:h-10        // Desktop: 40px height
  text-base      // Prevent zoom on iOS (16px minimum)
" />

// Touch-friendly select
<Select>
  <SelectTrigger className="h-12 md:h-10">
    <SelectValue />
  </SelectTrigger>
</Select>
```

### Swipeable Actions (Mobile)
```tsx
// For task cards with swipe actions
<SwipeableCard
  onSwipeLeft={() => handleDelete(item.id)}
  onSwipeRight={() => handleComplete(item.id)}
  leftAction={<Trash2 className="text-red-500" />}
  rightAction={<Check className="text-green-500" />}
>
  <TaskCard task={item} />
</SwipeableCard>
```

---

## Navigation Patterns

### Header Responsive
```tsx
<header className="sticky top-0 z-50 bg-white border-b">
  <div className="flex items-center justify-between p-4">
    {/* Logo */}
    <Logo />

    {/* Desktop nav */}
    <nav className="hidden md:flex items-center gap-6">
      <NavLinks />
    </nav>

    {/* Mobile menu button */}
    <button className="md:hidden p-2" onClick={toggleMenu}>
      <Menu className="w-6 h-6" />
    </button>
  </div>

  {/* Mobile menu dropdown */}
  {isMenuOpen && (
    <div className="md:hidden border-t">
      <MobileNavLinks />
    </div>
  )}
</header>
```

### Bottom Navigation (Mobile)
```tsx
<nav className="
  fixed bottom-0 left-0 right-0
  md:hidden
  bg-white border-t
  safe-area-inset-bottom
">
  <div className="flex justify-around">
    {navItems.map(item => (
      <Link
        key={item.href}
        href={item.href}
        className="flex flex-col items-center p-3 min-w-[64px]"
      >
        <item.icon className="w-6 h-6" />
        <span className="text-xs mt-1">{item.label}</span>
      </Link>
    ))}
  </div>
</nav>
```

---

## Typography

```tsx
// Page title
<h1 className="
  text-2xl        // Mobile: 24px
  md:text-3xl     // Tablet: 30px
  lg:text-4xl     // Desktop: 36px
  font-bold
">

// Section title
<h2 className="text-lg md:text-xl font-semibold">

// Body text
<p className="text-sm md:text-base text-gray-600">

// Caption
<span className="text-xs md:text-sm text-gray-500">
```

---

## Images & Media

```tsx
// Responsive image
<div className="relative aspect-video">
  <Image
    src={src}
    alt={alt}
    fill
    className="object-cover rounded-lg"
    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
  />
</div>

// Avatar sizing
<Avatar className="w-8 h-8 md:w-10 md:h-10">
```

---

## Testing Responsive

### Viewport Sizes to Test
```
iPhone SE:     375 x 667
iPhone 14:     390 x 844
iPad:          768 x 1024
Desktop:       1280 x 800
Large:         1920 x 1080
```

### useMediaQuery Hook
```tsx
import { useMediaQuery } from '@/lib/hooks/useMediaQuery'

export function Component() {
  const isMobile = useMediaQuery('(max-width: 767px)')
  const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1023px)')
  const isDesktop = useMediaQuery('(min-width: 1024px)')

  return (
    <>
      {isMobile && <MobileView />}
      {isTablet && <TabletView />}
      {isDesktop && <DesktopView />}
    </>
  )
}
```

---

## Anti-Patterns

```tsx
// WRONG: Desktop-first (adding mobile overrides)
<div className="flex-row sm:flex-col">  // Backwards!

// CORRECT: Mobile-first
<div className="flex-col sm:flex-row">

// WRONG: Fixed widths
<div className="w-[400px]">  // Breaks on small screens!

// CORRECT: Responsive widths
<div className="w-full max-w-md">

// WRONG: Tiny tap targets
<button className="p-1">  // Too small for fingers!

// CORRECT: Touch-friendly
<button className="p-3 min-h-[44px]">

// WRONG: Text too small on mobile
<p className="text-xs">  // Hard to read!

// CORRECT: Readable text
<p className="text-sm md:text-xs">  // Larger on mobile

// WRONG: Horizontal scroll on mobile
<div className="flex gap-4">  // May overflow!

// CORRECT: Wrap or scroll intentionally
<div className="flex flex-wrap gap-4">
<div className="flex gap-4 overflow-x-auto">
```

---

## Safe Areas (iOS)

```tsx
// For fixed bottom elements on iOS
<nav className="
  fixed bottom-0 left-0 right-0
  pb-safe  // or padding-bottom: env(safe-area-inset-bottom)
">

// Tailwind config for safe areas
// tailwind.config.js
theme: {
  extend: {
    padding: {
      'safe': 'env(safe-area-inset-bottom)',
    },
  },
}
```

---

## Affected Documentation

After responsive updates:
- Test on multiple viewport sizes
- Document any device-specific behavior

---

## Checklist

- [ ] Mobile-first approach (base styles for mobile)
- [ ] Tested at 375px width minimum
- [ ] Touch targets minimum 44px
- [ ] Input text 16px+ (prevents iOS zoom)
- [ ] No horizontal scroll unintentionally
- [ ] Text readable without zooming
- [ ] Images have responsive sizes
- [ ] Safe area insets for fixed elements (iOS)
