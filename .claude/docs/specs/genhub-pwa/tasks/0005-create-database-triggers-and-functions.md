# E1-T5: Create Database Triggers and Functions

**Epic**: Foundation (Week 1-2)
**Effort**: Medium
**References**: Design Section 3.13-3.15

## Description

Create database triggers and functions for automatic timestamp updates, phase creation, and completion percentage calculations.

## Subtasks

### 5.1 Create updated_at trigger function
- Create migration file `supabase/migrations/015_triggers.sql`
- Implement update_updated_at_column() function
- Apply trigger to all tables with updated_at column
- **Refs:** Design Section 3.13
- **Effort:** S
- **Files:** `supabase/migrations/015_triggers.sql`

### 5.2 Create project phases auto-creation trigger
- Add to `supabase/migrations/015_triggers.sql`
- Implement create_default_project_phases() function
- Creates 5 universal phases: Initiation, Pre-Construction, Procurement, Construction, Post-Construction
- Trigger on project INSERT
- **Refs:** Req 6.9 (Universal Phases), Design Section 3.14
- **Effort:** S
- **Files:** `supabase/migrations/015_triggers.sql`

### 5.3 Create project completion percentage auto-update trigger
- Add to `supabase/migrations/015_triggers.sql`
- Implement update_project_completion() function
- Calculates completion based on completed tasks ratio
- Trigger on task INSERT/UPDATE/DELETE
- **Refs:** Req 8.5 (Phase Completion), Design Section 3.15
- **Effort:** M
- **Files:** `supabase/migrations/015_triggers.sql`

## Acceptance Criteria

- [ ] Updated_at timestamps automatically maintained
- [ ] New projects automatically get 5 default phases
- [ ] Task changes automatically update phase/project completion
- [ ] Triggers perform efficiently without impacting insert/update speed
- [ ] All trigger functions have proper error handling

## Files to Create/Modify

- `supabase/migrations/015_triggers.sql`
