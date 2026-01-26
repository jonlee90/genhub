# Phase Template Icons & Template Seeding - Technical Design

## Overview
Add an `icon_name` column to `phase_templates` table, update the settings UI to allow icon selection via dropdown, modify PhaseStation to use template icons, and implement database trigger + migration to seed new/existing companies with default phase and task templates from reference company.

## Requirements Reference
See: `.claude/specs/phase-template-icons/requirements.md`

---

## Architecture Overview

### Component Diagram
```
┌─────────────────────────────────────────────────────────────────┐
│                      DATABASE LAYER                              │
│  ┌──────────────────┐         ┌──────────────────┐             │
│  │ phase_templates  │────────▶│ task_templates   │             │
│  │ + icon_name      │  1:N    │                  │             │
│  └──────────────────┘         └──────────────────┘             │
│           ▲                            ▲                         │
│           │                            │                         │
│  ┌────────┴────────────────────────────┴────────┐               │
│  │ seed_phase_task_templates_for_company()      │               │
│  │ (trigger on company insert)                  │               │
│  └──────────────────────────────────────────────┘               │
└─────────────────────────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                   SERVER ACTIONS LAYER                           │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ app/actions/phase-templates.ts                             │ │
│  │  - createPhaseTemplate (accepts icon_name)                 │ │
│  │  - updatePhaseTemplate (accepts icon_name)                 │ │
│  │  - getPhaseTemplates (returns icon_name)                   │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                     UI COMPONENTS LAYER                          │
│  ┌─────────────────────────────┐  ┌─────────────────────────┐  │
│  │ PhaseTemplateManager.tsx    │  │ PhaseStation.tsx        │  │
│  │  - Icon dropdown selector   │  │  - Reads icon_name      │  │
│  │  - Create/Edit forms        │  │  - Renders Lucide icon  │  │
│  └─────────────────────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow
```
1. COMPANY CREATION:
   companies INSERT → trigger → seed_phase_task_templates_for_company()
   → Query reference company templates → INSERT phase_templates (with icons)
   → INSERT task_templates → revalidatePath('/app/settings')

2. ADMIN CREATES/EDITS PHASE:
   PhaseTemplateManager → Server Action (createPhaseTemplate/updatePhaseTemplate)
   → Validate icon_name → INSERT/UPDATE phase_templates
   → revalidatePath → PhaseTemplateManager re-fetches

3. PM VIEWS PROJECT:
   PhaseStation → Reads project_phases.phase_template_id
   → Joins to phase_templates.icon_name → Renders Lucide icon
```

---

## Data Model

### Table: phase_templates (ALTER)
**Add Column:**
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| icon_name | text | NULL, max length 50 | Lucide icon component name (e.g., 'Rocket', 'Hammer') |

**Indexes:**
- Existing indexes sufficient (company_id, project_type_config_id already indexed)

**Migration Notes:**
- Default value: NULL (existing records won't break)
- Validation: Optional, but recommended to check against known Lucide icon list
- No NOT NULL constraint (allows graceful fallback)

### Table: project_phases (NO CHANGES)
**Note:** `project_phases` links to `phase_templates` via `phase_template_id` FK. Icon is read via JOIN.

---

## Database Functions & Triggers

### Function: `seed_phase_task_templates_for_company()`
**Purpose:** Copy phase and task templates from reference company on new company creation

**Logic:**
```sql
CREATE OR REPLACE FUNCTION public.seed_phase_task_templates_for_company()
RETURNS TRIGGER AS $$
DECLARE
  v_cafe_project_type_id UUID;
  v_reference_cafe_id UUID;
  v_phase_template RECORD;
  v_new_phase_id UUID;
