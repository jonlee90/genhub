# E5-T2: Create Global Search

**Epic**: Polish & Testing (Week 9-10)
**Effort**: Large
**References**: Req 30 (Search), Design Section 4.6, 5.2

## Description

Create global search functionality with command palette interface, real-time search suggestions, and mobile-optimized search experience.

## Subtasks

### 2.1 Create search server action
- Create `app/actions/search.ts`
- Search across: projects, tasks, team members
- Group results by type
- Respect RLS permissions
- **Refs:** Req 30.4-30.7 (Search), Design Section 4.6
- **Effort:** M
- **Files:** `app/actions/search.ts`

### 2.2 Create GlobalSearch component
- Create `components/app/GlobalSearch.tsx`
- Command palette style overlay (Cmd/Ctrl+K)
- Real-time search suggestions as user types
- Group results: Projects, Tasks, People
- Navigate to result on selection
- **Refs:** Req 30.1-30.6 (Search UI), Design Section 5.2
- **Effort:** L
- **Files:** `components/app/GlobalSearch.tsx`

### 2.3 Create mobile search experience
- Full-screen search on mobile
- Touch-optimized result list
- Recent searches history
- **Refs:** Req 30.8 (Mobile Search), Design Section 5.2
- **Effort:** M
- **Files:** `components/app/GlobalSearch.tsx`

## Acceptance Criteria

- [ ] Command palette opens with Cmd/Ctrl+K
- [ ] Search queries all relevant entities
- [ ] Results grouped by type
- [ ] Selection navigates to result
- [ ] Mobile search is full-screen
- [ ] Recent searches tracked on mobile
- [ ] Search respects user permissions

## Files to Create/Modify

- `app/actions/search.ts`
- `components/app/GlobalSearch.tsx`
