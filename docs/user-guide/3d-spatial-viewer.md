# 3D Spatial Viewer - User Guide

**Version:** 1.0
**Last Updated:** January 2, 2026

---

## Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Uploading BIM Models](#uploading-bim-models)
4. [Navigating the 3D Model](#navigating-the-3d-model)
5. [Working with Markers](#working-with-markers)
6. [Attaching Content to Markers](#attaching-content-to-markers)
7. [Filtering and Searching Markers](#filtering-and-searching-markers)
8. [Using Floor Plans (2D Fallback)](#using-floor-plans-2d-fallback)
9. [Client Portal View](#client-portal-view)
10. [Offline Mode](#offline-mode)
11. [Onboarding Tutorial](#onboarding-tutorial)
12. [Troubleshooting](#troubleshooting)
13. [FAQ](#faq)

---

## Introduction

The 3D Spatial Viewer allows you to visualize your construction project in 3D by uploading BIM/IFC models and placing spatial markers (issues, notes, photos, inspections) directly onto the model. Team members can collaborate in real-time, and clients can view progress through the read-only client portal.

**Key Features:**
- Upload and view BIM/IFC files with automatic XKT conversion
- Place markers with photos, files, and notes
- Link markers to tasks, phases, and materials
- Search and filter markers by type, status, floor, or task
- Real-time collaboration with live updates
- Offline support for job sites with poor connectivity
- Client portal with read-only access
- 2D floor plan fallback when 3D models aren't available

---

## Getting Started

### System Requirements

**Recommended:**
- Modern web browser (Chrome 90+, Safari 15+, Edge 90+, Firefox 88+)
- 4GB RAM minimum (8GB recommended for large models)
- GPU with WebGL 2.0 support
- Stable internet connection (10+ Mbps for model uploads)

**Mobile/Tablet:**
- iOS 14+ (iPad Pro recommended for large models)
- Android 10+ with Chrome browser
- 2GB RAM minimum

### Supported File Formats

**3D Models:**
- IFC (.ifc) files up to 500MB
- Automatically converted to optimized XKT format

**Floor Plans:**
- PNG, JPG, JPEG (.png, .jpg, .jpeg)
- PDF (.pdf) up to 50MB per file

**Attachments:**
- Photos: PNG, JPG, JPEG up to 20MB
- Files: PDF, DOCX, XLSX, TXT up to 50MB

### Accessing the Viewer

1. Navigate to **Projects** in the main menu
2. Click on a project to open the project detail page
3. Click the **3D Model** tab
4. If no model is uploaded, you'll see an upload prompt

[Screenshot: Project detail page with 3D Model tab highlighted]

---

## Uploading BIM Models

### Step-by-Step Upload

1. **Navigate to the 3D Model tab** in your project
2. **Click "Upload IFC Model"** button
3. **Drag and drop** your .ifc file or **click to browse**
4. **Wait for upload** - progress bar shows upload status
5. **Automatic conversion** - IFC is converted to optimized XKT format (this may take several minutes for large models)
6. **View your model** - automatically loads when conversion is complete

[Screenshot: IFC upload dialog with drag-and-drop area]

### Upload Tips

- **File size limit:** 500MB maximum
- **Conversion time:** Typically 1-5 minutes depending on model complexity
- **Multiple versions:** You can upload new versions; only one can be active at a time
- **Background processing:** You can navigate away during conversion; you'll be notified when ready

### Model Management

**Activating a Model:**
- Only one model version can be active at a time
- Click **Manage Models** → Select version → Click **Set Active**

**Viewing Model Stats:**
- Element count
- Bounding box dimensions
- Processing status
- File size

[Screenshot: Model management panel showing version list]

---

## Navigating the 3D Model

### Mouse Controls (Desktop)

| Action | Control |
|--------|---------|
| **Rotate** | Left-click + drag |
| **Pan** | Right-click + drag |
| **Zoom** | Scroll wheel or pinch |
| **Select element** | Single left-click on element |
| **Reset view** | Click "Reset Camera" button |

### Touch Controls (Mobile/Tablet)

| Action | Control |
|--------|---------|
| **Rotate** | One finger drag |
| **Pan** | Two finger drag |
| **Zoom** | Pinch to zoom in/out |
| **Select element** | Tap on element |

### Camera Toolbar

[Screenshot: Viewer toolbar with camera control buttons]

**Preset Views:**
- **Front View:** Look at model from front
- **Top View:** Overhead orthographic view
- **Side View:** Look at model from side
- **Isometric:** Default 3D perspective

**Camera Controls:**
- **Fit to View:** Frame entire model in viewport
- **Reset Camera:** Return to initial position
- **Orthographic/Perspective Toggle:** Switch projection modes
- **Section Planes:** (Advanced) Cut through model to see interior

### Level of Detail (LOD)

The viewer automatically adjusts model quality based on:
- Distance from camera (far objects render at lower detail)
- Device performance (mobile devices use lower LOD)
- Available memory

You can manually override in **Settings → Performance**.

---

## Working with Markers

### Marker Types

| Type | Icon | Use Case |
|------|------|----------|
| **Issue** | ⚠️ | Problems requiring attention (defects, conflicts) |
| **Note** | 📝 | General observations or comments |
| **Photo** | 📷 | Progress documentation |
| **Inspection** | 🔍 | Quality checks, inspections |
| **RFI** | ❓ | Request for Information |
| **Safety** | 🦺 | Safety concerns or incidents |
| **Material** | 📦 | Material delivery or location tracking |
| **Progress** | ✅ | Milestone completion markers |

### Placing a Marker

1. **Click "Place Marker"** button in toolbar
2. **Click on the model** at the desired location
3. **Fill in marker details:**
   - Title (required)
   - Type (issue, note, photo, etc.)
   - Description
   - Link to task or phase (optional)
4. **Click "Create Marker"**

[Screenshot: Marker placement mode with click indicator]

### Marker Details

**Viewing Marker Details:**
- Click on a marker pin in the 3D view
- Or select from marker list panel

**Marker Information:**
- Title and description
- Type and status
- Created by and timestamp
- Linked task/phase
- Attached floor and room (if detected)
- IFC element details (if placed on element)

[Screenshot: Marker detail panel showing all information]

### Editing Markers

**Who Can Edit:**
- Marker creator
- Project Manager or GC Admin

**How to Edit:**
1. Click marker to open detail panel
2. Click **Edit** button
3. Update title, description, status, or type
4. Click **Save**

### Deleting Markers

**Who Can Delete:**
- Marker creator
- GC Admin only

**How to Delete:**
1. Click marker to open detail panel
2. Click **Delete** button (trash icon)
3. Confirm deletion

**Warning:** Deleting a marker also deletes all attached photos, files, and notes.

---

## Attaching Content to Markers

### Adding Photos

1. **Open marker detail panel**
2. **Click "Photos" tab**
3. **Click "Upload Photos"** or drag and drop
4. **Select one or multiple photos** (up to 10 at once)
5. **Add captions** (optional)
6. **Click "Upload"**

**Photo Features:**
- Automatic thumbnail generation
- EXIF data extraction (GPS, camera, timestamp)
- Photo gallery with zoom
- Download original quality

[Screenshot: Photo gallery view with thumbnails]

### Adding Files

1. **Open marker detail panel**
2. **Click "Files" tab**
3. **Click "Upload Files"**
4. **Select file** (PDF, DOCX, XLSX, TXT up to 50MB)
5. **Click "Upload"**

**Supported File Types:**
- PDF documents
- Microsoft Word (.docx)
- Microsoft Excel (.xlsx)
- Text files (.txt)

[Screenshot: File list with download buttons]

### Adding Notes

1. **Open marker detail panel**
2. **Click "Notes" tab**
3. **Click "Add Note"**
4. **Type your note** (supports plain text or Markdown)
5. **Click "Save"**

**Note Features:**
- Markdown formatting support
- Timestamped activity log
- Edit history
- @mentions (coming soon)

[Screenshot: Note editor with Markdown preview]

### Activity Timeline

The **Activity** tab shows a chronological log of all actions:
- Marker created
- Photos/files uploaded
- Notes added
- Status changes
- Task linked/unlinked

[Screenshot: Activity timeline with timestamped events]

---

## Filtering and Searching Markers

### Quick Filters

**By Type:**
- Click filter buttons in toolbar to show/hide marker types
- Example: Hide all "Photo" markers, show only "Issue" and "RFI"

**By Status:**
- Open
- In Progress
- Resolved
- Closed

[Screenshot: Filter toolbar with type and status buttons]

### Advanced Filters

**Filter Panel (click "Filters" button):**
- **Floor:** Filter by building floor
- **Phase:** Filter by project phase
- **Task:** Filter by linked task
- **Created By:** Filter by team member
- **Date Range:** Filter by creation date

### Search

**Search Bar:**
- Type to search marker titles and descriptions
- Real-time results as you type
- Highlights matching markers in 3D view

**Search Tips:**
- Use keywords like "plumbing" or "electrical"
- Search for task names to find linked markers
- Search by creator name

[Screenshot: Search results highlighting markers]

### Marker Clustering

When many markers are close together:
- Automatically groups into clusters
- Shows count badge (e.g., "5")
- Click cluster to zoom in and expand

**Cluster Settings:**
- Enable/disable in Settings → Display
- Adjust cluster radius
- Customize cluster appearance

---

## Using Floor Plans (2D Fallback)

If you don't have a 3D BIM model yet, you can use 2D floor plans.

### Uploading Floor Plans

1. **Click "Upload Floor Plan"** in the 3D Model tab
2. **Select floor** (e.g., "Ground Floor", "First Floor")
3. **Drag and drop** PNG, JPG, or PDF file
4. **Click "Upload"**
5. **Repeat for additional floors**

[Screenshot: Floor plan upload dialog with floor selector]

### Navigating Floor Plans

**Controls:**
- **Pan:** Click and drag
- **Zoom:** Scroll wheel or pinch
- **Rotate:** (Optional) Rotate button for alignment

**Floor Switcher:**
- Dropdown menu to switch between floors
- Shows marker count per floor

[Screenshot: Floor plan viewer with pan/zoom controls]

### Placing Markers on Floor Plans

1. **Click "Place Marker"** button
2. **Click on floor plan** at desired location
3. Marker is placed with 2D coordinates (z = floor index)
4. Automatically links to selected floor

### Measurement Tool

**Measuring Distances:**
1. Click **Ruler** icon in toolbar
2. Click first point on floor plan
3. Click second point
4. Distance displayed in feet/meters

**Measurement Tips:**
- Calibrate scale for accuracy: Set known dimension
- Measurements saved with marker notes

[Screenshot: Measurement ruler showing distance between two points]

---

## Client Portal View

Clients can view projects in read-only mode at: `/app/client/{projectId}/spatial`

### Client Portal Features

**What Clients Can See:**
- 3D model or floor plans
- Markers flagged as "Client Visible"
- Photos and progress documentation
- Activity timeline

**What Clients Cannot Do:**
- Create, edit, or delete markers
- Upload files
- Change model settings
- See internal notes (unless flagged visible)

[Screenshot: Client portal view with "Client View" badge]

### Requesting Information (Client)

**As a Client:**
1. **Click on a marker** to view details
2. **Click "Request Information"** button
3. **Type your question or comment**
4. **Click "Send"**
5. PM/GC receives notification and can respond

**Client Notes:**
- Flagged with "Client Note" badge
- Marked as "Requires Response"
- Tracked in project activity log

[Screenshot: Client information request dialog]

### Sharing with Clients

**As PM/GC:**
1. **Open marker detail panel**
2. **Toggle "Client Visible"** switch
3. Marker now appears in client portal

**Best Practices:**
- Only share resolved issues or positive progress
- Add client-friendly descriptions
- Ensure photos are presentable

---

## Offline Mode

The 3D Spatial Viewer supports offline use for job sites with poor connectivity.

### How Offline Mode Works

**Automatic Caching:**
- Active 3D model cached on first view
- All markers and content cached
- Changes saved locally, synced when online

**Offline Indicator:**
- Yellow banner: "You are offline. Changes will sync when reconnected."
- Sync status icon in toolbar

[Screenshot: Offline banner with sync pending indicator]

### Working Offline

**What You Can Do Offline:**
- View cached 3D model
- View existing markers
- Create new markers (synced later)
- Add notes (synced later)
- Upload photos (synced later)

**What Requires Online:**
- Upload new IFC models
- Download files from other users
- Receive real-time updates
- View unread notifications

### Syncing Changes

**Automatic Sync:**
- When connection restored, changes auto-sync in background
- Sync progress shown in notification

**Manual Sync:**
- Click "Sync Now" button in offline banner
- Force refresh to check for conflicts

**Conflict Resolution:**
- If same marker edited offline by multiple users
- Dialog shows both versions
- Choose which to keep or merge manually

[Screenshot: Conflict resolution dialog with side-by-side comparison]

---

## Onboarding Tutorial

First-time users see an interactive tutorial when opening the 3D Spatial Viewer.

### Tutorial Steps

**Step 1: Welcome**
- Overview of 3D Spatial Viewer capabilities
- Click "Next" to continue or "Skip Tutorial"

**Step 2: Camera Controls**
- Highlights camera toolbar
- Prompts user to try rotating, panning, zooming
- Shows keyboard shortcuts

**Step 3: Placing Markers**
- Highlights "Place Marker" button
- Guides user through placing first marker
- Explains marker types

**Step 4: Attaching Content**
- Shows how to add photos, files, notes
- Demonstrates activity timeline

**Step 5: Filtering**
- Introduces filter toolbar
- Explains search functionality
- Shows marker clustering

**Step 6: Completion**
- Summary of key features
- Link to full user guide
- "Show Tutorial Again" option in Settings

[Screenshot: Onboarding tutorial overlay highlighting camera controls]

### Accessing Tutorial Again

**Menu → Help → Show Tutorial**

Or click **"?"** icon in viewer toolbar → **"Restart Tutorial"**

---

## Troubleshooting

### Model Upload Issues

**Problem:** Upload fails or gets stuck
**Solutions:**
- Check file size (must be under 500MB)
- Verify file is .ifc format
- Refresh page and try again
- Check internet connection stability
- Contact support if error persists

**Problem:** Conversion takes too long
**Solutions:**
- Large/complex models may take 10-15 minutes
- Check conversion status in Model Management panel
- If stuck for over 30 minutes, contact support

### Viewer Performance Issues

**Problem:** Viewer is slow or laggy
**Solutions:**
- Close other browser tabs
- Reduce model quality: Settings → Performance → LOD "Low"
- Disable marker clustering if many markers
- Try orthographic view instead of perspective
- Use a device with better GPU (WebGL 2.0 required)

**Problem:** Model doesn't load
**Solutions:**
- Refresh the page (Ctrl+R / Cmd+R)
- Clear browser cache
- Check if model is "Active" in Model Management
- Verify conversion status is "Ready"

### Marker Issues

**Problem:** Can't place marker
**Solutions:**
- Ensure you clicked "Place Marker" button first
- Click directly on model surface (not empty space)
- If in 2D mode, ensure floor plan is loaded
- Check if you have permission (company member role)

**Problem:** Marker doesn't appear
**Solutions:**
- Check filters - may be hidden by type/status filter
- Verify marker is on current floor (if using floor filter)
- Refresh page to fetch latest markers
- Check if marker was deleted

### Offline Sync Issues

**Problem:** Changes not syncing
**Solutions:**
- Check internet connection
- Click "Sync Now" manually
- Verify you're logged in (session may have expired)
- Check browser console for errors (F12 → Console)

**Problem:** Sync conflict
**Solutions:**
- Choose which version to keep in conflict dialog
- If unsure, export your changes as notes first
- Contact team member to coordinate

### Client Portal Issues

**Problem:** Client can't see markers
**Solutions:**
- Verify marker is toggled "Client Visible"
- Check client has correct project access link
- Ensure client is logged in with correct account
- Refresh client portal page

---

## FAQ

### General

**Q: Can I use the 3D Viewer on mobile?**
A: Yes, but performance depends on device. iPad Pro or high-end Android tablets recommended for large models. Phones work for smaller models and floor plans.

**Q: Do I need special software to view IFC files?**
A: No, GenHub automatically converts IFC to optimized web format (XKT). Just upload your .ifc file.

**Q: Can I export the 3D model?**
A: Currently, you can download the original IFC file from Model Management. Exporting with markers is planned for a future update.

### Models

**Q: How many model versions can I upload?**
A: Unlimited versions per project. Only one can be "Active" at a time. Older versions remain accessible.

**Q: What if my IFC file is over 500MB?**
A: Contact support for enterprise file upload. We can accommodate larger models with special processing.

**Q: Can I upload other formats like Revit (.rvt)?**
A: Only IFC is currently supported. Export your Revit model to IFC format first.

### Markers

**Q: How many markers can I create?**
A: No hard limit. Performance may degrade with 1,000+ markers on older devices. Use filtering to manage large marker sets.

**Q: Can I link a marker to multiple tasks?**
A: Currently, one task per marker. You can add related task references in notes.

**Q: Can I move a marker after placing it?**
A: Not yet. You can delete and recreate, or edit the description to note the correction.

### Collaboration

**Q: Do changes appear in real-time?**
A: Yes, when online. Markers, photos, and notes sync automatically. Other users see updates within seconds.

**Q: Can I see who's viewing the model?**
A: Active user presence is planned for a future update.

**Q: How do I notify team members about a marker?**
A: Link the marker to a task and assign to a team member. They'll receive a notification. Direct @mentions coming soon.

### Offline & Performance

**Q: How much data is cached offline?**
A: Active model + all markers + recent photos (up to 500MB total). Older content fetched when online.

**Q: Can I clear the cache?**
A: Yes, Settings → Storage → Clear Cached Model Data. This removes offline data but keeps markers in database.

**Q: Why is my battery draining fast?**
A: 3D rendering is GPU-intensive. Reduce LOD quality, use 2D floor plans, or enable power-saving mode.

---

## Need Help?

**Support:**
- Email: support@genhub.app
- In-app chat: Click "?" icon → "Contact Support"
- Knowledge Base: https://docs.genhub.app

**Feedback:**
- Send feature requests: Menu → Feedback
- Report bugs: Click "Report Issue" in error dialogs

---

**Document Version:** 1.0
**Last Updated:** January 2, 2026
**Applies to:** GenHub PWA v2.0+
