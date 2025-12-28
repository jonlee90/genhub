# Code Review: Team Member Management (Epic 4, Task 1)

**Review Date**: 2025-12-06
**Reviewed By**: Claude Code (code-reviewer agent)
**Scope**: Team invitation, role updates, and deactivation functionality

---

## Executive Summary

The team member management implementation demonstrates strong security fundamentals with proper authentication/authorization checks, comprehensive input validation, and good separation of concerns between Server Components and Client Components. However, there are **critical security vulnerabilities** related to RLS bypass, placeholder user creation, and potential race conditions that must be addressed before production deployment.

**Overall Grade**: B- (Good foundation, critical issues must be fixed)

---

## Critical Issues (Must Fix Before Production)

### 🔴 CRITICAL: RLS Bypass with Service Role Key

**Location**: `app/actions/team.ts`, `app/actions/accept-invite.ts`, `utils/supabase/server.ts`

**Issue**: All server actions use `createClient()` which returns a Supabase client with the **service role key**, completely bypassing Row Level Security (RLS).

**Evidence**:
```typescript
// utils/supabase/server.ts (Lines 6-18)
const getSupabaseClient = async () => {
  const session = await auth()
  if (!session?.user) {
    redirect('/')
  }
  // Use service role key for server-side operations
  // This bypasses RLS, so authorization must be manually enforced
  return supabaseCreateClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,  // ⚠️ Service role - bypasses RLS
  )
}
```

**Security Implications**:
1. **Authorization is only enforced in application code**, not at the database level
2. Any bug in the authorization logic (e.g., missing `role !== 'gc_admin'` check) would allow unauthorized access
3. RLS policies defined in `003_company_users.sql` and `04_rls_policies.sql` are completely ineffective
4. Defense-in-depth principle is violated - no database-level protection

**Example Attack Scenario**:
If a developer accidentally removes the role check in `inviteTeamMember()`:
```typescript
// Oops, commented out for testing and forgot to re-enable
// if (role !== 'gc_admin') {
//   return { error: 'Insufficient permissions' };
// }
```
Now ANY authenticated user can invite team members to ANY company, because RLS is bypassed.

**Recommendation**:
Create a separate Supabase client function that uses the user's JWT token (respects RLS) for all operations except those that explicitly require admin privileges:

```typescript
// utils/supabase/server.ts
export async function createAuthenticatedClient() {
  const session = await auth()
  if (!session?.user) {
    redirect('/')
  }

  // Use anon key with user's session - respects RLS
  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Set the user's JWT token
  // Note: This requires next-auth to provide a Supabase JWT
  // or use Supabase Auth directly
  await supabase.auth.setSession({
    access_token: session.supabaseAccessToken,
    refresh_token: session.supabaseRefreshToken
  })

  return supabase
}

// Only use admin client for operations that MUST bypass RLS
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  )
}
```

**Impact**: Critical - This is a fundamental security architecture issue

---

### 🔴 CRITICAL: Placeholder User Creation Without Auth

**Location**: `app/actions/team.ts` (Lines 186-210)

**Issue**: Creating placeholder user profiles for non-existent users is a **major security vulnerability** that could be exploited for account takeover.

**Code**:
```typescript
// Lines 186-210
if (!existingUser) {
  // User doesn't exist - create placeholder user profile
  // Note: The actual user will be created in next-auth when they sign in
  const placeholderId = randomUUID();  // ⚠️ Random UUID, not from auth provider!

  const userProfileData: UserProfileInsert = {
    id: placeholderId,  // ⚠️ We're creating the ID, not the auth system
    name: data.name,
    email: data.email.toLowerCase(),
  };

  const { data: newUser, error: createUserError } = await supabase
    .from('user_profiles')
    .insert(userProfileData)
    .select()
    .single();

  invitedUserId = newUser.id;
}
```

**Security Vulnerabilities**:

1. **UUID Mismatch**: The placeholder `id` (random UUID) will NEVER match the `id` created by next-auth when the user actually signs in
2. **Orphaned Records**: When the invited user signs in:
   - next-auth creates a new `user_profiles` record with a different ID
   - The placeholder record remains in the database
   - The `company_users` record points to the wrong user ID
   - The invitation is completely broken
3. **Account Takeover Risk**: If an attacker can guess or control the email, they could:
   - Have admin invite `attacker@example.com` (creates placeholder)
   - Attacker signs in with Google using same email
   - next-auth creates a new user with different ID
   - Original invitation is orphaned, but attacker might gain access through other means

**Data Flow Problem**:
```
Invitation Flow (Current - BROKEN):
1. Admin invites "john@example.com" → Creates user_profiles{id: uuid-1, email: "john@example.com"}
2. Creates company_users{user_id: uuid-1, status: 'invited', invitation_token: 'abc'}
3. John clicks invite link → Signs in with Google
4. next-auth creates user_profiles{id: uuid-2, email: "john@example.com"} ← Different ID!
5. acceptInvitation() tries to activate company_users{user_id: uuid-1} ← Wrong user!
6. John is authenticated but NOT a company member - BROKEN
```

