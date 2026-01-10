# Project Configuration & Template Management - Implementation Tasks

## Overview

This document provides a comprehensive, actionable implementation plan for the Project Configuration & Template Management feature. Each task is designed to be executed incrementally, with clear acceptance criteria and references to specific requirements.

**Feature Summary:** Enable GC Admin users to customize project workflows by managing project types, task types, phase templates, and task templates through a centralized Settings page. This moves configurations from hardcoded values to company-scoped database entries.

---

## Phase 1: Database Foundation

### 1.1 Create project_type_configs table
- [ ] **Create migration for project_type_configs table**
  - Use `mcp__supabase__apply_migration` to create table
  - Table fields: id (uuid), company_id (FK), name, description, icon_name, color, is_default, order_index, is_active, created_at, updated_at
  - Add unique constraint: (company_id, name)
  - Add comment describing table purpose
  - Create indexes: company_id, (company_id, order_index)
  - Add update_updated_at_column trigger
  - **References**: Requirements §1 (Project Type Management), Design Migration 1
  - **Files to create**: `supabase/migrations/035_project_type_configs.sql`
  - **Acceptance criteria**: Table created with all fields, constraints, and indexes

### 1.2 Add RLS policies for project_type_configs
- [ ] **Create RLS policies for project_type_configs**
  - Enable RLS on table
  - SELECT: Users can view their company project types (using `get_user_company_id()`)
  - INSERT: GC Admin can insert (using `is_user_gc_admin()`)
  - UPDATE: GC Admin can update their company's types
  - DELETE: GC Admin can delete their company's types
  - Test policies with different roles
  - **References**: Requirements §1.1-1.7 (Project Type Management), Design Migration 1
  - **Files to modify**: Same migration file from 1.1
  - **Acceptance criteria**: All CRUD policies enforced, non-admins cannot modify

### 1.3 Create task_type_configs table
- [ ] **Create migration for task_type_configs table**
  - Use `mcp__supabase__apply_migration` to create table
  - Table fields: id (uuid), company_id (FK), name, description, color, icon_name, is_default, is_active, created_at, updated_at
  - Add unique constraint: (company_id, name)
  - Add comment describing table purpose
  - Create index: company_id
  - Add update_updated_at_column trigger
  - **References**: Requirements §2 (Task Type Management), Design Migration 2
  - **Files to create**: `supabase/migrations/036_task_type_configs.sql`
  - **Acceptance criteria**: Table created with all fields and constraints

### 1.4 Add RLS policies for task_type_configs
- [ ] **Create RLS policies for task_type_configs**
  - Enable RLS on table
  - SELECT: Users can view their company task types
  - INSERT: GC Admin can insert
  - UPDATE: GC Admin can update
  - DELETE: GC Admin can delete (soft delete by setting is_active = false)
  - Test policies
  - **References**: Requirements §2.1-2.7 (Task Type Management), Design Migration 2
  - **Files to modify**: Same migration file from 1.3
  - **Acceptance criteria**: RLS enforced, task types company-scoped

### 1.5 Create phase_templates table
- [ ] **Create migration for phase_templates table**
  - Use `mcp__supabase__apply_migration` to create table
  - Table fields: id (uuid), company_id (FK), project_type_config_id (FK), name, description, order_index, is_active, created_at, updated_at
  - Add unique constraint: (project_type_config_id, name)
  - Add comment describing table purpose
  - Create indexes: company_id, project_type_config_id, (project_type_config_id, order_index)
  - Add update_updated_at_column trigger
  - Add CASCADE DELETE on project_type_config_id FK
  - **References**: Requirements §3 (Phase Template Management), Design Migration 3
  - **Files to create**: `supabase/migrations/037_phase_templates.sql`
  - **Acceptance criteria**: Table created with FK relationships to project_type_configs

### 1.6 Add RLS policies for phase_templates
- [ ] **Create RLS policies for phase_templates**
  - Enable RLS on table
  - SELECT: Users can view their company phase templates
  - INSERT: GC Admin can insert
  - UPDATE: GC Admin can update
  - DELETE: GC Admin can delete
  - Test policies
  - **References**: Requirements §3.1-3.9 (Phase Template Management), Design Migration 3
  - **Files to modify**: Same migration file from 1.5
  - **Acceptance criteria**: RLS enforced, cascading deletes work correctly

