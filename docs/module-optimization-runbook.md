# Module Optimization Runbook

## Overview

This runbook provides a step-by-step process for optimizing GenHub modules following the patterns established in the Tasks Module optimization. Use this guide to achieve similar performance improvements in other modules.

**Expected Results:**
- 20-30% bundle size reduction
- 50-60% faster page loads
- 60-70% faster operations
- 80-90% fewer re-renders
- Improved maintainability

---

## Prerequisites

### Required Knowledge
- GenHub architecture and conventions (`.claude/docs/CLAUDE.md`)
- Next.js 15 + React 19 patterns
- Server Actions best practices
- Performance optimization fundamentals

### Required Tools
- Access to `.claude/docs/` documentation
- Skills: `vercel-react-best-practices`, `refactor-code`
- Build tools: `npm run build`, bundle analyzer

### Required Files
- Tasks Module migration guide (reference implementation)
- Performance optimizations guide
- Server actions documentation
- Component patterns guide

---

## Phase 1: Pre-Audit Preparation

### Step 1.1: Define Module Scope

Identify all files belonging to the module:

```bash
# Example for Projects module
find . -path "*/projects/*" -type f \( -name "*.ts" -o -name "*.tsx" \)

# Categories:
# - Server Actions: app/actions/projects*.ts
# - Components: components/projects/**/*.tsx
# - Pages: app/app/projects/**/page.tsx
# - Utilities: lib/projects*.ts
# - Types: types/db/projects.ts
```

**Document:**
- Total file count
- Total lines of code
- Largest files (>500 lines)
- Key dependencies

### Step 1.2: Baseline Metrics

Measure current performance:

```bash
# Build and record bundle sizes
npm run build | tee build-before.log

# Extract key metrics
grep "app/projects" build-before.log
```

**Document:**
- Bundle size (First Load JS)
- Page count
- Estimated load time (use Lighthouse)
- Number of Server Actions

### Step 1.3: Load Required Documentation

```bash
# Read relevant guides
cat .claude/docs/frontend/PERFORMANCE_OPTIMIZATIONS_GUIDE.md
cat .claude/docs/backend/SERVER_ACTIONS.md
cat .claude/docs/frontend/COMPONENTS.md

# Read Tasks Module examples
cat docs/tasks-module-migration-guide.md
cat docs/tasks-module-performance-report.md
```

### Step 1.4: Load Required Skills

In Claude conversation:
```
Load skills:
- vercel-react-best-practices
- refactor-code

Load memories:
- genhub-project-overview
- genhub-database-schema
- genhub-server-actions
- genhub-component-patterns
```

---

## Phase 2: Parallel Audit Execution

### Step 2.1: Launch Audit Agents

Run 6 agents in parallel using `dispatching-parallel-agents` skill:

**Agent 1: Bundle & Import Analysis**
```
Role: performance-auditor
Budget: 50k tokens
Task: Analyze bundle composition and import patterns
Focus:
- Find barrel imports (lucide-react, other libraries)
- Identify unused dependencies
- Measure component sizes
- Check for duplicate code
Output: List of import optimizations with estimated savings
```

**Agent 2: Async/Waterfall Analysis**
```
Role: performance-auditor
Budget: 50k tokens
Task: Analyze async operations and database queries
Focus:
- Find N+1 query patterns
- Identify sequential awaits
- Check for redundant auth/context calls
- Measure query timings
Output: List of async optimizations with time savings
```

**Agent 3: Re-render & State Analysis**
```
Role: frontend-auditor
Budget: 50k tokens
Task: Analyze component re-renders and state management
Focus:
- Find components missing React.memo()
- Check useMemo/useCallback usage
- Identify expensive computations
- Measure re-render frequency
Output: List of re-render optimizations with render counts
```

