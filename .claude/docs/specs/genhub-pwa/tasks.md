# GenHub PWA - Implementation Task List

## Overview

This document provides a comprehensive, task-by-task implementation plan for the GenHub PWA. Tasks are organized into 5 epics aligned with the 10-week development timeline. Each task is designed to be actionable by a coding agent with clear acceptance criteria and file references.

**References:**
- Requirements: `docs/specs/genhub-pwa/requirements.md`
- Design: `docs/specs/genhub-pwa/design.md`
- Project Structure: `.claude/rules/add_new_files_project_structure_rules.md`

---

## Epic 1: Foundation (Week 1-2)

Database schema, authentication, and core application layout.

### E1-T1: Create Database Schema - Core Tables

- [ ] **1.1 Create companies table with multi-tenant isolation**
  - Create migration file `supabase/migrations/001_companies.sql`
  - Include columns: id, name, address, phone, email, logo_url, created_at, updated_at
  - Enable RLS and create basic policies
  - Add comments for documentation
  - **Refs:** Req 3 (Company Profile), Design Section 3.1
  - **Effort:** S
  - **Files:** `supabase/migrations/001_companies.sql`

- [ ] **1.2 Create user_profiles table extending next-auth users**
  - Create migration file `supabase/migrations/002_user_profiles.sql`
  - Include columns: id (FK to auth.users), name, email, avatar_url, phone, timestamps
  - Enable RLS with policies for users to view/update own profile
  - **Refs:** Req 1 (Authentication), Design Section 3.2
  - **Effort:** S
  - **Files:** `supabase/migrations/002_user_profiles.sql`

- [ ] **1.3 Create company_users table for role-based access control**
  - Create migration file `supabase/migrations/003_company_users.sql`
  - Include columns: id, company_id, user_id, role (enum), status, invited_by, timestamps
  - Role enum: gc_admin, project_manager, foreman, field_worker, subcontractor, client
  - Status enum: active, invited, inactive
  - Create RLS policies for company member viewing and GC admin management
  - Add performance indexes on company_id and user_id
  - **Refs:** Req 1.6-1.10 (Role-based access), Design Section 3.3
  - **Effort:** M
  - **Files:** `supabase/migrations/003_company_users.sql`

- [ ] **1.4 Create subcontractors directory table**
  - Create migration file `supabase/migrations/004_subcontractors.sql`
  - Include columns: id, company_id, company_name, trade_specialization, contact info, license/insurance details, performance_rating
  - Enable RLS for company isolation
  - Add policies for GC/PM management access
  - **Refs:** Req 5 (Subcontractor Directory), Design Section 3.4
  - **Effort:** M
  - **Files:** `supabase/migrations/004_subcontractors.sql`

### E1-T2: Create Database Schema - Projects & Phases

- [ ] **2.1 Create project_type and project_status enums**
  - Create migration file `supabase/migrations/005_project_enums.sql`
  - project_type: residential, restaurant_cafe, commercial_office, industrial
  - project_status: active, on_hold, completed, archived
  - **Refs:** Req 6.3 (Project Types), Design Section 3.5
  - **Effort:** S
  - **Files:** `supabase/migrations/005_project_enums.sql`

- [ ] **2.2 Create projects table with health tracking**
  - Create migration file `supabase/migrations/006_projects.sql`
  - Include columns: id, company_id, name, client_name, address, project_type, status, description, dates, budget, health_score, completion_percentage, created_by
  - Enable RLS with company isolation policies
  - Add policies for GC/PM project management
  - Create indexes on company_id, status, project_type
  - **Refs:** Req 6 (Project Creation), Req 7 (Project List), Design Section 3.5
  - **Effort:** M
  - **Files:** `supabase/migrations/006_projects.sql`

- [ ] **2.3 Create project_phases table for Metro Journey**
  - Create migration file `supabase/migrations/007_project_phases.sql`
  - Include columns: id, project_id, name, display_order, status, completion_percentage, dates
  - Enable RLS inheriting from project
  - Add unique constraint on (project_id, name)
  - **Refs:** Req 8 (Metro Journey View), Design Section 3.6
  - **Effort:** S
  - **Files:** `supabase/migrations/007_project_phases.sql`

- [ ] **2.4 Create project_team table for assignments**
  - Create migration file `supabase/migrations/008_project_team.sql`
  - Include columns: id, project_id, user_id, role, assigned_at, assigned_by
  - Enable RLS inheriting from project
  - Add unique constraint on (project_id, user_id)
  - **Refs:** Req 6.10 (Team Assignment), Design Section 3.7
  - **Effort:** S
  - **Files:** `supabase/migrations/008_project_team.sql`

### E1-T3: Create Database Schema - Tasks

- [ ] **3.1 Create task_status and task_priority enums**
  - Create migration file `supabase/migrations/009_task_enums.sql`
  - task_status: todo, in_progress, review, blocked, completed
  - task_priority: low, medium, high, critical
  - **Refs:** Req 9.4-9.5 (Task Status/Priority), Design Section 3.8
  - **Effort:** S
  - **Files:** `supabase/migrations/009_task_enums.sql`

- [ ] **3.2 Create tasks table with assignment and cost tracking**
  - Create migration file `supabase/migrations/010_tasks.sql`
  - Include columns: id, project_id, phase_id, title, description, status, priority, assignee_id, due_date, planned_cost, actual_cost, blocker_reason, created_by, timestamps
  - Enable RLS inheriting from project
  - Add policies for task creators and assignees
  - Create indexes on project_id, phase_id, assignee_id, status
  - **Refs:** Req 9 (Task Creation), Req 11 (Task Detail), Design Section 3.8
  - **Effort:** M
  - **Files:** `supabase/migrations/010_tasks.sql`

- [ ] **3.3 Create task_dependencies table**
  - Create migration file `supabase/migrations/011_task_dependencies.sql`
  - Include columns: id, task_id, depends_on_task_id, created_at
  - Add check constraint to prevent self-dependencies
  - Enable RLS inheriting from task
  - **Refs:** Req 9.9 (Task Dependencies), Design Section 3.9
  - **Effort:** S
  - **Files:** `supabase/migrations/011_task_dependencies.sql`

- [ ] **3.4 Create task_activity table for audit logging**
  - Create migration file `supabase/migrations/012_task_activity.sql`
  - Include columns: id, task_id, user_id, action, old_value, new_value, comment, created_at
  - Enable RLS inheriting from task
  - Create indexes on task_id and created_at
  - **Refs:** Req 11.4 (Activity History), Design Section 3.10
  - **Effort:** S
  - **Files:** `supabase/migrations/012_task_activity.sql`

### E1-T4: Create Database Schema - Support Tables

