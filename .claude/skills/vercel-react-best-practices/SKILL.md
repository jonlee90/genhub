---
name: vercel-react-best-practices
description: React and Next.js performance optimization guidelines. MUST be loaded before any React/TSX changes.
license: MIT
metadata:
  author: vercel
  version: "1.0.0"
---

# Vercel React Best Practices

> 45 rules across 8 categories | Load before ANY React change

---

## QUICK DECISION: What Are You Doing?

```
┌─────────────────────────────────────────────────────────────────────┐
│  Adding imports?                                                    │
│  └─ Use bundle-barrel-imports (direct imports, no index.ts)         │
│  └─ Use bundle-dynamic-imports for heavy components                 │
│                                                                     │
│  Managing state?                                                    │
│  └─ Use rerender-memo for expensive components                      │
│  └─ Use rerender-functional-setstate for callbacks                  │
│  └─ Use rerender-defer-reads (don't subscribe to callback-only state)│
│                                                                     │
│  Fetching data?                                                     │
│  └─ Use async-parallel (Promise.all for independent fetches)        │
│  └─ Use async-suspense-boundaries for streaming                     │
│  └─ Use server-parallel-fetching (restructure components)           │
│                                                                     │
│  Rendering lists?                                                   │
│  └─ Use rendering-content-visibility for long lists                 │
│  └─ Use rerender-memo to prevent re-renders                         │
│                                                                     │
│  Conditional rendering?                                             │
│  └─ Use rendering-conditional-render (ternary, NOT &&)              │
│                                                                     │
│  Report which rules you applied in "Skills Applied:" output         │
└─────────────────────────────────────────────────────────────────────┘
```

---

## MANDATORY USAGE

You MUST apply these rules when:
- Writing new React components or Next.js pages
- Implementing data fetching (client or server-side)
- Reviewing code for performance issues
- Refactoring existing React/Next.js code

**Output Requirement:** Report rules applied under `**Skills Applied:**`

---

## TASK → RULE MAPPING

| What You're Doing | Apply These Rules | Priority |
|-------------------|-------------------|----------|
| **Adding imports** | `bundle-barrel-imports`, `bundle-dynamic-imports` | CRITICAL |
| **Creating component** | `bundle-barrel-imports`, `rendering-conditional-render` | CRITICAL |
| **State management** | `rerender-memo`, `rerender-defer-reads`, `rerender-functional-setstate` | MEDIUM |
| **Data fetching** | `async-parallel`, `async-suspense-boundaries`, `server-parallel-fetching` | CRITICAL |
| **Event handlers** | `rerender-functional-setstate`, `advanced-event-handler-refs` | MEDIUM |
| **Lists/arrays** | `rendering-content-visibility`, `rerender-memo`, `js-combine-iterations` | MEDIUM |
| **Third-party libs** | `bundle-defer-third-party`, `bundle-conditional` | CRITICAL |
| **Server components** | `server-cache-react`, `server-serialization` | HIGH |

---

## RULE CATEGORIES BY PRIORITY

| Priority | Category | Impact | Prefix |
|----------|----------|--------|--------|
| 1 | Eliminating Waterfalls | CRITICAL | `async-` |
| 2 | Bundle Size Optimization | CRITICAL | `bundle-` |
| 3 | Server-Side Performance | HIGH | `server-` |
| 4 | Client-Side Data Fetching | MEDIUM-HIGH | `client-` |
| 5 | Re-render Optimization | MEDIUM | `rerender-` |
| 6 | Rendering Performance | MEDIUM | `rendering-` |
| 7 | JavaScript Performance | LOW-MEDIUM | `js-` |
| 8 | Advanced Patterns | LOW | `advanced-` |

---

## CRITICAL RULES (Always Check)

### 1. Bundle Size (CRITICAL)

**bundle-barrel-imports** - Import directly, avoid barrel files
```typescript
// ❌ BAD
import { Button, Input } from '@/components/ui'

// ✅ GOOD
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
```

**bundle-dynamic-imports** - Use next/dynamic for heavy components
```typescript
// ❌ BAD
import HeavyChart from '@/components/HeavyChart'

// ✅ GOOD
const HeavyChart = dynamic(() => import('@/components/HeavyChart'), {
  loading: () => <Skeleton />
})
```

### 2. Async Waterfalls (CRITICAL)

**async-parallel** - Use Promise.all for independent operations
```typescript
// ❌ BAD (waterfall)
const user = await getUser()
const posts = await getPosts()

// ✅ GOOD (parallel)
const [user, posts] = await Promise.all([getUser(), getPosts()])
```

### 3. Rendering (HIGH)

**rendering-conditional-render** - Use ternary, not &&
```typescript
// ❌ BAD (can render 0 or false)
{count && <Badge count={count} />}

// ✅ GOOD
{count > 0 ? <Badge count={count} /> : null}
```

**rerender-memo** - Memoize expensive components
```typescript
// ✅ GOOD
const TaskList = memo(function TaskList({ tasks }: Props) {
  return tasks.map(t => <TaskItem key={t.id} task={t} />)
})
```

---

## QUICK REFERENCE

### Eliminating Waterfalls (CRITICAL)
- `async-defer-await` - Move await into branches where used
- `async-parallel` - Promise.all() for independent operations
- `async-suspense-boundaries` - Stream content with Suspense

### Bundle Size (CRITICAL)
- `bundle-barrel-imports` - Direct imports, avoid index.ts
- `bundle-dynamic-imports` - next/dynamic for heavy components
- `bundle-defer-third-party` - Load analytics after hydration

### Server-Side (HIGH)
- `server-cache-react` - React.cache() for deduplication
- `server-serialization` - Minimize data to client
- `server-parallel-fetching` - Restructure for parallel fetches

### Re-render Optimization (MEDIUM)
- `rerender-memo` - Memoize expensive components
- `rerender-defer-reads` - Don't subscribe to callback-only state
- `rerender-functional-setstate` - Stable callbacks with functional updates
- `rerender-transitions` - startTransition for non-urgent updates

### Rendering Performance (MEDIUM)
- `rendering-conditional-render` - Ternary over &&
- `rendering-content-visibility` - content-visibility for long lists
- `rendering-hoist-jsx` - Static JSX outside components

### JavaScript (LOW-MEDIUM)
- `js-combine-iterations` - Single loop vs filter/map chain
- `js-set-map-lookups` - O(1) lookups with Set/Map
- `js-early-exit` - Return early from functions

---

## EXAMPLE OUTPUT

```markdown
**Skills Applied:** bundle-barrel-imports (direct imports from @/components/ui/Button), rerender-memo (memoized TaskList component), rendering-conditional-render (used ternary for empty state), async-parallel (Promise.all for user and tasks fetch)
```

---

## FULL RULE REFERENCE

For detailed explanations with code examples, see:
- `rules/async-parallel.md`
- `rules/bundle-barrel-imports.md`
- `rules/_sections.md`
- Complete guide: `AGENTS.md`