**Agent 4: Server-Side Performance**
```
Role: backend-auditor
Budget: 50k tokens
Task: Analyze Server Actions and data fetching
Focus:
- Find redundant database queries
- Check for missing caching
- Identify batch operation opportunities
- Measure action timings
Output: List of server-side optimizations with latency savings
```

**Agent 5: DOM & Rendering Performance**
```
Role: frontend-auditor
Budget: 50k tokens
Task: Analyze component structure and rendering
Focus:
- Find monolithic components (>500 lines)
- Check for code splitting opportunities
- Identify duplicate patterns
- Measure component complexity
Output: List of structural improvements with maintainability gains
```

**Agent 6: Code Quality & Consistency**
```
Role: code-reviewer
Budget: 30k tokens
Task: Review code organization and patterns
Focus:
- Find large files that need splitting
- Check error handling patterns
- Identify shared utility opportunities
- Review TypeScript types
Output: List of quality improvements with priority levels
```

### Step 2.2: Collect Audit Results

Create audit summary document:

```markdown
# Module Optimization Audit Results

## Critical Issues (CRIT-001 to CRIT-XXX)
[Issues requiring immediate fix]

## High Priority (HIGH-001 to HIGH-XXX)
[Issues with significant impact]

## Medium Priority (MED-001 to MED-XXX)
[Issues with moderate impact]

## Low Priority (LOW-001 to LOW-XXX)
[Nice-to-have improvements]
```

### Step 2.3: Prioritize Findings

Sort by impact and effort:

| Priority | Issue | Impact | Effort | ROI |
|----------|-------|--------|--------|-----|
| CRIT-001 | Redundant auth queries | 500ms | Low | High |
| CRIT-002 | N+1 notifications | 400ms | Low | High |
| HIGH-001 | Barrel imports | 192KB | Medium | High |

---

## Phase 3: Implementation by Priority

### Step 3.1: CRITICAL Fixes

**Pattern: React.cache() for Shared Helpers**

1. Identify redundant calls:
```bash
grep -r "await getUserContext()" app/actions/
grep -r "await auth()" app/actions/
```

2. Create cached helper:
```typescript
// lib/auth-context.ts
import { cache } from "react";
import { auth } from "@/lib/auth";
import { createClient } from "@/utils/supabase/server";

export const getUserContext = cache(async function getUserContext() {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  const supabase = await createClient();
  const { data: companyUser } = await supabase
    .from("company_users")
    .select("company_id, role, status")
    .eq("user_id", session.user.id)
    .eq("status", "active")
    .single();

  if (!companyUser) {
    return { error: "No active company found" };
  }

  return {
    userId: session.user.id,
    companyId: companyUser.company_id,
    role: companyUser.role,
    supabase,
  };
});
```

3. Update all Server Actions:
```typescript
// Before
import { auth } from '@/lib/auth';
const session = await auth();
const supabase = await createClient();

// After
import { getUserContext } from '@/lib/auth-context';
const ctx = await getUserContext();
if ('error' in ctx) return ctx;
```

4. Verify with build:
```bash
npm run build
```

**Expected Savings:** 100-750ms per page load

---

**Pattern: Batch Database Operations**

1. Find N+1 patterns:
```bash
grep -A5 "for.*await.*supabase" app/actions/
```

2. Replace with batch operations:
```typescript
// Before
for (const item of items) {
  await supabase.from('table').insert({ ...item });
}

// After
const records = items.map(item => ({ ...item }));
await supabase.from('table').insert(records);
```

3. Test functionality:
- Verify data is inserted correctly
- Check for type errors
- Ensure transaction behavior matches

**Expected Savings:** 90% reduction in query time

---

**Pattern: Parallel Async Operations**

1. Find sequential awaits:
```bash
grep -A10 "await.*;" app/actions/ | grep "await"
```

2. Group independent operations:
```typescript
// Before
await operation1();
await operation2();
await operation3();

// After
await Promise.allSettled([
  operation1(),
  operation2(),
  operation3(),
]);
```

