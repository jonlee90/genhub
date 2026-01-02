# GenHub PWA - UI Design System

> **Quick Reference** for UI/UX. Read sections as needed. **Always use `frontend-design:frontend-design` plugin for UI work.**

## Core Design Principles

- **Theme**: Construction industry (professional, trustworthy, industrial)
- **Colors**: Navy Blue (#001B51) + Dark Gray (#3C3C3C)
- **Mobile-First**: Optimized for field workers
- **Touch-Friendly**: 44px minimum tap targets
- **Accessibility**: WCAG 2.1 AA compliant

## Quick Navigation

- [Colors](#color-system) - Primary, status, semantic colors
- [Layout](#standard-page-layout) - Required page patterns
- [Components](#component-library) - UI components reference
- [Icons](#icon-system) - Lucide icons with construction context
- [Patterns](#component-patterns) - Common UI patterns
- [Responsive](#responsive-design) - Breakpoints & mobile

---

## Page Layout Checklist

**All `/app/*` pages MUST include:**

- ✅ Blueprint grid background (fixed, 0.03 opacity, 40px)
- ✅ Industrial header (h-1 blue border + UPPERCASE title)
- ✅ Page container (`flex-1 space-y-4 md:space-y-6 p-4 md:p-8`)
- ✅ Section headers (icon + title + description)
- ✅ Card styling (`border-2 border-gray-200 shadow-construction`)

**DO NOT use:** Riveted borders, hazard stripes, custom fonts

---

## Color System

### Primary Colors
```css
--construction-blue: #001B51;           /* Primary brand */
--construction-accent: #3C3C3C;         /* Dark gray */
--construction-accent-light: #7A7A7A;   /* Mid gray */
```

### Status Colors
```css
--construction-green: #059669;   /* Success, on track */
--construction-red: #DC2626;     /* Error, delayed */
--construction-yellow: #FBBF24;  /* Warning */
--construction-gray: #64748B;    /* Neutral */
```

### Usage
```tsx
<Button className="bg-construction-blue">Save</Button>
<Badge className="bg-status-onTrack text-white">On Track</Badge>
<Card className="border-l-4 border-l-construction-blue">...</Card>
```

---

## Typography

| Element | Size | Weight | Usage |
|---------|------|--------|-------|
| H1 | 2rem (32px) | Bold (700) | Page titles |
| H2 | 1.5rem (24px) | Semibold (600) | Sections |
| H3 | 1.25rem (20px) | Semibold (600) | Cards |
| Body | 1rem (16px) | Normal (400) | Content |
| Small | 0.875rem (14px) | Normal (400) | Labels |

**Font**: Arial, Helvetica, sans-serif

---

## Standard Page Layout

### Required Pattern
```tsx
<div className="flex-1 space-y-4 md:space-y-6 p-4 md:p-8 relative overflow-hidden">

  {/* 1. Blueprint Grid Background */}
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
    <div className="absolute top-0 left-0 right-0 h-1 bg-construction-blue" />
    <div className="flex items-start justify-between pt-2 md:pt-4 gap-3">
      <div>
        <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-construction-blue uppercase">
          PAGE TITLE
        </h1>
        <p className="mt-2 text-sm md:text-base text-gray-500">Description</p>
      </div>
      <Button>Action</Button>
    </div>
  </div>

  {/* 3. Page Content */}
  <div className="space-y-6">
    {/* Sections with SectionHeader pattern */}
  </div>
</div>
```

### Section Header Pattern
```tsx
<div className="flex items-start gap-3 px-3 py-2 bg-gradient-to-r from-construction-blue/5 to-transparent rounded-lg border-l-4 border-construction-blue">
  <div className="p-2 bg-construction-blue rounded-lg shrink-0">
    <Icon className="h-6 w-6 text-white" />
  </div>
  <div>
    <h2 className="text-2xl font-black text-construction-blue uppercase">SECTION TITLE</h2>
    <p className="text-sm text-gray-500">Description</p>
  </div>
</div>
```

### Standard Card Pattern
```tsx
<Card className="border-2 border-gray-200 shadow-construction hover:border-construction-blue/30 transition-colors">
  <CardContent className="p-4 md:p-6">
    {/* Content */}
  </CardContent>
</Card>
```

---

## Component Library

### Base UI Components

| Component | Source | Usage |
|-----------|--------|-------|
| `button` | shadcn/ui | Buttons with variants (default, secondary, outline, destructive, ghost) |
| `card` | shadcn/ui | Content containers |
| `BaseModal` | Custom | **ALWAYS use for modals** - Construction-themed, responsive, multi-step support |
| `input` | shadcn/ui | Text inputs |
| `select` | Radix UI | Dropdowns |
| `badge` | shadcn/ui | Status labels |
| `table` | shadcn/ui | Data tables |
| `tabs` | Radix UI | Tab navigation |
| `avatar` | Radix UI | User avatars |
| `progress` | Radix UI | Progress bars |
| `CreatorBadge` | Custom | Metadata (creator + date) |

### Button Variants
```tsx
<Button>Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="outline">Outline</Button>
<Button variant="destructive">Delete</Button>
<Button variant="ghost">Ghost</Button>
<Button size="sm">Small</Button>
<Button size="icon"><Icon /></Button>
```

---

## Icon System

### Lucide React Icons
```tsx
import {
  // Navigation
  LayoutDashboard, FolderKanban, CheckSquare, Package, Receipt,

  // Construction
  HardHat,     // Workers/Team
  Hammer,      // Tasks/Work
  Wrench,      // Settings/Tools
  Building2,   // Projects
  Truck,       // Materials

  // Actions
  Plus, Edit, Trash2, Search, Filter,

  // Status
  AlertCircle, CheckCircle, Clock, AlertTriangle, XCircle,
} from "lucide-react";
```

### Icon Sizing
```tsx
<Icon className="w-4 h-4" />  // Small (buttons, badges)
<Icon className="w-5 h-5" />  // Default (navigation)
<Icon className="w-6 h-6" />  // Large (headers)
```

### Icon Colors
```tsx
<Icon className="text-gray-500" />               // Default
<Icon className="text-construction-blue" />      // Primary
<CheckCircle className="text-construction-green" /> // Status
```

---

## Responsive Design

### Breakpoints
```
sm:  480px   (Mobile portrait)
md:  768px   (Tablet)
lg:  1024px  (Desktop)
xl:  1280px  (Large desktop)
```

### Mobile-First Patterns
```tsx
// Navigation
<Sidebar className="hidden md:flex" />
<MobileMenu className="md:hidden" />

// Grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

// Spacing
<div className="p-4 md:p-6 lg:p-8">

// Typography
<h1 className="text-xl md:text-2xl lg:text-3xl">
```

---

## Component Patterns

<details>
<summary><strong>Task Card</strong></summary>

```tsx
<Card className="hover:shadow-md transition-shadow">
  <CardContent className="p-4">
    <div className="flex items-start justify-between mb-2">
      <h3 className="font-medium">{task.title}</h3>
      <Badge variant={priorityVariant[task.priority]}>{task.priority}</Badge>
    </div>
    <p className="text-sm text-gray-600 line-clamp-2 mb-3">{task.description}</p>
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
</details>

<details>
<summary><strong>Project Card</strong></summary>

```tsx
<Card className="border-l-4 border-l-construction-blue">
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
    <p className="text-sm text-gray-500">{project.completion_percentage}% Complete</p>
  </CardContent>
</Card>
```
</details>

<details>
<summary><strong>Form Layout</strong></summary>

```tsx
<form className="space-y-6">
  <div className="space-y-4">
    <h3 className="text-lg font-medium">Section Title</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="name">Field Label</Label>
        <Input id="name" placeholder="Placeholder" />
      </div>
    </div>
  </div>

  <div className="flex justify-end gap-3 pt-4 border-t">
    <Button type="button" variant="outline">Cancel</Button>
    <Button type="submit">Save</Button>
  </div>
</form>
```
</details>

<details>
<summary><strong>Modal (BaseModal)</strong></summary>

**ALWAYS use BaseModal for modals** - Construction-themed, responsive, production-ready.

```tsx
import { BaseModal } from '@/components/ui/BaseModal';
import { Building2 } from 'lucide-react';

// Basic modal
<BaseModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  icon={Building2}
  title="Modal Title"
  subtitle="Optional subtitle"
  rightActions={
    <>
      <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
      <Button onClick={handleSubmit}>Confirm</Button>
    </>
  }
>
  <div>{/* Content */}</div>
</BaseModal>

// Multi-step modal
<BaseModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  icon={Wrench}
  title="Create Task"
  steps={['Info', 'Details', 'Review']}
  currentStep={step}
  leftActions={step > 1 && <Button onClick={() => setStep(step - 1)}>Back</Button>}
  rightActions={<Button onClick={() => setStep(step + 1)}>Next</Button>}
>
  {/* Step content */}
</BaseModal>

// Priority-themed modal
<BaseModal
  theme="high"  // 'default' | 'low' | 'medium' | 'high' | 'info' | 'success'
  icon={AlertTriangle}
  title="Critical Task"
  // ...
>

// Large modal
<BaseModal
  maxWidth="4xl"  // 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl'
  // ...
>

// Features:
// - Mobile: Bottom sheet
// - Desktop: Centered modal
// - Construction theme with gradient accent
// - Auto-responsive
// - Step indicators
// - Form auto-reset with formKey prop
```

**Quick Start**: See `components/ui/BaseModal/QUICK_START.md`
</details>

<details>
<summary><strong>Empty State</strong></summary>

```tsx
<div className="flex flex-col items-center justify-center py-12 text-center">
  <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
    <Icon className="w-8 h-8 text-gray-400" />
  </div>
  <h3 className="text-lg font-medium mb-1">No Items Yet</h3>
  <p className="text-sm text-gray-500 mb-4 max-w-sm">Description</p>
  <Button><Plus className="w-4 h-4 mr-2" />Create Item</Button>
</div>
```
</details>

<details>
<summary><strong>Dashboard Stats Card</strong></summary>

```tsx
<div className="relative group h-full">
  <div className="absolute inset-0 bg-gradient-to-br from-construction-blue/5 to-construction-blue/10 rounded-lg transform group-hover:scale-105 transition-transform" />
  <div className="relative bg-white border-2 border-gray-200 rounded-lg p-5 shadow-construction h-full flex flex-col justify-between">
    <div className="flex items-center justify-between mb-3">
      <div className="p-2 bg-construction-blue/10 rounded-lg border-2 border-construction-blue/20">
        <Icon className="h-5 w-5 text-construction-blue" />
      </div>
      <div className="text-xs font-mono uppercase text-construction-blue/60">Label</div>
    </div>
    <div>
      <div className="text-4xl font-black text-construction-blue leading-none mb-1">{value}</div>
      <div className="text-sm font-bold text-gray-600">Description</div>
    </div>
  </div>
</div>
```
</details>

<details>
<summary><strong>Creator Badge</strong></summary>

```tsx
import { CreatorBadge } from '@/components/ui/CreatorBadge';

// Default variant - subtle background, stacked
<CreatorBadge creatorName="John Smith" createdAt="2024-12-29T10:30:00Z" />

// Compact variant - inline for tight spaces
<CreatorBadge creatorName="John Smith" createdAt="2024-12-29T10:30:00Z" variant="compact" />

// In modal footer (edit mode only)
<DialogFooter>
  {mode === 'edit' && <CreatorBadge creatorName={creator.name} createdAt={created_at} />}
  <Button variant="outline">Cancel</Button>
  <Button>Save</Button>
</DialogFooter>
```
</details>

<details>
<summary><strong>Progress Bar (Construction Theme)</strong></summary>

```tsx
<ProgressPrimitive.Root className="relative h-4 w-full overflow-hidden rounded-full bg-gray-200">
  <ProgressPrimitive.Indicator
    className="h-full w-full flex-1 bg-construction-blue transition-all"
    style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
  />
</ProgressPrimitive.Root>

// NOTE: Use bg-gray-200 for track (not bg-secondary)
// NOTE: Use bg-construction-blue for fill (not bg-primary)
```
</details>

---

## Animation & Motion

### Framer Motion
```tsx
import { motion, AnimatePresence } from "framer-motion";

// Fade in
<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />

// Slide up
<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} />

// Hover scale
<motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} />
```

### Tailwind Animations
```css
animate-fade-in
animate-slide-up
animate-pulse
```

---

## Utility Patterns

### Conditional Classes
```tsx
import { cn } from "@/lib/utils";

<div className={cn(
  "base-classes",
  isActive && "border-construction-blue bg-blue-50",
  isError && "border-construction-red bg-red-50"
)} />
```

### Status Badge
```tsx
function StatusBadge({ status }: { status: ProjectStatus }) {
  const variants = {
    active: "bg-status-onTrack text-white",
    on_hold: "bg-status-atRisk text-white",
    completed: "bg-status-completed text-white",
    archived: "bg-gray-500 text-white",
  };

  return <Badge className={cn("text-xs font-medium", variants[status])}>{status}</Badge>;
}
```

### Priority Badge
```tsx
function PriorityBadge({ priority }: { priority: TaskPriority }) {
  const variants = {
    low: "bg-gray-100 text-gray-700",
    medium: "bg-construction-yellow/20 text-yellow-800",
    high: "bg-construction-red/10 text-construction-red",
  };

  return <span className={cn("inline-flex items-center px-2 py-1 rounded-full text-xs font-medium", variants[priority])}>{priority}</span>;
}
```

### Task Type Badge
```tsx
import { Hammer, ShoppingCart, ClipboardCheck, FileText } from 'lucide-react';

const TASK_TYPE_CONFIG = {
  work: { label: 'Work', icon: Hammer, color: 'bg-construction-blue text-white' },
  purchase: { label: 'Purchase', icon: ShoppingCart, color: 'bg-[#059669] text-white' },
  approval: { label: 'Approval', icon: ClipboardCheck, color: 'bg-[#FFB627] text-white' },
  admin: { label: 'Admin', icon: FileText, color: 'bg-construction-accent text-white' },
};

function TaskTypeBadge({ type }: { type: TaskType }) {
  const config = TASK_TYPE_CONFIG[type];
  const Icon = config.icon;
  return (
    <div className={cn("inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-bold", config.color)}>
      <Icon className="h-3 w-3" />
      <span>{config.label}</span>
    </div>
  );
}
```

---

## Custom Shadows

```tsx
// tailwind.config.ts
boxShadow: {
  'construction': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 27, 81, 0.06)',
  'construction-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 27, 81, 0.05)',
}

// Usage
<Card className="shadow-construction hover:shadow-construction-lg" />
```

---

## PWA Guidelines

### Components
```
components/pwa/
├── ServiceWorkerRegistration.tsx
├── OfflineBanner.tsx
└── InstallPrompt.tsx
```

### Offline States
```tsx
<OfflineBanner /> {/* z-50 */}

<div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
  <AlertTriangle className="text-yellow-600" />
  <span>You're offline. Showing cached data.</span>
</div>
```

### Loading States
```tsx
<Skeleton className="h-4 w-full" />
<div className="skeleton-construction h-20 rounded-lg" />
```

---

## CRITICAL: Frontend Design Plugin

**ALWAYS use the `frontend-design:frontend-design` plugin for UI work.**

This ensures:
- High-quality, construction-themed interfaces
- Consistent design language
- Production-grade code
- Avoids generic AI aesthetics

### Debug Comments
```tsx
// Debug: Task card with construction theme
// Debug: Hover state with shadow animation
// Debug: Mobile-responsive grid layout
```

### Component Structure
```tsx
'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

// Debug: Props interface
interface Props { /* ... */ }

// Debug: Main component
export function Component({ prop }: Props) {
  // Debug: Local state
  const [state, setState] = useState();

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Card className={cn("transition-shadow", state && "shadow-construction-lg")}>
        {/* Debug: Content */}
      </Card>
    </motion.div>
  );
}
```
