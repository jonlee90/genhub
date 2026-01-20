# Session Deduplication Fix

## Problem
The `/api/auth/session` endpoint was being called twice on page load of `/app/projects`, causing unnecessary network requests and potentially impacting performance.

## Root Cause
The `SessionProvider` from `next-auth/react` was wrapping the entire application in `app/layout.tsx`. This provider automatically fetches the session when it mounts on the client side, even though GenHub uses server-side authentication via the `auth()` function.

### Previous Architecture
1. **Server-side**: `lib/projects.ts` uses `auth()` to get session on the server
2. **Client-side**: `app/layout.tsx` had `SessionProvider` wrapping all pages
3. **Result**: Two calls to `/api/auth/session`:
   - One from `SessionProvider` initialization (unnecessary)
   - One from any client component using `useSession()` (if applicable)

## Solution
Removed the global `SessionProvider` from `app/layout.tsx` and implemented **scoped session providers** only where needed.

### Changes Made

#### 1. Removed Global SessionProvider
**File**: `app/layout.tsx`
- Removed `SessionProvider` import
- Removed `<SessionProvider>` wrapper from root layout
- Session now only fetched where explicitly needed

#### 2. Created Scoped SessionProvider Wrapper
**File**: `components/providers/SessionProviderWrapper.tsx` (NEW)
- Created reusable wrapper component for sections that need `useSession()`
- Only used in specific pages/components that require client-side session access

#### 3. Wrapped Chat Page
**File**: `app/app/chat/page.tsx`
- Wrapped `ChatLayout` with `SessionProviderWrapper`
- Chat components (`MessageItem`) use `useSession()` hook
- Session now only fetched when user visits chat page

#### 4. Wrapped Profile/Billing Page
**File**: `app/app/profile/page.tsx`
- Wrapped `ProfileAndBillingContent` with `SessionProviderWrapper`
- Billing components use `useSession()` hook
- Session only fetched on profile page

#### 5. Self-Contained Stripe Components
**Files Modified**:
- `components/stripe/PortalButton.tsx`
- `components/stripe/RefundButton.tsx`
- `components/CheckoutButton.tsx`

Each component now wraps itself with `SessionProvider`:
```tsx
function ComponentContent() {
  const { data: session } = useSession();
  // ... component logic
}

export default function Component(props) {
  return (
    <SessionProvider>
      <ComponentContent {...props} />
    </SessionProvider>
  );
}
```

## Benefits

### Performance Improvements
1. **Reduced Network Requests**: `/api/auth/session` only called when needed
2. **Faster Page Loads**: No unnecessary session fetch on every page
3. **Smaller Client Bundle**: SessionProvider code only loaded where used

### Architectural Benefits
1. **Explicit Dependencies**: Clear which components need session access
2. **Better Code Splitting**: Session provider code split by route
3. **Server-First Approach**: Aligns with Next.js 16 App Router patterns

## Verification

### Pages NOT Using Session (Server-Only)
- `/app/projects` - Uses server-side `auth()` ✅
- `/app/projects/[id]` - Uses server-side `auth()` ✅
- `/app/expenses` - Uses server-side `auth()` ✅
- `/app/tasks` - Uses server-side `auth()` ✅

### Pages Using Session (Client-Side)
- `/app/chat` - Wrapped with `SessionProviderWrapper` ✅
- `/app/profile` - Wrapped with `SessionProviderWrapper` ✅

### Components Using Session (Self-Contained)
- `PortalButton` - Self-wrapped ✅
- `RefundButton` - Self-wrapped ✅
- `CheckoutButton` - Self-wrapped ✅
- `MessageItem` (via ChatLayout wrapper) ✅

## Testing Checklist
- [ ] Visit `/app/projects` - Check network tab for single/no session call
- [ ] Visit `/app/chat` - Verify session fetched once
- [ ] Visit `/app/profile` - Verify billing buttons work
- [ ] Test Stripe checkout flow - Verify no errors
- [ ] Test project detail page - No session calls expected
- [ ] Verify no console errors on any page

## Files Changed
1. `app/layout.tsx` - Removed SessionProvider
2. `components/providers/SessionProviderWrapper.tsx` - NEW
3. `app/app/chat/page.tsx` - Added scoped wrapper
4. `app/app/profile/page.tsx` - Added scoped wrapper
5. `components/stripe/PortalButton.tsx` - Self-contained wrapper
6. `components/stripe/RefundButton.tsx` - Self-contained wrapper
7. `components/CheckoutButton.tsx` - Self-contained wrapper

## Migration Notes
If adding new components that need `useSession()`:
1. Prefer server-side `auth()` when possible
2. If client-side session is required, use self-contained wrapper pattern
3. Only wrap at page level if multiple components need session

## Related Documentation
- Next.js 16 App Router: https://nextjs.org/docs/app
- NextAuth.js with App Router: https://next-auth.js.org/configuration/nextjs#in-app-router
- React Server Components: https://react.dev/reference/rsc/server-components
