# Materials Page Enhancement - Implementation Plan Summary

**Feature:** Materials Page Enhancement
**Tasks:** 0050-0055 (6 tasks total)
**Status:** 🔵 READY FOR IMPLEMENTATION
**Created:** 2026-01-04
**Author:** kiro-plan

---

## Quick Start

### For Implementing Agents

**Step 1:** Read design document first
```
File: docs/specs/materials-page-enhancement/design.md
Status: APPROVED
```

**Step 2:** Read task breakdown
```
File: docs/specs/materials-page-enhancement/tasks.md
Purpose: High-level overview of all tasks
```

**Step 3:** Start with Task 0050
```
File: .claude/tasks/task_0050_materials_enhancement_database_schema.md
Agent: agent-backend-engineer
Action: Create database schema (migrations, RLS, indexes)
```

**Step 4:** Follow sequence: 0050 → 0051 → 0052 → 0053 → 0054 → 0055

---

## Task Files Created

All task files are located in `.claude/tasks/`:

| Task | File | Agent | Focus | Effort |
|------|------|-------|-------|--------|
| 0050 | `task_0050_materials_enhancement_database_schema.md` | backend-engineer | Database schema | 2-3h |
| 0051 | `task_0051_materials_enhancement_server_actions.md` | backend-engineer | Server actions | 3-4h |
| 0052 | `task_0052_materials_enhancement_scheduled_jobs.md` | backend-engineer | Cron jobs | 2-3h |
| 0053 | `task_0053_materials_enhancement_ui_components.md` | frontend-engineer | UI components | 4-6h |
| 0054 | `task_0054_materials_enhancement_page_integration.md` | frontend-engineer | Page integration | 2-3h |
| 0055 | `task_0055_materials_enhancement_testing.md` | code-reviewer | Testing & polish | 3-4h |

**Total Estimated Effort:** 16-23 hours (3-5 calendar days)

---

## What Each Task Delivers

### Task 0050: Database Schema
**Deliverables:**
- `tracked_materials` table (user watchlist, max 10 per user)
- `material_price_history` table (90-day retention)
- Indexes on `materials` and `material_assignments` for performance
- RLS policies for company isolation
- Trigger for max 10 tracking limit
- TypeScript types regenerated

**Acceptance:**
- Tables created successfully
- RLS policies enforce company isolation
- Max 10 limit enforced by trigger
- Types updated in `types/database.types.ts`

---

### Task 0051: Server Actions
**Deliverables:**
- `getTaskLinkedMaterials(page, limit)` - Paginated materials with stats
- `getTrackedMaterials()` - Carousel data with price changes
- `toggleTracking(material_id, track)` - Add/remove from watchlist
- `getMaterialSummaryStats()` - 4 metrics aggregation
- `updateMaterialLeadTime(material_id, days)` - Manual lead time entry

**Acceptance:**
- All actions return typed responses
- Input validation with Zod
- RLS enforcement tested
- Error handling comprehensive
- Pagination works correctly

---

### Task 0052: Scheduled Jobs
**Deliverables:**
- `/api/cron/update-material-prices` - Daily 2 AM UTC price sync
- `/api/cron/cleanup-price-history` - Daily 3 AM UTC cleanup (90-day retention)
- Home Depot API integration helper
- `vercel.json` cron configuration
- Cron secret authentication

**Acceptance:**
- Price update job fetches from Home Depot API
- Cleanup job deletes old records
- Both jobs protected with secret
- Vercel cron jobs scheduled correctly
- Manual trigger tested locally

---

### Task 0053: UI Components
**Deliverables:**
- `MaterialSummary` - 4 metric cards (Total Materials, Total Cost, Price Increases, Avg Lead Time)
- `TrackedMaterialsCarousel` - Horizontal scroll, max 10 materials, price indicators
- `PriceChangeIndicator` - Red ↑, green ↓, gray — component
- `MaterialCard` - Reusable card with track/untrack button
- `MaterialsList` - Paginated grid (12 per page)
- `MaterialsListSkeleton` - Loading state

**Acceptance:**
- All components follow GenHub design system
- ProjectTaskSummary pattern used for summary
- Optimistic UI updates for track/untrack
- Responsive on mobile, tablet, desktop
- Empty states implemented
- Lucide icons only

---

