# Automatic Phase and Task Creation from Templates

## Overview

GenHub automatically creates project phases and tasks based on templates when a new project is created. This ensures consistency across projects of the same type and saves time during project setup.

## Architecture

### Database Tables

1. **project_type_configs** - Defines available project types (Residential, Restaurant/Cafe, Commercial Office, Industrial)
2. **phase_templates** - Defines phases for each project type
3. **task_templates** - Defines tasks within each phase template
4. **projects** - Main project table with `project_type_config_id` column
5. **project_phases** - Actual phases created for each project
6. **tasks** - Actual tasks created for each project

### Data Flow

```
┌─────────────────────────────┐
│  New Project Created        │
│  (with project_type_config) │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│  Trigger Fires              │
│  create_phases_and_tasks_   │
│  on_project_insert          │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│  Function Executes          │
│  create_phases_and_tasks_   │
│  from_templates()           │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│  Loop through phase_        │
│  templates for project type │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│  Create phase from template │
│  in project_phases table    │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│  Loop through task_         │
│  templates for this phase   │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│  Create task from template  │
│  in tasks table             │
│  (calculate due_date if     │
│   days_offset is set)       │
└─────────────────────────────┘
```

## Template Structure

### Project Type Config
- **Residential** - Single-family homes, townhouses
- **Restaurant/Cafe** - Food service establishments
- **Commercial Office** - Office buildings and spaces
- **Industrial** - Warehouses, factories, industrial facilities

### Phase Templates (Standard 5 Phases)
Each project type has 5 standard phases:
1. **Initiation** - Project kickoff and initial planning
2. **Pre-construction** - Planning and preparation
3. **Procurement** - Material and equipment procurement
4. **Construction** - Active construction phase
5. **Post-construction** - Final inspections and closeout

### Task Templates
Each phase has specific tasks tailored to the project type. For example:

**Residential > Initiation:**
- Site Assessment
- Preliminary Estimating
- Proposal Submission
- Sign Prime Contract
- Concept Design

**Restaurant/Cafe > Procurement:**
- Kitchen Equipment
- Order Light Fixtures & Furniture
- Award MEP Subcontractors

## Trigger Function

The trigger function `create_phases_and_tasks_from_templates()` runs automatically when a new project is inserted.

### Key Features

1. **Fallback Behavior** - If no `project_type_config_id` is set, creates 5 universal phases (backwards compatibility)
2. **Order Preservation** - Phases and tasks are created in the order defined by `order_index`
3. **Status Initialization** - All phases start as 'not_started'
4. **Date Calculation** - Tasks with `days_offset` get automatic due dates based on project start date
5. **Company Isolation** - Only templates from the project's company are used

### Function Logic

```sql
-- Simplified pseudocode
FOR each phase_template WHERE project_type_config_id = NEW.project_type_config_id
  INSERT phase INTO project_phases

  FOR each task_template WHERE phase_template_id = phase.id
    INSERT task INTO tasks

    -- Calculate due_date if applicable
    IF project.start_date IS NOT NULL AND task_template.days_offset IS NOT NULL
      task.due_date = project.start_date + days_offset
```

## Usage

### Creating a Project with Auto-Generation

```sql
INSERT INTO public.projects (
  company_id,
  name,
  client_name,
  project_type,
  project_type_config_id,  -- This triggers auto-generation
  start_date,
  created_by
)
VALUES (
  'company-uuid',
  'New Residential Project',
  'John Doe',
  'residential',
  (SELECT id FROM project_type_configs
   WHERE company_id = 'company-uuid'
   AND name = 'Residential'),
  CURRENT_DATE,
  next_auth.uid()
);
```

### Creating a Project WITHOUT Auto-Generation

```sql
INSERT INTO public.projects (
  company_id,
  name,
  client_name,
  project_type,
  -- project_type_config_id is NULL
  created_by
)
VALUES (
  'company-uuid',
  'Custom Project',
  'Jane Smith',
  'residential',
  next_auth.uid()
);
-- This creates 5 universal phases: Initiation, Pre-Construction,
-- Procurement, Construction, Post-Construction
```

## Task Date Scheduling

Tasks can be automatically scheduled based on the project start date using the `days_offset` field.

### Example

```sql
-- Template with days_offset
days_offset = 0   → Task starts on project start date
days_offset = 7   → Task starts 7 days after project start
days_offset = 30  → Task starts 30 days after project start
days_offset = NULL → No automatic scheduling

-- If project.start_date = 2026-01-01
-- And task_template.days_offset = 14
-- Then created task.due_date = 2026-01-15
```

## Customization

### Adding New Templates

#### 1. Add a New Project Type

```sql
INSERT INTO public.project_type_configs (
  company_id,
  name,
  description,
  icon_name,
  color,
  is_default
)
VALUES (
  'company-uuid',
  'Healthcare Facility',
  'Medical and healthcare construction projects',
  'Heart',
  '#EF4444',
  false
);
```

#### 2. Add Phase Templates