- [ ] **4.1 Create notifications table**
  - Create migration file `supabase/migrations/013_notifications.sql`
  - Create notification_type enum: task_assigned, task_completed, task_overdue, task_blocked, project_update, team_invited, mention
  - Include columns: id, user_id, type, title, message, link, read, created_at
  - Enable RLS for user-only access
  - Create indexes on user_id, read, created_at
  - **Refs:** Req 27 (Notification System), Design Section 3.11
  - **Effort:** M
  - **Files:** `supabase/migrations/013_notifications.sql`

- [ ] **4.2 Create attachments table for file storage metadata**
  - Create migration file `supabase/migrations/014_attachments.sql`
  - Include columns: id, entity_type, entity_id, file_name, file_url, file_type, file_size, uploaded_by, created_at
  - entity_type enum: task, project, phase, profile
  - Enable RLS with entity-based access control
  - **Refs:** Req 11.10 (Task Attachments), Design Section 3.12
  - **Effort:** M
  - **Files:** `supabase/migrations/014_attachments.sql`

### E1-T5: Create Database Triggers and Functions

- [ ] **5.1 Create updated_at trigger function**
  - Create migration file `supabase/migrations/015_triggers.sql`
  - Implement update_updated_at_column() function
  - Apply trigger to all tables with updated_at column
  - **Refs:** Design Section 3.13
  - **Effort:** S
  - **Files:** `supabase/migrations/015_triggers.sql`

- [ ] **5.2 Create project phases auto-creation trigger**
  - Add to `supabase/migrations/015_triggers.sql`
  - Implement create_default_project_phases() function
  - Creates 5 universal phases: Initiation, Pre-Construction, Procurement, Construction, Post-Construction
  - Trigger on project INSERT
  - **Refs:** Req 6.9 (Universal Phases), Design Section 3.14
  - **Effort:** S
  - **Files:** `supabase/migrations/015_triggers.sql`

- [ ] **5.3 Create project completion percentage auto-update trigger**
  - Add to `supabase/migrations/015_triggers.sql`
  - Implement update_project_completion() function
  - Calculates completion based on completed tasks ratio
  - Trigger on task INSERT/UPDATE/DELETE
  - **Refs:** Req 8.5 (Phase Completion), Design Section 3.15
  - **Effort:** M
  - **Files:** `supabase/migrations/015_triggers.sql`

### E1-T6: Generate TypeScript Types from Database

- [ ] **6.1 Generate Supabase TypeScript types**
  - Run `npx supabase gen types typescript` after migrations
  - Save output to `types/database.types.ts`
  - Verify all tables and enums are correctly typed
  - **Refs:** Design Section 3, `.claude/rules/supabase_types.md`
  - **Effort:** S
  - **Files:** `types/database.types.ts`

### E1-T7: Configure Authentication with Supabase Integration

- [ ] **7.1 Verify and update next-auth configuration**
  - Review existing `lib/auth.config.ts` and `lib/auth.ts`
  - Ensure Supabase JWT integration is configured
  - Add user profile fetching after sign-in
  - **Refs:** Req 1.1-1.5 (Authentication), Design Section 6.1
  - **Effort:** M
  - **Files:** `lib/auth.config.ts`, `lib/auth.ts`

- [ ] **7.2 Create middleware for protected routes**
  - Update `middleware.ts` to protect `/app/*` routes
  - Redirect unauthenticated users to `/sign-in`
  - Preserve intended destination for post-login redirect
  - **Refs:** Req 1.1 (Redirect Unauthenticated), Design Section 6.1
  - **Effort:** S
  - **Files:** `middleware.ts`

- [ ] **7.3 Create user onboarding flow for company assignment**
  - Create `app/app/onboarding/page.tsx`
  - Check if user has company_users entry on first login
  - Prompt to create company or show pending invitations
  - Redirect to dashboard after company assignment
  - **Refs:** Req 3.1 (First Login Prompt), Design Section 8.1
  - **Effort:** M
  - **Files:** `app/app/onboarding/page.tsx`, `components/app/OnboardingForm.tsx`

### E1-T8: Create Core Application Layout

- [ ] **8.1 Create authenticated app layout with sidebar**
  - Create `app/app/layout.tsx` with sidebar and header structure
  - Import and configure providers (Session, Theme)
  - Set up responsive layout (desktop sidebar, mobile hamburger)
  - **Refs:** Req 2.2-2.4 (Navigation), Design Section 5.1
  - **Effort:** M
  - **Files:** `app/app/layout.tsx`

- [ ] **8.2 Implement Sidebar navigation component**
  - Create `components/app/Sidebar.tsx`
  - Add navigation items: Dashboard, Projects, Tasks, Team, Settings
  - Implement active state highlighting based on pathname
  - Support collapsible state for mobile
  - **Refs:** Req 2.2 (Sidebar Navigation), Req 2.8 (Active Highlighting), Design Section 5.2
  - **Effort:** M
  - **Files:** `components/app/Sidebar.tsx`

- [ ] **8.3 Implement Header component with user menu**
  - Create `components/app/Header.tsx`
  - Include company logo/name display
  - Add notification bell component
  - Add user avatar dropdown with sign-out option
  - **Refs:** Req 2.2 (Dashboard Header), Design Section 5.2
  - **Effort:** M
  - **Files:** `components/app/Header.tsx`, `components/app/UserMenu.tsx`

- [ ] **8.4 Implement NotificationBell dropdown component**
  - Create `components/app/NotificationBell.tsx`
  - Show unread count badge
  - Display notification list in dropdown
  - Mark notifications as read on click
  - **Refs:** Req 27.4-27.5 (In-app Notifications), Design Section 5.2
  - **Effort:** M
  - **Files:** `components/app/NotificationBell.tsx`

### E1-T9: Create Dashboard Home Page

- [ ] **9.1 Create dashboard page with role-based content**
  - Create `app/app/page.tsx` as Server Component
  - Fetch user's company and role
  - Display role-appropriate widgets
  - Show onboarding message if no projects exist
  - **Refs:** Req 2.1 (Role-appropriate Dashboard), Req 2.7 (No Projects State), Design Section 5.1
  - **Effort:** M
  - **Files:** `app/app/page.tsx`

- [ ] **9.2 Create dashboard widgets components**
  - Create `components/app/DashboardWidgets.tsx`
  - Implement: ProjectListWidget, HealthScoresWidget, PendingApprovalsWidget, BudgetOverviewWidget, ActivityFeedWidget
  - Each widget fetches own data via Server Component
  - **Refs:** Req 2.6 (Dashboard Widgets), Design Section 5.2
  - **Effort:** L
  - **Files:** `components/app/DashboardWidgets.tsx`, `components/app/widgets/*.tsx`

- [ ] **9.3 Create activity feed component**
  - Create `components/app/ActivityFeed.tsx`
  - Show recent updates across projects, tasks
  - Include timestamp and user avatar
  - Link to relevant items on click
  - **Refs:** Req 2.10 (Activity Feed), Design Section 5.2
  - **Effort:** M
  - **Files:** `components/app/ActivityFeed.tsx`

### E1-T10: Create Error and Loading States

