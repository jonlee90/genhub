# Vector Engine — Phased Implementation Plan

**Source:** `tasks-vector-engine-subtasks.md`
**Total:** 36 subtasks → 9 phases
**Agent:** backend-engineer (all phases)
**Strategy:** Each phase is a single agent session, ~4–11h of work, ~3–5 subtasks

---

## Phase 1: Type Foundation
**Subtasks:** VEC-001.1 → 001.2 → 001.3 → 001.4
**Est. hours:** ~6h | **Agent sessions:** 1
**Dependencies:** None — start immediately
**Unblocks:** Everything

Creates `lib/extraction/types.ts` with all shared interfaces. Must complete before any other phase starts.

| Subtask | Deliverable |
|---------|-------------|
| VEC-001.1 | `Point`, `Rect`, `VectorLine`, `VectorArc`, `VectorPath`, `VectorRect`, `TextObject` |
| VEC-001.2 | `VectorPage`, `ScaleInfo`, `TextCluster`, `SheetType`, `PageClassification` |
| VEC-001.3 | `WallSegment`, `DoorElement`, `WindowElement`, `RoomPolygon` |
| VEC-001.4 | `ExtractionResult`, `QuantityResult`, `ClassificationResult`, `ScoringContext` |

---

## Phase 2: PDF Vector Parser
**Subtasks:** VEC-002.1 → 002.2 → 002.3 → 002.4 → 002.5
**Est. hours:** ~11h | **Agent sessions:** 1
**Dependencies:** Phase 1 complete
**Unblocks:** Phase 3, Phase 4 (via VEC-003), Phase 9

Creates `lib/extraction/vector-parser.ts`. The most complex phase — pdfjs-dist Node.js API, operator parsing, text clustering, and hatch filtering.

| Subtask | Deliverable |
|---------|-------------|
| VEC-002.1 | pdfjs bootstrap, `extractVectorPage()` skeleton |
| VEC-002.2 | Path/line/arc/rect parsing from operator list |
| VEC-002.3 | Text extraction + 2" proximity clustering |
| VEC-002.4 | `sheetType` + `pageClassification` detection |
| VEC-002.5 | Hatch + dimension line filtering (runs before return) |

---

## Phase 3: Scale Detector + Confidence Scorer
**Subtasks:** VEC-003.1 → 003.2 → 003.3 + VEC-006.1 → 006.2
**Est. hours:** ~8.5h | **Agent sessions:** 1
**Dependencies:** Phase 1 complete; Phase 2 complete (for VEC-003)
**Note:** VEC-006 only needs Phase 1 — can start in parallel with Phase 2 if desired, but grouping here keeps agent sessions cleaner.
**Unblocks:** Phase 4

| Subtask | Deliverable |
|---------|-------------|
| VEC-003.1 | `detectScale()` — Priority 1 (metadata) + Priority 2 (title text) |
| VEC-003.2 | Scale bar detection — Priority 3 |
| VEC-003.3 | Dimension calibration + sheet size inference — Priorities 4–6 |
| VEC-006.1 | `scoreElement()` — 4 scoring components + 5 penalties |
| VEC-006.2 | `needsReview` thresholds + 6 auto-generated review flags |

---

## Phase 4: Wall + Door Detection
**Subtasks:** VEC-004.1 → 004.2 → 004.3 → VEC-005.1 → 005.2
**Est. hours:** ~11h | **Agent sessions:** 1
**Dependencies:** Phase 2 + Phase 3 complete
**Unblocks:** Phase 5

Creates `lib/extraction/rules/wall-rules.ts` and `lib/extraction/rules/door-rules.ts`.

| Subtask | Deliverable |
|---------|-------------|
| VEC-004.1 | `detectWalls()` — parallel line pair + filled rect rules |
| VEC-004.2 | Thick single line + curved wall rules |
| VEC-004.3 | Intersection detection (T/L/X) + TI construction status |
| VEC-005.1 | `detectDoors()` — arc rules (1–2) + double door + gap fallback |
| VEC-005.2 | Specialty doors: pocket, sliding, bi-fold, overhead |

---

## Phase 5: Windows + Rooms
**Subtasks:** VEC-008.1 + VEC-009.1 → 009.2 → 009.3
**Est. hours:** ~8.5h | **Agent sessions:** 1
**Dependencies:** Phase 4 complete
**Unblocks:** Phase 6

Creates `lib/extraction/rules/window-rules.ts` and `lib/extraction/rules/room-rules.ts`.

| Subtask | Deliverable |
|---------|-------------|
| VEC-008.1 | `detectWindows()` — wall embeds + curtain wall + schedule cross-ref |
| VEC-009.1 | Wall graph + planar cycle detection → room polygons |
| VEC-009.2 | Point-in-polygon room name assignment + classification |
| VEC-009.3 | Shoelace area + perimeter + door/window/wall association |

---

