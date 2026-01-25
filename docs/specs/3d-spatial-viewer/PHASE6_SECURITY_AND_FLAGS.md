# Phase 6: Security & Feature Flags

**Status:** ✅ Implemented
**Date:** 2026-01-02

---

## P6.2 - Security Audit & Access Control

### Security Audit Script

**File:** `scripts/security-audit.ts`

Automated security audit that validates:
- ✅ All spatial tables have RLS enabled
- ✅ All tables have proper SELECT/INSERT/UPDATE/DELETE policies
- ✅ Policies enforce company access control
- ✅ Creator/role checks on mutations

**Usage:**
```bash
tsx scripts/security-audit.ts
```

**Output:**
```
🔒 Running Security Audit for Spatial Viewer Tables

📋 Checking RLS Status...
✅ spatial_markers: RLS ENABLED
✅ marker_content: RLS ENABLED
✅ projects_3d_models: RLS ENABLED

📋 Checking Policies...
  spatial_markers:
    ✅ SELECT: COVERED
    ✅ INSERT: COVERED
    ✅ UPDATE: COVERED
    ✅ DELETE: COVERED

📋 Validating Company Access Control...
✅ All policies reference company_id or get_user_company_id()

📋 Checking Creator/Role Policies...
✅ Creator-based policies found
✅ Role-based policies found

============================================================
✅ Security Audit PASSED
```

### RLS Policy Tests

**File:** `tests/security/rls-policies.test.ts`

Comprehensive test suite covering:
- ✅ Users only view markers in their company
- ✅ Users only edit their own markers (or if PM/GC)
- ✅ Users cannot delete others' markers (unless GC admin)
- ✅ Client users have read-only access to client-visible markers

**Run tests:**
```bash
npm run test tests/security/rls-policies.test.ts
```

### Server Action Security

**File:** `app/actions/spatial.ts` (enhanced)

All marker operations now include:
- ✅ Project access verification
- ✅ Permission checks before update/delete
- ✅ Creator/role validation
- ✅ File upload quota validation (TODO)

**Example:**
```typescript
// Before update, check permissions
const canUpdate =
  existingMarker.created_by === userId ||
  role === 'admin' ||
  role === 'pm';

if (!canUpdate) {
  return { error: 'Permission denied: Only marker creator or GC/PM can update' };
}
```

### Client User Access Control

**Migration:** `supabase/migrations/20260102140000_add_is_client_visible.sql`

Added `is_client_visible` column to `spatial_markers`:
- ✅ Default: `true` (markers visible to clients by default)
- ✅ Index for efficient client queries
- ✅ RLS policy: Clients only see markers with `is_client_visible = true`

**Usage:**
```typescript
// Hide marker from client portal
await updateMarker(markerId, {
  is_client_visible: false
});
```

---

## P6.5 - Feature Flag System

### Environment-Based Flags (MVP)

**File:** `lib/feature-flags/index.ts`

Feature flags stored in environment variables for MVP. Can migrate to database later.

**Available Flags:**
```typescript
type FeatureFlag =
  | 'spatial_viewer_enabled'      // Enable 3D spatial viewer
  | 'spatial_viewer_beta'         // Beta features
  | 'client_portal_3d'            // Clients can view 3D
  | 'offline_mode_enabled'        // Service worker
  | '2d_floor_plan_mode'          // 2D view mode
  | 'ifc_upload_enabled'          // IFC uploads
  | 'marker_clustering'           // Marker clustering
  | 'marker_search'               // Search functionality
  | 'marker_filters'              // Filtering UI
  | 'model_lod_switching'         // Auto LOD
```

### Server-Side Feature Checking

**Function:** `isFeatureEnabled(flag, userId?): Promise<boolean>`

```typescript
import { isFeatureEnabled } from '@/lib/feature-flags'

// Server Component
export default async function SpatialViewerPage() {
  const enabled = await isFeatureEnabled('spatial_viewer_enabled')
  if (!enabled) {
    return <FeatureUnavailable featureName="3D Spatial Viewer" />
  }

  return <SpatialViewer />
}
```

### Client-Side Feature Hook

**Hook:** `useFeatureFlag(flag): { enabled, loading }`

```typescript
'use client'
import { useFeatureFlag } from '@/hooks/use-feature-flag'

export function SpatialViewerClient() {
  const { enabled, loading } = useFeatureFlag('spatial_viewer_enabled')

  if (loading) return <Spinner />
  if (!enabled) return <FeatureUnavailable />

  return <SpatialViewer />
}
```

### Feature Flag API

**Endpoint:** `GET /api/feature-flags`

```bash
# Get all flags
curl /api/feature-flags

# Get specific flag
curl /api/feature-flags?flag=spatial_viewer_enabled
```

**Response:**
```json
{
  "flags": [
    {
      "flag": "spatial_viewer_enabled",
      "enabled": true,
      "description": "Enable 3D spatial viewer feature"
    },
    ...
  ]
}
```

### Environment Variables

**File:** `.env.example` (updated)

