# Design: Settings Page Redesign

## Architecture Overview

The redesign aligns settings components with the established patterns in `ProjectsPageClient` and `TasksPageClient`:

```
ProjectConfigurationSection (container)
├── Mobile Layout
│   ├── BlueprintBackground
│   ├── Industrial Header (CONFIGURATION)
│   ├── FilterTabs (horizontal scroll)
│   └── Active Manager Component
│       └── PullToRefresh wrapper
└── Desktop Layout
    ├── BlueprintBackground
    ├── Industrial Header (PROJECT CONFIGURATION)
    ├── FilterTabs (grid layout)
    └── Active Manager Component
```

## Component Architecture

### ProjectConfigurationSection.tsx (Redesigned)

```tsx
// Key patterns to implement:

// 1. FilterTabs integration (matching TaskBoard pattern)
const CONFIG_TABS: FilterTab[] = [
  { value: 'project-types', label: 'Projects', icon: Wrench, count: projectTypesCount },
  { value: 'task-types', label: 'Tasks', icon: Tag, count: taskTypesCount },
  { value: 'phase-templates', label: 'Phases', icon: Route, count: phaseCount },
  { value: 'task-templates', label: 'Templates', icon: ListChecks, count: templateCount },
];

// 2. Mobile/Desktop detection
const isMobile = useIsMobile();
const [hasMounted, setHasMounted] = useState(false);
useEffect(() => setHasMounted(true), []);
const showMobileLayout = hasMounted && isMobile;

// 3. Mobile layout structure (matching TasksPageClient)
if (showMobileLayout) {
  return (
    <div className="flex flex-col h-full">
      <PullToRefresh onRefresh={handleRefresh} className="flex-1">
        <div className="p-4 pb-32">
          <BlueprintBackground />

          {/* Industrial Header */}
          <div className="relative mb-4">
            <div className="absolute top-0 left-0 right-0 h-1 bg-construction-blue" />
            <h1 className="text-3xl font-black tracking-tighter text-construction-blue leading-none pt-2">
              CONFIGURATION
            </h1>
          </div>

          {/* FilterTabs - sticky */}
          <div className="sticky top-0 z-30 -mx-4 px-4 py-2 bg-white/95 backdrop-blur-sm border-b border-gray-100">
            <FilterTabs
              tabs={CONFIG_TABS}
              value={activeTab}
              onChange={setActiveTab}
              showCounts={true}
              useStatusGradients={false}
              layoutId="configTabs"
            />
          </div>

          {/* Active Manager */}
          <div className="mt-4">
            {activeTab === 'project-types' && <ProjectTypeManager />}
            {activeTab === 'task-types' && <TaskTypeManager />}
            {activeTab === 'phase-templates' && <PhaseTemplateManager />}
            {activeTab === 'task-templates' && <TaskTemplateManager />}
          </div>
        </div>
      </PullToRefresh>
    </div>
  );
}

// 4. Desktop layout structure (matching ProjectsPageClient)
return (
  <div className="flex-1 space-y-4 md:space-y-6 p-4 md:p-8 pt-4 md:pt-6 relative overflow-hidden">
    <BlueprintBackground />

    {/* Industrial Header */}
    <div className="relative">
      <div className="absolute top-0 left-0 right-0 h-1 bg-construction-blue" />
      <div className="pt-2 md:pt-4">
        <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-construction-blue leading-none">
          PROJECT CONFIGURATION
        </h1>
        <p className="text-sm md:text-base text-gray-600 mt-2">
          Manage project types, task types, and templates
        </p>
      </div>
    </div>

    {/* FilterTabs - grid layout on desktop */}
    <FilterTabs
      tabs={CONFIG_TABS}
      value={activeTab}
      onChange={setActiveTab}
      showCounts={true}
      useStatusGradients={false}
      layoutId="configTabs"
    />

    {/* Card container */}
    <div className="border-2 border-gray-200 rounded-xl shadow-construction bg-white p-4 md:p-6">
      {activeTab === 'project-types' && <ProjectTypeManager />}
      {activeTab === 'task-types' && <TaskTypeManager />}
      {activeTab === 'phase-templates' && <PhaseTemplateManager />}
      {activeTab === 'task-templates' && <TaskTemplateManager />}
    </div>

    {/* Decorative bottom border */}
    <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
  </div>
);
```

### Performance Optimization Patterns

```tsx
// 1. Memoized child components (wrap exports)
export const ProjectTypeManager = memo(function ProjectTypeManager() { ... });
export const TaskTypeManager = memo(function TaskTypeManager() { ... });

// 2. Stabilized callbacks
const handleCreate = useCallback(async (e: React.FormEvent) => { ... }, [loadData]);
const handleDelete = useCallback(async () => { ... }, [deletingItem, loadData]);

// 3. Direct Lucide imports (avoid barrel files)
import Plus from 'lucide-react/icons/plus';
import Edit from 'lucide-react/icons/edit';
import Trash2 from 'lucide-react/icons/trash-2';
// NOT: import { Plus, Edit, Trash2 } from 'lucide-react';

// 4. Dynamic imports for modals (reduce initial bundle)
const ResponsiveModal = dynamic(
  () => import('@/components/ui/ResponsiveModal').then(mod => ({ default: mod.ResponsiveModal })),
  { ssr: false }
);

// 5. CSS stagger animations (replace framer-motion per-item)
<div
  className="animate-in fade-in slide-in-from-bottom-4"
  style={{
    animationDelay: `${Math.min(index * 50, 300)}ms`,
    animationDuration: '400ms',
    animationFillMode: 'both',
  }}
>
  <ProjectCard project={project} />
</div>
```