**Recommendation**:
DO NOT create placeholder users. Instead, store invitation data in a separate `team_invitations` table:

```sql
-- New table for pending invitations
CREATE TABLE public.team_invitations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  email text NOT NULL,
  name text NOT NULL,
  role public.user_role NOT NULL,
  invitation_token uuid NOT NULL UNIQUE,
  invited_by uuid NOT NULL REFERENCES public.user_profiles(id),
  invited_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone DEFAULT (now() + interval '7 days'),
  status text DEFAULT 'pending', -- 'pending', 'accepted', 'expired'
  created_at timestamp with time zone DEFAULT now()
);

-- Modified flow:
-- 1. Insert into team_invitations (not user_profiles)
-- 2. When user signs in, find invitation by email
-- 3. Create company_users with REAL user ID from auth
-- 4. Mark invitation as 'accepted'
```

**Impact**: Critical - Invitation flow is fundamentally broken

---

### 🔴 CRITICAL: Invitation Token Security Issues

**Location**: `app/actions/team.ts`, `app/actions/accept-invite.ts`

**Issues**:

1. **No Expiration Time**: Tokens never expire
   ```typescript
   // Lines 213, 150 - No expiration check
   const invitationToken = randomUUID();
   ```

2. **No Rate Limiting**: No protection against token brute-forcing

3. **Token Not Cleared Properly on Reactivation**:
   ```typescript
   // Lines 149-169 - Reactivation flow
   if (existingMember.status === 'inactive') {
     const invitationToken = randomUUID();
     // Updates token but doesn't check if old token is still being used
   }
   ```

4. **Single-Use Token Not Enforced**: Token is cleared on accept, but no prevention of reuse before clearing

**Recommendations**:

```typescript
// Add expiration check
const TOKEN_EXPIRY_DAYS = 7;

// In validateInvitationToken
const invitedAt = new Date(companyUser.invited_at);
const expiresAt = new Date(invitedAt.getTime() + TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

if (new Date() > expiresAt) {
  return { success: false, error: 'This invitation has expired. Please request a new invitation.' };
}

// Add used_at timestamp
ALTER TABLE company_users ADD COLUMN invitation_used_at timestamp with time zone;

// In acceptInvitation, add atomic check-and-update
const { data, error } = await supabase
  .from('company_users')
  .update({
    status: 'active',
    activated_at: new Date().toISOString(),
    invitation_token: null,
    invitation_used_at: new Date().toISOString()
  })
  .eq('id', invitation.companyUserId)
  .eq('invitation_token', token) // ⚠️ Ensure token still matches
  .is('invitation_used_at', null) // ⚠️ Ensure not already used
  .select()
  .single();

if (error || !data) {
  return { success: false, error: 'This invitation has already been used or is no longer valid.' };
}
```

**Impact**: High - Token security is weak, allowing replay attacks and no expiration

---

### 🟠 HIGH: Race Condition in Duplicate Invite Check

**Location**: `app/actions/team.ts` (Lines 131-143)

**Issue**: Time-of-check to time-of-use (TOCTOU) race condition when checking for existing members.

**Code**:
```typescript
// Lines 131-147
const { data: existingMember } = await supabase
  .from('company_users')
  .select('id, status, role')
  .eq('company_id', companyId)
  .eq('user_id', existingUser.id)
  .maybeSingle();

if (existingMember) {
  if (existingMember.status === 'active') {
    return { error: 'This user is already an active member' };
  }
  // ... check invited status ...
}

// Later: Insert company_users (Line 226-230)
const { data: companyUser, error: insertError } = await supabase
  .from('company_users')
  .insert(companyUserData)
  .select()
  .single();
```

**Race Condition Scenario**:
```
Time  | Admin 1                          | Admin 2
------+----------------------------------+--------------------------------
T1    | Check: No existing member ✓      |
T2    |                                  | Check: No existing member ✓
T3    | Insert company_users ✓           |
T4    |                                  | Insert company_users ❌ Duplicate!
```

**Current Mitigation**: Database UNIQUE constraint catches this (Line 234-236), but it's caught as an error instead of being prevented.

**Recommendation**:
Use PostgreSQL's `INSERT ... ON CONFLICT` to handle this atomically:

```typescript
const { data: companyUser, error: insertError } = await supabase
  .from('company_users')
  .upsert(
    companyUserData,
    {
      onConflict: 'company_id,user_id',
      ignoreDuplicates: false
    }
  )
  .select()
  .single();

// Check if it was an update (user already existed)
if (companyUser && companyUser.created_at !== companyUser.updated_at) {
  // This was an update, not an insert
  if (companyUser.status === 'active') {
    return { error: 'This user is already an active member' };
  }
  // Update their status to invited
}
```

