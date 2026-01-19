# Frontend Component Refactoring Report (No-Code-Change)

Generated from `.claude/plans/frontend-component-refactoring.md` and Vercel React/Next.js best practices. No code changes were made.

## Scope & Method

- Scanned **all files under `components/`** plus `app/**/page.tsx` and `app/**/layout.tsx`.
- Focused on duplicate UI patterns, repeated Tailwind strings, repeated helper logic, and Vercel performance opportunities.
- Deep reads across modal, chat, tasks, mobile, settings, and project subtrees.

## Component Inventory (High-Level)

### Top-Level Components

- `components/ErrorBoundary.tsx`
- `components/SessionProvider.tsx`
- `components/Pricing.tsx`
- `components/CheckoutButton.tsx`
- `components/sign-in.tsx`
- `components/sign-out.tsx`

### Feature Domains (Representative)

- **Auth**: `components/auth/AuthLayout.tsx`, `components/auth/EmailSignInForm.tsx`, `components/auth/GoogleSignInButton.tsx`, `components/auth/LoginForm.tsx`
- **App Shell**: `components/app/Header.tsx`, `components/app/Sidebar.tsx`, `components/app/BottomNavigation.tsx`
- **Dashboard**: `components/dashboard/KPICard.tsx`, `components/dashboard/WidgetsGrid.tsx`, `components/dashboard/DashboardHeader.tsx`
- **Tasks**: `components/tasks/TaskBoard.tsx`, `components/tasks/TaskDetailPanel.tsx`, `components/tasks/gantt/GanttChart.tsx`
- **Team**: `components/team/TeamMemberCard.tsx`, `components/team/SubcontractorCard.tsx`, `components/team/InviteTeamMemberModal.tsx`
- **Expenses**: `components/expenses/ExpenseCard.tsx`, `components/expenses/CreateExpenseModal.tsx`, `components/expenses/ExpenseDetailModal.tsx`
- **Materials**: `components/materials/MaterialCard.tsx`, `components/materials/MaterialsList.tsx`, `components/materials/MaterialsPageClient.tsx`
- **Chat**: `components/chat/ChatLayout.tsx`, `components/chat/MessageList.tsx`, `components/chat/MessageItem.tsx`
- **Mobile**: `components/mobile/BottomSheetModal/index.tsx`, `components/mobile/SwipeableCard.tsx`, `components/mobile/SkeletonCard.tsx`
- **Projects**: `components/projects/spatial/SpatialViewer.tsx`, `components/projects/spatial/ClientSpatialViewer.tsx`, `components/projects/files/FilePreviewModal.tsx`
- **Shared/UI**: `components/ui/BaseModal/index.tsx`, `components/shared/PortfolioSummary.tsx`, `components/ui/ResponsiveModal/index.tsx`

## Deep Component Findings (All Components)

### Modals & Overlays

- `BaseModal` supports responsive behavior and structured header/footer, but `BottomSheetModal`, `TaskModal` (via `ResponsiveModal`), and `TaskDetailPanel` each implement separate overlay systems and UI affordances (drag handle, gradient strip, header actions).
- `CreateExpenseModal` and `ModelUploadModal` share a repeated “instructions + dropzone + actions” structure.

**References**

- `components/ui/BaseModal/index.tsx:31`
- `components/mobile/BottomSheetModal/index.tsx:43`
- `components/tasks/TaskModal.tsx:57`
- `components/tasks/TaskDetailPanel.tsx:69`
- `components/expenses/CreateExpenseModal.tsx:38`
- `components/settings/ModelUploadModal.tsx:22`

### Cards & Tiles (Tasks, Materials, Expenses, Team, KPI)

- `TaskCard` uses `Card` but still applies deep styling via `className` and inline patterns.
- `MaterialCard`, `ExpenseCard`, `TeamMemberCard`, and `KPICard` build custom shells (rounded, border, shadow) independently.

**References**

- `components/tasks/TaskCard.tsx:39`
- `components/materials/MaterialCard.tsx:80`
- `components/expenses/ExpenseCard.tsx:35`
- `components/team/TeamMemberCard.tsx:125`
- `components/dashboard/KPICard.tsx:129`