- [ ] **10.1 Create app-level error boundary**
  - Create `app/app/error.tsx` as Client Component
  - Display user-friendly error message
  - Include "Try again" button with reset
  - **Refs:** Req 31.5 (Error Messages), Design Section 7.1
  - **Effort:** S
  - **Files:** `app/app/error.tsx`

- [ ] **10.2 Create loading skeleton components**
  - Create `components/ui/Skeleton.tsx` (if not exists)
  - Create page-specific skeletons: DashboardSkeleton, ProjectListSkeleton, TaskBoardSkeleton
  - **Refs:** Req 31.1 (Skeleton Loaders), Design Section 7.3
  - **Effort:** M
  - **Files:** `components/ui/Skeleton.tsx`, `app/app/loading.tsx`

- [ ] **10.3 Create not-found page**
  - Create `app/app/not-found.tsx`
  - Display helpful 404 message
  - Include navigation options to return to dashboard
  - **Refs:** Req 31.9 (404 Page), Design Section 7.1
  - **Effort:** S
  - **Files:** `app/app/not-found.tsx`

---

## Epic 2: Projects (Week 3-4)

Project CRUD operations and Metro Journey visualization.

### E2-T1: Create Projects Server Actions

- [ ] **1.1 Create project creation server action**
  - Create `app/actions/projects.ts`
  - Implement createProject() with Zod validation
  - Validate: name, client_name, address, project_type, start_date (required)
  - Check user permissions (GC Admin or PM)
  - Insert into projects table
  - Revalidate `/app/projects` path
  - **Refs:** Req 6.1-6.8 (Project Creation), Design Section 4.1
  - **Effort:** M
  - **Files:** `app/actions/projects.ts`

- [ ] **1.2 Create project update server action**
  - Add updateProject() to `app/actions/projects.ts`
  - Support updating all editable fields
  - Validate user has edit permissions
  - Revalidate project detail and list paths
  - **Refs:** Req 7 (Project Management), Design Section 4.1
  - **Effort:** M
  - **Files:** `app/actions/projects.ts`

- [ ] **1.3 Create project status update server action**
  - Add updateProjectStatus() to `app/actions/projects.ts`
  - Support: active, on_hold, completed, archived
  - Validate user permissions
  - Revalidate relevant paths
  - **Refs:** Req 7.4 (Status Filter), Design Section 4.1
  - **Effort:** S
  - **Files:** `app/actions/projects.ts`

- [ ] **1.4 Create project team assignment server actions**
  - Add assignProjectTeamMember() and removeProjectTeamMember()
  - Validate project access and user existence
  - Create notification for assigned user
  - **Refs:** Req 6.10 (Team Assignment), Design Section 4.1
  - **Effort:** M
  - **Files:** `app/actions/projects.ts`

### E2-T2: Create Projects List Page

- [ ] **2.1 Create projects list page with server-side data fetching**
  - Create `app/app/projects/page.tsx` as Server Component
  - Fetch projects for user's company with RLS
  - Display ProjectListClient component with initial data
  - **Refs:** Req 7.1 (Projects Page), Design Section 5.1
  - **Effort:** M
  - **Files:** `app/app/projects/page.tsx`

- [ ] **2.2 Create ProjectCard component**
  - Create `components/projects/ProjectCard.tsx`
  - Display: project name, client, type, phase, health score badge, progress bar
  - Make entire card clickable to project detail
  - Show type-specific icon (Residential, Commercial, etc.)
  - **Refs:** Req 7.2-7.3 (Project Display), Design Section 5.2
  - **Effort:** M
  - **Files:** `components/projects/ProjectCard.tsx`

- [ ] **2.3 Create ProjectFilters component**
  - Create `components/projects/ProjectFilters.tsx`
  - Implement status filter dropdown (Active, On Hold, Completed, Archived)
  - Implement type filter dropdown
  - Implement search input for name/client
  - Implement sort dropdown (name, start date, health score, completion)
  - Store filter state in URL params for shareable links
  - **Refs:** Req 7.4-7.8 (Filtering and Sorting), Design Section 5.2
  - **Effort:** M
  - **Files:** `components/projects/ProjectFilters.tsx`

- [ ] **2.4 Create ProjectList component with filtering**
  - Create `components/projects/ProjectList.tsx`
  - Render project cards in grid layout
  - Apply filters from URL params
  - Show "No results found" when empty
  - Show "Create your first project" when no projects at all
  - **Refs:** Req 7.8-7.9 (Empty States), Design Section 5.2
  - **Effort:** M
  - **Files:** `components/projects/ProjectList.tsx`

### E2-T3: Create Project Creation Flow

- [ ] **3.1 Create new project page**
  - Create `app/app/projects/new/page.tsx`
  - Display CreateProjectForm component
  - Redirect to project detail on success
  - **Refs:** Req 6.1 (New Project Flow), Design Section 5.1
  - **Effort:** S
  - **Files:** `app/app/projects/new/page.tsx`

- [ ] **3.2 Create CreateProjectForm component**
  - Create `components/projects/CreateProjectForm.tsx`
  - Use useActionState with createProject action
  - Include all required fields: name, client_name, address, project_type, start_date
  - Include optional fields: end_date, budget, description
  - Show loading state during submission
  - Display validation errors inline
  - **Refs:** Req 6.2-6.7 (Project Fields), Design Section 5.2
  - **Effort:** L
  - **Files:** `components/projects/CreateProjectForm.tsx`

- [ ] **3.3 Implement project type template preview**
  - Enhance CreateProjectForm with template preview
  - When project type is selected, show preview of default phases
  - Display recommended initial tasks for the type (informational only)
  - **Refs:** Req 6.4 (Type-specific Templates), Design Section 5.2
  - **Effort:** M
  - **Files:** `components/projects/CreateProjectForm.tsx`, `lib/project-templates.ts`

### E2-T4: Create Project Detail Page

- [ ] **4.1 Create project detail page with Metro Journey**
  - Create `app/app/projects/[id]/page.tsx` as Server Component
  - Fetch project with phases, tasks, and team
  - Display project header with name, client, status
  - Render MetroJourney component as primary visualization
  - **Refs:** Req 8.1 (Project Detail), Design Section 5.1
  - **Effort:** M
  - **Files:** `app/app/projects/[id]/page.tsx`

- [ ] **4.2 Create MetroJourney component**
  - Create `components/projects/MetroJourney.tsx`
  - Render phases as connected stations on horizontal timeline
  - Visual states: completed (filled green), current (highlighted/animated), upcoming (outlined)
  - Connect stations with colored lines (completed = green, pending = gray)
  - Support horizontal scrolling on mobile
  - **Refs:** Req 8.2-8.3 (Metro Visualization), Design Section 5.2
  - **Effort:** L
  - **Files:** `components/projects/MetroJourney.tsx`

