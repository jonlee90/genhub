# Requirements Document

## Introduction

This document defines the requirements for the **Project Configuration & Template Management** feature in GenHub PWA. This feature enables admin users to manage project configurations and create reusable templates for projects, phases, and tasks. The goal is to allow construction companies to customize their workflows by defining their own project types, task types, phase templates, and task templates that automatically populate when creating new projects.

Currently, project types and phase/task templates are hardcoded in `lib/default-project-templates.ts`. This feature will move these configurations to the database, making them company-specific and editable through the Settings page.

---

## Requirements

### Requirement 1: Project Type Management

**User Story:** As a GC Admin, I want to create, view, update, and delete project types, so that I can categorize construction projects according to my company's specific needs.

#### Acceptance Criteria

1. WHEN user navigates to Settings > Project Configuration THEN the system SHALL display a list of all project types for their company
2. WHEN user clicks "Add Project Type" THEN the system SHALL display a form to create a new project type with name, description, and optional icon/color
3. WHEN user submits a valid project type form THEN the system SHALL create the project type and display it in the list
4. WHEN user clicks edit on an existing project type THEN the system SHALL display a pre-filled form for editing
5. WHEN user saves edits to a project type THEN the system SHALL update the project type and refresh the list
6. WHEN user clicks delete on a project type that is not in use THEN the system SHALL remove the project type after confirmation
7. IF user attempts to delete a project type that is assigned to existing projects THEN the system SHALL display an error message preventing deletion
8. WHEN a new company is created THEN the system SHALL seed 4 default project types: Residential, Restaurant/Cafe, Commercial Office, Industrial

---

### Requirement 2: Task Type Management

**User Story:** As a GC Admin, I want to create, view, update, and delete task types, so that I can categorize different kinds of work consistently across all projects.

#### Acceptance Criteria

1. WHEN user navigates to Settings > Project Configuration THEN the system SHALL display a list of all task types for their company
2. WHEN user clicks "Add Task Type" THEN the system SHALL display a form with fields: name, description, color, and icon
3. WHEN user submits a valid task type form THEN the system SHALL create the task type and display it in the list
4. WHEN user edits an existing task type THEN the system SHALL update the task type across all views
5. WHEN user deletes a task type THEN the system SHALL remove it from the list but preserve the type value on existing tasks
6. WHEN a new company is created THEN the system SHALL seed default task types: Work, Purchase, Approval, Admin (matching existing enum values)
7. WHEN user creates a task in TaskModal THEN the system SHALL display the task types from the database as selectable options

---

### Requirement 3: Phase Template Management

**User Story:** As a GC Admin, I want to create pre-built phase templates for each project type, so that when a new project is created, the appropriate phases are automatically added.

#### Acceptance Criteria

1. WHEN user navigates to Settings > Project Configuration > Phase Templates THEN the system SHALL display phase templates grouped by project type
2. WHEN user selects a project type THEN the system SHALL display the list of phases in that template with their order
3. WHEN user clicks "Add Phase" THEN the system SHALL display a form with fields: name, description, order position
4. WHEN user drags a phase to reorder THEN the system SHALL update the order_index values accordingly
5. WHEN user edits a phase template THEN the system SHALL update the phase definition
6. WHEN user deletes a phase from a template THEN the system SHALL remove it from the template (not from existing projects)
7. IF no phase templates exist for a project type THEN the system SHALL display an empty state with option to add phases
8. WHEN a new project is created with a specific project type THEN the system SHALL copy all phase templates for that project type into the new project
9. WHEN a new company is created THEN the system SHALL seed default phase templates matching current `DEFAULT_PROJECT_TEMPLATES`

---

### Requirement 4: Task Template Management

**User Story:** As a GC Admin, I want to create pre-built task templates that are associated with a specific project type AND phase combination, so that when tasks are needed for a phase, they can be quickly added from templates.

#### Acceptance Criteria

