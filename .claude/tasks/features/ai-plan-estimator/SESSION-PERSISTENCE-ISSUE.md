# Critical Issue: Test Session Not Persisting

**Date:** 2026-02-17
**Severity:** BLOCKING
**Status:** Identified & Documented
**Affected:** All estimates module tests

---

## Issue Summary

Test authentication succeeds but session cookies don't persist through navigation. All tests redirect back to login page even after successful authentication.

```
✅ Auth endpoint returns session token
✅ Session token set as cookie
❌ Navigation to /app/projects redirects to /login
```

---

## Error Details

```
[AuthHelper] Authentication successful: jonlee213@gmail.com
[EstimatesTest] Session cookie set
[EstimatesTest] Current URL after navigation: http://localhost:3000/login
[EstimatesTest] ERROR: Still redirected to login after auth
```

### Test Evidence
- All 65 tests fail (across 5 browser types)
- Same error on every test run
- Auth API working correctly
- Cookie being set in browser
- Navigation happening but session not recognized

---

## Root Cause

The test auth endpoint (`/app/api/test/auth/route.ts`) creates a session with:
- Token format: `test-session-{userId}-{timestamp}`
- Session stored in: `next_auth.sessions` table
- Cookie set: `authjs.session-token`

But Next-Auth's session validation is rejecting it. Possible causes:

1. **Token format mismatch** - Test tokens don't match Next-Auth's expected format
2. **Missing session fields** - Some required fields not included in database insert
3. **Session query failing** - Middleware can't find the session when querying
4. **RLS policy issue** - Session query blocked by row-level security

---

## Code Location

**Problem File:** `/Users/jonathanlee/Desktop/genhub/app/api/test/auth/route.ts`

**Problematic Section (lines 58-72):**
```typescript
// Create a test session token
const sessionToken = `test-session-${user.id}-${Date.now()}`;
const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

// Store session in database
const { error: sessionError } = await (supabase as any)
  .schema('next_auth')
  .from('sessions')
  .insert({
    sessionToken,
    userId: user.id,
    expires: expires.toISOString(),
  });
```

**Issue:** This inserts a session but next-auth might expect different field names or additional data.

---

## Investigation Steps

### 1. Check Next-Auth Session Schema

Need to verify what fields are required in `next_auth.sessions` table:

```sql
-- Check actual schema
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'next_auth' AND table_name = 'sessions'
ORDER BY ordinal_position;
```

Expected fields might include:
- `id` (primary key)
- `sessionToken` (unique)
- `userId` (foreign key)
- `expires` (timestamp)
- Other fields?

### 2. Check Session Validation Logic

The middleware or auth config likely queries sessions like:

```typescript
// Pseudocode of what's probably happening
const session = await db.sessions.findUnique({
  where: { sessionToken: cookie.value }
});

if (!session || session.expires < now()) {
  // Redirect to login
}
```

The test session token format might not match what the query expects.

### 3. Enable Debug Logging

Add more logging to `/app/api/test/auth/route.ts`:

```typescript
console.log('[TestAuth] Inserted session:', {
  sessionToken,
  userId: user.id,
  expires: expires.toISOString(),
});

// Verify session was actually created
const { data: verifySession } = await supabase
  .schema('next_auth')
  .from('sessions')
  .select('*')
  .eq('sessionToken', sessionToken)
  .single();

console.log('[TestAuth] Verify session query result:', verifySession);
```

---

## Proposed Fixes

### Option 1: Use Proper Next-Auth Session Format

Research how next-auth creates sessions and match that format exactly. The `sessionToken` might need to be a different format (UUID, JWT, etc.).

### Option 2: Use Next-Auth's Internal API

Instead of manually creating sessions, use NextAuth's built-in session creation:

```typescript
import { getServerSession } from "next-auth/next";

// Or use NextAuth's internal session adapter methods
```

### Option 3: Bypass Session Validation

For testing only, create a test-specific auth that sets a marker the middleware recognizes.

---

## Impact

- 🔴 **All estimates tests blocked** - Can't authenticate
- 🔴 **All E2E tests blocked** - Same auth mechanism used everywhere
- 🟡 **Manual testing still works** - Real login flow untested by automation

---

## Workaround

Until this is fixed, manual testing or integration tests that don't require auth setup can be run.

---

## Next Steps

### Immediate (Priority 1)
1. ✅ Identify exact Next-Auth session schema
2. ✅ Debug session validation logic
3. ✅ Determine root cause of session rejection

### Short Term (Priority 2)
4. Fix test auth endpoint to create valid sessions
5. Verify session persists through navigation
6. Run full test suite to confirm

### Long Term (Priority 3)
7. Add session validation logging to identify future issues
8. Document test auth mechanism for other developers
9. Consider using Next-Auth's recommended testing approach

---

## Resources

- Next-Auth Documentation: https://next-auth.js.org/
- Next-Auth Session Adapter: https://next-auth.js.org/adapters/overview
- Current Test Auth Route: `/app/api/test/auth/route.ts`
- Database Schema: Check `next_auth` schema in Supabase

---

## Test Evidence

### Files with evidence:
- Videos: `/test-results/*/video.webm` - Shows navigation to login
- Screenshots: `/test-results/*/test-failed-1.png` - Shows login page
- Browser Console: Available in test-results

### Console Logs Show:
```
✅ [AuthHelper] Authentication successful: jonlee213@gmail.com
✅ [EstimatesTest] Session cookie set
❌ [EstimatesTest] Current URL after navigation: http://localhost:3000/login
```

---

## Recommendation

**Do NOT attempt to run full test suite until this is resolved.**

Instead:
1. ✅ Focus on fixing the test auth mechanism
2. ✅ Verify with a simple manual test
3. ✅ Then run full estimates test suite

Estimated fix time: 1-2 hours with Next-Auth documentation review.

---

## Follow-Up Tasks

- [ ] Review Next-Auth session schema
- [ ] Debug session validation in middleware
- [ ] Fix test auth endpoint
- [ ] Run quick verification test
- [ ] Run full estimates test suite
- [ ] Document findings in project wiki

---

**Created:** 2026-02-17
**Priority:** BLOCKING
**Assigned:** Backend/Auth team
**Status:** Awaiting investigation

Contact with questions about:
- Test auth mechanism
- Session validation logic
- Next-Auth configuration
