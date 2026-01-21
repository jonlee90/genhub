# Error Boundary Coverage Audit

**Date:** 2026-01-20
**Status:** 19% coverage - NEEDS IMMEDIATE ATTENTION
**Priority:** P2 MEDIUM

---

## Summary

| Metric | Value |
|--------|-------|
| Total Routes | 21 |
| Routes with error.tsx | 4 |
| Coverage | 19% |
| Missing Error Boundaries | 17 |

---

## Existing Error Boundaries

| Route | Quality | Notes |
|-------|---------|-------|
| /app/projects | ✓ Good | Full pattern: error logging, reset, dev details |
| /app/projects/[id] | ✓ Good | Context-specific error handling |
| /app/projects/new | ✓ Good | Form error handling |
| /app/team | ✓ Good | Team page error handling |

---

## Missing Error Boundaries (by priority)

### P0 Critical Routes (3 routes)

| Route | Risk | Reasoning |
|-------|------|-----------|
| `/app` | Dashboard - multiple data sources | Fetches KPIs, projects, tasks, team activity. Failure here locks users out of main view. |
| `/app/tasks` | Task board - complex state management | Kanban/Gantt rendering, drag-drop, filters. High complexity = high failure risk. |
| `/app/chat` | Real-time features + file attachments | WebSocket connections, message history, file uploads. Network-dependent. |

### P1 High Priority (5 routes)

| Route | Risk | Reasoning |
|-------|------|-----------|
| `/app/expenses` | Financial data integrity | User trust issue if expenses fail silently. Needs clear error recovery. |
| `/app/materials` | Inventory tracking + price data | External API dependencies for pricing. Network failures possible. |
| `/app/tasks/[id]` | Task detail mutations | Updates, comments, status changes. Data loss risk without error boundary. |
| `/app/tasks/new` | Task creation form | Complex form with validation. Should show friendly errors, not crash. |
| `/app/profile` | User data + billing info | Sensitive data. Errors must be handled gracefully. |

### P2 Medium Priority (9 routes)

| Route | Risk | Reasoning |
|-------|------|-----------|
| `/app/settings` | Settings mutations | Changes to user preferences. Lower frequency but still important. |
| `/app/settings/default-models` | AI model configuration | Lower traffic but affects AI features. |
| `/app/team/subcontractors` | Subcontractor management | Subset of team features. Lower priority than main team view. |
| `/app/client/projects/[id]` | Client-facing project view | External user view. Should have error boundary for UX. |
| `/app/client/[projectId]/spatial` | Spatial/BIM viewer | 3D rendering failures. Needs graceful degradation. |
| `/app/owner/companies` | Owner admin - company list | Admin-only. Lower traffic but still needs coverage. |
| `/app/owner/invites` | Owner admin - invitations | Admin-only. Lower traffic. |
| `/app/owner/users` | Owner admin - user management | Admin-only. Lower traffic. |
| `/app/admin/seed-data` | Dev/admin seeding tool | Low priority, development/testing only. |

---

## Standard Error Boundary Template

```tsx
'use client';

import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Route] error:', error);
    // TODO: Send to error tracking service (Sentry, LogRocket, etc.)
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10 mb-6">
        <AlertTriangle className="h-10 w-10 text-destructive" />
      </div>
      <h2 className="text-2xl font-bold mb-2">Something went wrong</h2>
      <p className="text-muted-foreground mb-6 text-center max-w-md">
        We encountered an error while loading [feature name]. This might be a temporary issue.
      </p>
      <div className="flex gap-3">
        <Button onClick={reset}>Try again</Button>
        <Button variant="outline" onClick={() => window.location.href = '/app'}>
          Back to Dashboard
        </Button>
      </div>
      {process.env.NODE_ENV === 'development' && (
        <details className="mt-8 p-4 bg-muted rounded-lg max-w-2xl">
          <summary className="cursor-pointer font-mono text-sm text-muted-foreground mb-2">
            Error details (development only)
          </summary>
          <pre className="text-xs overflow-auto">
            {error.message}
            {'\n\n'}
            {error.stack}
          </pre>
        </details>
      )}
    </div>
  );
}
```

