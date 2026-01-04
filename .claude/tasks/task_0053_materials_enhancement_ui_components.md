# Task 0053: Materials Enhancement - UI Components

**Date:** 2026-01-04
**Status:** 🔵 **PENDING**
**Agent:** agent-frontend-engineer
**Estimated Effort:** 4-6 hours

---

## Overview

Build all UI components for the Materials Page Enhancement feature, including the 4-card summary section, tracked materials carousel, paginated materials list, and price change indicators. Follow the ProjectTaskSummary pattern and standard GenHub UI rules.

---

## Prerequisites

- [x] Design document approved
- [x] Requirements approved
- [ ] Task 0050 completed (database schema)
- [ ] Task 0051 completed (server actions available)
- [ ] TypeScript types generated
- [ ] ProjectTaskSummary pattern reviewed (`components/projects/ProjectTaskSummary.tsx`)

---

## Subtasks

### 1. Create `MaterialSummary` Component

**File:** `components/materials/MaterialSummary.tsx`

- [ ] Create client component (`'use client'`)
- [ ] Accept props: `{ stats: MaterialSummaryStats, trackedCount: number }`
- [ ] Follow ProjectTaskSummary 5-card grid pattern:
  - Card 1: Total Materials Linked (blue, Boxes icon)
  - Card 2: Total Estimated Cost (green, DollarSign icon)
  - Card 3: Price Increases (7d) (red, TrendingUp icon)
  - Card 4: Average Lead Time (gray, Clock icon)
  - Card 5: Tracked Materials count (blue, Eye icon, shows X/10)