1. WHEN user navigates to Settings > Project Configuration > Task Templates THEN the system SHALL display task templates grouped by project type and phase
2. WHEN user selects a project type and phase THEN the system SHALL display the list of task templates for that combination
3. WHEN user clicks "Add Task Template" THEN the system SHALL display a form with fields: title, description, default task type, default priority
4. WHEN user edits a task template THEN the system SHALL update the template definition
5. WHEN user deletes a task template THEN the system SHALL remove it from the template (not from existing tasks)
6. WHEN user reorders task templates THEN the system SHALL update the order for display purposes
7. WHEN a new project is created THEN the system SHALL create tasks from all task templates matching the project type and each phase
8. WHEN user views a phase in a project THEN the system SHALL provide option to "Apply Task Templates" to add missing template tasks
9. WHEN a new company is created THEN the system SHALL seed default task templates matching current `DEFAULT_PROJECT_TEMPLATES`

---

### Requirement 5: Phase CRUD within Projects

**User Story:** As a GC Admin or Project Manager, I want to add, edit, and delete phases within a specific project, so that I can customize the project workflow beyond the default template.

#### Acceptance Criteria

1. WHEN user views a project detail page THEN the system SHALL display an option to manage phases (visible to admin and project_manager only)
2. WHEN user clicks "Add Phase" in project detail THEN the system SHALL display a form to create a new phase with name, description, and order position
3. WHEN user edits a phase within a project THEN the system SHALL update that specific phase instance
4. WHEN user deletes a phase from a project THEN the system SHALL prompt for confirmation and handle tasks in that phase
5. IF user deletes a phase with existing tasks THEN the system SHALL offer options: move tasks to another phase OR delete tasks
6. WHEN user reorders phases within a project THEN the system SHALL update the order_index values and Metro Journey display

---

### Requirement 6: Settings Page Integration

**User Story:** As a GC Admin, I want to access all project configuration options from a dedicated section in Settings, so that I can manage templates in one centralized location.

#### Acceptance Criteria

1. WHEN user navigates to Settings page THEN the system SHALL display a "Project Configuration" section (visible to admin only)
2. WHEN user expands Project Configuration THEN the system SHALL display tabs/sections for: Project Types, Task Types, Phase Templates, Task Templates
3. WHEN user lacks admin role THEN the system SHALL hide the Project Configuration section
4. WHEN user makes changes to any template THEN the system SHALL display a success toast notification
5. WHEN user encounters an error THEN the system SHALL display an error message with details

---

### Requirement 7: Template Application on Project Creation

**User Story:** As a user creating a new project, I want the appropriate phases and tasks to be automatically created based on the selected project type, so that I don't have to manually set up common project structures.

#### Acceptance Criteria

1. WHEN user selects a project type during project creation THEN the system SHALL show a preview of phases that will be created
2. WHEN user submits the project creation form THEN the system SHALL create all phases from the matching phase template
3. WHEN phases are created THEN the system SHALL create all tasks from matching task templates for each phase
4. IF no templates exist for the selected project type THEN the system SHALL create the project with no phases (user can add manually)
5. WHEN project creation completes THEN the system SHALL redirect to project detail showing the created phases and tasks

---

## Non-Functional Requirements

### Performance

1. Template queries SHALL complete within 200ms for typical company sizes (< 100 templates)
2. Project creation with template application SHALL complete within 2 seconds
3. Settings page SHALL lazy-load template sections to minimize initial load time

### Security

1. All template management operations SHALL require admin role
2. Phase CRUD within projects SHALL require admin or project_manager role
3. Templates SHALL be company-scoped with RLS policies preventing cross-company access
4. All input SHALL be validated using Zod schemas before database operations

### Usability

1. Drag-and-drop reordering SHALL provide visual feedback during drag operations
2. Delete operations SHALL require confirmation to prevent accidental data loss
3. Forms SHALL provide inline validation with clear error messages
4. Empty states SHALL provide helpful guidance for getting started

### Data Integrity

