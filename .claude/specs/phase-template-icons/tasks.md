# Phase Template Icons & Template Seeding - Implementation Tasks

## References
- Requirements: `.claude/specs/phase-template-icons/requirements.md`
- Design: `.claude/specs/phase-template-icons/design.md`

---

## Phase 1: Database Schema & Seeding

### Task 1.1: Add icon_name column to phase_templates
- **Agent:** backend-engineer
- **Skill:** `postgres-best-practices:postgres-best-practices`
- **Output:** `supabase/migrations/20260125000001_add_icon_to_phase_templates.sql`
- **Requirements:**
  - Add `icon_name TEXT NULL` column to `phase_templates` table
  - Add column comment: 'Lucide icon component name for visual identification'
  - No default value (allows graceful fallback)
  - Max length: 50 characters (enforced via CHECK constraint optional)
- **Acceptance:**
  - [ ] Migration applies without error
  - [ ] Existing phase templates not affected (NULL values)
  - [ ] Column visible in Supabase dashboard
  - [ ] Types regenerated via `npm run db:types`

### Task 1.2: Create seed_phase_task_templates trigger
- **Agent:** backend-engineer
- **Skill:** `postgres-best-practices:postgres-best-practices`
- **Output:** `supabase/migrations/20260125000002_seed_phase_task_templates_trigger.sql`
- **Dependencies:** Task 1.1 (icon_name column must exist)
- **Requirements:**
  - Create `seed_phase_task_templates_for_company()` function
  - Query reference company ID: `7633050c-f24e-4f8d-8396-22198b852bf6`
  - Copy phase templates (including icon_name) for "Cafe" project type
  - Copy task templates for each phase (preserve all fields)
  - Create AFTER INSERT trigger on `companies` table
  - Use SECURITY DEFINER with search_path = public
  - Log NOTICE on success, WARNING on reference data missing
- **Acceptance:**
  - [ ] Function compiles without error
  - [ ] Trigger created successfully
  - [ ] Test: Create new company via SQL, verify templates copied
  - [ ] Log messages appear in Supabase logs

### Task 1.3: Backfill phase and task templates
- **Agent:** backend-engineer
- **Skill:** `postgres-best-practices:postgres-best-practices`
- **Output:** `supabase/migrations/20260125000003_backfill_phase_task_templates.sql`
- **Dependencies:** Tasks 1.1, 1.2
- **Requirements:**
  - Identify companies with "Cafe" project type but no phase templates
  - Copy phase templates from reference company (with icons)
  - Copy task templates for each phase
  - Use DO $$ block (no persistent function)
  - Log NOTICE with counts: companies updated, phases created, tasks created
  - Handle missing reference data gracefully
- **Acceptance:**
  - [ ] Migration applies successfully
  - [ ] Existing companies receive templates
  - [ ] No duplicate templates created
  - [ ] Logs show accurate counts

---

## Phase 2: Server Action Updates

### Task 2.1: Update phase-templates Server Actions
- **Agent:** backend-engineer
- **Skill:** `postgres-best-practices:postgres-best-practices`
- **Output:** `app/actions/phase-templates.ts`
- **Dependencies:** Task 1.1 (database schema)
- **Requirements:**
  - Add `icon_name` to `createPhaseTemplateSchema` (optional, max 50)
  - Add `icon_name` to `updatePhaseTemplateSchema` (optional, max 50)
  - Extract `icon_name` from FormData in both actions
  - Include `icon_name` in INSERT/UPDATE operations
  - `getPhaseTemplates()` already returns icon_name via SELECT *
- **Acceptance:**
  - [ ] Actions compile without TypeScript errors
  - [ ] icon_name validation works (Zod schema)
  - [ ] Create/update persist icon_name to database
  - [ ] Null/empty icon_name handled gracefully

### Task 2.2: Update project phases query to include icon
- **Agent:** backend-engineer
- **Skill:** `postgres-best-practices:postgres-best-practices`
- **Output:** `app/actions/phases.ts` (or relevant file fetching project phases)
- **Dependencies:** Task 1.1
- **Requirements:**
  - Modify project phases query to JOIN phase_templates
  - Select icon_name from phase_templates
  - Handle NULL phase_template_id (manual phases)
  - Return icon_name in phase data