**Impact**: Medium-High - Can cause confusing error messages, minor data integrity issue

---

### 🟠 HIGH: Email Case Sensitivity Issues

**Location**: `app/actions/team.ts` (Lines 119, 195)

**Issue**: Inconsistent email normalization could lead to duplicate users with different casing.

**Code**:
```typescript
// Line 119 - Normalized correctly
.eq('email', data.email.toLowerCase())

// Line 195 - Also normalized
email: data.email.toLowerCase(),
```

**However**: The invitation link sends the email as-is, and the next-auth provider (Google) might return a different casing. This could cause the invited user lookup to fail.

**Scenario**:
1. Admin invites `John.Doe@Example.com` → Stored as `john.doe@example.com`
2. John signs in with Google → Google returns `john.doe@example.com` ✓ (Works)
3. BUT: If stored as `John.Doe@Example.com` in one place and `john.doe@example.com` in another → Mismatch

**Recommendation**:
Add database constraint and index on lowercase email:

```sql
-- Add case-insensitive unique constraint
CREATE UNIQUE INDEX idx_user_profiles_email_lower
  ON public.user_profiles(LOWER(email));

-- Add check constraint
ALTER TABLE public.user_profiles
  ADD CONSTRAINT email_lowercase_check
  CHECK (email = LOWER(email));
```

**Impact**: Medium - Could prevent users from accepting invitations if email casing doesn't match

---

## High Priority Issues

### 🟠 HIGH: Missing Transaction Boundaries

**Location**: `app/actions/team.ts` - All server actions

**Issue**: Multi-step database operations are not wrapped in transactions, leading to potential data inconsistencies.

**Example - Reactivation Flow** (Lines 149-169):
```typescript
// Step 1: Update company_users
const { error: reactivateError } = await supabase
  .from('company_users')
  .update({ /* ... */ })
  .eq('id', existingMember.id);

// ⚠️ If this fails, Step 1 is committed but user sees error
// ⚠️ No rollback mechanism

// Step 2: Revalidate cache (Lines 173-174)
revalidatePath('/app/team');
revalidateTag('team-members');

// Step 3: Return success (Lines 176-182)
return { success: true, /* ... */ };
```

**Failure Scenarios**:
1. Update succeeds → revalidatePath throws error → User sees error but DB is changed
2. Update succeeds → Network failure → Partial state
3. Notification insert fails (if added) → Inconsistent state

**Recommendation**:
Use Supabase transactions with RPC functions for multi-step operations:

```sql
-- Create stored procedure for atomic operations
CREATE OR REPLACE FUNCTION reactivate_team_member(
  p_company_user_id uuid,
  p_new_role user_role,
  p_invited_by uuid,
  p_invitation_token uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result json;
BEGIN
  -- Update company_users
  UPDATE company_users
  SET status = 'invited',
      role = p_new_role,
      invited_by = p_invited_by,
      invited_at = now(),
      invitation_token = p_invitation_token,
      updated_at = now()
  WHERE id = p_company_user_id;

  -- Insert notification
  INSERT INTO notifications (user_id, type, title, message)
  VALUES (
    (SELECT user_id FROM company_users WHERE id = p_company_user_id),
    'team_invited',
    'Re-invited to Team',
    'You have been re-invited to join the team'
  );

  -- Return result
  SELECT json_build_object('success', true) INTO v_result;
  RETURN v_result;

EXCEPTION WHEN OTHERS THEN
  -- Rollback happens automatically
  RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;
```

```typescript
// Call from server action
const { data, error } = await supabase.rpc('reactivate_team_member', {
  p_company_user_id: existingMember.id,
  p_new_role: data.role,
  p_invited_by: userId,
  p_invitation_token: invitationToken
});
```

**Impact**: High - Data inconsistencies possible under failure conditions

---

### 🟠 HIGH: Insufficient Error Information for Debugging

**Location**: All server actions

**Issue**: Generic error messages don't provide enough context for debugging or user action.

**Examples**:
```typescript
// Line 124
return { error: 'Failed to check existing user. Please try again.' };

// Line 237
return { error: 'Failed to invite team member. Please try again.' };

// Line 335
return { error: 'Failed to update team member role. Please try again.' };
```

**Problems**:
1. No error codes for client-side handling
2. "Please try again" is not actionable - what should user do differently?
3. No logging of actual error details
4. No way to track errors in monitoring systems

**Recommendation**:
Implement structured error responses with error codes:

```typescript
// types/errors.ts
export const TeamErrors = {
  USER_CHECK_FAILED: {
    code: 'TEAM_001',
    message: 'Unable to verify user account',
    userMessage: 'We encountered an issue checking your account. Please contact support if this persists.',
    severity: 'error'
  },
  INVITE_FAILED: {
    code: 'TEAM_002',
    message: 'Failed to send team invitation',
    userMessage: 'Could not send invitation. Please verify the email address and try again.',
    severity: 'error'
  },
  // ...
} as const;

// Error response type
type ErrorResponse = {
  success: false;
  error: {
    code: string;
    message: string;
    userMessage: string;
    details?: unknown;
  };
};

// Usage in server action
if (userCheckError) {
  console.error('[TEAM_001] Error checking existing user:', {
    error: userCheckError,
    email: data.email,
    companyId,
    userId,
    timestamp: new Date().toISOString()
  });

  return {
    success: false,
    error: {
      code: TeamErrors.USER_CHECK_FAILED.code,
      message: TeamErrors.USER_CHECK_FAILED.message,
      userMessage: TeamErrors.USER_CHECK_FAILED.userMessage
    }
  };
}
```

**Impact**: High - Difficult to debug production issues, poor user experience

---

### 🟠 HIGH: No Protection Against Self-Modification in Update/Deactivate

**Location**: `app/actions/team.ts`

**Issue**: While there are checks preventing self-modification, they can be bypassed if the `userId` parameter is manipulated.

**Current Protection**:
```typescript
// updateTeamMemberRole (Line 296-298)
if (userId === currentUserId) {
  return { error: 'You cannot change your own role.' };
}

// deactivateTeamMember (Line 398-400)
if (userId === currentUserId) {
  return { error: 'You cannot deactivate your own account.' };
}
```

**Bypass Scenario**:
The check relies on comparing the `userId` parameter with `currentUserId` from the session. However:
1. The `userId` comes from the **client** (form data or function parameter)
2. If a malicious client sends a different `userId`, the check passes
3. The server then tries to update that user (fails due to DB constraints, but still a logic error)

**Proof of Concept**:
```typescript
// Malicious client code
const attackerId = 'attacker-uuid';
const victimId = 'victim-uuid';

// Call server action with victim's ID
await updateTeamMemberRole(victimId, 'field_worker');

// Check passes because: victimId !== attackerId ✓
// But this SHOULD fail because attacker shouldn't modify anyone
```

**Actual Current Behavior**: The attack fails because of RLS bypass (all users use service role), so authorization IS checked. BUT this is defense through obscurity - the logic is wrong.

**Recommendation**:
Add server-side validation that the target user is in the same company:

```typescript
// Improved check in updateTeamMemberRole
const { data: targetMember, error: fetchError } = await supabase
  .from('company_users')
  .select('id, role, user_id, status, company_id')
  .eq('company_id', companyId) // ⚠️ Must be in same company
  .eq('user_id', userId)
  .maybeSingle();

if (!targetMember) {
  return { error: 'Team member not found in your company.' };
}

// Still prevent self-modification
if (targetMember.user_id === currentUserId) {
  return { error: 'You cannot change your own role.' };
}
```

**Impact**: Medium-High - Logic error, but currently mitigated by other checks

---

## Medium Priority Issues

### 🟡 MEDIUM: Notification Type Mismatch

**Location**: `app/actions/team.ts` (Lines 342-349, 456-463)

**Issue**: Using incorrect notification type `'mention'` instead of dedicated role/deactivation types.

**Code**:
```typescript
// Line 343-349 - Role update notification
await supabase.from('notifications').insert({
  user_id: userId,
  type: 'mention', // ⚠️ Wrong type - should be 'role_changed' or similar
  title: 'Role Updated',
  message: `Your role has been updated to ${newRole.replace('_', ' ')}`,
  link: '/app/team',
});

// Line 457-463 - Deactivation notification
await supabase.from('notifications').insert({
  user_id: userId,
  type: 'mention', // ⚠️ Wrong type - should be 'account_deactivated' or similar
  title: 'Account Deactivated',
  message: 'Your account has been deactivated by an administrator.',
  link: '/app',
});
```

**Problems**:
1. Cannot filter notifications by actual type (all show as "mentions")
2. Frontend notification icons/styling will be wrong
3. Cannot implement type-specific notification preferences
4. Violates database schema intent (notification_type enum)

**Available Types** (from `02_enums.sql`):
```sql
CREATE TYPE public.notification_type AS ENUM (
  'task_assigned',
  'task_completed',
  'mention',
  'deadline_reminder',
  'project_update',
  'team_invited',
  -- ... others
);
```

**Recommendation**:
1. Add new notification types to the enum:
```sql
-- Add to migration
ALTER TYPE public.notification_type ADD VALUE 'role_changed';
ALTER TYPE public.notification_type ADD VALUE 'account_deactivated';
```