### 1.7 Create task_templates table
- [ ] **Create migration for task_templates table**
  - Use `mcp__supabase__apply_migration` to create table
  - Table fields: id (uuid), company_id (FK), phase_template_id (FK), title, description, default_task_type (text), default_priority (text), order_index, is_active, created_at, updated_at
  - Add comment describing table purpose
  - Create indexes: company_id, phase_template_id, (phase_template_id, order_index)
  - Add update_updated_at_column trigger
  - Add CASCADE DELETE on phase_template_id FK
  - **References**: Requirements §4 (Task Template Management), Design Migration 4
  - **Files to create**: `supabase/migrations/038_task_templates.sql`
  - **Acceptance criteria**: Table created with soft reference to task_type_configs

### 1.8 Add RLS policies for task_templates
- [ ] **Create RLS policies for task_templates**
  - Enable RLS on table
  - SELECT: Users can view their company task templates
  - INSERT: GC Admin can insert
  - UPDATE: GC Admin can update
  - DELETE: GC Admin can delete
  - Test policies
  - **References**: Requirements §4.1-4.9 (Task Template Management), Design Migration 4
  - **Files to modify**: Same migration file from 1.7
  - **Acceptance criteria**: RLS enforced, templates company-scoped

### 1.9 Create seed function for default templates
- [ ] **Create seeding function and trigger**
  - Use `mcp__supabase__apply_migration` to create function `seed_company_templates(p_company_id uuid)`
  - Function inserts 4 default project types (Residential, Restaurant/Cafe, Commercial Office, Industrial)
  - Function inserts 4 default task types (work, purchase, approval, admin) with appropriate colors/icons
  - Function inserts phase templates for each project type (Initiation, Pre-construction, Procurement, Construction, Post-construction)
  - Function inserts task templates for each phase (matching DEFAULT_PROJECT_TEMPLATES structure)
  - Use `ON CONFLICT (company_id, name) DO NOTHING` for idempotency
  - Create trigger `on_company_created_seed_templates` that fires AFTER INSERT on companies
  - **References**: Requirements §1.8, 2.6, 3.9, 4.9 (Seeding defaults), Design Migration 5
  - **Files to create**: `supabase/migrations/039_seed_default_templates.sql`
  - **Acceptance criteria**: Function runs without errors, creates all defaults, is idempotent

### 1.10 Seed existing companies with templates
- [ ] **Run seed function for existing companies**
  - Add DO block to migration that loops through all companies
  - Call `seed_company_templates(company_id)` for each company
  - Verify all existing companies now have default templates
  - **References**: Requirements §1.8, 2.6, 3.9, 4.9 (Migration strategy)
  - **Files to modify**: Same migration file from 1.9
  - **Acceptance criteria**: All existing companies have default templates seeded

### 1.11 Generate TypeScript types
- [ ] **Update TypeScript types for new tables**
  - Run `npx supabase gen types typescript --project-id "$SUPABASE_PROJECT_ID" > types/database.types.ts`
  - Verify types exported in `types/database.types.ts`
  - Verify ProjectTypeConfig, TaskTypeConfig, PhaseTemplate, TaskTemplate interfaces
  - **References**: All database tables
  - **Files to modify**: `types/database.types.ts`
  - **Acceptance criteria**: Types generated and match database schema

---

## Phase 2: Server Actions

### 2.1 Create project-types.ts server actions
- [ ] **Implement project type CRUD actions**
  - Create `app/actions/project-types.ts` with 'use server' directive
  - Implement Zod schemas: `createProjectTypeSchema`, `updateProjectTypeSchema`
  - Implement `getProjectTypes()` - Returns all project types for user's company with project counts
  - Implement `createProjectType(formData)` - Creates new project type, assigns next order_index
  - Implement `updateProjectType(formData)` - Updates existing project type
  - Implement `deleteProjectType(id)` - Deletes project type after checking for usage
  - All actions use `getUserContext()` helper to get user, company, role
  - All actions enforce gc_admin role check
  - All actions validate input with Zod
  - All actions call `revalidatePath('/app/settings')`
  - **References**: Requirements §1 (Project Type Management), Design API section
  - **Files to create**: `app/actions/project-types.ts`
  - **Acceptance criteria**: All CRUD operations work, non-admins rejected, validation enforced

### 2.2 Create task-types.ts server actions
- [ ] **Implement task type CRUD actions**
  - Create `app/actions/task-types.ts` with 'use server' directive
  - Implement Zod schemas: `createTaskTypeSchema`, `updateTaskTypeSchema`
  - Implement `getTaskTypes()` - Returns all active task types for company
  - Implement `createTaskType(formData)` - Creates new task type
  - Implement `updateTaskType(formData)` - Updates existing task type
  - Implement `deleteTaskType(id)` - Soft deletes (sets is_active = false)
  - All actions use `getUserContext()` helper
  - All actions enforce gc_admin role check
  - All actions validate input with Zod
  - All actions call `revalidatePath('/app/settings')`
  - **References**: Requirements §2 (Task Type Management), Design API section
  - **Files to create**: `app/actions/task-types.ts`
  - **Acceptance criteria**: All CRUD operations work, soft delete preserves historical data

