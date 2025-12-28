# Phase System Documentation

**Last Updated**: 2025-12-06
**Database Table**: `project_phases`
**Status**: Fully Implemented with Auto-Calculations

## Overview

The Phase System divides construction projects into 5 universal phases that represent the standard lifecycle of any construction project. Phases are automatically created when a project is created, tracked through Metro Journey visualization, and their completion is automatically calculated based on task progress.

## Universal Phases

Every project gets these 5 phases in order:

| Order | Phase Name | Icon | Purpose |
|-------|------------|------|---------|
| 0 | Initiation | Rocket | Project kickoff, planning, approvals |
| 1 | Pre-Construction | FileText | Design, permits, engineering |
| 2 | Procurement | ShoppingCart | Material ordering, subcontractor bidding |
| 3 | Construction | HardHat | On-site execution and building |
| 4 | Post-Construction | CheckCircle2 | Inspection, punch list, closeout |

## Database Schema

### project_phases Table

```sql
CREATE TABLE project_phases (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id uuid NOT NULL REFERENCES projects ON DELETE CASCADE,
  name text NOT NULL,
  order_index int NOT NULL DEFAULT 0,
  status phase_status NOT NULL DEFAULT 'pending',  -- pending | in_progress | completed
  completion_percentage int DEFAULT 0,
  started_at timestamptz,
  completed_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_project_phases_project ON project_phases(project_id, order_index);
```

### phase_status Enum

```sql
CREATE TYPE phase_status AS ENUM ('pending', 'in_progress', 'completed');
```

## Auto-Creation Trigger

When a project is created, a database trigger automatically creates all 5 phases:

```sql
CREATE TRIGGER auto_create_project_phases
  AFTER INSERT ON projects
  FOR EACH ROW
  EXECUTE FUNCTION create_default_phases();
```

**Trigger Function**:
```sql
CREATE OR REPLACE FUNCTION create_default_phases()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO project_phases (project_id, name, order_index, status)
  VALUES
    (NEW.id, 'Initiation', 0, 'pending'),
    (NEW.id, 'Pre-Construction', 1, 'pending'),
    (NEW.id, 'Procurement', 2, 'pending'),
    (NEW.id, 'Construction', 3, 'pending'),
    (NEW.id, 'Post-Construction', 4, 'pending');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Result**: New projects immediately have 5 phases in `pending` status.

## Auto-Calculation System

### Phase Completion Calculation

**Trigger**: When tasks are created, updated, or deleted
**Logic**: Calculate what percentage of phase tasks are completed

```sql
CREATE TRIGGER auto_calculate_phase_completion
  AFTER INSERT OR UPDATE OR DELETE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION calculate_phase_completion();
```

**Calculation**:
```sql
CREATE OR REPLACE FUNCTION calculate_phase_completion()
RETURNS TRIGGER AS $$
DECLARE
  phase_id_to_update uuid;
  total_tasks int;
  completed_tasks int;
  new_percentage int;
BEGIN
  -- Determine which phase to update
  IF (TG_OP = 'DELETE') THEN
    phase_id_to_update := OLD.phase_id;
  ELSE
    phase_id_to_update := NEW.phase_id;
  END IF;

  IF phase_id_to_update IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Count total and completed tasks in this phase
  SELECT COUNT(*), COUNT(CASE WHEN status = 'completed' THEN 1 END)
  INTO total_tasks, completed_tasks
  FROM tasks
  WHERE phase_id = phase_id_to_update;

  -- Calculate percentage
  IF total_tasks = 0 THEN
    new_percentage := 0;
  ELSE
    new_percentage := ROUND((completed_tasks::numeric / total_tasks) * 100);
  END IF;

  -- Update phase
  UPDATE project_phases
  SET completion_percentage = new_percentage,
      updated_at = now()
  WHERE id = phase_id_to_update;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;
```

**Example**:
- Phase has 10 tasks
- 7 tasks completed
- Completion: 70%

### Project Completion Calculation

**Trigger**: When phase completion changes
**Logic**: Average all phase completions to get project completion

```sql
CREATE TRIGGER auto_calculate_project_completion
  AFTER UPDATE ON project_phases
  FOR EACH ROW
  WHEN (OLD.completion_percentage IS DISTINCT FROM NEW.completion_percentage)
  EXECUTE FUNCTION calculate_project_completion();
```

**Calculation**:
```sql
CREATE OR REPLACE FUNCTION calculate_project_completion()
RETURNS TRIGGER AS $$
DECLARE
  avg_completion numeric;
BEGIN
  -- Calculate average completion across all phases
  SELECT AVG(completion_percentage)
  INTO avg_completion
  FROM project_phases
  WHERE project_id = NEW.project_id;

  -- Update project
  UPDATE projects
  SET completion_percentage = ROUND(avg_completion),
      updated_at = now()
  WHERE id = NEW.project_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Example**:
- Initiation: 100%
- Pre-Construction: 75%
- Procurement: 50%
- Construction: 25%
- Post-Construction: 0%
- **Project Average**: (100 + 75 + 50 + 25 + 0) / 5 = **50%**

