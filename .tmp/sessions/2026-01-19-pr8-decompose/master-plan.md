# Master Plan — PR8 Component Decomposition

## Overview

Decompose large components into smaller, maintainable units without altering behavior. This PR will be executed in sub-PRs to keep diffs reviewable.

## Architecture

- Extract subcomponents into colocated folders (`components/tasks/task-modal`, etc.).
- Preserve existing props and data flow.
- Avoid behavior changes; only refactor rendering structure.

## Components (Dependency Order)

1. **TaskModal Decomposition**
   - Scope: Extract tab panels and large sections from `TaskModal.tsx`.
   - Dependencies: task modal subcomponents, shared UI.
   - Risks: prop drilling mismatches.

2. **TaskDetail Decomposition**
   - Scope: Extract sections from `TaskDetail.tsx`, align with TaskModal where safe.
   - Dependencies: shared task detail panels.
   - Risks: layout drift.

3. **Project Forms + Spatial Viewer**
   - Scope: Extract sections from `CreateProjectForm.tsx` and `SpatialViewer.tsx`.
   - Dependencies: colocated subcomponents.
   - Risks: shared state split.

## Validation

- Lint affected files per sub-PR.
- Manual UI checks for task modals and project forms.

## Rollout / Handoff

- If issues arise, revert the specific subcomponent extraction only.