### 2.3 Create phase-templates.ts server actions
- [ ] **Implement phase template CRUD actions**
  - Create `app/actions/phase-templates.ts` with 'use server' directive
  - Implement Zod schemas for phase template operations
  - Implement `getPhaseTemplates(projectTypeConfigId?)` - Returns phase templates with nested task templates
  - Implement `createPhaseTemplate(formData)` - Creates new phase template
  - Implement `updatePhaseTemplate(formData)` - Updates existing phase template
  - Implement `deletePhaseTemplate(id)` - Deletes phase template (cascades to task templates)
  - Implement `reorderPhaseTemplates(projectTypeConfigId, orderedIds)` - Updates order_index for drag-and-drop
  - All actions use `getUserContext()` helper
  - All actions enforce gc_admin role check
  - **References**: Requirements §3 (Phase Template Management), Design API section
  - **Files to create**: `app/actions/phase-templates.ts`
  - **Acceptance criteria**: CRUD + reordering work, nested task templates loaded

### 2.4 Create task-templates.ts server actions
- [ ] **Implement task template CRUD actions**
  - Create `app/actions/task-templates.ts` with 'use server' directive
  - Implement Zod schemas for task template operations
  - Implement `getTaskTemplates(phaseTemplateId?)` - Returns task templates
  - Implement `createTaskTemplate(formData)` - Creates new task template
  - Implement `updateTaskTemplate(formData)` - Updates existing task template
  - Implement `deleteTaskTemplate(id)` - Deletes task template
  - Implement `reorderTaskTemplates(phaseTemplateId, orderedIds)` - Updates order_index
  - All actions use `getUserContext()` helper
  - All actions enforce gc_admin role check
  - **References**: Requirements §4 (Task Template Management), Design API section
  - **Files to create**: `app/actions/task-templates.ts`
  - **Acceptance criteria**: CRUD + reordering work

### 2.5 Update phases.ts for project-level phase CRUD
- [ ] **Extend phase actions for project-level management**
  - Modify `app/actions/phases.ts` to add project-level phase CRUD
  - Implement `createPhase(projectId, formData)` - Creates phase within project
  - Implement `updatePhase(phaseId, formData)` - Updates project phase
  - Implement `deletePhase(phaseId, taskHandling)` - Deletes phase with task handling options
  - taskHandling options: 'move' (move tasks to another phase) or 'delete' (delete tasks)
  - Enforce gc_admin or project_manager role check
  - Update Metro Journey display to reflect changes
  - **References**: Requirements §5 (Phase CRUD within Projects)
  - **Files to modify**: `app/actions/phases.ts`
  - **Acceptance criteria**: GC/PM can manage phases within projects, task handling options work

---

## Phase 3: Settings UI - Project Types

### 3.1 Create Settings page tab navigation
- [ ] **Add Project Configuration tab to Settings page**
  - Modify `app/app/settings/page.tsx`
  - Add role check: Only show "Project Configuration" section if user is gc_admin
  - Add `SettingsSectionHeader` with `Wrench` icon, title "Project Configuration"
  - Add `ProjectConfigurationSection` component (creates tabs for Project Types, Task Types, Phase Templates, Task Templates)
  - Use standard page layout (blueprint grid, industrial header)
  - **References**: Requirements §6 (Settings Page Integration), Design UI Layout
  - **Files to modify**: `app/app/settings/page.tsx`
  - **Acceptance criteria**: Section visible only to gc_admin, follows standard layout

### 3.2 Create ProjectConfigurationSection component
- [ ] **Create tabbed navigation for configuration**
  - Create `components/settings/ProjectConfigurationSection.tsx` (client component)
  - Use Aceternity UI `Tabs` component
  - Create 4 tabs: Project Types, Task Types, Phase Templates, Task Templates
  - Each tab loads its respective manager component
  - Apply construction theme styling
  - **References**: Requirements §6.2 (Tabs/sections)
  - **Files to create**: `components/settings/ProjectConfigurationSection.tsx`
  - **Acceptance criteria**: Tab navigation works, construction-themed UI

