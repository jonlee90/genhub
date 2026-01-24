# Design: Owner Admin Pages Redesign

> Technical design for modernizing platform admin pages with tabbed navigation and mobile-first components

**Status**: Phase 2 - Technical Design
**Requirement**: [requirement.md](./requirement.md) - PENDING APPROVAL
**Research**: Based on UI research using `/kc:research-ui` command

---

## Architecture Overview

This is a **frontend-only** feature with no database changes. The work focuses on:

1. **Shared Layout Enhancement** - Add tabbed navigation to `owner/layout.tsx`
2. **Reusable Admin Components** - Build composable owner-specific components
3. **Page Refactoring** - Convert three pages to use new component library
4. **Mobile-First Tables** - Desktop table, mobile card views with swipe actions

```
┌─────────────────────────────────────────────────────────────────┐
│                     Owner Layout (Enhanced)                      │
│  ┌────────────────────────────────────────────────────────┐     │
│  │ Blueprint Background (shared, not per-page)            │     │
│  │ ┌────────────────────────────────────────────────────┐ │     │
│  │ │ PLATFORM ADMIN                                     │ │     │
│  │ │ [Companies] [Users] [Invites]  ← SegmentedControl  │ │     │
│  │ └────────────────────────────────────────────────────┘ │     │
│  └────────────────────────────────────────────────────────┘     │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐     │
│  │ Page Content (companies/users/invites)                 │     │
│  │ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │     │
│  │ │ KPICard  │ │ KPICard  │ │ KPICard  │ │ KPICard  │   │     │
│  │ └──────────┘ └──────────┘ └──────────┘ └──────────┘   │     │
│  │                                                        │     │
│  │ 🔍 SearchInput                                         │     │
│  │                                                        │     │
│  │ ┌────────────────────────────────────────────────────┐ │     │
│  │ │ OwnerDataTable (Desktop: table | Mobile: cards)   │ │     │
│  │ │ - Companies: CompanyCard                          │ │     │
│  │ │ - Users: UserRow/UserCard                         │ │     │
│  │ │ - Invites: InvitationCard                         │ │     │
│  │ └────────────────────────────────────────────────────┘ │     │
│  └────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
```

---

## Database Schema

**No database changes required.**

This feature is purely frontend - all data contracts remain unchanged. Existing Server Actions will continue to work:
- `getAllCompanies()` - app/actions/owner.ts
- `getAllUsers()` - app/actions/owner.ts
- `getPendingAdminInvitations()` - app/actions/owner.ts
- `inviteAdmin()` - app/actions/owner.ts
- `revokeAdminInvitation()` - app/actions/owner.ts

---

## Server Actions

**No new Server Actions required.**

All existing owner actions are sufficient for this UI redesign.

---

## Dependencies

### Existing (Already Installed)
```json
{
  "framer-motion": "^12.23.26",         // Tab transitions, card animations
  "lucide-react": "latest",             // Icons
  "class-variance-authority": "latest", // CVA for variants
  "date-fns": "latest"                  // Date formatting
}
```

### New Components to Create
No external dependencies needed - all components built with existing libraries.

---

## Component Architecture

### Component Hierarchy

```
components/owner/
├── OwnerTabs.tsx              # Tabbed navigation for layout
├── OwnerPageHeader.tsx        # Reusable page header
├── OwnerStatsGrid.tsx         # Stats grid using KPICard
├── OwnerDataTable.tsx         # Responsive table/card switcher
├── CompanyCard.tsx            # Company display card
├── UserRow.tsx                # Desktop table row
├── UserCard.tsx               # Mobile user card
└── InvitationCard.tsx         # Invitation item with swipe actions
```

---

## Component Specifications

### 1. OwnerTabs Component

**File**: `components/owner/OwnerTabs.tsx`

**Purpose**: Tabbed navigation using SegmentedControl pattern

```tsx
interface OwnerTab {
  value: 'companies' | 'users' | 'invites';
  label: string;
  href: string;
  count?: number; // Optional badge count
}

interface OwnerTabsProps {
  currentPath: string;
  stats?: {
    totalCompanies: number;
    totalUsers: number;
    pendingInvitations: number;
  };
}

// Implementation
export function OwnerTabs({ currentPath, stats }: OwnerTabsProps) {
  const tabs: OwnerTab[] = [
    { value: 'companies', label: 'Companies', href: '/app/owner/companies' },
    { value: 'users', label: 'Users', href: '/app/owner/users' },
    { value: 'invites', label: 'Invites', href: '/app/owner/invites', count: stats?.pendingInvitations },
  ];

  // Uses SegmentedControl from components/mobile/SegmentedControl.tsx
  // Active tab determined by currentPath matching href
}
```

