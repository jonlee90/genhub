# E1-T7: Configure Authentication with Supabase Integration

**Epic**: Foundation (Week 1-2)
**Effort**: Medium
**References**: Req 1 (Authentication), Design Section 6.1, 8.1

## Description

Configure and verify next-auth integration with Supabase, implement protected routes middleware, and create user onboarding flow for company assignment.

## Subtasks

### 7.1 Verify and update next-auth configuration
- Review existing `lib/auth.config.ts` and `lib/auth.ts`
- Ensure Supabase JWT integration is configured
- Add user profile fetching after sign-in
- **Refs:** Req 1.1-1.5 (Authentication), Design Section 6.1
- **Effort:** M
- **Files:** `lib/auth.config.ts`, `lib/auth.ts`

### 7.2 Create middleware for protected routes
- Update `middleware.ts` to protect `/app/*` routes
- Redirect unauthenticated users to `/sign-in`
- Preserve intended destination for post-login redirect
- **Refs:** Req 1.1 (Redirect Unauthenticated), Design Section 6.1
- **Effort:** S
- **Files:** `middleware.ts`

### 7.3 Create user onboarding flow for company assignment
- Create `app/app/onboarding/page.tsx`
- Check if user has company_users entry on first login
- Prompt to create company or show pending invitations
- Redirect to dashboard after company assignment
- **Refs:** Req 3.1 (First Login Prompt), Design Section 8.1
- **Effort:** M
- **Files:** `app/app/onboarding/page.tsx`, `components/app/OnboardingForm.tsx`

## Acceptance Criteria

- [ ] Supabase JWT properly integrated with next-auth
- [ ] Protected routes redirect unauthenticated users
- [ ] Post-login redirect preserves intended destination
- [ ] Onboarding flow handles new users without companies
- [ ] Onboarding shows pending invitations if any exist
- [ ] Users with company access go directly to dashboard

## Files to Create/Modify

- `lib/auth.config.ts`
- `lib/auth.ts`
- `middleware.ts`
- `app/app/onboarding/page.tsx`
- `components/app/OnboardingForm.tsx`