### Dashboard Widgets

- Widget card wrappers repeat identical classes across multiple widgets and skeletons.
- Widget header UI (icon pill + uppercase title) is repeated.

**References**

- `components/dashboard/ProjectStatusWidget.tsx:171`
- `components/dashboard/TaskProgressWidget.tsx:122`
- `components/dashboard/BudgetSummaryWidget.tsx:84`
- `components/dashboard/ScheduleHealthWidget.tsx:136`
- `components/dashboard/TeamActivityWidget.tsx:80`
- `components/dashboard/MaterialsStatusWidget.tsx:109`

### Chat System (Layout, List, Message Item, Input)

- `ChatLayout` owns responsive layout logic and state for active room, reply state, and search/settings modals.
- `MessageList` uses virtualization and real-time hooks, plus infinite scroll.
- `MessageItem` fetches reactions, reply counts, and attachments per message with parallel requests (potential N+1).

**References**

- `components/chat/ChatLayout.tsx:47`
- `components/chat/MessageList.tsx:38`
- `components/chat/MessageItem.tsx:51`
- `components/chat/MessageInput.tsx:28`
- `components/chat/ChatRoomList.tsx:27`

### Tasks (Board, List, Detail Panel, Modal)

- `TaskBoard` already uses `next/dynamic` to defer heavy `GanttChart` and `KanbanBoard` (good Vercel usage).
- `TaskList` duplicates initials logic with other team views and uses a bespoke table header pattern.
- `TaskDetailPanel` is another custom drawer with mobile bottom sheet presentation, separate from modal systems.

**References**

- `components/tasks/TaskBoard.tsx:31`
- `components/tasks/TaskList.tsx:64`
- `components/tasks/TaskDetailPanel.tsx:69`
- `components/tasks/TaskModal.tsx:57`

### Mobile Pattern Library (Inputs, Search, Swipe, Filter)

- `MobileInput`, `SearchInput`, and `FilterButton` demonstrate cohesive mobile design system, but are not reused everywhere.
- `SwipeableCard` handles haptic feedback and touch priority; haptics are reimplemented in multiple buttons.

**References**

- `components/mobile/MobileInput.tsx:20`
- `components/mobile/SearchInput.tsx:37`
- `components/mobile/FilterButton.tsx:33`
- `components/mobile/SwipeableCard.tsx:44`
- `components/mobile/FloatingActionButton.tsx:48`

### Settings (Tabbed Config + Upload)

- `ProjectConfigurationSection` implements bespoke tabs; `TaskBoard` uses different tab patterns.
- `ModelUploadModal` repeats upload UI patterns seen in other files.

**References**

- `components/settings/ProjectConfigurationSection.tsx:16`
- `components/settings/ModelUploadModal.tsx:22`
- `components/tasks/TaskBoard.tsx:14`

### Projects & Files

- Photo uploaders in spatial and files domains repeat preview + progress UI.
- Multiple skeleton components exist for project cards.

**References**

- `components/projects/spatial/PhotoUploader.tsx:155`
- `components/projects/files/ProjectPhotoUploader.tsx:227`
- `components/projects/ProjectCard.tsx:363`
- `components/projects/ProjectListSkeleton.tsx:4`

## Repeated Helpers & Logic

### Initials Helper

- `getInitials` duplicated across team and dashboard components.

**References**

- `components/dashboard/TeamActivityWidget.tsx:17`
- `components/team/TeamMemberCard.tsx:105`
- `components/team/TeamMemberTable.tsx:133`

### Currency + Date Formatters

- `formatCurrency` and `formatDate` are duplicated across expenses, tasks, and projects.

**References**

- `components/expenses/ExpenseCard.tsx:16`
- `components/expenses/ExpenseDetailModal.tsx:93`
- `components/expenses/ExpenseSummary.tsx:52`
- `components/tasks/TaskCard.tsx:52`
- `components/tasks/MobileTaskCard.tsx:87`
- `components/tasks/TaskMaterials.tsx:133`
- `components/tasks/TaskActivityLog.tsx:67`
- `components/projects/PhaseStation.tsx:52`
- `components/projects/files/FileVersionHistory.tsx:59`
- `components/chat/previews/TaskPreview.tsx:202`

