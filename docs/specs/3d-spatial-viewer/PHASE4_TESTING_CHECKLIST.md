# Phase 4 Testing Checklist - 3D Spatial Viewer GenHub Integration

**Date:** 2026-01-02
**Phase:** Phase 4 - GenHub Integration
**Tester:** _____________

---

## Pre-Testing Setup

- [ ] Database migrations applied (20260102120000, 20260102120001)
- [ ] RLS policies added to both migrations
- [ ] TypeScript types regenerated (optional)
- [ ] Development server running: `npm run dev`
- [ ] Test project created with 3D model uploaded
- [ ] Test user accounts:
  - [ ] GC Admin account
  - [ ] PM account
  - [ ] Worker account
  - [ ] Client account

---

## P4.1 - Phase Integration Testing

### Test 1.1: Phase Filter Display
- [ ] Navigate to `/app/projects/{projectId}/spatial`
- [ ] Verify PhaseFilter dropdown appears in marker panel
- [ ] Verify dropdown shows all project phases
- [ ] Verify "All Phases" option exists
- [ ] Verify "Unassigned" option exists
- [ ] Verify marker counts show next to each phase

**Expected:** Dropdown styled with construction theme (#001B51), blueprint background

### Test 1.2: Phase Filtering
- [ ] Select a specific phase from dropdown
- [ ] Verify only markers with that phase_id are shown in 3D view
- [ ] Verify marker count updates in panel
- [ ] Select "All Phases"
- [ ] Verify all markers appear again

**Expected:** Filtering works instantly, no page reload

### Test 1.3: Phase Color Coding
- [ ] Create markers linked to different phases
- [ ] Verify each phase uses different color in 3D view
- [ ] Verify colors match Metro Journey phase theme

**Expected:** Phase 1 (Initiation) = color X, Phase 2 (Planning) = color Y, etc.

---

## P4.2 - Task Integration Testing

### Test 2.1: TaskLinker Modal
- [ ] Navigate to task board (`/app/tasks`)
- [ ] Click on a task card
- [ ] Verify "Set in 3D View" button appears in task detail
- [ ] Click "Set in 3D View"
- [ ] Verify TaskLinker modal opens
- [ ] Verify modal shows searchable list of existing markers
- [ ] Search for a marker by title
- [ ] Click "Link to Task" on a marker

**Expected:** Modal styled with BaseModal, search works with debounce, link button appears

### Test 2.2: Link Task to Marker
- [ ] In TaskLinker modal, select a marker
- [ ] Click "Link to Task"
- [ ] Verify success toast appears
- [ ] Close modal
- [ ] Verify task card now shows 3D location badge (📍 + "3D")

**Expected:** Optimistic UI update, badge appears immediately

### Test 2.3: View Task in 3D
- [ ] On task card with 3D badge, click the badge
- [ ] Verify navigates to `/app/projects/{projectId}/spatial?marker={markerId}`
- [ ] Verify 3D camera flies to marker position
- [ ] Verify marker is highlighted

**Expected:** Smooth camera animation, marker selected

### Test 2.4: Task Completion Activity Log
- [ ] Complete a task that has a linked marker (status → 'completed')
- [ ] Navigate to 3D viewer
- [ ] Click on the marker linked to that task
- [ ] Open ContentDrawer
- [ ] Switch to "Activity" tab
- [ ] Verify activity log entry shows: "Task completed: [Task Title]"

**Expected:** Auto-created activity log with task_id, completed_by, completed_at

### Test 2.5: TaskCard Location Badge Responsive
- [ ] View task card on desktop (>640px)
- [ ] Verify badge shows icon + "3D" text
- [ ] Resize to mobile (<640px)
- [ ] Verify badge shows icon only

**Expected:** Responsive, min 44x44px touch target on mobile

---

## P4.3 - Photo Integration Testing

### Test 3.1: GPS Photo Upload
- [ ] Upload a photo with GPS EXIF data to a project
  - **Test photo:** Use a photo from phone camera with location enabled
  - **Or use:** Sample GPS photo from https://github.com/ianare/exif-samples
- [ ] Verify PhotoLocationSuggester toast appears
- [ ] Verify toast shows: "This photo appears to be near [Marker Title]"
- [ ] Verify distance shown in meters (e.g., "15m away")

**Expected:** Toast appears bottom-right, auto-dismisses after 20 seconds

### Test 3.2: Attach Photo to Suggested Marker
- [ ] Upload GPS photo (trigger suggester)
- [ ] Click "Attach Here" button in toast
- [ ] Verify photo attached to suggested marker
- [ ] Navigate to 3D viewer
- [ ] Click marker
- [ ] Verify photo appears in ContentDrawer Photos tab

**Expected:** Optimistic UI, photo appears immediately

### Test 3.3: Create New Marker from GPS
- [ ] Upload GPS photo
- [ ] Click "Create New Marker" in toast
- [ ] Verify marker placement mode activates
- [ ] Verify marker preview shows at GPS-derived position
- [ ] Confirm marker creation
- [ ] Verify marker created with photo attached

**Expected:** New marker at correct 3D coordinates derived from GPS lat/lon

### Test 3.4: No GPS Data Fallback
- [ ] Upload a photo without GPS EXIF data
- [ ] Verify PhotoLocationSuggester does NOT appear
- [ ] Verify normal photo upload flow continues

**Expected:** No toast, graceful fallback

---

## P4.4 - Chat Integration Testing

### Test 4.1: Message Parser - @location Syntax
- [ ] Navigate to project chat room
- [ ] In message input, type: `@location:{valid-marker-uuid}`
  - **Example:** `@location:550e8400-e29b-41d4-a716-446655440000`
- [ ] Send message
- [ ] Verify message renders with clickable link: "📍 [Marker Title]"

**Expected:** UUID validated, link formatted correctly

### Test 4.2: MarkerLink Click Navigation
- [ ] In chat, click on a marker link
- [ ] Verify opens 3D viewer in new tab/window
- [ ] Verify URL: `/app/projects/{projectId}/spatial?marker={markerId}`
- [ ] Verify camera flies to marker position

**Expected:** New tab opens, marker auto-selected

### Test 4.3: MarkerLink Hover Tooltip
- [ ] In chat, hover over a marker link
- [ ] Verify tooltip appears showing marker preview
- [ ] Verify tooltip shows: marker title, floor, type icon

**Expected:** Tooltip appears after 500ms delay

### Test 4.4: Invalid UUID Handling
- [ ] Type invalid marker reference: `@location:invalid-uuid`
- [ ] Send message
- [ ] Verify marker link NOT rendered (shown as plain text)

**Expected:** Parser validates UUID format (RFC 4122)

---

## P4.5 - Materials Integration Testing

### Test 5.1: Link Material to Marker
- [ ] Navigate to materials dashboard
- [ ] Click on a material assignment
- [ ] Click "Set Installation Location"
- [ ] Verify 3D viewer opens in marker placement mode
- [ ] Click on 3D surface to place marker
- [ ] Confirm marker creation
- [ ] Verify material linked to marker

**Expected:** Material assignment updated with spatial_marker_id

### Test 5.2: MaterialMarkers Display
- [ ] Navigate to 3D viewer
- [ ] Verify markers linked to materials show with special icon (Package)
- [ ] Verify quantity badge shows on material marker
- [ ] Hover over material marker
- [ ] Verify tooltip shows: material name, quantity, status

**Expected:** Special rendering for type='material'

### Test 5.3: Material Status Color Coding
- [ ] Create material markers with different statuses:
  - [ ] Ordered (status: 'ordered')
  - [ ] Delivered (status: 'delivered')
  - [ ] Installed (status: 'installed')
- [ ] Verify colors:
  - [ ] Ordered: Blue (#3B82F6)
  - [ ] Delivered: Green (#10B981)
  - [ ] Installed: Gray (#6B7280)

**Expected:** Color-coded markers with glow effects

### Test 5.4: Material Marker in List
- [ ] Open marker panel sidebar
- [ ] Filter by type='material'
- [ ] Verify material markers show in list with:
  - [ ] Package icon
  - [ ] Material name as title
  - [ ] Quantity badge
  - [ ] Status chip

**Expected:** List view matches 3D marker styling

---

## P4.7 - TaskCard 3D Badge Testing

### Test 7.1: Badge Appearance
- [ ] Link a task to a spatial marker (via TaskLinker)
- [ ] View task in Kanban board
- [ ] Verify task card shows Box icon + "3D" badge
- [ ] Verify badge positioned in top-right corner
- [ ] Verify construction-blue color (#001B51)

**Expected:** Badge styled with industrial theme

### Test 7.2: Badge Tooltip
- [ ] Hover over 3D badge on task card
- [ ] Verify tooltip shows: "Floor 2, Room 204" (floor and room from marker)

**Expected:** Tooltip appears after 500ms

### Test 7.3: Badge Click Navigation
- [ ] Click 3D badge on task card
- [ ] Verify navigates to: `/app/projects/{projectId}/spatial?marker={markerId}`
- [ ] Verify 3D viewer opens with marker selected

**Expected:** Same navigation as Test 2.3

### Test 7.4: Badge Mobile Responsive
- [ ] View task card on mobile (<640px)
- [ ] Verify badge shows Box icon only (no text)
- [ ] Verify touch target is at least 44x44px

**Expected:** Accessible touch target

---

## Cross-Feature Integration Testing

### Integration 1: Task → Marker → Chat Reference
1. [ ] Create a task
2. [ ] Link task to spatial marker
3. [ ] Complete the task (verify activity log created in marker)
4. [ ] Navigate to project chat
5. [ ] Reference the marker in chat: `Check out @location:{marker-uuid}`
6. [ ] Click link in chat
7. [ ] Verify 3D viewer opens at marker
8. [ ] Verify activity timeline shows task completion

**Expected:** Full integration workflow works seamlessly

### Integration 2: Photo → Marker → Material
1. [ ] Upload GPS photo (trigger suggester)
2. [ ] Create new marker from GPS location
3. [ ] Attach material to same marker
4. [ ] Verify marker shows:
   - [ ] Photo in Photos tab
   - [ ] Material in materials list
   - [ ] Material quantity badge

**Expected:** Multi-content marker displays correctly

### Integration 3: Phase → Task → 3D View
1. [ ] Create task in specific phase (e.g., "Construction")
2. [ ] Link task to marker
3. [ ] Navigate to 3D viewer
4. [ ] Filter by phase ("Construction")
5. [ ] Verify marker appears (task's phase matches filter)
6. [ ] Verify task badge shows on marker

**Expected:** Phase filtering includes task-linked markers

---

## Security & Permissions Testing

### Security 1: Company Isolation
- [ ] Login as User A from Company A
- [ ] Create marker linked to task
- [ ] Logout
- [ ] Login as User B from Company B
- [ ] Navigate to `/app/projects/{companyA-projectId}/spatial`
- [ ] Verify: 403 Forbidden or redirect
- [ ] Attempt to link Company B task to Company A marker
- [ ] Verify: RLS policy blocks update

**Expected:** RLS policies enforce company-scoped access

### Security 2: Role-Based Access
- [ ] Login as Worker (not PM/GC Admin)
- [ ] Attempt to link material to marker
- [ ] Verify: Permission check (depends on business logic)
- [ ] Attempt to delete marker created by PM
- [ ] Verify: Delete button hidden or disabled

**Expected:** Role-based permissions respected

### Security 3: UUID Validation
- [ ] In chat, send: `@location:'; DROP TABLE spatial_markers;--`
- [ ] Verify: Message NOT parsed as marker link
- [ ] Verify: No SQL injection (message stored as plain text)

**Expected:** UUID regex validation prevents injection

---

## Performance Testing

### Performance 1: Large Marker Count
- [ ] Create 100+ markers in project
- [ ] Load 3D viewer
- [ ] Measure:
  - [ ] Initial load time: ______ seconds (target: <5s)
  - [ ] Filter response time: ______ ms (target: <100ms)
  - [ ] FPS during camera movement: ______ fps (target: >30fps)

**Expected:** Smooth performance with large datasets

### Performance 2: Phase Filter Switching
- [ ] Create markers in 5 different phases (20 markers each)
- [ ] Rapidly switch between phase filters
- [ ] Verify: No lag or stuttering
- [ ] Verify: Marker visibility updates instantly

**Expected:** Client-side filtering is fast (<50ms)

### Performance 3: GPS Distance Calculation
- [ ] Upload 10 GPS photos simultaneously
- [ ] Measure: Time to calculate nearest marker for all photos
- [ ] Target: <500ms for 10 photos with 100 markers

**Expected:** Haversine formula is efficient

---

## Mobile Testing

### Mobile 1: PhaseFilter Responsive
- [ ] Open 3D viewer on mobile (iOS/Android)
- [ ] Verify PhaseFilter dropdown works with touch
- [ ] Verify dropdown doesn't overflow screen

**Expected:** Touch-friendly, no horizontal scroll

### Mobile 2: TaskLinker Modal
- [ ] Open TaskLinker on mobile
- [ ] Verify modal fills screen (80% height)
- [ ] Verify search input is accessible
- [ ] Verify scrolling works smoothly

**Expected:** Mobile-optimized modal

### Mobile 3: PhotoLocationSuggester Toast
- [ ] Upload GPS photo on mobile
- [ ] Verify toast appears at bottom (safe area)
- [ ] Verify buttons are touch-friendly (min 44px)
- [ ] Tap "Attach Here"
- [ ] Verify action completes

**Expected:** Mobile-friendly toast positioning

---

## Accessibility Testing

### A11y 1: Keyboard Navigation
- [ ] Use Tab key to navigate PhaseFilter dropdown
- [ ] Verify: Can open dropdown with Enter
- [ ] Verify: Can select option with Arrow keys + Enter
- [ ] Verify: Can close with Escape

**Expected:** Full keyboard accessibility

### A11y 2: Screen Reader Support
- [ ] Enable screen reader (NVDA/JAWS/VoiceOver)
- [ ] Navigate to 3D viewer
- [ ] Verify: PhaseFilter announced as "Dropdown, Filter by Phase"
- [ ] Verify: Marker links in chat announced as "Link, [Marker Title]"
- [ ] Verify: TaskCard badge announced as "Button, View in 3D"

**Expected:** ARIA labels present, semantic HTML

### A11y 3: Color Contrast
- [ ] Check phase filter colors against WCAG AA (4.5:1)
- [ ] Check material status colors (blue, green, gray)
- [ ] Verify: All text readable on construction-blue background

**Expected:** Pass WCAG 2.1 Level AA

---

## Error Handling Testing

### Error 1: Marker Not Found
- [ ] In chat, send: `@location:{non-existent-uuid}`
- [ ] Click link
- [ ] Verify: Error message "Marker not found"
- [ ] Verify: No crash

**Expected:** Graceful error handling

### Error 2: Network Failure
- [ ] Disable network
- [ ] Attempt to link task to marker
- [ ] Verify: Error toast "Failed to link task"
- [ ] Re-enable network
- [ ] Verify: Can retry successfully

**Expected:** Network error recovery

### Error 3: Permission Denied
- [ ] Login as user without marker edit permission
- [ ] Attempt to link material to marker
- [ ] Verify: Error toast "Permission denied"

**Expected:** Permission errors communicated clearly

---

## Browser Compatibility

Test on each browser:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

**For each browser, verify:**
- [ ] PhaseFilter dropdown works
- [ ] MarkerLinks clickable in chat
- [ ] TaskLinker modal opens
- [ ] PhotoLocationSuggester toast appears
- [ ] MaterialMarkers color-coded correctly

---

## Regression Testing

### Regression 1: Existing Features Unaffected
- [ ] Verify Phase 1-3 features still work:
  - [ ] 3D model loading
  - [ ] Marker placement
  - [ ] Camera controls
  - [ ] Photo/file upload to markers
  - [ ] Notes and comments
  - [ ] Marker clustering

**Expected:** No regressions in existing functionality

### Regression 2: Database Integrity
- [ ] Create marker
- [ ] Delete linked task
- [ ] Verify: marker.spatial_marker_id set to NULL (ON DELETE SET NULL)
- [ ] Delete marker
- [ ] Verify: task.spatial_marker_id set to NULL

**Expected:** Foreign key constraints working

---

## Final Acceptance Criteria

All Phase 4 features must pass before deployment:

**P4.1 - Phase Integration:**
- [ ] ✅ Phase filter works correctly
- [ ] ✅ Color-coding applies
- [ ] ✅ Counts accurate

**P4.2 - Task Integration:**
- [ ] ✅ TaskLinker modal functional
- [ ] ✅ Task-marker linking works
- [ ] ✅ TaskCard badge appears
- [ ] ✅ Navigation to 3D viewer works
- [ ] ✅ Activity logging on task completion

**P4.3 - Photo Integration:**
- [ ] ✅ GPS photo uploads trigger suggester
- [ ] ✅ Nearest marker calculation accurate
- [ ] ✅ Attach and create options work

**P4.4 - Chat Integration:**
- [ ] ✅ @location:{uuid} syntax parsed
- [ ] ✅ MarkerLink renders correctly
- [ ] ✅ Navigation from chat works
- [ ] ✅ Tooltips display

**P4.5 - Materials Integration:**
- [ ] ✅ Material-marker linking works
- [ ] ✅ MaterialMarkers color-coded
- [ ] ✅ Quantity badges display

**P4.7 - TaskCard Badge:**
- [ ] ✅ Badge appears on linked tasks
- [ ] ✅ Navigation works
- [ ] ✅ Responsive design

**Security:**
- [ ] ✅ RLS policies enforced
- [ ] ✅ Company isolation verified
- [ ] ✅ No SQL injection vulnerabilities

**Performance:**
- [ ] ✅ 100+ markers loads in <5s
- [ ] ✅ Filtering <100ms
- [ ] ✅ 30+ FPS maintained

---

## Sign-Off

**Tested By:** _________________________
**Date:** _______________
**Build Version:** _______________

**Status:**
- [ ] ✅ All tests passed - Ready for production
- [ ] ⚠️ Minor issues found - Deploy with known issues
- [ ] ❌ Critical issues found - Do not deploy

**Notes:**
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
