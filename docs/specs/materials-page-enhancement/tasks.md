# Materials Page Enhancement - Implementation Tasks

**Feature:** Materials Page Enhancement
**Location:** `/app/materials`
**Status:** 🔵 PLANNED (Ready for Implementation)
**Created:** 2026-01-04

---

## Overview

This document organizes the implementation tasks for the Materials Page Enhancement feature. The feature adds comprehensive price tracking, material analytics, and enhanced user experience to the Materials page.

**Key Features:**
- Task-linked materials list (paginated, 12 per page)
- Top 10 tracked materials carousel with price change indicators
- Material summary section (4 metrics cards)
- Daily price sync from Home Depot API
- 90-day price history retention
- User-specific material watchlist (max 10 per user)

---

## Task Breakdown

### Phase 1: Database Foundation
**Task 0050:** Database Schema
- **Agent:** agent-backend-engineer
- **Estimated Effort:** 2-3 hours
- **File:** `.claude/tasks/task_0050_materials_enhancement_database_schema.md`
- **Deliverables:**
  - Migration 001: `tracked_materials` table
  - Migration 002: `material_price_history` table
  - Migration 003: Indexes on existing tables
  - RLS policies for company isolation
  - Max 10 tracking limit trigger
  - TypeScript types regeneration

---

### Phase 2: Server Actions
**Task 0051:** Server Actions
- **Agent:** agent-backend-engineer
- **Estimated Effort:** 3-4 hours
- **File:** `.claude/tasks/task_0051_materials_enhancement_server_actions.md`
- **Deliverables:**
  - `getTaskLinkedMaterials()` - Paginated materials with aggregation
  - `getTrackedMaterials()` - Carousel data with price changes
  - `toggleTracking()` - Add/remove from watchlist
  - `getMaterialSummaryStats()` - 4 metrics aggregation
  - `updateMaterialLeadTime()` - Manual lead time entry
  - Input validation, error handling, RLS enforcement

---

### Phase 3: Scheduled Jobs
**Task 0052:** Scheduled Jobs (Vercel Cron)
- **Agent:** agent-backend-engineer
- **Estimated Effort:** 2-3 hours
- **File:** `.claude/tasks/task_0052_materials_enhancement_scheduled_jobs.md`
- **Deliverables:**
  - `/api/cron/update-material-prices` - Daily 2 AM UTC
  - `/api/cron/cleanup-price-history` - Daily 3 AM UTC
  - Home Depot API integration helper
  - `vercel.json` cron configuration
  - Environment variables setup

---

### Phase 4: UI Components
**Task 0053:** UI Components
- **Agent:** agent-frontend-engineer
- **Estimated Effort:** 4-6 hours
- **File:** `.claude/tasks/task_0053_materials_enhancement_ui_components.md`
- **Deliverables:**
  - `MaterialSummary` - 4 metric cards (ProjectTaskSummary pattern)
  - `TrackedMaterialsCarousel` - Horizontal scroll with price indicators
  - `PriceChangeIndicator` - Red ↑, green ↓, gray — component
  - `MaterialCard` - Reusable card for list/carousel
  - `MaterialsList` - Paginated grid (12 per page)
  - `MaterialsListSkeleton` - Loading state
  - Optimistic UI updates, empty states, responsive layout

---

### Phase 5: Page Integration
**Task 0054:** Page Integration
- **Agent:** agent-frontend-engineer
- **Estimated Effort:** 2-3 hours
- **File:** `.claude/tasks/task_0054_materials_enhancement_page_integration.md`
- **Deliverables:**
  - Update `/app/app/materials/page.tsx`
  - Server-side data fetching
  - Component composition
  - Error boundaries
  - Loading states
  - Mobile responsiveness
  - Integration with existing features

---

