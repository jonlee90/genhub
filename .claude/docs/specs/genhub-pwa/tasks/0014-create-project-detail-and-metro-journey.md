# E2-T4: Create Project Detail & Metro Journey

**Epic**: Projects (Week 3-4)
**Effort**: Large
**References**: Req 8 (Metro Journey), Design Section 5.1-5.2

## Description

Create the project detail page featuring the Metro Journey visualization, phase stations, and expandable phase detail panels.

## Subtasks

### 4.1 Create project detail page with Metro Journey
- Create `app/app/projects/[id]/page.tsx` as Server Component
- Fetch project with phases, tasks, and team
- Display project header with name, client, status
- Render MetroJourney component as primary visualization
- **Refs:** Req 8.1 (Project Detail), Design Section 5.1
- **Effort:** M
- **Files:** `app/app/projects/[id]/page.tsx`

### 4.2 Create MetroJourney component
- Create `components/projects/MetroJourney.tsx`
- Render phases as connected stations on horizontal timeline
- Visual states: completed (filled green), current (highlighted/animated), upcoming (outlined)
- Connect stations with colored lines (completed = green, pending = gray)
- Support horizontal scrolling on mobile
- **Refs:** Req 8.2-8.3 (Metro Visualization), Design Section 5.2
- **Effort:** L
- **Files:** `components/projects/MetroJourney.tsx`

### 4.3 Create PhaseStation component
- Create `components/projects/PhaseStation.tsx`
- Display station circle with phase name below
- Show completion percentage inside or below station
- Add warning indicator for phases with overdue tasks
- Add blocker indicator for phases with blocked tasks
- Make clickable to expand phase details
- **Refs:** Req 8.4, 8.9-8.10 (Phase Indicators), Design Section 5.2
- **Effort:** M
- **Files:** `components/projects/PhaseStation.tsx`

### 4.4 Create PhaseDetailPanel component
- Create `components/projects/PhaseDetailPanel.tsx`
- Display when a phase station is clicked
- Show tabs: Tasks, Budget, Materials (placeholder), Documents (placeholder)
- Display phase progress percentage and date range
- Include quick "Add Task" button
- **Refs:** Req 8.4 (Phase Expansion), Design Section 5.2
- **Effort:** M
- **Files:** `components/projects/PhaseDetailPanel.tsx`

## Acceptance Criteria

- [ ] Metro Journey displays all project phases horizontally
- [ ] Phase states visually distinguish completed/current/upcoming
- [ ] Phase stations show completion percentages
- [ ] Warning/blocker indicators appear when relevant
- [ ] Clicking phase station expands detail panel
- [ ] Detail panel displays phase-specific information
- [ ] Component is mobile-responsive with horizontal scroll

## Files to Create/Modify

- `app/app/projects/[id]/page.tsx`
- `components/projects/MetroJourney.tsx`
- `components/projects/PhaseStation.tsx`
- `components/projects/PhaseDetailPanel.tsx`