BEGIN
  -- 1. Find "Cafe" project type for the new company
  SELECT id INTO v_cafe_project_type_id
  FROM public.project_type_configs
  WHERE company_id = NEW.id AND name = 'Cafe'
  LIMIT 1;

  IF v_cafe_project_type_id IS NULL THEN
    RAISE NOTICE 'No Cafe project type found for company %, skipping template seeding', NEW.id;
    RETURN NEW;
  END IF;

  -- 2. Find reference company's Cafe project type
  SELECT id INTO v_reference_cafe_id
  FROM public.project_type_configs
  WHERE company_id = '7633050c-f24e-4f8d-8396-22198b852bf6' AND name = 'Cafe'
  LIMIT 1;

  IF v_reference_cafe_id IS NULL THEN
    RAISE WARNING 'Reference company Cafe templates not found, skipping seeding for company %', NEW.id;
    RETURN NEW;
  END IF;

  -- 3. Copy phase templates with icons
  FOR v_phase_template IN
    SELECT * FROM public.phase_templates
    WHERE project_type_config_id = v_reference_cafe_id
    AND is_active = true
    ORDER BY order_index
  LOOP
    -- Insert phase template
    INSERT INTO public.phase_templates (
      company_id, project_type_config_id, name, description,
      icon_name, order_index, is_active
    ) VALUES (
      NEW.id, v_cafe_project_type_id, v_phase_template.name, v_phase_template.description,
      v_phase_template.icon_name, v_phase_template.order_index, v_phase_template.is_active
    )
    RETURNING id INTO v_new_phase_id;

    -- 4. Copy task templates for this phase
    INSERT INTO public.task_templates (
      company_id, phase_template_id, title, description,
      default_task_type, default_priority, days_offset, order_index, is_active
    )
    SELECT
      NEW.id, v_new_phase_id, title, description,
      default_task_type, default_priority, days_offset, order_index, is_active
    FROM public.task_templates
    WHERE phase_template_id = v_phase_template.id
    AND is_active = true
    ORDER BY order_index;
  END LOOP;

  RAISE NOTICE 'Seeded phase and task templates for company % from reference company', NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;
```

**Trigger:**
```sql
DROP TRIGGER IF EXISTS seed_phase_task_templates_on_company_insert ON public.companies;

CREATE TRIGGER seed_phase_task_templates_on_company_insert
  AFTER INSERT ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.seed_phase_task_templates_for_company();
```

**Integration:**
- Append to existing `seed_default_configs_for_company()` OR create separate function
- Runs AFTER existing project_type_configs seeding (depends on "Cafe" type existing)

---

## Backfill Migration (Existing Companies)

### Migration: `YYYYMMDDHHMMSS_backfill_phase_task_templates.sql`
**Purpose:** Fill missing templates for existing companies without Cafe phase templates

```sql
-- Backfill phase and task templates for existing companies
DO $$
DECLARE
  v_company RECORD;
  v_cafe_project_type_id UUID;
  v_reference_cafe_id UUID;
  v_phase_template RECORD;
  v_new_phase_id UUID;
  v_companies_updated INT := 0;
  v_phases_created INT := 0;
  v_tasks_created INT := 0;
BEGIN
  -- Find reference company's Cafe project type ID
  SELECT id INTO v_reference_cafe_id
  FROM public.project_type_configs
  WHERE company_id = '7633050c-f24e-4f8d-8396-22198b852bf6' AND name = 'Cafe'
  LIMIT 1;

  IF v_reference_cafe_id IS NULL THEN
    RAISE WARNING 'Reference company Cafe templates not found, aborting backfill';
    RETURN;
  END IF;

  -- Loop through companies that have Cafe project type but no phase templates
  FOR v_company IN
    SELECT c.id, ptc.id as cafe_type_id
    FROM public.companies c
    INNER JOIN public.project_type_configs ptc ON ptc.company_id = c.id
    LEFT JOIN public.phase_templates pt ON pt.project_type_config_id = ptc.id
    WHERE ptc.name = 'Cafe'
    AND ptc.is_active = true
    AND pt.id IS NULL
  LOOP
    -- Copy phase templates
    FOR v_phase_template IN
      SELECT * FROM public.phase_templates
      WHERE project_type_config_id = v_reference_cafe_id
      AND is_active = true
      ORDER BY order_index
    LOOP
      -- Insert phase template
      INSERT INTO public.phase_templates (
        company_id, project_type_config_id, name, description,
        icon_name, order_index, is_active
      ) VALUES (
        v_company.id, v_company.cafe_type_id, v_phase_template.name, v_phase_template.description,
        v_phase_template.icon_name, v_phase_template.order_index, v_phase_template.is_active
      )
      RETURNING id INTO v_new_phase_id;

      v_phases_created := v_phases_created + 1;

      -- Copy task templates for this phase
      INSERT INTO public.task_templates (
        company_id, phase_template_id, title, description,
        default_task_type, default_priority, days_offset, order_index, is_active
      )
      SELECT
        v_company.id, v_new_phase_id, title, description,
        default_task_type, default_priority, days_offset, order_index, is_active
      FROM public.task_templates
      WHERE phase_template_id = v_phase_template.id
      AND is_active = true
      ORDER BY order_index;

      -- Count tasks created
      GET DIAGNOSTICS v_tasks_created = ROW_COUNT;
    END LOOP;

    v_companies_updated := v_companies_updated + 1;
  END LOOP;

  RAISE NOTICE 'Backfill complete: % companies updated, % phases created, % tasks created',
    v_companies_updated, v_phases_created, v_tasks_created;