- [ ] **4.3 Create PhaseStation component**
  - Create `components/projects/PhaseStation.tsx`
  - Display station circle with phase name below
  - Show completion percentage inside or below station
  - Add warning indicator for phases with overdue tasks
  - Add blocker indicator for phases with blocked tasks
  - Make clickable to expand phase details
  - **Refs:** Req 8.4, 8.9-8.10 (Phase Indicators), Design Section 5.2
  - **Effort:** M
  - **Files:** `components/projects/PhaseStation.tsx`

- [ ] **4.4 Create PhaseDetailPanel component**
  - Create `components/projects/PhaseDetailPanel.tsx`
  - Display when a phase station is clicked
  - Show tabs: Tasks, Budget, Materials (placeholder), Documents (placeholder)
  - Display phase progress percentage and date range
  - Include quick "Add Task" button
  - **Refs:** Req 8.4 (Phase Expansion), Design Section 5.2
  - **Effort:** M
  - **Files:** `components/projects/PhaseDetailPanel.tsx`

### E2-T5: Create Phase Management Actions

- [ ] **5.1 Create phase update server action**
  - Add updatePhaseStatus() to `app/actions/projects.ts`
  - Support manual status updates (pending, in_progress, completed)
  - Auto-mark completed when 100% tasks done
  - Revalidate project detail path
  - **Refs:** Req 8.5-8.6 (Phase Status), Design Section 4.1
  - **Effort:** S
  - **Files:** `app/actions/projects.ts`

- [ ] **5.2 Implement phase completion auto-detection**
  - Modify updatePhaseStatus to check task completion
  - When all tasks in phase are completed, auto-mark phase as completed
  - When all phases completed, mark project as completed
  - **Refs:** Req 8.5, 8.7 (Auto-completion), Design Section 4.1
  - **Effort:** M
  - **Files:** `app/actions/projects.ts`

### E2-T6: Create Project Settings and Team Management

- [ ] **6.1 Create project settings tab component**
  - Create `components/projects/ProjectSettings.tsx`
  - Allow editing project details (name, dates, budget)
  - Show project status with change option
  - Display audit info (created by, created at)
  - **Refs:** Req 6 (Project Management), Design Section 5.2
  - **Effort:** M
  - **Files:** `components/projects/ProjectSettings.tsx`

- [ ] **6.2 Create project team management component**
  - Create `components/projects/ProjectTeam.tsx`
  - Display current team members with roles
  - Add team member selector from company users
  - Remove team member option for GC/PM
  - **Refs:** Req 6.10 (Team Assignment), Design Section 5.2
  - **Effort:** M
  - **Files:** `components/projects/ProjectTeam.tsx`

---

## Epic 3: Tasks (Week 5-6)

Task CRUD, Kanban board, List view, and Task detail.

### E3-T1: Create Tasks Server Actions

- [ ] **1.1 Create task creation server action**
  - Create `app/actions/tasks.ts`
  - Implement createTask() with Zod validation
  - Required: title, project_id; Optional: phase_id, description, assignee_id, due_date, priority, planned_cost
  - Verify user has access to project
  - Log creation in task_activity
  - Create notification for assignee if assigned
  - Revalidate task list and project detail
  - **Refs:** Req 9.1-9.8 (Task Creation), Design Section 4.2
  - **Effort:** M
  - **Files:** `app/actions/tasks.ts`

- [ ] **1.2 Create task update server action**
  - Add updateTask() to `app/actions/tasks.ts`
  - Support all editable fields
  - Log changes in task_activity with old/new values
  - Notify assignee on assignment change
  - **Refs:** Req 11.3 (Task Update), Design Section 4.2
  - **Effort:** M
  - **Files:** `app/actions/tasks.ts`

- [ ] **1.3 Create task status update server action**
  - Add updateTaskStatus() to `app/actions/tasks.ts`
  - Handle all status transitions
  - Require blocker_reason when status = blocked
  - Notify PM when task is blocked
  - Log status change in activity
  - Update phase/project completion percentages
  - **Refs:** Req 10.3 (Drag Status Change), Req 11.8 (Blocked Reason), Design Section 4.2
  - **Effort:** M
  - **Files:** `app/actions/tasks.ts`

- [ ] **1.4 Create task dependency management actions**
  - Add addTaskDependency() and removeTaskDependency()
  - Validate both tasks exist and are in same project
  - Prevent circular dependencies
  - Auto-block dependent tasks when prerequisite incomplete
  - **Refs:** Req 9.9 (Dependencies), Req 11.11 (Dependent Display), Design Section 4.2
  - **Effort:** M
  - **Files:** `app/actions/tasks.ts`

- [ ] **1.5 Create task comment/activity server action**
  - Add addTaskComment() to `app/actions/tasks.ts`
  - Log comment in task_activity
  - Notify task participants
  - **Refs:** Req 11.5-11.6 (Task Chatroom), Design Section 4.2
  - **Effort:** S
  - **Files:** `app/actions/tasks.ts`

### E3-T2: Create Task Board Page

- [ ] **2.1 Create tasks page with view toggle**
  - Create `app/app/tasks/page.tsx` as Server Component
  - Fetch all tasks for user's company
  - Support URL param for view mode (kanban/list)
  - Pass tasks to TaskBoard client component
  - **Refs:** Req 10.1 (View Toggle), Design Section 5.1
  - **Effort:** M
  - **Files:** `app/app/tasks/page.tsx`

- [ ] **2.2 Create TaskBoard container component**
  - Create `components/tasks/TaskBoard.tsx`
  - Implement view toggle (Kanban/List buttons)
  - Apply task filters (assignee, project, phase, priority)
  - Persist view preference in URL and localStorage
  - **Refs:** Req 10.1 (Toggle), Req 10.9 (Filters), Design Section 5.2
  - **Effort:** M
  - **Files:** `components/tasks/TaskBoard.tsx`

- [ ] **2.3 Create TaskFilters component**
  - Create `components/tasks/TaskFilters.tsx`
  - Filter by: assignee, project, phase, priority
  - Search by task title
  - Store in URL params for shareability
  - **Refs:** Req 10.9 (Task Filtering), Design Section 5.2
  - **Effort:** M
  - **Files:** `components/tasks/TaskFilters.tsx`

### E3-T3: Create Kanban Board View

- [ ] **3.1 Create KanbanBoard component with drag-and-drop**
  - Create `components/tasks/KanbanBoard.tsx`
  - Use @dnd-kit/core for drag-and-drop
  - Create 5 columns: To Do, In Progress, Review, Blocked, Completed
  - Show task count in column headers
  - Handle drag end to update task status
  - **Refs:** Req 10.2-10.3 (Kanban Columns, Drag), Design Section 5.3
  - **Effort:** L
  - **Files:** `components/tasks/KanbanBoard.tsx`

- [ ] **3.2 Create KanbanColumn component**
  - Create `components/tasks/KanbanColumn.tsx`
  - Implement droppable area for @dnd-kit
  - Display column header with title and count
  - Render TaskCard components for each task
  - Style blocked column with warning background
  - **Refs:** Req 10.2 (Kanban Columns), Design Section 5.3
  - **Effort:** M
  - **Files:** `components/tasks/KanbanColumn.tsx`

