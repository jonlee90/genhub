# E4-T3: Create Subcontractor Server Actions

**Epic**: Team & PWA (Week 7-8)
**Effort**: Medium
**References**: Req 5 (Subcontractor Directory), Design Section 4.4

## Description

Create server actions for subcontractor CRUD operations and document upload management.

## Subtasks

### 3.1 Create subcontractor CRUD actions
- Create `app/actions/subcontractors.ts`
- Implement: createSubcontractor(), updateSubcontractor(), deactivateSubcontractor()
- Validate: company_name, trade_specialization, contact_name, email (required)
- Optional: phone, license info, insurance info
- Only GC/PM can manage subcontractors
- **Refs:** Req 5.2-5.4 (Subcontractor Management), Design Section 4.4
- **Effort:** M
- **Files:** `app/actions/subcontractors.ts`

### 3.2 Create document upload action for subcontractors
- Add uploadSubcontractorDocument() to actions
- Upload license/insurance documents to Vercel Blob
- Store URL and expiry date
- **Refs:** Req 5.6 (Document Upload), Design Section 4.4
- **Effort:** M
- **Files:** `app/actions/subcontractors.ts`

## Acceptance Criteria

- [ ] All subcontractor actions use Zod validation
- [ ] Only GC/PM can manage subcontractors
- [ ] Document uploads save to Vercel Blob
- [ ] Expiry dates tracked for documents
- [ ] All actions respect RLS policies
- [ ] Deactivation preserves historical data

## Files to Create/Modify

- `app/actions/subcontractors.ts`
