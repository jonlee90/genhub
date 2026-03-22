# Phase 3 Tasks — P2 Future Features

> Sub-task breakdown of `tasks-phase3-phase4.md` Phase 3 section.
> Each file contains atomic sub-tasks (~0.5–1 day each) ready for `/kc:impl`.

## Files

| File | Feature | Total Days | Sub-Tasks |
|------|---------|-----------|-----------|
| `EST-P3-001-measurement-tools.md` | On-Plan Measurement Tools | ~4d | 6 |
| `EST-P3-002-realtime-collaboration.md` | Real-Time Collaboration | ~5d | 7 |
| `EST-P3-003-offline-mode.md` | Offline Mode | ~4.5d | 6 |
| `EST-P3-004-historical-analytics.md` | Historical Cost Analytics | ~3.5d | 5 |

**Phase 3 Total:** 24 sub-tasks | ~17d sequential | ~9d with parallel streams

## Suggested Start Order

1. **EST-P3-004-A/B** (Analytics DB + actions) — no deps, quick wins
2. **EST-P3-002-A/B** (Collaboration DB + actions) — sets up Realtime infrastructure
3. **EST-P3-001-A/B** (Measurement DB + actions) — unblocks UI work
4. **EST-P3-003-A/B** (Service worker + IndexedDB) — parallel with above

## Parallel Streams

```
Stream A:  P3-001-A → P3-001-B → P3-001-C/D/E → P3-001-F
Stream B:  P3-002-A → P3-002-B → P3-002-C/D → P3-002-E/F → P3-002-G
Stream C:  P3-003-A, P3-003-B → P3-003-C/D/E → P3-003-F
Stream D:  P3-004-A → P3-004-B → P3-004-C/D → P3-004-E
```

## Sub-Task ID Format

`P3-{parent}-{letter}` — e.g., `P3-001-A` = EST-P3-001, first sub-task (database migration)

Use `A/B` = backend-engineer tasks, `C+` = frontend-engineer tasks (varies per feature).