**Features**:
- Uses existing `SegmentedControl` component
- Active route detection via `usePathname()`
- Badge count on Invites tab
- Haptic feedback on tab change
- Spring animation transitions

---

### 2. OwnerPageHeader Component

**File**: `components/owner/OwnerPageHeader.tsx`

**Purpose**: Consistent header for all owner pages

```tsx
interface OwnerPageHeaderProps {
  /** Page title (e.g., "COMPANIES") */
  title: string;

  /** Subtitle description */
  subtitle: string;

  /** Optional Lucide icon */
  icon?: LucideIcon;

  /** Optional right-side action button */
  action?: React.ReactNode;
}

// Styling
// - Industrial header style (text-3xl md:text-5xl font-black)
// - Construction-blue top border
// - "Platform Admin" label
// - No blueprint background (moved to layout)
```

**Example Usage**:
```tsx
<OwnerPageHeader
  title="COMPANIES"
  subtitle="All registered companies on GenHub"
  icon={Building2}
/>
```

---

### 3. OwnerStatsGrid Component

**File**: `components/owner/OwnerStatsGrid.tsx`

**Purpose**: Reusable stats grid using KPICard

```tsx
interface OwnerStat {
  title: string;
  value: string | number;
  icon: LucideIcon;
  variant: 'default' | 'success' | 'warning' | 'danger';
  href?: string; // Optional link
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'neutral';
  };
}

interface OwnerStatsGridProps {
  stats: OwnerStat[];
  columns?: 2 | 3 | 4; // Grid columns
  isLoading?: boolean;
}

// Implementation
export function OwnerStatsGrid({ stats, columns = 4, isLoading }: OwnerStatsGridProps) {
  if (isLoading) {
    return <OwnerStatsGridSkeleton columns={columns} />;
  }

  return (
    <div className={cn(
      "grid gap-3 md:gap-4",
      columns === 2 && "grid-cols-2",
      columns === 3 && "grid-cols-2 md:grid-cols-3",
      columns === 4 && "grid-cols-2 md:grid-cols-4"
    )}>
      {stats.map((stat) => (
        <KPICard key={stat.title} {...stat} />
      ))}
    </div>
  );
}
```

**Benefits**:
- Consistent with existing dashboard KPICard usage
- Loading skeleton support
- Responsive grid (2 cols mobile, 3/4 cols desktop)

---

### 4. OwnerDataTable Component

**File**: `components/owner/OwnerDataTable.tsx`

**Purpose**: Responsive data display (table on desktop, cards on mobile)

```tsx
interface Column<T> {
  /** Field key */
  key: keyof T | string;

  /** Column header text */
  header: string;

  /** Custom render function */
  render?: (item: T) => React.ReactNode;

  /** Hide on mobile? */
  hiddenOnMobile?: boolean;

  /** Sortable? */
  sortable?: boolean;
}

interface OwnerDataTableProps<T> {
  /** Data array */
  data: T[];

  /** Column definitions */
  columns: Column<T>[];

  /** Unique key field */
  keyField: keyof T;

  /** Empty state config */
  emptyState: {
    icon: LucideIcon;
    title: string;
    description: string;
  };

  /** Enable search? */
  searchable?: boolean;

  /** Fields to search */
  searchKeys?: (keyof T)[];

  /** Loading state */
  isLoading?: boolean;

  /** Row click handler */
  onRowClick?: (item: T) => void;

  /** Mobile card renderer */
  renderCard?: (item: T) => React.ReactNode;
}

// Implementation
// Desktop (≥768px): Traditional table with sticky header
// Mobile (<768px): Card grid using renderCard prop
// Built-in SearchInput integration
// Skeleton loading states
```

**Example Usage**:
```tsx
<OwnerDataTable
  data={users}
  columns={userColumns}
  keyField="id"
  searchable
  searchKeys={['name', 'email', 'company_name']}
  emptyState={{
    icon: Users,
    title: 'No Users Found',
    description: 'No users match your search criteria.'
  }}
  renderCard={(user) => <UserCard user={user} />}
  isLoading={isLoading}
/>
```

