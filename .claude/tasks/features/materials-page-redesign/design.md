# Design: Materials Page Redesign

## Architecture Overview

The redesign follows the established pattern from `ProjectsPageClient` and `TasksPageClient`:

```
Server Component (page.tsx)
    └── Fetch data via Server Actions
    └── Pass to Client Component

Client Component (MaterialsPageClient.tsx)
    ├── Mobile Layout (isMobile)
    │   ├── PullToRefresh wrapper
    │   ├── Fixed header (scroll-triggered)
    │   ├── MaterialSummary
    │   ├── MobileStatusTabs (procurement status)
    │   ├── MaterialsSearch (existing)
    │   ├── MaterialCard grid
    │   └── BottomSheet filters
    │
    └── Desktop Layout
        ├── BlueprintBackground
        ├── Industrial Header
        ├── MaterialSummary
        ├── MaterialFilters
        ├── ResultsCount
        ├── MaterialCard grid
        └── TrackedMaterialsCarousel (existing)
```

## Database Schema (Existing - No Changes)

### Table Relationships

```
companies
└── materials (company_id)
    ├── material_assignments (material_id)
    │   ├── tasks (task_id)
    │   ├── projects (project_id)
    │   └── spatial_markers (spatial_marker_id) [optional]
    ├── tracked_materials (material_id, user_id)
    └── material_price_history (material_id)
```

### Key Tables

**materials**
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| company_id | uuid | FK to companies |
| product_name | text | Material name |
| sku | text | Product SKU |
| category | material_category | Enum (lumber, electrical, etc.) |
| unit_price | numeric | Current price |
| lead_time_days | integer | Delivery lead time |
| product_image_url | text | Image URL |
| home_depot_product_id | text | HD API product ID |

**material_assignments**
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| material_id | uuid | FK to materials |
| task_id | uuid | FK to tasks |
| project_id | uuid | FK to projects |
| quantity | numeric | Quantity needed |
| total_cost | numeric | quantity × unit_cost |
| procurement_status | procurement_status | needed/ordered/delivered/installed |
| purchaser_type | purchaser_type | gc/pm/subcontractor |
| estimated_delivery_date | timestamptz | Expected delivery |

**tracked_materials**
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| material_id | uuid | FK to materials |
| user_id | uuid | FK to user_profiles |
| tracked_at | timestamptz | When added to watchlist |

### Enums

```typescript
// procurement_status
type ProcurementStatus = 'needed' | 'ordered' | 'delivered' | 'installed';

// material_category
type MaterialCategory =
  | 'lumber' | 'concrete' | 'electrical' | 'plumbing' | 'hvac'
  | 'roofing' | 'flooring' | 'paint' | 'hardware' | 'tools'
  | 'fixtures' | 'insulation' | 'drywall' | 'doors_windows'
  | 'landscaping' | 'other';

// purchaser_type
type PurchaserType = 'gc' | 'pm' | 'subcontractor';
```

## Server Actions (Existing - No Changes)

All data fetching uses existing Server Actions from `app/actions/materials.ts`:

| Action | Returns | Used For |
|--------|---------|----------|
| `getMaterialSummaryStats()` | MaterialSummaryStats | Summary card data |
| `getTaskLinkedMaterials(page, limit)` | Paginated materials with task/project info | Materials list |
| `getTrackedMaterials()` | TrackedMaterial[] | Carousel/watchlist |

### MaterialSummaryStats Type (Existing)
```typescript
interface MaterialSummaryStats {
  total_materials_linked: number;
  total_estimated_cost: number;
  price_increases_last_7_days: number;
  average_lead_time_days: number;
}
```

### Enhanced Stats for Summary (New Computed Values)
```typescript
// Computed in MaterialsPageClient from fetched data
interface MaterialPortfolioStats extends MaterialSummaryStats {
  // From Server Action
  total_materials_linked: number;
  total_estimated_cost: number;
  price_increases_last_7_days: number;
  average_lead_time_days: number;

  // Computed client-side from materials list
  trackedCount: number;           // tracked_materials count
  statusCounts: {
    needed: number;
    ordered: number;
    delivered: number;
    installed: number;
  };
  categoryBreakdown: Record<MaterialCategory, number>;
  budgetUtilization: number;      // % of project budgets allocated
}
```

## Components

### 1. MaterialsPageClient (New)

**Location**: `components/materials/MaterialsPageClient.tsx`

**Pattern**: Follows `ProjectsPageClient` exactly

```typescript
interface MaterialsPageClientProps {
  materials: MaterialWithAssignment[];
  projects: Project[];
  stats: MaterialSummaryStats;
  trackedMaterials: TrackedMaterial[];
  totalPages: number;
  currentPage: number;
}

// State management
const [searchQuery, setSearchQuery] = useState('');
const [statusFilter, setStatusFilter] = useState<string>('all');
const [categoryFilter, setCategoryFilter] = useState<string>('all');
const [projectFilter, setProjectFilter] = useState<string>('all');
const [sortBy, setSortBy] = useState<string>('created_at');
const [showFilterSheet, setShowFilterSheet] = useState(false);
```

