---
name: mep-extraction-engine
description: "Extract mechanical, electrical, and plumbing quantities from MEP construction drawings. Use when implementing MEP extraction, processing M/E/P sheets, extracting HVAC/electrical/plumbing quantities, or building trade-specific extraction pipelines. Triggers on: MEP extraction, mechanical plan parsing, electrical plan parsing, plumbing plan parsing, HVAC quantities, ductwork extraction, fixture counts, panel schedules, pipe sizing."
globs:
  - "lib/extraction/**/*.ts"
  - "app/api/estimates/**/*.ts"
  - "lib/ai/parse-prompt.ts"
---

# MEP Extraction Engine

> Extract mechanical, electrical, and plumbing quantities from M/E/P sheets using discipline-specific AI prompts and symbol recognition.

## Problem

MEP trades represent **40-60% of commercial TI cost**. Current system has **0% MEP coverage** — MEP sheets hit the vector engine which returns empty, or use a generic AI prompt that doesn't understand MEP symbology.

## MEP Extraction by Discipline

### Mechanical (M-sheets)

**What to extract:**

| Item | Unit | Source | CSI Div |
|------|------|--------|---------|
| Ductwork runs | LF by size | Plan view, duct layout | 23 31 00 |
| Flex duct | LF by size | Plan view | 23 31 00 |
| Diffusers/grilles | EA by type/size | Plan symbols | 23 37 00 |
| Return air grilles | EA by type/size | Plan symbols | 23 37 00 |
| Exhaust fans | EA with CFM | Schedule/plan | 23 34 00 |
| RTU/Package units | EA with tonnage | Schedule/roof plan | 23 81 00 |
| Mini-splits | EA with BTU | Schedule | 23 81 00 |
| Thermostats | EA | Plan symbols | 23 09 00 |
| Refrigerant piping | LF by size | Plan view | 23 23 00 |
| Duct insulation | SF | Calculated from duct LF | 23 07 00 |
| Fire/smoke dampers | EA | Plan symbols, notes | 23 33 00 |
| Kitchen hood | EA with CFM | Plan/schedule | 23 38 00 |

**Cha Redefine M-sheets contain:** New FC duct, HVAC specification (T-24), mechanical notes, equipment

**Mechanical Symbol Patterns:**
```
┌─────┐  Rectangle with diagonal = Diffuser/grille
│  ╲  │  Size noted nearby (e.g., "24x24", "14x6")
└─────┘

  ○──── Circle with line = Round duct (diameter noted)

══════ Double line = Rectangular duct (WxH noted nearby)

  ◇    Diamond = Thermostat

  ⊗    Circle with X = Exhaust fan
```

### Electrical (E-sheets)

**What to extract:**

| Item | Unit | Source | CSI Div |
|------|------|--------|---------|
| Receptacles (duplex) | EA | Plan symbols | 26 27 26 |
| Receptacles (GFI) | EA | Plan symbols (WP, GFI tag) | 26 27 26 |
| Receptacles (dedicated) | EA | Plan symbols (equipment tag) | 26 27 26 |
| Light fixtures | EA by type | RCP + fixture schedule | 26 51 00 |
| Switches | EA by type | Plan symbols (S, S3, SD) | 26 27 26 |
| Panels | EA | Single line diagram, panel schedule | 26 24 16 |
| Circuit breakers | EA by amp | Panel schedule | 26 24 16 |
| Wire/cable | LF by gauge | Calculated from plan | 26 05 19 |
| Conduit | LF by size | Plan or calculated | 26 05 33 |
| Junction boxes | EA | Plan symbols | 26 05 33 |
| Exit signs | EA | Egress plan/RCP | 26 53 00 |
| Emergency lights | EA | Egress plan/RCP | 26 53 00 |
| Fire alarm devices | EA | FA plan/symbols | 28 31 00 |
| Disconnect switches | EA | Plan symbols | 26 28 00 |

**Cha Redefine E-sheets contain:** Reflected ceiling plan (E3), power plan (E2), panel schedule (E1), lighting schedule

