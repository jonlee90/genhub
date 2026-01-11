# GenHub - Design System

> Core design principles, colors, and typography.

---

## Design Principles

| Principle | Description |
|-----------|-------------|
| **Theme** | Construction industry - professional, trustworthy, industrial |
| **Mobile-First** | Optimized for field workers on job sites |
| **Touch-Friendly** | 44px minimum tap targets |
| **Accessibility** | WCAG 2.1 AA compliant |
| **Minimal** | Clean, professional, no decoration |

---

## Color System

### Primary Colors
```css
--construction-blue: #001B51;           /* Primary brand - Navy */
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

### Usage Examples
```tsx
// Primary button
<Button className="bg-construction-blue hover:bg-construction-blue/90">
  Save
</Button>

// Status badge
<Badge className="bg-construction-green text-white">On Track</Badge>

// Accent border
<Card className="border-l-4 border-l-construction-blue">...</Card>
```

### Tailwind Config
```js
// tailwind.config.js
colors: {
  'construction-blue': '#001B51',
  'construction-accent': '#3C3C3C',
  'construction-green': '#059669',
  'construction-red': '#DC2626',
  'construction-yellow': '#FBBF24',
}
```

---

## Typography

| Element | Size | Weight | Class |
|---------|------|--------|-------|
| H1 | 2rem (32px) | Bold (700) | `text-3xl font-bold` |
| H2 | 1.5rem (24px) | Semibold (600) | `text-2xl font-semibold` |
| H3 | 1.25rem (20px) | Semibold (600) | `text-xl font-semibold` |
| Body | 1rem (16px) | Normal (400) | `text-base` |
| Small | 0.875rem (14px) | Normal (400) | `text-sm` |
| Caption | 0.75rem (12px) | Normal (400) | `text-xs` |

### Industrial Headers (Page Titles)
```tsx
<h1 className="text-3xl md:text-5xl font-black tracking-tighter text-construction-blue uppercase">
  PAGE TITLE
</h1>
```

### Font Stack
```css
font-family: Arial, Helvetica, sans-serif;
```

**DO NOT use**: Custom fonts, Work Sans, IBM Plex Mono

---

## Spacing

| Size | Value | Usage |
|------|-------|-------|
| 1 | 0.25rem (4px) | Tight spacing |
| 2 | 0.5rem (8px) | Small gaps |
| 3 | 0.75rem (12px) | Card padding (mobile) |
| 4 | 1rem (16px) | Default padding |
| 6 | 1.5rem (24px) | Section spacing |
| 8 | 2rem (32px) | Large padding |

### Responsive Spacing
```tsx
// Page container
<div className="p-4 md:p-6 lg:p-8">

// Section spacing
<div className="space-y-4 md:space-y-6">

// Card padding
<CardContent className="p-4 md:p-6">
```

---

## Shadows

```tsx
// Standard card shadow
className="shadow-construction"  // Custom shadow in Tailwind config

// Hover state
className="hover:shadow-md transition-shadow"
```

---

## Border Radius

| Size | Value | Usage |
|------|-------|-------|
| sm | 0.125rem | Small elements |
| default | 0.25rem | Buttons, inputs |
| md | 0.375rem | Cards |
| lg | 0.5rem | Modals |
| full | 9999px | Badges, avatars |

---

## Forbidden Patterns

**DO NOT use:**
- Riveted borders
- Diagonal hazard stripes
- Heavy gradient decorations
- Decorative frames
- Custom fonts
- Gratuitous animations
- Excessive shadows

---

## Task Status & Priority System

### Task Status Configuration
```tsx
const TASK_STATUS_CONFIG = {
  todo: { label: 'To Do', solidColor: 'bg-gray-500 text-white' },
  in_progress: { label: 'In Progress', solidColor: 'bg-blue-600 text-white' },
  review: { label: 'Review', solidColor: 'bg-yellow-500 text-white' },
  blocked: { label: 'Blocked', solidColor: 'bg-red-600 text-white' },
  completed: { label: 'Completed', solidColor: 'bg-green-600 text-white' },
};
```

### Task Priority Configuration
```tsx
const TASK_PRIORITY_CONFIG = {
  low: { label: 'Low', badgeColor: 'bg-gray-100 text-gray-600' },
  medium: { label: 'Medium', badgeColor: 'bg-blue-100 text-blue-700' },
  high: { label: 'High', badgeColor: 'bg-orange-100 text-orange-700' },
  critical: { label: 'Critical', badgeColor: 'bg-red-100 text-red-700' },
};
```

### Task Type Badges (Industrial Theme)
```tsx
const TASK_TYPE_CONFIG = {
  work: {
    label: 'Work',
    icon: Hammer,
    color: 'bg-construction-blue text-white',
    description: 'Labor/Work Task',
  },
  purchase: {
    label: 'Purchase',
    icon: ShoppingCart,
    color: 'bg-[#059669] text-white',
    description: 'Material Purchase',
  },
  approval: {
    label: 'Approval',
    icon: ClipboardCheck,
    color: 'bg-[#FFB627] text-white',
    description: 'Permit/Inspection',
  },
  admin: {
    label: 'Admin',
    icon: FileText,
    color: 'bg-construction-accent text-white',
    description: 'Administrative Task',
  },
};

