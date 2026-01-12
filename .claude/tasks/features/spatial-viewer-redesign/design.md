# Spatial Viewer Redesign - Technical Design

## Overview

Mobile-first redesign of the 3D Spatial Viewer components in `components/projects/spatial/` to follow PWA design principles. This design preserves all existing Phase 3 marker functionality while implementing bottom sheets, FAB patterns, and responsive breakpoint behavior.

## Requirements Reference

See: `.claude/tasks/features/spatial-viewer-redesign/requirement.md`

---

## Architecture Overview

### Component Hierarchy

```
ProjectOverview.tsx (Server Component)
  |
  +-- SpatialViewerSection (existing section wrapper)
        |
        +-- SpatialViewer.tsx [REDESIGN] (Client Component - Main Container)
              |
              +-- ThreeDViewerCanvas (existing - unchanged)
              +-- ModelLoader (existing - unchanged)
              +-- CameraControls (existing - unchanged)
              +-- LODManager (existing - unchanged)
              +-- InteractionLayer (existing - unchanged)
              |
              +-- ViewerToolbar.tsx [REDESIGN]
              |     |-- Mobile: BottomBar (fixed, h-14, safe-area)
              |     +-- Desktop: Floating panel (top-right)
              |
              +-- MarkerFilterSheet.tsx [NEW]
              |     |-- Mobile: BottomSheet (30%, 60%, 90% snap)
              |     +-- Desktop: Collapsible side panel (left)
              |
              +-- MarkerListSheet.tsx [NEW]
              |     |-- Mobile: BottomSheet (30%, 60%, 90% snap)
              |     +-- Desktop: Collapsible side panel (right)
              |
              +-- MarkerFAB.tsx [NEW]
              |     |-- Mobile: FAB with expandable options
              |     +-- Desktop: Hidden (use toolbar)
              |
              +-- Empty3DState.tsx [REDESIGN]
              +-- LoadingOverlay.tsx [REDESIGN]
              +-- WebGLFallback.tsx [NEW]
              |
              +-- SpatialMarkerPin (existing - unchanged)
              +-- SpatialMarkerContextMenu (existing - unchanged)
              +-- TaskLinker (existing - unchanged)
              +-- MarkerCreationModal (existing - unchanged)
              +-- TaskDetailPanel (existing - unchanged)
```

### Mobile-First Approach

```
DESIGN PRINCIPLE:
- Design for 375px first (iPhone SE)
- Enhance for tablet (768px+)
- Optimize for desktop (1024px+)

BREAKPOINTS:
- Mobile:  < 768px  -> Bottom sheets, FAB, compact toolbar
- Tablet:  768-1024px -> Side panels, larger touch targets
- Desktop: > 1024px -> Current layout with refinements
```

### Data Flow

```
+------------------+      +-------------------+
| Server Component |----->| SpatialViewer     |
| (fetch markers,  |      | (client state,    |
|  project data)   |      |  user interactions)|
+------------------+      +-------------------+
                                  |
          +-------+-------+-------+-------+
          |       |       |       |       |
          v       v       v       v       v
     Toolbar  FilterSheet ListSheet  FAB  Viewer
          |       |       |       |       |
          +-------+-------+-------+-------+
                          |
                          v
                 Server Actions
                 (getMarkersByProject,
                  createMarker, etc.)
```

---

## Component Specifications

### 1. SpatialViewer.tsx [REDESIGN]

**Purpose:** Main container that orchestrates all spatial viewer sub-components with responsive layout.

**Key Changes:**
- Replace fixed height with `100dvh` minus safe areas
- Add responsive layout switching via `useIsMobile()` hook
- Add state management for bottom sheet visibility
- Add FAB visibility state
- Throttle render to 30 FPS on mobile (existing)

**Layout Structure:**

