# Requirement: Subcontractor Page Redesign

## Problem Statement

The subcontractors page (`/app/team/subcontractors`) has a different visual design from the team page (`/app/team`) and projects page (`/app/projects`). It needs to be updated to match the established design patterns used by those pages for visual consistency across the app.

Specifically:
- The team page uses a `TeamSummary` card at the top with stats, followed by a list of `TeamMemberCard` items
- The projects page uses a `PortfolioSummary` card at the top, followed by a grid of `ProjectCard` items
- The subcontractors page should follow the same pattern: a "Subcontractor Details" summary card at top, followed by a list/grid of subcontractor cards

## User Stories

- As a project manager, I want the subcontractors page to look consistent with the team and projects pages so the app feels cohesive
- As a user, I want to see a summary card at the top of the subcontractors page showing key stats (total, active, avg rating, expiring docs)
- As a user, I want subcontractor cards below that match the visual style of team member cards and project cards

## Acceptance Criteria

- WHEN a user navigates to `/app/team/subcontractors` THE SYSTEM SHALL display a "Subcontractor Details" summary card at the top matching the `TeamSummary`/`PortfolioSummary` pattern (icon + title header, stat grid, optional detail sections)
- WHEN a user scrolls below the summary card THE SYSTEM SHALL display subcontractor cards in a consistent style (single column mobile, multi-column grid on desktop)
- THE SYSTEM SHALL preserve all existing functionality: search, filters, sorting, pagination, create/edit/delete subcontractors
- THE SYSTEM SHALL maintain mobile-first responsive design with 44px touch targets
- THE SYSTEM SHALL use stagger animations on card entry matching the team page pattern
- THE SYSTEM SHALL maintain dark mode support

## Scope

### In scope
- Redesign `SubcontractorsPageClient` layout to match `TeamPageClient`/`ProjectsPageClient`
- Redesign `SubcontractorPortfolio` to match `TeamSummary`/`PortfolioSummary` card pattern (rename to "Subcontractor Details")
- Ensure visual consistency of `SubcontractorCard` with `TeamMemberCard`/`ProjectCard` style
- Preserve existing filter, search, sort, pagination functionality

### Out of scope
- No database changes
- No new Server Actions
- No changes to data fetching logic
- No changes to team or projects pages
- No new features added to subcontractors

## Constraints

- Must follow GenHub design tokens: Primary #001B51, Accent #3C3C3C, 44px touch targets
- Must use Lucide icons only
- Must use `ResponsiveModal` for any modals
- Frontend-only changes (components and styling)
