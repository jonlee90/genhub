# E5-T3: Implement Company Profile Management

**Epic**: Polish & Testing (Week 9-10)
**Effort**: Medium
**References**: Req 3 (Company Profile), Design Section 4.7, 5.1

## Description

Create company profile management page with settings form and logo upload functionality, restricted to GC Admin users.

## Subtasks

### 3.1 Create company profile server actions
- Add to `app/actions/team.ts` or create `app/actions/company.ts`
- Implement: updateCompanyProfile(), uploadCompanyLogo()
- Validate image file types and size (5MB limit)
- **Refs:** Req 3.2-3.6 (Company Profile), Design Section 4.7
- **Effort:** M
- **Files:** `app/actions/company.ts`

### 3.2 Create company settings page
- Create `app/app/settings/company/page.tsx`
- Form for company details: name, address, phone, email
- Logo upload with preview
- Only visible to GC Admin
- **Refs:** Req 3.1-3.5 (Company Settings), Design Section 5.1
- **Effort:** M
- **Files:** `app/app/settings/company/page.tsx`, `components/settings/CompanyProfileForm.tsx`

## Acceptance Criteria

- [ ] Only GC Admins can access settings page
- [ ] Company profile form displays all fields
- [ ] Logo upload validates file type/size
- [ ] Logo preview displays after upload
- [ ] Changes save correctly
- [ ] Company logo displays in header after update

## Files to Create/Modify

- `app/actions/company.ts`
- `app/app/settings/company/page.tsx`
- `components/settings/CompanyProfileForm.tsx`