**Key Features**:
- `useIsMobile()` for responsive layout switching
- `PullToRefresh` wrapper for mobile
- Scroll-triggered fixed header (133px threshold)
- `useBottomNav()` integration for create modal data
- Memoized filtering/sorting with `useMemo`

### 2. MaterialSummary (Redesigned)

**Location**: `components/materials/MaterialSummary.tsx`

**Pattern**: Matches `ProjectSummary` design exactly

```typescript
interface MaterialSummaryProps {
  stats: MaterialSummaryStats;
  trackedCount: number;
  statusCounts: {
    needed: number;
    ordered: number;
    delivered: number;
    installed: number;
  };
  className?: string;
}
```

**Layout**:
```
┌─────────────────────────────────────────────────────────────┐
│ [Package Icon] MATERIAL SUMMARY          [Health Badge]     │
│                X materials linked                            │
├─────────────────────────────────────────────────────────────┤
│ Progress Bars:                                               │
│ ▓▓▓▓▓▓▓▓▓░░░ Procurement Progress (delivered/total)        │
│ ▓▓▓▓▓░░░░░░ Budget Allocated                                │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────┐ ┌─────────┐ ┌─────────┐                        │
│ │ Total   │ │ Est.    │ │ Lead    │                        │
│ │ 45      │ │ $12.5K  │ │ 5 days  │                        │
│ │Materials│ │ Cost    │ │ Avg     │                        │
│ └─────────┘ └─────────┘ └─────────┘                        │
├─────────────────────────────────────────────────────────────┤
│ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐   │
│ │● Needed   │ │● Ordered  │ │● Delivered│ │● Installed│   │
│ │   12      │ │   8       │ │   15      │ │   10      │   │
│ └───────────┘ └───────────┘ └───────────┘ └───────────┘   │
├─────────────────────────────────────────────────────────────┤
│ ⚠ 3 price increases detected in last 7 days               │
├─────────────────────────────────────────────────────────────┤
│ [Eye] Tracked: 5/10 watchlist                              │
└─────────────────────────────────────────────────────────────┘
```

**Visual Design**:
- Header: Navy icon box, bold title, health badge (On Track/At Risk/Behind)
- Progress bars: Status-based colors (navy default, amber warning, red danger)
- Stats grid: Neutral gray backgrounds with small color accent dots
- Status cards: 2x2 grid with colored dot indicators
- Warning banner: Only shows if price_increases > 0 (amber bg)
- Tracked section: Bottom row with Eye icon

### 3. MaterialFilters (New)

**Location**: `components/materials/MaterialFilters.tsx`

**Pattern**: Matches `ProjectFilters`

```typescript
interface MaterialFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
  categoryFilter: string;
  onCategoryChange: (value: string) => void;
  projectFilter: string;
  onProjectChange: (value: string) => void;
  sortBy: string;
  onSortChange: (value: string) => void;
  projects: Project[];
}
```

**Elements**:
- `PlaceholdersVanishInput` for search
- Status tabs using `Tabs` component (All, Needed, Ordered, Delivered, Installed)
- Category dropdown (All, Lumber, Electrical, Plumbing, etc.)
- Project dropdown (filter by linked project)
- Sort dropdown (Newest, Name A-Z, Cost High-Low, Lead Time)

### 4. MaterialCard (Redesigned)

**Location**: `components/materials/MaterialCard.tsx`

**Pattern**: Single responsive card (like `ProjectCard`)

```typescript
interface MaterialCardProps {
  material: MaterialWithAssignment;
  onTrack?: () => void;
  onAssign?: () => void;
}
```

**Mobile Layout** (vertical stack):
```
┌─────────────────────────────┐
│ [Image] Product Name        │
│         SKU: ABC123         │
│         Category: Lumber    │
├─────────────────────────────┤
│ $45.99/each  │  5 day lead  │
├─────────────────────────────┤
│ ● Needed  Qty: 10  $459.90  │
├─────────────────────────────┤
│ Project: Kitchen Remodel    │
│ Task: Install Cabinets      │
└─────────────────────────────┘
```

**Desktop Layout** (horizontal with more details):
```
┌───────────────────────────────────────────────────────────┐
│ [Img] │ Product Name              │ $45.99 │ ● Needed    │
│       │ SKU: ABC123 | Lumber      │ /each  │   Qty: 10   │
│       │ Lead: 5 days              │ Total: │ Project X   │
│       │                           │ $459   │ [Actions]   │
└───────────────────────────────────────────────────────────┘
```

### 5. Extracted Utility Components (Memoized)

```typescript
// BlueprintBackground - shared across pages
const BlueprintBackground = memo(function BlueprintBackground() { ... });

// ResultsCount - shows "X of Y materials"
const ResultsCount = memo(function ResultsCount({ filtered, total }) { ... });

// EmptyState - when no materials exist
const EmptyState = memo(function EmptyState({ onSearchClick }) { ... });

// NoResultsState - when filters return empty
const NoResultsState = memo(function NoResultsState({ onClearFilters }) { ... });

// MaterialGrid - CSS stagger animation wrapper
const MaterialGrid = memo(function MaterialGrid({ materials, isMobile }) { ... });
```