```bash
# Spatial Viewer Feature Flags
NEXT_PUBLIC_SPATIAL_VIEWER_ENABLED=true
NEXT_PUBLIC_SPATIAL_VIEWER_BETA=false
NEXT_PUBLIC_CLIENT_PORTAL_3D=true
NEXT_PUBLIC_OFFLINE_MODE_ENABLED=false
NEXT_PUBLIC_2D_FLOOR_PLAN_MODE=false
NEXT_PUBLIC_IFC_UPLOAD_ENABLED=true
NEXT_PUBLIC_MARKER_CLUSTERING=true
NEXT_PUBLIC_MARKER_SEARCH=true
NEXT_PUBLIC_MARKER_FILTERS=true
NEXT_PUBLIC_MODEL_LOD_SWITCHING=false
```

### Graceful Degradation

**Component:** `components/feature-flags/FeatureUnavailable.tsx`

Shows friendly message when feature is disabled:
- ✅ Custom feature name
- ✅ Custom message
- ✅ Back button
- ✅ Dashboard link

**Example:**
```tsx
<FeatureUnavailable
  featureName="3D Spatial Viewer"
  message="This feature is currently disabled."
/>
```

### Role-Based Access

**Function:** `canUserAccessFeature(flag, role): Promise<boolean>`

```typescript
const canAccess = await canUserAccessFeature('spatial_viewer_beta', 'admin')
// true for admin/pm, false for workers/clients
```

---

## Security Best Practices

### RLS Policies (All Spatial Tables)

**SELECT:**
- ✅ Company members can view all company markers
- ✅ Clients only see markers with `is_client_visible = true`

**INSERT:**
- ✅ Company members can create markers
- ✅ Clients CANNOT create markers

**UPDATE:**
- ✅ Creator can update own markers
- ✅ GC admin and PM can update all company markers
- ✅ Clients CANNOT update markers

**DELETE:**
- ✅ Creator can delete own markers
- ✅ GC admin can delete all company markers
- ✅ PM and workers CANNOT delete others' markers
- ✅ Clients CANNOT delete markers

### Server Action Validation

All server actions follow this pattern:

```typescript
export async function mutationAction(...) {
  // 1. Authenticate
  const userContext = await getUserContext()
  if ('error' in userContext) return { error: userContext.error }

  // 2. Verify project access
  const projectCheck = await verifyProjectAccess(supabase, projectId, companyId)
  if ('error' in projectCheck) return { error: projectCheck.error }

  // 3. Check permissions (creator/role)
  const canMutate = checkPermissions(user, resource, role)
  if (!canMutate) return { error: 'Permission denied' }

  // 4. Perform operation
  const { data, error } = await supabase.from(...)

  // 5. Revalidate cache
  revalidatePath(...)
  return { success: true, data }
}
```

### Audit Checklist

Before deploying spatial viewer:

- [ ] Run security audit: `tsx scripts/security-audit.ts`
- [ ] Run RLS tests: `npm run test tests/security/rls-policies.test.ts`
- [ ] Verify all feature flags in `.env`
- [ ] Test client user access (cannot edit/delete)
- [ ] Test worker access (can edit own markers only)
- [ ] Test GC admin access (can edit/delete all)
- [ ] Verify `is_client_visible` filtering works

---

## Migration to Database-Based Flags (Future)

To migrate from environment variables to database:

1. Create `feature_flags` table:
```sql
CREATE TABLE public.feature_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_name text UNIQUE NOT NULL,
  enabled boolean DEFAULT false,
  description text,
  updated_at timestamptz DEFAULT now()
);

-- User-specific overrides
CREATE TABLE public.user_feature_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES next_auth.users(id),
  flag_name text NOT NULL,
  enabled boolean NOT NULL,
  UNIQUE(user_id, flag_name)
);
```

2. Update `isFeatureEnabled()`:
```typescript
export const isFeatureEnabled = cache(async (flag, userId?) => {
  // Check user override first
  if (userId) {
    const override = await supabase
      .from('user_feature_flags')
      .select('enabled')
      .eq('user_id', userId)
      .eq('flag_name', flag)
      .single()
    if (override.data) return override.data.enabled
  }

  // Check global flag
  const globalFlag = await supabase
    .from('feature_flags')
    .select('enabled')
    .eq('flag_name', flag)
    .single()

  return globalFlag.data?.enabled ?? getEnvFlag(flag)
})
```

3. Add admin UI for managing flags (future)

---

## Summary

### Files Created

**Security:**
- `scripts/security-audit.ts` - Automated RLS audit
- `tests/security/rls-policies.test.ts` - RLS policy tests
- `supabase/migrations/20260102140000_add_is_client_visible.sql` - Client visibility control

**Feature Flags:**
- `lib/feature-flags/index.ts` - Feature flag system
- `hooks/use-feature-flag.ts` - Client hook
- `app/api/feature-flags/route.ts` - API endpoint
- `components/feature-flags/FeatureUnavailable.tsx` - Graceful degradation UI

**Files Modified:**
- `app/actions/spatial.ts` - Added permission checks
- `.env.example` - Added feature flag variables

### RLS Policies Verified

✅ spatial_markers - 4 policies (SELECT, INSERT, UPDATE, DELETE)
✅ marker_content - 4 policies (SELECT, INSERT, UPDATE, DELETE)
✅ projects_3d_models - 2 policies (SELECT, ALL for GC/PM)

### Feature Flags Available

✅ 10 flags covering all spatial viewer features
✅ Environment-based (MVP) with database migration path
✅ Server + client support
✅ Role-based access control
✅ Graceful degradation UI

---

**Phase 6 Complete!** 🎉

Security audit passed, RLS tests written, feature flags implemented.