- [ ] **3.3 Create TaskCard component (draggable)**
  - Create `components/tasks/TaskCard.tsx`
  - Display: title, assignee avatar, due date, priority badge
  - Implement draggable for @dnd-kit
  - Show material badge if task has materials
  - Show overdue indicator (red) if past due date
  - Show blocked icon with tooltip if blocked
  - Make clickable to open task detail
  - **Refs:** Req 10.6-10.8 (Task Display, Overdue, Blocked), Design Section 5.3
  - **Effort:** M
  - **Files:** `components/tasks/TaskCard.tsx`

- [ ] **3.4 Implement optimistic updates for drag-and-drop**
  - Use useOptimistic hook for instant UI feedback
  - Update task status optimistically on drag end
  - Rollback on server error
  - Show toast notification on success/error
  - **Refs:** Req 10.3 (Immediate Update), Design Section 6.2
  - **Effort:** M
  - **Files:** `components/tasks/KanbanBoard.tsx`

### E3-T4: Create List View

- [ ] **4.1 Create TaskList component**
  - Create `components/tasks/TaskList.tsx`
  - Display tasks in sortable table format
  - Columns: Title, Project, Phase, Assignee, Due Date, Priority, Status
  - Support sorting by clicking column headers
  - **Refs:** Req 10.4 (List View), Design Section 5.3
  - **Effort:** M
  - **Files:** `components/tasks/TaskList.tsx`

- [ ] **4.2 Create TaskRow component with inline editing**
  - Create `components/tasks/TaskRow.tsx`
  - Display all task info in row format
  - Enable inline status change via dropdown
  - Enable inline priority change via dropdown
  - Make row clickable to open task detail
  - **Refs:** Req 10.4 (Fast Editing), Design Section 5.3
  - **Effort:** M
  - **Files:** `components/tasks/TaskRow.tsx`

### E3-T5: Create Task Detail Panel

- [ ] **5.1 Create task detail page**
  - Create `app/app/tasks/[id]/page.tsx` as Server Component
  - Fetch task with project, phase, assignee, activity
  - Display TaskDetail component
  - **Refs:** Req 10.5, 11.1 (Task Detail), Design Section 5.1
  - **Effort:** M
  - **Files:** `app/app/tasks/[id]/page.tsx`

- [ ] **5.2 Create TaskDetail component**
  - Create `components/tasks/TaskDetail.tsx`
  - Display all task fields in editable form
  - Include: title, description, assignee selector, project/phase display, due date picker, priority selector, status selector, planned cost
  - Save changes on blur or explicit save
  - **Refs:** Req 11.2-11.3 (Task Fields), Design Section 5.3
  - **Effort:** L
  - **Files:** `components/tasks/TaskDetail.tsx`

- [ ] **5.3 Create TaskActivityLog component**
  - Create `components/tasks/TaskActivityLog.tsx`
  - Display activity timeline with: timestamp, user, action, old/new values
  - Show comments in timeline
  - Add comment input at bottom
  - **Refs:** Req 11.4-11.6 (Activity, Chatroom), Design Section 5.3
  - **Effort:** M
  - **Files:** `components/tasks/TaskActivityLog.tsx`

- [ ] **5.4 Create TaskDependencies component**
  - Create `components/tasks/TaskDependencies.tsx`
  - Display dependent tasks with status
  - Display blocking tasks (tasks this one depends on)
  - Allow adding/removing dependencies
  - **Refs:** Req 11.11 (Dependent Tasks), Design Section 5.3
  - **Effort:** M
  - **Files:** `components/tasks/TaskDependencies.tsx`

- [ ] **5.5 Create blocked reason modal**
  - Create `components/tasks/BlockedReasonModal.tsx`
  - Open when status changed to "Blocked"
  - Require reason text input
  - Save reason with status update
  - **Refs:** Req 11.8 (Blocked Reason), Design Section 5.3
  - **Effort:** S
  - **Files:** `components/tasks/BlockedReasonModal.tsx`

### E3-T6: Create Task Creation Flow

- [ ] **6.1 Create CreateTaskForm component**
  - Create `components/tasks/CreateTaskForm.tsx`
  - Use useActionState with createTask action
  - Project selector (required)
  - Phase selector (optional, filtered by project)
  - All task fields with validation
  - Show in modal or dedicated page
  - **Refs:** Req 9.1-9.7 (Task Creation), Design Section 5.3
  - **Effort:** M
  - **Files:** `components/tasks/CreateTaskForm.tsx`

- [ ] **6.2 Create quick task creation inline**
  - Add inline task creation to KanbanColumn
  - Simple input field at bottom of column
  - Creates task with default status matching column
  - **Refs:** Req 9 (Task Creation), Design Section 5.3
  - **Effort:** S
  - **Files:** `components/tasks/QuickTaskInput.tsx`

---

## Epic 4: Team & PWA (Week 7-8)

Team member management, subcontractor directory, and PWA configuration.

### E4-T1: Create Team Server Actions

- [ ] **1.1 Create team member invitation server action**
  - Create `app/actions/team.ts`
  - Implement inviteTeamMember() with Zod validation
  - Require: email, name, role; Only GC Admin can invite
  - Check for existing user; Create placeholder if not exists
  - Create company_users entry with status=invited
  - Send invitation email with accept link
  - **Refs:** Req 4.2-4.4 (Team Invitation), Design Section 4.3
  - **Effort:** M
  - **Files:** `app/actions/team.ts`

- [ ] **1.2 Create team member role update action**
  - Add updateTeamMemberRole() to `app/actions/team.ts`
  - Only GC Admin can change roles
  - Update role immediately in company_users
  - Log activity
  - **Refs:** Req 4.7 (Role Change), Design Section 4.3
  - **Effort:** S
  - **Files:** `app/actions/team.ts`

- [ ] **1.3 Create team member deactivation action**
  - Add deactivateTeamMember() to `app/actions/team.ts`
  - Set status to inactive (preserve historical data)
  - Revoke access immediately
  - **Refs:** Req 4.8-4.9 (Deactivation), Design Section 4.3
  - **Effort:** S
  - **Files:** `app/actions/team.ts`

- [ ] **1.4 Create invitation acceptance flow**
  - Create `app/accept-invite/page.tsx`
  - Validate invitation token
  - Allow user to set password and complete profile
  - Update status to active, set activated_at
  - Redirect to dashboard
  - **Refs:** Req 4.4 (Accept Invitation), Design Section 8.4
  - **Effort:** M
  - **Files:** `app/accept-invite/page.tsx`, `app/actions/team.ts`

### E4-T2: Create Team Management Page