### 3.3 Create ProjectTypeManager component
- [ ] **Build Project Types management UI**
  - Create `components/settings/ProjectTypeManager.tsx` (client component)
  - Use `getProjectTypes()` action to fetch data on mount
  - Display project types in Aceternity UI `Table` with columns: Type (icon + name), Description, Projects (count), Status, Actions
  - Show icon with background color matching type's color
  - Show project_count badge
  - Show is_active status badge (green for active, gray for inactive)
  - Add "Add Type" button (opens create modal)
  - Each row has Edit and Delete buttons
  - Apply construction theme: `border-2 border-gray-200 shadow-construction`
  - **References**: Requirements §1 (Project Type Management), Design ProjectTypeManager
  - **Files to create**: `components/settings/ProjectTypeManager.tsx`
  - **Acceptance criteria**: Table displays all project types with correct data

### 3.4 Create ProjectType Create Modal
- [ ] **Build create project type modal**
  - Add Dialog component to `ProjectTypeManager.tsx`
  - Form fields: name (required), description, icon_name (icon selector), color (color picker)
  - Icon selector: Show common Lucide icons (Home, Building2, Factory, UtensilsCrossed, Store, etc.)
  - Color picker: Use HTML5 color input, default to #001B51
  - Form uses `createProjectType()` server action
  - Show toast on success/error
  - Reload project types on success
  - **References**: Requirements §1.2-1.3 (Create project type)
  - **Files to modify**: `components/settings/ProjectTypeManager.tsx`
  - **Acceptance criteria**: Modal opens, form validates, creates project type successfully

### 3.5 Create ProjectType Edit Modal
- [ ] **Build edit project type modal**
  - Add Edit Dialog to `ProjectTypeManager.tsx`
  - Pre-fill form with existing project type data
  - Allow editing name, description, icon, color, is_active status
  - Form uses `updateProjectType()` server action
  - Show toast on success/error
  - Reload project types on success
  - **References**: Requirements §1.4-1.5 (Edit project type)
  - **Files to modify**: `components/settings/ProjectTypeManager.tsx`
  - **Acceptance criteria**: Modal opens with pre-filled data, updates successfully

### 3.6 Create ProjectType Delete Confirmation
- [ ] **Build delete confirmation dialog**
  - Add AlertDialog for delete confirmation to `ProjectTypeManager.tsx`
  - Check if project type is assigned to projects (disable delete if count > 0)
  - Show warning: "Cannot delete: This project type is assigned to X projects"
  - If not in use, show confirmation: "Are you sure? This will also delete all associated phase and task templates."
  - Form uses `deleteProjectType()` server action
  - Show toast on success/error
  - Reload project types on success
  - **References**: Requirements §1.6-1.7 (Delete project type with usage check)
  - **Files to modify**: `components/settings/ProjectTypeManager.tsx`
  - **Acceptance criteria**: Cannot delete types in use, confirmation shown, cascading delete works

---

## Phase 4: Settings UI - Task Types

### 4.1 Create TaskTypeManager component
- [ ] **Build Task Types management UI**
  - Create `components/settings/TaskTypeManager.tsx` (client component)
  - Use `getTaskTypes()` action to fetch data on mount
  - Display task types in grid of cards (not table)
  - Each card shows: icon with colored background, name, description, is_default badge
  - Add "Add Task Type" button (opens create modal)
  - Each card has Edit and Delete buttons
  - Apply construction theme
  - **References**: Requirements §2 (Task Type Management)
  - **Files to create**: `components/settings/TaskTypeManager.tsx`
  - **Acceptance criteria**: Grid displays all active task types with icons and colors

### 4.2 Create TaskType Create Modal
- [ ] **Build create task type modal**
  - Add Dialog component to `TaskTypeManager.tsx`
  - Form fields: name (required), description, color (color picker), icon_name (icon selector)
  - Icon selector: Show construction-themed icons (Hammer, ShoppingCart, ClipboardCheck, FileText, etc.)
  - Color picker: Use HTML5 color input, default to #3b82f6
  - Form uses `createTaskType()` server action
  - Show toast on success/error
  - Reload task types on success
  - **References**: Requirements §2.2-2.3 (Create task type)
  - **Files to modify**: `components/settings/TaskTypeManager.tsx`
  - **Acceptance criteria**: Modal opens, form validates, creates task type successfully

### 4.3 Create TaskType Edit Modal
- [ ] **Build edit task type modal**
  - Add Edit Dialog to `TaskTypeManager.tsx`
  - Pre-fill form with existing task type data
  - Allow editing name, description, color, icon
  - Cannot edit if is_default = true (show read-only message)
  - Form uses `updateTaskType()` server action
  - Show toast on success/error
  - Reload task types on success
  - **References**: Requirements §2.4 (Edit task type)
  - **Files to modify**: `components/settings/TaskTypeManager.tsx`
  - **Acceptance criteria**: Modal opens with pre-filled data, updates successfully, defaults are read-only

