# Skill: Deferred Loading Pattern

> Load non-critical data after initial page render for improved performance

---

## When to Use

Use deferred loading when:
- Data is expensive to compute (aggregations, complex queries)
- Data is not needed for initial page render
- Data is below the fold or in inactive tabs
- User can see meaningful content without this data
- Loading time exceeds 100ms

**Examples:**
- Expense statistics and aggregations
- Team cost summaries
- Chart data and visualizations
- Secondary metrics (health scores, completion percentages)
- Inactive tab content
- Task dependencies (for gantt/dependency views)

**Don't defer:**
- Primary page content (title, header, critical info)
- Active tab content
- Navigation/menu items
- Data needed for initial layout

---

## Implementation Guide

### Step 1: Identify Critical vs. Non-Critical Data

Audit existing data fetching:

```tsx
// BEFORE: Everything loads upfront
export async function getProjectData(id: string) {
  const [project, tasks, expenses, teamCosts, dependencies] = await Promise.all([
    getProject(id),           // CRITICAL - needed for page
    getTasks(id),             // CRITICAL - main content
    getExpenseStats(id),      // NON-CRITICAL - aggregation
    getTeamCosts(id),         // NON-CRITICAL - expensive calc
    getTaskDependencies(id),  // NON-CRITICAL - gantt view only
  ]);
  return { project, tasks, expenses, teamCosts, dependencies };
}
```

Split into critical and deferred:

```tsx
// AFTER: Critical only
export async function getProjectCriticalData(id: string) {
  const [project, tasks] = await Promise.all([
    getProject(id),   // Load immediately
    getTasks(id),     // Load immediately
  ]);
  return { project, tasks };
}

// AFTER: Deferred actions
// app/actions/project-deferred.ts
export async function getProjectExpenseStats(id: string) { /* ... */ }
export async function getProjectTeamCosts(id: string) { /* ... */ }
export async function getProjectTaskDependencies(id: string) { /* ... */ }
```

---

### Step 2: Create Deferred Server Actions

Create `app/actions/{feature}-deferred.ts` with defensive error handling:

```tsx
'use server';

import { createClient } from '@/utils/supabase/server';
import { auth } from '@/lib/auth';

// Define interface for RPC response structure
interface ResponseStructure {
  project?: {
    id?: string;
    stats?: Record<string, unknown>;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

// Define interface for return value (matches component)
interface StatsResult {
  stats: {
    total: number;
    count: number;
    items: string[];
  };
  metadata: {
    lastUpdated: string | null;
  };
}

export async function getDeferredStats(id: string): Promise<StatsResult> {
  const supabase = await createClient();
  const session = await auth();

  // 1. Auth check
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  try {
    // 2. RPC/Query with error destructuring
    const { data: rpcResult, error: rpcError } = await supabase.rpc(
      'get_stats_function',
      { p_id: id }
    );

    // 3. Check RPC error FIRST
    if (rpcError) {
      console.error('[getDeferredStats] RPC error:', rpcError);
      return {
        stats: { total: 0, count: 0, items: [] },
        metadata: { lastUpdated: null },
      };
    }

    // 4. Type the response
    const result = rpcResult as ResponseStructure;

    // 5. Null check nested data
    const projectData = result?.project;
    if (!projectData) {
      console.warn('[getDeferredStats] No project data in response');
      return {
        stats: { total: 0, count: 0, items: [] },
        metadata: { lastUpdated: null },
      };
    }

    // 6. Extract with type casting and fallbacks
    const rawStats = projectData.stats as Record<string, unknown> | undefined;
    const stats = {
      total: (rawStats?.total as number) || 0,
      count: (rawStats?.count as number) || 0,
      items: (rawStats?.items as string[]) || [],
    };

    // 7. Return matching component interface exactly
    return {
      stats,
      metadata: {
        lastUpdated: projectData.lastUpdated as string | null,
      },
    };
  } catch (error) {
    // 8. Catch unexpected errors
    console.error('[getDeferredStats] Unexpected error:', error);
    return {
      stats: { total: 0, count: 0, items: [] },
      metadata: { lastUpdated: null },
    };
  }
}
```

---

### Step 3: Use Deferred Hook in Client Component

```tsx
'use client';

import { useDeferredData } from '@/hooks/use-deferred-data';
import { getDeferredStats } from '@/app/actions/feature-deferred';

export function StatsPanel({ featureId }: { featureId: string }) {
  // Load after 1 second delay
  const { data: statsData, loading, error, refetch } = useDeferredData({
    fetchFn: () => getDeferredStats(featureId),
    delay: 1000,
    cacheKey: `feature-${featureId}-stats`,
  });

  // Show skeleton while loading
  if (loading) {
    return <StatsSkeleton />;
  }

  // Show nothing if no data (graceful degradation)
  if (!statsData) {
    return null;
  }

  // Render with loaded data
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold">Statistics</h3>
        <button onClick={refetch} className="text-sm text-blue-600">
          Refresh
        </button>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Total" value={statsData.stats.total} />
        <StatCard label="Count" value={statsData.stats.count} />
        <StatCard label="Items" value={statsData.stats.items.length} />
      </div>
    </div>
  );
}
```

---

### Step 4: Create Loading Skeletons

