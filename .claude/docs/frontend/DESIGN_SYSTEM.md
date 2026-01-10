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
