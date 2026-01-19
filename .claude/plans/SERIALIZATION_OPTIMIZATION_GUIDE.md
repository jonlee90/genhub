# Frontend Serialization Optimization Guide

**Last Updated:** 2026-01-18
**Status:** Production Ready

---

## Overview

This guide documents optimization patterns for reducing data serialization overhead when passing data from Server Components to Client Components in the GenHub PWA.

**Goal:** Minimize JSON payload size by only serializing data that components actually use.

---

## Pattern: Minimal Data Types

### Principle

Client components often receive large objects with many fields they don't use. Create minimal type definitions that include only the fields actually rendered.

### Example: ProjectCard Optimization

**Before:**
```typescript
// Server Component passes full ProjectWithStats (30+ fields)
<ProjectCard project={projectWithStats} />

// Serializes ~2,124 bytes per project
// Includes: full ProjectsRow, taskCounts, materials, expenses, project_phases[], project_team[]
```

**After:**
```typescript
// Server Component transforms to minimal type
import { transformToProjectCardData } from '@/types/components/projects';
<ProjectCard project={transformToProjectCardData(projectWithStats)} />

// Serializes ~616 bytes per project (71% reduction)
// Includes: only 12 essential display fields + 2 stat fields
```

**Savings:** 29.5 KB per page load (20 projects)

---

## Implementation Steps

### 1. Analyze Component Usage

**Tools:**
- Read component file
- Grep for all `props.fieldName` or destructured field usage
- Note line numbers

**Example Analysis:**
```typescript
// components/projects/ProjectCard.tsx

// Fields used:
// - project.id (line 101)
// - project.name (line 134)
// - project.status (lines 67-68, 242-252)
// - stats.teamSize (line 296)
// - stats.schedule.daysRemaining (lines 81-83)

// Fields NOT used:
// - stats.taskCounts (entire object)
// - stats.materials (entire object)
// - project_phases (array)
```

### 2. Create Minimal Type

**Location:** `types/components/{module}.ts`

```typescript
/**
 * {ComponentName}Data - Minimal data type
 *
 * Only includes fields actually used by {ComponentName} to reduce serialization.
 *
 * Serialization savings: ~XX% reduction
 */
export type ComponentNameData = Pick<
  FullType,
  | 'field1'
  | 'field2'
  | 'field3'
> & {
  stats: {
    field4: number;
  };
};
```

### 3. Create Transformation Helper

```typescript
/**
 * Transform FullType to minimal ComponentNameData
 *
 * Use this in server components before passing data to client.
 */
export function transformToComponentNameData(full: FullType): ComponentNameData {
  return {
    field1: full.field1,
    field2: full.field2,
    field3: full.field3,
    stats: {
      field4: full.stats?.field4 ?? 0,
    },
  };
}
```

### 4. Update Server Components

```typescript
// app/app/{module}/page.tsx

import { transformToComponentNameData } from '@/types/components/{module}';

export default async function Page() {
  const { data } = await getFullData();

  // Transform before passing to client component
  const minimalData = data.map(transformToComponentNameData);

  return <ClientComponent data={minimalData} />;
}
```

### 5. Verify Compatibility

**Check component props type:**
```typescript
interface ComponentProps {
  data: FullType | MinimalType; // ← Union type = non-breaking change
}
```

If component expects specific type:
```typescript
// Option A: Update to union type (preferred)
interface ComponentProps {
  data: FullType | MinimalType;
}

// Option B: Update component to use MinimalType only
interface ComponentProps {
  data: MinimalType;
}
```

---

## Measuring Impact

### Before Optimization

**Tools:**
1. Chrome DevTools → Network tab
2. Filter by "Doc" or "Fetch"
3. Find response with component data
4. Note payload size

### After Optimization

**Tools:**
1. Repeat above steps
2. Compare payload sizes
3. Calculate reduction percentage

**Expected Results:**
- 50-80% reduction for components with unused nested objects/arrays
- 20-40% reduction for components with some unused fields
- Minimal/no reduction if component uses most fields

---

## Decision Matrix: When to Optimize

| Criteria | Threshold | Action |
|----------|-----------|--------|
| **Unused Fields** | < 20% | ❌ Skip (low ROI) |
| **Unused Fields** | 20-50% | ⚠️ Consider (medium ROI) |
| **Unused Fields** | > 50% | ✅ Optimize (high ROI) |
| **Component Renders** | < 10/page | ❌ Skip (low impact) |
| **Component Renders** | 10-50/page | ⚠️ Consider |
| **Component Renders** | > 50/page | ✅ Optimize (high impact) |
| **Nested Arrays** | 0 arrays | ❌ Skip |
| **Nested Arrays** | 1-2 arrays | ⚠️ Consider |
| **Nested Arrays** | 3+ arrays | ✅ Optimize (arrays = high overhead) |