## Phase Lifecycle

### Status Flow

```
pending → in_progress → completed
```

**Conventions** (not enforced by database):
- Only one phase should be `in_progress` at a time
- Phases typically progress sequentially (Initiation → Pre-Construction → ...)
- Phase can be skipped by moving directly to `completed`

### Status Transitions

**Start Phase**:
```typescript
// Server Action: updatePhaseStatus
await supabase
  .from('project_phases')
  .update({ status: 'in_progress', started_at: new Date().toISOString() })
  .eq('id', phaseId);
```

**Complete Phase**:
```typescript
await supabase
  .from('project_phases')
  .update({ status: 'completed', completed_at: new Date().toISOString() })
  .eq('id', phaseId);
```

### Helper Actions

**File**: `app/actions/phases.ts`

| Action | Purpose |
|--------|---------|
| `updatePhaseStatus(formData)` | Change phase status |
| `updatePhase(formData)` | Update phase details (notes, dates) |
| `getProjectPhases(projectId)` | Fetch all phases with stats |
| `startNextPhase(projectId)` | Start the next pending phase |
| `completeCurrentPhase(projectId, startNext)` | Complete in-progress phase, optionally start next |

## Metro Journey Visualization

**Component**: `components/projects/MetroJourney.tsx`

**Purpose**: Subway-style visualization of project phases.

### Visual Design

**Track Line**:
- Horizontal line connecting stations
- Color-coded segments:
  - Completed: Green gradient
  - In Progress: Blue gradient with shimmer
  - Pending: Gray

**Phase Stations** (`PhaseStation.tsx`):
- Circle (20x20) with icon
- Completion percentage ring
- Status badge ("Active" or "Complete")
- Warning indicators (blockers/overdue)
- Hover scale (110%)

**Icons by Phase**:
- Initiation: Rocket
- Pre-Construction: FileText (blueprint)
- Procurement: ShoppingCart
- Construction: HardHat
- Post-Construction: CheckCircle2

### Interaction

1. Click phase station → Expands `PhaseDetailPanel`
2. Panel shows:
   - Phase name and status
   - Task list for this phase
   - Progress stats
   - Warning banners (blocked/overdue)
   - Add Task and View All Tasks buttons

## Phase-Task Integration

### Assigning Tasks to Phases

**TaskModal** includes phase dropdown:
```typescript
<Select value={phaseId} onValueChange={setPhaseId}>
  <SelectItem value="none">No phase</SelectItem>
  {phases
    .sort((a, b) => a.order_index - b.order_index)
    .map((phase) => (
      <SelectItem key={phase.id} value={phase.id}>
        {phase.name}
      </SelectItem>
    ))}
</Select>
```

**Database**:
```sql
tasks.phase_id uuid REFERENCES project_phases(id) ON DELETE SET NULL
```

**Nullable**: Tasks can exist without a phase assignment.

### Phase Filtering (Project Context)

**TaskBoard** in project context shows phase filter:
```typescript
{phases?.map((phase) => (
  <button
    key={phase.id}
    onClick={() => setPhaseFilter(phase.id)}
    className={phaseFilter === phase.id ? 'active' : ''}
  >
    {phase.name}
  </button>
))}
```

Filters tasks to show only those assigned to selected phase.

## Phase Statistics

**PhaseStats** calculated in page.tsx:
```typescript
interface PhaseStats {
  phaseId: string;
  totalTasks: number;
  completedTasks: number;
  blockedTasks: number;
  overdueTasks: number;
}

const phaseTaskStats = phases.map((phase) => {
  const phaseTasks = tasks.filter((t) => t.phase_id === phase.id);
  return {
    phaseId: phase.id,
    totalTasks: phaseTasks.length,
    completedTasks: phaseTasks.filter((t) => t.status === 'completed').length,
    blockedTasks: phaseTasks.filter((t) => t.status === 'blocked').length,
    overdueTasks: phaseTasks.filter(
      (t) => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'completed'
    ).length,
  };
});
```

**Used by**:
- MetroJourney - Warning indicators on stations
- PhaseDetailPanel - Progress bars and warnings

## Phase Templates

**File**: `lib/project-templates.ts`

Each project type has suggested tasks per phase:

```typescript
export const PROJECT_TEMPLATES: Record<ProjectType, ProjectTemplate> = {
  residential: {
    phases: {
      initiation: [
        'Site survey and feasibility study',
        'Zoning and permit applications',
        'Budget and timeline planning',
        'Contract negotiations',
      ],
      pre_construction: [
        'Architectural drawings',
        'Structural engineering plans',
        'MEP (Mechanical, Electrical, Plumbing) design',
        'Building permit approval',
      ],
      procurement: [
        'Material ordering and scheduling',
        'Subcontractor bidding and selection',
        'Equipment rental arrangements',
        'Vendor contract finalization',
      ],
      construction: [
        'Site preparation and excavation',
        'Foundation and framing',
        'Rough-in (electrical, plumbing, HVAC)',
        'Drywall, insulation, and finishing',
        'Final installations and fixtures',
      ],
      post_construction: [
        'Final inspection and code compliance',
        'Punch list completion',
        'Client walkthrough and handover',
        'Warranty documentation',
      ],
    },
  },
  // ... restaurant_cafe, commercial_office, industrial
};
```

