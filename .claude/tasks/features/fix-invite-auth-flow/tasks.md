# Implementation Tasks: Fix Team Invitation Authentication Flow

## Task 1: Update signupWithInvitation to create next_auth.users record

- **Agent**: backend-engineer
- **Skills**: postgres-best-practices:postgres-best-practices
- **Files**:
  - `app/actions/invite-auth.ts` (modify)
- **Depends on**: None
- **Complexity**: Medium

### Description
Modify the `signupWithInvitation()` server action to create a `next_auth.users` record after creating the Supabase Auth user. This ensures the CredentialsProvider can find the user during login.

### Implementation Details
1. After `supabase.auth.admin.createUser()` succeeds
2. Insert into `next_auth.users` table:
   - `email`: invitation.email (lowercase)
   - `name`: validatedData.name
   - `emailVerified`: current timestamp (invitation email IS verification)
   - `image`: null
3. If insert fails, rollback by deleting the Supabase Auth user
4. Return appropriate error messages

### Code Changes
```typescript
// After creating Supabase Auth user successfully
const { error: nextAuthError } = await supabase
  .schema('next_auth')
  .from('users')
  .insert({
    email: invitation.email.toLowerCase(),
    name: validatedData.name,
    emailVerified: new Date().toISOString(),
    image: null,
  });

if (nextAuthError) {
  console.error("[SIGNUP_WITH_INVITATION] Error creating next_auth user:", nextAuthError);
  // Rollback: Delete the Supabase Auth user
  await supabase.auth.admin.deleteUser(authUser.user.id);
  return {
    success: false,
    error: "Failed to create user account. Please try again.",
  };
}
```

### Acceptance Criteria
- [x] New users created via invitation have both `auth.users` and `next_auth.users` records
- [x] If `next_auth.users` insert fails, Supabase Auth user is deleted (rollback)
- [x] Email is normalized to lowercase
- [x] `emailVerified` is set to current timestamp
- [x] Error messages are user-friendly

**Implemented: 2026-02-04**

---

## Task 2: Verify and test complete invitation flow

- **Agent**: code-reviewer
- **Skills**: Testing, manual verification
- **Files**: None (testing only)
- **Depends on**: Task 1
- **Complexity**: Simple

### Description
Manually test the complete invitation flow end-to-end to verify it works correctly.

### Test Steps
1. **Create Invitation**
   - Go to `/app/team` as an admin
   - Click "Invite Team Member"
   - Enter test email, name, and role
   - Submit and verify invitation is created

2. **Accept Invitation (New User)**
   - Open invitation link (from email or copy from UI)
   - Verify invitation details are displayed correctly
   - Click "Accept Invitation"
   - Verify redirect to signup page

3. **Create Account**
   - Enter full name and password
   - Submit form
   - Verify redirect to login page with success message

4. **Login**
   - Enter password
   - Submit form
   - Verify redirect to `/app` dashboard

5. **Verify Membership**
   - Check team page shows new member
   - Check user has correct role
   - Check invitation is marked as used

### Acceptance Criteria
- [ ] Complete flow works without errors
- [ ] User appears in team list with correct role
- [ ] Invitation cannot be reused (shows "already used" error)
- [ ] Error messages are clear and helpful

---

## Task 3: Build verification

- **Agent**: code-reviewer
- **Skills**: Build verification
- **Files**: None
- **Depends on**: Task 1
- **Complexity**: Simple

### Description
Verify the build passes and there are no TypeScript errors.

### Commands
```bash
pnpm build
pnpm lint
```

### Acceptance Criteria
- [x] Build completes without errors
- [x] No TypeScript errors
- [x] No linting errors

**Verified: 2026-02-04**

Note: Also fixed pre-existing issues:
- Fixed TypeScript error in `InviteLoginForm.tsx` (unreachable code after `signIn` with `redirect: true`)
- Fixed TypeScript error in `lib/auth.config.ts` (type cast for `credentials.email`)
- Fixed build error in `accept-invite/error/page.tsx` (wrapped `useSearchParams` in Suspense)
- Fixed build error in `accept-invite/callback/page.tsx` (added Suspense boundary for async component)

---

## Task Sequence

```
Task 1: Update signupWithInvitation
    ↓
Task 2: Verify complete flow (manual testing)
    ↓
Task 3: Build verification
```

## Summary

| Task | Description | Agent | Complexity |
|------|-------------|-------|------------|
| 1 | Update signupWithInvitation to create next_auth.users | backend-engineer | Medium |
| 2 | Test complete invitation flow | code-reviewer | Simple |
| 3 | Build verification | code-reviewer | Simple |

**Total Tasks**: 3
**Estimated Files Modified**: 1
