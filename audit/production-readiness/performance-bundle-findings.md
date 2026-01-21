# Bundle Analysis Findings

**Audit Date:** 2026-01-20
**Auditor:** Performance Engineer Agent
**Scope:** Bundle size, code splitting, dynamic imports, package optimization

---

## Summary

| Metric | Value | Status |
|--------|-------|--------|
| next/dynamic usages | 17 | Good |
| Heavy deps w/o dynamic | 4 | Needs Work |
| optimizePackageImports | Configured (8 packages) | Good |
| framer-motion optimization | LazyMotion configured | Good |
| lucide-react optimization | Mixed (252 barrel + 631 direct) | Needs Work |
| Barrel imports from @/components | 0 | Excellent |

**Bundle Optimization Score: 72/100**

---

## Configuration Status

### next.config.ts - optimizePackageImports

**Status:** Configured with 8 packages

```typescript
optimizePackageImports: [
  'lucide-react',           // Covered
  '@radix-ui/react-dialog',
  '@radix-ui/react-dropdown-menu',
  '@radix-ui/react-popover',
  '@radix-ui/react-select',
  '@radix-ui/react-tabs',
  '@radix-ui/react-tooltip',
  'date-fns',               // Covered
]
```

**Missing Packages (should add):**
- `@radix-ui/react-alert-dialog` - Used in components/ui/alert-dialog.tsx
- `@radix-ui/react-avatar` - Used in components/ui/avatar.tsx
- `@radix-ui/react-checkbox` - Used in components/ui/checkbox.tsx
- `@radix-ui/react-label` - Used in components/ui/label.tsx
- `@radix-ui/react-progress` - Used in components/ui/progress.tsx
- `@radix-ui/react-scroll-area` - Used in components/ui/scroll-area.tsx
- `@radix-ui/react-switch` - Used in components/ui/switch.tsx
- `@dnd-kit/core` - Heavy (35KB), used in KanbanBoard/GanttChart (already dynamically loaded)
- `framer-motion` - Consider adding despite LazyMotion (150 files import directly)

### Cache Components & PPR

**Status:** Enabled
- `cacheComponents: true` - Active
- Custom cache profiles defined (short, medium, long, userScoped)

---

## Heavy Components - Dynamic Loading Status

### Properly Dynamically Loaded (17 usages)

| Component | Location | Est. Size | Status |
|-----------|----------|-----------|--------|
| GanttChart | TaskBoard.tsx | ~150KB (recharts equiv.) | Dynamic, ssr: false |
| KanbanBoard | TaskBoard.tsx | ~35KB (dnd-kit) | Dynamic, ssr: false |
| TaskModal | TasksPageClient, DashboardContent, ProjectDetailContent, TaskModalTrigger | ~50KB | Dynamic, ssr: false |
| CreateProjectModal | DashboardContent.tsx | ~40KB | Dynamic, ssr: false |
| InviteTeamMemberModal | DashboardContent, TeamPageClient, TeamMemberTable | ~25KB | Dynamic, ssr: false |
| ExpenseDetailModal | ExpensesList.tsx | ~30KB | Dynamic |
| CreateExpenseModal | ExpensesList, ExpensesPageHeader | ~30KB | Dynamic |
| EditSubcontractorModal | SubcontractorCard.tsx | ~20KB | Dynamic |
| AddSubcontractorModal | SubcontractorList.tsx | ~20KB | Dynamic |
| MetroJourney | ProjectOverview.tsx | ~15KB | Dynamic |
| ClientSpatialViewer | ClientSpatialViewerWrapper.tsx | ~500KB (xeokit) | Dynamic, ssr: false |

### Missing Dynamic Loading (P0 - Should Fix)

| Component | Location | Issue | Est. Impact |
|-----------|----------|-------|-------------|
| TaskModal | PhaseDetailPanel.tsx:21 | Static import | +50KB to initial bundle |
| CreateProjectModal | ProjectsPageClient.tsx:21 | Static import | +40KB to initial bundle |
| ManagePhasesModal | MetroJourney.tsx:11 | Static import | +20KB to initial bundle |

---

## Framer Motion Optimization

### LazyMotion Configuration

**Status:** Properly configured

**File:** `components/providers/MotionProvider.tsx`
```typescript
import { LazyMotion } from "framer-motion";
import { domAnimation } from "@/lib/motion-features";

export function MotionProvider({ children }) {
  return (
    <LazyMotion features={domAnimation} strict>
      {children}
    </LazyMotion>
  );
}
```

**File:** `lib/motion-features.ts`
```typescript
export { domAnimation } from "framer-motion";
// Using domAnimation (subset) instead of domMax saves ~15KB
```

**Usage Pattern:**
- 150 files import from 'framer-motion'
- Most use `m as motion` pattern (compatible with LazyMotion)
- Estimated savings: ~15KB from domAnimation vs domMax

---

## Lucide-React Import Analysis

### Current State

| Import Pattern | File Count | Impact |
|----------------|------------|--------|
| Barrel imports (`from 'lucide-react'`) | 184 files (252 occurrences) | Covered by optimizePackageImports |
| Direct imports (`from 'lucide-react/icons/...'`) | 102 files (631 occurrences) | Best practice |

**Note:** While barrel imports exist, they are mitigated by `optimizePackageImports` in next.config.ts. The direct import pattern (`lucide-react/icons/x`) is being adopted progressively - visible in newer components like PhaseDetailPanel.tsx.