### 4.4 Create TaskType Delete Confirmation
- [ ] **Build delete confirmation (soft delete)**
  - Add AlertDialog for delete confirmation to `TaskTypeManager.tsx`
  - Show warning: "This will hide the task type. Existing tasks will keep their type."
  - Form uses `deleteTaskType()` server action (sets is_active = false)
  - Show toast on success/error
  - Reload task types on success (deleted type no longer shows in list)
  - **References**: Requirements §2.5 (Delete task type)
  - **Files to modify**: `components/settings/TaskTypeManager.tsx`
  - **Acceptance criteria**: Soft delete works, historical data preserved, type hidden from UI

---

## Phase 5: Settings UI - Phase Templates

### 5.1 Create PhaseTemplateManager component
- [ ] **Build Phase Templates management UI**
  - Create `components/settings/PhaseTemplateManager.tsx` (client component)
  - Add project type selector dropdown (fetches from `getProjectTypes()`)
  - Use `getPhaseTemplates(selectedTypeId)` to fetch phases for selected project type
  - Display phases in sortable list (drag-and-drop enabled)
  - Show empty state if no phases exist for project type
  - Add "Add Phase" button (opens create modal)
  - Each phase item shows: order, name, description, task count badge
  - Each phase item has: Expand (show tasks), Edit, Delete buttons
  - Apply construction theme
  - **References**: Requirements §3 (Phase Template Management), Design PhaseTemplateManager
  - **Files to create**: `components/settings/PhaseTemplateManager.tsx`
  - **Acceptance criteria**: List displays phases for selected project type, empty state works

### 5.2 Integrate @dnd-kit for phase reordering
- [ ] **Add drag-and-drop reordering**
  - Install @dnd-kit packages: `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`
  - Wrap phase list in `DndContext` with `closestCenter` collision detection
  - Wrap phases in `SortableContext` with `verticalListSortingStrategy`
  - Create `SortablePhaseItem` component using `useSortable` hook
  - Implement drag handle (GripVertical icon)
  - Implement `handleDragEnd` to update local state and call `reorderPhaseTemplates()`
  - Show visual feedback during drag (opacity, shadow)
  - Revert order on error
  - **References**: Requirements §3.4 (Drag to reorder), Design PhaseTemplateManager
  - **Files to modify**: `components/settings/PhaseTemplateManager.tsx`
  - **Acceptance criteria**: Drag-and-drop works smoothly, order persists to database

### 5.3 Create PhaseTemplate Create Modal
- [ ] **Build create phase template modal**
  - Add Dialog component to `PhaseTemplateManager.tsx`
  - Form fields: name (required), description, order_index (auto-calculated or manual)
  - Form uses `createPhaseTemplate(formData)` server action
  - Pass selected project_type_config_id
  - Show toast on success/error
  - Reload phase templates on success
  - **References**: Requirements §3.3 (Add phase)
  - **Files to modify**: `components/settings/PhaseTemplateManager.tsx`
  - **Acceptance criteria**: Modal opens, creates phase successfully, appears in list

### 5.4 Create PhaseTemplate Edit Modal
- [ ] **Build edit phase template modal**
  - Add Edit Dialog to `PhaseTemplateManager.tsx`
  - Pre-fill form with existing phase template data
  - Allow editing name, description
  - Form uses `updatePhaseTemplate()` server action
  - Show toast on success/error
  - Reload phase templates on success
  - **References**: Requirements §3.5 (Edit phase template)
  - **Files to modify**: `components/settings/PhaseTemplateManager.tsx`
  - **Acceptance criteria**: Modal opens with pre-filled data, updates successfully

### 5.5 Create PhaseTemplate Delete Confirmation
- [ ] **Build delete confirmation dialog**
  - Add AlertDialog for delete confirmation to `PhaseTemplateManager.tsx`
  - Show warning: "This will delete the phase template and all associated task templates. Existing projects will not be affected."
  - Form uses `deletePhaseTemplate()` server action
  - Show toast on success/error
  - Reload phase templates on success
  - **References**: Requirements §3.6 (Delete phase template)
  - **Files to modify**: `components/settings/PhaseTemplateManager.tsx`
  - **Acceptance criteria**: Confirmation shown, cascading delete works, existing projects unaffected