**Electrical Symbol Patterns:**
```
  ◎    Duplex receptacle
  ◎WP  Weatherproof receptacle
  ◎GFI GFI receptacle
  S    Single-pole switch
  S3   Three-way switch
  SD   Dimmer switch
  ▣    Junction box
  ⊞    Panel
  ⊕    Exit sign (emergency)
```

### Plumbing (P-sheets)

**What to extract:**

| Item | Unit | Source | CSI Div |
|------|------|--------|---------|
| Lavatory/sink | EA | Plan symbols + fixture schedule | 22 42 00 |
| Water closet (toilet) | EA | Plan symbols | 22 42 00 |
| Urinal | EA | Plan symbols | 22 42 00 |
| Floor drain | EA | Plan symbols | 22 14 00 |
| Floor sink | EA | Plan symbols | 22 14 00 |
| Mop sink | EA | Plan symbols | 22 42 00 |
| Hand sink | EA | Plan symbols | 22 42 00 |
| 3-comp sink | EA | Plan symbols | 22 42 00 |
| Grease trap/interceptor | EA | Plan/detail | 22 14 00 |
| Water heater | EA with gallons | Schedule/plan | 22 33 00 |
| Backflow preventer | EA by size | Plan symbols | 22 11 00 |
| Hose bibb | EA | Plan symbols | 22 11 00 |
| Gas piping | LF by size | Plan view | 22 11 00 |
| Water piping (hot) | LF by size | Plan view | 22 11 00 |
| Water piping (cold) | LF by size | Plan view | 22 11 00 |
| Waste piping | LF by size | Plan view | 22 13 00 |
| Vent piping | LF by size | Plan view | 22 14 00 |
| Cleanouts | EA | Plan symbols | 22 14 00 |

**Cha Redefine P-sheets contain:** Plumbing note (P0), cold & hot water plan (P1), waste & vent plan (P2)

## AI Prompt Strategy

**Key principle:** One prompt per discipline, NOT one generic prompt.

```typescript
// lib/ai/mep-prompts.ts

export const MEP_PROMPTS: Record<MepDiscipline, string> = {
  mechanical: `You are extracting MECHANICAL/HVAC quantities from a construction drawing.

Extract these items ONLY:
1. DUCTWORK: Trace each duct run, note size (WxH or diameter), length, material, insulation
2. DIFFUSERS/GRILLES: Count each supply/return air device, note size and type
3. EQUIPMENT: List all HVAC equipment (RTU, split system, exhaust fan, etc.) with capacity
4. CONTROLS: Count thermostats, sensors, controllers
5. ACCESSORIES: Fire/smoke dampers, turning vanes, flex duct connections

For each item return:
- description: Exact text from drawing or standard description
- quantity: Number (count for EA, linear feet for LF, square feet for SF)
- unit: "EA", "LF", "SF"
- size: Dimensions as written (e.g., "24x12", "10\" dia")
- specifications: Any noted specs (CFM, tonnage, BTU, voltage)
- confidence: 0.0-1.0
- source_region: {x, y, width, height} bounding box

Do NOT fabricate quantities. If a duct run length is not dimensioned, estimate from scale if available, otherwise note confidence < 0.5.`,

  electrical: `You are extracting ELECTRICAL quantities from a construction drawing.

Extract these items ONLY:
1. RECEPTACLES: Count each by type (duplex, GFI, WP, dedicated, 220V)
2. SWITCHES: Count each by type (single-pole, 3-way, dimmer, occupancy sensor)
3. LIGHT FIXTURES: Count each by type symbol (cross-reference fixture schedule if visible)
4. PANELS: Note panel name, voltage, phase, main breaker size
5. CIRCUITS: If panel schedule visible, extract circuit list
6. CONDUIT/WIRE: Note sizes if called out
7. SPECIAL SYSTEMS: Exit signs, emergency lights, fire alarm devices

For each item, note the symbol used and its location on the plan.
Use standard electrical abbreviations: GFI, WP, S, S3, SD, etc.`,

  plumbing: `You are extracting PLUMBING quantities from a construction drawing.

