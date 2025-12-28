# E2-T2: Create Projects List Page

**Epic**: Projects (Week 3-4)
**Effort**: Medium
**References**: Req 7 (Projects List), Design Section 5.1-5.2

## Description

Create the projects list page with server-side data fetching, project cards, filtering, sorting, and empty states.

## Subtasks

### 2.1 Create projects list page with server-side data fetching
- Create `app/app/projects/page.tsx` as Server Component
- Fetch projects for user's company with RLS
- Display ProjectListClient component with initial data
- **Refs:** Req 7.1 (Projects Page), Design Section 5.1
- **Effort:** M
- **Files:** `app/app/projects/page.tsx`

### 2.2 Create ProjectCard component
- Create `components/projects/ProjectCard.tsx`
- Display: project name, client, type, phase, health score badge, progress bar
- Make entire card clickable to project detail
- Show type-specific icon (Residential, Commercial, etc.)
- **Refs:** Req 7.2-7.3 (Project Display), Design Section 5.2
- **Effort:** M
- **Files:** `components/projects/ProjectCard.tsx`

### 2.3 Create ProjectFilters component
- Create `components/projects/ProjectFilters.tsx`
- Implement status filter dropdown (Active, On Hold, Completed, Archived)
- Implement type filter dropdown
- Implement search input for name/client
- Implement sort dropdown (name, start date, health score, completion)
- Store filter state in URL params for shareable links
- **Refs:** Req 7.4-7.8 (Filtering and Sorting), Design Section 5.2
- **Effort:** M
- **Files:** `components/projects/ProjectFilters.tsx`

### 2.4 Create ProjectList component with filtering
- Create `components/projects/ProjectList.tsx`
- Render project cards in grid layout
- Apply filters from URL params
- Show "No results found" when empty
- Show "Create your first project" when no projects at all
- **Refs:** Req 7.8-7.9 (Empty States), Design Section 5.2
- **Effort:** M
- **Files:** `components/projects/ProjectList.tsx`

## Acceptance Criteria

- [ ] Projects list displays all company projects
- [ ] Filters work correctly and update URL params
- [ ] Sorting changes project card order
- [ ] Search filters by project name or client name
- [ ] Empty states display appropriate messages
- [ ] Cards link to project detail pages
- [ ] Layout is responsive on mobile

## Files to Create/Modify

- `app/app/projects/page.tsx`
- `components/projects/ProjectCard.tsx`
- `components/projects/ProjectFilters.tsx`
- `components/projects/ProjectList.tsx`