```sql
INSERT INTO public.phase_templates (
  company_id,
  project_type_config_id,
  name,
  description,
  order_index
)
VALUES
  ('company-uuid', 'project-type-uuid', 'Planning', 'Initial planning phase', 0),
  ('company-uuid', 'project-type-uuid', 'Design', 'Design and engineering', 1),
  ('company-uuid', 'project-type-uuid', 'Build', 'Construction phase', 2);
```

#### 3. Add Task Templates

```sql
INSERT INTO public.task_templates (
  company_id,
  phase_template_id,
  title,
  description,
  default_priority,
  days_offset,
  order_index
)
VALUES
  ('company-uuid', 'phase-uuid', 'Medical Equipment Planning', NULL, 'high', 0, 0),
  ('company-uuid', 'phase-uuid', 'HVAC Design Review', NULL, 'high', 7, 1),
  ('company-uuid', 'phase-uuid', 'Infection Control Setup', NULL, 'critical', 14, 2);
```

### Modifying Existing Templates

```sql
-- Update phase template
UPDATE public.phase_templates
SET description = 'Updated description',
    order_index = 2
WHERE id = 'phase-template-uuid';

-- Update task template
UPDATE public.task_templates
SET title = 'Updated Task Title',
    default_priority = 'high',
    days_offset = 21
WHERE id = 'task-template-uuid';

-- Deactivate a template (won't be used for new projects)
UPDATE public.task_templates
SET is_active = false
WHERE id = 'task-template-uuid';
```

## Seeding Templates for New Companies

When a new company is created, templates are automatically seeded via the `seed_company_templates()` function.

### Manual Seeding

```sql
-- Seed templates for a specific company
SELECT public.seed_company_templates('company-uuid');
```

## Migrations

The automatic phase and task creation system is implemented in the following migrations:

1. **035_project_type_configs.sql** - Project type configuration table
2. **036_task_type_configs.sql** - Task type configuration table
3. **037_phase_templates.sql** - Phase templates table
4. **038_task_templates.sql** - Task templates table
5. **039_seed_default_templates.sql** - Default template seeding
6. **041_add_days_offset_to_task_templates.sql** - Add date scheduling
7. **045_auto_create_phases_tasks_from_templates.sql** - Main trigger implementation
8. **048_fix_project_creation_use_trigger.sql** - Fix existing projects

## Testing

Use the provided test script to verify the system:

```bash
# Run the test script
psql $DATABASE_URL -f test_auto_phase_task_creation.sql
```

Or run the verification migration:

```bash
# Run verification migration
psql $DATABASE_URL -f supabase/migrations/049_verify_auto_phase_task_creation.sql
```

## Troubleshooting

### Phases/Tasks Not Created

1. **Check if project_type_config_id is set**
   ```sql
   SELECT id, name, project_type_config_id
   FROM projects
   WHERE id = 'project-uuid';
   ```

2. **Verify trigger is enabled**
   ```sql
   SELECT tgname, tgenabled
   FROM pg_trigger
   WHERE tgname = 'create_phases_and_tasks_on_project_insert';
   ```

3. **Check template data exists**
   ```sql
   SELECT COUNT(*) FROM phase_templates
   WHERE project_type_config_id = 'config-uuid';

   SELECT COUNT(*) FROM task_templates
   WHERE phase_template_id IN (
     SELECT id FROM phase_templates
     WHERE project_type_config_id = 'config-uuid'
   );
   ```

### Wrong Templates Used

- Verify `company_id` matches between project and templates
- Check `is_active = true` on templates
- Verify `order_index` is set correctly

### Dates Not Calculated

- Ensure `project.start_date` is set
- Verify `task_template.days_offset` is not NULL
- Check that project was created AFTER migration 041

## Security

- **RLS Policies** - Templates are isolated by company
- **Permissions** - Only GC admins can create/modify templates
- **SECURITY DEFINER** - Trigger function runs with elevated privileges to create phases/tasks

## Performance

- **Indexes** - All foreign keys and commonly queried columns are indexed
- **Batch Creation** - All phases and tasks created in single transaction
- **Minimal Queries** - Function optimized to minimize database round-trips

## Future Enhancements

Potential improvements to consider:

1. **Template Versioning** - Track template changes over time
2. **Template Cloning** - Copy templates between companies or project types
3. **Conditional Tasks** - Tasks that are only created based on project attributes
4. **Task Dependencies** - Auto-create task dependencies from templates
5. **Resource Assignment** - Pre-assign tasks to specific roles from templates
6. **Budget Templates** - Include cost estimates in task templates
7. **Duration Templates** - Add estimated duration to task templates
8. **Custom Fields** - Support custom fields in templates

## Related Documentation

- [DB_SCHEMA.md](/.claude/docs/law/DB_SCHEMA.md) - Complete database schema
- [SYSTEM.md](/.claude/docs/law/SYSTEM.md) - System architecture
- Migration files in `/supabase/migrations/`
