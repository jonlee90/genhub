# 🧪 Spatial Viewer E2E Manual Testing Guide

**Status:** Automated E2E testing requires real authentication credentials (Magic Link)
**Alternative:** Complete manual test procedures documented below

---

## 🔍 Authentication Discovery

From automated testing, we discovered:

### GenHub Uses Magic Link Authentication
- **Login Flow:** Email → Magic Link → Direct app access
- **No Password Required:** Uses Next Auth with magic link provider
- **Alternative Auth:** Google OAuth integration available
- **Location:** `http://localhost:3000/login`

**Login Form Elements Found:**
```
- Email Input: input[type="email"]
- Button 1: "Continue with Google"
- Button 2: "Send Magic Link"
- Form Type: Magic Link Authentication
```

---

## 📋 Manual Testing Procedure

### Prerequisites
1. **Dev Server Running:** `npm run dev`
2. **Database Ready:** Supabase local or cloud instance
3. **Browser:** Chrome, Firefox, Safari, or Edge
4. **Project with 3D Model:** Must have uploaded IFC file

### Step 1: Access Login Page

**URL:** `http://localhost:3000/login`

**Expected Screen:**
```
GenHub Login
├─ Email input field
│  └─ Placeholder: "you@example.com"
├─ Button: "Continue with Google"
└─ Button: "Send Magic Link"
```

**Screenshot Evidence:** `test-screenshots-authenticated/02-login-attempt-*.png`

---

### Step 2: Authenticate (Choose One Method)

#### Method A: Magic Link (Recommended for Development)

1. **Enter Email Address**
   - Click email input field
   - Type your email: `your-email@example.com`
   - Click "Send Magic Link"

2. **Check Email**
   - Open email inbox
   - Find email from GenHub with subject: "Sign in to GenHub"
   - Click magic link in email

3. **Verify Authentication**
   - Browser redirects to dashboard
   - URL changes to: `http://localhost:3000/app`
   - You're now logged in ✓

#### Method B: Google OAuth (If Configured)

1. **Click "Continue with Google"**
   - Redirects to Google login
   - Enter Google credentials
   - Authorize GenHub

2. **Verify Authentication**
   - Redirected to dashboard
   - URL: `http://localhost:3000/app`

---

### Step 3: Navigate to Project Details

1. **Open Projects Page**
   - URL: `http://localhost:3000/app/projects`
   - OR click "Projects" in sidebar

2. **Select Project with 3D Model**
   - Look for project card with "3D Model" badge
   - Click to open project details
   - URL: `http://localhost:3000/app/projects/{PROJECT_ID}`

3. **Verify Page Elements**
   ```
   Expected:
   ├─ Project Name & Details (top)
   ├─ Metro Journey/Phases (center-top)
   ├─ 3D Spatial Viewer (center)
   ├─ Model Statistics (bottom-left)
   └─ Marker Annotation Panel (bottom-right)
   ```

---

### Step 4: Test Spatial Viewer Canvas

**Location:** Center of page, labeled "3D Spatial Viewer"

#### Test 4A: Check Canvas Load

1. **Verify Canvas Renders**
   - Look for 3D model in center of page
   - Model shows construction site or building
   - Controls visible around edges

**Evidence:** Canvas loads with xeokit WebGL viewer

#### Test 4B: Test Mouse Wheel Zoom

1. **Position mouse** over 3D model
2. **Scroll up** → Model zooms OUT
3. **Scroll down** → Model zooms IN
4. **Verify:** Zoom is smooth and responsive

**Expected Behavior:** Smooth continuous zoom without stuttering

#### Test 4C: Test Camera Rotation (Left-Click Drag)

1. **Click and hold** left mouse button on model
2. **Drag left** → Model rotates counterclockwise
3. **Drag right** → Model rotates clockwise
4. **Drag up** → Model rotates up
5. **Drag down** → Model rotates down

**Expected Behavior:** Smooth orbital camera rotation

#### Test 4D: Test Camera Pan (Right-Click Drag)

1. **Right-click and hold** on model
2. **Drag in any direction** → Model pans
3. **Release** → Movement stops

**Expected Behavior:** Camera pans smoothly