```
MOBILE (< 768px):
+------------------------------------------+
|  [Viewer Canvas - Full Screen]           |
|                                          |
|  +------+                    +--------+  |
|  |Filter|                    | FAB    |  |
|  |Icon  |                    | (+)    |  |
|  +------+                    +--------+  |
|                                          |
|  [Bottom Toolbar - 56px + safe-area]     |
+------------------------------------------+

TABLET (768-1024px):
+------------------------------------------+
|  [Side Panel]   [Viewer Canvas]          |
|  [Filters  ]                             |
|  [Collapsed]                    [Toolbar]|
|                                 [Panel  ]|
+------------------------------------------+

DESKTOP (> 1024px):
+------------------------------------------+
|  [Filter Panel]  [Viewer Canvas]  [List] |
|  [Left Side  ]                    [Panel]|
|                            [Toolbar      |
|                             Top-Right]   |
+------------------------------------------+
```

---

### 2. ViewerToolbar.tsx [REDESIGN]

**Purpose:** Interaction mode controls (pan, rotate, zoom, measure, section) with responsive positioning.

**Mobile Behavior:**
- Fixed bottom bar (above safe area)
- Horizontal button row
- 44px touch targets
- Active state feedback

**Desktop Behavior:**
- Floating panel top-right (existing)
- Vertical button column
- Keyboard shortcuts visible

**Visual Spec:**

```
MOBILE BOTTOM BAR:
+----------------------------------------------------+
| [Pan] [Rotate] [Zoom] [Measure] [Section] [Camera] |
|  44px   44px    44px    44px      44px      44px   |
+----------------------------------------------------+
| Safe Area Padding: env(safe-area-inset-bottom)     |
+----------------------------------------------------+

Touch Feedback:
- active:scale-[0.98]
- active:bg-construction-blue/10
- transition-transform duration-100
```

---

### 3. MarkerFilterSheet.tsx [NEW]

**Purpose:** Replace MarkerFilterPanel with bottom sheet on mobile, side panel on desktop.

**Mobile Implementation:**
- Uses existing `BottomSheetModal` component
- Snap points: 30%, 60%, 90%
- Drag handle for gesture control
- Trigger button positioned bottom-left over viewer

**Content Structure:**
```
+----------------------------------+
| [Drag Handle]                    |
+----------------------------------+
| FILTERS          [Clear] [Close] |
+----------------------------------+
| Marker Types                     |
| [x] Issues (5)  [x] Notes (3)    |
| [x] Safety (2)  [x] Progress (1) |
+----------------------------------+
| Status                           |
| [Open] [In Progress] [Resolved]  |
+----------------------------------+
| Special                          |
| [Tasks with Locations]           |
| [Tasks with Materials]           |
+----------------------------------+
```

---

### 4. MarkerListSheet.tsx [NEW]

**Purpose:** Scrollable list of markers in a bottom sheet on mobile.

**Mobile Implementation:**
- Uses existing `BottomSheetModal` component
- Snap points: 30%, 60%, 90%
- Search input at top (sticky)
- Grouped by marker type (collapsible sections)
- Virtual scrolling for 50+ markers

**Content Structure:**
```
+----------------------------------+
| [Drag Handle]                    |
+----------------------------------+
| MARKERS                  [Close] |
+----------------------------------+
| [Search markers...]              |
+----------------------------------+
| Issues (5)               [v]     |
|   - Foundation crack             |
|   - Window leak                  |
+----------------------------------+
| Notes (3)                [v]     |
|   - Plumbing inspection          |
+----------------------------------+
| [More sections...]               |
+----------------------------------+
```

---

### 5. MarkerFAB.tsx [NEW]

**Purpose:** Floating action button for quick marker creation on mobile.

**Behavior:**
- Visible only on mobile (< 768px)
- Position: bottom-right, above toolbar
- Collapsed: Single button with "+" icon
- Expanded: Stacked options (Issue, Note, Safety, Progress)
- Animation: Staggered reveal (50ms per option)