2. Update the notification calls:
```typescript
// Role update
await supabase.from('notifications').insert({
  user_id: userId,
  type: 'role_changed',
  title: 'Role Updated',
  message: `Your role has been updated to ${newRole.replace('_', ' ')}`,
  link: '/app/team',
});

// Deactivation
await supabase.from('notifications').insert({
  user_id: userId,
  type: 'account_deactivated',
  title: 'Account Deactivated',
  message: 'Your account has been deactivated by an administrator.',
  link: '/app',
});
```

**Impact**: Medium - Notifications work but are incorrectly categorized

---

### 🟡 MEDIUM: Incomplete Invitation Acceptance Flow

**Location**: `app/accept-invite/complete/page.tsx`, `app/actions/accept-invite.ts`

**Issue**: The invitation acceptance flow has a critical gap in user ID matching.

**Current Flow**:
```
1. User clicks invite link → /accept-invite?token=abc
2. User signs in with Google/Email
3. next-auth creates session with user.id = X
4. Redirect to /accept-invite/complete?token=abc
5. acceptInvitation(token) activates company_users entry
```

**Problem**: Step 5 does NOT verify that the authenticated user's email matches the invitation email!

**Code Analysis** (`accept-invite.ts`):
```typescript
// acceptInvitation function (Lines 144-203)
export async function acceptInvitation(token: string) {
  // ⚠️ No session check - doesn't verify WHO is accepting

  const tokenValidation = await validateInvitationToken(token);
  if (!tokenValidation.success) {
    return { success: false, error: tokenValidation.error };
  }

  const invitation = tokenValidation.invitation;

  // ⚠️ Updates company_users without checking if current user matches invitation.email
  const { error: updateError } = await supabase
    .from('company_users')
    .update({
      status: 'active',
      activated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      invitation_token: null,
    })
    .eq('id', invitation.companyUserId);
}
```

**Attack Scenario**:
```
1. Admin invites victim@company.com → token=abc, user_id=uuid-1
2. Attacker intercepts invite link with token=abc
3. Attacker signs in as attacker@evil.com (creates user_id=uuid-2)
4. Attacker visits /accept-invite/complete?token=abc
5. acceptInvitation activates company_users{user_id: uuid-1, status='active'}
6. Victim can now access company, attacker cannot
   BUT: If invitation flow is changed to update user_id, attacker gains access!
```

**Current Mitigation**: The flow is broken (placeholder user problem), so this attack doesn't work. BUT if the placeholder issue is fixed, this becomes a vulnerability.

**Recommendation**:
Add email verification in the completion flow:

```typescript
// accept-invite/complete/page.tsx
async function CompleteInviteWrapper({ searchParams }: { searchParams: SearchParams }) {
  const session = await auth();

  if (!session?.user?.email) {
    redirect('/');
  }

  const params = await searchParams;
  const token = params.token as string | undefined;

  if (!token) {
    return <CompleteInviteContent error="Missing invitation token" />;
  }

  // ⚠️ ADD: Verify invitation email matches authenticated user
  const validation = await validateInvitationToken(token);
  if (!validation.success) {
    return <CompleteInviteContent error={validation.error} />;
  }

  // ⚠️ ADD: Email verification
  if (validation.invitation.email.toLowerCase() !== session.user.email.toLowerCase()) {
    return <CompleteInviteContent
      error="This invitation is for a different email address. Please sign out and sign in with the correct account."
    />;
  }

  // Accept the invitation
  const result = await acceptInvitation(token, session.user.id); // ⚠️ Pass user ID

  // ...
}
```

```typescript
// accept-invite.ts - Updated acceptInvitation
export async function acceptInvitation(token: string, authenticatedUserId: string) {
  // ... validation ...

  // ⚠️ ADD: Verify user ID matches (once placeholder issue is fixed)
  if (invitation.userId !== authenticatedUserId) {
    return {
      success: false,
      error: 'User ID mismatch. Please sign in with the invited email address.'
    };
  }

  // ... rest of function ...
}
```

**Impact**: Medium - Currently not exploitable due to other issues, but will become High once placeholder user issue is fixed

---

### 🟡 MEDIUM: Cache Invalidation Too Broad

**Location**: `app/actions/team.ts` (Lines 173-174, 249-250, 352-353, 466-467)

**Issue**: Using `revalidatePath('/app/team')` invalidates entire page, not just team data.

**Code**:
```typescript
// Lines 173-174, 249-250, 352-353, 466-467 (repeated pattern)
revalidatePath('/app/team');
revalidateTag('team-members');
```

**Problems**:
1. Invalidates all data on `/app/team`, not just team member list
2. Causes unnecessary re-fetches of unrelated data
3. No granular cache control
4. Poor performance if page has multiple data sources

**Recommendation**:
Use more granular cache tagging:

```typescript
// In team data fetching function
export async function getTeamMembers(companyId: string) {
  const members = await fetch(`/api/team/${companyId}`, {
    next: {
      tags: [`team-members-${companyId}`, 'team-members'],
      revalidate: 60
    }
  });
  return members;
}

// In server actions
revalidateTag(`team-members-${companyId}`); // ⚠️ Only invalidate this company's members
```

**Impact**: Medium - Performance issue, especially with large datasets

---

### 🟡 MEDIUM: Missing Input Sanitization for Display

**Location**: `app/actions/team.ts`, `app/accept-invite/AcceptInviteContent.tsx`

**Issue**: User-provided name and email are displayed without sanitization, potential XSS risk.

**Code**:
```typescript
// team.ts - Line 24
name: z.string().min(1, 'Name is required').max(200),
// ⚠️ No sanitization, allows special characters

// AcceptInviteContent.tsx - Lines 176, 182, 188
<span className="text-gray-900 font-bold">{invitation.email}</span>
<span className="text-gray-900 font-bold">{invitation.name}</span>
<span className="text-gray-900 font-bold">{invitation.companyName}</span>
// ⚠️ Direct rendering without sanitization
```

**Attack Vector**:
```typescript
// Malicious admin invites with crafted name
inviteTeamMember({
  email: 'victim@example.com',
  name: '<img src=x onerror=alert(document.cookie)>',
  role: 'field_worker'
});

// When victim views invite page, XSS executes
// (Note: React auto-escapes by default, but good to be explicit)
```

**Current Mitigation**: React auto-escapes JSX expressions, so this is mostly safe. However:
1. If data is ever used in `dangerouslySetInnerHTML`, XSS is possible
2. SQL injection is possible if name contains special characters and is used in raw SQL
3. Best practice is to sanitize on input, not rely on output escaping

**Recommendation**:
Add input sanitization to Zod schemas:

```typescript
import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify'; // or similar

const sanitizeString = (str: string) => {
  // Remove HTML tags
  const cleaned = str.replace(/<[^>]*>/g, '');
  // Remove control characters
  return cleaned.replace(/[\x00-\x1F\x7F]/g, '');
};

const inviteTeamMemberSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase().trim(),
  name: z.string()
    .min(1, 'Name is required')
    .max(200)
    .transform(sanitizeString)
    .refine((val) => val.length > 0, 'Name cannot be empty after sanitization'),
  role: z.enum([/* ... */]),
});
```

**Impact**: Low-Medium - React provides default protection, but defense-in-depth is recommended

---

### 🟡 MEDIUM: No Audit Logging for Team Changes

**Location**: All server actions in `app/actions/team.ts`

**Issue**: No audit trail for team member changes (invitations, role updates, deactivations).

**Current State**:
```typescript
// Lines 339-341 (in code comments)
// Log activity using task_activity pattern (extend to team activity later if needed)
// For now, we'll skip logging as there's no team_activity table yet
// TODO: Add team activity logging when team_activity table is created

// Lines 454-455
// TODO: Log activity in team_activity table when created
```

**Problems**:
1. No way to track WHO invited WHOM and WHEN
2. Cannot investigate security incidents
3. No compliance audit trail
4. Cannot undo changes (no history)

**Recommendation**:
Create `team_activity` table and log all changes:

```sql
CREATE TABLE public.team_activity (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  actor_user_id uuid NOT NULL REFERENCES public.user_profiles(id),
  target_user_id uuid REFERENCES public.user_profiles(id),
  action text NOT NULL, -- 'invited', 'role_changed', 'deactivated', 'reactivated'
  details jsonb, -- Additional details about the change
  created_at timestamp with time zone DEFAULT now()
);

CREATE INDEX idx_team_activity_company ON public.team_activity(company_id);
CREATE INDEX idx_team_activity_actor ON public.team_activity(actor_user_id);
CREATE INDEX idx_team_activity_target ON public.team_activity(target_user_id);
```

```typescript
// In server actions
await supabase.from('team_activity').insert({
  company_id: companyId,
  actor_user_id: currentUserId,
  target_user_id: userId,
  action: 'role_changed',
  details: {
    old_role: existingMember.role,
    new_role: newRole,
    timestamp: new Date().toISOString()
  }
});
```

**Impact**: Medium - Important for production systems, but not a security vulnerability

---

## Low Priority Issues

### 🟢 LOW: Hardcoded Timeout Values

**Location**: `app/accept-invite/complete/CompleteInviteContent.tsx` (Line 21)

**Issue**: Hardcoded 2-second redirect timeout.

**Code**:
```typescript
// Line 21-23
useEffect(() => {
  if (success) {
    const timer = setTimeout(() => {
      router.push('/app');
    }, 2000); // ⚠️ Hardcoded 2 seconds
    return () => clearTimeout(timer);
  }
}, [success, router]);
```

**Recommendation**: Extract to constant and make configurable.