### 5.6 Add nested task templates view
- [ ] **Show task templates within phase item**
  - Add expandable section to `SortablePhaseItem` component
  - When expanded, show list of task templates for that phase
  - Fetch task templates using `task_templates` nested in `getPhaseTemplates()` response
  - Display: order, title, default_task_type (with icon/color), default_priority
  - Show "No tasks defined" if empty
  - Add "Add Task Template" button in expanded view (opens task template create modal)
  - **References**: Requirements §3.2, 4 (Task templates linked to phases)
  - **Files to modify**: `components/settings/PhaseTemplateManager.tsx`
  - **Acceptance criteria**: Expansion shows nested task templates, can add tasks from here

---

## Phase 6: Settings UI - Task Templates

### 6.1 Create TaskTemplateManager component
- [ ] **Build Task Templates management UI**
  - Create `components/settings/TaskTemplateManager.tsx` (client component)
  - Add project type selector dropdown
  - Add phase selector dropdown (filtered by selected project type)
  - Use `getTaskTemplates(selectedPhaseId)` to fetch tasks for selected phase
  - Display tasks in sortable list (drag-and-drop enabled, similar to phases)
  - Show empty state if no tasks exist for phase
  - Add "Add Task Template" button (opens create modal)
  - Each task item shows: order, title, description, default_task_type badge, default_priority badge
  - Each task item has: Edit, Delete buttons
  - Apply construction theme
  - **References**: Requirements §4 (Task Template Management)
  - **Files to create**: `components/settings/TaskTemplateManager.tsx`
  - **Acceptance criteria**: List displays tasks for selected phase, empty state works

### 6.2 Integrate @dnd-kit for task reordering
- [ ] **Add drag-and-drop reordering**
  - Wrap task list in `DndContext`
  - Wrap tasks in `SortableContext` with `verticalListSortingStrategy`
  - Create `SortableTaskItem` component using `useSortable` hook
  - Implement drag handle (GripVertical icon)
  - Implement `handleDragEnd` to update local state and call `reorderTaskTemplates()`
  - Show visual feedback during drag
  - Revert order on error
  - **References**: Requirements §4.6 (Reorder task templates)
  - **Files to modify**: `components/settings/TaskTemplateManager.tsx`
  - **Acceptance criteria**: Drag-and-drop works smoothly, order persists

### 6.3 Create TaskTemplate Create Modal
- [ ] **Build create task template modal**
  - Add Dialog component to `TaskTemplateManager.tsx`
  - Form fields: title (required), description, default_task_type (select from task_type_configs), default_priority (select: low/medium/high)
  - default_task_type dropdown shows task types from database (use `getTaskTypes()`)
  - Show task type icon and color in dropdown
  - Form uses `createTaskTemplate(formData)` server action
  - Pass selected phase_template_id
  - Show toast on success/error
  - Reload task templates on success
  - **References**: Requirements §4.3 (Add task template)
  - **Files to modify**: `components/settings/TaskTemplateManager.tsx`
  - **Acceptance criteria**: Modal opens, creates task successfully, appears in list

### 6.4 Create TaskTemplate Edit Modal
- [ ] **Build edit task template modal**
  - Add Edit Dialog to `TaskTemplateManager.tsx`
  - Pre-fill form with existing task template data
  - Allow editing title, description, default_task_type, default_priority
  - Form uses `updateTaskTemplate()` server action
  - Show toast on success/error
  - Reload task templates on success
  - **References**: Requirements §4.4 (Edit task template)
  - **Files to modify**: `components/settings/TaskTemplateManager.tsx`
  - **Acceptance criteria**: Modal opens with pre-filled data, updates successfully

### 6.5 Create TaskTemplate Delete Confirmation
- [ ] **Build delete confirmation dialog**
  - Add AlertDialog for delete confirmation to `TaskTemplateManager.tsx`
  - Show warning: "This will delete the task template. Existing tasks will not be affected."
  - Form uses `deleteTaskTemplate()` server action
  - Show toast on success/error
  - Reload task templates on success
  - **References**: Requirements §4.5 (Delete task template)
  - **Files to modify**: `components/settings/TaskTemplateManager.tsx`
  - **Acceptance criteria**: Confirmation shown, delete works, existing tasks unaffected

---

## Phase 7: Project Integration

### 7.1 Update project creation to apply templates
- [ ] **Modify createProject action to use database templates**
  - Modify `app/actions/projects.ts` `createProject()` function
  - After inserting project, look up `project_type_configs` by project_type name
  - If found, fetch `phase_templates` with nested `task_templates`
  - Create `project_phases` from phase templates (preserve order_index)
  - For each created phase, create tasks from task templates
  - Set task properties: title, description, task_type, priority, status='todo', created_by
  - If no templates found, fall back to `lib/default-project-templates.ts` (backward compatibility)
  - Log success: "Created {phase_count} phases and {task_count} tasks from templates"
  - **References**: Requirements §7 (Template Application on Project Creation), Design Modified Project Creation Flow
  - **Files to modify**: `app/actions/projects.ts`
  - **Acceptance criteria**: New projects automatically have phases and tasks from templates