### Phase 6: Testing & Polish
**Task 0055:** Testing & Polish
- **Agent:** agent-code-reviewer
- **Estimated Effort:** 3-4 hours
- **File:** `.claude/tasks/task_0055_materials_enhancement_testing.md`
- **Deliverables:**
  - Pagination edge case testing (0, 11, 12, 13, 24 materials)
  - Tracking limit testing (max 10, duplicate, concurrent)
  - Price change calculation verification
  - RLS policy enforcement testing
  - Scheduled job testing (manual trigger)
  - Performance testing (< 2s page load)
  - Accessibility audit (WCAG AA)
  - Cross-browser testing
  - Production deployment verification

---

## Implementation Order

**CRITICAL:** Tasks must be completed in sequence due to dependencies.

```
Task 0050 (Database)
    ↓
Task 0051 (Server Actions) ← depends on 0050
    ↓
Task 0052 (Scheduled Jobs) ← depends on 0050, 0051
    ↓
Task 0053 (UI Components) ← depends on 0051
    ↓
Task 0054 (Page Integration) ← depends on 0051, 0053
    ↓
Task 0055 (Testing) ← depends on 0050, 0051, 0052, 0053, 0054
```

**Parallelization Opportunities:**
- Task 0052 (Scheduled Jobs) can run in parallel with Task 0053 (UI Components)
- Both depend on Task 0051 but not on each other

---

## Total Estimated Effort

| Phase | Estimated Hours |
|-------|-----------------|
| Phase 1: Database | 2-3 hours |
| Phase 2: Server Actions | 3-4 hours |
| Phase 3: Scheduled Jobs | 2-3 hours |
| Phase 4: UI Components | 4-6 hours |
| Phase 5: Page Integration | 2-3 hours |
| Phase 6: Testing & Polish | 3-4 hours |
| **Total** | **16-23 hours** |

**Estimated Calendar Time:** 3-5 days (accounting for reviews, breaks, blockers)

---

## Key Milestones

### Milestone 1: Backend Complete
- [ ] Task 0050 complete (database schema deployed)
- [ ] Task 0051 complete (server actions tested)
- [ ] Task 0052 complete (cron jobs scheduled)
- **Verification:** Cron job runs successfully, price history updates

### Milestone 2: Frontend Complete
- [ ] Task 0053 complete (all components built)
- [ ] Task 0054 complete (page integration done)
- **Verification:** Full tracking flow works end-to-end

### Milestone 3: Feature Complete
- [ ] Task 0055 complete (all tests passed)
- [ ] Production deployment verified
- [ ] Stakeholder demo completed
- **Verification:** Feature live in production, no critical bugs

---

## Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| **Home Depot API rate limiting** | Medium | Add caching (30 min), batch processing, retry logic |
| **Database performance (pagination)** | Low | Indexes added in Task 0050, tested in Task 0055 |
| **RLS policy complexity** | Low | Thoroughly tested in Task 0055 |
| **Vercel cron reliability** | Medium | Add error alerting, manual trigger option |
| **Mobile responsiveness issues** | Low | Tested in Task 0053, Task 0054, Task 0055 |
| **TypeScript type errors** | Low | Types regenerated in Task 0050 |

---

## Success Metrics

**After implementation, verify:**

1. **Functionality:**
   - [ ] Users can track up to 10 materials
   - [ ] Price changes show correctly (red ↑, green ↓, gray —)
   - [ ] Pagination works for 12+ materials
   - [ ] Summary stats are accurate
   - [ ] Scheduled jobs run daily

2. **Performance:**
   - [ ] Page load < 2s (with 50+ materials)
   - [ ] Summary stats query < 200ms
   - [ ] Pagination query < 100ms
   - [ ] Tracked materials query < 50ms

3. **Security:**
   - [ ] RLS enforces company isolation
   - [ ] Users can't track materials in other companies
   - [ ] Cron endpoints protected with secret