### Task 0054: Page Integration
**Deliverables:**
- Updated `/app/app/materials/page.tsx`
- Server-side data fetching
- Error boundaries
- Loading states
- Mobile responsiveness
- Integration with existing features (search, add material)

**Acceptance:**
- All components integrated into page
- Server actions called on page load
- Existing features preserved
- Error boundaries catch errors
- Page follows standard GenHub layout
- Responsive on all screen sizes

---

### Task 0055: Testing & Polish
**Deliverables:**
- Pagination edge case testing (0, 11, 12, 13, 24 materials)
- Tracking limit testing (max 10, concurrent, duplicate)
- Price change calculation verification
- RLS policy enforcement testing
- Scheduled job testing (manual trigger)
- Performance testing (< 2s page load)
- Accessibility audit (WCAG AA)
- Production deployment verification

**Acceptance:**
- All tests passed
- Performance targets met
- Accessibility standards met
- Build successful
- Deployed to production
- No critical bugs

---

## Implementation Workflow

### Standard Kiro Workflow

```
1. kiro-plan (THIS STEP) → Creates task files
2. /kc:impl task_0050 → Executes Task 0050 (agent-backend-engineer)
3. /kc:impl task_0051 → Executes Task 0051 (agent-backend-engineer)
4. /kc:impl task_0052 → Executes Task 0052 (agent-backend-engineer)
5. /kc:impl task_0053 → Executes Task 0053 (agent-frontend-engineer)
6. /kc:impl task_0054 → Executes Task 0054 (agent-frontend-engineer)
7. /kc:impl task_0055 → Executes Task 0055 (agent-code-reviewer)
8. Feature COMPLETE → Update design doc status
```

### Alternative: Manual Implementation

Each task file contains complete instructions for manual implementation:
- Prerequisites checklist
- Detailed subtasks
- Code examples
- Testing instructions
- Acceptance criteria

Agents can read task files directly and implement without `/kc:impl` command.

---

## Key Technical Decisions

### 1. Pagination: Offset-Based (Not Cursor-Based)
**Rationale:**
- Materials list is small (< 1000 per company)
- Users expect page numbers
- Easier to cache

### 2. Price History: 90-Day Retention
**Rationale:**
- Captures seasonal price changes
- Balances storage cost vs. data usefulness
- Aligns with typical procurement planning horizon

### 3. Tracking Limit: Max 10 Materials
**Rationale:**
- Forces prioritization of high-value materials
- Carousel remains usable
- Reduces API load for price updates

### 4. Price Sync: Daily at 2 AM UTC
**Rationale:**
- Home Depot prices update daily
- Low traffic time
- Reduces API costs

### 5. No "Materials Needing Reorder" Metric
**Rationale:**
- GenHub is procurement-focused, not inventory-focused
- No low stock threshold defined in requirements
- Space used for "Tracked Materials" count instead

---

## Database Schema Summary

### New Tables

**tracked_materials:**
```sql
id uuid PK
company_id uuid FK companies
user_id uuid NOT NULL
material_id uuid FK materials (CASCADE)
tracked_at timestamptz
created_at, updated_at

UNIQUE(user_id, material_id)
Trigger: Max 10 per user
RLS: Company-scoped
```

**material_price_history:**
```sql
id uuid PK
company_id uuid FK companies
material_id uuid FK materials (CASCADE)
price numeric(10,2)
recorded_at timestamptz
source text ('home_depot_api', 'baseline')
created_at

Retention: 90 days (cleanup job)
RLS: Company-scoped (read-only), service role insert
```

### Indexes Added

**materials:**
- `idx_materials_home_depot_product_id` (for API sync lookup)
- `idx_materials_company_active` (for company-wide queries)

**material_assignments:**
- `idx_material_assignments_material_id` (for aggregation)
- `idx_material_assignments_task_material` (for task lookups)

---

## Server Actions Summary

| Action | Input | Output | Purpose |
|--------|-------|--------|---------|
| `getTaskLinkedMaterials` | `page, limit` | `{ materials, total }` | Paginated list with stats |
| `getTrackedMaterials` | none | `TrackedMaterial[]` | Carousel data with price changes |
| `toggleTracking` | `material_id, track` | `{ success, error? }` | Add/remove from watchlist |
| `getMaterialSummaryStats` | none | `MaterialSummaryStats` | 4 metrics aggregation |
| `updateMaterialLeadTime` | `material_id, days` | `{ success, error? }` | Manual lead time entry |

---

## UI Components Summary

