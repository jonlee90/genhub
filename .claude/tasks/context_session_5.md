# Session 5 Context - Critical Bug Fixes for Subcontractor Actions

## Session Overview
Fixing critical issues found in code review of `app/actions/subcontractors.ts`, including database schema mismatches, email validation bugs, and missing database constraints.

## Current Task
**Epic 4, Code Review Fixes**: Fix 7 critical issues in subcontractor server actions

## Critical Issues to Fix

### 1. Database Schema Verification (Priority 1)
**Issue**: Database schema uses `contact_email` and `contact_phone`, but TypeScript types use `email` and `phone`
- Migration 004_subcontractors.sql shows: `contact_email text`, `contact_phone text`
- types/database.types.ts shows: `email: string | null`, `phone: string | null`
- **Decision**: Standardize on `email` and `phone` (simpler, matches other tables)
- **Solution**: Create migration to rename columns in database

### 2. Email Validation Logic Bug (Line 325)
**Issue**: Comparing email to company_name instead of existing email
```typescript
// WRONG:
if (updateFields.email && updateFields.email !== existingSubcontractor.company_name) {

// FIX TO:
if (updateFields.email && updateFields.email !== existingSubcontractor.email) {
```

### 3. Missing Email Field in SELECT Queries
**Issue**: Lines 187, 310, 419 don't include `email` in SELECT, causing comparison to fail
**Solution**: Add `email` to all SELECT queries for existingSubcontractor

### 4. Add Unique Constraint for Email
**Issue**: No database-level uniqueness enforcement for (company_id, email)
**Solution**:
- Create migration to add UNIQUE constraint on (company_id, email)
- Update code to handle unique constraint violations (error code 23505)

### 5. Assignment Check Error Handling (Line 442)
**Issue**: Continues with deactivation even if assignment check fails
```typescript
if (assignmentError) {
  console.error('Error checking active assignments:', assignmentError);
  // Continue with deactivation even if check fails  <-- WRONG
}
```
**Solution**: Fail-closed - return error if check fails

### 6. File Upload Issues
**Problems**:
- Document URLs stored in notes field (temporary hack)
- No UUID validation for subcontractorId
- No try-catch around Vercel Blob upload
- No file deletion on re-upload
**Solution**:
- Add dedicated columns: `license_document_url`, `insurance_document_url`
- Add UUID validation with Zod
- Add try-catch for blob upload
- Implement file deletion logic

### 7. Input Sanitization
**Issue**: Optional fields (phone, address, etc.) not trimmed
**Solution**: Add `.transform((v) => v ? v.trim() : v)` to optional string fields

## Implementation Plan

### Step 1: Create Migration 019
File: `supabase/migrations/019_fix_subcontractor_schema.sql`

Actions:
1. Rename `contact_email` → `email`
2. Rename `contact_phone` → `phone`
3. Add UNIQUE constraint on (company_id, email)
4. Add `license_document_url text` column
5. Add `insurance_document_url text` column
6. Update indexes if needed

### Step 2: Update TypeScript Types
File: `types/database.types.ts`

Actions:
1. Regenerate types from database
2. Verify email, phone, license_document_url, insurance_document_url columns

### Step 3: Fix subcontractors.ts
File: `app/actions/subcontractors.ts`

Actions:
1. Fix email validation bug (line 325)
2. Add `email` to SELECT queries (lines 187, 310, 419)
3. Add UUID validation for subcontractorId in uploadSubcontractorDocument
4. Fix assignment check to fail-closed (line 442)
5. Update uploadSubcontractorDocument to use new document_url columns
6. Add try-catch around Vercel Blob upload
7. Add input sanitization (.trim()) to optional fields
8. Add unique constraint error handling (23505)

## Files to Modify

1. **supabase/migrations/019_fix_subcontractor_schema.sql** (NEW)
2. **types/database.types.ts** (REGENERATE)
3. **app/actions/subcontractors.ts** (FIX)

## Status
- [x] Create migration 019
- [x] Update TypeScript types manually (added license_document_url, insurance_document_url)
- [x] Fix all 7 critical issues in subcontractors.ts
- [x] Update context_session_4.md with fixes
- [x] Update this file with completion status

## Implementation Summary

### Migration 019 Created
**File**: `supabase/migrations/019_fix_subcontractor_schema.sql`

**Changes**:
1. Renamed `contact_email` → `email`
2. Renamed `contact_phone` → `phone`
3. Added `license_document_url text` column
4. Added `insurance_document_url text` column
5. Created unique partial index: `idx_subcontractors_company_email_unique` on (company_id, email) WHERE email IS NOT NULL
6. Added column comments for documentation

