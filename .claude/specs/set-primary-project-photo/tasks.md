# Set Primary Project Photo - Implementation Tasks

## References

- Requirements: `.claude/specs/set-primary-project-photo/requirements.md`
- Design: `.claude/specs/set-primary-project-photo/design.md`

---

## Phase 1: Backend Foundation

### Task 1.1: Create setProjectPrimaryPhoto Server Action

- **Agent:** backend-engineer
- **Skill:** `skills/backend/server-action.md`
- **Output:** `app/actions/project-photos.ts` (add to existing file)
- **Requirements:**
  - Add `setProjectPrimaryPhoto(projectId: string, photoUrl: string | null)` function
  - Validate user has access to project (company_id or project_team check)
  - If photoUrl provided, verify it exists in project_photos for this project
  - Update `projects.image_url` column
  - Revalidate `/app/projects/${projectId}` and `/app/projects`
  - Return `{ data: { success: true, imageUrl } }` or `{ error: string }`
- **Acceptance:**
  - [ ] Action exports correctly from project-photos.ts
  - [ ] Auth check prevents unauthorized access
  - [ ] Photo URL validation prevents arbitrary URLs
  - [ ] Setting to null clears the image_url
  - [ ] Revalidation triggers correctly
  - [ ] TypeScript types are correct

**Estimated Time:** 30 minutes

---

## Phase 2: UI Implementation

### Task 2.1: Update ProjectFilesTab to Pass Project imageUrl

- **Agent:** frontend-engineer
- **Skill:** `skills/frontend/component-patterns.md`
- **Output:** `components/projects/files/ProjectFilesTab.tsx`
- **Dependencies:** None
- **Requirements:**
  - Add `projectImageUrl: string | null` prop to ProjectFilesTab
  - Add `onPrimaryPhotoChange: () => void` callback prop
  - Pass these props down to PhotoGallerySection
- **Acceptance:**
  - [ ] Props added to interface
  - [ ] Props passed to child component
  - [ ] No TypeScript errors

**Estimated Time:** 15 minutes

---

### Task 2.2: Update ProjectDetailContent to Provide Project Data

- **Agent:** frontend-engineer
- **Skill:** `skills/frontend/component-patterns.md`
- **Output:** `components/projects/ProjectDetailContent.tsx`
- **Dependencies:** Task 2.1
- **Requirements:**
  - Pass `project.image_url` to ProjectFilesTab as `projectImageUrl`
  - Create refresh handler that refetches project data (via router.refresh)
  - Pass refresh handler as `onPrimaryPhotoChange`
- **Acceptance:**
  - [ ] Props correctly passed to ProjectFilesTab
  - [ ] Refresh mechanism works after primary photo change
  - [ ] Project data updates in UI after change

**Estimated Time:** 20 minutes

---

### Task 2.3: Enhance PhotoGallerySection with Primary Photo Support

- **Agent:** frontend-engineer
- **Skill:** `skills/frontend/component-patterns.md`
- **Output:** `components/projects/files/PhotoGallerySection.tsx`
- **Dependencies:** Tasks 1.1, 2.1
- **Requirements:**
  - Add `projectImageUrl: string | null` prop
  - Add `onPrimaryPhotoChange: () => void` prop
  - Create `isPrimaryPhoto(photo)` helper function
  - Create `handleSetPrimary(photoUrl)` handler using setProjectPrimaryPhoto
  - Create `handleRemovePrimary()` handler
  - Pass isPrimary, onSetPrimary to photo items and lightbox
  - Add "Cover" badge to primary photo thumbnail (top-right)
  - Add Star action button in hover overlay (only for source === 'upload')
  - Loading states for async operations
- **Acceptance:**
  - [ ] Cover badge displays on primary photo
  - [ ] Star button appears on hover (upload photos only)
  - [ ] Star button disabled/filled when photo is primary
  - [ ] No star button on receipt photos
  - [ ] Toast notifications on success/error
  - [ ] 44px minimum touch target for star button

**Estimated Time:** 45 minutes

---

### Task 2.4: Enhance PhotoLightbox with Primary Photo Actions

- **Agent:** frontend-engineer
- **Skill:** `skills/frontend/modal-patterns.md`
- **Output:** `components/projects/files/PhotoLightbox.tsx`
- **Dependencies:** Tasks 1.1, 2.3
- **Requirements:**
  - Add `isPrimary: boolean` prop
  - Add `onSetPrimary: (photoUrl: string) => void` prop
  - Add `onRemovePrimary: () => void` prop
  - Add loading states: `isSettingPrimary`, `isRemovingPrimary`
  - Add "Current Cover Photo" badge in metadata area when isPrimary
  - Add "Set as Cover" button for upload photos that are not primary
  - Add "Remove as Cover" button when photo is primary
  - Hide both buttons for receipt photos
  - Use BaseModal patterns for button styling
