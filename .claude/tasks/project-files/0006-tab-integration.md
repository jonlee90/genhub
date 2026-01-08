# Task 0006: Tab Integration (Modify ProjectDetailContent)

## Status
- **Phase**: 6 - Frontend Integration
- **Agent**: agent-frontend-engineer
- **Estimated Effort**: 2-3 hours
- **Dependencies**: Tasks 0004 & 0005 (Photo & Document Components)
- **Approved**: DRAFT

---

## Overview

Integrate the Files & Photos tab into the existing ProjectDetailContent component, update project page to fetch files/photos data, and add tab badge count.

---

## Objectives

1. Modify `ProjectDetailContent.tsx` to add Files & Photos tab
2. Update `/app/app/projects/[id]/page.tsx` to fetch files and photos
3. Add tab badge count showing total files + photos
4. Test tab navigation and data flow
5. Ensure loading states work correctly

---

## Requirements Reference

- **Design**: Tab Integration section
- **REQ-2**: Photo Gallery & Organization
- **REQ-5**: Document Categorization & Folder Structure
- **REQ-6**: File Search & Filtering

---

## Files to Modify

### File 1: ProjectDetailContent.tsx
- **Path**: `components/projects/ProjectDetailContent.tsx`
- **Purpose**: Add Files & Photos tab to existing tab navigation

### File 2: Project Detail Page
- **Path**: `app/app/projects/[id]/page.tsx`
- **Purpose**: Fetch files/photos data and pass to ProjectDetailContent

---

## Implementation Details

### Modification 1: ProjectDetailContent.tsx

**Read first**: `/Users/jonathanlee/Desktop/genhub/components/projects/ProjectDetailContent.tsx`

**Changes required**:

1. **Import ProjectFilesTab component**:
```tsx
import { ProjectFilesTab } from './files/ProjectFilesTab';
```

2. **Update activeTab type** (around line 95):
```tsx
const [activeTab, setActiveTab] = useState<
  'overview' | 'team' | 'tasks' | 'files' | 'settings'
>('overview');
```

3. **Add props interface update** (around line 47):
```tsx
interface ProjectDetailContentProps {
  project: any;
  projects: Array<{...}>;
  teamMembers: Array<{...}>;
  phaseTaskStats: PhaseStats[];
  taskDependencies?: any[];
  expenseStats?: ExpenseStats;
  taskStats?: TaskStats;
  activeModel?: any;
  userRole?: string;
  // NEW: Files & Photos data
  projectFiles?: any[];
  projectPhotos?: any[];
}
```

4. **Add tab button** (after Tasks tab, before Settings tab - around line 250):
```tsx
{/* Files & Photos Tab */}
<button
  onClick={() => setActiveTab('files')}
  className={cn(
    'flex items-center gap-2 px-4 py-2 border-b-2 transition-colors',
    activeTab === 'files'
      ? 'border-construction-blue text-construction-blue'
      : 'border-transparent text-gray-600 hover:text-construction-blue'
  )}
>
  <FolderOpen className="h-4 w-4" />
  <span className="font-medium">Files & Photos</span>
  {((projectFiles?.length || 0) + (projectPhotos?.length || 0)) > 0 && (
    <Badge variant="secondary" className="ml-1">
      {(projectFiles?.length || 0) + (projectPhotos?.length || 0)}
    </Badge>
  )}
</button>
```

5. **Add import for FolderOpen icon** (at top with other imports):
```tsx
import { ..., FolderOpen } from 'lucide-react';
```

6. **Add tab content panel** (after Tasks tab content, before Settings - around line 450):
```tsx
{/* Files & Photos Tab Content */}
{activeTab === 'files' && (
  <motion.div
    key="files"
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    transition={{ duration: 0.2 }}
  >
    <ProjectFilesTab
      projectId={project.id}
      initialFiles={projectFiles || []}
      initialPhotos={projectPhotos || []}
    />
  </motion.div>
)}
```

### Modification 2: Project Detail Page

**Read first**: `/Users/jonathanlee/Desktop/genhub/app/app/projects/[id]/page.tsx`