**Usage**: Displayed in CreateProjectForm sidebar as guidance.

## RLS Policies

```sql
-- Read: Company members can read project phases
CREATE POLICY phases_read ON project_phases
  FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM projects
      WHERE company_id IN (
        SELECT company_id FROM company_users
        WHERE user_id = (SELECT next_auth.uid()) AND status = 'active'
      )
    )
  );

-- Update: GC Admin and PM can update phases
CREATE POLICY phases_update ON project_phases
  FOR UPDATE
  USING (
    project_id IN (
      SELECT id FROM projects
      WHERE company_id IN (
        SELECT company_id FROM company_users
        WHERE user_id = (SELECT next_auth.uid())
        AND role IN ('gc_admin', 'project_manager')
        AND status = 'active'
      )
    )
  );
```

## Best Practices

### Phase Management

1. **Don't skip phases prematurely**: Move sequentially unless absolutely necessary
2. **Use phase notes**: Document decisions and context
3. **Monitor completion**: Address phases stuck at low completion
4. **Track blockers**: Warning indicators help identify bottlenecks

### Task Assignment

1. **Assign tasks to appropriate phases**: Helps with organization and tracking
2. **Phase filter in project context**: Focus on current phase tasks
3. **Phase completion drives project progress**: More phase assignments = better metrics

### Workflow

**Typical Project Flow**:
1. Project created → 5 phases auto-created (all `pending`)
2. Start Initiation phase → `in_progress`
3. Add tasks to Initiation phase
4. Complete tasks → Phase completion increases
5. When ready, complete Initiation → `completed`
6. Start Pre-Construction → `in_progress`
7. Repeat for each phase
8. Final phase completed → Project completion = 100%

## Future Enhancements

**Epic 4-5 Additions**:
- Custom phase names and order (per project type)
- Phase dependencies (enforce sequential progression)
- Phase duration tracking (actual vs planned)
- Phase budget tracking (costs per phase)
- Phase templates per project type
- Phase-based reporting and analytics
- Milestone tracking within phases
- Phase transition approvals (workflow)

## Related Documentation

- [Database Schema](../database-schema.md) - project_phases table and triggers
- [Projects Module](projects-module.md) - MetroJourney and PhaseStation components
- [Tasks Module](tasks-module.md) - Phase assignment and filtering
- [Project Structure](../project-structure.md) - File organization

## Code Examples

### Fetching Phases with Tasks

```typescript
const { data: project } = await supabase
  .from('projects')
  .select(`
    *,
    project_phases!inner (
      id, name, status, completion_percentage, started_at, completed_at, order_index, notes
    ),
    tasks (
      id, title, status, priority, phase_id, due_date
    )
  `)
  .eq('id', projectId)
  .single();

// Calculate stats per phase
const phaseStats = project.project_phases.map((phase) => {
  const phaseTasks = project.tasks.filter((t) => t.phase_id === phase.id);
  return {
    phaseId: phase.id,
    totalTasks: phaseTasks.length,
    completedTasks: phaseTasks.filter((t) => t.status === 'completed').length,
    blockedTasks: phaseTasks.filter((t) => t.status === 'blocked').length,
  };
});
```

### Updating Phase Status

```typescript
'use server';

export async function updatePhaseStatus(formData: FormData) {
  const phaseId = formData.get('phase_id');
  const status = formData.get('status'); // 'pending' | 'in_progress' | 'completed'

  const supabase = await createClient();

  const updates: any = { status };

  if (status === 'in_progress' && !phase.started_at) {
    updates.started_at = new Date().toISOString();
  }

  if (status === 'completed' && !phase.completed_at) {
    updates.completed_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from('project_phases')
    .update(updates)
    .eq('id', phaseId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/app/projects/${phase.project_id}`);
  return { success: true };
}
```

### Starting Next Phase

```typescript
'use server';

export async function startNextPhase(projectId: string) {
  const supabase = await createClient();

  // Find next pending phase by order_index
  const { data: nextPhase } = await supabase
    .from('project_phases')
    .select('*')
    .eq('project_id', projectId)
    .eq('status', 'pending')
    .order('order_index', { ascending: true })
    .limit(1)
    .single();

  if (!nextPhase) {
    return { error: 'No pending phases remaining' };
  }

  // Start the phase
  const { error } = await supabase
    .from('project_phases')
    .update({ status: 'in_progress', started_at: new Date().toISOString() })
    .eq('id', nextPhase.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/app/projects/${projectId}`);
  return { success: true, phase: nextPhase };
}
```

---

The Phase System provides automatic project organization, progress tracking, and visual feedback through Metro Journey, making it easy for teams to understand project status at a glance.