| Component | Type | Props | Purpose |
|-----------|------|-------|---------|
| `MaterialSummary` | Server | `{ stats, trackedCount }` | 4 metric cards |
| `TrackedMaterialsCarousel` | Client | `{ trackedMaterials }` | Horizontal scroll carousel |
| `PriceChangeIndicator` | Client | `{ percent }` | Red ↑, green ↓, gray — |
| `MaterialCard` | Client | `{ material }` | Reusable card for list |
| `MaterialsList` | Client | `{ materials, total, page }` | Paginated grid |
| `MaterialsListSkeleton` | Client | none | Loading state |

---

## Testing Checklist

### Critical Tests

- [ ] **Pagination:** 0, 11, 12, 13, 24 materials (edge cases)
- [ ] **Tracking Limit:** Track 10, try 11th (expect error)
- [ ] **Price Calculation:** +25%, -20%, no change (verify accurate)
- [ ] **RLS:** User A can't track Company B's materials
- [ ] **Cron Jobs:** Manual trigger, verify database updates
- [ ] **Performance:** Page load < 2s, queries < 200ms
- [ ] **Accessibility:** WCAG AA, keyboard navigation
- [ ] **Responsive:** Mobile (375px), Tablet (768px), Desktop (1280px)

### Pre-Deployment

- [ ] Build successful (`npm run build`)
- [ ] No TypeScript errors
- [ ] No console warnings
- [ ] All task acceptance criteria met
- [ ] Design document requirements satisfied

---

## Success Criteria

**Feature is complete when:**

1. ✅ All 6 tasks marked COMPLETE
2. ✅ All acceptance criteria met
3. ✅ All tests passed (Task 0055)
4. ✅ Production deployment verified
5. ✅ Stakeholder demo completed
6. ✅ Design doc status updated to IMPLEMENTED

**Metrics to verify:**

- Users can track up to 10 materials
- Price changes show correctly (red ↑, green ↓, gray —)
- Pagination works for 12+ materials
- Summary stats are accurate
- Scheduled jobs run daily
- Page load < 2s
- Mobile responsive
- WCAG AA accessible

---

## Known Limitations

**Documented in design:**

1. **No email alerts for price changes** (out of scope)
2. **No advanced analytics charts** (bar/line graphs out of scope)
3. **No multi-currency support** (out of scope)
4. **No low stock tracking** (GenHub is procurement-focused, not inventory)
5. **Price sync limited by Home Depot API rate limits** (mitigated with caching)

**Future enhancements:**

- Email notifications for price increases > 20%
- Price trend charts (line graph over 90 days)
- Material comparison across projects
- Export materials list to CSV
- Bulk track/untrack actions

---

## Rollback Plan

**If critical issues found post-deployment:**

### Database Rollback
```sql
DROP TABLE IF EXISTS material_price_history CASCADE;
DROP TABLE IF EXISTS tracked_materials CASCADE;
DROP INDEX IF EXISTS idx_materials_home_depot_product_id;
DROP INDEX IF EXISTS idx_materials_company_active;
DROP INDEX IF EXISTS idx_material_assignments_material_id;
DROP INDEX IF EXISTS idx_material_assignments_task_material;
```

### Code Rollback
```bash
# Revert to previous version
git revert <commit-hash>

# Redeploy
vercel --prod
```

### Vercel Cron Rollback
- Remove cron jobs from Vercel dashboard
- Delete `/api/cron/*` routes

---

## Questions & Support

**Design Questions:**
→ Contact kiro-design (update design document if needed)

**Implementation Blockers:**
→ Check task file "Implementation Notes" section
→ Review design document for clarification
→ Check law docs (DB_SCHEMA, UI_RULES, SYSTEM)

**Bug Reports:**
→ Document in GitHub Issues or task tracker
→ Prioritize by severity (critical, high, medium, low)

---

## Documentation References

### Primary Documents
- **Design:** `docs/specs/materials-page-enhancement/design.md` (1732 lines)
- **Requirements:** `docs/specs/materials-page-enhancement/requirements.md`
- **Tasks Overview:** `docs/specs/materials-page-enhancement/tasks.md`

### Law Documents
- **DB Schema:** `.claude/docs/law/DB_SCHEMA.md`
- **UI Rules:** `.claude/docs/law/UI_RULES.md`
- **System Architecture:** `.claude/docs/law/SYSTEM.md`