**Visual Spec:**
```
COLLAPSED:
    +-------+
    |  +    |  56px x 56px
    +-------+

EXPANDED:
    +-------+
    | Issue |  <- 44px touch target
    +-------+
    | Note  |
    +-------+
    | Safety|
    +-------+
    | Prog  |
    +-------+
    |   X   |  <- Close/collapse
    +-------+
```

---

### 6. Empty3DState.tsx [REDESIGN]

**Purpose:** Upload CTA when no model exists.

**Mobile Changes:**
- Simplify to single large CTA button
- Remove feature grid (too complex for mobile)
- Full-width button (min-height: 56px)
- Clear "Upload IFC Model" text

**Visual Spec:**
```
MOBILE:
+----------------------------------+
|                                  |
|          [3D Box Icon]           |
|                                  |
|     Upload Your 3D Model         |
|  View your project in immersive  |
|        3D spatial view           |
|                                  |
|  +----------------------------+  |
|  |   [Upload]  UPLOAD MODEL   |  |
|  +----------------------------+  |
|           56px height            |
|                                  |
|      Supports .IFC - Max 500MB   |
+----------------------------------+

DESKTOP: (existing layout, refined)
```

---

### 7. LoadingOverlay.tsx [REDESIGN]

**Purpose:** Mobile-friendly loading states.

**Mobile Changes:**
- Compact overlay (not full modal)
- Position: top-center, below any header
- Progress bar visible
- Cancel button if applicable

**Visual Spec:**
```
MOBILE:
+----------------------------------+
|  [Downloading Model...   45%]   |
|  [=====-----------] [Cancel]    |
+----------------------------------+
    Compact card, not full overlay
```

---

### 8. WebGLFallback.tsx [NEW]

**Purpose:** Mobile-friendly fallback when WebGL not supported.

**Content:**
- Clear message explaining the issue
- Suggestion to use modern browser
- Link to marker list view (non-3D access)

---

## Props Interfaces

### SpatialViewer.tsx

```typescript
// Existing props preserved, new mobile-specific additions
export interface SpatialViewerProps {
  // Existing props (unchanged)
  projectId: string;
  modelHighURL?: string | null;
  modelMediumURL?: string;
  modelLowURL?: string;
  thumbnailURL?: string;
  projectType?: string;
  userRole: string;
  teamMembers?: Array<{ id: string; name: string }>;
  phases?: Array<{ id: string; name: string }>;
  projectTasks?: Array<any>;
  onMarkerPlacement?: (marker: SpatialMarker) => void;
  className?: string;

  // NEW: Mobile-specific props
  /** Force full-screen mode (hides external navigation) */
  fullScreen?: boolean;
  /** Initial bottom sheet state */
  initialSheetOpen?: 'filters' | 'markers' | null;
}
```

### ViewerToolbar.tsx

```typescript
export interface ViewerToolbarProps {
  // Existing props
  viewer: Viewer | null;
  onCameraPreset?: (preset: CameraPreset) => void;
  onInteractionMode?: (mode: InteractionMode) => void;
  onResetView?: () => void;
  className?: string;

  // NEW: Responsive behavior
  /** Current viewport mode (auto-detected internally) */
  // Uses useIsMobile() hook internally
}

// Toolbar button config (internal)
interface ToolbarButton {
  mode: InteractionMode;
  icon: LucideIcon;
  label: string;
  shortcut?: string; // Desktop only
  ariaLabel: string;
}
```

### MarkerFilterSheet.tsx

```typescript
export interface MarkerFilterSheetProps {
  /** Whether the sheet is open */
  isOpen: boolean;
  /** Close handler */
  onClose: () => void;
  /** Current active filters */
  activeFilters: MarkerFilters;
  /** Filter change handler */
  onFilterChange: (filters: MarkerFilters) => void;
  /** Marker counts by type */
  markerCounts: MarkerCounts;
  /** Clear all filters handler */
  onClearFilters?: () => void;
}

// Re-export from existing MarkerFilterPanel
export interface MarkerFilters {
  markerTypes?: string[];
  statuses?: string[];
  priorities?: string[];
  phaseId?: string;
  hasTask?: boolean;
  hasMaterials?: boolean;
}

export interface MarkerCounts {
  issue: number;
  note: number;
  safety: number;
  milestone: number;
}
```