- **Acceptance:**
  - [ ] Current cover indicator shows when viewing primary photo
  - [ ] "Set as Cover" button visible for non-primary upload photos
  - [ ] "Remove as Cover" button visible for primary photo
  - [ ] Buttons hidden for receipt photos
  - [ ] Loading spinners during async operations
  - [ ] Actions trigger callbacks correctly
  - [ ] Lucide icons used (Star, X, Loader2)

**Estimated Time:** 40 minutes

---

## Phase 3: Integration & Polish

### Task 3.1: Integration Testing

- **Agent:** code-reviewer
- **Output:** Test report / bug fixes
- **Dependencies:** All Phase 1 & 2 tasks
- **Requirements:**
  - Verify full user flow:
    1. Navigate to project Files & Photos tab
    2. Hover over photo, click star to set as primary
    3. Verify Cover badge appears
    4. Go to Projects list, verify ProjectCard shows image
    5. Return to gallery, open lightbox
    6. Verify "Current Cover Photo" indicator
    7. Click "Remove as Cover"
    8. Verify badge removed, ProjectCard shows placeholder
  - Test receipt photo exclusion
  - Test error handling (network failure simulation)
  - Test mobile touch interactions
  - Verify no console errors
  - Verify build passes
- **Acceptance:**
  - [ ] All user stories verified
  - [ ] Receipt photos correctly excluded
  - [ ] Error messages display correctly
  - [ ] Mobile layout correct
  - [ ] No console errors
  - [ ] Build passes (`npm run build`)

**Estimated Time:** 30 minutes

---

### Task 3.2: Documentation Sync

- **Agent:** backend-engineer OR frontend-engineer
- **Output:** Updated index files
- **Dependencies:** Task 3.1 (after verification)
- **Requirements:**
  - Run `/kc:sync-docs`
  - Update `docs/indexes/actions.md` with new action
  - Verify component index is accurate
- **Acceptance:**
  - [ ] actions.md includes setProjectPrimaryPhoto
  - [ ] components.md accurate (if changes needed)

**Estimated Time:** 10 minutes

---

## Execution Order

```
Sequential Dependencies:

Phase 1: Backend
  1.1 setProjectPrimaryPhoto Server Action

Phase 2: Frontend (sequential due to prop threading)
  2.1 ProjectFilesTab props
      │
      ▼
  2.2 ProjectDetailContent data passing
      │
      ▼
  2.3 PhotoGallerySection enhancements
      │
      ▼
  2.4 PhotoLightbox enhancements

Phase 3: Polish
  3.1 Integration testing
      │
      ▼
  3.2 Documentation sync

Parallelizable:
  - None (linear dependency chain)
```

---

## Estimated Effort

| Phase | Tasks | Time |
|-------|-------|------|
| Backend (Phase 1) | 1 | 30 min |
| Frontend (Phase 2) | 4 | 2 hrs |
| Polish (Phase 3) | 2 | 40 min |
| **Total** | **7** | **~3.5 hrs** |

---

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Photo URL validation bypass | Server-side validation against project_photos table |
| Race condition on rapid clicks | Disable buttons during async operation |
| Stale UI after update | revalidatePath + callback to parent refresh |
| Mobile touch target too small | Enforce 44px minimum in implementation |

---

## File Summary

| File | Action |
|------|--------|
| `app/actions/project-photos.ts` | Add setProjectPrimaryPhoto function |
| `components/projects/files/ProjectFilesTab.tsx` | Add props, pass to children |
| `components/projects/ProjectDetailContent.tsx` | Pass project.image_url, refresh handler |
| `components/projects/files/PhotoGallerySection.tsx` | Add badge, star button, handlers |
| `components/projects/files/PhotoLightbox.tsx` | Add buttons, indicators, handlers |

---

**Status:** READY FOR IMPLEMENTATION

---

## Quick Start

To begin implementation:

```bash
# Option 1: Full implementation via orchestrator
/kc:impl set-primary-project-photo

# Option 2: Task-by-task
# Start with Task 1.1 (backend), then sequential frontend tasks
```

---

## Spec Complete: Set Primary Project Photo

**Files Created:**
- `.claude/specs/set-primary-project-photo/requirements.md`
- `.claude/specs/set-primary-project-photo/design.md`
- `.claude/specs/set-primary-project-photo/tasks.md`

**Summary:**
- **User Stories:** 5
- **Data Tables:** 0 (uses existing `projects.image_url`)
- **Server Actions:** 1 (setProjectPrimaryPhoto)
- **UI Components:** 4 modified (ProjectFilesTab, ProjectDetailContent, PhotoGallerySection, PhotoLightbox)
- **Implementation Tasks:** 7 tasks

**Ready for Implementation:** Execute via orchestrator or `/kc:impl`