- [ ] **2.1 Create team page with member list**
  - Create `app/app/team/page.tsx` as Server Component
  - Fetch all company_users for user's company
  - Display TeamMemberTable component
  - Show subcontractor directory link
  - **Refs:** Req 4.1 (Team Management), Design Section 5.1
  - **Effort:** M
  - **Files:** `app/app/team/page.tsx`

- [ ] **2.2 Create TeamMemberTable component**
  - Create `components/team/TeamMemberTable.tsx`
  - Display: name, email, role, status (active/invited), project count
  - Show role badge with color coding
  - Action dropdown: Change Role, View Projects, Deactivate
  - Sortable columns
  - **Refs:** Req 4.6 (Team Display), Design Section 5.2
  - **Effort:** M
  - **Files:** `components/team/TeamMemberTable.tsx`

- [ ] **2.3 Create InviteTeamMemberModal component**
  - Create `components/team/InviteTeamMemberModal.tsx`
  - Form fields: email, name, role selector
  - Use useActionState with inviteTeamMember action
  - Show success/error states
  - Prevent duplicate invitations
  - **Refs:** Req 4.2-4.5 (Invitation Form), Design Section 5.2
  - **Effort:** M
  - **Files:** `components/team/InviteTeamMemberModal.tsx`

### E4-T3: Create Subcontractor Server Actions

- [ ] **3.1 Create subcontractor CRUD actions**
  - Create `app/actions/subcontractors.ts`
  - Implement: createSubcontractor(), updateSubcontractor(), deactivateSubcontractor()
  - Validate: company_name, trade_specialization, contact_name, email (required)
  - Optional: phone, license info, insurance info
  - Only GC/PM can manage subcontractors
  - **Refs:** Req 5.2-5.4 (Subcontractor Management), Design Section 4.4
  - **Effort:** M
  - **Files:** `app/actions/subcontractors.ts`

- [ ] **3.2 Create document upload action for subcontractors**
  - Add uploadSubcontractorDocument() to actions
  - Upload license/insurance documents to Vercel Blob
  - Store URL and expiry date
  - **Refs:** Req 5.6 (Document Upload), Design Section 4.4
  - **Effort:** M
  - **Files:** `app/actions/subcontractors.ts`

### E4-T4: Create Subcontractor Directory

- [ ] **4.1 Create subcontractors page**
  - Create `app/app/team/subcontractors/page.tsx` as Server Component
  - Fetch all subcontractors for company
  - Display SubcontractorList component
  - **Refs:** Req 5.1 (Subcontractor Page), Design Section 5.1
  - **Effort:** S
  - **Files:** `app/app/team/subcontractors/page.tsx`

- [ ] **4.2 Create SubcontractorList component**
  - Create `components/team/SubcontractorList.tsx`
  - Display: company name, trade, contact, license status, insurance expiry, rating
  - Show warning indicator for expiring docs (within 30 days)
  - Search by name, trade, or contact
  - **Refs:** Req 5.4-5.7 (Subcontractor Display), Design Section 5.2
  - **Effort:** M
  - **Files:** `components/team/SubcontractorList.tsx`

- [ ] **4.3 Create SubcontractorCard component**
  - Create `components/team/SubcontractorCard.tsx`
  - Display detailed subcontractor info
  - Show performance rating with stars
  - Display document expiry with warning colors
  - Edit/Deactivate actions
  - **Refs:** Req 5.4, 5.9 (Performance Metrics), Design Section 5.2
  - **Effort:** M
  - **Files:** `components/team/SubcontractorCard.tsx`

- [ ] **4.4 Create AddSubcontractorModal component**
  - Create `components/team/AddSubcontractorModal.tsx`
  - Form with all subcontractor fields
  - File upload for license/insurance documents
  - Validate file types (PDF, images) and size (5MB limit)
  - **Refs:** Req 5.2-5.3 (Add Subcontractor), Design Section 5.2
  - **Effort:** M
  - **Files:** `components/team/AddSubcontractorModal.tsx`

### E4-T5: Configure PWA Manifest and Icons

