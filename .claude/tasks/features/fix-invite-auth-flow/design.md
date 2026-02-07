# Design: Fix Team Invitation Authentication Flow

## Architecture Overview

The fix requires bridging the gap between Supabase Auth user creation and NextAuth's user management system. When `signupWithInvitation()` creates a Supabase Auth user, we must also create a corresponding `next_auth.users` record so the CredentialsProvider can find and authenticate the user.

## Root Cause Analysis

### Problem
```
Current Flow:
1. signupWithInvitation() → Creates Supabase Auth user (auth.users table)
2. User redirects to login page
3. CredentialsProvider.authorize() → Validates password with Supabase Auth ✓
4. CredentialsProvider.authorize() → Queries next_auth.users table ✗ NOT FOUND
5. Login fails because no next_auth.users record exists
```

### Solution
```
Fixed Flow:
1. signupWithInvitation() → Creates Supabase Auth user
2. signupWithInvitation() → Creates next_auth.users record ← NEW
3. User redirects to login page
4. CredentialsProvider.authorize() → Validates password with Supabase Auth ✓
5. CredentialsProvider.authorize() → Queries next_auth.users table ✓ FOUND
6. Login succeeds, session created
7. Callback page accepts invitation
8. User redirected to /app
```

## Database Schema

### Affected Tables

**Table: `next_auth.users`** (managed by SupabaseAdapter)
```sql
-- Existing schema (do not modify)
CREATE TABLE next_auth.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT,
  email TEXT UNIQUE,
  "emailVerified" TIMESTAMPTZ,
  image TEXT
);
```

**No schema changes required.** The fix is in the application code to create the `next_auth.users` record during signup.

## Server Actions

### Modified: `signupWithInvitation()` in `app/actions/invite-auth.ts`

**Current Implementation:**
```typescript
// Creates only Supabase Auth user
const { data: authUser, error: createUserError } = await supabase.auth.admin.createUser({
  email: invitation.email,
  password: validatedData.password,
  email_confirm: true,
  user_metadata: { name: validatedData.name },
});

// No next_auth.users record created
```

**Fixed Implementation:**
```typescript
// Step 1: Create Supabase Auth user (existing)
const { data: authUser, error: createUserError } = await supabase.auth.admin.createUser({
  email: invitation.email,
  password: validatedData.password,
  email_confirm: true,
  user_metadata: { name: validatedData.name },
});

// Step 2: Create next_auth.users record (NEW)
const { error: nextAuthError } = await supabase
  .schema('next_auth')
  .from('users')
  .insert({
    email: invitation.email.toLowerCase(),
    name: validatedData.name,
    emailVerified: new Date().toISOString(), // Mark as verified (invitation email IS verification)
    image: null,
  });

if (nextAuthError) {
  // Rollback: Delete the Supabase Auth user if next_auth insert fails
  await supabase.auth.admin.deleteUser(authUser.user.id);
  return { success: false, error: 'Failed to create user account' };
}
```

### Verification: `CredentialsProvider.authorize()` in `lib/auth.config.ts`

The existing implementation already correctly:
1. Validates password with Supabase Auth
2. Queries `next_auth.users` for the user record
3. Returns the user if found

No changes needed to the CredentialsProvider after `next_auth.users` record is created.

## Components

### No Component Changes Required

The existing components handle the flow correctly:
- `InviteSignupForm` - Calls `signupWithInvitation()`, redirects to login
- `InviteLoginForm` - Validates password, calls `signIn()`, redirects to callback
- `AcceptInviteCallbackPage` - Calls `acceptInvitation()`, redirects to `/app`

## Integration Points

### Data Flow
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ /accept-invite/signup                                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│ InviteSignupForm.onSubmit()                                                  │
│   └─→ signupWithInvitation(token, name, password)                           │
│         ├─→ validateInvitationToken(token) ✓                                │
│         ├─→ supabase.auth.admin.createUser() → Creates auth.users record    │
│         ├─→ supabase.schema('next_auth').from('users').insert() → NEW       │
│         └─→ Return success                                                   │
│   └─→ router.push('/accept-invite/login?token=...&signup=success')          │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│ /accept-invite/login                                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│ InviteLoginForm.onSubmit()                                                   │
│   └─→ validatePasswordForInvitation(token, password)                        │
│         ├─→ validateInvitationToken(token) ✓                                │
│         └─→ supabase.auth.signInWithPassword() → Validates password         │
│   └─→ signIn("credentials", { email, password, redirect: true,              │
│              callbackUrl: '/accept-invite/callback?token=...' })            │
│         └─→ CredentialsProvider.authorize()                                 │
│               ├─→ supabase.auth.signInWithPassword() ✓                      │
│               └─→ supabase.schema('next_auth').from('users').select() ✓     │
│         └─→ Session created, redirect to callback                           │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│ /accept-invite/callback                                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│ AcceptInviteCallbackPage (Server Component)                                  │
│   └─→ acceptInvitation(token)                                               │
│         ├─→ auth() → Get session (now works!)                               │
│         ├─→ validateInvitationToken(token) ✓                                │
│         ├─→ UPDATE team_invitations SET used_at = NOW() ✓                   │
│         ├─→ UPSERT user_profiles ✓                                          │
│         ├─→ INSERT company_users ✓                                          │
│         └─→ Return success                                                   │
│   └─→ redirect('/app')                                                       │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Security Considerations

1. **Atomic Operations**: If `next_auth.users` insert fails, rollback the Supabase Auth user
2. **Email Verification**: Set `emailVerified` timestamp since invitation email IS verification
3. **Case Sensitivity**: Normalize email to lowercase before insert
4. **Idempotency**: Check if user already exists before insert

## Error Handling

### Signup Errors
| Error | User Message | Action |
|-------|-------------|--------|
| Auth user creation fails | "Failed to create account: {message}" | Show error |
| NextAuth user creation fails | "Failed to create user account" | Rollback auth user, show error |
| Token expired | "This invitation has expired..." | Redirect to home |
| Token already used | "This invitation has already been used..." | Redirect to home |

### Login Errors
| Error | User Message | Action |
|-------|-------------|--------|
| Invalid password | "Invalid password. Please try again." | Show error, allow retry |
| User not found | "Invalid email or password. Please try again." | Show error |
| Session creation fails | "Failed to sign in. Please try again." | Show error |

## Testing Plan

### Manual Testing Steps
1. Create a new invitation from `/app/team`
2. Open the invitation link (or copy from admin UI)
3. Click "Accept Invitation"
4. Fill signup form with name and password
5. Verify redirect to login page with success message
6. Enter password
7. Verify redirect to `/app` dashboard
8. Verify user appears in team list with correct role

### Edge Cases to Test
- Expired invitation (wait 7 days or modify DB)
- Already used invitation (use same link twice)
- Existing user accepting new invitation
- Invalid password on login
- Session timeout during flow