Match skeleton structure to actual content:

```tsx
export function StatsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-lg p-4 space-y-2 animate-pulse">
            <div className="h-4 w-16 bg-gray-200 rounded" />
            <div className="h-8 w-24 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## Error Handling Checklist

Every deferred action MUST include:

- [ ] **Destructure both `data` and `error`** from RPC/query
- [ ] **Check `error` before accessing `data`**
- [ ] **Type cast response** to defined interface
- [ ] **Null check all nested data** with optional chaining
- [ ] **Provide fallbacks** for all fields (`|| 0`, `|| []`, `|| null`)
- [ ] **Return type matches component interface** exactly
- [ ] **Catch unexpected errors** with try/catch
- [ ] **Log errors** with function name prefix: `[functionName]`
- [ ] **Return safe defaults** on all error paths (never throw)
- [ ] **Test error scenarios** (RPC error, empty data, malformed response)

---

## Testing Considerations

### Manual Testing

```tsx
// Test loading state
// 1. Open DevTools Network tab
// 2. Throttle to "Slow 3G"
// 3. Verify skeleton shows while loading

// Test error state
// 1. Temporarily break RPC function
// 2. Verify safe defaults render
// 3. Check console for error logs

// Test empty state
// 1. Use ID with no data
// 2. Verify graceful empty state
// 3. No console errors

// Test cache
// 1. Load page
// 2. Navigate away
// 3. Navigate back
// 4. Verify no refetch (uses cache)
```

### Console Checks

Monitor for these patterns:

```
✅ GOOD:
[getDeferredStats] RPC error: { message: "..." }
[getDeferredStats] No project data in response

❌ BAD:
TypeError: Cannot read property 'stats' of undefined
Uncaught Error: ...
```

---

## Performance Optimization

### Progressive Loading Strategy

Load in tiers based on priority:

```tsx
export function FeatureDetail({ feature }) {
  // Tier 1: Load immediately after render (0ms delay)
  const { data: tier1Data } = useDeferredData({
    fetchFn: () => getTier1Data(feature.id),
    delay: 0,
  });

  // Tier 2: Load after page interactive (1s delay)
  const { data: tier2Data } = useDeferredData({
    fetchFn: () => getTier2Data(feature.id),
    delay: 1000,
  });

  // Tier 3: Load only when tab is active
  const { data: tier3Data } = useDeferredData({
    fetchFn: () => getTier3Data(feature.id),
    delay: 0,
    enabled: activeTab === 'advanced', // Conditional loading
  });

  return (
    <>
      {/* Tier 1: Always visible */}
      <Overview data={tier1Data} />

      {/* Tier 2: Below fold */}
      {tier2Data && <DetailedStats data={tier2Data} />}

      {/* Tier 3: Tab content */}
      {activeTab === 'advanced' && tier3Data && (
        <AdvancedView data={tier3Data} />
      )}
    </>
  );
}
```

### Prefetch on Intent

Load data before user needs it:

```tsx
const prefetchTabData = () => {
  getTabData(featureId); // Prefetch into cache
};

<button
  onClick={() => setActiveTab('details')}
  onMouseEnter={prefetchTabData}  // Prefetch on hover
  onFocus={prefetchTabData}        // Prefetch on keyboard nav
>
  Details
</button>
```

---

## Common Pitfalls

### 1. Forgetting Error Field

```tsx
// ❌ CRITICAL BUG - Ignores error
const { data } = await supabase.rpc('function', params);
return { stats: data.stats }; // TypeError on error

// ✅ CORRECT
const { data, error } = await supabase.rpc('function', params);
if (error) return safeDefaults;
return { stats: data?.stats || defaultStats };
```

### 2. Wrong Response Structure

```tsx
// ❌ WRONG - Assumes flat array
const stats = rpcResult[0].stats;

// ✅ CORRECT - Check actual structure
const projectData = rpcResult?.project;
const stats = projectData?.stats;
```

### 3. Missing Null Checks

```tsx
// ❌ DANGEROUS
const total = data.project.stats.total;

// ✅ SAFE
const projectData = data?.project;
const statsData = projectData?.stats as Record<string, unknown> | undefined;
const total = (statsData?.total as number) || 0;
```

### 4. Throwing on Error

```tsx
// ❌ WRONG - Breaks UI
if (error) throw error;

// ✅ CORRECT - Graceful degradation
if (error) {
  console.error('[function] Error:', error);
  return safeDefaults;
}
```

### 5. No Loading States

```tsx
// ❌ BAD - Shows nothing while loading
if (!data) return null;

// ✅ GOOD - Shows skeleton
if (loading) return <Skeleton />;
if (!data) return null;
```

---

## Reference Implementation

See working example:
- Server Actions: `/Users/jonathanlee/Desktop/genhub/app/actions/project-deferred.ts`
- Hook: `/Users/jonathanlee/Desktop/genhub/hooks/use-deferred-data.ts`
- Documentation: `.claude/docs/frontend/DEFERRED_LOADING_EXAMPLE.md`

---

## Related Skills

- `frontend/component-patterns.md` - UI component patterns
- `frontend/performance-optimization.md` - General performance tips
- `backend/server-actions.md` - Server action patterns
