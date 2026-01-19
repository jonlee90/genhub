# Requirement: Settings Page Optimization & Improvements

## Problem Statement

The Settings page (`app/app/settings/page.tsx`) and its nested components contain several issues affecting performance, maintainability, code quality, and user experience:

1. **Excessive console.log statements** in production code across all settings components
2. **Duplicate code patterns** across manager components (ProjectTypeManager, TaskTypeManager, PhaseTemplateManager, TaskTemplateManager)
3. **Missing loading/error states** and inconsistent state management
4. **Non-memoized callbacks** causing unnecessary re-renders in complex components with DnD
5. **Hardcoded color values** instead of using the design system CSS variables
6. **Accessibility gaps** (missing ARIA labels, focus management in modals)
7. **Missing TypeScript strict typing** in several components
8. **Inconsistent component patterns** between similar manager components
9. **Heavy bundle impact** from framer-motion animations not using dynamic imports
10. **Duplicate utility functions** (formatFileSize appears in multiple files)

## User Stories

1. As a **GC Admin**, I want the Settings page to load quickly so that I can efficiently configure project settings
2. As a **developer**, I want consistent code patterns across manager components so that I can maintain the codebase easily
3. As a **user with accessibility needs**, I want proper ARIA labels and keyboard navigation so that I can use all settings features
4. As a **mobile user**, I want optimized touch targets and responsive layouts so that I can manage settings on my phone
5. As a **developer**, I want TypeScript strict mode compliance so that I catch errors at compile time

## Acceptance Criteria

### Performance Improvements
- WHEN the Settings page loads THE SYSTEM SHALL complete initial render within 200ms
- WHILE components re-render THE SYSTEM SHALL minimize unnecessary re-renders using memoization
- WHEN framer-motion animations are used THE SYSTEM SHALL dynamically import them to reduce bundle size

### Code Quality
- WHEN code is deployed THE SYSTEM SHALL have zero console.log statements in production
- WHILE maintaining the codebase THE SYSTEM SHALL follow DRY principles for duplicate code
- WHEN TypeScript compiles THE SYSTEM SHALL have no type errors with strict mode

### Accessibility
- WHEN using keyboard navigation THE SYSTEM SHALL support full tab order in all modals
- WHILE interacting with drag-and-drop THE SYSTEM SHALL provide ARIA announcements
- WHEN focus changes THE SYSTEM SHALL properly manage focus within modals

### Consistency
- WHILE implementing manager components THE SYSTEM SHALL use shared base patterns
- WHEN displaying colors THE SYSTEM SHALL use CSS variables from the design system
- WHILE handling loading states THE SYSTEM SHALL use consistent skeleton patterns

## Scope

### In Scope
- Settings main page (`app/app/settings/page.tsx`)
- Settings lib (`lib/settings.ts`)
- All components in `components/settings/`:
  - SettingsSectionHeader.tsx
  - ProjectConfigurationSection.tsx
  - ChatNotificationPreferences.tsx
  - KakaoTalkSettings.tsx
  - ProjectTypeManager.tsx
  - TaskTypeManager.tsx
  - PhaseTemplateManager.tsx
  - TaskTemplateManager.tsx
  - DefaultModelCard.tsx
  - ModelUploadModal.tsx
  - ModelPreviewModal.tsx
- Default models page (`app/app/settings/default-models/page.tsx`)

### Out of Scope
- Server actions for settings (these work correctly)
- Database schema changes
- Adding new settings features
- Changes to the mobile navigation

## Constraints

1. **No breaking changes** - All existing functionality must continue to work
2. **Backward compatibility** - Component props must remain stable
3. **Mobile-first** - All improvements must maintain 44px minimum touch targets
4. **Performance budget** - Settings page bundle should not increase
5. **Accessibility compliance** - Must meet WCAG 2.1 AA standards

## Dependencies

- Existing design system CSS variables (`construction-blue`, etc.)
- ResponsiveModal component
- UI components (Button, Input, Select, etc.)
- framer-motion (for animations)
- @dnd-kit (for drag-and-drop)

## Technical Notes

### Identified Issues by File

| File | Issues |
|------|--------|
| SettingsSectionHeader.tsx | console.log, could be memoized |
| ProjectConfigurationSection.tsx | console.log, inline tab config |
| ChatNotificationPreferences.tsx | Multiple console.logs, inline styles |
| KakaoTalkSettings.tsx | Multiple console.logs, complex state |
| ProjectTypeManager.tsx | console.logs, duplicate modal patterns |
| TaskTypeManager.tsx | console.logs, duplicate with ProjectTypeManager |
| PhaseTemplateManager.tsx | console.logs, nested callbacks in DnD |
| TaskTemplateManager.tsx | console.logs, complex type handling |
| DefaultModelCard.tsx | console.log, `any` types |
| ModelUploadModal.tsx | console.log, duplicate formatFileSize |
| ModelPreviewModal.tsx | console.log |
| default-models/page.tsx | Uses createClient directly (correct for Server Component) |
| lib/settings.ts | Good - uses createAdminClient correctly |
