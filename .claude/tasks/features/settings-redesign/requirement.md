# Requirement: Settings Page Redesign

## Problem Statement

The current settings components (particularly `ProjectConfigurationSection` and its nested managers) use inconsistent patterns compared to the Projects and Tasks pages. They lack:
- Mobile-first design with proper touch targets
- The `FilterTabs` component used on the Tasks page
- Pull-to-refresh on mobile
- Blueprint background theme consistency
- Proper industrial typography (`font-black`, `tracking-tighter`, uppercase headers)
- Optimized performance patterns (memoization, dynamic imports, CSS animations)

## User Stories

1. **As a field worker**, I want the settings page to have the same mobile-first design as projects and tasks so that I can configure project types and templates easily on my phone.

2. **As a project manager**, I want consistent navigation tabs across the app so that switching between configuration options feels familiar and intuitive.

3. **As an admin**, I want fast-loading settings pages so that I can quickly make configuration changes without waiting.

## Acceptance Criteria

### EARS Format Requirements

**AC-1: Tab Navigation Consistency**
- WHEN the user views ProjectConfigurationSection
- THE SYSTEM SHALL display tabs using the same `FilterTabs` component pattern as TaskBoard's status filter tabs
- WITH animated gradient backgrounds, spring physics, and status-specific gradients

**AC-2: Mobile-First Layout**
- WHEN viewed on mobile devices (<768px)
- THE SYSTEM SHALL render with:
  - 44px minimum touch targets
  - Horizontal scrolling tabs with snap points
  - Pull-to-refresh capability
  - Blueprint background pattern
  - Industrial typography headers
  - `pb-32` bottom padding for bottom nav clearance

**AC-3: Desktop Layout Consistency**
- WHEN viewed on desktop (>=1024px)
- THE SYSTEM SHALL render with:
  - Grid-based tab layout (all tabs visible)
  - Construction-themed borders and shadows
  - Industrial page headers matching Projects/Tasks pages

**AC-4: Performance Optimization**
- THE SYSTEM SHALL implement:
  - `memo()` for child manager components
  - `useCallback` for all handlers
  - CSS-based stagger animations instead of per-item framer-motion
  - Direct Lucide imports (not barrel imports)
  - Dynamic imports for heavy components (dnd-kit, modals)

**AC-5: Component Patterns**
- WHEN rendering manager components (ProjectTypeManager, TaskTypeManager, etc.)
- THE SYSTEM SHALL follow the same patterns as:
  - `ProjectsPageClient` for empty states, loading skeletons
  - `TasksPageClient` for filter integration
  - `FilterTabs` for tab navigation

**AC-6: Accessibility**
- THE SYSTEM SHALL maintain WCAG 2.1 AA compliance:
  - Proper ARIA labels
  - Focus visible states
  - Keyboard navigation
  - High contrast text (construction blue on white)

## Scope

### In Scope
- `ProjectConfigurationSection.tsx` - Main container with tabs
- `ProjectTypeManager.tsx` - Project types CRUD
- `TaskTypeManager.tsx` - Task types CRUD
- `PhaseTemplateManager.tsx` - Phase templates CRUD
- `TaskTemplateManager.tsx` - Task templates CRUD
- Integration with `FilterTabs` component

### Out of Scope
- `SettingsSectionHeader.tsx` - Simple, already consistent
- `ChatNotificationPreferences.tsx` - Different feature area
- `KakaoTalkSettings.tsx` - Different feature area
- `ModelPreviewModal.tsx` / `ModelUploadModal.tsx` - 3D feature
- `DefaultModelCard.tsx` - 3D feature
- Backend/Server Action changes
- Database changes

## Constraints

1. **No Supabase in Client Components** - All managers already use Server Actions correctly
2. **Maintain existing functionality** - CRUD operations must continue working
3. **No new dependencies** - Use existing packages (framer-motion, dnd-kit, lucide-react)
4. **Performance budget** - No regression in page load times

## Dependencies

- `components/ui/FilterTabs.tsx` - Tab navigation component
- `components/mobile/PullToRefresh.tsx` - Pull-to-refresh wrapper
- `components/shared/BlueprintBackground.tsx` - Background pattern
- `lib/hooks/useIsMobile.ts` - Responsive detection
- `lib/hooks/useHapticFeedback.ts` - Touch feedback