### Stock Status Styling

- Stock status styling duplicated between materials cards.

**References**

- `components/materials/MaterialCard.tsx:65`
- `components/materials/ProductCard.tsx:40`

### Haptic Feedback

- Haptic feedback logic repeats across multiple mobile buttons.

**References**

- `components/mobile/FilterButton.tsx:41`
- `components/mobile/FloatingActionButton.tsx:48`
- `components/mobile/TouchButton.tsx:101`

## Repeated Tailwind Class Strings

- `border-b-2 border-gray-100 bg-gradient-to-r from-gray-50 to-white` repeats in multiple task/project sections.
- `text-xs font-bold text-gray-500 uppercase tracking-wider` repeats across project and task sections.
- `bg-white rounded-xl overflow-hidden border-2 border-gray-200 shadow-sm` repeats in expenses and materials lists.

**References**

- `components/tasks/CreateTaskForm.tsx:142`
- `components/tasks/TaskDetail.tsx:598`
- `components/tasks/TaskMaterials.tsx:170`
- `components/projects/ProjectTeam.tsx:231`
- `components/projects/spatial/MarkerAnnotationPanel.tsx:130`
- `components/projects/ProjectOverview.tsx:69`
- `components/tasks/TaskDetail.tsx:800`
- `components/expenses/ExpenseSummary.tsx:109`
- `components/materials/MaterialsListSkeleton.tsx:32`

## Vercel Best Practices (Opportunities)

- `MessageItem` triggers per-message fetches; use batched fetch + cache to avoid N+1 and apply `client-swr-dedup`.
- `ClientSpatialViewer` is a heavy client component; use `next/dynamic` to lazy-load and reduce bundle size.
- Replace raw `<img>` in uploader previews with `next/image` (possibly `unoptimized` for object URLs).

**References**

- `components/chat/MessageItem.tsx:91`
- `components/projects/spatial/ClientSpatialViewer.tsx:24`
- `components/projects/spatial/PhotoUploader.tsx:161`
- `components/projects/files/ProjectPhotoUploader.tsx:234`

## Deletion Candidates (Verify Before Removal)

- Example-only files likely unused in production:
  - `components/mobile/BottomSheetModal/example.tsx:1`
  - `components/ui/BaseModal/BaseModal.example.tsx:1`
  - `components/ui/StateSelect.example.tsx:1`
- Unused barrel export (no internal references found):
  - `components/mobile/index.ts:1`
- Potentially unused skeleton export (if not referenced externally):
  - `components/projects/ProjectCard.tsx:363`
- Legacy commented block (safe to delete if unused):
  - `components/projects/PhaseDetailPanel.tsx:238`

## Extraction Candidates

- Modal system: unify `BaseModal` + `BottomSheetModal` + `ResponsiveModal` + `TaskDetailPanel`.
- Card layouts: consolidate card sizing/padding/shadows.
- Form sections: shared `FormField` wrapper for label + control + hint.
- Upload surfaces: shared `FileUploadPanel` with dropzone + progress.
- Chat metadata: shared batched query cache for reactions/attachments.
- Dashboard widgets: shared `WidgetCard`, `WidgetHeader`, `WidgetSkeleton`.
- Mobile haptics: `useHapticFeedback` hook.

## Prioritized Refactor Batches

1. **Modal unification**: standardize modal/drawer surface and props.
2. **Card system**: introduce shared card primitives and migrate domain cards.
3. **Chat metadata batching**: reduce N+1 message fetches.
4. **Form + upload primitives**: apply to task/expense/settings modals.
5. **Widget primitives**: consolidate dashboard widget shells.
6. **Mobile pattern reuse**: standardize mobile inputs and haptic controls.

## Verification (Not Run)

- Typecheck: `npm run lint:ts`
- Lint: `npm run lint`
- Build: `npm run build`
- Visual snapshots: Playwright if needed (`npm test` or targeted suites)

## Notes & Constraints

- Report only; no code modifications performed.
- Recommendations keep behavior intact and prioritize reusability, clarity, and bundle/perf improvements.