3. Add error logging:
```typescript
const results = await Promise.allSettled([...]);
results.forEach((result, idx) => {
  if (result.status === 'rejected') {
    console.error(`Operation ${idx} failed:`, result.reason);
  }
});
```

**Expected Savings:** 50% reduction in operation time

---

### Step 3.2: HIGH Priority Fixes

**Pattern: Direct Icon Imports**

1. Find all barrel imports:
```bash
grep -r "from 'lucide-react'" components/
```

2. Create migration script:
```typescript
// scripts/fix-lucide-imports.ts
// Converts: import { Calendar } from 'lucide-react'
// To: import Calendar from 'lucide-react/dist/esm/icons/calendar'

const fs = require('fs');
const path = require('path');

function kebabCase(str: string): string {
  return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

function fixFile(filePath: string) {
  let content = fs.readFileSync(filePath, 'utf-8');

  // Find lucide-react imports
  const importRegex = /import\s+{([^}]+)}\s+from\s+['"]lucide-react['"]/g;

  content = content.replace(importRegex, (match, icons) => {
    const iconList = icons.split(',').map((s: string) => s.trim());
    const newImports = iconList.map((icon: string) => {
      const kebab = kebabCase(icon);
      return `import ${icon} from 'lucide-react/dist/esm/icons/${kebab}';`;
    });
    return newImports.join('\n');
  });

  fs.writeFileSync(filePath, content);
}

// Usage
const files = process.argv.slice(2);
files.forEach(fixFile);
```

3. Run migration:
```bash
# Find all files with lucide imports
find components/projects -name "*.tsx" | xargs grep -l "from 'lucide-react'"

# Apply fix
find components/projects -name "*.tsx" -exec node scripts/fix-lucide-imports.ts {} \;
```

4. Verify build:
```bash
npm run build
# Check bundle size reduction
```

**Expected Savings:** 150-200KB bundle reduction

---

**Pattern: React.memo() for List Components**

1. Identify list item components:
```bash
grep -r "map.*=>" components/projects/ | grep -v node_modules
```

2. Add React.memo() with comparator:
```typescript
// Before
export function ProjectCard({ project }: Props) {
  return <Card>...</Card>;
}

// After
import React from 'react';

export const ProjectCard = React.memo(function ProjectCard({
  project,
  onProjectClick,
}: Props) {
  return <Card>...</Card>;
}, (prevProps, nextProps) => {
  return (
    prevProps.project.id === nextProps.project.id &&
    prevProps.project.status === nextProps.project.status &&
    prevProps.project.name === nextProps.project.name
  );
});
```

3. Add useMemo for expensive computations:
```typescript
export const ProjectCard = React.memo(function ProjectCard({ project }: Props) {
  const statusConfig = useMemo(
    () => STATUS_CONFIG[project.status],
    [project.status]
  );

  const isOverdue = useMemo(() => {
    if (!project.due_date) return false;
    const dueDate = new Date(project.due_date);
    return dueDate < new Date();
  }, [project.due_date]);

  return <Card>...</Card>;
});
```

4. Measure re-renders:
- Use React DevTools Profiler
- Record before/after render counts
- Verify reduction >80%

**Expected Savings:** 80-90% fewer re-renders

---

**Pattern: Component Splitting**

1. Identify large components:
```bash
wc -l components/projects/**/*.tsx | sort -n | tail -10
```

2. Split by responsibility:

```typescript
// Before: ProjectDetail.tsx (1,200 lines)
export function ProjectDetail({ project }: Props) {
  // 200 lines of state
  // 300 lines of handlers
  // 700 lines of JSX
}

// After: Orchestrator pattern
export function ProjectDetail({ project }: Props) {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList>...</TabsList>

      <TabsContent value="overview">
        <ProjectOverviewSection project={project} />
      </TabsContent>

      <TabsContent value="team">
        <ProjectTeamSection projectId={project.id} />
      </TabsContent>

      <TabsContent value="tasks">
        <ProjectTasksSection projectId={project.id} />
      </TabsContent>
    </Tabs>
  );
}
```

