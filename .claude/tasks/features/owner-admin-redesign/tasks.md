# Tasks: Owner Admin Pages Redesign

> Implementation tasks for modernizing platform admin pages

**Requirement**: [requirement.md](./requirement.md)
**Design**: [design.md](./design.md)

---

## Task Breakdown

### Phase 1: Foundation Components (P0)

#### TASK-001: Create OwnerPageHeader Component
**Priority**: P0
**Est**: 1 hour
**Dependencies**: None

**Acceptance Criteria**:
- [ ] Component file created at `components/owner/OwnerPageHeader.tsx`
- [ ] Props interface includes: title, subtitle, icon?, action?
- [ ] Uses industrial header style (text-3xl md:text-5xl font-black)
- [ ] Displays "Platform Admin" label above title
- [ ] Shows construction-blue top border
- [ ] Optional icon renders in construction-blue circle
- [ ] Optional action button renders in top-right
- [ ] Responsive: smaller text on mobile (<768px)
- [ ] TypeScript strict mode compliant

**Files to Create**:
- `components/owner/OwnerPageHeader.tsx`

**Files to Modify**:
- None

**Verification**:
```bash
# Visual check
npm run dev
# Navigate to /app/owner/companies
# Verify header matches design spec
```

---

#### TASK-002: Create OwnerStatsGrid Component
**Priority**: P0
**Est**: 2 hours
**Dependencies**: TASK-001

**Acceptance Criteria**:
- [ ] Component file created at `components/owner/OwnerStatsGrid.tsx`
- [ ] Uses existing `KPICard` component from `components/dashboard/KPICard.tsx`
- [ ] Props interface includes: stats[], columns?, isLoading?
- [ ] Supports 2/3/4 column grid layouts
- [ ] Responsive: 2 cols mobile, 3/4 cols desktop
- [ ] Loading state shows skeleton grid matching columns prop
- [ ] Skeleton cards match KPICard dimensions (120px min-height)
- [ ] Gap spacing: 12px mobile (gap-3), 16px desktop (gap-4)
- [ ] Grid uses Tailwind grid classes, not flex

**Files to Create**:
- `components/owner/OwnerStatsGrid.tsx`

**Files to Modify**:
- None

**Verification**:
```tsx
// Test with mock data
const stats = [
  { title: 'Companies', value: 12, icon: Building2, variant: 'default' },
  { title: 'Users', value: 48, icon: Users, variant: 'success' },
];

<OwnerStatsGrid stats={stats} columns={4} />
<OwnerStatsGrid stats={[]} columns={4} isLoading />
```

---

#### TASK-003: Create OwnerDataTable Component (Table Mode Only)
**Priority**: P0
**Est**: 4 hours
**Dependencies**: None

**Acceptance Criteria**:
- [ ] Component file created at `components/owner/OwnerDataTable.tsx`
- [ ] Generic TypeScript interface: `<T>`
- [ ] Props include: data, columns, keyField, emptyState, searchable?, searchKeys?
- [ ] Desktop (≥768px): Renders semantic `<table>` with sticky header
- [ ] Search integration: Uses `SearchInput` from `components/mobile/SearchInput.tsx`
- [ ] Search debounce: 300ms
- [ ] Empty state: Icon + title + description (centered, 80px icon size)
- [ ] Loading skeleton: Table structure with 5 placeholder rows
- [ ] Column.hiddenOnMobile: Hides column on <768px
- [ ] Accessible: `<table>`, `<thead>`, `<tbody>`, `<th scope="col">`
- [ ] Border: 2px solid, rounded-lg, shadow-construction

**Files to Create**:
- `components/owner/OwnerDataTable.tsx`

**Files to Modify**:
- None

**Notes**:
- Mobile card view will be added in Phase 2 (TASK-008)
- Focus on desktop table functionality first

**Verification**:
```tsx
const columns = [
  { key: 'name', header: 'Name' },
  { key: 'email', header: 'Email', hiddenOnMobile: true },
];

<OwnerDataTable
  data={users}
  columns={columns}
  keyField="id"
  searchable
  searchKeys={['name', 'email']}
  emptyState={{ icon: Users, title: 'No Users', description: 'No users found.' }}
/>
```

---

### Phase 2: Card Components (P1)

#### TASK-004: Create CompanyCard Component
**Priority**: P1
**Est**: 2 hours
**Dependencies**: None