#### Test 4E: Check Toolbar Controls

Look for toolbar (usually top-right):
- **Camera Icon** → Reset/change camera view
- **Home Icon** → Reset to default view
- **Zoom Controls** → Zoom in/out buttons

Test each button and verify camera responds.

---

### Step 5: Test Right-Click Context Menu

**⚠️ Important:** Only works for GC Admin or Project Manager roles

#### Test 5A: Open Context Menu

1. **Right-click** on 3D model surface
2. **Expected Menu Options:**
   ```
   Context Menu
   ├─ Create Task
   ├─ Link Task
   ├─ Add Issue
   ├─ Add Note
   ├─ Add Safety
   └─ Add Milestone
   ```

**Screenshot Location:** `test-screenshots-authenticated/06-context-menu-*.png`

#### Test 5B: Verify Menu Behavior

- **Position:** Menu appears where you right-clicked
- **Visibility:** Menu stays open until clicked or dismissed
- **Click Outside:** Menu closes when clicking elsewhere
- **Escape Key:** Menu closes when pressing Escape

---

### Step 6: Test Task Creation

**Prerequisites:** Right-click menu must have "Create Task" option

#### Test 6A: Create Task at 3D Location

1. **Right-click on 3D model** at location where you want task
2. **Click "Create Task"**
3. **Modal appears** with form fields:
   ```
   Create Task Modal
   ├─ Title field (required)
   ├─ Phase dropdown (required)
   ├─ Assigned To dropdown (optional)
   ├─ Priority dropdown (optional)
   ├─ Description field (optional)
   ├─ Button: "Create Task"
   └─ Button: "Cancel"
   ```

4. **Fill in form:**
   - Title: `"Test Task - Structural Inspection"`
   - Phase: Select from project phases
   - Assigned To: Select team member
   - Priority: High/Medium/Low

5. **Click "Create Task"**

6. **Verify Success:**
   - Modal closes
   - Success toast appears: "Task '...' created at 3D location"
   - Marker pin appears on 3D model where you clicked
   - Task appears in task list

**Expected Behavior:** Task created with 3D position (x, y, z) saved to database

---

### Step 7: Test Marker Creation

**Marker Types:** Issue, Note, Safety, Milestone

#### Test 7A: Create Issue Marker

1. **Right-click on 3D model**
2. **Click "Add Issue"**
3. **Modal appears:**
   ```
   Add Issue Marker
   ├─ Title field
   ├─ Description field
   ├─ Priority dropdown
   ├─ Assigned To dropdown
   └─ Button: "Create"
   ```

4. **Fill in:**
   - Title: `"Structural crack in concrete"`
   - Priority: High
   - Assigned To: Team member

5. **Click "Create"**

6. **Verify Success:**
   - Modal closes
   - **Red marker pin** appears at clicked location
   - Marker visible in "Marker Annotation Panel" (bottom-right)
   - Status shows "Open"

#### Test 7B: Create Other Marker Types

Repeat test 7A for:
- **Note** (🟡 Yellow marker) - General notes
- **Safety** (🟠 Orange marker) - Safety concerns
- **Milestone** (🟢 Green marker) - Project milestones

**Verify:** Each marker type shows correct color

---

### Step 8: Test Marker Management

#### Test 8A: Drag Marker to New Position

1. **Find a marker pin** on 3D model
2. **Click and hold** the marker
3. **Drag to new location** on model
4. **Release**

**Verify Success:**
- Marker moves to new position
- Toast notification: "Marker position updated"
- Position saved to database

#### Test 8B: Click Marker to View Details

1. **Click on marker pin**
2. **Task Detail Panel** opens on right side
3. **Shows:**
   - Task title
   - Task description
   - Assigned to
   - Status
   - Due date
   - Materials
   - Attachments
   - Comments

4. **Can Edit:**
   - Click "Edit" to modify task
   - Update fields
   - Save changes

#### Test 8C: Delete Marker

1. **Right-click on marker**
2. **Click "Delete"**
3. **Confirm deletion**

**Verify:** Marker removed from model and list

---

### Step 9: Test Marker Filtering

**Location:** Bottom-left of 3D viewer, "Marker Filter Panel"

