# Materials Enhancement - Task Index

**Quick Navigation for Implementation**

---

## Start Here

**New to this feature?** Read in this order:

1. 📄 **Design Document** (primary source)
   - File: `docs/specs/materials-page-enhancement/design.md`
   - Status: APPROVED
   - Purpose: Complete technical specification

2. 📋 **Task Overview** (high-level breakdown)
   - File: `docs/specs/materials-page-enhancement/tasks.md`
   - Purpose: Implementation plan summary

3. 📖 **README** (detailed guide)
   - File: `.claude/tasks/task_0050_to_0055_materials_enhancement_README.md`
   - Purpose: Comprehensive implementation guide

4. 🎯 **Task 0050** (start implementation)
   - File: `.claude/tasks/task_0050_materials_enhancement_database_schema.md`
   - Agent: agent-backend-engineer

---

## Task Files (Implementation Order)

### Phase 1: Backend Foundation

| # | File | Agent | Focus | Time |
|---|------|-------|-------|------|
| 0050 | `task_0050_materials_enhancement_database_schema.md` | backend | Database | 2-3h |
| 0051 | `task_0051_materials_enhancement_server_actions.md` | backend | Actions | 3-4h |
| 0052 | `task_0052_materials_enhancement_scheduled_jobs.md` | backend | Cron | 2-3h |

### Phase 2: Frontend Implementation

| # | File | Agent | Focus | Time |
|---|------|-------|-------|------|
| 0053 | `task_0053_materials_enhancement_ui_components.md` | frontend | Components | 4-6h |
| 0054 | `task_0054_materials_enhancement_page_integration.md` | frontend | Page | 2-3h |

### Phase 3: Quality Assurance

| # | File | Agent | Focus | Time |
|---|------|-------|-------|------|
| 0055 | `task_0055_materials_enhancement_testing.md` | reviewer | Testing | 3-4h |

**Total:** 16-23 hours (3-5 calendar days)

---

## Quick Commands

### For Backend Engineers

```bash
# Task 0050: Apply migrations
/kc:impl task_0050
# OR manually:
mcp supabase execute_sql --sql-file supabase/migrations/20260104000001_create_tracked_materials.sql
mcp supabase generate_typescript_types

# Task 0051: Test server actions
npm run dev
# Then test in browser

# Task 0052: Test cron jobs
curl -H "Authorization: Bearer $CRON_SECRET" \
     http://localhost:3000/api/cron/update-material-prices
```

### For Frontend Engineers

```bash
# Task 0053: Build components
npm run dev

# Task 0054: Test integration
npm run build
# Check for errors

# Test responsive
# Use browser DevTools: 375px, 768px, 1280px
```

### For Code Reviewers

```bash
# Task 0055: Full testing
npm run build
npx lighthouse http://localhost:3000/app/materials --view
vercel --prod
```

---

## File Map

### Documentation
```
docs/specs/materials-page-enhancement/
├── design.md (APPROVED)
├── requirements.md (APPROVED)
└── tasks.md (overview)
```

### Implementation Tasks
```
.claude/tasks/
├── task_0050_materials_enhancement_database_schema.md
├── task_0051_materials_enhancement_server_actions.md
├── task_0052_materials_enhancement_scheduled_jobs.md
├── task_0053_materials_enhancement_ui_components.md
├── task_0054_materials_enhancement_page_integration.md
├── task_0055_materials_enhancement_testing.md
├── task_0050_to_0055_materials_enhancement_README.md
└── INDEX_materials_enhancement.md (this file)
```

### Code Files (will be created during implementation)
```
Database:
  supabase/migrations/20260104000001_create_tracked_materials.sql
  supabase/migrations/20260104000002_create_material_price_history.sql
  supabase/migrations/20260104000003_add_material_indexes.sql

Server Actions:
  app/actions/materials.ts (5 new functions)

Scheduled Jobs:
  app/api/cron/update-material-prices/route.ts
  app/api/cron/cleanup-price-history/route.ts
  lib/services/home-depot-api.ts (if not exists)

UI Components:
  components/materials/MaterialSummary.tsx
  components/materials/TrackedMaterialsCarousel.tsx
  components/materials/PriceChangeIndicator.tsx
  components/materials/MaterialCard.tsx
  components/materials/MaterialsList.tsx
  components/materials/MaterialsListSkeleton.tsx

Page Integration:
  app/app/materials/page.tsx (updated)

Config:
  vercel.json (crons array)
  .env.local (CRON_SECRET, HOME_DEPOT_API_KEY)
```

