# Team Page Styling Update - Technical Design

## Overview
This design document specifies the technical implementation to align the Team page visual patterns with the Projects page, focusing on component structure, styling consistency, and responsive behavior.

## Requirements Reference
See: `.claude/specs/team-page-styling-update/requirements.md`

---

## Architecture Overview

### Component Hierarchy Comparison

**Current Team Page:**
```
TeamPage (Server Component)
└── TeamPageClient (Client)
    ├── PullToRefresh (mobile)
    │   └── SwipeableCard (repeated)
    │       └── TeamMemberCard
    └── TeamMemberTable (desktop)
```

**Target Structure (matching Projects):**
```
TeamPage (Server Component)
└── TeamPageClient (Client)
    ├── BlueprintBackground
    ├── Header Section
    │   ├── Title
    │   └── InviteButton
    ├── TeamSummary (new component)
    ├── TeamFilters (new component)
    └── TeamGrid/Table
        └── PullToRefresh (mobile)
            └── TeamMemberCard (updated)
```

### Data Flow

```
Server (page.tsx)
    ↓ getTeamPageData()
    ↓ [members, stats, role, companyId]
    ↓
Client (TeamPageClient)
    ↓ useState/useMemo for filtering
    ↓ filteredMembers
    ↓
Mobile: PullToRefresh → TeamMemberCard
Desktop: TeamMemberTable
```

---

## Component Specifications

### 1. TeamPage (Server Component)
**File:** `app/app/team/page.tsx`

**Changes Required:**
- Remove inline BLUEPRINT_BACKGROUND_STYLE constant
- Simplify page container to match ProjectsPage pattern
- Remove duplicate blueprint rendering
- Pass all data to TeamPageClient

**Updated Structure:**
```tsx
export default async function TeamPage() {
  const data = await getTeamPageData();

  if (data.status !== "ok") {
    return <ErrorState />; // Existing error handling
  }

  const { members, stats, role, companyId } = data;

  return (
    <TeamPageClient
      members={members}
      stats={stats}
      currentUserRole={role}
      companyId={companyId}
    />
  );
}
```

**Key Points:**
- Server Component delegates all rendering to client
- Matches ProjectsPage delegation pattern
- Error states handled at server level

---

### 2. TeamPageClient (Client Component)
**File:** `components/team/TeamPageClient.tsx`

**Major Refactor Required:**

**New Imports:**
```tsx
import { BlueprintBackground } from '@/components/shared/BlueprintBackground';
import { TeamSummary } from './TeamSummary'; // New component
import { TeamFilters } from './TeamFilters'; // New component
import { Button } from '@/components/ui/button';
import Plus from 'lucide-react/icons/plus';
import { EmptyStateCard } from '@/components/ui/EmptyStateCard';
import Users from 'lucide-react/icons/users';
```

**State Management:**
```tsx
// Filter states (matching ProjectsPageClient)
const [searchQuery, setSearchQuery] = useState<string>('');
const [roleFilter, setRoleFilter] = useState<string>('all');
const [statusFilter, setStatusFilter] = useState<string>('all');
const [sortBy, setSortBy] = useState<string>('name');
const [currentPage, setCurrentPage] = useState(1);
const [isPending, startTransition] = useTransition();
```

**Layout Structure (Mobile):**
```tsx
<div className="flex flex-col h-full">
  <PullToRefresh onRefresh={handleRefresh} className="flex-1">
    <div className="p-4">
      <BlueprintBackground />

      {/* Header */}
      <div className="relative mb-4">
        <div className="absolute top-0 left-0 right-0 h-1 bg-construction-blue" />
        <div className="flex items-start pt-2 justify-between gap-3">
          <h1 className="text-3xl font-black tracking-tighter text-construction-blue dark:text-construction-blue leading-none">
            TEAM
          </h1>
          {isAdmin && (
            <Button
              size="lg"
              onClick={() => setShowInviteModal(true)}
              className="relative h-11 px-4 bg-gradient-to-r from-construction-blue to-blue-700 hover:from-construction-blue/90 hover:to-blue-700/90 shadow-construction-lg transition-all group overflow-hidden text-white"
            >
              <Plus className="mr-1.5 h-4 w-4 group-hover:rotate-90 transition-transform" />
              <span className="font-black text-sm">INVITE</span>
            </Button>
          )}
        </div>
      </div>

      {/* Team Summary */}
      {teamSummaryStats && (
        <div className="mb-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <TeamSummary stats={teamSummaryStats} />
        </div>
      )}

      {/* Filters */}
      <TeamFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        roleFilter={roleFilter}
        onRoleChange={setRoleFilter}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        sortBy={sortBy}
        onSortChange={setSortBy}
        members={members}
      />

      {/* Team List */}
      {filteredMembers.length === 0 ? (
        <MobileNoResultsState onClearFilters={clearFilters} />
      ) : (
        <TeamGrid members={filteredMembers} isMobile={true} />
      )}
    </div>
  </PullToRefresh>
</div>
```