#### Test 9A: Filter by Type

1. **Find filter panel** with checkboxes:
   ```
   Marker Filters
   ☑ Issue (5)
   ☑ Note (3)
   ☑ Safety (2)
   ☑ Milestone (1)
   ```

2. **Uncheck "Issue"**
   - Issue markers disappear from model
   - Only Note, Safety, Milestone visible

3. **Check "Issue"**
   - Issue markers reappear

4. **Verify:** No page reload needed, real-time update

#### Test 9B: Filter by Status

If status filter available:
1. **Uncheck "Open"** → Only closed markers show
2. **Uncheck "In Progress"** → Only open/closed show
3. **Check "All"** → All markers show

**Verify:** Filtering works smoothly

---

### Step 10: Test Model Statistics

**Location:** Bottom section, "Model Statistics Display"

#### Test 10A: Verify Stats Display

Look for:
```
Model Statistics
├─ Element Count: [number]
├─ File Size: [size in MB]
├─ Processing Status: Ready/Processing/Failed
├─ Last Updated: [date/time]
└─ Model Version: [version]
```

**Expected Values:**
- Element Count: 50-5000+ (depends on model)
- File Size: 5-500 MB
- Status: Ready (after upload complete)

---

### Step 11: Test Mobile Responsiveness

#### Test 11A: Tablet View (iPad Size)

1. **Open browser DevTools**
2. **Toggle Device Emulation** (Ctrl+Shift+M)
3. **Select iPad** or tablet size
4. **Reload page**

**Verify:**
- 3D viewer resizes to fit screen
- Touch controls work (pinch, pan)
- Menu adapts to mobile layout
- No horizontal scrolling

#### Test 11B: Mobile Long-Press Menu

1. **In mobile view**
2. **Long-press (500ms+)** on 3D model
3. **Context menu appears**

**Verify:** Same menu as right-click on desktop

#### Test 11C: Mobile Gestures

1. **Two-finger pinch** → Zoom in/out
2. **Two-finger drag** → Pan camera
3. **Single-finger drag** → Rotate camera

**Verify:** All gestures responsive and smooth

---

### Step 12: Test Error Handling

#### Test 12A: WebGL Fallback

1. **Open browser DevTools** (F12)
2. **Go to Console tab**
3. **Type:** `var gl = document.createElement('canvas').getContext('webgl'); console.log(gl);`
4. **Check:** WebGL is supported (returns WebGLRenderingContext)

If WebGL not supported:
- **Expected:** Message: "3D Viewer Not Supported"
- **Alternative:** Static model view or warning

#### Test 12B: Model Load Error

1. **Force error:** Delete or rename model file
2. **Refresh page**

**Expected:**
- Loading indicator appears
- Error message: "Failed to load model"
- Fallback options available

---

## 📊 Test Coverage Checklist

### Core Features ✅

- [ ] **Authentication**
  - [ ] Magic link login works
  - [ ] Google OAuth works (if configured)
  - [ ] Session persists on refresh

- [ ] **Project Navigation**
  - [ ] Can view projects list
  - [ ] Can open project details
  - [ ] 3D model loads

- [ ] **Canvas Interactions**
  - [ ] Zoom with mouse wheel (working)
  - [ ] Rotate with left-click drag (working)
  - [ ] Pan with right-click drag (working)
  - [ ] Camera reset button works

- [ ] **Task Management**
  - [ ] Can create task at 3D location
  - [ ] Task captures 3D position (x, y, z)
  - [ ] Task appears in task list
  - [ ] Marker pin appears on model
  - [ ] Can view task details
  - [ ] Can edit task

- [ ] **Marker Management**
  - [ ] Can create Issue marker (red)
  - [ ] Can create Note marker (yellow)
  - [ ] Can create Safety marker (orange)
  - [ ] Can create Milestone marker (green)
  - [ ] Can drag marker to new position
  - [ ] Can delete marker
  - [ ] Marker counts update correctly

- [ ] **Marker Filtering**
  - [ ] Can filter by type
  - [ ] Can filter by status
  - [ ] Filters update in real-time
  - [ ] No page reload needed