### MarkerListSheet.tsx

```typescript
export interface MarkerListSheetProps {
  /** Whether the sheet is open */
  isOpen: boolean;
  /** Close handler */
  onClose: () => void;
  /** Markers to display */
  markers: SpatialMarker[];
  /** Loading state */
  isLoading?: boolean;
  /** Marker click handler (navigates camera) */
  onMarkerClick: (marker: SpatialMarker) => void;
  /** Search query (controlled) */
  searchQuery: string;
  /** Search change handler */
  onSearchChange: (query: string) => void;
  /** Group markers by type */
  groupByType?: boolean;
}
```

### MarkerFAB.tsx

```typescript
export interface MarkerFABProps {
  /** Whether FAB is expanded */
  isExpanded: boolean;
  /** Toggle expanded state */
  onToggle: () => void;
  /** Marker type selection handler */
  onSelectType: (type: 'issue' | 'note' | 'safety' | 'progress') => void;
  /** Whether marker creation is allowed */
  canCreate: boolean;
  /** Position offset for avoiding toolbar */
  bottomOffset?: number;
}

// FAB option config (internal)
interface FABOption {
  type: 'issue' | 'note' | 'safety' | 'progress';
  icon: LucideIcon;
  label: string;
  color: string;
  ariaLabel: string;
}
```

### Empty3DState.tsx

```typescript
export interface Empty3DStateProps {
  /** Upload button click handler */
  onUploadClick?: () => void;
  /** Additional class names */
  className?: string;
  /** Compact mode for mobile */
  compact?: boolean;
}
```

### LoadingOverlay.tsx

```typescript
export interface LoadingOverlayProps {
  /** Current loading state */
  state: LoadingState;
  /** Cancel handler (if cancellable) */
  onCancel?: () => void;
  /** Compact mode for mobile */
  compact?: boolean;
  /** Additional class names */
  className?: string;
}

export interface LoadingState {
  stage: 'downloading' | 'parsing' | 'rendering' | 'idle';
  progress: number; // 0-100
  estimatedTime?: number; // seconds remaining
  cancellable?: boolean;
  message?: string; // Custom message
}
```

### WebGLFallback.tsx

```typescript
export interface WebGLFallbackProps {
  /** Handler for viewing markers in list mode (non-3D) */
  onViewMarkerList?: () => void;
  /** Additional class names */
  className?: string;
}
```

---

## State Management

### SpatialViewer State

```typescript
// Core state (existing, preserved)
const [viewer, setViewer] = useState<Viewer | null>(null);
const [isModelReady, setIsModelReady] = useState(false);
const [error, setError] = useState<Error | null>(null);
const [markers, setMarkers] = useState<SpatialMarker[]>([]);
const [activeFilters, setActiveFilters] = useState<MarkerFilters>({...});

// NEW: Responsive state
const isMobile = useIsMobile();    // < 768px
const isTablet = useIsTablet();    // 768-1024px
const isDesktop = useIsDesktop();  // > 1024px

// NEW: Bottom sheet state
const [activeSheet, setActiveSheet] = useState<'filters' | 'markers' | null>(null);
const [fabExpanded, setFabExpanded] = useState(false);

// Computed
const showFAB = isMobile && canEditMarkers && isModelReady;
const showBottomToolbar = isMobile;
const showSidePanels = isDesktop;
```

### Sheet Management Pattern

```typescript
// Only one sheet open at a time (mobile)
const openFiltersSheet = () => {
  setFabExpanded(false);
  setActiveSheet('filters');
};

const openMarkersSheet = () => {
  setFabExpanded(false);
  setActiveSheet('markers');
};

const closeSheet = () => {
  setActiveSheet(null);
};

// FAB collapses sheets
const toggleFAB = () => {
  if (!fabExpanded) {
    setActiveSheet(null);
  }
  setFabExpanded(!fabExpanded);
};
```