### Manager Component Updates

Each manager component needs these updates:

#### Common Patterns for All Managers

```tsx
// 1. Wrap in memo
export const ProjectTypeManager = memo(function ProjectTypeManager() {

// 2. Loading skeleton using CSS animations
{isLoading && (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {Array.from({ length: 6 }).map((_, i) => (
      <div
        key={i}
        className="animate-in fade-in"
        style={{
          animationDelay: `${i * 50}ms`,
          animationDuration: '300ms',
        }}
      >
        <div className="bg-white border-2 border-gray-200 rounded-lg p-5 animate-pulse">
          {/* Skeleton content */}
        </div>
      </div>
    ))}
  </div>
)}

// 3. Empty state matching ProjectsPageClient
{!isLoading && items.length === 0 && (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="w-16 h-16 rounded-full bg-construction-blue/10 flex items-center justify-center mb-4">
      <Icon className="w-8 h-8 text-construction-blue" />
    </div>
    <h3 className="text-lg font-semibold text-gray-900 mb-1">
      No items found
    </h3>
    <p className="text-sm text-gray-500 mb-4 max-w-xs">
      Create your first item to get started
    </p>
    <Button onClick={() => setShowCreateModal(true)}>
      <Plus className="mr-2 h-4 w-4" />
      Add Item
    </Button>
  </div>
)}

// 4. Item grid with CSS stagger
{!isLoading && items.length > 0 && (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {items.map((item, index) => (
      <div
        key={item.id}
        className="animate-in fade-in slide-in-from-bottom-4"
        style={{
          animationDelay: `${Math.min(index * 50, 300)}ms`,
          animationDuration: '400ms',
          animationFillMode: 'both',
        }}
      >
        <ItemCard item={item} onEdit={handleEdit} onDelete={handleDelete} />
      </div>
    ))}
  </div>
)}
```

### Mobile-Specific Patterns

```tsx
// Touch-friendly cards with proper feedback
<button
  onClick={onTap}
  className={cn(
    "w-full text-left",
    "bg-white rounded-xl p-4",
    "border-l-4 shadow-sm",
    "active:scale-[0.99] active:bg-gray-50",
    "transition-all duration-150",
    statusColors[item.status]
  )}
>

// Touch-friendly action buttons (44px min)
<Button
  variant="ghost"
  size="sm"
  onClick={() => setEditingType(type)}
  className="min-h-[44px] min-w-[44px] hover:bg-construction-blue/10"
>
  <Edit className="h-4 w-4" />
</Button>
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `components/settings/ProjectConfigurationSection.tsx` | Modify | Redesign with FilterTabs, mobile/desktop layouts, BlueprintBackground |
| `components/settings/ProjectTypeManager.tsx` | Modify | Add memo, direct imports, CSS animations, mobile patterns |
| `components/settings/TaskTypeManager.tsx` | Modify | Add memo, direct imports, CSS animations, mobile patterns |
| `components/settings/PhaseTemplateManager.tsx` | Modify | Add memo, direct imports, CSS animations, mobile patterns |
| `components/settings/TaskTemplateManager.tsx` | Modify | Add memo, direct imports, CSS animations, mobile patterns |

## Integration Points

### FilterTabs Integration
```tsx
// In ProjectConfigurationSection.tsx
import { FilterTabs, type FilterTab } from '@/components/ui/FilterTabs';

// Define tabs with icons and optional counts
const CONFIG_TABS: FilterTab[] = [
  { value: 'project-types', label: 'Projects', icon: Wrench },
  { value: 'task-types', label: 'Tasks', icon: Tag },
  { value: 'phase-templates', label: 'Phases', icon: Route },
  { value: 'task-templates', label: 'Templates', icon: ListChecks },
];
```

### Mobile Detection
```tsx
import { useIsMobile } from '@/lib/hooks/useMediaQuery';

// Hydration-safe pattern
const isMobileQuery = useIsMobile();
const [hasMounted, setHasMounted] = useState(false);
useEffect(() => setHasMounted(true), []);
const isMobile = hasMounted && isMobileQuery;
```

### Pull-to-Refresh
```tsx
import { PullToRefresh, type PullToRefreshHandle } from '@/components/mobile/PullToRefresh';
import { useRouter } from 'next/navigation';

const router = useRouter();
const handleRefresh = useCallback(async () => {
  await new Promise(resolve => setTimeout(resolve, 500));
  router.refresh();
}, [router]);
```

## Responsive Design

### Mobile (<768px)
- Full-width tabs with horizontal scroll
- Single column card grid
- 44px minimum touch targets
- Sticky tab bar at top
- `pb-32` for bottom nav clearance
- Pull-to-refresh enabled

### Tablet (768px - 1024px)
- Two-column card grid
- Scrollable tabs if needed
- Mixed touch/mouse interface

### Desktop (>1024px)
- Grid-based tabs (all visible)
- Three-column card grid
- Hover states enabled
- Larger padding and spacing

## Important Notes

1. **Maintain CRUD Functionality** - All create/edit/delete operations must continue working
2. **Server Actions Only** - No Supabase in client components
3. **Preserve DnD** - PhaseTemplateManager and TaskTemplateManager use dnd-kit for reordering
4. **Accessibility** - Keep all ARIA labels and keyboard navigation
5. **Performance** - Use CSS animations, memo, and direct imports