### Files Using Direct Imports (Best Practice Examples)
- `components/projects/PhaseDetailPanel.tsx` - 10 direct icon imports
- `components/projects/ProjectDetailContent.tsx` - 20 direct icon imports
- `components/projects/ProjectsPageClient.tsx` - 7 direct icon imports

---

## Heavy Dependencies Analysis

### Firebase (~150KB)

**Location:** `lib/firebase.ts`, `lib/hooks/usePushNotifications.ts`

**Status:** Acceptable
- Only imported in push notification hook
- Not in critical path for initial load
- Uses tree-shaking (`firebase/app`, `firebase/messaging` only)

### Stripe (~50KB)

**Location:** `components/CheckoutButton.tsx`

**Status:** Needs Attention
- `loadStripe` called at module level
- Consider lazy loading on button click

```typescript
// Current (loads immediately)
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

// Better (load on interaction)
const handleCheckout = async () => {
  const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
  // ...
}
```

### XeoKit SDK (~500KB)

**Location:** 16 files in `lib/xeokit/`, `components/projects/spatial/`

**Status:** Properly handled
- ClientSpatialViewer is dynamically imported with ssr: false
- Only loads on spatial viewer pages

### JSZip (~100KB)

**Location:** `app/api/project-files/bulk-download/route.ts`

**Status:** Excellent
- Server-side only (API route)
- Not in client bundle

### Marked + DOMPurify (~60KB combined)

**Location:** `lib/text-formatting.ts`

**Status:** Acceptable
- Used for markdown parsing in notes
- Could be dynamically imported if notes are not on critical path

---

## Already Optimized

1. **No barrel imports from `@/components`** - All imports are path-specific
2. **No full lodash imports** - Not used in project
3. **No recharts** - Using custom Gantt implementation (good choice)
4. **LazyMotion** - Configured with domAnimation subset
5. **XeoKit** - Dynamically loaded with ssr: false
6. **Modals** - Most heavy modals use next/dynamic (17 instances)
7. **Server-side heavy deps** - JSZip only in API routes

---

## Recommendations

### P0 - Critical (Add dynamic imports)

1. **PhaseDetailPanel.tsx** - Line 21
   ```typescript
   // Change from:
   import { TaskModal } from '@/components/tasks/TaskModal';

   // To:
   const TaskModal = dynamic(
     () => import('@/components/tasks/TaskModal').then(mod => mod.TaskModal),
     { ssr: false }
   );
   ```

2. **ProjectsPageClient.tsx** - Line 21
   ```typescript
   // Change from:
   import { CreateProjectModal } from './CreateProjectModal';

   // To:
   const CreateProjectModal = dynamic(
     () => import('./CreateProjectModal').then(mod => mod.CreateProjectModal),
     { ssr: false }
   );
   ```

3. **MetroJourney.tsx** - Line 11
   ```typescript
   // Change from:
   import { ManagePhasesModal } from './ManagePhasesModal';

   // To:
   const ManagePhasesModal = dynamic(
     () => import('./ManagePhasesModal').then(mod => mod.ManagePhasesModal),
     { ssr: false }
   );
   ```

### P1 - High (Configuration improvements)

4. **Expand optimizePackageImports** in next.config.ts:
   ```typescript
   optimizePackageImports: [
     'lucide-react',
     '@radix-ui/react-alert-dialog',  // Add
     '@radix-ui/react-avatar',         // Add
     '@radix-ui/react-checkbox',       // Add
     '@radix-ui/react-dialog',
     '@radix-ui/react-dropdown-menu',
     '@radix-ui/react-label',          // Add
     '@radix-ui/react-popover',
     '@radix-ui/react-progress',       // Add
     '@radix-ui/react-scroll-area',    // Add
     '@radix-ui/react-select',
     '@radix-ui/react-switch',         // Add
     '@radix-ui/react-tabs',
     '@radix-ui/react-tooltip',
     'date-fns',
     'framer-motion',                  // Add
   ]
   ```

### P2 - Medium (Nice to have)

5. **Lazy load Stripe** - Move `loadStripe` call inside click handler

6. **Continue direct icon imports** - When modifying files, convert barrel to direct:
   ```typescript
   // Instead of:
   import { Check, X, Plus } from 'lucide-react'

   // Use:
   import Check from 'lucide-react/icons/check'
   import X from 'lucide-react/icons/x'
   import Plus from 'lucide-react/icons/plus'
   ```

---

## Impact Estimate

| Fix | Bundle Reduction | Files Affected |
|-----|------------------|----------------|
| Dynamic TaskModal in PhaseDetailPanel | ~50KB initial | 1 |
| Dynamic CreateProjectModal in ProjectsPageClient | ~40KB initial | 1 |
| Dynamic ManagePhasesModal in MetroJourney | ~20KB initial | 1 |
| Expand optimizePackageImports | ~5-10KB per Radix package | Config only |
| Lazy Stripe | ~50KB initial | 1 |

**Total Potential Savings:** ~170-180KB from initial bundle

---

## Verification Commands

```bash
# Check bundle size after fixes
npm run build 2>&1 | grep -E "Route|Size|First Load"

# Analyze bundle composition (if @next/bundle-analyzer configured)
ANALYZE=true npm run build
```