---

## Error Boundary Pattern Analysis

### Current Implementation (✓ Good)

From `/app/projects/error.tsx`:

**Strengths:**
- ✓ `'use client'` directive present (required for error boundaries)
- ✓ Error logging with useEffect
- ✓ Reset function properly wired
- ✓ User-friendly error message
- ✓ Fallback navigation (back to dashboard)
- ✓ Development-only error details
- ✓ Accessible visual hierarchy (icon, heading, description, actions)

**Missing (TODO in code):**
- External error tracking (Sentry, LogRocket, etc.) not yet implemented
- No error digest tracking for production debugging

---

## Recommendations

### Phase 1: Critical Routes (Week 1)
Add error.tsx to P0 routes:
1. `/app/app/error.tsx` (dashboard)
2. `/app/app/tasks/error.tsx` (task board)
3. `/app/app/chat/error.tsx` (chat)

### Phase 2: High Priority (Week 2)
Add error.tsx to P1 routes:
4. `/app/app/expenses/error.tsx`
5. `/app/app/materials/error.tsx`
6. `/app/app/tasks/[id]/error.tsx`
7. `/app/app/tasks/new/error.tsx`
8. `/app/app/profile/error.tsx`

### Phase 3: Medium Priority (Week 3)
Add error.tsx to remaining P2 routes (9 files)

### Phase 4: Error Tracking Integration
- Integrate Sentry or similar error tracking
- Add error.digest tracking for production debugging
- Set up error alerting for critical routes

---

## Technical Notes

### Why Error Boundaries Matter

1. **User Experience:** Prevents white screen of death. Shows actionable recovery options.
2. **Debugging:** Error boundaries log errors with context. Essential for production issues.
3. **Fault Isolation:** Errors in one route don't crash the entire app.
4. **Progressive Enhancement:** Users can navigate away from broken pages.

### Next.js 16 Error Boundary Requirements

- Must be `'use client'` components (required by React error boundaries)
- Must be named `error.tsx` (Next.js convention)
- Automatically wraps route segment in error boundary
- Receives `error` and `reset` props

### Mobile Considerations

- Touch targets for buttons (✓ already met with 44px min-height)
- Error messages must be readable on small screens
- Reset button should be prominent and easy to tap
- Fallback navigation should always be available

---

## Impact Assessment

### Current State (19% coverage)
- 4 of 21 routes protected
- 81% of routes will crash to white screen on error
- No error tracking in production
- Poor user experience on failures

### Target State (100% coverage)
- All 21 routes protected
- Graceful error handling throughout app
- Error tracking for production debugging
- Professional user experience

### Risk Mitigation
- **Before:** Unhandled errors crash entire route → user loses work → support tickets
- **After:** Errors contained to route → user can retry or navigate → errors logged for fixing

---

## Estimated Effort

| Phase | Routes | Time | Notes |
|-------|--------|------|-------|
| Phase 1 (P0) | 3 | 2 hours | Copy template, customize messages |
| Phase 2 (P1) | 5 | 3 hours | Copy template, customize messages |
| Phase 3 (P2) | 9 | 4 hours | Copy template, customize messages |
| Phase 4 (Tracking) | - | 8 hours | Sentry integration, testing |
| **Total** | **17** | **17 hours** | |

---

## Testing Checklist

After adding error boundaries:

- [ ] Trigger error in each route (throw new Error in page.tsx)
- [ ] Verify error UI renders correctly
- [ ] Test reset button functionality
- [ ] Test fallback navigation button
- [ ] Verify error logging in console
- [ ] Check mobile responsiveness
- [ ] Verify dev-only error details show in development
- [ ] Verify error details hidden in production

---

## Related Issues

- Error tracking integration (Sentry/LogRocket) not yet implemented
- No global error handling strategy documented
- No error monitoring/alerting configured

---

**End of Audit**