- [ ] **5.1 Create PWA manifest.json**
  - Create `public/manifest.json`
  - Configure: name, short_name, start_url (/app), display (standalone)
  - Set theme_color (#001b51) and background_color (#ffffff)
  - Define icon sizes: 192x192, 512x512
  - **Refs:** Req 28.1-28.3 (PWA Installation), Design Section 2.4
  - **Effort:** S
  - **Files:** `public/manifest.json`

- [ ] **5.2 Create PWA icons**
  - Create GenHub logo icons at required sizes
  - Files: `public/icon-192.png`, `public/icon-512.png`, `public/apple-touch-icon.png`
  - Ensure icons work on iOS, Android, and desktop
  - **Refs:** Req 28.2 (App Icon), Design Section 2.4
  - **Effort:** S
  - **Files:** `public/icon-*.png`

- [ ] **5.3 Add manifest link to root layout**
  - Update `app/layout.tsx` to include manifest link
  - Add apple-touch-icon link for iOS
  - Add theme-color meta tag
  - **Refs:** Req 28 (PWA Setup), Design Section 2.4
  - **Effort:** S
  - **Files:** `app/layout.tsx`

### E4-T6: Create Service Worker for Offline Support

- [ ] **6.1 Create service worker with caching strategy**
  - Create `public/sw.js` service worker
  - Implement cache-first for static assets (JS, CSS, images)
  - Implement network-first for API calls
  - Cache app shell for offline access
  - **Refs:** Req 28.4-28.5 (Offline Cache), Design Section 2.3
  - **Effort:** L
  - **Files:** `public/sw.js`

- [ ] **6.2 Create service worker registration**
  - Create `lib/service-worker.ts` registration helper
  - Register SW on app load
  - Handle SW update prompts
  - **Refs:** Req 28 (PWA Setup), Design Section 2.3
  - **Effort:** M
  - **Files:** `lib/service-worker.ts`

- [ ] **6.3 Create offline fallback page**
  - Create `app/~offline/page.tsx`
  - Display friendly offline message
  - Show cached data if available
  - Retry connection option
  - **Refs:** Req 28.9 (Offline Indicator), Design Section 2.3
  - **Effort:** S
  - **Files:** `app/~offline/page.tsx`

### E4-T7: Create PWA UI Components

- [ ] **7.1 Create InstallPrompt component**
  - Create `components/PWA/InstallPrompt.tsx`
  - Detect if app is installable (beforeinstallprompt event)
  - Show install banner/button
  - Handle install flow
  - Hide after installation
  - **Refs:** Req 28.1 (Install Prompt), Design Section 5.4
  - **Effort:** M
  - **Files:** `components/PWA/InstallPrompt.tsx`

- [ ] **7.2 Create OfflineBanner component**
  - Create `components/PWA/OfflineBanner.tsx`
  - Detect online/offline status
  - Show yellow/red banner when offline
  - Auto-hide when back online
  - **Refs:** Req 28.9 (Offline Indicator), Design Section 5.4
  - **Effort:** S
  - **Files:** `components/PWA/OfflineBanner.tsx`

- [ ] **7.3 Integrate PWA components into app layout**
  - Add InstallPrompt to app layout
  - Add OfflineBanner to app layout
  - Register service worker on mount
  - **Refs:** Req 28 (PWA Integration), Design Section 5.4
  - **Effort:** S
  - **Files:** `app/app/layout.tsx`

### E4-T8: Implement Mobile Responsive Design

- [ ] **8.1 Create responsive sidebar with mobile drawer**
  - Update `components/app/Sidebar.tsx`
  - Hide sidebar on mobile, show hamburger menu
  - Implement slide-out drawer on mobile
  - Close drawer on navigation
  - **Refs:** Req 2.4 (Mobile Hamburger), Req 29.2 (Mobile Navigation), Design Section 5.2
  - **Effort:** M
  - **Files:** `components/app/Sidebar.tsx`, `components/app/MobileDrawer.tsx`

- [ ] **8.2 Make Metro Journey mobile-friendly**
  - Update `components/projects/MetroJourney.tsx`
  - Horizontal scroll container on mobile
  - Larger touch targets for phase stations (44x44px minimum)
  - Swipe gesture support
  - **Refs:** Req 8.8 (Mobile Metro), Req 29.4 (Mobile Metro), Design Section 5.2
  - **Effort:** M
  - **Files:** `components/projects/MetroJourney.tsx`

- [ ] **8.3 Make Kanban board mobile-friendly**
  - Update `components/tasks/KanbanBoard.tsx`
  - Single column view on mobile with status tabs
  - Touch-optimized drag and drop
  - Swipe between columns
  - **Refs:** Req 10.10 (Mobile Kanban), Req 29.5 (Mobile Kanban), Design Section 5.3
  - **Effort:** M
  - **Files:** `components/tasks/KanbanBoard.tsx`

- [ ] **8.4 Create mobile-optimized forms**
  - Review all forms for mobile usability
  - Use appropriate input types (date, number, tel)
  - Ensure tap targets are 44x44px minimum
  - Test camera access for photo uploads
  - **Refs:** Req 29.3, 29.6-29.8 (Mobile Forms), Design Section 5.2
  - **Effort:** M
  - **Files:** Various form components

---

## Epic 5: Polish & Testing (Week 9-10)

Testing, performance optimization, and deployment preparation.

### E5-T1: Create Notification System

- [ ] **1.1 Create notification server actions**
  - Create `app/actions/notifications.ts`
  - Implement: getNotifications(), markAsRead(), markAllAsRead()
  - Fetch unread count for badge
  - **Refs:** Req 27.4-27.8 (Notification Display), Design Section 4.5
  - **Effort:** M
  - **Files:** `app/actions/notifications.ts`

- [ ] **1.2 Create notification creation utility**
  - Create `lib/notifications.ts` utility
  - Helper function to create notifications
  - Support all notification types
  - Called from other server actions when events occur
  - **Refs:** Req 27.1, 27.6 (Notification Triggers), Design Section 4.5
  - **Effort:** M
  - **Files:** `lib/notifications.ts`

- [ ] **1.3 Integrate notifications into existing actions**
  - Update task actions to create notifications on: assignment, completion, overdue, blocked
  - Update team actions to create notifications on: invitation
  - Update project actions to create notifications on: updates
  - **Refs:** Req 27.6 (Notification Triggers), Design Section 4.5
  - **Effort:** M
  - **Files:** `app/actions/tasks.ts`, `app/actions/team.ts`, `app/actions/projects.ts`

### E5-T2: Create Global Search

- [ ] **2.1 Create search server action**
  - Create `app/actions/search.ts`
  - Search across: projects, tasks, team members
  - Group results by type
  - Respect RLS permissions
  - **Refs:** Req 30.4-30.7 (Search), Design Section 4.6
  - **Effort:** M
  - **Files:** `app/actions/search.ts`

- [ ] **2.2 Create GlobalSearch component**
  - Create `components/app/GlobalSearch.tsx`
  - Command palette style overlay (Cmd/Ctrl+K)
  - Real-time search suggestions as user types
  - Group results: Projects, Tasks, People
  - Navigate to result on selection
  - **Refs:** Req 30.1-30.6 (Search UI), Design Section 5.2
  - **Effort:** L
  - **Files:** `components/app/GlobalSearch.tsx`

- [ ] **2.3 Create mobile search experience**
  - Full-screen search on mobile
  - Touch-optimized result list
  - Recent searches history
  - **Refs:** Req 30.8 (Mobile Search), Design Section 5.2
  - **Effort:** M
  - **Files:** `components/app/GlobalSearch.tsx`

### E5-T3: Implement Company Profile Management

- [ ] **3.1 Create company profile server actions**
  - Add to `app/actions/team.ts` or create `app/actions/company.ts`
  - Implement: updateCompanyProfile(), uploadCompanyLogo()
  - Validate image file types and size (5MB limit)
  - **Refs:** Req 3.2-3.6 (Company Profile), Design Section 4.7
  - **Effort:** M
  - **Files:** `app/actions/company.ts`

- [ ] **3.2 Create company settings page**
  - Create `app/app/settings/company/page.tsx`
  - Form for company details: name, address, phone, email
  - Logo upload with preview
  - Only visible to GC Admin
  - **Refs:** Req 3.1-3.5 (Company Settings), Design Section 5.1
  - **Effort:** M
  - **Files:** `app/app/settings/company/page.tsx`, `components/settings/CompanyProfileForm.tsx`

### E5-T4: Write Unit Tests for Server Actions

- [ ] **4.1 Set up Vitest testing environment**
  - Configure Vitest for Next.js
  - Set up mocks for Supabase client
  - Set up mocks for auth
  - Create test utilities
  - **Refs:** Design Section 9
  - **Effort:** M
  - **Files:** `vitest.config.ts`, `__tests__/setup.ts`

- [ ] **4.2 Write tests for project server actions**
  - Test createProject with valid/invalid data
  - Test permission checks
  - Test updateProject and updateProjectStatus
  - **Refs:** Req 6-7 (Projects), Design Section 9.1
  - **Effort:** M
  - **Files:** `__tests__/actions/projects.test.ts`

- [ ] **4.3 Write tests for task server actions**
  - Test createTask with valid/invalid data
  - Test updateTaskStatus with all transitions
  - Test dependency management
  - Test activity logging
  - **Refs:** Req 9-11 (Tasks), Design Section 9.1
  - **Effort:** M
  - **Files:** `__tests__/actions/tasks.test.ts`

- [ ] **4.4 Write tests for team server actions**
  - Test inviteTeamMember with valid/invalid data
  - Test duplicate email handling
  - Test role change and deactivation
  - **Refs:** Req 4 (Team), Design Section 9.1
  - **Effort:** M
  - **Files:** `__tests__/actions/team.test.ts`

### E5-T5: Write Component Tests

- [ ] **5.1 Set up React Testing Library**
  - Configure RTL with Vitest
  - Create custom render with providers
  - **Refs:** Design Section 9
  - **Effort:** S
  - **Files:** `__tests__/test-utils.tsx`

- [ ] **5.2 Write tests for core layout components**
  - Test Sidebar navigation and active states
  - Test Header user menu
  - Test NotificationBell dropdown
  - **Refs:** Req 2 (Navigation), Design Section 9.2
  - **Effort:** M
  - **Files:** `__tests__/components/app/*.test.tsx`

- [ ] **5.3 Write tests for project components**
  - Test ProjectCard rendering
  - Test ProjectFilters state management
  - Test MetroJourney phase display
  - **Refs:** Req 7-8 (Projects), Design Section 9.2
  - **Effort:** M
  - **Files:** `__tests__/components/projects/*.test.tsx`

- [ ] **5.4 Write tests for task components**
  - Test TaskCard rendering with all states
  - Test KanbanBoard column organization
  - Test drag-and-drop interactions
  - **Refs:** Req 10-11 (Tasks), Design Section 9.2
  - **Effort:** M
  - **Files:** `__tests__/components/tasks/*.test.tsx`

### E5-T6: Write E2E Tests

- [ ] **6.1 Set up Playwright for E2E testing**
  - Configure Playwright
  - Set up test database seeding
  - Create authentication helpers
  - **Refs:** Design Section 9
  - **Effort:** M
  - **Files:** `playwright.config.ts`, `e2e/setup.ts`

- [ ] **6.2 Write E2E test for authentication flow**
  - Test sign in / sign out
  - Test protected route redirect
  - Test new user onboarding
  - **Refs:** Req 1 (Authentication), Design Section 9.3
  - **Effort:** M
  - **Files:** `e2e/auth.spec.ts`

- [ ] **6.3 Write E2E test for project creation flow**
  - Test creating new project with all fields
  - Test project appearing in list
  - Test project detail page with Metro Journey
  - **Refs:** Req 6-8 (Projects), Design Section 9.3
  - **Effort:** M
  - **Files:** `e2e/projects.spec.ts`

- [ ] **6.4 Write E2E test for task management flow**
  - Test creating task from project
  - Test drag-and-drop status change
  - Test task detail editing
  - **Refs:** Req 9-11 (Tasks), Design Section 9.3
  - **Effort:** M
  - **Files:** `e2e/tasks.spec.ts`

### E5-T7: Performance Optimization

- [ ] **7.1 Implement loading states with Suspense**
  - Add Suspense boundaries to all data-fetching components
  - Create specific skeleton components for each page
  - Ensure smooth loading experience
  - **Refs:** Req 31.1-31.2 (Loading States), Design Section 10
  - **Effort:** M
  - **Files:** Various page components

- [ ] **7.2 Optimize database queries**
  - Review all Supabase queries for efficiency
  - Add appropriate indexes for common queries
  - Implement pagination for large lists (projects, tasks)
  - **Refs:** Req 31.6 (Large Lists), Design Section 10.2
  - **Effort:** M
  - **Files:** Server actions and queries

- [ ] **7.3 Implement image optimization**
  - Use next/image for all images
  - Configure image optimization in next.config.ts
  - Lazy load images below the fold
  - **Refs:** Req 31.2 (Performance), Design Section 10.1
  - **Effort:** S
  - **Files:** `next.config.ts`, Image components

- [ ] **7.4 Audit and optimize bundle size**
  - Run bundle analyzer
  - Code-split large components
  - Lazy load non-critical routes
  - **Refs:** Req 31.2 (Performance), Design Section 10.1
  - **Effort:** M
  - **Files:** `next.config.ts`, various components

### E5-T8: Final Polish and Documentation

- [ ] **8.1 Create toast notification system**
  - Implement success/error toast notifications
  - Show after save operations
  - Auto-dismiss with configurable duration
  - **Refs:** Req 31.4-31.5 (Save Feedback), Design Section 7.3
  - **Effort:** S
  - **Files:** `components/ui/Toast.tsx`, integration in actions

- [ ] **8.2 Implement form validation feedback**
  - Review all forms for validation
  - Add inline error messages
  - Add field highlighting for errors
  - **Refs:** Req 31.10 (Validation Errors), Design Section 7.4
  - **Effort:** M
  - **Files:** All form components

- [ ] **8.3 Review and fix accessibility issues**
  - Audit with axe-core
  - Ensure proper ARIA labels
  - Test keyboard navigation
  - Verify color contrast
  - **Refs:** Req 29 (Mobile), UX best practices
  - **Effort:** M
  - **Files:** Various components

- [ ] **8.4 Create deployment checklist**
  - Document required environment variables
  - Create database migration instructions
  - Document Stripe webhook setup
  - Create deployment guide
  - **Refs:** Design Section 11
  - **Effort:** S
  - **Files:** `DEPLOYMENT.md`

---

## Task Summary by Effort

| Effort | Count | Description |
|--------|-------|-------------|
| S (Small) | 31 | 1-2 hours, straightforward |
| M (Medium) | 52 | 2-4 hours, moderate complexity |
| L (Large) | 6 | 4-8 hours, complex implementation |

## Requirement Coverage Matrix

| Requirement | Tasks |
|-------------|-------|
| Req 1 (Auth) | E1-T7 |
| Req 2 (Dashboard) | E1-T8, E1-T9 |
| Req 3 (Company) | E5-T3 |
| Req 4 (Team) | E4-T1, E4-T2 |
| Req 5 (Subcontractors) | E4-T3, E4-T4 |
| Req 6 (Project Creation) | E2-T1, E2-T3 |
| Req 7 (Project List) | E2-T2 |
| Req 8 (Metro Journey) | E2-T4, E2-T5 |
| Req 9 (Task Creation) | E3-T1, E3-T6 |
| Req 10 (Task Board) | E3-T2, E3-T3, E3-T4 |
| Req 11 (Task Detail) | E3-T5 |
| Req 27 (Notifications) | E5-T1 |
| Req 28 (PWA) | E4-T5, E4-T6, E4-T7 |
| Req 29 (Mobile) | E4-T8 |
| Req 30 (Search) | E5-T2 |
| Req 31 (Performance) | E1-T10, E5-T7, E5-T8 |

---

## Deferred to Phase 2

The following requirements are deferred and not included in this task list:

- **Req 12-15**: AI Bid Management (AI-powered features)
- **Req 16-18**: Communication (Chatrooms, DMs, KakaoTalk)
- **Req 19-21**: Materials Management (Home Depot integration)
- **Req 22**: Expense Management
- **Req 23**: Daily Site Reports (AI summaries)
- **Req 24**: Analytics Dashboard
- **Req 25**: Client Portal
- **Req 26**: Change Order Engine

---

**Document Version**: 1.0
**Last Updated**: 2025-12-04
**Based on**: requirements.md v1.0, design.md v1.0
