---
name: construction-quantity-takeoff
description: "Convert extracted construction data into a CSI-organized, priced estimate with proper divisions, waste factors, and totals. Use when implementing estimate generation, CSI organization, quantity aggregation, pricing, or the final estimate output pipeline. Triggers on: quantity takeoff, CSI divisions, estimate generation, pricing, cost calculation, waste factors, overhead markup, estimate summary, bill of quantities."
globs:
  - "lib/extraction/**/*.ts"
  - "app/actions/estimates.ts"
  - "lib/ai/normalize-takeoff.ts"
---

# Construction Quantity Takeoff

> Organize extracted quantities by CSI MasterFormat divisions, deduplicate across sheets, apply waste/pricing, and produce a complete estimate.

## Problem

Current system outputs 7 hardcoded quantity types (drywall SF, flooring SF, baseboard LF, ceiling SF, paint SF, demo drywall SF, demo framing LF). A real commercial estimate needs **CSI-organized quantities across all 16+ active divisions** with pricing, waste factors, and proper aggregation.

## CSI MasterFormat Divisions (Construction Relevant)

```typescript
const CSI_DIVISIONS: Record<string, CsiDivision> = {
  "01": { name: "General Requirements", trades: ["general"] },
  "02": { name: "Existing Conditions", trades: ["demolition"] },
  "03": { name: "Concrete", trades: ["concrete"] },
  "04": { name: "Masonry", trades: ["masonry"] },
  "05": { name: "Metals", trades: ["steel", "misc_metals"] },
  "06": { name: "Wood, Plastics, Composites", trades: ["framing", "millwork", "casework"] },
  "07": { name: "Thermal & Moisture Protection", trades: ["insulation", "waterproofing", "roofing"] },
  "08": { name: "Openings", trades: ["doors", "windows", "glazing", "hardware"] },
  "09": { name: "Finishes", trades: ["drywall", "flooring", "painting", "ceiling", "tile"] },
  "10": { name: "Specialties", trades: ["signage", "accessories", "toilet_accessories"] },
  "12": { name: "Furnishings", trades: ["casework", "countertops", "window_treatments"] },
  "21": { name: "Fire Suppression", trades: ["fire_sprinkler"] },
  "22": { name: "Plumbing", trades: ["plumbing"] },
  "23": { name: "HVAC", trades: ["hvac", "mechanical"] },
  "26": { name: "Electrical", trades: ["electrical"] },
  "28": { name: "Electronic Safety & Security", trades: ["fire_alarm", "security"] },
};
```

## Takeoff Pipeline

```
All extracted items (from all sheets, all engines)
    ↓
Step 1: CLASSIFY by CSI Division
    ├─ Map category + sub_type → CSI division + section
    ├─ Use trade mapping from normalize-takeoff.ts (extended)
    └─ Flag items that don't map to any division
    ↓
Step 2: DEDUPLICATE across sheets
    ├─ Same door type on floor plan + door schedule = 1 item (merge data)
    ├─ Same fixture on RCP + electrical plan = 1 item (take higher quantity)
    ├─ Use cross-reference links from Skill 4
    └─ Flag conflicts for user review
    ↓
Step 3: AGGREGATE quantities
    ├─ Sum by CSI section (e.g., all drywall = total SF)
    ├─ Group by location/room where possible
    ├─ Separate NEW vs DEMO quantities
    └─ Apply waste factors per trade
    ↓
Step 4: PRICE (if pricing data available)
    ├─ Match to pricing template (existing feature)
    ├─ Match to materials catalog (existing feature)
    ├─ Apply unit costs (material + labor + equipment)
    └─ Fall back to historical averages or flag for manual pricing
    ↓
Step 5: CALCULATE totals
    ├─ Subtotal per division
    ├─ Grand subtotal
    ├─ Overhead % (existing field on estimates table)
    ├─ Profit/markup % (existing field)
    ├─ Contingency % (new)
    ├─ Bond (if applicable)
    └─ Grand total
```

## Deduplication Rules

```typescript
interface DeduplicationRule {
  /** Items match if these fields are equal */
  matchFields: string[];
  /** How to merge when matched */
  mergeStrategy: "sum" | "max" | "prefer_schedule" | "prefer_plan";
}

const DEDUP_RULES: Record<string, DeduplicationRule> = {
  // Door from floor plan + door from schedule = same door
  door: {
    matchFields: ["sub_type", "trade"],  // Door Type "A"
    mergeStrategy: "prefer_schedule",     // Schedule has specs, plan has count
  },
  // Fixture on RCP + fixture on electrical plan
  light_fixture: {
    matchFields: ["sub_type"],
    mergeStrategy: "max",                 // Take higher count (one might have missed some)
  },
  // Drywall from vector engine + drywall from AI vision
  drywall: {
    matchFields: ["trade", "unit"],
    mergeStrategy: "max",                 // Vector is more accurate for area
  },
  // Plumbing fixture on plan + fixture in schedule
  plumbing_fixture: {
    matchFields: ["sub_type"],
    mergeStrategy: "prefer_schedule",
  },
};
```