**Acceptance Criteria**:
- [ ] Component file created at `components/owner/CompanyCard.tsx`
- [ ] Props interface matches Company type from server action
- [ ] Uses `CardSurface` wrapper with interactive prop
- [ ] Building2 icon in construction-blue/10 circle (44px)
- [ ] Company name as bold title (truncate if >30 chars)
- [ ] Contact info: Email, Phone, Address with Lucide icons
- [ ] Stats row: User count + Project count with badges
- [ ] "Joined X ago" timestamp using date-fns formatDistanceToNow
- [ ] All touch targets ≥44px
- [ ] Active state: scale-[0.99] on press
- [ ] onClick handler optional (for future detail view)

**Files to Create**:
- `components/owner/CompanyCard.tsx`

**Files to Modify**:
- None

**Verification**:
```tsx
const mockCompany = {
  id: '1',
  name: 'Acme Construction',
  email: 'admin@acme.com',
  phone: '(555) 123-4567',
  address: '123 Main St, City, State',
  created_at: new Date().toISOString(),
  user_count: 12,
  project_count: 8,
};

<CompanyCard company={mockCompany} onClick={() => console.log('clicked')} />
```

---

#### TASK-005: Create UserRow Component (Desktop Only)
**Priority**: P1
**Est**: 2 hours
**Dependencies**: None

**Acceptance Criteria**:
- [ ] Component file created at `components/owner/UserRow.tsx`
- [ ] Props interface matches User type from getAllUsers action
- [ ] Renders as `<tr>` with `<td>` cells
- [ ] Avatar: 32px circle, fallback to initials in construction-blue circle
- [ ] Name + Email in first column (stacked on mobile via hiddenOnMobile)
- [ ] Company name with Building2 icon
- [ ] Role badge using existing ROLE_DISPLAY mapping from users page
- [ ] Status indicator: CheckCircle (green), Mail (yellow), AlertCircle (gray)
- [ ] Joined date with Clock icon, formatDistanceToNow
- [ ] Hover state: bg-gray-50/50 dark:hover:bg-gray-800/50

**Files to Create**:
- `components/owner/UserRow.tsx`

**Files to Modify**:
- None

**Verification**:
```tsx
const mockUser = {
  id: '1',
  name: 'John Smith',
  email: 'john@acme.com',
  avatar_url: null,
  role: 'admin',
  status: 'active',
  company_name: 'Acme Construction',
  created_at: new Date().toISOString(),
};

<table>
  <tbody>
    <UserRow user={mockUser} />
  </tbody>
</table>
```

---

#### TASK-006: Create UserCard Component (Mobile Only)
**Priority**: P1
**Est**: 2 hours
**Dependencies**: TASK-005

**Acceptance Criteria**:
- [ ] Component file created at `components/owner/UserCard.tsx`
- [ ] Props interface matches User type (same as UserRow)
- [ ] Uses `CardSurface` wrapper
- [ ] Avatar + name + email in header section
- [ ] Company name with Building2 icon
- [ ] Role badge (inline, not block)
- [ ] Status indicator: Active/Invited/Inactive with dot icon
- [ ] Joined date on same line as status
- [ ] All touch targets ≥44px
- [ ] Active state on press if onClick provided
- [ ] Shares ROLE_DISPLAY mapping with UserRow

**Files to Create**:
- `components/owner/UserCard.tsx`

**Files to Modify**:
- None

**Notes**:
- Consider extracting ROLE_DISPLAY to shared constant file: `lib/constants/roles.ts`

**Verification**:
```tsx
<UserCard user={mockUser} onClick={() => console.log('clicked')} />
```

---

#### TASK-007: Create InvitationCard Component
**Priority**: P1
**Est**: 3 hours
**Dependencies**: None

**Acceptance Criteria**:
- [ ] Component file created at `components/owner/InvitationCard.tsx`
- [ ] Props: invitation, onCopyLink, onRevoke, isRevoking?
- [ ] Uses `SwipeableCard` wrapper from `components/mobile/SwipeableCard.tsx`
- [ ] Swipe right action: Copy link (green bg, Copy icon)
- [ ] Swipe left action: Revoke (red bg, Trash2 icon)
- [ ] Email as primary text (bold, truncate if long)
- [ ] Optional name as secondary text
- [ ] Sent date with Clock icon
- [ ] Expires date with Calendar icon
- [ ] Expired badge: "EXPIRED" in red if isAfter(now, expires_at)
- [ ] Desktop: Show Copy/Revoke buttons (no swipe needed)
- [ ] Mobile: Buttons hidden, revealed via swipe
- [ ] Haptic feedback on swipe threshold cross

