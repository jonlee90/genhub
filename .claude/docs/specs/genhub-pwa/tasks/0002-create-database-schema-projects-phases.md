# E1-T2: Create Database Schema - Projects & Phases

**Epic**: Foundation (Week 1-2)
**Effort**: Medium
**References**: Req 6-8 (Projects, Metro Journey), Design Section 3.5-3.7

## Description

Create database schema for projects, project phases (Metro Journey), and project team assignments with proper health tracking and completion percentages.

## Subtasks

### 2.1 Create project_type and project_status enums
- Create migration file `supabase/migrations/005_project_enums.sql`
- project_type: residential, restaurant_cafe, commercial_office, industrial
- project_status: active, on_hold, completed, archived
- **Refs:** Req 6.3 (Project Types), Design Section 3.5
- **Effort:** S
- **Files:** `supabase/migrations/005_project_enums.sql`

### 2.2 Create projects table with health tracking
- Create migration file `supabase/migrations/006_projects.sql`
- Include columns: id, company_id, name, client_name, address, project_type, status, description, dates, budget, health_score, completion_percentage, created_by
- Enable RLS with company isolation policies
- Add policies for GC/PM project management
- Create indexes on company_id, status, project_type
- **Refs:** Req 6 (Project Creation), Req 7 (Project List), Design Section 3.5
- **Effort:** M
- **Files:** `supabase/migrations/006_projects.sql`

### 2.3 Create project_phases table for Metro Journey
- Create migration file `supabase/migrations/007_project_phases.sql`
- Include columns: id, project_id, name, display_order, status, completion_percentage, dates
- Enable RLS inheriting from project
- Add unique constraint on (project_id, name)
- **Refs:** Req 8 (Metro Journey View), Design Section 3.6
- **Effort:** S
- **Files:** `supabase/migrations/007_project_phases.sql`

### 2.4 Create project_team table for assignments
- Create migration file `supabase/migrations/008_project_team.sql`
- Include columns: id, project_id, user_id, role, assigned_at, assigned_by
- Enable RLS inheriting from project
- Add unique constraint on (project_id, user_id)
- **Refs:** Req 6.10 (Team Assignment), Design Section 3.7
- **Effort:** S
- **Files:** `supabase/migrations/008_project_team.sql`

## Acceptance Criteria

- [ ] All project-related tables created with proper schemas
- [ ] RLS policies inherit company isolation from projects
- [ ] Enum types defined for project types and statuses
- [ ] Indexes optimized for common queries (filtering by type, status)
- [ ] Unique constraints prevent duplicate team assignments

## Files to Create/Modify

- `supabase/migrations/005_project_enums.sql`
- `supabase/migrations/006_projects.sql`
- `supabase/migrations/007_project_phases.sql`
- `supabase/migrations/008_project_team.sql`