1. Deleting a project type SHALL be prevented if projects use that type
2. Templates SHALL use soft references (project_type value, not FK) to allow flexibility
3. Existing projects SHALL NOT be affected when templates are modified
4. Seeding SHALL be idempotent (safe to run multiple times)

---

## Data Models

### New Tables Required

#### project_type_configs
- id: uuid (PK)
- company_id: uuid (FK -> companies)
- name: text (e.g., "Residential", "Restaurant/Cafe")
- description: text
- icon_name: text (Lucide icon name)
- color: text (hex color code)
- is_default: boolean (seeded defaults)
- order_index: integer
- is_active: boolean
- created_at: timestamptz
- updated_at: timestamptz

#### task_type_configs
- id: uuid (PK)
- company_id: uuid (FK -> companies)
- name: text (e.g., "Work", "Purchase", "Approval")
- description: text
- color: text (hex color code)
- icon_name: text (Lucide icon name)
- is_default: boolean (seeded defaults)
- is_active: boolean
- created_at: timestamptz
- updated_at: timestamptz

#### phase_templates
- id: uuid (PK)
- company_id: uuid (FK -> companies)
- project_type_config_id: uuid (FK -> project_type_configs)
- name: text
- description: text
- order_index: integer
- is_active: boolean
- created_at: timestamptz
- updated_at: timestamptz

#### task_templates
- id: uuid (PK)
- company_id: uuid (FK -> companies)
- phase_template_id: uuid (FK -> phase_templates)
- title: text
- description: text
- default_task_type: text (references task_type_configs.name)
- default_priority: task_priority enum
- order_index: integer
- is_active: boolean
- created_at: timestamptz
- updated_at: timestamptz

### Modified Tables

#### projects
- project_type: text (change from enum to text, references project_type_configs.name for flexibility)

#### tasks
- task_type: text (already exists, will reference task_type_configs.name)

---

## API Endpoints / Server Actions

### Project Type Actions (app/actions/project-types.ts)
- `getProjectTypes()` - List all project types for company
- `createProjectType(formData)` - Create new project type
- `updateProjectType(id, formData)` - Update existing project type
- `deleteProjectType(id)` - Delete project type (with usage check)

### Task Type Actions (app/actions/task-types.ts)
- `getTaskTypes()` - List all task types for company
- `createTaskType(formData)` - Create new task type
- `updateTaskType(id, formData)` - Update existing task type
- `deleteTaskType(id)` - Delete task type

### Phase Template Actions (app/actions/phase-templates.ts)
- `getPhaseTemplates(projectTypeId?)` - List phase templates, optionally filtered
- `createPhaseTemplate(formData)` - Create new phase template
- `updatePhaseTemplate(id, formData)` - Update phase template
- `deletePhaseTemplate(id)` - Delete phase template
- `reorderPhaseTemplates(projectTypeId, newOrder)` - Update order of phases

### Task Template Actions (app/actions/task-templates.ts)
- `getTaskTemplates(phaseTemplateId?)` - List task templates, optionally filtered
- `createTaskTemplate(formData)` - Create new task template
- `updateTaskTemplate(id, formData)` - Update task template
- `deleteTaskTemplate(id)` - Delete task template
- `reorderTaskTemplates(phaseTemplateId, newOrder)` - Update order of tasks

### Phase CRUD Actions (extend app/actions/phases.ts)
- `createPhase(projectId, formData)` - Create new phase in project
- `deletePhase(phaseId, taskHandling)` - Delete phase with task handling option

### Template Seeding
- Database trigger or function to seed defaults on company creation
- Migration to seed existing companies with default templates

---

## Migration Strategy

1. Create new tables with migrations via MCP Supabase
2. Create seed function for default templates
3. Run seed for all existing companies
4. Modify project creation flow to use database templates instead of `lib/default-project-templates.ts`
5. Update TaskModal to fetch task types from database
6. Add Settings page UI components
7. Deprecate `lib/default-project-templates.ts` (keep as fallback during transition)