3. Create section components:
```
components/projects/
├── ProjectDetail.tsx (orchestrator, 300 lines)
└── detail/
    ├── ProjectOverviewSection.tsx (250 lines)
    ├── ProjectTeamSection.tsx (200 lines)
    └── ProjectTasksSection.tsx (300 lines)
```

4. Verify functionality:
- Test tab switching
- Verify data loading
- Check error handling

**Expected Savings:** 40-60% line reduction, better maintainability

---

### Step 3.3: MEDIUM Priority Fixes

**Pattern: Shared Error Handling**

1. Find duplicate error patterns:
```bash
grep -A5 "useState.*error" components/projects/ | wc -l
```

2. Create shared hook:
```typescript
// hooks/useActionWithError.ts
export function useActionWithError<T extends (...args: any[]) => Promise<any>>(
  action: T
) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const execute = useCallback(
    async (...args: Parameters<T>) => {
      setError(null);
      setSuccess(false);
      setIsLoading(true);

      try {
        const result = await action(...args);
        if (result && 'error' in result) {
          setError(result.error);
          return result;
        }
        setSuccess(true);
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unexpected error';
        setError(message);
        return { error: message };
      } finally {
        setIsLoading(false);
      }
    },
    [action]
  );

  return { execute, error, success, isLoading };
}
```

3. Replace in components:
```typescript
// Before
const [error, setError] = useState<string | null>(null);

const handleUpdate = async () => {
  try {
    const result = await updateProject(id, data);
    if ('error' in result) {
      setError(result.error);
    }
  } catch (err) {
    setError('Error');
  }
};

// After
import { useActionWithError } from '@/hooks/useActionWithError';
import { ErrorBanner } from '@/components/shared/ErrorBanner';

const { execute, error } = useActionWithError(updateProject);

const handleUpdate = async () => {
  await execute(id, data);
};

return (
  <div>
    <ErrorBanner message={error} />
    {/* ... */}
  </div>
);
```

**Expected Savings:** 70-80% duplicate code reduction

---

**Pattern: Server Action Organization**

1. Identify large action files:
```bash
wc -l app/actions/*.ts | sort -n
```

2. Split by domain:
```
app/actions/
├── projects.ts              (core CRUD)
├── projects-team.ts         (team management)
├── projects-financials.ts   (budget, expenses)
├── projects-phases.ts       (phase management)
└── projects-stats.ts        (analytics)
```

3. Move functions to domain files:
```typescript
// projects-team.ts
export async function addTeamMember() { }
export async function removeTeamMember() { }
export async function updateTeamMemberRole() { }
```

4. Update imports in components:
```typescript
import { getProject, updateProject } from '@/app/actions/projects';
import { addTeamMember } from '@/app/actions/projects-team';
import { updateBudget } from '@/app/actions/projects-financials';
```

**Expected Savings:** Better organization, fewer merge conflicts

---

### Step 3.4: Build Verification After Each Phase

Run after each pattern implementation:

```bash
# 1. Build
npm run build 2>&1 | tee build-phase-N.log

# 2. Check for errors
grep -i error build-phase-N.log

# 3. Compare bundle sizes
diff build-before.log build-phase-N.log

# 4. Manual testing
# - Test affected features
# - Verify no regressions
# - Check error handling
```

If errors occur:
1. Read error message carefully
2. Check recent changes with `git diff`
3. Restore if needed: `git restore <file>`
4. Fix issue and retry build

---

## Phase 4: Verification & Testing

### Step 4.1: Final Build Check

```bash
# Full build
npm run build

# Expected output:
# ✓ Compiled successfully
# ✓ Linting and checking validity of types
# ✓ Collecting page data
# ✓ Generating static pages
# ✓ Finalizing page optimization
# Build completed in X.Xs
```