```typescript
const REDIRECT_DELAY_MS = 2000; // or from config

const timer = setTimeout(() => {
  router.push('/app');
}, REDIRECT_DELAY_MS);
```

**Impact**: Low - Minor code quality issue

---

### 🟢 LOW: Inconsistent Error Response Types

**Location**: All server actions

**Issue**: Error responses are inconsistent across functions.

**Examples**:
```typescript
// inviteTeamMember (Line 109)
return { error: 'Validation failed', fieldErrors: errors };

// updateTeamMemberRole (Line 291)
return { error: 'Invalid input', fieldErrors: validation.error.flatten().fieldErrors };

// deactivateTeamMember (Line 393)
return { error: 'Invalid user ID' }; // ⚠️ No fieldErrors property
```

**Recommendation**: Create consistent return type:

```typescript
type ServerActionResult<T = void> =
  | { success: true; data: T; message?: string }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };
```

**Impact**: Low - Minor type safety and consistency issue

---

### 🟢 LOW: Missing JSDoc for Public Functions

**Location**: All server actions

**Issue**: While functions have some comments, JSDoc is incomplete.

**Current**:
```typescript
/**
 * Invite a new team member to the company
 * Only GC Admins can invite team members
 *
 * @param formData - Form data containing email, name, and role
 * @returns Success with invitation link or error message
 */
```

**Recommendation**: Add comprehensive JSDoc with examples:

```typescript
/**
 * Invite a new team member to the company
 *
 * @description
 * Creates a team invitation for a new or existing user. Generates a secure
 * invitation token and creates a company_users entry with status='invited'.
 *
 * @permission GC Admin only
 *
 * @param formData - Form data from the invitation form
 * @param formData.email - Email address of the invitee (required, valid email)
 * @param formData.name - Full name of the invitee (required, 1-200 chars)
 * @param formData.role - Role to assign (required, one of: gc_admin, project_manager, etc.)
 *
 * @returns {Promise<InviteResult>} Object containing:
 *   - success: true if invitation sent successfully
 *   - invitationLink: URL to share with the invitee
 *   - companyUser: The created company_users record
 *   - error: Error message if failed
 *   - fieldErrors: Field-specific validation errors
 *
 * @throws {Error} If user is not authenticated or not a GC Admin
 *
 * @example
 * const result = await inviteTeamMember(formData);
 * if (result.success) {
 *   console.log('Invite sent:', result.invitationLink);
 * } else {
 *   console.error('Error:', result.error);
 * }
 *
 * @see {@link acceptInvitation} for the acceptance flow
 */
export async function inviteTeamMember(formData: FormData): Promise<InviteResult> {
  // ...
}
```

**Impact**: Low - Documentation quality issue

---

## Architecture & Best Practices Analysis

### ✅ GOOD: Server/Client Component Separation

**Location**: `app/accept-invite/` structure

The implementation correctly separates Server Components (data fetching, authentication) from Client Components (interactivity):

```typescript
// page.tsx - Server Component ✓
export default async function AcceptInvitePage({ searchParams }) {
  return (
    <Suspense fallback={<AcceptInviteLoading />}>
      <AcceptInviteWrapper searchParams={searchParams} />
    </Suspense>
  );
}

// AcceptInviteContent.tsx - Client Component ✓
'use client';
export function AcceptInviteContent({ invitation, token, error }) {
  const [isAccepting, setIsAccepting] = useState(false);
  // ... interactive form ...
}
```

**Benefits**:
- Server Components fetch data securely without exposing secrets
- Client Components handle interactivity (form state, loading states)
- Suspense boundaries provide good loading UX
- Proper error boundaries

---

### ✅ GOOD: Zod Validation Schemas

**Location**: `app/actions/team.ts` (Lines 22-35)

Input validation is comprehensive and uses Zod:

```typescript
const inviteTeamMemberSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(1, 'Name is required').max(200),
  role: z.enum(['gc_admin', 'project_manager', 'foreman', 'field_worker', 'subcontractor', 'client']),
});
```

**Benefits**:
- Type-safe validation
- Clear error messages
- Prevents invalid data from reaching database
- Easy to test

---

### ✅ GOOD: Comprehensive Edge Case Handling

**Location**: `app/actions/team.ts`

The code handles many edge cases:
- Duplicate invitations (Line 143-147)
- Inactive member reactivation (Line 149-169)
- Last admin protection (Line 420-436)
- Self-modification prevention (Line 296-298, 398-400)

---

### ✅ GOOD: Construction-Themed UI Consistency

**Location**: `app/accept-invite/AcceptInviteContent.tsx`

The UI follows the construction theme guidelines:

```typescript
// Line 22-28 - Role colors using construction theme
const ROLE_DISPLAY: Record<string, { label: string; color: string }> = {
  gc_admin: { label: 'GC Admin', color: 'bg-construction-blue text-white' },
  foreman: { label: 'Foreman', color: 'bg-construction-gray text-white' },
  // ...
};

// Line 148-150 - Construction icons
<HardHat className="w-8 h-8 text-white" />

// Construction-themed shadows and borders
className="shadow-construction-lg border-2 border-gray-200"
```

---

### ⚠️ NEEDS IMPROVEMENT: Error Handling Strategy

**Current State**: Inconsistent error handling patterns

```typescript
// Some functions log and return
console.error('Error checking existing user:', userCheckError);
return { error: 'Failed to check existing user. Please try again.' };

// Some functions only return
return { error: 'Team member not found in your company.' };

// Some functions throw
throw new Error('An unexpected error occurred');
```

**Recommendation**: Standardize error handling with error boundary pattern.

---

## Summary of Findings

### Critical Issues (Must Fix): 4
1. RLS bypass with service role key - Complete security architecture problem
2. Placeholder user creation - Broken invitation flow
3. Invitation token security - No expiration, no replay protection
4. Race condition in duplicate check - Data integrity issue

### High Priority Issues: 4
1. Missing transaction boundaries - Data consistency risk
2. Insufficient error information - Poor debugging
3. Self-modification bypass potential - Logic error
4. Email case sensitivity - User acceptance failures

### Medium Priority Issues: 5
1. Notification type mismatch - Incorrect categorization
2. Incomplete invitation acceptance - Email verification missing
3. Cache invalidation too broad - Performance impact
4. Missing input sanitization - Defense-in-depth issue
5. No audit logging - Compliance and security

### Low Priority Issues: 3
1. Hardcoded timeout values - Code quality
2. Inconsistent error response types - Type safety
3. Missing JSDoc - Documentation quality

### Positive Observations: 4
1. Good Server/Client component separation
2. Comprehensive Zod validation
3. Good edge case handling
4. UI follows construction theme

---

## Recommended Action Plan

### Phase 1: Critical Fixes (Before Any Production Use)
1. **Fix RLS bypass** - Implement proper user-scoped Supabase client
2. **Fix placeholder user creation** - Implement separate invitations table
3. **Add token expiration** - 7-day expiry + used_at tracking
4. **Add transaction boundaries** - Use RPC functions for multi-step operations

### Phase 2: High Priority (Before Production Launch)
1. Add structured error handling with error codes
2. Implement email verification in acceptance flow
3. Add database constraints for email normalization
4. Create audit logging infrastructure

### Phase 3: Medium Priority (First Production Release)
1. Add correct notification types
2. Implement granular cache invalidation
3. Add input sanitization layer
4. Set up monitoring and error tracking

### Phase 4: Code Quality (Post-Launch)
1. Standardize error responses
2. Add comprehensive JSDoc
3. Extract magic numbers to constants
4. Implement retry logic for transient failures

---

## Files Reviewed

1. `app/actions/team.ts` - Team server actions (480 lines)
2. `app/actions/accept-invite.ts` - Invitation acceptance (204 lines)
3. `app/accept-invite/page.tsx` - Invitation page Server Component (69 lines)
4. `app/accept-invite/AcceptInviteContent.tsx` - Invitation form Client Component (259 lines)
5. `app/accept-invite/complete/page.tsx` - Completion page Server Component (81 lines)
6. `app/accept-invite/complete/CompleteInviteContent.tsx` - Completion states Client Component (117 lines)
7. `supabase/migrations/015_add_invitation_token.sql` - Database migration (18 lines)
8. `utils/supabase/server.ts` - Supabase client configuration (34 lines)
9. `supabase/migrations/003_company_users.sql` - Company users table and RLS (112 lines)
10. `supabase/migrations/04_rls_policies.sql` - RLS policies (360 lines)
11. `lib/auth.ts` - NextAuth configuration (53 lines)
12. `lib/auth.config.ts` - NextAuth adapter configuration (45 lines)

**Total Lines Reviewed**: ~1,832 lines of code

---

## Conclusion

The team member management implementation demonstrates good Next.js practices with proper Server/Client component boundaries, comprehensive input validation, and thoughtful edge case handling. The construction-themed UI is consistent and polished.

However, there are **critical security and architectural issues** that must be addressed before production deployment:

1. **RLS Bypass** - The use of service role key bypasses all database-level security
2. **Broken Invitation Flow** - Placeholder user creation doesn't work with next-auth's ID management
3. **Weak Token Security** - No expiration or replay protection

These issues are not minor bugs - they represent fundamental architectural problems that could lead to data breaches, broken functionality, and compliance violations.

**Recommendation**: Do NOT deploy to production until critical issues are resolved. The Phase 1 fixes are essential for a secure, functional system.

---

**Review Completed**: 2025-12-06
**Reviewer**: Claude Code (code-reviewer agent)
**Next Steps**: Share findings with development team and create task breakdown for fixes
