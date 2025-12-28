# E4-T4: Create Subcontractor Directory

**Epic**: Team & PWA (Week 7-8)
**Effort**: Medium
**References**: Req 5 (Subcontractor Directory), Design Section 5.1-5.2

## Description

Create subcontractor directory page with list/card views, document management, and performance tracking.

## Subtasks

### 4.1 Create subcontractors page
- Create `app/app/team/subcontractors/page.tsx` as Server Component
- Fetch all subcontractors for company
- Display SubcontractorList component
- **Refs:** Req 5.1 (Subcontractor Page), Design Section 5.1
- **Effort:** S
- **Files:** `app/app/team/subcontractors/page.tsx`

### 4.2 Create SubcontractorList component
- Create `components/team/SubcontractorList.tsx`
- Display: company name, trade, contact, license status, insurance expiry, rating
- Show warning indicator for expiring docs (within 30 days)
- Search by name, trade, or contact
- **Refs:** Req 5.4-5.7 (Subcontractor Display), Design Section 5.2
- **Effort:** M
- **Files:** `components/team/SubcontractorList.tsx`

### 4.3 Create SubcontractorCard component
- Create `components/team/SubcontractorCard.tsx`
- Display detailed subcontractor info
- Show performance rating with stars
- Display document expiry with warning colors
- Edit/Deactivate actions
- **Refs:** Req 5.4, 5.9 (Performance Metrics), Design Section 5.2
- **Effort:** M
- **Files:** `components/team/SubcontractorCard.tsx`

### 4.4 Create AddSubcontractorModal component
- Create `components/team/AddSubcontractorModal.tsx`
- Form with all subcontractor fields
- File upload for license/insurance documents
- Validate file types (PDF, images) and size (5MB limit)
- **Refs:** Req 5.2-5.3 (Add Subcontractor), Design Section 5.2
- **Effort:** M
- **Files:** `components/team/AddSubcontractorModal.tsx`

## Acceptance Criteria

- [ ] Subcontractor list displays all company subcontractors
- [ ] Search and filtering work correctly
- [ ] Warning indicators show for expiring documents
- [ ] Performance ratings display correctly
- [ ] Document upload validates file types/sizes
- [ ] Edit/deactivate actions work correctly

## Files to Create/Modify

- `app/app/team/subcontractors/page.tsx`
- `components/team/SubcontractorList.tsx`
- `components/team/SubcontractorCard.tsx`
- `components/team/AddSubcontractorModal.tsx`