---

### 5. CompanyCard Component

**File**: `components/owner/CompanyCard.tsx`

**Purpose**: Mobile-optimized company display

```tsx
interface Company {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  created_at: string;
  user_count: number;
  project_count: number;
}

interface CompanyCardProps {
  company: Company;
  onClick?: () => void;
}

// Styling
// - CardSurface wrapper with interactive prop
// - Building2 icon in construction-blue circle
// - Company name as title
// - Contact info (email, phone, address) with icons
// - Stats row: user_count and project_count badges
// - "Joined X ago" timestamp
// - 44px minimum touch targets
// - Active state with scale transform
```

**Visual Layout**:
```
┌─────────────────────────────────────────┐
│ 🏢  Acme Construction                   │
│     Joined 3 months ago                 │
├─────────────────────────────────────────┤
│ 📧 admin@acme.com                       │
│ 📞 (555) 123-4567                       │
│ 📍 123 Main St, City, State             │
├─────────────────────────────────────────┤
│ 👥 12 users  •  📁 8 projects           │
└─────────────────────────────────────────┘
```

---

### 6. UserRow & UserCard Components

**File**: `components/owner/UserRow.tsx` & `components/owner/UserCard.tsx`

**Purpose**: Dual rendering for desktop table row / mobile card

```tsx
interface User {
  id: string;
  name: string | null;
  email: string;
  avatar_url: string | null;
  role: string;
  status: 'active' | 'invited' | 'inactive';
  company_name: string | null;
  created_at: string;
}

// UserRow - Table row for desktop
interface UserRowProps {
  user: User;
}

// UserCard - Card for mobile
interface UserCardProps {
  user: User;
  onClick?: () => void;
}

// Shared elements:
// - Avatar with fallback initials
// - Role badge (using ROLE_DISPLAY mapping)
// - Status indicator (Active/Invited/Inactive)
// - Company association
// - Joined date
```

**UserCard Visual Layout**:
```
┌─────────────────────────────────────────┐
│ 👤  John Smith                          │
│     📧 john@acme.com                    │
│     🏢 Acme Construction  [Admin]       │
│     ● Active  •  Joined 2 weeks ago     │
└─────────────────────────────────────────┘
```

---

### 7. InvitationCard Component

**File**: `components/owner/InvitationCard.tsx`

**Purpose**: Invitation item with swipe actions (replaces list item in OwnerInvitesClient)

```tsx
interface AdminInvitation {
  id: string;
  email: string;
  name: string | null;
  invitation_token: string;
  invited_at: string;
  expires_at: string;
}

interface InvitationCardProps {
  invitation: AdminInvitation;
  onCopyLink: (inviteLink: string) => void;
  onRevoke: (id: string, email: string) => void;
  isRevoking?: boolean;
}

// Features:
// - Uses SwipeableCard wrapper
// - Swipe right: Copy link (green action)
// - Swipe left: Revoke (red action)
// - Expiration status badge
// - Haptic feedback on swipe
// - Desktop: Show copy/revoke buttons
// - Mobile: Hidden until swipe
```

**Visual Layout**:
```
┌─────────────────────────────────────────┐
│ john@newcompany.com       [EXPIRED]     │
│ John Smith                              │
│ ⏱ Sent 5 days ago • Expires Jan 30     │
│                        [Copy] [Revoke]  │
└─────────────────────────────────────────┘

Mobile Swipe:
[Copy ←] ┌──────────────────┐ [→ Revoke]
         │  john@...        │
         └──────────────────┘
```

---

## Page Redesigns

### Companies Page (`/app/owner/companies`)

**Changes**:
1. Remove local blueprint background (moved to layout)
2. Remove local industrial header (use `OwnerPageHeader`)
3. Replace manual stat cards with `OwnerStatsGrid`
4. Wrap companies grid in `OwnerDataTable` with `CompanyCard` renderer
5. Add `SearchInput` for filtering

**Before (LOC)**: ~235 lines
**After (LOC)**: ~120 lines (46% reduction)

---

### Users Page (`/app/owner/users`)