**Layout Structure (Desktop):**
```tsx
<div className="flex-1 space-y-4 md:space-y-6 p-4 md:p-8 pt-4 md:pt-6 relative overflow-hidden">
  <BlueprintBackground />

  {/* Header */}
  <div className="relative">
    <div className="absolute top-0 left-0 right-0 h-1 bg-construction-blue" />
    <div className="flex flex-col gap-4 pt-2 md:pt-4">
      <div className="flex items-start justify-between gap-3">
        <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-construction-blue dark:text-construction-blue leading-none">
          TEAM
        </h1>
        {isAdmin && (
          <Button
            size="lg"
            onClick={() => setShowInviteModal(true)}
            className="relative w-full md:w-auto h-11 md:h-14 px-4 md:px-8 bg-gradient-to-r from-construction-blue to-blue-700 hover:from-construction-blue/90 hover:to-blue-700/90 shadow-construction-lg hover:shadow-construction-xl transition-all group overflow-hidden text-white"
          >
            <Plus className="mr-1.5 md:mr-2 h-4 w-4 md:h-5 md:w-5 group-hover:rotate-90 transition-transform" />
            <span className="font-black text-sm md:text-base">INVITE</span>
            <span className="hidden sm:inline font-black text-sm md:text-base ml-1">
              TEAM MEMBER
            </span>
          </Button>
        )}
      </div>
    </div>
  </div>

  {/* Team Summary */}
  {teamSummaryStats && (
    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
      <TeamSummary stats={teamSummaryStats} />
    </div>
  )}

  {/* Filters */}
  <TeamFilters {...filterProps} />

  {/* Team Table/Grid */}
  {filteredMembers.length === 0 ? (
    <NoResultsState onClearFilters={clearFilters} />
  ) : (
    <TeamMemberTable members={filteredMembers} {...tableProps} />
  )}

  <div className="h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-700 to-transparent" />
</div>
```

---

### 3. TeamSummary (New Component)
**File:** `components/team/TeamSummary.tsx`

**Purpose:** Display team-level statistics similar to PortfolioSummary

**Interface:**
```tsx
export interface TeamSummaryStats {
  totalMembers: number;
  activeMembers: number;
  invitedMembers: number;
  adminCount: number;
  pmCount: number;
  workerCount: number;
  roleDistribution: Array<{
    role: string;
    count: number;
    percentage: number;
  }>;
  recentJoins: Array<{
    id: string;
    name: string;
    joinedDays: number;
  }>;
}

interface TeamSummaryProps {
  stats: TeamSummaryStats;
  className?: string;
}
```

**Structure (following PortfolioSummary pattern):**
```tsx
export function TeamSummary({ stats, className }: TeamSummaryProps) {
  return (
    <div className={cn(
      'bg-white dark:bg-gray-900 rounded-xl overflow-hidden',
      'border-2 border-gray-200 dark:border-gray-700 shadow-sm',
      className
    )}>
      {/* Header with icon */}
      <div className="px-4 py-3.5 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-gray-50/80 dark:from-gray-800/50 to-white dark:to-gray-900">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-construction-blue flex items-center justify-center shadow-sm">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-construction-blue text-sm uppercase tracking-wide">
              Team Overview
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {stats.activeMembers} active member{stats.activeMembers !== 1 ? 's' : ''}
            </p>
          </div>
          {/* Status badge */}
          <div className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
            Ready
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="p-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2.5 mb-4">
          <StatCard label="Total" value={stats.totalMembers} subtext="Members" />
          <StatCard label="Active" value={stats.activeMembers} subtext="On Duty" variant="success" />
          <StatCard label="Pending" value={stats.invitedMembers} subtext="Invited" />
        </div>

        {/* Role Distribution */}
        <div className="grid grid-cols-2 gap-2.5 mb-4">
          <StatCard icon={Shield} label="Admins" value={stats.adminCount} />
          <StatCard icon={HardHat} label="Managers" value={stats.pmCount} />
          <StatCard icon={Hammer} label="Workers" value={stats.workerCount} />
        </div>

        {/* Recent Joins (if any) */}
        {stats.recentJoins.length > 0 && (
          <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-2 mb-3">
              <UserPlus className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Recent Joins
              </span>
            </div>
            {/* List recent joins */}
          </div>
        )}
      </div>
    </div>
  );
}
```