**Files to Create**:
- `components/owner/InvitationCard.tsx`

**Files to Modify**:
- None

**Verification**:
```tsx
const mockInvitation = {
  id: '1',
  email: 'newadmin@company.com',
  name: 'Jane Doe',
  invitation_token: 'abc123',
  invited_at: new Date().toISOString(),
  expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
};

<InvitationCard
  invitation={mockInvitation}
  onCopyLink={(link) => console.log('Copy:', link)}
  onRevoke={(id, email) => console.log('Revoke:', id, email)}
/>
```

---

### Phase 3: Responsive Table Enhancement (P1)

#### TASK-008: Add Mobile Card Mode to OwnerDataTable
**Priority**: P1
**Est**: 3 hours
**Dependencies**: TASK-003, TASK-004, TASK-006

**Acceptance Criteria**:
- [ ] Modify `components/owner/OwnerDataTable.tsx`
- [ ] Add `renderCard` prop: `(item: T) => React.ReactNode`
- [ ] Desktop (≥768px): Render table (existing behavior)
- [ ] Mobile (<768px): Render card grid using renderCard prop
- [ ] Card grid: 1 column on mobile, gap-3
- [ ] Search works for both table and card views
- [ ] Loading skeleton: Card skeletons on mobile, table skeleton on desktop
- [ ] Empty state: Same for both views
- [ ] No horizontal scroll on mobile
- [ ] Cards use motion.div with stagger animation (50ms delay)

**Files to Modify**:
- `components/owner/OwnerDataTable.tsx`

**Verification**:
```tsx
<OwnerDataTable
  data={companies}
  columns={companyColumns}
  keyField="id"
  renderCard={(company) => <CompanyCard company={company} />}
  searchable
  searchKeys={['name', 'email']}
  emptyState={{ icon: Building2, title: 'No Companies', description: 'No companies found.' }}
/>

// Test at 375px viewport (mobile)
// Test at 1024px viewport (desktop)
```

---

### Phase 4: Layout Enhancement (P1)

#### TASK-009: Create OwnerTabs Component
**Priority**: P1
**Est**: 2 hours
**Dependencies**: None

**Acceptance Criteria**:
- [ ] Component file created at `components/owner/OwnerTabs.tsx`
- [ ] Uses `SegmentedControl` from `components/mobile/SegmentedControl.tsx`
- [ ] Three tabs: Companies, Users, Invites
- [ ] Active tab determined by `usePathname()` hook
- [ ] Navigation via Next.js Link component
- [ ] Invites tab shows count badge if pendingInvitations > 0
- [ ] Badge displays as "99+" if count > 99
- [ ] Haptic feedback on tab change (useHapticFeedback hook)
- [ ] Spring animation transition (stiffness: 400, damping: 30)
- [ ] Full width on mobile, auto width on desktop
- [ ] Props: currentPath (string), stats? (object with counts)

**Files to Create**:
- `components/owner/OwnerTabs.tsx`

**Files to Modify**:
- None

**Verification**:
```tsx
const stats = {
  totalCompanies: 12,
  totalUsers: 48,
  pendingInvitations: 5,
};

<OwnerTabs currentPath="/app/owner/users" stats={stats} />
```

---

#### TASK-010: Enhance OwnerLayout with Tabs and Background
**Priority**: P1
**Est**: 3 hours
**Dependencies**: TASK-009

**Acceptance Criteria**:
- [ ] Modify `app/app/owner/layout.tsx`
- [ ] Wrap children in shared blueprint grid background div
- [ ] Add "Platform Admin" section with orange accent bar
- [ ] Fetch `getOwnerDashboardStats()` for tab badge counts
- [ ] Render `OwnerTabs` component below header
- [ ] Background: fixed, inset-0, pointer-events-none, opacity-[0.03]
- [ ] Background grid: 40px cells, construction-blue color
- [ ] Padding: p-4 md:p-8, pt-4 md:pt-6
- [ ] Handle error state if stats fetch fails (hide badge counts)
- [ ] Handle loading state (optional skeleton tabs)

**Files to Modify**:
- `app/app/owner/layout.tsx`

**Server Action**:
```tsx
// Add to app/actions/owner.ts if doesn't exist
export async function getOwnerDashboardStats() {
  // Return { totalCompanies, totalUsers, pendingInvitations }
}
```