### 7.2 Add template preview in project creation modal
- [ ] **Show phase preview when selecting project type**
  - Modify project creation modal (e.g., `components/projects/CreateProjectModal.tsx`)
  - When user selects a project_type, fetch phase templates for that type
  - Display phase names below project type dropdown: "This will create phases: Initiation, Pre-construction, ..."
  - If no templates exist, show message: "No phases will be created. You can add them manually."
  - **References**: Requirements §7.1-7.2 (Show preview of phases)
  - **Files to modify**: `components/projects/CreateProjectModal.tsx` (or wherever project creation form lives)
  - **Acceptance criteria**: User sees what phases will be created before submitting

### 7.3 Update TaskModal to use dynamic task types
- [ ] **Fetch task types from database instead of hardcoded enum**
  - Modify `components/tasks/TaskModal.tsx`
  - Replace hardcoded `TASK_TYPES` array with call to `getTaskTypes()` server action
  - Load task types on component mount or parent page
  - Display task type dropdown with icons and colors from database
  - Map selected task type to `default_task_type` value
  - Maintain backward compatibility with existing task_type enum values
  - **References**: Requirements §2.7 (Task types in TaskModal)
  - **Files to modify**: `components/tasks/TaskModal.tsx`
  - **Acceptance criteria**: Task type dropdown shows database task types with icons/colors

### 7.4 Add phase management to project detail page
- [ ] **Enable GC/PM to add/edit/delete phases within project**
  - Modify `components/projects/ProjectDetailContent.tsx` (or project detail page)
  - Add "Manage Phases" button (visible to gc_admin and project_manager only)
  - Opens dialog with list of current project phases
  - Add "Add Phase" button (calls `createPhase()` server action)
  - Each phase has Edit (calls `updatePhase()`) and Delete (calls `deletePhase()`) buttons
  - Delete prompts for task handling: "Move tasks to another phase" or "Delete tasks"
  - Update Metro Journey visualization after phase changes
  - **References**: Requirements §5 (Phase CRUD within Projects)
  - **Files to modify**: `components/projects/ProjectDetailContent.tsx`, `components/projects/MetroJourney.tsx`
  - **Acceptance criteria**: GC/PM can add/edit/delete phases, Metro Journey updates correctly

### 7.5 Add "Apply Task Templates" option to phases
- [ ] **Allow users to apply task templates to existing project phases**
  - In project detail, each phase shows "Apply Task Templates" button
  - Button only shows if phase has no tasks or user explicitly wants to add template tasks
  - Fetch task templates matching project_type and phase name
  - Create tasks from templates (skip if task with same title already exists)
  - Show confirmation: "Added {count} tasks from templates"
  - **References**: Requirements §4.8 (Apply task templates to phase)
  - **Files to modify**: `components/projects/ProjectDetailContent.tsx` (or phase detail view)
  - **Acceptance criteria**: Can apply templates to existing phases, no duplicate tasks

---

## Phase 8: Testing & Polish

### 8.1 Test template application flow end-to-end
- [ ] **Verify complete workflow from template creation to project creation**
  - As GC Admin, create a new project type (e.g., "Retail Store")
  - Add phase templates (e.g., "Site Preparation", "Interior Build-out")
  - Add task templates to each phase (e.g., "Electrical Rough-In", "Plumbing Install")
  - Create a new project with that project type
  - Verify phases and tasks are created automatically
  - Verify Metro Journey displays all phases
  - Verify task board shows all tasks with correct types/priorities
  - **References**: All requirements
  - **Acceptance criteria**: End-to-end flow works without errors

### 8.2 Test error handling and edge cases
- [ ] **Verify error handling in all CRUD operations**
  - Try to create duplicate project type name → Should show error
  - Try to delete project type in use → Should show error
  - Try to access Settings as non-admin → Should not see Project Configuration section
  - Try to reorder phases with network error → Should revert order
  - Try to create project with non-existent templates → Should fall back to defaults
  - Try to delete phase with tasks → Should prompt for task handling
  - **References**: Non-Functional Requirements (Security, Data Integrity)
  - **Acceptance criteria**: All errors handled gracefully, no crashes

