# Session 15 Context - Critical Fixes for Chat System Push Notifications

## Current Task
Fix critical and high-priority issues identified in code review of Tasks 0012-0015 (Push Notifications System)

## Completed

### ✅ C1: Service Worker Environment Variables (CRITICAL)
**Date:** 2025-12-30
**Status:** RESOLVED

**Problem:** Service Worker had hardcoded placeholder strings instead of actual Firebase credentials
- Push notifications would completely fail in production
- Firebase initialization would throw authentication errors

**Solution:** Created build-time environment variable injection system
- Created `scripts/inject-sw-env.js` - Node.js script to inject Firebase env vars
- Updated `package.json` with `predev` and `prebuild` scripts
- Script validates all required Firebase environment variables
- Replaces placeholder strings with actual values before build
- Provides helpful error messages if variables are missing

**Files Created:**
- `scripts/inject-sw-env.js`
- `docs/FIREBASE_SETUP_GUIDE.md`
- `docs/CRITICAL-FIX-SERVICE-WORKER-ENV-VARS.md`

**Files Modified:**
- `package.json` - Added predev and prebuild scripts

**Documentation:** `docs/CRITICAL-FIX-SERVICE-WORKER-ENV-VARS.md`

---

### ✅ H1: useBadgeCount Hook - Wrong Supabase Client Import (HIGH)
**Date:** 2025-12-30
**Status:** RESOLVED

**Problem:** `useBadgeCount` hook was importing from `@/utils/supabase/client`
- This file imports `auth` which uses server-only modules (nodemailer)
- Would cause build errors: "Cannot find module 'child_process'"
- PWA badge API would not work

**Solution:** Replaced with browser-safe Supabase client
- Changed import from `createClient` (client.ts) to `getBrowserClient` (browser.ts)
- Updated both instances in the hook (lines 41 and 101)
- Aligns with established pattern used by 5 other hooks

**Files Modified:**
- `lib/hooks/useBadgeCount.ts` - Lines 4, 41, 101

**Files Created:**
- `docs/FIX-H1-USEBADGECOUNT-HOOK.md`

**Documentation:** `docs/FIX-H1-USEBADGECOUNT-HOOK.md`

---

## In Progress
None - All critical and high priority issues resolved

## Next Steps

### 1. Database Migrations (Not Yet Applied)
The following migrations were created but need to be applied via MCP Supabase:
- `027_create_message_reactions.sql` - Message reactions table
- `028_add_message_reply_index.sql` - Performance indexes for threaded replies
- `029_add_message_attachments.sql` - File/photo attachments
- `030_push_subscriptions.sql` - Push notification subscriptions

**Action Required:**
```bash
# Use MCP Supabase to apply migrations
mcp__supabase__apply_migration name:"create_message_reactions" query:"<SQL>"
mcp__supabase__apply_migration name:"add_message_reply_index" query:"<SQL>"
mcp__supabase__apply_migration name:"add_message_attachments" query:"<SQL>"
mcp__supabase__apply_migration name:"push_subscriptions" query:"<SQL>"

# After migrations, regenerate types
mcp__supabase__generate_typescript_types
```

### 2. Firebase Project Setup
**Action Required:**
1. Create Firebase project at https://console.firebase.google.com/
2. Enable Cloud Messaging
3. Generate VAPID key (Web Push certificate)
4. Get Server Key (for Edge Function)
5. Add all credentials to `.env.local`

**Required Environment Variables:**
```bash
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_VAPID_KEY=
FCM_SERVER_KEY=  # Server-only, for Edge Function
```

**Reference:** `docs/FIREBASE_SETUP_GUIDE.md`

### 3. Deploy Supabase Edge Function
**Action Required:**
```bash
# Deploy the Edge Function
npx supabase functions deploy send-push-notification --no-verify-jwt

# Set the FCM_SERVER_KEY secret
npx supabase secrets set FCM_SERVER_KEY=<your-server-key>
```

