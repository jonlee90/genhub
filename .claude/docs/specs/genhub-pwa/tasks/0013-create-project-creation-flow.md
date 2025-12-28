# E2-T3: Create Project Creation Flow

**Epic**: Projects (Week 3-4)
**Effort**: Large
**References**: Req 6 (Project Creation), Design Section 5.1-5.2

## Description

Create the new project page, project creation form with validation, and project type template preview functionality.

## Subtasks

### 3.1 Create new project page
- Create `app/app/projects/new/page.tsx`
- Display CreateProjectForm component
- Redirect to project detail on success
- **Refs:** Req 6.1 (New Project Flow), Design Section 5.1
- **Effort:** S
- **Files:** `app/app/projects/new/page.tsx`

### 3.2 Create CreateProjectForm component
- Create `components/projects/CreateProjectForm.tsx`
- Use useActionState with createProject action
- Include all required fields: name, client_name, address, project_type, start_date
- Include optional fields: end_date, budget, description
- Show loading state during submission
- Display validation errors inline
- **Refs:** Req 6.2-6.7 (Project Fields), Design Section 5.2
- **Effort:** L
- **Files:** `components/projects/CreateProjectForm.tsx`

### 3.3 Implement project type template preview
- Enhance CreateProjectForm with template preview
- When project type is selected, show preview of default phases
- Display recommended initial tasks for the type (informational only)
- **Refs:** Req 6.4 (Type-specific Templates), Design Section 5.2
- **Effort:** M
- **Files:** `components/projects/CreateProjectForm.tsx`, `lib/project-templates.ts`

## Acceptance Criteria

- [ ] Form displays all required and optional fields
- [ ] Validation shows inline error messages
- [ ] Project type selection shows template preview
- [ ] Template preview displays default phases
- [ ] Form submits correctly and redirects to project detail
- [ ] Loading states display during submission
- [ ] Form is accessible and keyboard navigable

## Files to Create/Modify

- `app/app/projects/new/page.tsx`
- `components/projects/CreateProjectForm.tsx`
- `lib/project-templates.ts`