---

## Mobile Breakpoint Strategy

### Breakpoint Definitions

```typescript
// lib/hooks/useMediaQuery.ts (existing)
export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 767px)');
}

export function useIsTablet(): boolean {
  return useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
}

export function useIsDesktop(): boolean {
  return useMediaQuery('(min-width: 1024px)');
}
```

### Responsive Behavior Matrix

| Feature | Mobile (<768px) | Tablet (768-1024px) | Desktop (>1024px) |
|---------|-----------------|---------------------|-------------------|
| Viewer Height | `100dvh - safe areas` | `100vh - header` | Fixed container |
| Toolbar | Bottom bar | Side panel (right) | Floating (top-right) |
| Filters | Bottom sheet | Side panel (left) | Side panel (left) |
| Marker List | Bottom sheet | Side panel (right) | Side panel (right) |
| FAB | Visible | Hidden | Hidden |
| Touch Targets | 44px min | 44px min | 36px standard |
| FPS Throttle | 30 FPS | 60 FPS | 60 FPS |
| Marker Count | Active only | All | All |

### Layout Transitions

```typescript
// Debounced resize handling (150ms)
useEffect(() => {
  const handleResize = debounce(() => {
    // Layout adjustments happen via CSS media queries
    // State adjustments for sheet visibility
    if (!isMobile && activeSheet) {
      setActiveSheet(null); // Close mobile sheets on breakpoint change
    }
  }, 150);

  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
}, [isMobile, activeSheet]);
```

---

## Bottom Sheet Implementation

### Using Existing BottomSheetModal

The redesign will leverage the existing `components/mobile/BottomSheetModal/` component which already provides:

- Spring physics animation
- Drag-to-dismiss gestures
- Multiple snap points (content, half, full)
- Safe area handling
- 44px touch targets
- Backdrop dimming

### Custom Snap Points for Spatial Viewer

```typescript
// New snap point configuration for spatial viewer sheets
export const SPATIAL_SNAP_POINTS = {
  collapsed: 0.30,  // 30% - Minimal view (icon + counts)
  half: 0.60,       // 60% - Comfortable scrolling
  expanded: 0.90,   // 90% - Near full screen
} as const;

export type SpatialSnapPoint = keyof typeof SPATIAL_SNAP_POINTS;
```

### Drag Handle Component (Reuse Existing)

```tsx
// Already implemented in BottomSheetModal
<motion.div
  className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing"
  drag="y"
  dragConstraints={{ top: 0, bottom: 0 }}
  dragElastic={{ top: 0, bottom: 0.3 }}
  onDragStart={handleDragStart}
  onDragEnd={handleDragEnd}
>
  <div className={cn(
    'h-1.5 w-12 rounded-full transition-colors',
    isDragging ? 'bg-gray-400' : 'bg-gray-300'
  )} />
</motion.div>
```

### Gesture Handling

```typescript
// Existing implementation in BottomSheetModal (reuse)
const handleDragEnd = (event: MouseEvent | TouchEvent, info: PanInfo) => {
  const velocity = info.velocity.y;
  const offset = info.offset.y;

  // Fast swipe down = dismiss or snap lower
  if (velocity > 500) {
    if (currentSnapIndex === 0) {
      onClose();
    } else {
      setCurrentSnapIndex(currentSnapIndex - 1);
    }
    return;
  }

  // Fast swipe up = expand
  if (velocity < -500 && currentSnapIndex < snapPoints.length - 1) {
    setCurrentSnapIndex(currentSnapIndex + 1);
    return;
  }

  // Slow drag = snap to nearest
  const threshold = currentHeight * 0.25;
  if (offset > threshold) {
    // Dragged down
    setCurrentSnapIndex(Math.max(0, currentSnapIndex - 1));
  } else if (offset < -threshold) {
    // Dragged up
    setCurrentSnapIndex(Math.min(snapPoints.length - 1, currentSnapIndex + 1));
  }
};
```