### 4. End-to-End Testing
Once Firebase is configured and migrations are applied:
1. Test threaded replies (Task 0005)
2. Test message reactions (Task 0006)
3. Test typing indicators (Task 0007)
4. Test online presence (Task 0008)
5. Test file/photo sharing (Task 0009)
6. Test @mention autocomplete (Task 0010)
7. Test entity preview cards (Task 0011)
8. Test push notification permissions (Task 0012)
9. Test browser notifications (Task 0013)
10. Test mobile notifications (Task 0014)
11. Test notification preferences UI (Task 0015)

### 5. Production Deployment
- Verify all environment variables are set in hosting platform
- Verify `prebuild` script runs in CI/CD pipeline
- Monitor Firebase Cloud Messaging console for errors
- Test on multiple browsers (Chrome, Firefox, Safari 16+)

---

## Key Decisions

1. **Build-Time Injection for Service Workers**
   - Service Workers cannot access `process.env` at runtime
   - Solution: Inject environment variables at build time using Node.js script
   - Script runs automatically via `predev` and `prebuild` npm scripts

2. **Browser-Safe Supabase Client**
   - Client components must NEVER import from `client.ts` or `server.ts`
   - Use `getBrowserClient()` from `browser.ts` for Realtime subscriptions
   - Use Server Actions for all data mutations

3. **Construction Theme Consistency**
   - All UI components use construction theme colors:
     - Navy blue (#001B51) - Primary
     - Dark gray (#3C3C3C) - Accents
     - Yellow (#FFB627) - Hazard/warnings
   - Industrial design elements (riveted borders, diagonal stripes, metal textures)

4. **Agent Delegation Pattern**
   - `backend-engineer` for all database and server-side work
   - `frontend-builder` for all UI implementation (uses `frontend-design` plugin)
   - `code-reviewer` for security audits and bug detection
   - All agents use MCP Supabase for database operations

---

## Technical Patterns Observed

### Supabase Realtime Subscriptions
```typescript
const supabase = getBrowserClient();

const channel = supabase
  .channel('channel-name')
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, callback)
  .on('broadcast', { event: 'typing' }, callback)
  .on('presence', { event: 'sync' }, callback)
  .subscribe();

return () => supabase.removeChannel(channel);
```

### Server Actions with Authentication
```typescript
'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function myAction(input: InputSchema) {
  const validatedInput = schema.parse(input);
  const supabase = await createClient();

  // Perform database operation
  const { data, error } = await supabase.from('table').insert(validatedInput);

  if (error) return { error: error.message };

  revalidatePath('/app/path');
  return { success: true, data };
}
```

### Environment Variable Injection (Service Workers)
```javascript
// Build-time injection script
const envVars = { NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY };
let swContent = fs.readFileSync(swPath, 'utf8');
Object.entries(envVars).forEach(([key, value]) => {
  swContent = swContent.replace(`'${key}'`, `'${value}'`);
});
fs.writeFileSync(swPath, swContent, 'utf8');
```

---

## Files Modified This Session

1. `scripts/inject-sw-env.js` (NEW)
2. `package.json` (Modified - added predev/prebuild)
3. `docs/FIREBASE_SETUP_GUIDE.md` (NEW)
4. `docs/CRITICAL-FIX-SERVICE-WORKER-ENV-VARS.md` (NEW)
5. `lib/hooks/useBadgeCount.ts` (Modified - lines 4, 41, 101)
6. `docs/FIX-H1-USEBADGECOUNT-HOOK.md` (NEW)

---

## Session Summary

This session focused on fixing the two critical/high priority issues identified in the code review of the Push Notifications System (Tasks 0012-0015):

1. **C1 (Critical):** Service Worker environment variable exposure - Fixed with build-time injection system
2. **H1 (High):** Wrong Supabase client in useBadgeCount hook - Fixed with browser-safe client

Both issues are now resolved and fully documented. The system is ready for Firebase configuration and end-to-end testing.

---

**Session Start:** 2025-12-30 (continued from summarized context)
**Session End:** 2025-12-30
**Agent:** Claude Sonnet 4.5
**Primary Focus:** Critical bug fixes for push notification system