END $$;
```

---

## Server Actions

### Update: `createPhaseTemplate(formData: FormData)`
**Changes:**
- Add `icon_name` to validation schema
- Extract `icon_name` from FormData
- Include `icon_name` in INSERT

**Input Schema (Zod):**
```typescript
const createPhaseTemplateSchema = z.object({
  project_type_config_id: z.string().uuid("Invalid project type ID"),
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().max(500).optional(),
  icon_name: z.string().max(50).optional().nullable(), // NEW
});
```

**Implementation:**
```typescript
const rawData = {
  project_type_config_id: formData.get("project_type_config_id"),
  name: formData.get("name"),
  description: formData.get("description") || undefined,
  icon_name: formData.get("icon_name") || undefined, // NEW
};
```

### Update: `updatePhaseTemplate(id: string, formData: FormData)`
**Changes:**
- Add `icon_name` to update validation schema
- Extract and persist `icon_name`

**Input Schema (Zod):**
```typescript
const updatePhaseTemplateSchema = z.object({
  name: z.string().min(1, "Name is required").max(100).optional(),
  description: z.string().max(500).optional(),
  is_active: z.boolean().optional(),
  icon_name: z.string().max(50).optional().nullable(), // NEW
});
```

### No changes needed:
- `getPhaseTemplates()` - Already returns all columns via `SELECT *`
- `deletePhaseTemplate()` - No schema changes
- `reorderPhaseTemplates()` - No schema changes

---

## UI Specification

### Component Hierarchy
```
PhaseTemplateManager (Client)
├── ResponsiveModal (Create/Edit)
│   └── PhaseTemplateForm
│       ├── Name Input
│       ├── Description Textarea
│       ├── IconSelector (NEW)
│       └── Active Checkbox (edit only)
└── SortablePhaseItem
    └── TemplateCard

PhaseStation (Client)
├── DynamicIcon (NEW - from template)
└── AnimatedTooltip
```

### New Component: IconSelector

**Location:** `components/settings/IconSelector.tsx`

**Props:**
```typescript
interface IconSelectorProps {
  name: string; // form field name
  defaultValue?: string | null;
  required?: boolean;
}
```

**Behavior:**
- Renders as a Select dropdown with icon previews
- Options: 16-20 construction-themed Lucide icons
- Each option shows icon + name
- Default option: "Default Icon" (uses Sparkles)
- Mobile: 44px+ touch target

**Implementation:**
```tsx
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
// Direct Lucide imports
import Rocket from 'lucide-react/icons/rocket';
import FileText from 'lucide-react/icons/file-text';
// ... etc

const PHASE_ICONS = [
  { name: 'Rocket', Icon: Rocket, label: 'Rocket (Planning)' },
  { name: 'FileText', Icon: FileText, label: 'Document (Design)' },
  { name: 'ShoppingCart', Icon: ShoppingCart, label: 'Cart (Procurement)' },
  { name: 'FolderKanban', Icon: FolderKanban, label: 'Kanban (Execution)' },
  { name: 'CheckCircle2', Icon: CheckCircle2, label: 'Check (Completion)' },
  { name: 'Hammer', Icon: Hammer, label: 'Hammer (Construction)' },
  { name: 'Wrench', Icon: Wrench, label: 'Wrench (MEP)' },
  { name: 'PaintBucket', Icon: PaintBucket, label: 'Paint (Finishing)' },
  { name: 'HardHat', Icon: HardHat, label: 'Hard Hat (Site Work)' },
  { name: 'Truck', Icon: Truck, label: 'Truck (Delivery)' },
  { name: 'ClipboardCheck', Icon: ClipboardCheck, label: 'Clipboard (Inspection)' },
  { name: 'Key', Icon: Key, label: 'Key (Handover)' },
  { name: 'Building', Icon: Building, label: 'Building (Structure)' },
  { name: 'Layers', Icon: Layers, label: 'Layers (General)' },
  { name: 'Sparkles', Icon: Sparkles, label: 'Sparkles (Default)' },
] as const;