---

### 4. TeamFilters (New Component)
**File:** `components/team/TeamFilters.tsx`

**Purpose:** Provide filtering UI matching ProjectFilters pattern

**Interface:**
```tsx
interface TeamFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  roleFilter: string;
  onRoleChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
  sortBy: string;
  onSortChange: (value: string) => void;
  members: TeamMember[];
}
```

**Structure:**
```tsx
export function TeamFilters({ ... }: TeamFiltersProps) {
  // Calculate status counts
  const statusCounts = useMemo(() => {
    // Filter logic similar to ProjectFilters
  }, [members, searchQuery, roleFilter]);

  const statusTabs = useMemo(() => [
    { value: 'all', label: 'All', count: statusCounts.all },
    { value: 'active', label: 'Active', count: statusCounts.active },
    { value: 'invited', label: 'Invited', count: statusCounts.invited },
    { value: 'inactive', label: 'Inactive', count: statusCounts.inactive },
  ], [statusCounts]);

  return (
    <div className="space-y-4 mb-3">
      {/* Status tabs - mobile */}
      <div className="md:hidden">
        <FilterTabs
          tabs={statusTabs}
          value={statusFilter}
          onChange={onStatusChange}
          showCounts={true}
          useStatusGradients={true}
          layoutId="teamStatusTabsMobile"
        />
      </div>

      {/* Status tabs - desktop */}
      <div className="hidden md:block">
        <DesktopTabs
          tabs={statusTabs}
          value={statusFilter}
          onChange={onStatusChange}
          showCounts={true}
          useStatusGradients={true}
          layoutId="teamStatusTabs"
        />
      </div>

      {/* Search & dropdowns */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:flex-wrap">
        <div className="flex-1 min-w-[280px]">
          <PlaceholdersVanishInput
            placeholders={["Search team...", "Find by name...", "Search by email...", "Filter by role..."]}
            value={searchQuery}
            onChange={onSearchChange}
            onClear={() => onSearchChange('')}
          />
        </div>

        <div className="grid grid-cols-2">
          {/* Role filter dropdown */}
          <Select value={roleFilter} onValueChange={onRoleChange}>
            <SelectTrigger className="w-full md:w-[180px] h-11 border-2 border-gray-200 dark:border-gray-700 font-bold hover:border-construction-blue/50 dark:hover:border-construction-blue/70 transition-colors dark:bg-gray-900">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="project_manager">Project Manager</SelectItem>
              <SelectItem value="foreman">Foreman</SelectItem>
              <SelectItem value="field_worker">Field Worker</SelectItem>
            </SelectContent>
          </Select>

          {/* Sort dropdown */}
          <Select value={sortBy} onValueChange={onSortChange}>
            <SelectTrigger className="w-full md:w-[170px] h-11 border-2 border-gray-200 dark:border-gray-700 font-bold hover:border-construction-blue/50 dark:hover:border-construction-blue/70 transition-colors dark:bg-gray-900">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name (A-Z)</SelectItem>
              <SelectItem value="email">Email (A-Z)</SelectItem>
              <SelectItem value="role">Role</SelectItem>
              <SelectItem value="joined">Recently Joined</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
```

---

### 5. TeamMemberCard (Updated)
**File:** `components/team/TeamMemberCard.tsx`

**Changes Required:**
- Ensure 44px minimum touch target
- Match construction-blue theme for active states
- Update badge styling to match ProjectCard badges
- Add hover/active states matching project cards

**No major structural changes - maintain existing functionality, update styling only**

---

### 6. Empty States

**Mobile No Results:**
```tsx
const MobileNoResultsState = memo(function MobileNoResultsState({
  onClearFilters,
}: {
  onClearFilters: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
        <Users className="w-8 h-8 text-gray-400 dark:text-gray-600" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
        No team members found
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 max-w-xs">
        Try adjusting your filters
      </p>
      <button
        type="button"
        onClick={onClearFilters}
        className="h-11 px-6 rounded-xl font-semibold text-construction-red bg-red-50 dark:bg-construction-red/10 active:bg-red-100 dark:active:bg-construction-red/20 transition-colors"
      >
        Clear Filters
      </button>
    </div>
  );
});
```