---

## Integration Points

### Component Communication

```
+------------------+
|  SpatialViewer   | <-- Central state management
+--------+---------+
         |
    +----+----+----+----+----+
    |    |    |    |    |    |
    v    v    v    v    v    v

[Toolbar]  State: activeMode
           Event: onInteractionMode(mode)

[FilterSheet]  State: activeFilters, isOpen
               Event: onFilterChange(filters)
               Event: onClose()

[MarkerListSheet]  State: markers, searchQuery, isOpen
                   Event: onMarkerClick(marker)
                   Event: onSearchChange(query)
                   Event: onClose()

[FAB]  State: isExpanded, canCreate
       Event: onSelectType(type) -> opens MarkerCreationModal

[ViewerCanvas]  Event: onCanvasClick(position)
                -> Opens context menu (desktop)
                -> FAB handles creation (mobile)
```

### Event Handling for Marker Actions

```typescript
// Marker click flow
const handleMarkerClick = useCallback((marker: SpatialMarker) => {
  // 1. Animate camera to marker position
  if (viewer) {
    flyToMarker(viewer, marker);
  }

  // 2. Close any open sheets (mobile)
  setActiveSheet(null);
  setFabExpanded(false);

  // 3. Show marker details
  if (marker.task_id) {
    setSelectedTaskId(marker.task_id);
    setDetailPanelOpen(true);
  } else {
    toast.info(`${marker.type}: ${marker.title}`);
  }
}, [viewer]);

// Marker creation flow (mobile FAB)
const handleFABSelectType = useCallback((type: MarkerType) => {
  setFabExpanded(false);
  setSelectedMarkerType(type);

  // Enter placement mode - show crosshairs
  setPlacementMode(true);
  toast.info('Tap on the model to place marker');
}, []);

// Marker creation flow (desktop context menu)
// Existing implementation preserved
```

### Camera Navigation

```typescript
// Fly to marker (existing pattern)
const flyToMarker = (viewer: Viewer, marker: SpatialMarker) => {
  const cameraFlight = viewer.plugins.cameraFlight;

  cameraFlight.flyTo({
    eye: [marker.position_x + 5, marker.position_y + 5, marker.position_z + 5],
    look: [marker.position_x, marker.position_y, marker.position_z],
    up: [0, 1, 0],
    duration: 1.0, // seconds
  });
};
```

---

## Styling Specifications

### Safe Area Handling

```tsx
// Bottom toolbar with safe area
<div className={cn(
  'fixed inset-x-0 bottom-0 z-40',
  'bg-white border-t-2 border-gray-200',
  'px-2 pt-2',
  // Safe area padding
  'pb-[max(0.5rem,env(safe-area-inset-bottom))]'
)}>
```

### Touch Targets

```tsx
// 44px minimum touch target
<button className={cn(
  'w-11 h-11', // 44px x 44px
  'flex items-center justify-center',
  'rounded-lg',
  'active:scale-[0.98] active:bg-construction-blue/10',
  'transition-transform duration-100'
)}>
  <Icon className="w-5 h-5" />
</button>
```

### Full-Screen Viewer

```tsx
// Viewer container with dvh units
<div className={cn(
  'relative w-full',
  // Mobile: Full viewport minus safe areas and toolbar
  'h-[calc(100dvh-56px-env(safe-area-inset-bottom))]',
  // Tablet/Desktop: Container height
  'md:h-[600px] lg:h-[800px]'
)}>
```

### Color Tokens

```css
/* Use existing GenHub color tokens */
--construction-blue: #001B51;
--construction-accent: #3C3C3C;
--construction-green: #059669;
--construction-red: #DC2626;
--construction-yellow: #FBBF24;
```

---

## Accessibility Considerations

### ARIA Labels