**Changes**:
1. Remove local blueprint background
2. Remove local industrial header
3. Replace manual stat cards with `OwnerStatsGrid`
4. Replace `<table>` with `OwnerDataTable` component
5. Use `UserRow` for desktop, `UserCard` for mobile
6. Add search and role filtering

**Before (LOC)**: ~326 lines
**After (LOC)**: ~140 lines (57% reduction)

---

### Invites Page (`/app/owner/invites`)

**Changes**:
1. Remove local blueprint background
2. Remove local industrial header
3. Use `OwnerStatsGrid` for pending count
4. Refactor `OwnerInvitesClient` to use `InvitationCard` components
5. Add `SwipeableCard` wrapper for mobile swipe actions

**Before (LOC)**: ~99 (page) + ~353 (client) = 452 total
**After (LOC)**: ~80 (page) + ~180 (client) = 260 total (42% reduction)

---

### Layout Enhancement (`/app/owner/layout.tsx`)

**Changes**:
1. Add blueprint background wrapper (shared across all pages)
2. Add `OwnerTabs` component below layout boundary
3. Fetch dashboard stats for tab badges
4. Add "Platform Admin" branding section

**Before (LOC)**: ~27 lines
**After (LOC)**: ~110 lines (adds shared structure)

**Net LOC Impact**: +83 (layout) -693 (pages) = **-610 lines total**

---

## Animation Specifications

### Tab Transition
```tsx
const tabTransition = {
  type: "spring",
  stiffness: 400,
  damping: 30,
};

// Applied to SegmentedControl active indicator
```

### Card Enter Animation
```tsx
const cardVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 30
    }
  },
};

// Applied to each card in grid
```

### Staggered List Animation
```tsx
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05, // 50ms delay between cards
    },
  },
};

// Applied to card container
```

### Swipe Action Feedback
```tsx
// Uses existing SwipeableCard component
// - Haptic feedback on threshold cross
// - Scale animation on action trigger
// - 200ms snap-back ease-out
```

---

## Skeleton Loading States

### OwnerStatsGridSkeleton
```tsx
function OwnerStatsGridSkeleton({ columns = 4 }: { columns?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-{columns} gap-3 md:gap-4">
      {Array.from({ length: columns }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl" />
        </div>
      ))}
    </div>
  );
}
```

### OwnerDataTableSkeleton
```tsx
// Desktop: Table skeleton with header + 5 rows
// Mobile: 5 card skeletons matching card structure
// Matches final layout exactly
```

### CompanyCardSkeleton
```tsx
function CompanyCardSkeleton() {
  return (
    <CardSurface className="p-5 animate-pulse">
      <div className="flex items-start gap-3 mb-4">
        <div className="h-10 w-10 bg-gray-200 rounded-lg" />
        <div className="flex-1">
          <div className="h-4 w-32 bg-gray-200 rounded mb-2" />
          <div className="h-3 w-24 bg-gray-200 rounded" />
        </div>
      </div>
      <div className="space-y-2 mb-4">
        <div className="h-3 w-full bg-gray-200 rounded" />
        <div className="h-3 w-3/4 bg-gray-200 rounded" />
      </div>
      <div className="flex gap-4">
        <div className="h-4 w-20 bg-gray-200 rounded" />
        <div className="h-4 w-20 bg-gray-200 rounded" />
      </div>
    </CardSurface>
  );
}
```

---

## Mobile PWA Compliance

### Touch Targets
- All interactive elements: **≥44px** (buttons, tabs, cards)
- Form inputs: **56px height** (work glove friendly)
- Swipe threshold: **60px** drag distance

### Safe Area Handling
```tsx
// Layout respects safe-area-inset-bottom for bottom nav
className="pb-[env(safe-area-inset-bottom)]"

// Full height uses dynamic viewport height
className="min-h-[100dvh]"
```

### Haptic Feedback
```tsx
import { useHapticFeedback } from '@/lib/hooks/useHapticFeedback';

// Tab change: light haptic
// Swipe action: medium haptic
// Delete action: heavy haptic
```

### Performance
- Skeleton states: <50ms load time
- Tab navigation: <200ms transition
- Search filter: 300ms debounce
- Card animations: 60fps (transform/opacity only)

---

## Accessibility Compliance