### Task Files
- `.claude/tasks/task_0050_materials_enhancement_database_schema.md`
- `.claude/tasks/task_0051_materials_enhancement_server_actions.md`
- `.claude/tasks/task_0052_materials_enhancement_scheduled_jobs.md`
- `.claude/tasks/task_0053_materials_enhancement_ui_components.md`
- `.claude/tasks/task_0054_materials_enhancement_page_integration.md`
- `.claude/tasks/task_0055_materials_enhancement_testing.md`

### External References
- Vercel Cron Jobs: https://vercel.com/docs/cron-jobs
- SerpAPI Home Depot: https://serpapi.com/home-depot-search-api
- WCAG 2.1 Guidelines: https://www.w3.org/WAI/WCAG21/quickref/

---

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-04 | Created task files 0050-0055 | kiro-plan |
| 2026-01-04 | Created tasks overview document | kiro-plan |
| 2026-01-04 | Created this README | kiro-plan |

---

## Next Steps

**For implementing agents:**

1. Read design document
2. Read task_0050 file
3. Execute `/kc:impl task_0050` OR implement manually
4. Mark task complete after testing
5. Proceed to task_0051
6. Repeat until all tasks complete

**For stakeholders:**

1. Review task breakdown in `tasks.md`
2. Approve estimated timeline (3-5 days)
3. Schedule demo after Task 0055 completion
4. Provide feedback during implementation (if needed)

---

**Implementation is ready to begin!**

Start with: `.claude/tasks/task_0050_materials_enhancement_database_schema.md`

---

## 🧾 Agent Audit Report

**Agent:** kiro-plan
**Task Type:** Planning
**Task Complexity:** Complex (6 tasks, full feature implementation plan)

### Actions Taken
- Planned before implementation: N/A (this IS the planning)
- Tools used:
  - Read (design document, DB schema, ProjectOverview pattern)
  - Write (6 task files, 1 overview doc, 1 README)
- Files read:
  - `docs/specs/materials-page-enhancement/design.md` (full design doc, 1732 lines)
  - `.claude/docs/law/DB_SCHEMA.md` (database schema reference)
  - `components/projects/ProjectOverview.tsx` (UI pattern reference)
  - `.claude/tasks/task_0020_status.md` (to determine next task number)
- Files created:
  - `.claude/tasks/task_0050_materials_enhancement_database_schema.md`
  - `.claude/tasks/task_0051_materials_enhancement_server_actions.md`
  - `.claude/tasks/task_0052_materials_enhancement_scheduled_jobs.md`
  - `.claude/tasks/task_0053_materials_enhancement_ui_components.md`
  - `.claude/tasks/task_0054_materials_enhancement_page_integration.md`
  - `.claude/tasks/task_0055_materials_enhancement_testing.md`
  - `docs/specs/materials-page-enhancement/tasks.md`
  - `.claude/tasks/task_0050_to_0055_materials_enhancement_README.md`

### Decisions & Reasoning
- **Task Breakdown:** Followed Kiro workflow structure (design → plan → implement → review)
- **Task Numbering:** Started at 0050 (last task was 0020)
- **Agent Assignment:**
  - Backend tasks (0050-0052): agent-backend-engineer
  - Frontend tasks (0053-0054): agent-frontend-engineer
  - Review task (0055): agent-code-reviewer
- **Task Sequencing:** Enforced dependencies (database → server actions → UI → integration → testing)
- **Level of Detail:** Each task file includes:
  - Prerequisites checklist
  - Detailed subtasks (actionable checkboxes)
  - Code examples (from design doc)
  - Testing instructions
  - Acceptance criteria
  - Implementation notes
- **Reference Pattern:** Used ProjectTaskSummary component as pattern for MaterialSummary (5-card grid)

### Issues Encountered
- None (design document was comprehensive and approved)

### Token & Efficiency Notes
- Estimated token usage: ~78k tokens
- Read full design document (1732 lines) → necessary for complete planning
- Read DB_SCHEMA.md → necessary for database task planning
- Read ProjectOverview.tsx → necessary for UI pattern reference
- Could have reduced: No unnecessary reads, all context was relevant

### Improvement Suggestions
- **For kiro-plan prompts:** Current structure is effective, no changes needed
- **For design documents:** Design doc was excellent, no missing information
- **For task file format:** Current format is comprehensive and actionable

---

**Plan Complete. Ready for Implementation.**