4. **User Experience:**
   - [ ] Mobile responsive (tested on 375px, 768px, 1280px)
   - [ ] Accessible (WCAG AA, keyboard navigation)
   - [ ] Error messages user-friendly
   - [ ] Loading states smooth

---

## Handoff Protocol

### Starting Implementation

1. **Read:** Design document (`docs/specs/materials-page-enhancement/design.md`)
2. **Read:** Requirements document (`docs/specs/materials-page-enhancement/requirements.md`)
3. **Read:** This task breakdown document
4. **Read:** First task file (`.claude/tasks/task_0050_materials_enhancement_database_schema.md`)
5. **Execute:** Follow task instructions sequentially
6. **Mark Complete:** Update task status in file after each task
7. **Handoff:** To next agent if task crosses authority boundaries

### Agent Handoff Example

```
Task 0050 (agent-backend-engineer)
  → Complete database schema
  → Mark task_0050_*.md as COMPLETE
  → Handoff to agent-backend-engineer for Task 0051

Task 0053 (agent-frontend-engineer)
  → Complete UI components
  → Mark task_0053_*.md as COMPLETE
  → Handoff to agent-frontend-engineer for Task 0054

Task 0055 (agent-code-reviewer)
  → Complete testing
  → Mark task_0055_*.md as COMPLETE
  → Feature COMPLETE, update design doc status
```

---

## Documentation Updates

**After implementation:**

1. **Update Design Document:**
   - Change status from DRAFT to IMPLEMENTED
   - Add "Delivered: 2026-01-XX" to header

2. **Update Requirements Document:**
   - Add "Delivered: 2026-01-XX" to header
   - Mark all requirements as SATISFIED

3. **Create Summary Document:**
   - File: `docs/specs/materials-page-enhancement/implementation-summary.md`
   - Include: Final metrics, screenshots, known limitations, future enhancements

4. **Update DB_SCHEMA.md:**
   - Add `tracked_materials` table documentation
   - Add `material_price_history` table documentation

---

## Commands Reference

### For Backend Engineers (Tasks 0050, 0051, 0052)

```bash
# Apply migrations
mcp supabase execute_sql --sql-file supabase/migrations/20260104000001_create_tracked_materials.sql

# Generate types
npx supabase gen types typescript --project-id "$SUPABASE_PROJECT_ID" > types/database.types.ts

# Test server actions
npm run dev
# Then test in browser or via curl

# Trigger cron job manually
curl -H "Authorization: Bearer $CRON_SECRET" \
     http://localhost:3000/api/cron/update-material-prices
```

### For Frontend Engineers (Tasks 0053, 0054)

```bash
# Start dev server
npm run dev

# Build (to catch errors)
npm run build

# Test on mobile
# Use browser DevTools responsive mode (375px, 768px, 1280px)
```

### For Code Reviewers (Task 0055)

```bash
# Run full build
npm run build

# Run Lighthouse audit
npx lighthouse http://localhost:3000/app/materials --view

# Deploy to production
vercel --prod

# Check Vercel logs
vercel logs --follow
```

---

## Related Documentation

- **Design Document:** `docs/specs/materials-page-enhancement/design.md`
- **Requirements Document:** `docs/specs/materials-page-enhancement/requirements.md`
- **DB Schema:** `.claude/docs/law/DB_SCHEMA.md`
- **UI Rules:** `.claude/docs/law/UI_RULES.md`
- **System Architecture:** `.claude/docs/law/SYSTEM.md`

---

## Questions & Support

**If blocked:**

1. Check design document for clarification
2. Review related law docs (DB_SCHEMA, UI_RULES)
3. Ask in task file comments (or GitHub Issues)
4. Request kiro-design review if design is unclear

**If design changes needed:**

1. STOP implementation
2. Request kiro-design to update design document
3. Wait for design approval
4. Resume implementation with updated design

---

**Ready to start? Begin with Task 0050!**

File: `.claude/tasks/task_0050_materials_enhancement_database_schema.md`