```tsx
// Toolbar buttons
<button
  aria-label="Pan mode - Move around the model"
  aria-pressed={activeMode === 'pan'}
>

// FAB
<button
  aria-label="Add marker"
  aria-expanded={isExpanded}
  aria-haspopup="menu"
>

// Bottom sheets
<div
  role="dialog"
  aria-modal="true"
  aria-label="Filter markers"
>
```

### Focus Management

```tsx
// Trap focus in open sheets
useEffect(() => {
  if (activeSheet) {
    // Focus first interactive element in sheet
    const firstFocusable = sheetRef.current?.querySelector(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    (firstFocusable as HTMLElement)?.focus();
  }
}, [activeSheet]);
```

### Screen Reader Support

```tsx
// Announce marker counts
<span className="sr-only">
  {markerCounts.issue} issues, {markerCounts.note} notes,
  {markerCounts.safety} safety markers, {markerCounts.milestone} progress markers
</span>
```

---

## Performance Considerations

### Mobile Optimizations (Existing)

```typescript
// Already implemented - preserve these patterns
useEffect(() => {
  if (!viewer) return;

  if (isMobile) {
    // Throttle to 30 FPS on mobile
    (viewer.scene as any).fps = 30;

    // Show only active markers
    setVisibleMarkers(markers.filter(m =>
      m.status === 'open' || m.status === 'in_progress'
    ));
  } else {
    (viewer.scene as any).fps = 60;
    setVisibleMarkers(markers);
  }
}, [viewer, isMobile, markers]);
```

### Virtual Scrolling for Large Lists

```typescript
// For marker lists with 50+ items
import { useVirtualizer } from '@tanstack/react-virtual';

const rowVirtualizer = useVirtualizer({
  count: filteredMarkers.length,
  getScrollElement: () => listRef.current,
  estimateSize: () => 72, // Estimated row height
  overscan: 5,
});
```

---

## Error Handling

| Scenario | Response | User Message |
|----------|----------|--------------|
| WebGL not supported | Show WebGLFallback | "Your browser doesn't support 3D" |
| Model load failure | Show error overlay | "Failed to load model" + retry |
| Marker fetch failure | Toast error | "Couldn't load markers" |
| Network timeout | Progress with ETA | "Loading... ~30s remaining" |

---

## Security Considerations

- All marker operations use existing RLS-protected Server Actions
- No direct Supabase client usage in client components
- Role-based FAB/edit visibility (canEditMarkers check)
- No sensitive data exposure in mobile views

---

## Migration Notes

### Files to Modify

| File | Change Type |
|------|-------------|
| `SpatialViewer.tsx` | Refactor layout, add sheet state |
| `ViewerToolbar.tsx` | Add responsive behavior |
| `MarkerFilterPanel.tsx` | Wrap with sheet on mobile |
| `Empty3DState.tsx` | Add compact mode |
| `LoadingStates.tsx` | Add compact overlay mode |

### New Files to Create

| File | Purpose |
|------|---------|
| `MarkerFilterSheet.tsx` | Mobile bottom sheet wrapper |
| `MarkerListSheet.tsx` | Mobile marker list bottom sheet |
| `MarkerFAB.tsx` | Floating action button |
| `WebGLFallback.tsx` | WebGL unsupported message |

### Files to Preserve (No Changes)

| File | Reason |
|------|--------|
| `ThreeDViewerCanvas.tsx` | Core xeokit integration |
| `ModelLoader.tsx` | Model loading logic |
| `CameraControls.tsx` | Camera manipulation |
| `LODManager.tsx` | Level of detail |
| `InteractionLayer.tsx` | Click detection |
| `SpatialMarkerPin.tsx` | Marker visualization |
| `SpatialMarkerContextMenu.tsx` | Desktop context menu |
| `TaskLinker.tsx` | Task linking modal |
| `MarkerCreationModal.tsx` | Marker creation form |
| `ClientSpatialViewer.tsx` | Client portal (separate) |

---

**Status:** PENDING APPROVAL
**Approval Required:** [ ] Yes / [ ] No (proceed to tasks)