- **Acceptance:**
  - [ ] Query returns icon_name for phases with templates
  - [ ] NULL template_id handled without error
  - [ ] No performance regression (use existing indexes)
  - [ ] Type includes `phase_templates?: { icon_name: string | null }`

---

## Phase 3: UI Components

### Task 3.1: Create IconSelector component
- **Agent:** frontend-engineer
- **Skill:** `vercel-react-best-practices`
- **Output:** `components/settings/IconSelector.tsx`
- **Dependencies:** None (standalone component)
- **Requirements:**
  - Props: name, defaultValue, required
  - Select dropdown with 15-16 construction icons
  - Each option shows icon preview + label
  - Direct Lucide imports (no barrel file)
  - Default value: "Sparkles"
  - Mobile: 44px min height on trigger
  - Dark mode support
- **Acceptance:**
  - [ ] Component renders without errors
  - [ ] Icons display correctly in dropdown
  - [ ] defaultValue pre-selects correct icon
  - [ ] Mobile touch target >= 44px
  - [ ] Dark mode colors correct

### Task 3.2: Update PhaseTemplateManager with icon selector
- **Agent:** frontend-engineer
- **Skill:** `vercel-react-best-practices`
- **Output:** `components/settings/PhaseTemplateManager.tsx`
- **Dependencies:** Task 3.1, Task 2.1
- **Requirements:**
  - Import IconSelector component
  - Add IconSelector to create modal form (after description)
  - Add IconSelector to edit modal form (with defaultValue)
  - Pass icon_name in FormData to Server Actions
  - Display icon in SortablePhaseItem (via TemplateCard)
- **Acceptance:**
  - [ ] Create modal shows icon selector
  - [ ] Edit modal shows current icon selected
  - [ ] Icon persists after save (verify in settings)
  - [ ] No console errors
  - [ ] Mobile layout correct

### Task 3.3: Update PhaseStation to use template icons
- **Agent:** frontend-engineer
- **Skill:** `vercel-react-best-practices`
- **Output:** `components/projects/PhaseStation.tsx`
- **Dependencies:** Task 2.2 (icon data available)
- **Requirements:**
  - Add LUCIDE_ICON_MAP constant (icon name → component)
  - Modify getPhaseIcon() to check phase.icon_name first
  - Fallback to existing name-based logic if no icon_name
  - Fallback to Sparkles if icon_name not in map
  - Handle phase without template gracefully
  - Direct Lucide imports (avoid barrel file)
- **Acceptance:**
  - [ ] Phases with template icons display correctly
  - [ ] Phases without icons use fallback logic
  - [ ] Invalid icon names handled (no crash)
  - [ ] No barrel file imports
  - [ ] Mobile display correct

### Task 3.4: Update TemplateCard to display phase icons
- **Agent:** frontend-engineer
- **Skill:** `vercel-react-best-practices`
- **Output:** `components/ui/TemplateCard.tsx`
- **Dependencies:** Task 3.1, Task 3.2
- **Requirements:**
  - Accept icon_name via props (optional)
  - Render icon from LUCIDE_ICON_MAP if provided
  - Fallback to existing icon prop
  - No breaking changes to existing usage
- **Acceptance:**
  - [ ] TemplateCard displays custom icon when provided
  - [ ] Existing usages not broken
  - [ ] Icon renders with correct styling
  - [ ] Dark mode support

---

## Phase 4: Integration & Testing

### Task 4.1: Manual testing - Icon selection flow
- **Agent:** code-reviewer
- **Output:** Test report
- **Dependencies:** All Phase 2 & 3 tasks
- **Requirements:**
  - Test: Create new phase template with icon
  - Test: Edit existing phase template icon
  - Test: Save with no icon selected (defaults to Sparkles)
  - Test: Icon appears in PhaseTemplateManager list
  - Test: Icon appears in PhaseStation on project page
  - Mobile: Test icon selector on 375px viewport
  - Dark mode: Verify icon visibility