**Requirements:**
- Zero build errors
- Zero type errors
- All pages optimized
- Bundle sizes reduced

### Step 4.2: Bundle Analysis

Compare before/after:

```bash
# Extract metrics
grep "/app/projects" build-before.log > metrics-before.txt
grep "/app/projects" build-after.log > metrics-after.txt

# Calculate improvement
# Target: 20%+ reduction
```

### Step 4.3: Manual Testing

Test all major workflows:

**Projects Module Example:**
- [ ] Create new project
- [ ] Update project details
- [ ] Add team members
- [ ] Create tasks
- [ ] Update budget
- [ ] View statistics
- [ ] Delete project

**For Each Test:**
- [ ] Functionality works correctly
- [ ] No console errors
- [ ] Loading states display
- [ ] Error handling works
- [ ] Animations smooth

### Step 4.4: Performance Metrics

Use Lighthouse to measure:

```bash
# Run Lighthouse
npx lighthouse http://localhost:3000/app/projects

# Key metrics:
# - Performance score (target: >90)
# - First Contentful Paint (target: <1.5s)
# - Largest Contentful Paint (target: <2.0s)
# - Time to Interactive (target: <3.0s)
```

Document improvements:

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Performance | 75 | 92 | +22.7% |
| FCP | 1.8s | 1.1s | -38.9% |
| LCP | 2.9s | 1.6s | -44.8% |
| TTI | 3.5s | 1.8s | -48.6% |

---

## Phase 5: Documentation

### Step 5.1: Create Migration Guide

Document patterns used (see Tasks Module example):

```markdown
# [Module] Optimization Migration Guide

## Pattern 1: [Name]
- Before code example
- After code example
- Files modified
- Impact metrics

## Pattern 2: [Name]
...
```

### Step 5.2: Generate Performance Report

Document results (see Tasks Module example):

```markdown
# [Module] Performance Report

## Executive Summary
- Key results
- Metrics table

## Detailed Analysis
- Bundle size
- Load performance
- Runtime performance
- Code quality

## Issues Fixed
- CRIT-001: Description
- HIGH-001: Description
...
```

### Step 5.3: Update Project Documentation

Add learnings to guides:

**`.claude/docs/frontend/PERFORMANCE_OPTIMIZATIONS_GUIDE.md`:**
```markdown
## [Module] Case Study

Real-world application of optimization patterns:
- Pattern X achieved Y% improvement
- Pattern Z saved W ms per operation
- See migration guide for implementation details
```

**`.claude/docs/backend/SERVER_ACTIONS.md`:**
```markdown
## Performance Best Practices from [Module]

- React.cache() pattern usage
- Batch operation examples
- Parallel execution strategies
```

**`.claude/docs/frontend/COMPONENTS.md`:**
```markdown
## Component Refactoring Strategy from [Module]

- When to split (>500 lines, multiple responsibilities)
- Orchestrator + section pattern examples
- Shared utilities implementation
```

### Step 5.4: Document Gotchas

Record any special cases encountered:

```markdown
## Gotchas & Solutions

### Issue: Promise.allSettled type mismatch
Solution: Wrap Server Actions with Promise.resolve()

### Issue: Dynamic import SSR changes
Solution: Remove { ssr: false } for Next.js 15

### Issue: Custom comparator not preventing re-renders
Solution: Ensure all used props are compared
```

---

## Success Criteria Checklist

Use this checklist to verify optimization is complete:

### Build & Types
- [ ] `npm run build` completes with 0 errors
- [ ] No TypeScript errors
- [ ] No ESLint errors
- [ ] All pages optimize successfully

### Performance Metrics
- [ ] Bundle size reduced 20%+
- [ ] Page load improved 50%+
- [ ] Operation speed improved 60%+
- [ ] Re-renders reduced 80%+