## Waste Factors (Complete)

```typescript
const WASTE_FACTORS: Record<string, number> = {
  // Div 02: Existing Conditions
  demolition: 0.0,

  // Div 03: Concrete
  concrete: 0.05,
  rebar: 0.05,

  // Div 05: Metals
  structural_steel: 0.03,
  misc_metals: 0.05,

  // Div 06: Wood
  framing: 0.05,
  millwork: 0.10,
  casework: 0.0,

  // Div 07: Thermal
  insulation: 0.10,
  waterproofing: 0.10,
  roofing: 0.10,

  // Div 08: Openings
  doors: 0.0,
  windows: 0.0,
  glazing: 0.05,
  hardware: 0.05,

  // Div 09: Finishes
  drywall: 0.10,
  flooring_tile: 0.10,
  flooring_carpet: 0.05,
  flooring_vct: 0.10,
  flooring_epoxy: 0.10,
  painting: 0.10,
  ceiling_act: 0.05,
  ceiling_gwb: 0.10,

  // Div 22: Plumbing
  plumbing_pipe: 0.10,
  plumbing_fixtures: 0.0,
  plumbing_fittings: 0.20,

  // Div 23: HVAC
  ductwork: 0.10,
  duct_insulation: 0.15,
  hvac_equipment: 0.0,

  // Div 26: Electrical
  wire: 0.15,
  conduit: 0.10,
  electrical_devices: 0.05,
  light_fixtures: 0.0,
};
```

## Output Structure

```typescript
interface EstimateOutput {
  projectInfo: {
    name: string;
    address: string;
    totalArea: number;       // SF from plan
    occupancyType: string;   // From T-3 egress plan
  };

  divisions: CsiDivisionOutput[];

  summary: {
    subtotal: number;
    overhead: number;        // % applied
    overheadAmount: number;
    profit: number;          // % applied
    profitAmount: number;
    contingency: number;     // % applied
    contingencyAmount: number;
    grandTotal: number;
    costPerSf: number;       // grandTotal / totalArea
  };

  metadata: {
    sheetsProcessed: number;
    sheetsSkipped: number;
    itemsExtracted: number;
    itemsDeduplicated: number;
    itemsNeedingReview: number;
    extractionDate: string;
    aiCost: number;          // Total AI API spend
  };
}

interface CsiDivisionOutput {
  division: string;          // "09"
  name: string;              // "Finishes"
  sections: CsiSectionOutput[];
  subtotal: number;
}

interface CsiSectionOutput {
  section: string;           // "09 29 00"
  name: string;              // "Gypsum Board"
  items: TakeoffLineItem[];
  subtotal: number;
}

interface TakeoffLineItem {
  description: string;
  quantity: number;
  unit: string;
  wasteFactor: number;
  adjustedQuantity: number;  // quantity * (1 + wasteFactor)
  unitCost: number | null;
  totalCost: number | null;
  isDemo: boolean;
  confidence: number;
  sourceSheets: string[];    // Which sheets this came from
  needsReview: boolean;
}
```

## Cha Redefine Expected Output

```
Division 02: Existing Conditions
  - Demo drywall: ~XXX SF
  - Demo framing: ~XXX LF

Division 06: Wood, Plastics, Composites
  - Metal stud framing (3-5/8" MTS, 25 ga @ 16" o.c.): XXX LF
  - Decorative faux wood beam: 2 EA

Division 08: Openings
  - Door Type A (existing front door, pair): 1 set
  - Door Type B (restroom door): 1 EA
  - Door Type C (stainless steel double swing): 1 EA
  - Glazing (replace existing glass door): 1 EA

Division 09: Finishes
  - Drywall (5/8" Type X GYP): XXX SF
  - Floor finish (per finish schedule): by room
  - Ceiling - ACT 2x4: XXX SF
  - Ceiling - GWB: XXX SF
  - Ceiling - Exposed: XXX SF
  - Painting: XXX SF

Division 22: Plumbing
  - Fixtures from P-sheets
  - Piping from P1, P2

Division 23: HVAC
  - FC Duct (from M1)
  - Equipment (from M-sheets)

Division 26: Electrical
  - Fixtures from E-sheets
  - Panel from E1
  - Devices from E2
```

## Files to Create/Modify

| File | Action |
|------|--------|
| `lib/extraction/quantity-takeoff.ts` | **CREATE** — CSI organization, dedup, aggregation |
| `lib/extraction/csi-mapper.ts` | **CREATE** — map items to CSI divisions |
| `lib/extraction/deduplicator.ts` | **CREATE** — cross-sheet deduplication |
| `lib/ai/normalize-takeoff.ts` | **MODIFY** — extend trade/waste mappings |
| `app/actions/estimates.ts` | **MODIFY** — use new takeoff output in createEstimate |
| `types/db/tables/estimates.ts` | **MODIFY** — add CSI division types |