- [ ] Use standard card styling: `border-2 border-gray-200 shadow-construction`
- [ ] Use gradient backgrounds: `bg-gradient-to-br from-construction-blue/5`
- [ ] Add hover effects: `hover:scale-105 transition-transform`
- [ ] Make cards clickable (optional filter actions)
- [ ] Responsive grid: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-5`
- [ ] Add empty state if no materials linked
- [ ] Test on mobile, tablet, desktop

### 2. Create `TrackedMaterialsCarousel` Component

**File:** `components/materials/TrackedMaterialsCarousel.tsx`

- [ ] Create client component
- [ ] Accept props: `{ trackedMaterials: TrackedMaterial[] }`
- [ ] Implement horizontal scrolling container:
  - Use `flex gap-4 overflow-x-auto`
  - Hide scrollbar: `scrollbar-hide`
  - Smooth scroll: `scroll-smooth`
- [ ] Add navigation arrows (left/right):
  - Show left arrow only if scrolled right
  - Always show right arrow
  - Use ChevronLeft/ChevronRight icons
- [ ] Create `TrackedMaterialCard` sub-component:
  - Fixed width: `w-64`
  - Image preview (or placeholder icon)
  - Product name (line-clamp-2)
  - SKU (small text)
  - Current price (large, bold)
  - Price change indicator (red ↑, green ↓, gray —)
  - Untrack button
- [ ] Add empty state: "No Tracked Materials"
- [ ] Add section header with Eye icon
- [ ] Test scrolling behavior (smooth, responsive)
- [ ] Test with 0, 1, 5, 10 materials

### 3. Create `PriceChangeIndicator` Component

**File:** `components/materials/PriceChangeIndicator.tsx`

- [ ] Create client component
- [ ] Accept props: `{ percent: number | null }`
- [ ] Render indicator based on percent:
  - `percent > 0`: Red TrendingUp icon + "+X.X%"
  - `percent < 0`: Green TrendingDown icon + "X.X%" (negative)
  - `percent === 0 || null`: Gray Minus icon + "No change"
- [ ] Use Tailwind colors:
  - Red: `text-red-600`
  - Green: `text-green-600`
  - Gray: `text-gray-500`
- [ ] Format percentage: `toFixed(1)`
- [ ] Add icon + text in flex row
- [ ] Test edge cases (null, 0, +25%, -20%)

### 4. Create `MaterialCard` Component

**File:** `components/materials/MaterialCard.tsx`

- [ ] Create client component
- [ ] Accept props: `{ material: MaterialWithStats }`
- [ ] Card layout:
  - Image (h-32, object-cover, or Package icon placeholder)
  - Product name (font-semibold, line-clamp-2)
  - Category badge (uppercase, small text)
  - Stats row: Total Quantity + Task Count (side-by-side)
  - Price + Stock status row
  - Track/Untrack button (toggle state)
- [ ] Use standard card styling
- [ ] Add hover shadow: `hover:shadow-construction-lg`
- [ ] Handle track button click:
  - Call `toggleTracking()` server action
  - Optimistic UI update (instant toggle)
  - Show toast on success/error
  - Rollback on error
- [ ] Test track/untrack flow
- [ ] Test with various stock statuses

### 5. Create `MaterialsList` Component

**File:** `components/materials/MaterialsList.tsx`

- [ ] Create client component
- [ ] Accept props: `{ materials: MaterialWithStats[], total: number, page: number }`
- [ ] Implement pagination state:
  - Use `useState` for current page
  - Call server action on page change
  - Show loading state during fetch
- [ ] Grid layout:
  - `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4`
  - Render MaterialCard for each material
- [ ] Add section header with Boxes icon
- [ ] Add pagination controls:
  - Previous button (disabled on page 1)
  - Page X of Y display
  - Next button (disabled on last page)
- [ ] Add loading skeleton (12 cards)
- [ ] Add empty state: "No Materials Linked"
- [ ] Test pagination with edge cases (0, 11, 12, 13, 24 materials)

### 6. Create `MaterialsListSkeleton` Component

**File:** `components/materials/MaterialsListSkeleton.tsx`

- [ ] Create client component
- [ ] Render 12 skeleton cards in grid
- [ ] Each skeleton:
  - Image placeholder (bg-gray-200, h-32)
  - Text placeholders (bg-gray-200, varying widths)
  - Button placeholder (bg-gray-200, h-10)
- [ ] Add `animate-pulse` class
- [ ] Match MaterialsList grid layout
- [ ] Test loading state appearance

### 7. Add Optimistic UI Updates

**All components with mutations:**

- [ ] MaterialCard: Instant track/untrack toggle
- [ ] TrackedMaterialCard: Instant untrack with rollback
- [ ] Show loading spinner during server action
- [ ] Revert state on error
- [ ] Show toast notifications (success/error)

### 8. Add Responsive Styles

**All components:**

- [ ] Test on mobile (320px, 375px, 414px)
- [ ] Test on tablet (768px, 1024px)
- [ ] Test on desktop (1280px, 1920px)
- [ ] Ensure carousel scrolls on mobile
- [ ] Ensure grid adjusts correctly
- [ ] Ensure text doesn't overflow

---

## Acceptance Criteria

✅ **MaterialSummary Component:**
- [ ] Renders 5 cards with correct icons and colors
- [ ] Shows accurate stats from server action
- [ ] Responsive grid (1 col mobile, 2 col tablet, 5 col desktop)
- [ ] Hover effects work smoothly
- [ ] Empty state shows when no materials

✅ **TrackedMaterialsCarousel:**
- [ ] Horizontal scroll works smoothly
- [ ] Navigation arrows function correctly
- [ ] Shows max 10 materials
- [ ] Price change indicators accurate
- [ ] Untrack button works with optimistic UI
- [ ] Empty state shows when no tracked materials

✅ **PriceChangeIndicator:**
- [ ] Shows red ↑ for positive changes
- [ ] Shows green ↓ for negative changes
- [ ] Shows gray — for no change or null
- [ ] Percentage formatted correctly (+25.0%, -20.0%)

✅ **MaterialCard:**
- [ ] Displays all material info (image, name, stats, price)
- [ ] Track/untrack button toggles correctly
- [ ] Optimistic UI update on click
- [ ] Error handling with rollback
- [ ] Stock status badge shows correct color

✅ **MaterialsList:**
- [ ] Paginated grid shows 12 materials per page
- [ ] Pagination controls work correctly
- [ ] Loading skeleton shows during fetch
- [ ] Empty state shows when no materials
- [ ] Responsive grid layout

✅ **Overall UI Quality:**
- [ ] Consistent with GenHub design system
- [ ] Standard card styling applied
- [ ] Lucide icons used throughout
- [ ] No custom fonts or decorations
- [ ] Mobile-first responsive
- [ ] Accessible (ARIA labels, keyboard navigation)

---

## Implementation Notes

### Key Technical Details

**1. ProjectTaskSummary Pattern (5-Card Grid):**
```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
  {/* Card 1: Total Materials */}
  <div className="relative group cursor-pointer">
    <div className="absolute inset-0 bg-gradient-to-br from-construction-blue/5 to-construction-blue/10 rounded-lg transform group-hover:scale-105 transition-transform" />
    <div className="relative bg-white border-2 border-gray-200 rounded-lg p-5 shadow-construction hover:shadow-construction-lg transition-all h-full flex flex-col justify-between">
      <div className="flex items-center justify-between mb-3">
        <div className="p-2 bg-construction-blue/10 rounded-lg border-2 border-construction-blue/20">
          <Boxes className="h-5 w-5 text-construction-blue" />
        </div>
        <div className="text-xs font-mono uppercase text-construction-blue/60">Total</div>
      </div>
      <div>
        <div className="text-4xl font-black text-construction-blue leading-none mb-1">
          {stats.total_materials_linked}
        </div>
        <div className="text-sm font-bold text-gray-600">Materials Linked</div>
      </div>
    </div>
  </div>
  {/* Repeat for other 4 cards... */}