**Changes required**:

1. **Import Server Actions** (at top):
```tsx
import { getProjectFiles } from '@/app/actions/project-files';
import { getProjectPhotosWithReceipts } from '@/app/actions/project-photos';
```

2. **Fetch files and photos data** (in main component function, after existing data fetches):
```tsx
// Fetch project files
const filesResult = await getProjectFiles(projectId);
const projectFiles = filesResult.data || [];

// Fetch project photos (with receipt aggregation)
const photosResult = await getProjectPhotosWithReceipts(projectId, {
  showReceipts: true, // Include task/expense receipts
});
const projectPhotos = photosResult.data || [];

console.log('[ProjectDetailPage] Loaded files:', projectFiles.length);
console.log('[ProjectDetailPage] Loaded photos:', projectPhotos.length);
```

3. **Pass to ProjectDetailContent component** (update props):
```tsx
<ProjectDetailContent
  project={project}
  projects={projects}
  teamMembers={teamMembers}
  phaseTaskStats={phaseTaskStats}
  taskDependencies={taskDependencies}
  expenseStats={expenseStats}
  taskStats={taskStats}
  activeModel={activeModel}
  userRole={userRole}
  // NEW: Files & Photos data
  projectFiles={projectFiles}
  projectPhotos={projectPhotos}
/>
```

---

## Acceptance Criteria

- [x] Files & Photos tab button appears in ProjectDetailContent navigation
- [x] Tab badge shows total count of files + photos (only if > 0)
- [x] Clicking tab switches to ProjectFilesTab component
- [x] Project page fetches files and photos on load
- [x] Data passes correctly to ProjectFilesTab via props
- [x] Tab navigation animations work smoothly
- [x] Loading state shows while fetching data
- [x] Error handling displays if fetch fails

---

## Testing Checklist

```bash
# 1. Test tab appears
# Navigate to /app/projects/[id]
# Verify "Files & Photos" tab visible between Tasks and Settings

# 2. Test tab badge count
# Upload 3 files + 2 photos
# Verify badge shows "5"

# 3. Test tab switching
# Click Files & Photos tab
# Verify ProjectFilesTab renders
# Verify sub-navigation (Photos | Documents) works

# 4. Test data flow
# Console log shows correct counts:
# "[ProjectDetailPage] Loaded files: 3"
# "[ProjectDetailPage] Loaded photos: 2"

# 5. Test error handling
# Temporarily break getProjectFiles query
# Verify error toast shown, tab still renders (empty state)
```

---

## Error Handling

### Graceful Degradation

If file/photo fetches fail:
```tsx
// In page.tsx
const filesResult = await getProjectFiles(projectId);
const projectFiles = filesResult.error ? [] : (filesResult.data || []);

const photosResult = await getProjectPhotosWithReceipts(projectId, { showReceipts: true });
const projectPhotos = photosResult.error ? [] : (photosResult.data || []);

if (filesResult.error) {
  console.warn('[ProjectDetailPage] Failed to load files:', filesResult.error);
}
if (photosResult.error) {
  console.warn('[ProjectDetailPage] Failed to load photos:', photosResult.error);
}

// Tab still renders with empty arrays, showing empty state
```

---

## Notes

- **Tab Order**: Overview → Team → Tasks → **Files & Photos** → Settings
- **Badge Count**: Only show if total > 0 (to avoid clutter)
- **Icon**: Use `FolderOpen` from lucide-react
- **Animation**: Use existing Framer Motion pattern from other tabs
- **Receipt Aggregation**: Enabled by default via `showReceipts: true`
- **Data Refresh**: Tab content fetches fresh data on filter change (handled in ProjectFilesTab)

---

## References

- **Existing Tab Pattern**: `ProjectDetailContent.tsx` lines 200-300 (tab navigation)
- **Existing Tab Content**: `ProjectDetailContent.tsx` lines 400-500 (tab panels)
- **Design Document**: `.claude/docs/design/project-files-upload.md` (Tab Integration section)
- **UI Rules**: `.claude/docs/law/UI_RULES.md`

---

**END OF TASK 0006**
