# Requirement: Team Module Optimization

## Problem Statement

The team module (`app/app/team/` and related components) needs performance optimization based on Vercel React best practices audit. Current implementation has several inefficiencies including sequential data fetching waterfalls, unnecessary re-renders, unoptimized bundle imports, and code duplication.

## Scope

### Files in Scope
- `app/app/team/page.tsx` - Team page (Server Component)
- `app/app/team/subcontractors/page.tsx` - Subcontractors page (Server Component)
- `app/app/team/loading.tsx` - Loading skeleton
- `app/app/team/error.tsx` - Error boundary
- `lib/team.ts` - Data fetching functions
- `components/team/TeamPageClient.tsx` - Client wrapper
- `components/team/TeamMemberCard.tsx` - Mobile card component
- `components/team/TeamMemberTable.tsx` - Desktop table component
- `components/team/TeamListSkeleton.tsx` - Mobile skeleton
- `components/team/InviteTeamMemberModal.tsx` - Invite modal
- `components/team/SubcontractorList.tsx` - Subcontractor list
- `components/team/SubcontractorCard.tsx` - Subcontractor card
- `components/team/AddSubcontractorModal.tsx` - Add subcontractor modal
- `components/team/EditSubcontractorModal.tsx` - Edit subcontractor modal
- `app/actions/team.ts` - Team Server Actions
- `app/actions/subcontractors.ts` - Subcontractor Server Actions

### Out of Scope
- Database schema changes
- New features
- Authentication flow changes

## User Stories

1. As a user, I want the team page to load faster so I can view my team members quickly
2. As a user, I want the UI to remain responsive when interacting with team members
3. As a developer, I want the team module to follow React best practices for maintainability

## Acceptance Criteria (EARS Format)

### Eliminating Waterfalls (CRITICAL)
- WHEN `getTeamPageData()` is called THE SYSTEM SHALL execute independent queries in parallel using `Promise.all()`
- WHEN `getSubcontractorsPageData()` is called THE SYSTEM SHALL execute independent queries in parallel
- WHEN the team page loads THE SYSTEM SHALL NOT create sequential request waterfalls

### Bundle Size Optimization (CRITICAL)
- WHEN importing Lucide icons THE SYSTEM SHALL use direct path imports instead of barrel imports
- WHEN loading modals THE SYSTEM SHALL use `next/dynamic` with `ssr: false` for heavy modal components
- THE SYSTEM SHALL NOT import from `lucide-react` barrel file directly

### Re-render Optimization (MEDIUM)
- WHEN updating state based on previous state THE SYSTEM SHALL use functional setState updates
- WHEN defining event handlers THE SYSTEM SHALL use `useCallback` with stable dependencies
- THE SYSTEM SHALL remove all console.log statements from production code

### Server-Side Performance (HIGH)
- WHEN passing data to client components THE SYSTEM SHALL minimize serialization by passing only needed fields
- THE SYSTEM SHALL extract reusable StatCard component to reduce JSX duplication

### Code Quality
- THE SYSTEM SHALL have no duplicate ROLE_CONFIG or STATUS_CONFIG definitions
- THE SYSTEM SHALL use shared type definitions for TeamMember interface

## Constraints

1. Must maintain backward compatibility with existing functionality
2. Must not break mobile/desktop responsive behavior
3. Must follow GenHub design system patterns
4. Must not introduce Supabase imports in client components