### ARIA Attributes
```tsx
// Tabs
<div role="tablist" aria-label="Owner admin sections">
  <button role="tab" aria-selected={isActive} aria-controls="panel-companies">
    Companies
  </button>
</div>

// Tables
<table role="table">
  <thead>
    <tr><th scope="col">Name</th></tr>
  </thead>
</table>

// Icon-only buttons
<button aria-label="Copy invitation link">
  <Copy className="w-4 h-4" />
</button>
```

### Keyboard Navigation
- Tab key: Navigate through tabs, table rows, action buttons
- Enter/Space: Activate selected element
- Escape: Close mobile menu (if added)
- Arrow keys: Navigate table cells (if enhanced)

### Focus Indicators
```tsx
// All interactive elements
className="focus:ring-2 focus:ring-offset-2 focus:ring-[#001B51] focus:outline-none"
```

### Color Contrast
- All text: ≥4.5:1 ratio
- Active states: ≥3:1 ratio (large text)
- Status badges: Text + icon (not color-only)

---

## Testing Strategy

### Unit Tests (Vitest)
- [ ] OwnerTabs: Active route detection
- [ ] OwnerStatsGrid: Skeleton rendering
- [ ] OwnerDataTable: Search filtering logic
- [ ] CompanyCard: Touch target sizes
- [ ] InvitationCard: Swipe gesture handlers

### Integration Tests (Playwright)
- [ ] Companies page: Search filtering
- [ ] Users page: Desktop table vs mobile cards
- [ ] Invites page: Form submission + list update
- [ ] Layout: Tab navigation flow
- [ ] Mobile: Swipe actions on cards

### Visual Regression (Percy/Chromatic)
- [ ] All pages: Desktop vs mobile viewports
- [ ] Skeleton states: All components
- [ ] Dark mode: All pages
- [ ] Hover/active states: Cards and buttons

### Accessibility (axe-core)
- [ ] ARIA attributes on tabs
- [ ] Table semantics
- [ ] Focus management
- [ ] Color contrast ratios

---

## Migration Path

### Phase 1: Foundation Components (P0)
1. Create `OwnerPageHeader`
2. Create `OwnerStatsGrid`
3. Create `OwnerDataTable` (table-only version first)

### Phase 2: Card Components (P1)
4. Create `CompanyCard`
5. Create `UserRow` / `UserCard`
6. Create `InvitationCard` with SwipeableCard

### Phase 3: Layout Enhancement (P1)
7. Update `owner/layout.tsx` with tabs + background
8. Test tab navigation flow

### Phase 4: Page Refactors (P2)
9. Refactor `companies/page.tsx`
10. Refactor `users/page.tsx`
11. Refactor `invites/page.tsx` + client component

### Phase 5: Polish (P3)
12. Add loading skeletons
13. Add animations (stagger, transitions)
14. Add empty states
15. Accessibility audit

---

## Rollback Plan

If issues arise, rollback is simple:
1. Revert modified page files to previous versions
2. Keep new components (no breaking changes)
3. Components can be used incrementally (no all-or-nothing)

---

## Performance Budget

| Metric | Target | Monitoring |
|--------|--------|------------|
| Component bundle size | <15KB (gzip) | webpack-bundle-analyzer |
| Tab navigation | <200ms | Chrome DevTools |
| Search filter latency | <300ms | User timing API |
| Card render (100 items) | <500ms | React Profiler |
| Lighthouse Performance | >90 | CI pipeline |

---

## Success Criteria

- [ ] All three pages use shared `OwnerPageHeader`
- [ ] All stat cards use `OwnerStatsGrid` with KPICard
- [ ] All data tables use `OwnerDataTable` component
- [ ] Mobile viewports (<768px) show card views, not tables
- [ ] Swipe actions work on invitation cards
- [ ] Search filtering works on companies and users
- [ ] Tab navigation has <200ms transition
- [ ] All touch targets are ≥44px
- [ ] Lighthouse Accessibility score: 100/100
- [ ] Total LOC reduction: >600 lines

---

## References

- GenHub Design System: `.claude/CLAUDE.md`
- Mobile PWA Patterns: `components/mobile/`
- KPICard Component: `components/dashboard/KPICard.tsx`
- Existing Sidebar: `components/app/Sidebar.tsx`
- SwipeableCard: `components/mobile/SwipeableCard.tsx`
- SegmentedControl: `components/mobile/SegmentedControl.tsx`
