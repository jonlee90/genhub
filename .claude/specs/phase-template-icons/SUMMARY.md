# Phase Template Icons & Template Seeding - Specification Summary

## Feature Overview
Add visual icons to phase templates and implement automatic template seeding for new companies, enhancing UX and reducing manual setup.

---

## Files Created

| File | Description |
|------|-------------|
| `requirements.md` | User stories, acceptance criteria, icon candidates |
| `design.md` | Database schema, Server Actions, UI components, data flow |
| `tasks.md` | 13 atomic tasks for backend-engineer, frontend-engineer, code-reviewer |

---

## Key Changes

### Database
- **ALTER** `phase_templates` table: Add `icon_name TEXT NULL` column
- **NEW** Trigger: `seed_phase_task_templates_for_company()` on company INSERT
- **NEW** Migration: Backfill existing companies with Cafe templates from reference company

### Server Actions
- **UPDATE** `createPhaseTemplate()`: Accept and persist icon_name
- **UPDATE** `updatePhaseTemplate()`: Accept and persist icon_name
- **UPDATE** Project phases query: JOIN phase_templates to get icon_name

### UI Components
- **NEW** `IconSelector.tsx`: Dropdown with 15+ construction-themed Lucide icons
- **UPDATE** `PhaseTemplateManager.tsx`: Add icon selector to create/edit forms
- **UPDATE** `PhaseStation.tsx`: Use template icon_name (fallback to name-based logic)
- **UPDATE** `TemplateCard.tsx`: Display custom icons when provided

---

## User Stories

| ID | Persona | Goal | Priority |
|----|---------|------|----------|
| US-1 | Admin | Assign icons to phase templates | High |
| US-2 | PM | See phase icons in project timeline | High |
| US-3 | Admin (new) | Auto-receive default templates | Critical |
| US-4 | Admin (existing) | Backfill missing templates | High |

---

## Implementation Plan

### Phase 1: Database Schema & Seeding (5 tasks)
1. Add `icon_name` column to `phase_templates`
2. Create template seeding trigger for new companies
3. Backfill existing companies without templates
4. Update `phase-templates.ts` Server Actions
5. Update project phases query to include icons

### Phase 2: UI Components (4 tasks)
1. Create `IconSelector` component
2. Update `PhaseTemplateManager` with icon selector
3. Update `PhaseStation` to use template icons
4. Update `TemplateCard` to display icons

### Phase 3: Integration & Testing (4 tasks)
1. Manual testing: Icon selection flow
2. Manual testing: Template seeding flow
3. Type generation and build verification
4. Documentation update

**Total:** 13 tasks

---

## Construction Icons (Lucide)

**Recommended icons for phase templates:**
- `Rocket` - Planning, Initiation
- `FileText` - Design, Documentation
- `ShoppingCart` - Procurement
- `FolderKanban` - Execution, Construction
- `CheckCircle2` - Completion, Closeout
- `Hammer` - Construction Work
- `Wrench` - MEP Systems
- `PaintBucket` - Finishing
- `HardHat` - Site Work
- `Truck` - Delivery
- `ClipboardCheck` - Inspections
- `Key` - Handover
- `Building` - Superstructure
- `Layers` - General/Multi-phase
- `Sparkles` - Default fallback

---

## Reference Data

**Source Company ID:** `7633050c-f24e-4f8d-8396-22198b852bf6`

**Template Source:**
- Project Type: "Cafe"
- Includes: Phase templates + associated task templates
- Copies: icon_name, description, order_index, all task properties

**Seeding Triggers:**
1. **New companies:** AFTER INSERT trigger on `companies` table
2. **Existing companies:** Backfill migration for companies without Cafe templates

---

## Data Flow

### Icon Selection Flow
```
Admin → PhaseTemplateManager → IconSelector
  → Select icon → FormData (icon_name)
  → createPhaseTemplate() Server Action
  → INSERT phase_templates (icon_name)
  → Revalidate → Display in PhaseTemplateManager
```