**Verification**:
```bash
# Navigate to /app/owner/companies
# Verify blueprint background is visible
# Verify tabs render above page content
# Verify badge count on Invites tab
# Switch tabs and verify smooth transition
```

---

### Phase 5: Page Refactors (P2)

#### TASK-011: Refactor Companies Page
**Priority**: P2
**Est**: 2 hours
**Dependencies**: TASK-001, TASK-002, TASK-004, TASK-008, TASK-010

**Acceptance Criteria**:
- [ ] Modify `app/app/owner/companies/page.tsx`
- [ ] Remove local blueprint background (now in layout)
- [ ] Remove local industrial header (use `OwnerPageHeader`)
- [ ] Replace manual stat cards with `OwnerStatsGrid`
- [ ] Replace company grid with `OwnerDataTable` using `CompanyCard`
- [ ] Add search functionality via OwnerDataTable
- [ ] Reduce LOC from ~235 to ~120 lines
- [ ] Maintain existing Server Action calls (getAllCompanies, getOwnerDashboardStats)
- [ ] Maintain existing error handling
- [ ] Maintain existing empty state

**Files to Modify**:
- `app/app/owner/companies/page.tsx`

**Verification**:
```bash
# Desktop (1024px+):
- [ ] Stats grid shows 4 cards
- [ ] Companies display as 3-column card grid
- [ ] Search filters companies by name/email
- [ ] Empty state shows if no companies

# Mobile (<768px):
- [ ] Stats grid shows 2 columns
- [ ] Companies display as single-column list
- [ ] Search input is full width
- [ ] Cards have 44px minimum touch targets
```

---

#### TASK-012: Refactor Users Page
**Priority**: P2
**Est**: 3 hours
**Dependencies**: TASK-001, TASK-002, TASK-005, TASK-006, TASK-008, TASK-010

**Acceptance Criteria**:
- [ ] Modify `app/app/owner/users/page.tsx`
- [ ] Remove local blueprint background
- [ ] Remove local industrial header
- [ ] Replace manual stat cards with `OwnerStatsGrid`
- [ ] Replace `<table>` with `OwnerDataTable` component
- [ ] Desktop: Use `UserRow` for table rows
- [ ] Mobile: Use `UserCard` via renderCard prop
- [ ] Add search by name/email/company
- [ ] Reduce LOC from ~326 to ~140 lines
- [ ] Maintain existing ROLE_DISPLAY and STATUS_DISPLAY mappings
- [ ] Maintain existing user data fetching
- [ ] Extract ROLE_DISPLAY to `lib/constants/roles.ts` for reuse

**Files to Modify**:
- `app/app/owner/users/page.tsx`

**Files to Create**:
- `lib/constants/roles.ts` (extract ROLE_DISPLAY mapping)

**Verification**:
```bash
# Desktop:
- [ ] Users display in table format
- [ ] Columns: User, Email, Company, Role, Status, Joined
- [ ] Role badges match existing colors
- [ ] Status icons match existing logic
- [ ] Search filters by name/email/company

# Mobile:
- [ ] Users display as cards
- [ ] Email visible below name
- [ ] Company and role inline
- [ ] Status and joined date inline
```

---

#### TASK-013: Refactor Invites Page and Client Component
**Priority**: P2
**Est**: 3 hours
**Dependencies**: TASK-001, TASK-002, TASK-007, TASK-010

**Acceptance Criteria**:
- [ ] Modify `app/app/owner/invites/page.tsx`
- [ ] Remove local blueprint background
- [ ] Remove local industrial header
- [ ] Use `OwnerStatsGrid` for pending invitation count
- [ ] Reduce page LOC from ~99 to ~80 lines
- [ ] Modify `components/owner/OwnerInvitesClient.tsx`
- [ ] Replace list items with `InvitationCard` components
- [ ] Use SwipeableCard for mobile swipe actions
- [ ] Desktop: Show copy/revoke buttons directly
- [ ] Mobile: Swipe to reveal actions
- [ ] Reduce client LOC from ~353 to ~180 lines
- [ ] Maintain existing form functionality
- [ ] Maintain existing success/error alerts

**Files to Modify**:
- `app/app/owner/invites/page.tsx`
- `components/owner/OwnerInvitesClient.tsx`