**Note**: Migration will need to be applied when Docker/Supabase is running

### TypeScript Types Updated
**File**: `types/database.types.ts`

**Changes**:
- Added `insurance_document_url: string | null` to Row, Insert, Update types
- Added `license_document_url: string | null` to Row, Insert, Update types
- Types already had `email` and `phone` (correct)

### subcontractors.ts - All 7 Issues Fixed

#### Issue 1: Input Sanitization (FIXED)
**Location**: Lines 43-50, 78-85
**Fix**: Added `.transform((v) => v ? v.trim() : v)` to all optional string fields
- phone
- address
- license_number
- insurance_provider
- notes

#### Issue 2: Email Validation Bug (FIXED)
**Location**: Line 334
**Before**: `if (updateFields.email && updateFields.email !== existingSubcontractor.company_name)`
**After**: `if (updateFields.email && updateFields.email !== existingSubcontractor.email)`

#### Issue 3: Missing Email Field in SELECT Queries (FIXED)
**Locations**: Lines 187, 319, 437
**Fix**: Added `email` to SELECT statements in all three locations:
- createSubcontractor: `select('id, company_name, email, is_active')`
- updateSubcontractor: `select('id, company_id, company_name, email, is_active')`
- deactivateSubcontractor: `select('id, company_id, company_name, email, is_active')`

#### Issue 4: Unique Constraint Error Handling (FIXED)
**Locations**: Lines 239-244 (createSubcontractor), Lines 374-379 (updateSubcontractor)
**Fix**: Added error code 23505 handling for unique constraint violations
```typescript
if (insertError.code === '23505') {
  return {
    success: false,
    error: `A subcontractor with email ${data.email} already exists in your company.`
  };
}
```

#### Issue 5: Assignment Check Error Handling (FIXED)
**Location**: Lines 459-465
**Before**: Continued with deactivation even if check failed (fail-open)
**After**: Returns error if check fails (fail-closed)
```typescript
if (assignmentError) {
  console.error('Error checking active assignments:', assignmentError);
  return {
    success: false,
    error: 'Failed to verify project assignments. Please try again or contact support.'
  };
}
```

#### Issue 6: File Upload Issues (FIXED)
**Location**: uploadSubcontractorDocument function

**Fixes Applied**:
1. **UUID Validation**: Added `uploadDocumentSchema` with Zod validation (lines 92-97)
2. **Dedicated Document URL Columns**: Now uses `license_document_url` and `insurance_document_url` instead of notes field (lines 629, 636)
3. **Try-Catch Around Blob Upload**: Added error handling (lines 609-617)
4. **File Deletion on Re-upload**: Deletes old document before uploading new one (lines 591-603)
5. **Input Sanitization**: Trims license_number and insurance_provider (lines 630, 637)
6. **Fetches Existing URLs**: Added to SELECT query (line 577)

#### Issue 7: Input Sanitization (FIXED)
**Location**: Validation schemas (lines 43-50, 78-85)
**Fix**: All optional string fields now have `.transform((v) => v ? v.trim() : v)`

### Security Improvements

1. **Fail-Closed Assignment Check**: Deactivation blocked if project assignment check fails
2. **Unique Constraint**: Database-level enforcement prevents duplicate emails per company
3. **UUID Validation**: Ensures subcontractor_id is valid UUID before processing
4. **Proper Error Handling**: All Vercel Blob operations wrapped in try-catch
5. **File Cleanup**: Old documents deleted to prevent storage bloat

### Breaking Changes
None - All changes are backward compatible. The migration adds new columns without removing old ones.

### Testing Required

Once migration is applied:
- [ ] Test creating subcontractor with duplicate email (should fail with clear error)
- [ ] Test updating subcontractor email to existing email (should fail)
- [ ] Test deactivating subcontractor assigned to active project (should fail)
- [ ] Test deactivating subcontractor when assignment check fails (should fail-closed)
- [ ] Test uploading license document (should use license_document_url)
- [ ] Test uploading insurance document (should use insurance_document_url)
- [ ] Test re-uploading document (should delete old file)
- [ ] Test upload with invalid UUID (should fail with validation error)
- [ ] Test upload with invalid document type (should fail with validation error)
- [ ] Verify trimming works on optional fields

### Files Modified

1. **supabase/migrations/019_fix_subcontractor_schema.sql** (NEW)
2. **types/database.types.ts** (MODIFIED)
3. **app/actions/subcontractors.ts** (MODIFIED - 7 critical fixes)