**Formula for ROI:**
```
Impact Score = (Unused %) × (Renders per page) × (Has nested arrays ? 2 : 1)

Score < 50: Skip
Score 50-150: Consider
Score > 150: Optimize
```

**Example: ProjectCard**
```
Unused %: 70%
Renders per page: 20
Has nested arrays: Yes (project_phases, project_team)
Impact Score = 70 × 20 × 2 = 2,800 ✅ HIGH PRIORITY
```

---

## Common Patterns

### Pattern 1: List/Grid Components

**Characteristics:**
- Renders many items (10-100+)
- Items use subset of fields
- High serialization overhead

**Examples:**
- ProjectCard in projects grid (20+ cards)
- TaskCard in kanban board (50+ cards)
- ExpenseCard in expenses list (30+ cards)

**Optimization Impact:** ⭐⭐⭐⭐⭐ (Very High)

### Pattern 2: Dashboard Stats

**Characteristics:**
- Receives full data for calculations
- Only displays aggregated values
- May not need nested relations

**Examples:**
- DashboardStats component
- PortfolioSummary component

**Optimization Impact:** ⭐⭐⭐ (Medium - data needed for calculations)

### Pattern 3: Detail Views

**Characteristics:**
- Displays most/all fields
- May need nested relations
- Low optimization potential

**Examples:**
- ProjectDetailContent (uses most project fields)
- TaskModal (uses full task data)

**Optimization Impact:** ⭐ (Low - minimal unused fields)

---

## Anti-Patterns (What NOT to Do)

### ❌ Over-Optimization

**Bad:**
```typescript
// Creating 10 different minimal types for slight variations
type ProjectCardData = { ... }
type ProjectCardMobileData = { ... }
type ProjectCardTabletData = { ... }
// etc.
```

**Good:**
```typescript
// Single minimal type, component handles responsive logic
type ProjectCardData = { ... }
```

### ❌ Premature Optimization

**Bad:**
```typescript
// Optimizing before measuring
// "This might be slow, let me optimize it..."
```

**Good:**
```typescript
// Measure first, optimize if needed
// 1. Profile page load
// 2. Identify bottlenecks
// 3. Apply targeted optimizations
```

### ❌ Breaking Changes

**Bad:**
```typescript
// Changing component to require minimal type (breaks existing usage)
interface ProjectCardProps {
  project: ProjectCardData; // ← Breaking change!
}
```

**Good:**
```typescript
// Support both types (non-breaking)
interface ProjectCardProps {
  project: ProjectCardData | ProjectWithStats; // ← Compatible
}
```

---

## Checklist

Before implementing optimization:

- [ ] Component used in list/grid (10+ renders)?
- [ ] Component has 30%+ unused fields?
- [ ] Measured current payload size?
- [ ] Created minimal type definition?
- [ ] Created transformation helper?
- [ ] Updated component props to union type (if needed)?
- [ ] Verified TypeScript compilation?
- [ ] Tested component renders correctly?
- [ ] Measured payload size reduction?
- [ ] Documented in component types file?

---

## Reference Implementations

### Projects Module

**Files:**
- Type: `types/components/projects.ts` → `ProjectCardData`
- Helper: `types/components/projects.ts` → `transformToProjectCardData()`
- Component: `components/projects/ProjectCard.tsx`
- Audit: `.claude/docs/frontend/PHASE_5_SERIALIZATION_AUDIT.md`

**Savings:**
- 71% data reduction per project
- 29.5 KB saved per page (20 projects)

---

## Future Work

### Potential Optimizations

1. **TaskCard** (components/tasks/TaskCard.tsx)
   - Likely receives full TaskWithRelations
   - May only use subset for display
   - High impact (50+ tasks per board)

2. **ExpenseCard** (components/expenses/)
   - Likely receives full expense data
   - May only use subset for list view
   - Medium impact (20-30 expenses per page)

3. **MaterialCard** (if exists)
   - Similar pattern to above
   - Medium-high impact depending on usage

### Monitoring

Track serialization overhead:
- Add bundle size monitoring
- Alert on payload size regressions > 10%
- Quarterly review of high-traffic components

---

## Questions?

Contact: frontend-engineer agent
Related Docs:
- Component Patterns: `.claude/docs/frontend/component-patterns.md`
- Performance: `.claude/docs/frontend/performance.md`
- Phase 5 Audit: `.claude/docs/frontend/PHASE_5_SERIALIZATION_AUDIT.md`
