# Requirement: Gantt Chart Optimization

## Problem Statement

The Gantt chart component has two issues that need to be addressed:

1. **Mobile Drag Scrolling Bug**: On mobile devices, users can drag and move the entire Gantt chart viewport, which conflicts with the intended task bar drag-to-reschedule functionality. This creates a confusing user experience where the chart moves unexpectedly.

2. **Code Quality**: The Gantt chart component files need optimization following Vercel React Best Practices to improve performance, reduce re-renders, and ensure maintainability.

## User Stories

- As a **mobile user**, I want to scroll the Gantt chart using the scrollbar or swipe gestures on the scroll area **without accidentally dragging the entire chart**, so that I can navigate the timeline predictably.

- As a **mobile user**, I want to drag task bars to reschedule them **without the chart viewport moving**, so that I can accurately position tasks on the timeline.

- As a **developer**, I want the Gantt chart code to follow Vercel React Best Practices, so that the component is performant and maintainable.

## Acceptance Criteria

### Mobile Drag Fix

- WHEN a user touches the Gantt chart on mobile THE SYSTEM SHALL NOT allow dragging the entire chart viewport via touch gestures on the main content area
- WHEN a user drags a task bar on mobile THE SYSTEM SHALL allow repositioning the task without moving the chart viewport
- WHEN a user uses the horizontal scrollbar THE SYSTEM SHALL allow normal horizontal scrolling
- WHILE on mobile THE SYSTEM SHALL disable the mouse-based drag-to-scroll functionality that is causing the issue

### Code Optimization (per Vercel React Best Practices)

- THE SYSTEM SHALL use direct imports instead of barrel file imports (`bundle-barrel-imports`)
- THE SYSTEM SHALL properly memoize expensive computations (`rerender-memo`)
- THE SYSTEM SHALL use primitive dependencies in effects/callbacks (`rerender-dependencies`)
- THE SYSTEM SHALL apply `content-visibility: auto` for virtualization where appropriate (`rendering-content-visibility`)
- THE SYSTEM SHALL use stable callback references to prevent unnecessary re-renders (`rerender-functional-setstate`)
- THE SYSTEM SHALL extract static JSX outside components where applicable (`rendering-hoist-jsx`)
- THE SYSTEM SHALL use ternary operators instead of && for conditional rendering (`rendering-conditional-render`)

## Scope

### In Scope

- Fix mobile touch drag behavior in `GanttChart.tsx`
- Audit and optimize all 9 Gantt component files:
  - `GanttChart.tsx`
  - `GanttTimeline.tsx`
  - `GanttTaskBar.tsx`
  - `GanttTaskRow.tsx`
  - `GanttHeader.tsx`
  - `GanttDependencyLines.tsx`
  - `GanttViewToggle.tsx`
  - `gantt-types.ts`
  - `gantt-utils.ts`
- Apply Vercel React Best Practices optimizations

### Out of Scope

- Adding new features to the Gantt chart
- Changing the visual design
- Modifying database schema or Server Actions
- Adding new dependencies

## Constraints

- Must maintain existing functionality (task dragging, clicking, hover states)
- Must not break desktop experience
- Must not introduce new dependencies
- Changes should be backward compatible
- Must pass `npm run build` without errors