- **Acceptance:**
  - [ ] All icon selection flows work
  - [ ] Icons persist across page refreshes
  - [ ] Mobile touch targets >= 44px
  - [ ] Dark mode contrast passes WCAG AA
  - [ ] No console errors

### Task 4.2: Manual testing - Template seeding flow
- **Agent:** code-reviewer
- **Output:** Test report
- **Dependencies:** Tasks 1.2, 1.3
- **Requirements:**
  - Test: Create new company via admin invite
  - Verify: Company receives Cafe phase templates
  - Verify: Phase templates include icons
  - Verify: Task templates copied for each phase
  - Test: Backfill migration on existing company
  - Check: No duplicate templates created
  - Check: Logs show correct counts
- **Acceptance:**
  - [ ] New companies auto-receive templates
  - [ ] Templates include all fields (icons, descriptions, order)
  - [ ] Task templates linked correctly
  - [ ] Backfill migration idempotent (can run multiple times safely)
  - [ ] Reference company ID correct

### Task 4.3: Type generation and build verification
- **Agent:** backend-engineer
- **Output:** Type files + build verification
- **Dependencies:** Task 1.1 (database schema)
- **Requirements:**
  - Run `npm run db:types` to regenerate database types
  - Verify `icon_name: string | null` in PhaseTemplatesRow
  - Run `npm run build` to verify no TypeScript errors
  - Check for any type mismatches in components
- **Acceptance:**
  - [ ] Types regenerated successfully
  - [ ] icon_name field present in types
  - [ ] Build passes without errors
  - [ ] No TypeScript warnings

### Task 4.4: Documentation update
- **Agent:** frontend-engineer OR backend-engineer
- **Output:** Updated index files
- **Dependencies:** All previous tasks
- **Requirements:**
  - Update relevant documentation if exists
  - Document new IconSelector component
  - Document template seeding trigger
  - Update migration notes if needed
- **Acceptance:**
  - [ ] IconSelector documented (if component docs exist)
  - [ ] Template seeding behavior documented
  - [ ] Migration notes updated

---

## Execution Order

```
Sequential Dependencies:
1.1 → 1.2 → 1.3 (Database foundation)
1.1 → 2.1 (Server Actions need schema)
1.1 → 2.2 (Phases query needs schema)
2.1 → 3.1 → 3.2 (UI needs Server Actions)
2.2 → 3.3 (PhaseStation needs icon data)
3.1 → 3.4 (TemplateCard needs IconSelector pattern)

Parallelizable:
- Tasks 1.2 and 1.3 can run after 1.1 completes
- Tasks 3.1 and 3.3 can run in parallel (different components)
- Task 4.3 and 4.4 can run in parallel

Critical Path:
1.1 → 2.1 → 3.1 → 3.2 → 4.1
```

---

## Estimated Effort
- **Backend (Phase 1-2):** 5 tasks
- **Frontend (Phase 3):** 4 tasks
- **Testing & Docs (Phase 4):** 4 tasks
- **Total:** 13 tasks

---

## Rollback Plan

If issues discovered post-deployment:

1. **Icon display broken:** PhaseStation fallback logic handles missing icons gracefully
2. **Template seeding fails:** New companies still get project_type_configs (existing trigger)
3. **Migration rollback:**
   ```sql
   -- Rollback icon column
   ALTER TABLE phase_templates DROP COLUMN IF EXISTS icon_name;

   -- Rollback trigger
   DROP TRIGGER IF EXISTS seed_phase_task_templates_on_company_insert ON companies;
   DROP FUNCTION IF EXISTS seed_phase_task_templates_for_company();
   ```

---

## Success Metrics

- **Functionality:**
  - [ ] 100% of new companies receive Cafe templates on creation
  - [ ] Icons selectable and persistent in settings
  - [ ] Icons display in PhaseStation without errors

- **Performance:**
  - [ ] Icon selector renders <100ms
  - [ ] Template seeding completes <500ms per company
  - [ ] No query performance regression

- **UX:**
  - [ ] Mobile touch targets meet 44px minimum
  - [ ] Dark mode contrast passes WCAG AA
  - [ ] No console errors in production

---

**Status:** READY FOR IMPLEMENTATION