</div>
```

**2. Carousel Scrolling:**
```tsx
const scroll = (direction: 'left' | 'right') => {
  const container = document.getElementById('tracked-materials-carousel');
  const scrollAmount = 300;
  const newPosition = direction === 'left'
    ? scrollPosition - scrollAmount
    : scrollPosition + scrollAmount;
  container?.scrollTo({ left: newPosition, behavior: 'smooth' });
  setScrollPosition(newPosition);
};

<div
  id="tracked-materials-carousel"
  className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-4"
  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
>
  {trackedMaterials.map((material) => (
    <TrackedMaterialCard key={material.material_id} material={material} />
  ))}
</div>
```

**3. Optimistic UI with Rollback:**
```tsx
const [isTracking, setIsTracking] = useState(material.is_tracked);
const [isLoading, setIsLoading] = useState(false);

const handleToggleTracking = async () => {
  const previousState = isTracking;
  setIsTracking(!isTracking); // Optimistic update
  setIsLoading(true);

  const result = await toggleTracking(material.material_id, !isTracking);

  if (result.error) {
    setIsTracking(previousState); // Rollback
    toast.error(result.error);
  } else {
    toast.success(isTracking ? 'Material tracked' : 'Material untracked');
  }

  setIsLoading(false);
};
```

**4. Pagination:**
```tsx
const [page, setPage] = useState(1);
const [isLoading, setIsLoading] = useState(false);
const limit = 12;
const totalPages = Math.ceil(total / limit);

const handlePageChange = async (newPage: number) => {
  setIsLoading(true);
  const result = await getTaskLinkedMaterials(newPage, limit);
  // Update materials state
  setIsLoading(false);
  setPage(newPage);
};

<div className="flex items-center justify-center gap-2 mt-6">
  <button
    onClick={() => handlePageChange(page - 1)}
    disabled={page === 1 || isLoading}
    className="px-4 py-2 border-2 border-gray-200 rounded-lg disabled:opacity-50"
  >
    Previous
  </button>
  <span className="px-4 py-2 font-semibold">
    Page {page} of {totalPages}
  </span>
  <button
    onClick={() => handlePageChange(page + 1)}
    disabled={page === totalPages || isLoading}
    className="px-4 py-2 border-2 border-gray-200 rounded-lg disabled:opacity-50"
  >
    Next
  </button>