## Phase 6: Orchestrator + Quantities
**Subtasks:** VEC-010.1 → 010.2 + VEC-011.1 → 011.2
**Est. hours:** ~6.5h | **Agent sessions:** 1
**Dependencies:** Phase 5 complete
**Unblocks:** Phase 8 (VEC-007.2, VEC-014.2)

Creates `lib/extraction/geometry-classifier.ts` and `lib/extraction/quantity-calculator.ts`.

| Subtask | Deliverable |
|---------|-------------|
| VEC-010.1 | `classifyGeometry()` — pipeline: walls → doors → windows → rooms → scores |
| VEC-010.2 | Sheet type routing (skip detail/code/mep/schedule sheets) |
| VEC-011.1 | `calculateQuantities()` — drywall, flooring, baseboard, ceiling SF |
| VEC-011.2 | Paint SF, demo drywall SF, demo framing LF, ceiling height logic |

---

## Phase 7: Database Migration + Progress API
**Subtasks:** VEC-013.1 → 013.2 + VEC-012.1
**Est. hours:** ~4.5h | **Agent sessions:** 1
**Dependencies:** None (VEC-013 has no code deps; VEC-012 is a file audit)
**Note:** Can run in parallel with Phase 2–6 since it's pure DB/SQL work
**Unblocks:** Phase 8

| Subtask | Deliverable |
|---------|-------------|
| VEC-013.1 | `extraction_jobs` table + all columns + indexes |
| VEC-013.2 | RLS policies + `claim_extraction_job()` SKIP LOCKED function + `npm run db:gen-types` |
| VEC-012.1 | Verify + complete extraction-progress GET (auth, ETA, correct shape) |

---

## Phase 8: Worker Queue + Router Wiring
**Subtasks:** VEC-014.1 → 014.2 + VEC-007.1 → 007.2
**Est. hours:** ~8.5h | **Agent sessions:** 1
**Dependencies:** Phase 6 + Phase 7 complete
**Unblocks:** End-to-end extraction working

Creates `lib/extraction/worker-queue.ts` and upgrades `app/api/estimates/extract/route.ts`.

| Subtask | Deliverable |
|---------|-------------|
| VEC-014.1 | `claimJob()`, `completeJob()`, `failJob()`, `heartbeat()` |
| VEC-014.2 | `processJob()` stage router + `recoverStaleJobs()` |
| VEC-007.1 | `EXTRACTION_ENGINE` env var routing decision |
| VEC-007.2 | Wire vector engine to `takeoff_items` + `ai_usage_log` |

---

## Phase 9: RCP Ceiling Rules
**Subtasks:** VEC-015.1 → 015.2
**Est. hours:** ~4h | **Agent sessions:** 1
**Dependencies:** Phase 2 complete (VectorPage type), Phase 5 complete (RoomPolygon)
**Note:** Can run in parallel with Phases 6–8 once Phases 2 + 5 are done

Creates `lib/extraction/rules/ceiling-rules.ts`.

| Subtask | Deliverable |
|---------|-------------|
| VEC-015.1 | RCP sheet detection + ceiling grid extraction (2×2, 2×4) |
| VEC-015.2 | Light fixture + HVAC diffuser symbol counting |

---

## Execution Order

```
Phase 1 (types)
  └─ Phase 2 (parser)
       ├─ Phase 3 (scale + confidence scorer)
       │    └─ Phase 4 (walls + doors)
       │         └─ Phase 5 (windows + rooms)
       │              └─ Phase 6 (orchestrator + quantities)
       │                   └─ Phase 8 (worker queue + router)
       └─ Phase 9 (RCP)  ← after Phase 5 also done

Phase 7 (DB migration)  ← independent, run any time before Phase 8
```

### Parallel opportunities
- **Phase 7** (DB migration) can start the moment Phase 1 is done — no parser needed
- **Phase 9** (RCP) can start after Phase 5, running alongside Phase 6 or Phase 8
- If two agents are available: Phase 3 + Phase 7 can run simultaneously after Phase 2

---

## Summary

| Phase | Tasks | Hours | Gate |
|-------|-------|-------|------|
| Phase 1 | 4 subtasks | ~6h | None |
| Phase 2 | 5 subtasks | ~11h | P1 |
| Phase 3 | 5 subtasks | ~8.5h | P1 + P2 |
| Phase 4 | 5 subtasks | ~11h | P2 + P3 |
| Phase 5 | 4 subtasks | ~8.5h | P4 |
| Phase 6 | 4 subtasks | ~6.5h | P5 |
| Phase 7 | 3 subtasks | ~4.5h | None (any time) |
| Phase 8 | 4 subtasks | ~8.5h | P6 + P7 |
| Phase 9 | 2 subtasks | ~4h | P2 + P5 |
| **Total** | **36 subtasks** | **~68.5h** | |

To run a phase: `/kc:impl .claude/specs/estimates-v2/tasks-vector-engine-subtasks.md` and specify "Phase N subtasks: VEC-XXX.X through VEC-XXX.X"