Extract these items ONLY:
1. FIXTURES: Count each plumbing fixture (lavatory, WC, urinal, sink types, floor drain, etc.)
2. EQUIPMENT: Water heaters (size/type), grease traps, backflow preventers, PRV
3. PIPING: Trace runs noting size, material, type (CW, HW, waste, vent, gas)
4. CLEANOUTS: Count and note size
5. VALVES: Count by type (gate, ball, check, PRV) and size
6. SPECIALTIES: Hose bibbs, vacuum breakers, mixing valves

For pipe runs: note the pipe size changes along the run.
For fixtures: note the fixture type and any specification callouts.`
};
```

## Extraction Pipeline

```
MEP Sheet (classified by Skill 1 as mechanical_plan | electrical_plan | plumbing_plan)
    ↓
Step 1: Determine sub-discipline from classification
    ↓
Step 2: Send to AI vision with discipline-specific prompt
    ├─ Primary: GPT-4o (best for symbol recognition on plans)
    ├─ For equipment schedules on MEP sheets: Gemini 2.5 Pro
    └─ Validate with discipline-specific Zod schema
    ↓
Step 3: Normalize extracted items
    ├─ Map to CSI divisions
    ├─ Apply standard descriptions
    ├─ Infer quantities where possible (e.g., 2 receptacles per duplex)
    └─ Calculate waste/contingency factors
    ↓
Step 4: Cross-reference with schedules (if available)
    ├─ Match fixture symbols to fixture schedule entries
    ├─ Match equipment tags to equipment schedule
    └─ Validate counts (plan count vs schedule count)
    ↓
Step 5: Insert as takeoff_items with:
    ├─ category: "mechanical" | "electrical" | "plumbing"
    ├─ sub_type: specific item description
    ├─ extraction_method: "labeled" | "calculated" | "inferred"
    └─ trade: mapped from discipline
```

## Files to Create/Modify

| File | Action |
|------|--------|
| `lib/ai/mep-prompts.ts` | **CREATE** — discipline-specific prompts |
| `lib/extraction/mep-extractor.ts` | **CREATE** — MEP extraction pipeline |
| `lib/extraction/mep-schemas.ts` | **CREATE** — Zod schemas for MEP items |
| `lib/ai/normalize-takeoff.ts` | **MODIFY** — add MEP trade mapping |
| `app/api/estimates/extract/route.ts` | **MODIFY** — route MEP sheets |

## Trade Mapping Extension

```typescript
// Extend existing inferTrade() in normalize-takeoff.ts
const MEP_TRADE_MAP: Record<string, string> = {
  // Mechanical
  "ductwork": "hvac",
  "diffuser": "hvac",
  "grille": "hvac",
  "rtu": "hvac",
  "split_system": "hvac",
  "exhaust_fan": "hvac",
  "thermostat": "hvac",
  // Electrical
  "receptacle": "electrical",
  "switch": "electrical",
  "light_fixture": "electrical",
  "panel": "electrical",
  "conduit": "electrical",
  "wire": "electrical",
  "exit_sign": "electrical",
  "fire_alarm": "fire_alarm",
  // Plumbing
  "lavatory": "plumbing",
  "water_closet": "plumbing",
  "floor_drain": "plumbing",
  "water_heater": "plumbing",
  "grease_trap": "plumbing",
  "piping": "plumbing",
};
```

## Waste Factors (MEP)

```typescript
const MEP_WASTE_FACTORS: Record<string, number> = {
  "hvac_ductwork": 0.10,      // 10% waste
  "hvac_insulation": 0.15,    // 15% waste
  "hvac_equipment": 0.0,      // No waste on equipment
  "electrical_wire": 0.15,    // 15% waste
  "electrical_conduit": 0.10, // 10% waste
  "electrical_devices": 0.05, // 5% spares
  "plumbing_pipe": 0.10,      // 10% waste
  "plumbing_fixtures": 0.0,   // No waste on fixtures
  "plumbing_fittings": 0.20,  // 20% waste (high)
};
```