</div>
```

**5. Empty States:**
```tsx
if (materials.length === 0) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-gray-300 rounded-lg">
      <Boxes className="w-12 h-12 text-gray-400 mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-1">No Materials Linked</h3>
      <p className="text-sm text-gray-500 mb-4 max-w-sm">
        Search and add materials to your tasks to see them here
      </p>
    </div>
  );
}
```

---

## Files to Modify/Create

### Create:
- `components/materials/MaterialSummary.tsx`
- `components/materials/TrackedMaterialsCarousel.tsx`
- `components/materials/PriceChangeIndicator.tsx`
- `components/materials/MaterialCard.tsx`
- `components/materials/MaterialsList.tsx`
- `components/materials/MaterialsListSkeleton.tsx`

### Reference:
- `components/projects/ProjectTaskSummary.tsx` (5-card pattern)
- `components/projects/ProjectOverview.tsx` (layout examples)
- Design Document: Lines 500-924 (UI Specification)

---

## Testing Instructions

### 1. Test MaterialSummary Component

```tsx
// In Storybook or test page
<MaterialSummary
  stats={{
    total_materials_linked: 42,
    total_estimated_cost: 15000,
    price_increases_last_7_days: 5,
    average_lead_time_days: 7,
  }}
  trackedCount={8}
/>

// Verify:
// - All 5 cards render correctly
// - Numbers display accurately
// - Hover effects work
// - Responsive on mobile/tablet/desktop
```

### 2. Test TrackedMaterialsCarousel

```tsx
<TrackedMaterialsCarousel
  trackedMaterials={[
    {
      material_id: '1',
      product_name: 'Test Material 1',
      sku: 'SKU123',
      current_price: 10.99,
      previous_price: 8.99,
      price_change_percent: 22.2,
      product_image_url: 'https://example.com/image.jpg',
      tracked_at: '2026-01-01',
    },
    // ... up to 10 materials
  ]}
/>

// Verify:
// - Carousel scrolls smoothly
// - Navigation arrows work
// - Price indicators show correct color/direction
// - Untrack button works
// - Empty state shows when no materials
```

### 3. Test Pagination

```tsx
<MaterialsList
  materials={materials}
  total={25}
  page={1}
/>

// Verify:
// - Page 1 shows first 12 materials
// - Click "Next" → shows next 12 (or remaining)
// - Click "Previous" → back to page 1
// - Last page disables "Next" button
// - Page X of Y displays correctly
```

### 4. Test Track/Untrack Flow

1. Click "Track Price" on MaterialCard
2. Verify:
   - Button instantly shows "Tracking" (optimistic)
   - Loading spinner appears briefly
   - Toast notification: "Material tracked"
   - MaterialCard moves to TrackedMaterialsCarousel
3. Click "Untrack" in carousel
4. Verify:
   - Material instantly removed from carousel
   - MaterialCard button shows "Track Price" again
   - Toast notification: "Material untracked"

### 5. Test Responsive Layout

- Mobile (375px):
  - Summary: 1 column
  - Carousel: Horizontal scroll
  - Materials List: 1 column
- Tablet (768px):
  - Summary: 2 columns
  - Materials List: 2 columns
- Desktop (1280px):
  - Summary: 5 columns
  - Materials List: 3 columns

---

## Dependencies

**Depends on:**
- Task 0051 (server actions)
- TypeScript types (`MaterialWithStats`, `TrackedMaterial`, `MaterialSummaryStats`)
- Lucide icons (`Boxes`, `Eye`, `TrendingUp`, `TrendingDown`, etc.)
- Sonner (for toast notifications)

**Required by:**
- Task 0054 (page integration uses these components)

---

## References

- Design Document: `docs/specs/materials-page-enhancement/design.md`
  - UI Specification: Lines 500-924
  - Component Specs: Lines 527-924
- ProjectTaskSummary: `components/projects/ProjectTaskSummary.tsx`
- UI Rules: `.claude/docs/law/UI_RULES.md`

---

## Success Checklist

Before marking this task complete:

- [ ] All 6 components created
- [ ] Standard GenHub styling applied
- [ ] Lucide icons used throughout
- [ ] Responsive on all screen sizes
- [ ] Optimistic UI updates working
- [ ] Error handling with rollback
- [ ] Empty states implemented
- [ ] Loading states implemented
- [ ] Pagination working correctly
- [ ] Carousel scrolling smoothly
- [ ] Price indicators accurate
- [ ] No TypeScript errors
- [ ] All tests passed

---

**Next Task:** Task 0054 - Page Integration
