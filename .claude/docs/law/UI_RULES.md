# GenHub PWA - UI Design System

> **AUTHORITATIVE SOURCE** for all UI/UX decisions. All agents MUST use the `frontend-design:frontend-design` plugin for UI work.

## Table of Contents

1. [Design Philosophy](#design-philosophy)
2. [Color System](#color-system)
3. [Typography](#typography)
4. [Spacing & Layout](#spacing--layout)
   - [Standard Page Layout (REQUIRED)](#standard-page-layout-required)
   - [Section Header Pattern](#section-header-pattern)
   - [Standard Card Pattern](#standard-card-pattern)
5. [Component Library](#component-library)
6. [Icon System](#icon-system)
7. [Animation & Motion](#animation--motion)
8. [Responsive Design](#responsive-design)
9. [PWA Guidelines](#pwa-guidelines)
10. [Component Patterns](#component-patterns)
11. [Code Examples](#code-examples)

---

## Quick Reference: Page Layout Checklist

When building any `/app/*` page, ensure:

- [ ] **Blueprint Grid Background** - Fixed, 0.03 opacity, 40px grid
- [ ] **Industrial Header** - h-1 construction-blue border + UPPERCASE font-black title
- [ ] **Page Container** - `flex-1 space-y-4 md:space-y-6 p-4 md:p-8`
- [ ] **Section Headers** - Use `SectionHeader` component pattern
- [ ] **Card Styling** - `border-2 border-gray-200 shadow-construction`
- [ ] **No Heavy Decorations** - No riveted borders, hazard stripes, or custom fonts

---

## Design Philosophy

### Construction Industry Theme
GenHub is a **professional construction management PWA**. The design must convey:
- **Trust & Reliability** - Navy blue primary color
- **Industrial Strength** - Gray accents, solid borders
- **Professionalism** - Clean layouts, clear hierarchy
- **Efficiency** - Fast interactions, minimal clicks

### Key Principles
1. **Mobile-First** - Designed for field workers on job sites
2. **Accessibility** - WCAG 2.1 AA compliant
3. **Performance** - Optimized for slow connections
4. **Clarity** - Information hierarchy is paramount
5. **Touch-Friendly** - 44px minimum tap targets

---

## Color System

### Primary Colors
```css
:root {
  /* Primary - Navy Blue (Trust & Professionalism) */
  --primary: #001B51;
  --primary-hover: #00153d;

  /* Construction Theme */
  --construction-blue: #001B51;      /* Primary brand color */
  --construction-accent: #3C3C3C;    /* Dark gray - industrial */
  --construction-accent-light: #7A7A7A; /* Mid gray - softer accents */
}
```

### Semantic Colors
```css
:root {
  /* Background */
  --background: #ffffff;
  --bg-subtle: #F9FAFB;
  --bg-muted: #F3F4F6;

  /* Foreground */
  --foreground: #0A0A0A;

  /* Borders */
  --border: #E5E7EB;
  --border-hover: #D1D5DB;

  /* Status Colors */
  --construction-green: #059669;  /* Success, On Track */
  --construction-red: #DC2626;    /* Error, Delayed */
  --construction-yellow: #FBBF24; /* Warning, Caution */
  --construction-gray: #64748B;   /* Neutral, Inactive */
}
```

### Status Indicators
```css
:root {
  --status-on-track: #059669;     /* Green - Project healthy */
  --status-at-risk: #3C3C3C;      /* Dark gray - Needs attention */
  --status-delayed: #DC2626;      /* Red - Behind schedule */
  --status-completed: #001B51;    /* Navy - Finished */
}
```

### Tailwind Classes
```typescript
// tailwind.config.ts
colors: {
  construction: {
    blue: "var(--construction-blue)",
    accent: "var(--construction-accent)",
    accentLight: "var(--construction-accent-light)",
    yellow: "var(--construction-yellow)",
    green: "var(--construction-green)",
    red: "var(--construction-red)",
    gray: "var(--construction-gray)",
  },
  status: {
    onTrack: "var(--status-on-track)",
    atRisk: "var(--status-at-risk)",
    delayed: "var(--status-delayed)",
    completed: "var(--status-completed)",
  },
}
```

### Usage Examples
```tsx
// Primary button
<Button className="bg-construction-blue hover:bg-blue-700">Save</Button>

// Status badge
<Badge className="bg-status-onTrack text-white">On Track</Badge>

// Card with accent border
<Card className="border-l-4 border-l-construction-blue">...</Card>
```

---

## Typography

### Font Family
```css
body {
  font-family: Arial, Helvetica, sans-serif;
}
```

### Type Scale
| Element | Size | Weight | Line Height |
|---------|------|--------|-------------|
| H1 (Page Title) | 2rem (32px) | Bold (700) | 1.2 |
| H2 (Section) | 1.5rem (24px) | Semibold (600) | 1.3 |
| H3 (Card Title) | 1.25rem (20px) | Semibold (600) | 1.4 |
| Body | 1rem (16px) | Normal (400) | 1.5 |
| Small | 0.875rem (14px) | Normal (400) | 1.4 |
| Caption | 0.75rem (12px) | Medium (500) | 1.3 |

### Text Colors
```tsx
// Primary text
<p className="text-gray-900">Main content</p>

// Secondary text
<p className="text-gray-600">Supporting text</p>

// Muted text
<p className="text-gray-500">Captions, timestamps</p>

// Construction blue for emphasis
<p className="text-construction-blue">Important highlight</p>
```

---

## Spacing & Layout

### Spacing Scale (Tailwind)
| Token | Value | Usage |
|-------|-------|-------|
| 1 | 4px | Inline spacing |
| 2 | 8px | Icon margins |
| 3 | 12px | Small gaps |
| 4 | 16px | Card padding |
| 6 | 24px | Section spacing |
| 8 | 32px | Large gaps |
| 12 | 48px | Major sections |

### Layout Patterns

#### App Shell
```tsx
<div className="flex h-screen bg-gray-50">
  {/* Sidebar - Desktop Only */}
  <Sidebar /> {/* w-64 on desktop, hidden on mobile */}

  {/* Main Content */}
  <div className="flex flex-col flex-1 overflow-hidden">
    {/* Header - Mobile Only */}
    <Header /> {/* md:hidden */}

    {/* Page Content */}
    <main className="flex-1 overflow-y-auto">
      {children}
    </main>
  </div>
</div>
```

#### Standard Page Layout (REQUIRED)

**All app pages MUST follow this consistent layout pattern:**

```tsx
// Standard page container (Projects, Tasks, Settings, etc.)
<div className="flex-1 space-y-4 md:space-y-6 p-4 md:p-8 pt-4 md:pt-6 relative overflow-hidden">

  {/* 1. Blueprint Grid Background (fixed, low opacity) */}
  <div className="fixed inset-0 pointer-events-none opacity-[0.03]">
    <div className="absolute inset-0" style={{
      backgroundImage: `
        linear-gradient(to right, currentColor 1px, transparent 1px),
        linear-gradient(to bottom, currentColor 1px, transparent 1px)
      `,
      backgroundSize: '40px 40px',
      color: '#001B51'
    }} />
  </div>

  {/* 2. Industrial Header */}
  <div className="relative">
    {/* Construction border - h-1 construction-blue */}
    <div className="absolute top-0 left-0 right-0 h-1 bg-construction-blue" />

    <div className="flex items-start justify-between pt-2 md:pt-4 gap-3">
      {/* Title - UPPERCASE, font-black, tracking-tighter */}
      <div>
        <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-construction-blue leading-none">
          PAGE TITLE
        </h1>
        <p className="mt-2 text-sm md:text-base text-gray-500">
          Optional page description
        </p>
      </div>
      {/* Optional action button on right */}
      <Button>Action</Button>
    </div>
  </div>

  {/* 3. Page Content */}
  <div className="space-y-6">
    {/* Sections with SectionHeader pattern */}
  </div>

  {/* 4. Decorative Bottom Border (optional) */}
  <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
</div>
```

#### Section Header Pattern

**For pages with multiple sections, use consistent section headers:**

```tsx
interface SectionHeaderProps {
  icon: LucideIcon;
  title: string;
  description: string;
  disabled?: boolean; // For "coming soon" sections
}

function SectionHeader({ icon: Icon, title, description, disabled }: SectionHeaderProps) {
  return (
    <div className={cn(
      "flex items-start gap-3 md:gap-4 px-3 md:px-4 py-2 md:py-3",
      "bg-gradient-to-r from-construction-blue/5 to-transparent",
      "rounded-lg border-l-4 border-construction-blue",
      disabled && "opacity-50"
    )}>
      <div className="p-2 md:p-2.5 bg-construction-blue rounded-lg shrink-0">
        <Icon className="h-5 w-5 md:h-6 md:w-6 text-white" />
      </div>
      <div>
        <h2 className="text-xl md:text-2xl font-black text-construction-blue uppercase tracking-tight">
          {title}
        </h2>
        <p className="text-xs md:text-sm text-gray-500">{description}</p>
        {disabled && (
          <span className="text-xs text-gray-400 italic">Coming Soon</span>
        )}
      </div>
    </div>
  );
}
```

#### Standard Card Pattern

**All content cards MUST use this consistent styling:**

```tsx
<Card className="border-2 border-gray-200 shadow-construction hover:border-construction-blue/30 transition-colors">
  <CardContent className="p-4 md:p-6">
    {/* Content */}
  </CardContent>
</Card>
```

**DO NOT use:**
- Riveted border effects
- Diagonal hazard stripes
- Heavy gradient decorations
- Custom font families (Work Sans, IBM Plex Mono, etc.)

**DO use:**
- Clean, minimal backgrounds
- `shadow-construction` for elevation
- `border-2 border-gray-200` for borders
- Standard system fonts

#### Grid Layouts
```tsx
// Card grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {items.map(item => <Card key={item.id} />)}
</div>

// Dashboard widgets
<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
  <StatCard />
  <StatCard />
  <StatCard />
  <StatCard />
</div>
```

---

## Component Library

### Base UI Components (`components/ui/`)

| Component | Source | Purpose |
|-----------|--------|---------|
| `button.tsx` | shadcn/ui | Buttons with variants |
| `card.tsx` | shadcn/ui | Content containers |
| `dialog.tsx` | Radix UI | Modal dialogs |
| `dropdown-menu.tsx` | Radix UI | Context menus |
| `input.tsx` | shadcn/ui | Text inputs |
| `textarea.tsx` | shadcn/ui | Multi-line inputs |
| `select.tsx` | Radix UI | Dropdowns |
| `badge.tsx` | shadcn/ui | Status labels |
| `table.tsx` | shadcn/ui | Data tables |
| `tabs.tsx` | Radix UI | Tab navigation |
| `skeleton.tsx` | shadcn/ui | Loading placeholders |
| `avatar.tsx` | Radix UI | User avatars |
| `progress.tsx` | Radix UI | Progress bars |
| `scroll-area.tsx` | Radix UI | Scrollable areas |
| `alert-dialog.tsx` | Radix UI | Confirmation dialogs |
| `alert.tsx` | shadcn/ui | Alert banners |
| `bottom-sheet.tsx` | Custom | Mobile bottom sheet |
| `label.tsx` | shadcn/ui | Form labels |
| `CreatorBadge.tsx` | Custom | Metadata display (creator/date) |

### Aceternity UI Components (`components/ui/aceternity/`)

| Component | Purpose |
|-----------|---------|
| `sidebar.tsx` | Animated sidebar navigation |
| `tabs.tsx` | Animated tab panels |
| `stepper.tsx` | Metro Journey progress |
| `floating-navbar.tsx` | Floating header |
| `background-boxes.tsx` | Animated background |
| `hero-highlight.tsx` | Text highlights |
| `animated-tooltip.tsx` | Tooltips with animation |
| `placeholders-vanish-input.tsx` | Animated search input |
| `text-generate-effect.tsx` | Typing text animation |

### Button Variants
```tsx
import { Button } from "@/components/ui/button";

// Primary (default)
<Button>Save Changes</Button>

// Secondary
<Button variant="secondary">Cancel</Button>

// Outline
<Button variant="outline">View Details</Button>

// Destructive
<Button variant="destructive">Delete</Button>

// Ghost
<Button variant="ghost">Settings</Button>

// Link
<Button variant="link">Learn More</Button>

// Sizes
<Button size="sm">Small</Button>
<Button size="default">Default</Button>
<Button size="lg">Large</Button>
<Button size="icon"><Icon /></Button>
```

### Card Component
```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";

<Card className="border-gray-200 shadow-sm">
  <CardHeader>
    <CardTitle className="text-gray-900">Project Name</CardTitle>
    <CardDescription className="text-gray-600">Client: John Doe</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
  <CardFooter className="flex justify-between">
    <Button variant="outline">Cancel</Button>
    <Button>Save</Button>
  </CardFooter>
</Card>
```

---

## Icon System

### Lucide React Icons
```tsx
import {
  // Navigation
  LayoutDashboard, FolderKanban, CheckSquare, Package, Receipt,
  Users, FileText, BarChart3, Settings, Bell, Menu, X,

  // Construction Context
  HardHat,         // Workers, Team
  Hammer,          // Tasks, Work
  Wrench,          // Settings, Tools
  Building2,       // Projects
  Clipboard,       // Checklists
  Truck,           // Materials, Delivery
  DollarSign,      // Budget, Costs

  // Actions
  Plus, Edit, Trash2, ChevronDown, ChevronRight,
  ArrowLeft, ArrowRight, Search, Filter, MoreVertical,

  // Status
  AlertCircle, CheckCircle, Clock, AlertTriangle, XCircle,
} from "lucide-react";
```

### Icon Sizing
```tsx
// Small (in buttons, badges)
<Icon className="w-4 h-4" />

// Default (in navigation, lists)
<Icon className="w-5 h-5" />

// Large (in headers, empty states)
<Icon className="w-6 h-6" />
<Icon className="w-8 h-8" />
```

### Icon Colors
```tsx
// Match text color
<Icon className="text-gray-500" />

// Construction blue for active/primary
<Icon className="text-construction-blue" />

// Status colors
<CheckCircle className="text-construction-green" />
<AlertTriangle className="text-construction-yellow" />
<XCircle className="text-construction-red" />
```

---

## Animation & Motion

### Framer Motion
```tsx
import { motion, AnimatePresence } from "framer-motion";

// Fade in on mount
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  exit={{ opacity: 0 }}
  transition={{ duration: 0.3 }}
>

// Slide up
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: index * 0.05 }}
>

// Scale on hover
<motion.button
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
>
```

### Tailwind Animations
```css
/* Custom animations in tailwind.config.ts */
animation: {
  'fade-in': 'fadeIn 0.5s ease-out',
  'slide-up': 'slideUp 0.5s ease-out',
  'slide-in-left': 'slideInLeft 0.3s ease-out',
  'glow-pulse': 'glowPulse 2s ease-in-out infinite',
  'shimmer': 'shimmer 2s linear infinite',
  'float': 'float 3s ease-in-out infinite',
}
```

### CSS Utility Classes
```css
/* In globals.css */
.animate-pulse-construction { /* Custom pulse animation */ }
.animate-slide-in-right { /* Slide from right */ }
.animate-slide-in-up { /* Slide from bottom */ }
.card-hover { /* Card lift on hover */ }
.link-hover { /* Underline animation */ }
.skeleton-construction { /* Loading shimmer */ }
```

---

## Responsive Design

### Breakpoints
```
sm:  640px   (Mobile landscape)
md:  768px   (Tablet)
lg:  1024px  (Desktop)
xl:  1280px  (Large desktop)
2xl: 1536px  (Extra large)
```

### Mobile-First Patterns
```tsx
// Navigation: Sidebar hidden, hamburger shown
<Sidebar className="hidden md:flex" />
<MobileMenu className="md:hidden" />

// Grid: 1 column on mobile, more on larger screens
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

// Spacing: Tighter on mobile
<div className="p-4 md:p-6 lg:p-8">

// Typography: Smaller on mobile
<h1 className="text-xl md:text-2xl lg:text-3xl">
```

### Touch Optimization
```css
/* Minimum tap target size */
.touch-target {
  min-width: 44px;
  min-height: 44px;
}

/* Prevent text selection during gestures */
.no-select-mobile {
  -webkit-user-select: none;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}

/* Momentum scrolling on iOS */
.momentum-scroll {
  -webkit-overflow-scrolling: touch;
}

/* Hide scrollbar but allow scrolling */
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
```

---

## PWA Guidelines

### PWA Components
```
components/pwa/
├── ServiceWorkerRegistration.tsx  # SW updates
├── OfflineBanner.tsx              # Offline status
└── InstallPrompt.tsx              # Install prompt
```

### Offline States
```tsx
// Show offline banner at top (z-50)
<OfflineBanner />

// Cached data notice
<div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
  <AlertTriangle className="text-yellow-600" />
  <span>You're offline. Showing cached data.</span>
</div>
```

### Install Prompt
```tsx
// Bottom banner (z-40)
<InstallPrompt />
```

### Loading States
```tsx
// Skeleton loading
<Skeleton className="h-4 w-full" />
<Skeleton className="h-32 w-full" />

// Construction-themed skeleton
<div className="skeleton-construction h-20 rounded-lg" />
```

---

## Component Patterns

### Task Card
```tsx
<Card className="hover:shadow-md transition-shadow">
  <CardContent className="p-4">
    {/* Header: Title + Priority */}
    <div className="flex items-start justify-between mb-2">
      <h3 className="font-medium text-gray-900">{task.title}</h3>
      <Badge variant={priorityVariant[task.priority]}>
        {task.priority}
      </Badge>
    </div>

    {/* Description */}
    <p className="text-sm text-gray-600 line-clamp-2 mb-3">
      {task.description}
    </p>

    {/* Footer: Assignee + Due Date */}
    <div className="flex items-center justify-between text-sm">
      <div className="flex items-center gap-2">
        <Avatar className="w-6 h-6" />
        <span className="text-gray-600">{assignee.name}</span>
      </div>
      <span className="text-gray-500">{formatDate(task.due_date)}</span>
    </div>
  </CardContent>
</Card>
```

### Project Card
```tsx
<Card className="card-hover border-l-4 border-l-construction-blue">
  <CardHeader>
    <div className="flex items-center justify-between">
      <CardTitle>{project.name}</CardTitle>
      <StatusBadge status={project.status} />
    </div>
    <CardDescription>
      <Building2 className="inline w-4 h-4 mr-1" />
      {project.client_name}
    </CardDescription>
  </CardHeader>
  <CardContent>
    <Progress value={project.completion_percentage} className="mb-2" />
    <p className="text-sm text-gray-500">
      {project.completion_percentage}% Complete
    </p>
  </CardContent>
</Card>
```

### Form Layout
```tsx
<form className="space-y-6">
  {/* Form section */}
  <div className="space-y-4">
    <h3 className="text-lg font-medium text-gray-900">Project Details</h3>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="name">Project Name</Label>
        <Input id="name" placeholder="Enter project name" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="type">Project Type</Label>
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="residential">Residential</SelectItem>
            <SelectItem value="commercial_office">Commercial Office</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  </div>

  {/* Form actions */}
  <div className="flex justify-end gap-3 pt-4 border-t">
    <Button type="button" variant="outline">Cancel</Button>
    <Button type="submit">Create Project</Button>
  </div>
</form>
```

### Modal/Dialog
```tsx
<Dialog>
  <DialogTrigger asChild>
    <Button>Open Modal</Button>
  </DialogTrigger>
  <DialogContent className="sm:max-w-lg">
    <DialogHeader>
      <DialogTitle>Modal Title</DialogTitle>
      <DialogDescription>
        Describe the purpose of this modal.
      </DialogDescription>
    </DialogHeader>

    {/* Content */}
    <div className="py-4">
      {/* Form or content */}
    </div>

    <DialogFooter>
      <Button variant="outline" onClick={onClose}>Cancel</Button>
      <Button onClick={onSubmit}>Confirm</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Empty State
```tsx
<div className="flex flex-col items-center justify-center py-12 text-center">
  <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
    <FolderKanban className="w-8 h-8 text-gray-400" />
  </div>
  <h3 className="text-lg font-medium text-gray-900 mb-1">No Projects Yet</h3>
  <p className="text-sm text-gray-500 mb-4 max-w-sm">
    Get started by creating your first project. Track progress, manage tasks, and more.
  </p>
  <Button>
    <Plus className="w-4 h-4 mr-2" />
    Create Project
  </Button>
</div>
```

### Dashboard Stats Card
```tsx
// Single stat card with icon and value
<div className="relative group h-full">
  <div className="absolute inset-0 bg-gradient-to-br from-construction-blue/5 to-construction-blue/10 rounded-lg transform group-hover:scale-105 transition-transform" />
  <div className="relative bg-white border-2 border-gray-200 rounded-lg p-5 shadow-construction hover:shadow-construction-lg transition-all h-full flex flex-col justify-between">
    <div className="flex items-center justify-between mb-3">
      <div className="p-2 bg-construction-blue/10 rounded-lg border-2 border-construction-blue/20">
        <CheckSquare className="h-5 w-5 text-construction-blue" />
      </div>
      <div className="text-xs font-mono uppercase tracking-wider text-construction-blue/60">
        Total
      </div>
    </div>
    <div>
      <div className="text-4xl font-black text-construction-blue leading-none mb-1">
        {value}
      </div>
      <div className="text-sm font-bold text-gray-600">Label</div>
    </div>
  </div>
</div>
```

### Budget Overview Card
```tsx
// Multi-value card with planned/actual/variance
<div className="relative group lg:col-span-2 h-full">
  <div className="absolute inset-0 bg-gradient-to-br from-construction-blue/5 to-construction-green/5 rounded-lg" />
  <div className="relative bg-white border-2 border-gray-200 rounded-lg p-5 shadow-construction h-full flex flex-col">
    <div className="flex items-center gap-3 mb-4 pb-3 border-b-2 border-gray-100">
      <div className="p-2 bg-construction-blue/10 rounded-lg border-2 border-construction-blue/20">
        <DollarSign className="h-5 w-5 text-construction-blue" />
      </div>
      <h3 className="text-lg font-black uppercase tracking-tight text-construction-blue">
        Budget Overview
      </h3>
    </div>
    <div className="grid grid-cols-3 gap-4 flex-1 items-end">
      {/* Planned */}
      <div className="text-center lg:text-left">
        <div className="text-xs font-mono uppercase text-construction-blue/60 mb-1">Planned</div>
        <div className="text-2xl lg:text-3xl font-black text-construction-blue">{planned}</div>
      </div>
      {/* Actual */}
      <div className="text-center lg:text-left">
        <div className="text-xs font-mono uppercase text-construction-green/60 mb-1">Actual</div>
        <div className="text-2xl lg:text-3xl font-black text-construction-green">{actual}</div>
      </div>
      {/* Variance - color based on under/over budget */}
      <div className="text-center lg:text-left">
        <div className={cn("text-xs font-bold", isUnderBudget ? "text-construction-green" : "text-construction-red")}>
          {isUnderBudget ? "Under Budget" : "Over Budget"}
        </div>
        <div className={cn("text-2xl lg:text-3xl font-black", isUnderBudget ? "text-construction-green" : "text-construction-red")}>
          {isUnderBudget ? "-" : "+"}{variance}
        </div>
      </div>
    </div>
  </div>
</div>
```

### Top List Card (Projects/Team Members)
```tsx
// Card showing ranked list with progress bars
<div className="relative group">
  <div className="absolute inset-0 bg-gradient-to-br from-construction-blue/5 to-construction-blue/10 rounded-lg" />
  <div className="relative bg-white border-2 border-gray-200 rounded-lg p-6 shadow-construction">
    {/* Header */}
    <div className="flex items-center gap-3 mb-4 pb-3 border-b-2 border-construction-blue/20">
      <div className="p-2 bg-construction-blue/10 rounded-lg border-2 border-construction-blue/20">
        <Building2 className="h-5 w-5 text-construction-blue" />
      </div>
      <h3 className="text-lg font-black uppercase tracking-tight text-construction-blue">
        Top Projects by Tasks
      </h3>
    </div>
    {/* List items with staggered animation */}
    <div className="space-y-3">
      {items.map((item, index) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.08, duration: 0.4 }}
        >
          {/* Rank badge + Name + Progress bar + Value */}
        </motion.div>
      ))}
    </div>
  </div>
</div>
```

### Task Materials Manager (Tabbed Interface)
```tsx
// Tabbed interface for managing materials within task modal
<div className="space-y-4">
  {/* Tab Navigation */}
  <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-lg">
    <button
      className={cn(
        'flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-bold transition-all',
        activeTab === 'search'
          ? 'bg-white text-construction-blue shadow-sm'
          : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
      )}
    >
      <Search className="h-4 w-4" />
      Search Products
    </button>
    <button className={cn(/* ... */)}>
      <Package className="h-4 w-4" />
      Assigned
      {materials.length > 0 && (
        <Badge className="ml-1 bg-construction-blue text-white">
          {materials.length}
        </Badge>
      )}
    </button>
  </div>

  {/* Tab Content */}
  <AnimatePresence mode="wait">
    {activeTab === 'search' && <TaskMaterialSearch />}
    {activeTab === 'assigned' && <TaskMaterialsList />}
  </AnimatePresence>
</div>
```

### Material Search Card (Compact)
```tsx
// Compact product card for search results in modal
<motion.div
  initial={{ opacity: 0, y: 10 }}
  animate={{ opacity: 1, y: 0 }}
  className="flex items-start gap-3 p-3 bg-white border-2 border-gray-200 rounded-lg hover:border-construction-blue/50"
>
  {/* Product Image */}
  <div className="shrink-0 w-14 h-14 rounded-md border border-gray-200 overflow-hidden">
    <img src={product.imageUrl} className="w-full h-full object-contain" />
  </div>

  {/* Product Info */}
  <div className="flex-1 min-w-0 space-y-1">
    <h4 className="text-sm font-bold text-construction-blue line-clamp-1">{product.name}</h4>
    <div className="flex items-center gap-2">
      <span className="text-lg font-black text-construction-blue">{price}</span>
      <Badge className="text-[10px]">{stockStatus}</Badge>
    </div>
  </div>

  {/* Quantity & Add */}
  <div className="shrink-0 flex flex-col gap-2">
    <div className="flex items-center border-2 border-gray-200 rounded-md">
      <button className="p-1"><Minus className="h-3 w-3" /></button>
      <input type="number" className="w-10 h-6 text-center text-sm font-bold" />
      <button className="p-1"><Plus className="h-3 w-3" /></button>
    </div>
    <Button size="sm" className="h-7 bg-construction-blue">
      <Plus className="mr-1 h-3 w-3" />Add
    </Button>
  </div>
</motion.div>
```

### Creator Badge (Metadata Component)
```tsx
// Display who created a record and when - used in edit modals
import { CreatorBadge } from '@/components/ui/CreatorBadge';

// Default variant - subtle background, stacked layout
<CreatorBadge
  creatorName="John Smith"
  createdAt="2024-12-29T10:30:00Z"
/>

// Compact variant - inline layout for tight spaces
<CreatorBadge
  creatorName="John Smith"
  createdAt="2024-12-29T10:30:00Z"
  variant="compact"
/>

// Usage in modal footer (edit mode only)
<div className="flex justify-end gap-3 pt-4 border-t-2 border-gray-200">
  {mode === 'edit' && task?.creator && (
    <CreatorBadge
      creatorName={task.creator.name}
      createdAt={task.created_at}
    />
  )}
  <Button variant="outline">Cancel</Button>
  <Button>Save</Button>
</div>
```

### Add Member Modal
```tsx
// Modal for adding team members to project
<Dialog>
  <DialogContent className="max-w-2xl">
    <DialogHeader>
      <DialogTitle className="flex items-center gap-2">
        <UserPlus className="h-5 w-5 text-construction-blue" />
        Add Team Member
      </DialogTitle>
    </DialogHeader>

    {/* Search Input */}
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
      <Input placeholder="Search team members..." className="pl-9" />
    </div>

    {/* User List */}
    <div className="max-h-[300px] overflow-y-auto space-y-2">
      {users.map(user => (
        <div className="flex items-center gap-3 p-3 border-2 rounded-lg hover:border-construction-blue/50">
          <Avatar />
          <div className="flex-1">
            <p className="font-medium">{user.name}</p>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
          <Select placeholder="Select Role">
            <SelectItem value="project_manager">Project Manager</SelectItem>
            <SelectItem value="foreman">Foreman</SelectItem>
          </Select>
          <Button size="sm">Add</Button>
        </div>
      ))}
    </div>
  </DialogContent>
</Dialog>
```

### Chat Room List
```tsx
// Sidebar list of chat rooms with unread counts
<div className="flex flex-col h-full bg-white border-r border-gray-200">
  {/* Header */}
  <div className="flex items-center justify-between p-4 border-b">
    <h2 className="text-lg font-bold text-construction-blue">Messages</h2>
    <Button size="icon" variant="ghost">
      <MessageSquarePlus className="h-5 w-5" />
    </Button>
  </div>

  {/* Room List */}
  <ScrollArea className="flex-1">
    {rooms.map(room => (
      <button
        key={room.id}
        className={cn(
          "w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors",
          isActive && "bg-construction-blue/5 border-l-4 border-l-construction-blue"
        )}
      >
        <Avatar className="h-10 w-10" />
        <div className="flex-1 min-w-0 text-left">
          <div className="flex items-center justify-between">
            <span className="font-medium text-gray-900 truncate">{room.name}</span>
            <span className="text-xs text-gray-500">{formatTime(room.lastMessage?.created_at)}</span>
          </div>
          <p className="text-sm text-gray-600 truncate">{room.lastMessage?.content}</p>
        </div>
        {room.unread_count > 0 && (
          <Badge className="bg-construction-blue text-white">{room.unread_count}</Badge>
        )}
      </button>
    ))}
  </ScrollArea>
</div>
```

### Message Item
```tsx
// Individual chat message with reactions
<div className={cn(
  "flex gap-3 p-2 rounded-lg",
  isOwnMessage ? "flex-row-reverse" : "flex-row"
)}>
  {!isOwnMessage && <Avatar className="h-8 w-8 shrink-0" />}

  <div className={cn(
    "max-w-[70%] space-y-1",
    isOwnMessage && "items-end"
  )}>
    {/* Sender name (for others' messages) */}
    {!isOwnMessage && (
      <span className="text-xs font-medium text-gray-600">{sender.name}</span>
    )}

    {/* Message bubble */}
    <div className={cn(
      "px-4 py-2 rounded-2xl",
      isOwnMessage
        ? "bg-construction-blue text-white rounded-br-md"
        : "bg-gray-100 text-gray-900 rounded-bl-md"
    )}>
      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
    </div>

    {/* Reactions */}
    {reactions.length > 0 && (
      <div className="flex gap-1">
        {reactions.map(reaction => (
          <button className="flex items-center gap-1 px-2 py-0.5 bg-gray-100 rounded-full text-xs">
            <span>{reaction.emoji}</span>
            <span className="text-gray-600">{reaction.count}</span>
          </button>
        ))}
      </div>
    )}

    {/* Timestamp */}
    <span className="text-xs text-gray-500">{formatTime(message.created_at)}</span>
  </div>
</div>
```

### Message Input
```tsx
// Message composer with attachment support
<div className="border-t bg-white p-4">
  <div className="flex items-end gap-2">
    {/* Attachment button */}
    <Button size="icon" variant="ghost" className="shrink-0">
      <Paperclip className="h-5 w-5 text-gray-500" />
    </Button>

    {/* Input area */}
    <div className="flex-1 relative">
      <Textarea
        placeholder="Type a message..."
        className="min-h-[44px] max-h-32 resize-none pr-12"
        rows={1}
      />
      {/* Emoji picker */}
      <Button size="icon" variant="ghost" className="absolute right-2 bottom-2">
        <Smile className="h-5 w-5 text-gray-500" />
      </Button>
    </div>

    {/* Send button */}
    <Button size="icon" className="shrink-0 bg-construction-blue">
      <Send className="h-5 w-5" />
    </Button>
  </div>
</div>
```

### Progress Bar (Construction Theme)
```tsx
// Fixed progress bar with construction-themed colors
<ProgressPrimitive.Root
  className="relative h-4 w-full overflow-hidden rounded-full bg-gray-200"
>
  <ProgressPrimitive.Indicator
    className="h-full w-full flex-1 bg-construction-blue transition-all"
    style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
  />
</ProgressPrimitive.Root>

// NOTE: Use bg-gray-200 for track (not bg-secondary)
// NOTE: Use bg-construction-blue for fill (not bg-primary)
```

---

## Code Examples

### Using cn() for Conditional Classes
```tsx
import { cn } from "@/lib/utils";

<div
  className={cn(
    "rounded-lg p-4 border",
    isActive && "border-construction-blue bg-blue-50",
    isError && "border-construction-red bg-red-50",
    !isActive && !isError && "border-gray-200 bg-white"
  )}
>
```

### Status Badge Component
```tsx
function StatusBadge({ status }: { status: ProjectStatus }) {
  const variants = {
    active: "bg-status-onTrack text-white",
    on_hold: "bg-status-atRisk text-white",
    completed: "bg-status-completed text-white",
    archived: "bg-gray-500 text-white",
  };

  return (
    <Badge className={cn("text-xs font-medium", variants[status])}>
      {status.replace("_", " ")}
    </Badge>
  );
}
```

### Priority Indicator
```tsx
function PriorityBadge({ priority }: { priority: TaskPriority }) {
  const variants = {
    low: "bg-gray-100 text-gray-700",
    medium: "bg-construction-yellow/20 text-yellow-800",
    high: "bg-construction-red/10 text-construction-red",
  };

  return (
    <span className={cn(
      "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
      variants[priority]
    )}>
      {priority}
    </span>
  );
}
```

### Construction-Themed Box Shadow
```tsx
// tailwind.config.ts
boxShadow: {
  'construction': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 27, 81, 0.06)',
  'construction-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 27, 81, 0.05)',
  'glow': '0 0 15px rgba(0, 27, 81, 0.5)',
  'inner-glow': 'inset 0 0 10px rgba(0, 27, 81, 0.3)',
}

// Usage
<Card className="shadow-construction hover:shadow-construction-lg">
```

---

## CRITICAL: Using frontend-design Plugin

**ALWAYS use the `frontend-design:frontend-design` plugin for any UI work.**

This ensures:
- High-quality, construction-themed interfaces
- Consistent design language
- Production-grade code
- Avoids generic AI aesthetics

```bash
# Invoke the plugin for UI tasks
/frontend-design:frontend-design
```

### Debug Comments
Always add debug comments in UI components:
```tsx
// Debug: Task card component with construction theme
// Debug: Hover state with shadow animation
// Debug: Mobile-responsive grid layout
```

### Component File Structure
```tsx
'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckSquare, Clock } from 'lucide-react';

// Debug: Props interface
interface TaskCardProps {
  task: Task;
  onStatusChange: (status: TaskStatus) => void;
}

// Debug: Main component
export function TaskCard({ task, onStatusChange }: TaskCardProps) {
  // Debug: Local state for UI interactions
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
    >
      <Card
        className={cn(
          "transition-shadow duration-200",
          isHovered && "shadow-construction-lg"
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <CardContent className="p-4">
          {/* Debug: Task content */}
        </CardContent>
      </Card>
    </motion.div>
  );
}
```