**Desktop No Results:**
```tsx
const NoResultsState = memo(function NoResultsState({
  onClearFilters,
}: {
  onClearFilters: () => void;
}) {
  return (
    <div className="relative">
      <div className="absolute inset-0 border-2 border-dashed border-construction-red/20 dark:border-construction-red/30 rounded-xl transform rotate-1" />
      <div className="relative flex flex-col items-center justify-center py-16 md:py-20 px-4 md:px-8 bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700">
        <motion.div
          className="mb-4 md:mb-6 p-4 md:p-6 bg-gradient-to-br from-construction-red/10 to-construction-red/5 dark:from-construction-red/20 dark:to-construction-red/10 rounded-2xl border-2 border-construction-red/20 dark:border-construction-red/40"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, type: 'spring' }}
        >
          <ShieldAlert className="h-12 w-12 md:h-16 md:w-16 text-construction-red" />
        </motion.div>
        <h3 className="text-xl md:text-3xl font-black text-construction-red mb-2 md:mb-3">
          NO TEAM MEMBERS FOUND
        </h3>
        <p className="text-gray-600 dark:text-gray-400 font-medium mb-4 md:mb-8 max-w-md text-center text-sm md:text-lg">
          No team members match your current filters. Adjust search criteria or clear all filters.
        </p>
        <Button
          size="lg"
          onClick={onClearFilters}
          className="h-11 md:h-12 px-6 md:px-8 bg-white dark:bg-gray-900 border-2 border-construction-red hover:bg-construction-red hover:text-white dark:hover:bg-construction-red dark:hover:text-white transition-all shadow-construction font-black group"
        >
          <X className="mr-2 h-4 w-4 md:h-5 md:w-5 group-hover:rotate-90 transition-transform" />
          CLEAR ALL FILTERS
        </Button>
      </div>
    </div>
  );
});
```

---

## Styling Specifications

### Color Palette
```css
/* Primary Brand */
--construction-blue: #001B51
--construction-accent: #3C3C3C

/* Status Colors */
--construction-green: #059669 (active/success)
--construction-yellow: #F59E0B (warning)
--construction-red: #DC2626 (error/inactive)

/* Dark Mode */
dark:bg-gray-900 (cards)
dark:bg-gray-800 (secondary surfaces)
dark:border-gray-700 (borders)
dark:text-gray-100 (primary text)
```

### Typography
```css
/* Page Title */
text-3xl md:text-5xl
font-black
tracking-tighter
text-construction-blue
leading-none

/* Section Headers */
text-xl md:text-2xl
font-bold
text-gray-900 dark:text-gray-100

/* Body Text */
text-sm md:text-base
font-medium
text-gray-700 dark:text-gray-300
```

### Spacing System
```css
/* Page Container */
flex-1
space-y-4 md:space-y-6
p-4 md:p-8
pt-4 md:pt-6

/* Card Padding */
p-3 md:p-4 (content)
px-4 py-3.5 (header)

/* Gaps */
gap-2.5 md:gap-4 (grids)
gap-3 md:gap-6 (sections)
```

### Touch Targets
```css
/* Buttons */
min-h-[44px] (mobile)
h-11 md:h-14 (desktop)

/* Interactive Cards */
min-h-[60px]
p-4 (ensures 44px+ target)
```

---

## Error Handling

| Scenario | Response | User Message |
|----------|----------|--------------|
| No team members | Empty state card | "Build your team - Invite members to start collaborating" |
| Filter no results | No results state | "No team members found - Try adjusting filters" |
| Load failure | Error boundary | "Failed to load team - Please refresh" |
| Invite error | Toast notification | Field-specific error from server |

---

## Security Considerations
- Maintain existing RLS checks (no changes to data access)
- Preserve role-based UI visibility (isAdmin checks)
- No new security surface area (styling only)
- Ensure no sensitive data exposed in client state

---

## Performance Optimizations
- Use `useMemo` for filtered/sorted members (matches Projects)
- Memoize TeamSummary stats calculation
- CSS animations instead of framer-motion where possible
- Dynamic import for InviteTeamMemberModal (already implemented)
- Virtual scrolling if team > 100 members (future enhancement)

---

**Status:** PENDING APPROVAL
**Approval Required:** [X] Yes / [ ] No (proceed to tasks)