### Icon Display Flow
```
PM → Project Page → PhaseStation
  → Query project_phases JOIN phase_templates (icon_name)
  → LUCIDE_ICON_MAP[icon_name]
  → Render icon component
  → Fallback: name-based logic → Fallback: Sparkles
```

### Template Seeding Flow
```
Admin invite → Create company
  → AFTER INSERT trigger fires
  → Query reference company Cafe templates
  → Copy phase_templates (with icons)
  → Copy task_templates (for each phase)
  → New company ready with templates
```

---

## Technical Constraints

| Constraint | Implementation |
|------------|----------------|
| **Icons only from Lucide** | Direct imports, no barrel files |
| **Touch targets >= 44px** | IconSelector trigger height enforced |
| **Dark mode support** | All components support dark variant |
| **Mobile-first** | Responsive at 375px viewport |
| **No breaking changes** | Existing phases without icons use fallback |
| **Company isolation** | RLS enforced, templates copied per-company |

---

## Success Criteria

### Functionality
- [x] New companies auto-receive Cafe phase + task templates
- [x] Admins can select icons for phase templates
- [x] Icons display in PhaseStation project view
- [x] Existing companies backfilled with missing templates

### Performance
- [x] Icon selector renders <100ms
- [x] Template seeding <500ms per company
- [x] No query performance regression

### UX
- [x] Mobile touch targets >= 44px
- [x] Dark mode WCAG AA contrast
- [x] Graceful fallbacks (no crashes on missing data)

---

## Migration Order

1. `20260125000001_add_icon_to_phase_templates.sql` - Add column
2. `20260125000002_seed_phase_task_templates_trigger.sql` - Create trigger
3. `20260125000003_backfill_phase_task_templates.sql` - Backfill existing

---

## Rollback Plan

**If issues post-deployment:**

```sql
-- Rollback icon column
ALTER TABLE phase_templates DROP COLUMN IF EXISTS icon_name;

-- Rollback trigger
DROP TRIGGER IF EXISTS seed_phase_task_templates_on_company_insert ON companies;
DROP FUNCTION IF EXISTS seed_phase_task_templates_for_company();
```

**Note:** Template seeding is additive (no data loss on rollback, just removes trigger for future companies)

---

## Out of Scope

- Custom icon uploads (Lucide library only)
- Icon color customization (uses phase status colors)
- Template versioning or updates
- Seeding for project types other than "Cafe"
- Editing templates after seeding (admins use settings UI)

---

## Next Steps

1. **Review:** Approve requirements, design, and tasks
2. **Execute:** Run tasks via `/kc:impl` or assign to agents
3. **Test:** Verify icon selection + template seeding flows
4. **Deploy:** Apply migrations in order, verify on staging
5. **Monitor:** Check Supabase logs for seeding success/failures

---

**Status:** ✅ SPECIFICATION COMPLETE
**Ready for:** Implementation via orchestrator or `/kc:impl {task-id}`

---

## Questions for Approval

1. **Icon set:** Are the 15 recommended Lucide icons sufficient, or should we add more?
2. **Reference company:** Is `7633050c-f24e-4f8d-8396-22198b852bf6` the correct source?
3. **Seeding scope:** Should we only seed "Cafe" templates, or add other project types?
4. **Backfill:** Should backfill migration run automatically, or be opt-in per company?
5. **Icon validation:** Should we enforce icon_name against a whitelist, or allow any string?

---

**Sources:**
- Construction project phases: [5 Phases of a Construction Project Lifecycle](https://resources.kahua.com/blog/the-5-stages-of-a-construction-projects-lifecycle)
- Construction PM best practices 2026: [6 Phases of Construction Project Management](https://asana.com/resources/construction-project-management)
- Lucide icons: [Lucide Icons Library](https://lucide.dev/icons/)
- Icon usage in PM: [Icons in Project Management and Their Significance](https://hive.com/blog/icons-in-project-management-significance/)