### Code Quality
- [ ] Large components split (<500 lines each)
- [ ] Duplicate code eliminated 70%+
- [ ] Large action files organized by domain
- [ ] Shared patterns extracted to utilities

### Testing
- [ ] All features function correctly
- [ ] No regressions detected
- [ ] Error handling works
- [ ] Loading states display
- [ ] Mobile responsive

### Documentation
- [ ] Migration guide created
- [ ] Performance report generated
- [ ] Project docs updated
- [ ] Gotchas documented

---

## Common Pitfalls & Solutions

### Pitfall 1: Supabase SDK in Client Components

**Error:** `Module not found: Can't resolve 'child_process'`

**Cause:** Imported Supabase client in `'use client'` component

**Solution:**
- Move database calls to Server Actions
- Pass data as props to client components
- Use Server Components for data fetching

### Pitfall 2: Promise Type Incompatibility

**Error:** Type mismatch in `Promise.allSettled()`

**Cause:** Server Actions return different types than expected

**Solution:**
```typescript
// Wrap with Promise.resolve()
await Promise.allSettled([
  Promise.resolve(serverAction1()),
  Promise.resolve(serverAction2()),
]);
```

### Pitfall 3: Next.js 15 Dynamic Import Changes

**Error:** Component doesn't render after dynamic import

**Cause:** `{ ssr: false }` pattern changed behavior

**Solution:**
```typescript
// Remove ssr option for client components
const Component = dynamic(() => import('./Component'), {
  loading: () => <Skeleton />
});
```

### Pitfall 4: File Corruption During Refactor

**Error:** Syntax errors after large component split

**Cause:** Copy-paste errors or incomplete refactoring

**Solution:**
```bash
# Use git to restore
git restore <corrupted-file>

# Redo refactor more carefully
# Or use incremental approach (one section at a time)
```

### Pitfall 5: Rate Limits During Large Refactors

**Error:** API rate limit exceeded during optimization

**Cause:** Too many file operations in short time

**Solution:**
- Work in smaller batches
- Use resume command if interrupted
- Save progress frequently with git commits

---

## Agent Assignment Matrix

For parallel optimization work:

| Agent Role | Budget | Responsibilities | Output |
|------------|--------|------------------|--------|
| orchestrator | 30k | Coordinate agents, compile results | Summary report |
| performance-engineer | 50k | Bundle analysis, async patterns | Optimization list |
| frontend-engineer | 80k | Component refactoring, UI | Refactored components |
| backend-engineer | 70k | Server Action optimization | Optimized actions |
| code-reviewer | 30k | Quality checks, consistency | Review report |

**Orchestration Pattern:**
1. Orchestrator launches specialist agents in parallel
2. Each agent works independently on their domain
3. Orchestrator collects results and identifies conflicts
4. Implementation agents apply fixes sequentially
5. Code reviewer verifies final result

---

## Appendix: Quick Reference

### Command Cheat Sheet

```bash
# Find large files
find . -name "*.tsx" -exec wc -l {} + | sort -n | tail -20

# Find barrel imports
grep -r "from 'lucide-react'" components/

# Find N+1 patterns
grep -A5 "for.*await.*supabase" app/actions/

# Find duplicate error handling
grep -c "useState.*error" components/**/*.tsx

# Build and measure
npm run build 2>&1 | tee build-output.log

# Extract bundle sizes
grep "/app/" build-output.log
```

### Pattern Quick Links

- React.cache(): `/Users/jonathanlee/Desktop/genhub/lib/auth-context.ts`
- Batch operations: Migration guide Pattern 2
- Parallel async: Migration guide Pattern 3
- React.memo: Migration guide Pattern 4
- Direct imports: Migration guide Pattern 5
- Component split: Migration guide Pattern 6
- Error handling: Migration guide Pattern 7
- Action organization: Migration guide Pattern 8

---

**Last Updated:** January 2026
**Version:** 1.0
**Based on:** Tasks Module Optimization Results
