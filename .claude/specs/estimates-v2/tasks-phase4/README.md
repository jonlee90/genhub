# Phase 4 Tasks — P3 Advanced Features

> Sub-task breakdown of `tasks-phase3-phase4.md` Phase 4 section.
> Each file contains atomic sub-tasks (~0.5–2 day each) ready for `/kc:impl`.

## Files

| File | Feature | Total Days | Sub-Tasks |
|------|---------|-----------|-----------|
| `EST-P4-001-bim-takeoff.md` | 3D Model Takeoff (BIM) | ~7.5d | 7 |
| `EST-P4-002-voice-input.md` | Voice Input | ~2.5d | 4 |
| `EST-P4-003-advanced-ai.md` | Advanced AI Features | ~5d | 6 |
| `EST-P4-004-supplier-integration.md` | Supplier Integration | ~5.5d | 7 |
| `EST-P4-005-ml-refinement.md` | ML Quantity Refinement | ~6d | 6 |
| `EST-P4-006-template-library.md` | Multi-Project Templates | ~3d | 5 |

**Phase 4 Total:** 35 sub-tasks | ~29.5d sequential | ~15d with parallel streams

## Parallel Streams

```
Stream A:  P4-001 (BIM Takeoff) — longest, start first
Stream B:  P4-002 (Voice Input) — independent, fast
Stream C:  P4-003 (Advanced AI) — depends on EST-P2-001 (AI Chat)
Stream D:  P4-004 (Supplier Integration) — depends on EST-P2-008 (Material Catalog)
Stream E:  P4-005 (ML Refinement) — depends on P4-005 correction logging infrastructure
Stream F:  P4-006 (Templates) — depends on EST-P2-007 (Template Management)
```

## Dependencies on Phase 2

Before starting Phase 4 streams, verify these Phase 2 tasks are complete:

| Phase 4 Task | Requires Phase 2 Task |
|--------------|----------------------|
| EST-P4-001 | EST-P1-009 (PlanOverlayLayer) |
| EST-P4-003 | EST-P2-001 (AI Chat) |
| EST-P4-004 | EST-P2-008 (Material Catalog) |
| EST-P4-005 | EST-P1-011 (Progressive Loading) + EST-P2-002 (Assemblies) |
| EST-P4-006 | EST-P2-007 (Template Management) |

## Sub-Task ID Format

`P4-{parent}-{letter}` — e.g., `P4-001-A` = EST-P4-001, first sub-task (database migration)

Convention: `A` = first backend task (usually DB migration), last letter = frontend integration.
