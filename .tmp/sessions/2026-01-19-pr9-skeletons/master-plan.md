# Master Plan — PR9 Skeleton/Loading Unification

## Overview

Consolidate skeleton/loading UI into shared primitives with consistent animation and spacing. No behavior changes.

## Architecture

- Use existing `components/ui` skeleton primitives when possible.
- Extract repeated loading blocks into shared components or reuse `WidgetSkeleton`/existing skeleton components.
- Follow design-iteration skeleton animation guidance.

## Components (Dependency Order)

1. **Skeleton Inventory**
   - Scope: Identify repeated loading states in UI components.
   - Risks: Missing edge cases or sizes.

2. **Shared Skeleton Primitives**
   - Scope: Use or add minimal shared skeletons to avoid duplication.
   - Risks: Over-configuring or shifting layout.

3. **Replace Usage**
   - Scope: Update components to use shared skeletons.
   - Risks: Visual parity mismatch.

## Validation

- Lint affected files.
- Manual UI checks for loading states.

## Rollout / Handoff

- Revert individual skeleton changes if layout drift occurs.