## Integration Points

### Page Component → Client Component

**File**: `app/app/materials/page.tsx`

```typescript
// Simplified page.tsx (Server Component)
export default async function MaterialsPage({ searchParams }) {
  const params = await searchParams;
  const page = parseInt(params.page || '1');

  // Parallel data fetching
  const [materialsResult, trackedResult, statsResult, projectsResult] =
    await Promise.all([
      getTaskLinkedMaterials(page, 12),
      getTrackedMaterials(),
      getMaterialSummaryStats(),
      getProjects(), // Reuse from projects actions
    ]);

  return (
    <MaterialsPageClient
      materials={materialsResult.data?.materials || []}
      totalPages={materialsResult.data?.totalPages || 1}
      currentPage={page}
      trackedMaterials={trackedResult.data || []}
      stats={statsResult.data || defaultStats}
      projects={projectsResult || []}
    />
  );
}
```

### Client Component → Server Actions

```typescript
// MaterialsPageClient.tsx
'use client';

// NO Supabase imports - only Server Action calls via:
// - router.refresh() for data refetch
// - Direct action calls for mutations (existing patterns)

const handleRefresh = useCallback(async () => {
  await new Promise((resolve) => setTimeout(resolve, 500));
  router.refresh(); // Triggers server-side refetch
}, [router]);
```

### Bottom Navigation Integration

```typescript
// Register create modal data
useEffect(() => {
  registerCreateModal('/app/materials', {
    projects, // For material assignment
  });
  return () => unregisterCreateModal('/app/materials');
}, [projects, registerCreateModal, unregisterCreateModal]);
```

### Mobile Header Visibility

```typescript
// Track scroll position for fixed header
const pullToRefreshRef = useRef<PullToRefreshHandle>(null);
const resultsCountRef = useRef<HTMLDivElement>(null);
const [showHeader, setShowHeader] = useState(false);

useEffect(() => {
  if (!isMobile) return;

  const scrollContainer = pullToRefreshRef.current?.getScrollContainer();
  const checkPosition = () => {
    if (!resultsCountRef.current) return;
    const rect = resultsCountRef.current.getBoundingClientRect();
    setShowHeader(rect.top <= 133);
  };

  scrollContainer?.addEventListener('scroll', checkPosition, { passive: true });
  return () => scrollContainer?.removeEventListener('scroll', checkPosition);
}, [isMobile]);
```

## Mobile Responsiveness

### Breakpoints
- Mobile: `< 768px` (detected via `useIsMobile()`)
- Tablet: `768px - 1024px`
- Desktop: `> 1024px`

### Touch Targets
- All interactive elements: min 44px height
- Cards: Full-width touch on mobile
- Buttons: min 44px × 44px

### Status Tabs (Mobile)
```typescript
const STATUS_TABS = [
  { value: 'all', label: 'All' },
  { value: 'needed', label: 'Needed' },
  { value: 'ordered', label: 'Ordered' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'installed', label: 'Installed' },
];
```

## File Structure

```
components/materials/
├── MaterialsPageClient.tsx    # NEW - Main page client component
├── MaterialSummary.tsx        # REDESIGN - Portfolio analytics card
├── MaterialFilters.tsx        # NEW - Search/filter controls
├── MaterialCard.tsx           # REDESIGN - Responsive material card
├── MaterialsList.tsx          # UPDATE - Use new MaterialCard
├── MaterialsSearch.tsx        # KEEP - Home Depot search
├── TrackedMaterialsCarousel.tsx # KEEP - Horizontal carousel
├── AssignMaterialModal.tsx    # KEEP - Assignment modal
├── ProductCard.tsx            # KEEP - HD product display
└── PriceChangeIndicator.tsx   # KEEP - Price alert badge

app/app/materials/
└── page.tsx                   # UPDATE - Simplified, delegates to client
```

## State Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    MaterialsPageClient                       │
├─────────────────────────────────────────────────────────────┤
│ Props (from Server):                                         │
│   materials, stats, trackedMaterials, projects              │
├─────────────────────────────────────────────────────────────┤
│ Local State:                                                 │
│   searchQuery, statusFilter, categoryFilter,                │
│   projectFilter, sortBy, showFilterSheet, showHeader        │
├─────────────────────────────────────────────────────────────┤
│ Computed (useMemo):                                          │
│   filteredMaterials, statusCounts, portfolioStats           │
├─────────────────────────────────────────────────────────────┤
│ Actions:                                                     │
│   handleRefresh → router.refresh()                          │
│   clearFilters → reset all filter states                    │
└─────────────────────────────────────────────────────────────┘
```

## Design System Compliance

| Element | Specification |
|---------|--------------|
| Primary Color | `#001B51` (Navy) |
| Accent Color | `#3C3C3C` (Gray) |
| Success | `#059669` (Emerald) |
| Warning | `#F59E0B` (Amber) |
| Danger | `#DC2626` (Red) |
| Icons | Lucide only |
| Modals | `BaseModal` only |
| Touch targets | Min 44px |
| Fonts | System default |
| Shadows | `shadow-construction`, `shadow-construction-lg` |