export function IconSelector({ name, defaultValue, required }: IconSelectorProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name} className="text-sm font-bold">
        Phase Icon {required && '*'}
      </Label>
      <Select name={name} defaultValue={defaultValue || 'Sparkles'}>
        <SelectTrigger className="border-2 border-gray-200 dark:border-gray-700">
          <SelectValue placeholder="Select icon" />
        </SelectTrigger>
        <SelectContent>
          {PHASE_ICONS.map(({ name, Icon, label }) => (
            <SelectItem key={name} value={name}>
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
```

### Update: PhaseTemplateManager.tsx

**Create Modal Changes:**
```tsx
// Add after description field
<IconSelector name="icon_name" />
```

**Edit Modal Changes:**
```tsx
// Add after description field
<IconSelector name="icon_name" defaultValue={editingPhase.icon_name} />
```

### Update: PhaseStation.tsx

**Current Logic:**
```typescript
const getPhaseIcon = (phaseName: string) => {
  const name = phaseName.toLowerCase();
  if (name.includes('initiation') || name.includes('planning')) return Rocket;
  // ... etc
  return Sparkles; // Default
};
```

**New Logic:**
```typescript
const getPhaseIcon = (phase: Phase) => {
  // 1. If phase has icon_name from template, use it
  if (phase.icon_name) {
    const iconComponent = LUCIDE_ICON_MAP[phase.icon_name];
    if (iconComponent) return iconComponent;
  }

  // 2. Fallback to name-based logic (existing)
  const name = phase.name.toLowerCase();
  if (name.includes('initiation') || name.includes('planning')) return Rocket;
  // ... etc
  return Sparkles;
};

// Add icon map at top of file
const LUCIDE_ICON_MAP: Record<string, LucideIcon> = {
  Rocket,
  FileText,
  ShoppingCart,
  FolderKanban,
  CheckCircle2,
  Hammer,
  Wrench,
  PaintBucket,
  HardHat,
  Truck,
  ClipboardCheck,
  Key,
  Building,
  Layers,
  Sparkles,
};
```

**Note:** Requires adding `icon_name` to Phase type (read from join or project_phases query)

---

## Type Updates

### Update: types/db/tables/projects.ts
**Add to PhaseTemplatesRow:**
```typescript
export type PhaseTemplatesRow = Database['public']['Tables']['phase_templates']['Row'];
// After migration, database.types.ts will include icon_name: string | null
```

### Update: types/database.types.ts
**Auto-generated after migration:**
```typescript
phase_templates: {
  Row: {
    // ... existing fields
    icon_name: string | null; // NEW
  }
}
```

---

## Data Flow: Icon from Template to PhaseStation

**Challenge:** `project_phases` doesn't store icon directly, only references `phase_template_id`

**Solution 1 (Recommended):** Add icon to project_phases query
```typescript
// In app/actions/phases.ts or wherever project phases are fetched
const { data: phases } = await supabase
  .from('project_phases')
  .select(`
    *,
    phase_templates!inner(icon_name)
  `)
  .eq('project_id', projectId);

// Type: ProjectPhasesRow & { phase_templates: { icon_name: string | null } }
```

**Solution 2:** Denormalize icon_name to project_phases
- Add `icon_name` column to `project_phases`
- Copy from template during phase creation
- Allows icon editing per-project (more flexible but more complex)

**Recommendation:** Use Solution 1 (JOIN) for consistency with template architecture.

---

## Error Handling

| Scenario | Response | User Message |
|----------|----------|--------------|
| Invalid icon_name | Ignore, use null | (Silent - validation optional) |
| Reference company not found | Log warning, skip seeding | "Template seeding skipped" (dev logs) |
| Trigger fails | Company still created | (Log error, don't block) |
| Icon not in LUCIDE_ICON_MAP | Use Sparkles fallback | (No error, graceful fallback) |

---

## Security Considerations
- RLS on `phase_templates` already enforces company isolation
- Trigger runs as SECURITY DEFINER (trusted function)
- Icon names validated to max 50 chars (no injection risk)
- No user-uploaded files (Lucide library only)

---

## Migration Order

1. **Migration 1:** `20260125000001_add_icon_to_phase_templates.sql`
   - Add `icon_name` column to `phase_templates`
   - Add comment on column

2. **Migration 2:** `20260125000002_seed_phase_task_templates_trigger.sql`
   - Create `seed_phase_task_templates_for_company()` function
   - Create trigger on `companies` INSERT
   - Update existing function comment

3. **Migration 3:** `20260125000003_backfill_phase_task_templates.sql`
   - Backfill existing companies without Cafe templates
   - Log results to console

---

**Status:** PENDING APPROVAL
**Approval Required:** [X] Yes / [ ] No (proceed to tasks)