---

## Dependencies Graph

```
Task 0050 (Database)
    ↓
    ├→ Task 0051 (Server Actions)
    │      ↓
    │      ├→ Task 0052 (Scheduled Jobs)
    │      │
    │      └→ Task 0053 (UI Components)
    │             ↓
    │             └→ Task 0054 (Page Integration)
    │                    ↓
    └────────────────────→ Task 0055 (Testing)
```

**Parallelization:**
- Task 0052 and Task 0053 can run in parallel (both depend on 0051)

---

## Checklist for Each Task

### Before Starting
- [ ] Read design document (or at least relevant section)
- [ ] Read task file completely
- [ ] Verify prerequisites completed
- [ ] Agent authority matches task type

### During Implementation
- [ ] Follow subtasks in order
- [ ] Check off each subtask as completed
- [ ] Test as you go (don't wait for end)
- [ ] Log any blockers or questions

### Before Marking Complete
- [ ] All subtasks checked off
- [ ] All acceptance criteria met
- [ ] Tests passed (per task file)
- [ ] No console errors
- [ ] Update task file status to COMPLETE
- [ ] Commit changes with descriptive message

---

## Success Metrics

**After all tasks complete:**

✅ **Database:**
- [ ] Tables created: `tracked_materials`, `material_price_history`
- [ ] Indexes created on `materials`, `material_assignments`
- [ ] RLS enforces company isolation
- [ ] Max 10 tracking limit enforced

✅ **Backend:**
- [ ] 5 server actions implemented and tested
- [ ] Cron jobs scheduled in Vercel
- [ ] Price sync working (manual trigger tested)
- [ ] Cleanup job working

✅ **Frontend:**
- [ ] 6 components built (Summary, Carousel, Indicator, Card, List, Skeleton)
- [ ] Page integrated with all components
- [ ] Responsive on mobile, tablet, desktop
- [ ] Optimistic UI for track/untrack

✅ **Quality:**
- [ ] All tests passed (pagination, limits, prices, RLS)
- [ ] Performance < 2s page load
- [ ] Accessibility WCAG AA
- [ ] Build successful
- [ ] Deployed to production

---

## Common Issues & Solutions

### Issue: TypeScript errors after migration
**Solution:** Regenerate types
```bash
mcp supabase generate_typescript_types
```

### Issue: RLS policy blocking legitimate access
**Solution:** Check helper function `get_user_company_id()`
```sql
SELECT get_user_company_id(next_auth.uid());
-- Should return current user's company_id
```

### Issue: Cron job not running
**Solution:** Check Vercel dashboard
- Verify cron jobs appear in Cron Jobs section
- Check recent runs for errors
- Verify `CRON_SECRET` env var set

### Issue: Pagination shows wrong total
**Solution:** Use `{ count: 'exact' }` in Supabase query
```typescript
const { data, count } = await supabase
  .from('materials')
  .select('*', { count: 'exact' })
  .range(offset, offset + limit - 1);
```

### Issue: Price change calculation wrong
**Solution:** Check 7-day lookback query
```sql
SELECT price FROM material_price_history
WHERE material_id = $1
AND recorded_at <= NOW() - INTERVAL '7 days'
ORDER BY recorded_at DESC
LIMIT 1;
```

---

## Getting Help

**Design Questions:**
- File: `docs/specs/materials-page-enhancement/design.md`
- Contact: kiro-design (for design updates)

**Implementation Questions:**
- Check task file "Implementation Notes" section
- Check design document for code examples
- Review law docs (DB_SCHEMA, UI_RULES)

**Bugs or Blockers:**
- Document in task file comments
- Create GitHub Issue (if applicable)
- Request code review from agent-code-reviewer

---

## Ready to Start?

**Step 1:** Read design document
```
File: docs/specs/materials-page-enhancement/design.md
```

**Step 2:** Start with Task 0050
```
File: .claude/tasks/task_0050_materials_enhancement_database_schema.md
Command: /kc:impl task_0050
```

**Good luck! 🚀**
