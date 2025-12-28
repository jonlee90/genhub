# E2-T5: Create Phase Management Actions

**Epic**: Projects (Week 3-4)
**Effort**: Medium
**References**: Req 8 (Metro Journey), Design Section 4.1

## Description

Create server actions for phase status updates and implement automatic phase completion detection based on task completion.

## Subtasks

### 5.1 Create phase update server action
- Add updatePhaseStatus() to `app/actions/projects.ts`
- Support manual status updates (pending, in_progress, completed)
- Auto-mark completed when 100% tasks done
- Revalidate project detail path
- **Refs:** Req 8.5-8.6 (Phase Status), Design Section 4.1
- **Effort:** S
- **Files:** `app/actions/projects.ts`

### 5.2 Implement phase completion auto-detection
- Modify updatePhaseStatus to check task completion
- When all tasks in phase are completed, auto-mark phase as completed
- When all phases completed, mark project as completed
- **Refs:** Req 8.5, 8.7 (Auto-completion), Design Section 4.1
- **Effort:** M
- **Files:** `app/actions/projects.ts`

## Acceptance Criteria

- [ ] Phase status can be manually updated
- [ ] Automatic completion triggers when all tasks done
- [ ] Project automatically marks complete when all phases done
- [ ] Status changes revalidate project detail page
- [ ] Auto-detection respects permission levels
- [ ] Completion percentages update correctly

## Files to Create/Modify

- `app/actions/projects.ts`
