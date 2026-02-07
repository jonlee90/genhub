# Requirement: Fix Team Invitation Authentication Flow

## Problem Statement

The current team invitation flow from `/app/team` → email → create account → login → `/app` has potential issues that need to be verified and fixed. The flow should:
1. Allow admins to invite team members via email
2. Send an email with a link to accept the invitation
3. Allow new users to create an account with email/password
4. Redirect to login page after account creation
5. After successful login, accept the invitation and redirect to `/app` dashboard

## Current Flow Analysis

### Existing Implementation
1. **Invitation Creation** (`/app/team` → `InviteTeamMemberModal`)
   - Admin creates invitation with email, name, role
   - Invitation stored in `team_invitations` table with 7-day expiration
   - Email sent via `sendTeamInvitationEmail()` with link to `/accept-invite?token={uuid}`

2. **Accept Invite Entry** (`/accept-invite?token=...`)
   - Validates token (format, expiration, not used)
   - Shows invitation details (email, name, company, role)
   - On "Accept Invitation" click:
     - Checks if email exists via `checkEmailExists()`
     - Routes to `/accept-invite/signup` (new user) or `/accept-invite/login` (existing user)

3. **Signup Flow** (`/accept-invite/signup`)
   - Creates Supabase Auth user with email+password (`email_confirm: true`)
   - Redirects to `/accept-invite/login?token=...&signup=success`

4. **Login Flow** (`/accept-invite/login`)
   - Validates password with `validatePasswordForInvitation()`
   - Calls `signIn("credentials")` with `redirect: true` to `/accept-invite/callback`

5. **Callback Flow** (`/accept-invite/callback`)
   - Server-side: calls `acceptInvitation(token)`
   - Creates `user_profiles` and `company_users` entries
   - Redirects to `/app`

### Potential Issues Identified

1. **NextAuth User Record Not Created Before Login**
   - When a new user signs up via `signupWithInvitation()`, only a Supabase Auth user is created
   - The CredentialsProvider in `auth.config.ts` queries `next_auth.users` table to find the user
   - If no `next_auth.users` record exists, login will fail with "NextAuth user not found"

2. **Race Condition in User Creation**
   - The SupabaseAdapter creates `next_auth.users` record on first OAuth login
   - For credentials-based login, there's no automatic user record creation
   - New users created via `signupWithInvitation()` won't have a `next_auth.users` entry

3. **Session Establishment Timing**
   - The callback page assumes session is established after `signIn()` redirect
   - Need to verify session is actually available when `acceptInvitation()` is called

## User Stories

1. **As an admin**, I want to invite team members by email so that they can join my company on GenHub.

2. **As an invited user**, I want to click the email link, create my account with a password, and be able to log in immediately so that I can access the company workspace.

3. **As an invited user with an existing account**, I want to sign in with my existing credentials so that I can accept the invitation without creating a new account.

## Acceptance Criteria

### AC1: New User Signup and Login
- WHEN a new user visits `/accept-invite?token=...`
- AND clicks "Accept Invitation"
- AND fills out the signup form with name, password
- THEN a Supabase Auth user is created
- AND a `next_auth.users` record is created
- AND the user is redirected to the login page
- AND after entering their password, they are logged in
- AND the invitation is marked as used
- AND a `company_users` entry is created
- AND the user is redirected to `/app`

### AC2: Existing User Login
- WHEN an existing user visits `/accept-invite?token=...`
- AND clicks "Accept Invitation"
- AND enters their password on the login page
- THEN they are logged in via NextAuth credentials provider
- AND the invitation is marked as used
- AND a `company_users` entry is created (if not already a member)
- AND the user is redirected to `/app`

### AC3: Error Handling
- WHEN an invitation token is expired, THE SYSTEM SHALL show a clear error message
- WHEN an invitation token is already used, THE SYSTEM SHALL show a clear error message
- WHEN login fails, THE SYSTEM SHALL show the error and allow retry
- WHEN email mismatch occurs, THE SYSTEM SHALL show a clear error message

## Scope

### In Scope
- Fix the gap between Supabase Auth user creation and NextAuth user record creation
- Ensure credentials-based login works for newly created users
- Verify the complete flow end-to-end
- Handle edge cases and error states

### Out of Scope
- Changing the invitation email template
- Adding additional authentication methods (Google OAuth for invites)
- Modifying the admin invitation UI
- Changing password requirements

## Constraints

- Must work with existing NextAuth + SupabaseAdapter setup
- Must maintain security (single-use tokens, email verification, etc.)
- Must not break existing Google OAuth login
- Must not break existing magic link login