**Verification**:
```bash
# Form:
- [ ] Email and name inputs work correctly
- [ ] Success alert shows invitation link
- [ ] Copy/open link buttons work
- [ ] Form resets after successful send

# Invitation List:
# Desktop:
- [ ] Copy and revoke buttons visible
- [ ] Click copy: Link copied to clipboard
- [ ] Click revoke: Confirmation toast, list updates

# Mobile:
- [ ] Swipe right: Copy action revealed (green)
- [ ] Swipe left: Revoke action revealed (red)
- [ ] Swipe triggers haptic feedback
- [ ] Expired invitations show badge
```

---

### Phase 6: Polish & Testing (P3)

#### TASK-014: Add Loading Skeletons
**Priority**: P3
**Est**: 2 hours
**Dependencies**: All components created

**Acceptance Criteria**:
- [ ] OwnerStatsGrid: Skeleton grid matches columns prop
- [ ] OwnerDataTable: Desktop table skeleton, mobile card skeletons
- [ ] CompanyCard: Skeleton matches card structure
- [ ] UserCard: Skeleton matches card structure
- [ ] All skeletons use animate-pulse
- [ ] Skeletons use gray-200 (light) / gray-700 (dark) backgrounds
- [ ] Skeleton dimensions match final component exactly
- [ ] Loading state shows <50ms after component mount

**Files to Modify**:
- `components/owner/OwnerStatsGrid.tsx`
- `components/owner/OwnerDataTable.tsx`
- `components/owner/CompanyCard.tsx`
- `components/owner/UserCard.tsx`

**Verification**:
```tsx
// Force loading state
<OwnerStatsGrid stats={[]} columns={4} isLoading />
<OwnerDataTable data={[]} columns={[]} keyField="id" emptyState={{...}} isLoading />
<CompanyCardSkeleton />
<UserCardSkeleton />
```

---

#### TASK-015: Add Stagger Animations
**Priority**: P3
**Est**: 2 hours
**Dependencies**: TASK-008, TASK-011, TASK-012, TASK-013

**Acceptance Criteria**:
- [ ] OwnerDataTable mobile card grid uses stagger animation
- [ ] Container: containerVariants with staggerChildren: 0.05
- [ ] Cards: cardVariants with hidden/visible states
- [ ] Animation config: spring, stiffness: 400, damping: 30
- [ ] Cards enter with opacity 0→1 and y: 10→0
- [ ] 50ms delay between each card
- [ ] Total animation time for 10 cards: ~500ms
- [ ] Animation only on initial mount, not on search filter

**Files to Modify**:
- `components/owner/OwnerDataTable.tsx`

**Verification**:
```bash
# Navigate to /app/owner/companies on mobile
# Verify cards fade in one by one
# Verify smooth spring animation
# Search for company, verify no re-animation on filter
```

---

#### TASK-016: Accessibility Audit
**Priority**: P3
**Est**: 3 hours
**Dependencies**: All tasks complete

**Acceptance Criteria**:
- [ ] Run Lighthouse accessibility audit on all three pages
- [ ] Score: 100/100 on each page
- [ ] Fix any ARIA attribute issues
- [ ] Fix any color contrast issues
- [ ] Fix any missing alt text issues
- [ ] Verify keyboard navigation works:
  - [ ] Tab through all interactive elements
  - [ ] Enter/Space activates buttons
  - [ ] Focus indicators visible (construction-blue ring)
- [ ] Verify screen reader announces:
  - [ ] Tab changes
  - [ ] Search results count
  - [ ] Loading states
  - [ ] Error messages

**Files to Modify**:
- Any files with accessibility issues

**Tools**:
```bash
# Lighthouse
npm run build
npm run start
# Open Chrome DevTools → Lighthouse → Accessibility

# axe DevTools
# Install Chrome extension
# Scan each page

# Screen reader testing
# macOS: VoiceOver (Cmd+F5)
# Windows: NVDA
```

---

#### TASK-017: Visual Regression Testing
**Priority**: P3
**Est**: 2 hours
**Dependencies**: All tasks complete

**Acceptance Criteria**:
- [ ] Capture screenshots: Desktop (1920x1080), Tablet (768x1024), Mobile (375x667)
- [ ] Test all three pages: companies, users, invites
- [ ] Test light and dark modes
- [ ] Test loading states (skeletons)
- [ ] Test empty states
- [ ] Test error states
- [ ] Test hover states (desktop)
- [ ] Test active states (mobile)
- [ ] Store baseline images in `__screenshots__/owner/`
- [ ] Add to CI pipeline (optional)

**Tools**:
```bash
# Playwright screenshot tests
npm run test:visual

# Or manual capture
npm run dev
# Use browser DevTools device toolbar
# Screenshot each viewport size
```

