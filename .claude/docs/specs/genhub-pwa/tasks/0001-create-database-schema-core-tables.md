# E1-T1: Create Database Schema - Core Tables

**Epic**: Foundation (Week 1-2)
**Effort**: Medium
**References**: Req 3 (Company Profile), Design Section 3.1-3.4

## Description

Create the foundational database tables for multi-tenant company management, user profiles, role-based access control, and subcontractor directory.

## Subtasks

### 1.1 Create companies table with multi-tenant isolation
- Create migration file `supabase/migrations/001_companies.sql`
- Include columns: id, name, address, phone, email, logo_url, created_at, updated_at
- Enable RLS and create basic policies
- Add comments for documentation
- **Refs:** Req 3 (Company Profile), Design Section 3.1
- **Effort:** S
- **Files:** `supabase/migrations/001_companies.sql`

### 1.2 Create user_profiles table extending next-auth users
- Create migration file `supabase/migrations/002_user_profiles.sql`
- Include columns: id (FK to auth.users), name, email, avatar_url, phone, timestamps
- Enable RLS with policies for users to view/update own profile
- **Refs:** Req 1 (Authentication), Design Section 3.2
- **Effort:** S
- **Files:** `supabase/migrations/002_user_profiles.sql`

### 1.3 Create company_users table for role-based access control
- Create migration file `supabase/migrations/003_company_users.sql`
- Include columns: id, company_id, user_id, role (enum), status, invited_by, timestamps
- Role enum: gc_admin, project_manager, foreman, field_worker, subcontractor, client
- Status enum: active, invited, inactive
- Create RLS policies for company member viewing and GC admin management
- Add performance indexes on company_id and user_id
- **Refs:** Req 1.6-1.10 (Role-based access), Design Section 3.3
- **Effort:** M
- **Files:** `supabase/migrations/003_company_users.sql`

### 1.4 Create subcontractors directory table
- Create migration file `supabase/migrations/004_subcontractors.sql`
- Include columns: id, company_id, company_name, trade_specialization, contact info, license/insurance details, performance_rating
- Enable RLS for company isolation
- Add policies for GC/PM management access
- **Refs:** Req 5 (Subcontractor Directory), Design Section 3.4
- **Effort:** M
- **Files:** `supabase/migrations/004_subcontractors.sql`

## Acceptance Criteria

- [ ] All 4 migration files created and properly structured
- [ ] RLS policies enable multi-tenant isolation
- [ ] Role-based access control properly configured
- [ ] All tables have appropriate indexes for performance
- [ ] Migration files run without errors in Supabase

## Files to Create/Modify

- `supabase/migrations/001_companies.sql`
- `supabase/migrations/002_user_profiles.sql`
- `supabase/migrations/003_company_users.sql`
- `supabase/migrations/004_subcontractors.sql`
