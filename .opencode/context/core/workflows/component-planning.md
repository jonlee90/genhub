<!-- Context: workflows/component-planning | Priority: high | Version: 1.0 | Updated: 2026-01-18 -->
# Component Planning Workflow

## Purpose
Define a consistent planning format for multi-component changes. Each plan should clearly state architecture, components, dependencies, and validation steps before any implementation.

## Required Structure

### 1. Overview
- Short summary of the change and primary goal.
- Explicit statement that behavior remains unchanged (if refactor).

### 2. Architecture
- Describe the high-level architecture for this task.
- List primary data flows or UI interactions.
- Include any shared primitives, hooks, or utilities.

### 3. Components (Dependency Order)
For each component, include:
- Name
- Scope
- Key interfaces (props, types, functions)
- Dependencies
- Risks/notes

### 4. Validation
- Targeted checks (typecheck, lint, tests).
- Any manual verification steps.

### 5. Rollout / Handoff
- Any migration notes.
- Follow-up or cleanup items.

## Example Template

```md
# Master Plan — <Task Name>

## Overview
<Short summary>

## Architecture
- <Primary change>
- <Supporting change>

## Components (Dependency Order)
1. **<Component A>**
   - Scope: <what changes>
   - Interfaces: <props/types>
   - Dependencies: <imports or services>
   - Risks: <notes>

2. **<Component B>**
   - Scope: <what changes>
   - Interfaces: <props/types>
   - Dependencies: <imports or services>
   - Risks: <notes>

## Validation
- `npx tsc --noEmit`
- `npm run lint`
- <Any targeted tests>

## Rollout / Handoff
- <Notes>
```