---

#### TASK-018: Performance Testing
**Priority**: P3
**Est**: 2 hours
**Dependencies**: All tasks complete

**Acceptance Criteria**:
- [ ] Measure tab navigation speed: <200ms target
- [ ] Measure search filter latency: <300ms target
- [ ] Measure card render time (100 items): <500ms target
- [ ] Measure skeleton load time: <50ms target
- [ ] Run Lighthouse Performance audit: >90 score
- [ ] Check bundle size increase: <15KB (gzip)
- [ ] Profile React re-renders: No unnecessary re-renders on search
- [ ] Test on throttled CPU (4x slowdown): Still usable

**Tools**:
```bash
# Lighthouse Performance
npm run build
npm run start
# Chrome DevTools → Lighthouse → Performance

# Bundle size
npm run build
# Check .next/static/chunks for new owner components

# React Profiler
# Chrome React DevTools → Profiler
# Record interaction, analyze flamegraph
```

---

## Task Summary

| Phase | Tasks | Est. Time | Priority |
|-------|-------|-----------|----------|
| Phase 1: Foundation | TASK-001 to TASK-003 | 7 hours | P0 |
| Phase 2: Cards | TASK-004 to TASK-007 | 9 hours | P1 |
| Phase 3: Responsive Table | TASK-008 | 3 hours | P1 |
| Phase 4: Layout | TASK-009 to TASK-010 | 5 hours | P1 |
| Phase 5: Pages | TASK-011 to TASK-013 | 8 hours | P2 |
| Phase 6: Polish | TASK-014 to TASK-018 | 11 hours | P3 |
| **Total** | **18 tasks** | **43 hours** | - |

---

## Execution Order

### Week 1: Foundation (P0 + P1 Foundation)
- Day 1: TASK-001, TASK-002 (Headers + Stats)
- Day 2: TASK-003 (DataTable)
- Day 3: TASK-004, TASK-005 (Company + UserRow)
- Day 4: TASK-006, TASK-007 (UserCard + Invitation)
- Day 5: TASK-008 (Mobile Cards)

### Week 2: Integration (P1 Layout + P2 Pages)
- Day 1: TASK-009, TASK-010 (Tabs + Layout)
- Day 2: TASK-011 (Companies Page)
- Day 3: TASK-012 (Users Page)
- Day 4: TASK-013 (Invites Page)
- Day 5: Integration testing

### Week 3: Polish (P3)
- Day 1: TASK-014, TASK-015 (Skeletons + Animations)
- Day 2: TASK-016 (Accessibility)
- Day 3: TASK-017 (Visual Regression)
- Day 4: TASK-018 (Performance)
- Day 5: Final QA + Deployment

---

## Definition of Done

For each task:
- [ ] Code written and follows GenHub code style
- [ ] TypeScript errors: 0
- [ ] ESLint warnings: 0
- [ ] Component renders without console errors
- [ ] Manual testing completed (desktop + mobile viewports)
- [ ] Dark mode verified
- [ ] Committed to feature branch with descriptive commit message
- [ ] PR created with screenshot/video demo

For the feature:
- [ ] All 18 tasks completed
- [ ] All three pages refactored
- [ ] Lighthouse Accessibility: 100/100
- [ ] Lighthouse Performance: >90
- [ ] Visual regression tests passing
- [ ] No TypeScript/ESLint errors
- [ ] Approved by product owner
- [ ] Merged to main branch
- [ ] Deployed to production

---

## Blockers & Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| SwipeableCard bugs on iOS Safari | Medium | Medium | Extensive touch event testing, fallback to buttons |
| Search performance on large datasets (1000+ items) | Low | Medium | Add virtualization if needed (react-window) |
| Dark mode color contrast issues | Low | Low | Use exact hex values from design system |
| Layout shift during tab navigation | Low | Medium | Preload stats for all tabs, skeleton fallback |
| Bundle size increase >15KB | Low | Low | Code split owner components, lazy load |

---

## Success Metrics (Recap)

- [ ] LOC reduction: >600 lines across all pages
- [ ] Component reuse: 100% (all pages use shared components)
- [ ] Tab navigation: <200ms
- [ ] Search filter: <300ms debounce
- [ ] Mobile coverage: 100% (all pages responsive)
- [ ] Accessibility: 100/100 Lighthouse score
- [ ] Performance: >90 Lighthouse score
- [ ] Zero regression bugs in production