- [ ] **Model Statistics**
  - [ ] Element count displays
  - [ ] File size displays
  - [ ] Processing status shows
  - [ ] Stats update correctly

- [ ] **Mobile Support**
  - [ ] Responsive layout on tablet
  - [ ] Touch pinch zoom works
  - [ ] Long-press menu works
  - [ ] No horizontal scrolling

---

## 🎯 Expected Test Results

### Success Criteria

✅ **All Core Features Pass:**
```
- Canvas interactions: 100%
- Task creation: 100%
- Marker creation: 100%
- Marker management: 100%
- Filtering: 100%
- Mobile support: 100%
```

### Performance Benchmarks

✅ **Smooth Performance:**
```
- Canvas pan/zoom: <100ms response
- Marker creation: <500ms load time
- Filter update: <200ms real-time
- Mobile FPS: 30 FPS minimum
```

### Browser Compatibility

✅ **Supported Browsers:**
```
- Chrome/Edge 90+: Full support
- Firefox 88+: Full support
- Safari 14+: Full support
- Mobile Safari: Full support with touch
```

---

## 📸 Screenshots Generated During Test

```
test-screenshots-authenticated/
├── 01-initial-page-*.png          ← Login page
├── 02-login-attempt-*.png         ← Login form attempts
├── 02-authenticated-*.png         ← Authenticated dashboard
├── 03-project-selected-*.png      ← Project details
├── 04-model-loaded-*.png          ← 3D model rendered
├── 05-uploader-*.png              ← IFC uploader (if no model)
├── 06-context-menu-*.png          ← Right-click menu
├── 07-zoomed-*.png                ← Camera zoom
├── e2e-report-*.json              ← Test results
└── e2e-improved.log               ← Full test output
```

---

## 🔧 Troubleshooting

### Canvas Doesn't Load

**Problem:** Black or white area where 3D model should be

**Solutions:**
1. Wait 2-3 seconds for model to load
2. Check browser console (F12) for WebGL errors
3. Verify IFC file was uploaded
4. Check model file isn't corrupted
5. Try different browser

### Right-Click Menu Not Appearing

**Problem:** Right-click does nothing

**Solutions:**
1. Verify you have correct role (GC Admin/Project Manager)
2. Ensure clicking on model surface, not empty space
3. Check browser allows right-click (not blocked)
4. Try in different browser

### Task Creation Fails

**Problem:** Form won't submit or error appears

**Solutions:**
1. Verify all required fields filled (Title, Phase)
2. Check console for error messages
3. Ensure database connection works
4. Try creating task without 3D position first

### Marker Position Doesn't Update

**Problem:** Dragging marker doesn't save position

**Solutions:**
1. Verify marker is for editable type
2. Check user role has edit permissions
3. Ensure database connection works
4. Check server logs for errors

### Mobile Gestures Don't Work

**Problem:** Pinch/pan doesn't respond on mobile

**Solutions:**
1. Ensure using actual mobile device (not just browser emulation)
2. Try with different browser
3. Check touch event handlers registered
4. Clear browser cache and reload

---

## 🚀 Production Deployment Readiness

Based on E2E testing:

✅ **Ready for Production IF:**
- [ ] Manual testing completed successfully
- [ ] All checkboxes in checklist above checked
- [ ] No critical errors found
- [ ] Performance acceptable on target devices
- [ ] Mobile testing passed
- [ ] Authentication flow verified
- [ ] Error handling tested

⏳ **Before Deploying:**
1. Run integration tests: `node test-spatial-viewer-integration.mjs`
2. Verify all manual tests pass
3. Test on real 3D model (not demo)
4. Load test with many markers (500+)
5. Cross-browser testing

---

## 📞 Support & Issues

For issues encountered during manual testing:

1. **Check browser console** (F12) for error messages
2. **Check server logs** in terminal running `npm run dev`
3. **Review SPATIAL_VIEWER_TEST_RESULTS.md** for architecture details
4. **Run integration tests** to verify components: `node test-spatial-viewer-integration.mjs`
5. **Check Supabase dashboard** for database errors

---

**Test Date:** January 5, 2026
**Spatial Viewer Version:** Phase 3 (Complete)
**Status:** ✅ Ready for Manual E2E Testing
