# Documentation Sync Report
**Date**: 2026-01-11
**Command**: `/kc:sync-docs`

---

## Summary

✅ **6 files updated**
- All indexes regenerated
- Schema documentation updated for owner system
- Role enum name corrected (gc_admin → admin)

---

## Updated Files

### 1. `.claude/docs/indexes/tables.md`
**Changes**:
- Fixed FK reference: `owners` → `next_auth.users` (was incorrectly `user_profiles`)
- Fixed FK reference: `admin_invitations` → `owners` (was incorrectly `companies`)
- Updated last modified date to 2026-01-11

**Status**: ✅ Complete

---

### 2. `.claude/docs/backend/SCHEMA_CORE.md`
**Changes**:
- Added **Owner/Admin Tables** section with:
  - `owners` table schema (platform super users)
  - `admin_invitations` table schema (owner-initiated admin invites)
  - Helper function documentation: `is_user_owner(user_id)`
- Fixed `company_users.role` enum comment: `gc_admin` → `admin`
- Updated last modified date to 2026-01-11

**Status**: ✅ Complete

---

### 3. `.claude/docs/indexes/actions.md`
**Changes**:
- **Fully regenerated** from source files
- Now includes **196 actions** across **29 files** (previously 86 actions)
- Added comprehensive owner/admin actions:
  - `owner.ts`: Platform owner management
  - `accept-admin-invite.ts`: Admin invitation acceptance
- Format updated to auto-generated style with "Purpose" column
- Updated last modified date to 2026-01-11

**Status**: ✅ Complete

**Note**: Auto-generated format is more detailed than manual version

---

### 4. `.claude/docs/indexes/components.md`
**Changes**:
- **Fully regenerated** from source files
- Now includes **264 components** across **294 files**
- Organized by directory with component type (Client/Server)
- Added comprehensive props interface tracking
- Updated last modified date to 2026-01-11

**Status**: ✅ Complete

---

### 5. `.claude/docs/indexes/routes.md`
**Changes**:
- **Fully regenerated** from source files
- Now includes **30 routes**
- Added new owner routes:
  - `/app/owner` - Owner dashboard layout
  - `/app/owner/companies` - Company management
  - `/app/owner/users` - User management
  - `/app/owner/invites` - Admin invitation management
- Added admin signup routes:
  - `/admin-invite` - Admin invitation landing
  - `/admin-invite/signup` - Admin signup form
- Updated last modified date to 2026-01-11

**Status**: ✅ Complete

---

### 6. `.claude/docs/indexes/enums.md`
**Changes**:
- Restored comprehensive manual version (auto-generator has parsing bug)
- Already contains correct `user_role` enum with `admin` (not `gc_admin`)
- Updated last modified date to 2026-01-11

**Status**: ✅ Complete

**Note**: Auto-generator regex fails on multiline enum values - manual version retained

---

## Verification

### Database Schema Changes Reflected
✅ `owners` table documented
✅ `admin_invitations` table documented  
✅ `user_role` enum shows `admin` (not `gc_admin`)
✅ Helper function `is_user_owner()` documented

### Code Changes Reflected
✅ `app/actions/owner.ts` actions indexed
✅ `app/actions/accept-admin-invite.ts` actions indexed
✅ Owner routes indexed
✅ Admin invite routes indexed

### Type Changes Reflected
✅ `tasks.ts` type refinements (internal only, no API changes)
✅ All action signatures current

---

## Not Changed (Already Current)

- `.claude/docs/domain/TASKS.md` - No public API changes in tasks.ts
- `.claude/docs/indexes/enums.md` - Already showed `admin` role
- Database migrations already applied and documented

---

## Known Issues

### Auto-Generated Enums Index
The `scripts/generate-indexes.ts` enum parser has a regex bug:
- **Issue**: Cannot parse multiline enum definitions in `database.types.ts`
- **Impact**: Generated only 10/22 enums
- **Workaround**: Manual `enums.md` retained (comprehensive, correct)
- **Fix needed**: Update regex pattern on line 390 to handle multiline values

**Recommendation**: Fix script or remove auto-generation for enums.md

---

## Sync Source Mapping

| Changed File | Affected Docs | Sync Status |
|--------------|---------------|-------------|
| `supabase/migrations/20260110000001_rename_gc_admin_to_admin.sql` | `backend/SCHEMA_CORE.md`, `indexes/enums.md` | ✅ Updated |
| `supabase/migrations/20260110000002_create_owners_table.sql` | `backend/SCHEMA_CORE.md`, `indexes/tables.md` | ✅ Updated |
| `supabase/migrations/20260110000003_create_admin_invitations_table.sql` | `backend/SCHEMA_CORE.md`, `indexes/tables.md` | ✅ Updated |
| `app/actions/tasks.ts` | `indexes/actions.md` | ✅ Updated (type changes internal only) |
| `app/actions/owner.ts` | `indexes/actions.md` | ✅ Updated |
| `app/actions/accept-admin-invite.ts` | `indexes/actions.md` | ✅ Updated |
| All components | `indexes/components.md` | ✅ Regenerated |
| All routes | `indexes/routes.md` | ✅ Regenerated |

---

## Next Actions

None required - all documentation is current.

**Optional**:
- Fix `scripts/generate-indexes.ts` enum parser regex
- Consider adding `owners` and `admin_invitations` to domain docs