// Usage
<div className={cn(
  'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md shadow-sm border-2',
  taskTypeConfig.color,
  'border-black/10'
)}>
  <TaskTypeIcon className="h-3 w-3 drop-shadow-sm" strokeWidth={2.5} />
  <span className="text-[10px] font-black tracking-wide uppercase">
    {taskTypeConfig.label}
  </span>
</div>
```

### Material Badge (Industrial Stamped Metal)
```tsx
// Stamped metal badge with decorative rivets
<div className="relative">
  {/* Shadow layer */}
  <div className="absolute inset-0 bg-construction-accent rounded-lg blur-sm opacity-40 translate-y-0.5" />

  {/* Main badge with rivets */}
  <div className="relative bg-gradient-to-br from-construction-accent via-construction-accent to-[#2a2a2a] border-2 border-[#2a2a2a] rounded-lg px-2.5 py-1.5 shadow-lg">
    {/* Corner rivets */}
    <div className="absolute top-0.5 left-0.5 w-1 h-1 bg-gray-400 rounded-full shadow-inner" />
    <div className="absolute top-0.5 right-0.5 w-1 h-1 bg-gray-400 rounded-full shadow-inner" />
    <div className="absolute bottom-0.5 left-0.5 w-1 h-1 bg-gray-400 rounded-full shadow-inner" />
    <div className="absolute bottom-0.5 right-0.5 w-1 h-1 bg-gray-400 rounded-full shadow-inner" />

    <div className="flex items-center gap-1.5">
      <LayersIcon className="w-3.5 h-3.5 text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]" />
      <span className="text-[10px] font-black text-white/90 tracking-wider">
        {count}
      </span>
    </div>
  </div>
</div>
```

### 3D Location Badge
```tsx
// Badge linking to spatial viewer
<a
  href={`/app/projects/${projectId}/spatial?marker=${markerId}`}
  className={cn(
    'flex items-center gap-1.5 px-2 py-1',
    'bg-gradient-to-r from-construction-blue/10 to-construction-blue/5',
    'border border-construction-blue/30',
    'rounded-md',
    'hover:bg-construction-blue/20 hover:border-construction-blue/50',
    'transition-all duration-200'
  )}
>
  <Box className="h-3 w-3 text-construction-blue" />
  <span className="text-[11px] font-black text-construction-blue">3D</span>
</a>
```

---

## Icon System

### Library: Lucide React Only

```tsx
import {
  // Navigation
  LayoutDashboard, FolderKanban, CheckSquare, Package, Receipt,

  // Construction Context
  HardHat,     // Workers/Team
  Hammer,      // Tasks/Work
  Wrench,      // Settings/Tools
  Building2,   // Projects
  Truck,       // Materials/Delivery

  // Actions
  Plus, Edit, Trash2, Search, Filter, MoreVertical,

  // Status
  AlertCircle, CheckCircle, Clock, AlertTriangle, XCircle,

  // Common
  ArrowLeft, ChevronDown, ChevronRight, X, Loader2,
} from "lucide-react";
```

### Icon Sizing
```tsx
<Icon className="w-4 h-4" />  // Small (buttons, badges)
<Icon className="w-5 h-5" />  // Default (navigation, inline)
<Icon className="w-6 h-6" />  // Large (headers, section icons)
```

### Icon Colors
```tsx
<Icon className="text-gray-500" />               // Default/muted
<Icon className="text-construction-blue" />      // Primary
<Icon className="text-construction-green" />     // Success
<Icon className="text-construction-red" />       // Error
```

---

## See Also

- Component patterns: `frontend/COMPONENTS.md`
- Page layouts: `frontend/LAYOUTS.md`
- UI Rules (full): `docs/law/UI_RULES.md`