### 8.3 Test RLS policies
- [ ] **Verify row-level security enforces company scoping**
  - Create two test companies (Company A, Company B)
  - As admin of Company A, create project types/templates
  - As admin of Company B, verify cannot see Company A's templates
  - As non-admin user, verify cannot modify templates
  - Verify all actions respect company_id constraints
  - **References**: Non-Functional Requirements (Security)
  - **Acceptance criteria**: Cross-company access blocked, role enforcement works

### 8.4 Test UI responsiveness
- [ ] **Verify UI works on mobile, tablet, and desktop**
  - Test Settings page on mobile (320px width)
  - Test Settings page on tablet (768px width)
  - Test Settings page on desktop (1280px width)
  - Verify modals are responsive
  - Verify drag-and-drop works on touch devices
  - Verify tables scroll horizontally on mobile
  - **References**: Non-Functional Requirements (Usability)
  - **Acceptance criteria**: UI is usable on all screen sizes

### 8.5 Performance testing
- [ ] **Verify performance with large template sets**
  - Create 10 project types, 5 phases each, 10 tasks per phase (500 task templates)
  - Measure load time for Settings page
  - Measure load time for phase template list
  - Measure time to create project with all templates
  - Verify all operations complete within 200ms (templates) and 2 seconds (project creation)
  - **References**: Non-Functional Requirements (Performance)
  - **Acceptance criteria**: All operations meet performance targets

### 8.6 UI polish and accessibility
- [ ] **Apply final UI polish and accessibility improvements**
  - Verify all modals have proper focus management
  - Verify all forms have proper labels and ARIA attributes
  - Verify all interactive elements have 44px minimum tap targets
  - Verify all colors meet WCAG AA contrast ratios
  - Verify drag-and-drop has keyboard navigation
  - Add loading skeletons for all async data fetches
  - Add empty states with helpful guidance
  - **References**: Non-Functional Requirements (Usability)
  - **Acceptance criteria**: UI is polished, accessible, and follows construction theme

### 8.7 Code review and cleanup
- [ ] **Final code review and cleanup**
  - Remove commented-out code
  - Add missing TypeScript types
  - Add missing error handling
  - Add debug comments for all major features
  - Verify all server actions have proper error responses
  - Verify all migrations are idempotent
  - Run `/kc:build` to verify build passes
  - Run `/kc:db-check` to verify database security
  - **References**: All implementation files
  - **Acceptance criteria**: Build passes, no TypeScript errors, code is clean

### 8.8 Update documentation
- [ ] **Update project documentation**
  - Update `DB_SCHEMA.md` with new tables and relationships
  - Update migration history in `DB_SCHEMA.md`
  - Add section to `SYSTEM.md` about template management
  - Create user-facing documentation for template management (optional)
  - Update CLAUDE.md if new patterns introduced
  - **References**: `.claude/docs/law/` files
  - **Acceptance criteria**: Documentation is up-to-date and accurate

---

## Success Criteria

### Feature Complete When:
- ✅ All 4 tables created with proper RLS policies
- ✅ Seeding function creates defaults for all companies
- ✅ All CRUD server actions implemented and working
- ✅ Settings page shows Project Configuration section (gc_admin only)
- ✅ Can create/edit/delete project types, task types, phase templates, task templates
- ✅ Drag-and-drop reordering works for phases and tasks
- ✅ Project creation applies templates automatically
- ✅ TaskModal uses dynamic task types from database
- ✅ GC/PM can manage phases within projects
- ✅ All error cases handled gracefully
- ✅ RLS enforced, cross-company access blocked
- ✅ UI is responsive, accessible, and construction-themed
- ✅ Performance meets targets
- ✅ Build passes, documentation updated

---

## Notes

- **Incremental Development**: Each task should be completed and tested before moving to the next
- **Test as You Go**: Don't wait until Phase 8 to test basic functionality
- **MCP Supabase**: Always use `mcp__supabase__*` commands for database operations
- **TypeScript Types**: Regenerate types after every migration
- **Server Actions**: Always use `revalidatePath()` to refresh UI after mutations
- **Construction Theme**: All UI must follow standard page layout and color system
- **Debugging**: Add debug comments and console.log statements for all major features
- **Backward Compatibility**: Existing projects must continue to work during and after migration

---

## Workflow Ready

This task list is now ready for execution. You can:
1. Start implementing tasks sequentially from Phase 1
2. Open this file in an IDE and check off tasks as completed
3. Reference requirements and design documents for detailed specifications
4. Use MCP Supabase for all database operations
5. Follow the standard page layout and construction theme for all UI

**Ready to begin? Start with Task 1.1: Create project_type_configs table**
