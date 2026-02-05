# Team Invitation Authentication Flow

> Email+Password authentication for team member invitations in GenHub PWA

---

## Table of Contents
1. [Overview](#1-overview)
2. [User Flow](#2-user-flow)
3. [Routing Structure](#3-routing-structure)
4. [Components](#4-components)
5. [Server Actions](#5-server-actions)
6. [Authentication Architecture](#6-authentication-architecture)
7. [Security Considerations](#7-security-considerations)
8. [Validation Rules](#8-validation-rules)
9. [Edge Cases](#9-edge-cases)
10. [Testing Checklist](#10-testing-checklist)

---

## 1. Overview

Team members are invited via email and must create an account with email+password to join. Google OAuth is **only** available for new company creation, not for invitation acceptance.

### Key Changes from Previous Flow
| Before | After |
|--------|-------|
| Google OAuth or Magic Link | Email + Password only |
| Single sign-in step | Signup → Login flow |
| OAuth session handling | NextAuth Credentials Provider |

---

## 2. User Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         INVITATION FLOW                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Admin invites member                                                       │
│         ↓                                                                   │
│  Email sent with invitation link                                            │
│         ↓                                                                   │
│  User clicks: /accept-invite?token={uuid}                                   │
│         ↓                                                                   │
│  ┌─────────────────────────────────────┐                                    │
│  │  Show Invitation Details            │                                    │
│  │  - Company name                     │                                    │
│  │  - Role assigned                    │                                    │
│  │  - Invited email                    │                                    │
│  │  - Invited name                     │                                    │
│  │                                     │                                    │
│  │  [Accept Invitation] button         │                                    │
│  └─────────────────────────────────────┘                                    │
│         ↓                                                                   │
│  checkEmailExists(email)                                                    │
│         ↓                                                                   │
│  ┌──────────┴──────────┐                                                    │
│  ↓                     ↓                                                    │
│  NEW USER         EXISTING USER                                             │
│  ↓                     ↓                                                    │
│  /accept-invite/   /accept-invite/                                          │
│  signup?token=     login?token=                                             │
│  ↓                     ↓                                                    │
│  Create account    Enter password                                           │
│  ↓                     ↓                                                    │
│  Redirect to       signIn("credentials")                                    │
│  login page        ↓                                                        │
│  ↓                 acceptInvitation()                                       │
│  ↓                     ↓                                                    │
│  └─────────────────────┘                                                    │
│         ↓                                                                   │
│  Redirect to /app (Dashboard)                                               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Routing Structure

```
/accept-invite/
├── page.tsx                      # Landing page (shows invitation details)
├── AcceptInviteContent.tsx       # Client component with smart routing
├── complete/
│   └── page.tsx                  # Legacy OAuth completion (kept for compatibility)
├── signup/
│   ├── page.tsx                  # Signup page (server component)
│   └── InviteSignupForm.tsx      # Signup form (client component)
└── login/
    ├── page.tsx                  # Login page (server component)
    └── InviteLoginForm.tsx       # Login form (client component)
```

**Routes:**
| Route | Purpose | Component Type |
|-------|---------|----------------|
| `/accept-invite?token=xxx` | Show invitation details | Server → Client |
| `/accept-invite/signup?token=xxx` | Create new account | Server → Client |
| `/accept-invite/login?token=xxx` | Sign in existing user | Server → Client |

---

## 4. Components

### 4.1 AcceptInviteContent
**File:** `app/accept-invite/AcceptInviteContent.tsx`

Displays invitation details and routes users based on email existence.

```typescript
// Smart routing logic
const handleAcceptInvitation = async () => {
  const result = await checkEmailExists(invitation.email);

  if (result.exists && result.hasPassword) {
    // Existing user with password → Login
    router.push(`/accept-invite/login?token=${token}`);
  } else if (result.exists && !result.hasPassword) {
    // Google-only user → Show error
    setError("Account exists with Google sign-in. Please contact admin.");
  } else {
    // New user → Signup
    router.push(`/accept-invite/signup?token=${token}`);
  }
};
```

### 4.2 PasswordInput
**File:** `components/ui/PasswordInput.tsx`

Password input with visibility toggle.

**Features:**
- Show/hide password toggle (Eye/EyeOff icons)
- 44px minimum touch target
- Dark mode support
- Forward ref pattern

```typescript
<PasswordInput
  {...register("password", passwordValidation)}
  placeholder="Enter your password"
/>
```

### 4.3 PasswordStrengthIndicator
**File:** `components/ui/PasswordStrengthIndicator.tsx`

Real-time password strength feedback.

**Requirements Displayed:**
- ✓ 8+ characters
- ✓ Uppercase letter (A-Z)
- ✓ Lowercase letter (a-z)
- ✓ Number (0-9)

**Progress Bar Colors:**
| Requirements Met | Color |
|------------------|-------|
| 0-1 | Red |
| 2-3 | Yellow |
| 4 | Green |

```typescript
<PasswordStrengthIndicator password={watchPassword} />
```

### 4.4 InviteSignupForm
**File:** `app/accept-invite/signup/InviteSignupForm.tsx`

New user registration form.

**Fields:**
| Field | Type | Editable | Validation |
|-------|------|----------|------------|
| Email | Input | No (disabled) | Pre-filled from invitation |
| Name | Input | Yes | Required, max 200 chars |
| Password | PasswordInput | Yes | See password rules |
| Confirm Password | PasswordInput | Yes | Must match password |

### 4.5 InviteLoginForm
**File:** `app/accept-invite/login/InviteLoginForm.tsx`

Existing user login form.

**Fields:**
| Field | Type | Editable | Validation |
|-------|------|----------|------------|
| Email | Input | No (disabled) | Pre-filled from invitation |
| Password | PasswordInput | Yes | Required |

---

## 5. Server Actions

### 5.1 checkEmailExists
**File:** `app/actions/invite-auth.ts`

Checks if a user account exists for the given email.

```typescript
export async function checkEmailExists(
  email: string
): Promise<CheckEmailExistsResult>

// Returns:
{ success: true, exists: boolean, hasPassword: boolean }
// or
{ success: false, error: string }
```

### 5.2 signupWithInvitation
**File:** `app/actions/invite-auth.ts`

Creates a new user account for an invitation.

```typescript
export async function signupWithInvitation(data: {
  token: string;
  name: string;
  password: string;
  confirmPassword: string;
}): Promise<SignupWithInvitationResult>

// Returns:
{ success: true, message: string }
// or
{ success: false, error: string, fieldErrors?: Record<string, string[]> }
```

**Process:**
1. Validate Zod schema
2. Validate invitation token (expiration, single-use)
3. Create Supabase Auth user (`email_confirm: true`)
4. Create `user_profiles` entry
5. Return success (invitation NOT marked as used yet)

### 5.3 validatePasswordForInvitation
**File:** `app/actions/invite-auth.ts`

Validates password before NextAuth sign-in.

```typescript
export async function validatePasswordForInvitation(data: {
  token: string;
  password: string;
}): Promise<ValidatePasswordResult>

// Returns:
{ success: true, email: string }
// or
{ success: false, error: string }
```

**Process:**
1. Validate invitation token
2. Verify password against Supabase Auth
3. Return email for client to use with NextAuth

### 5.4 acceptInvitation (existing)
**File:** `app/actions/accept-invite.ts`

Links authenticated user to company.

```typescript
export async function acceptInvitation(
  token: string
): Promise<AcceptInviteResult>
```

**Process:**
1. Verify NextAuth session exists
2. Verify session email matches invitation email
3. Mark invitation as used (atomic operation)
4. Create `company_users` entry
5. Create welcome notification

---

## 6. Authentication Architecture

### 6.1 Three-Step Login Flow

```
┌─────────────────────────────────────────────────────────────────┐
│  CLIENT                           SERVER                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Submit password ─────────→ validatePasswordForInvitation()  │
│     (validates token + password)     │                          │
│                               ←───── { success, email }         │
│                                                                 │
│  2. signIn("credentials", { email, password })                  │
│     (creates NextAuth session)                                  │
│                                                                 │
│  3. acceptInvitation(token) ────→ acceptInvitation()            │
│     (links user to company)          │                          │
│                               ←───── { success }                │
│                                                                 │
│  4. router.push("/app")                                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 NextAuth Credentials Provider
**File:** `lib/auth.config.ts`

> **Note:** This runs server-side only. The Supabase client is created with the service role key for auth validation.

```typescript
// Server-side only - runs in NextAuth authorize callback
import { createClient } from '@supabase/supabase-js';

CredentialsProvider({
  id: "credentials",
  name: "Email & Password",
  credentials: {
    email: { label: "Email", type: "email" },
    password: { label: "Password", type: "password" },
  },
  async authorize(credentials) {
    if (!credentials?.email || !credentials?.password) return null;

    // Create Supabase client with service role (server-side only)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SECRET_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Validates against Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email as string,
      password: credentials.password as string,
    });

    if (error || !data.user) return null;

    return {
      id: data.user.id,
      email: data.user.email,
      name: data.user.user_metadata?.name || null,
    };
  },
})
```

### 6.3 Session Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    SESSION SYSTEMS                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Supabase Auth                    NextAuth                      │
│  ┌───────────────────┐           ┌───────────────────┐          │
│  │ Password storage  │           │ Session management│          │
│  │ (bcrypt hashing)  │           │ (JWT tokens)      │          │
│  │                   │           │                   │          │
│  │ Rate limiting     │◄─────────►│ Credentials       │          │
│  │                   │  validate │ Provider          │          │
│  │ User metadata     │           │                   │          │
│  └───────────────────┘           └───────────────────┘          │
│                                          │                      │
│                                          ▼                      │
│                                  ┌───────────────────┐          │
│                                  │ Application       │          │
│                                  │ Session (auth())  │          │
│                                  └───────────────────┘          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 7. Security Considerations

### 7.1 Password Security
| Aspect | Implementation |
|--------|----------------|
| Storage | Supabase Auth (bcrypt) |
| Minimum length | 8 characters |
| Complexity | Uppercase + Lowercase + Number |
| Rate limiting | Built into Supabase Auth |

### 7.2 Token Security
| Aspect | Implementation |
|--------|----------------|
| Format | UUID v4 |
| Expiration | 7 days |
| Single-use | Atomic check with `WHERE used_at IS NULL` |
| Validation | Server-side only |

### 7.3 Email Verification
Email verification is **skipped** because the invitation email serves as verification:
- User must have access to invited email to receive link
- Email is locked (cannot be changed during signup)
- `email_confirm: true` when creating Supabase user

### 7.4 Attack Prevention
| Attack | Prevention |
|--------|------------|
| Token replay | Atomic single-use check |
| Email spoofing | Email locked to invitation |
| Brute force | Supabase Auth rate limiting |
| Session hijacking | NextAuth JWT with secure cookies |

---

## 8. Validation Rules

### 8.1 Password Validation
**File:** `lib/validation/client-validation.ts`

```typescript
export const passwordValidation = {
  required: 'Password is required',
  minLength: {
    value: 8,
    message: 'Password must be at least 8 characters',
  },
  validate: {
    hasUppercase: (v: string) => /[A-Z]/.test(v) || 'Must contain an uppercase letter',
    hasLowercase: (v: string) => /[a-z]/.test(v) || 'Must contain a lowercase letter',
    hasNumber: (v: string) => /[0-9]/.test(v) || 'Must contain a number',
  },
};
```

### 8.2 Server-Side Validation (Zod)
**File:** `app/actions/invite-auth.ts`

```typescript
const signupWithInvitationSchema = z.object({
  token: z.string().uuid("Invalid invitation token"),
  name: z.string().min(1, "Name is required").max(200),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain an uppercase letter")
    .regex(/[a-z]/, "Password must contain a lowercase letter")
    .regex(/[0-9]/, "Password must contain a number"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});
```

---

## 9. Edge Cases

| Case | Handling |
|------|----------|
| User exists (Google OAuth only) | Show message: "Account exists with Google. Please contact admin." |
| User exists (has password) | Route to login page |
| Token expired | Show error: "This invitation has expired. Please request a new invitation." |
| Token already used | Show error: "This invitation has already been used." |
| Password doesn't meet requirements | Client-side + server-side validation errors |
| Email mismatch | Server rejects: "This invitation is for a different email address." |
| Network error during signup | Show error, allow retry |
| Network error during login | Show error, allow retry |

---

## 10. Testing Checklist

### 10.1 Manual Testing

**New User Flow:**
- [ ] Create invitation from `/app/team`
- [ ] Click invitation link
- [ ] Verify invitation details shown correctly
- [ ] Click "Accept Invitation" → routes to signup
- [ ] Fill form with valid password
- [ ] Verify password strength indicator updates
- [ ] Submit → redirects to login with success message
- [ ] Enter password → logs in
- [ ] Verify redirected to `/app`
- [ ] Verify user appears in team list

**Existing User Flow:**
- [ ] Create invitation for existing email
- [ ] Click invitation link
- [ ] Click "Accept Invitation" → routes to login
- [ ] Enter password → logs in
- [ ] Verify redirected to `/app`

**Error Cases:**
- [ ] Expired token shows error
- [ ] Used token shows error
- [ ] Wrong password shows error
- [ ] Weak password shows validation errors
- [ ] Password mismatch shows error

### 10.2 Mobile Testing

- [ ] 44px touch targets on all buttons
- [ ] Password visibility toggle works
- [ ] Keyboard doesn't cover form fields
- [ ] Dark mode displays correctly
- [ ] Safe area padding on iOS

### 10.3 Build Verification

```bash
npm run build
```

Expected: All `/accept-invite/*` routes build with Partial Prerender (◐)

---

## Related Files

| File | Purpose |
|------|---------|
| `app/actions/invite-auth.ts` | Server Actions for auth flow |
| `app/actions/accept-invite.ts` | Token validation + invitation acceptance |
| `app/actions/team.ts` | Creating invitations |
| `lib/auth.config.ts` | NextAuth configuration |
| `lib/validation/client-validation.ts` | Client-side validation rules |
| `components/ui/PasswordInput.tsx` | Password input component |
| `components/ui/PasswordStrengthIndicator.tsx` | Password strength UI |
