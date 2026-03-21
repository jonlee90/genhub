---
name: ai-vision-prompt-specialist
description: "Generate optimal AI vision prompts for each construction sheet type. Use when implementing or improving AI extraction prompts, adding new sheet type support, optimizing extraction accuracy, or working with parse-prompt.ts. Triggers on: AI prompt engineering for construction, parse prompt, extraction prompt, vision prompt, sheet-specific prompts, GPT-4o prompt, Gemini prompt, Claude vision prompt, multi-model routing."
globs:
  - "lib/ai/parse-prompt.ts"
  - "lib/ai/mep-prompts.ts"
  - "lib/extraction/**/*.ts"
  - "app/api/estimates/parse/route.ts"
---

# AI Vision Prompt Specialist

> Generate optimal AI prompts for each construction sheet type and route to the best model for each task.

## Problem

Current system uses **ONE generic prompt** (`lib/ai/parse-prompt.ts`) for all sheet types. A door schedule needs completely different instructions than a floor plan or an MEP sheet. Using the wrong prompt wastes tokens, reduces accuracy, and misses critical data.

## Prompt Library Architecture

```typescript
// lib/ai/construction-prompts.ts

interface PromptConfig {
  systemPrompt: string;
  userPrompt: string;
  responseSchema: ZodSchema;    // Typed output validation
  preferredModel: AiModel;      // Best model for this task
  fallbackModel: AiModel;
  maxTokens: number;            // Token budget
  temperature: number;          // 0.0 for extraction (deterministic)
  imageDetail: "low" | "high";  // Vision detail level
}

type AiModel = "gpt-4o" | "gemini-2.5-pro" | "claude-opus" | "claude-sonnet";

type SheetPromptType =
  | "floor_plan"
  | "rcp"
  | "elevation"
  | "section"
  | "detail"
  | "schedule_door"
  | "schedule_finish"
  | "schedule_fixture"
  | "schedule_equipment"
  | "schedule_panel"
  | "mep_mechanical"
  | "mep_electrical"
  | "mep_plumbing"
  | "structural"
  | "site_plan"
  | "demolition"
  | "egress";
```

## Model Selection Matrix

| Sheet Type | Best Model | Why | Fallback |
|-----------|-----------|-----|----------|
| Floor plans | GPT-4o | Best spatial reasoning for plans | Claude Sonnet |
| Schedules/tables | Gemini 2.5 Pro | Benchmark winner for table extraction | Claude Opus |
| MEP plans | GPT-4o | Best symbol recognition | Gemini 2.5 Pro |
| Elevations/sections | Claude Opus | Best at reading material callouts + reasoning | GPT-4o |
| Details | Claude Opus | Best at understanding assembly components | GPT-4o |
| Structural | GPT-4o | Good dimension reading | Claude Sonnet |
| Code compliance | Skip | No quantities to extract | - |

## Prompt Templates by Sheet Type

### Floor Plan Prompt

```typescript
const FLOOR_PLAN_PROMPT: PromptConfig = {
  systemPrompt: `You are a construction estimator extracting quantities from a FLOOR PLAN.

RULES:
1. Extract ONLY items with explicit dimensions or countable elements
2. NEVER fabricate quantities — if not labeled, set confidence < 0.5
3. For walls: note length, height (if labeled), type (full height, low wall, demountable)
4. For rooms: note name, dimensions if labeled, floor finish callout
5. For openings: count doors (by type mark), windows (by type mark)
6. Note construction status: NEW, EXISTING TO REMAIN, DEMOLITION
7. Include bounding box {x, y, width, height} as percentage of image dimensions

EXTRACTION CATEGORIES:
- Walls (by type, with linear feet)
- Doors (by type mark, count)
- Windows (by type mark, count)
- Room areas (if dimensions given)
- Floor finishes (from finish callouts or legend)
- Casework/countertops (linear feet)
- Equipment locations (count)
- Partition types (reference wall type legend)`,

  userPrompt: `Extract all measurable quantities from this floor plan.
Focus on: walls, doors, windows, rooms, finishes, equipment.
Return JSON matching the provided schema.`,

  preferredModel: "gpt-4o",
  fallbackModel: "claude-sonnet",
  maxTokens: 4000,
  temperature: 0.0,
  imageDetail: "high",
};
```

### RCP (Reflected Ceiling Plan) Prompt

```typescript
const RCP_PROMPT: PromptConfig = {
  systemPrompt: `You are extracting quantities from a REFLECTED CEILING PLAN.

EXTRACT:
1. Ceiling types by area: ACT (acoustic ceiling tile), GWB (gypsum wallboard), exposed, specialty
2. Ceiling heights for each zone (noted on plan)
3. Light fixtures: count each type, cross-reference fixture schedule if visible
4. HVAC diffusers/grilles visible on ceiling
5. Access panels: count and size
6. Soffits and bulkheads: linear feet
7. Decorative elements: faux beams, reveals, etc.

CEILING TYPE PATTERNS:
- Dashed grid pattern = ACT (usually 2x2 or 2x4)
- Solid boundary = GWB (drywall ceiling)
- "EXPOSED CEILING" label = no finish ceiling
- Hatched area = soffit or bulkhead

NOTE: Heights are written as ±XX'-XX" format (e.g., ±10'-0" means 10 feet AFF)`,

  preferredModel: "gpt-4o",
  fallbackModel: "claude-sonnet",
  maxTokens: 3000,
  temperature: 0.0,
  imageDetail: "high",
};
```

### Elevation Prompt

```typescript
const ELEVATION_PROMPT: PromptConfig = {
  systemPrompt: `You are extracting quantities from a BUILDING ELEVATION or INTERIOR ELEVATION.

EXTRACT:
1. Wall materials and finishes (stone, brick, stucco, metal panel, glass)
2. Window/storefront dimensions and types
3. Door dimensions visible in elevation
4. Signage locations and sizes
5. Heights and floor-to-floor dimensions
6. Material transitions and trim
7. Roof elements visible (parapet, coping, scupper)

For KITCHEN/SERVICE COUNTER elevations:
- Equipment dimensions and specifications
- Backsplash material and area
- Shelving linear feet
- Hood dimensions

For RESTROOM elevations:
- Tile height and area
- Fixture mounting heights
- Accessory locations`,

  preferredModel: "claude-opus",
  fallbackModel: "gpt-4o",
  maxTokens: 3000,
  temperature: 0.0,
  imageDetail: "high",
};
```

### Detail Prompt

```typescript
const DETAIL_PROMPT: PromptConfig = {
  systemPrompt: `You are extracting information from a CONSTRUCTION DETAIL drawing.

Details show HOW things are built, not quantities. Extract:
1. Materials specified (stud size, gypsum board layers, insulation type)
2. Assembly components (each layer of a wall section, for example)
3. Fastener/connection specifications
4. Dimensions (thickness, spacing, clearances)
5. Product callouts (manufacturer, model if noted)
6. Code references noted on detail

IMPORTANT: Details inform SPECIFICATIONS, not quantities.
The data from details enriches items found on floor plans/schedules.
Map each detail component to the appropriate CSI section.

COMMON DETAIL TYPES:
- Wall section: studs + GWB + insulation + finish layers
- Partition detail: full assembly with dimensions
- Ceiling detail: suspension system + tile/GWB
- Soffit/bulkhead: framing + finish
- Waterproofing: membrane + protection layers`,

  preferredModel: "claude-opus",
  fallbackModel: "gpt-4o",
  maxTokens: 2000,
  temperature: 0.0,
  imageDetail: "high",
};
```

### Demolition Plan Prompt

```typescript
const DEMOLITION_PROMPT: PromptConfig = {
  systemPrompt: `You are extracting DEMOLITION scope from a construction drawing.

EXTRACT:
1. Walls to be removed: linear feet, type, height
2. Doors/windows to be removed: count, size
3. Ceiling to be removed: square feet, type
4. Flooring to be removed: square feet, type
5. Equipment to be removed: count, description
6. MEP to be removed/rerouted: scope description
7. Items marked "EXISTING TO REMAIN" (do NOT count as demo)

DRAWING CONVENTIONS:
- Dashed lines or lighter lines = existing to remain
- Bold/heavy lines = new construction
- Hatched/cross-hatched = demolition
- "E" or "(E)" prefix = existing
- "N" or "(N)" prefix = new
- "D" or "(D)" prefix = demolish
- Cloud/revision bubble around demo items`,

  preferredModel: "gpt-4o",
  fallbackModel: "claude-sonnet",
  maxTokens: 3000,
  temperature: 0.0,
  imageDetail: "high",
};
```

### Egress Plan Prompt (metadata extraction only)

```typescript
const EGRESS_PROMPT: PromptConfig = {
  systemPrompt: `You are extracting OCCUPANCY and EGRESS data from an egress plan.

EXTRACT (metadata, not quantities):
1. Occupant load table: room name, area (SF), occupant load factor, number of occupants
2. Total occupancy count
3. Required exits and actual exits
4. Path of travel lengths
5. Emergency fixture requirements (exit signs, emergency lights)
6. ADA seating requirements

This data informs code compliance and fixture counts, not direct construction quantities.`,

  preferredModel: "claude-sonnet",
  fallbackModel: "gpt-4o",
  maxTokens: 2000,
  temperature: 0.0,
  imageDetail: "low",  // Less detail needed for text-heavy sheets
};
```

## Prompt Routing Logic

```typescript
// lib/ai/prompt-router.ts

export function getPromptConfig(classification: SheetClassification): PromptConfig | null {
  const { contentType } = classification;

  // Skip sheets with no extractable quantities
  const SKIP_TYPES: SheetContentType[] = [
    "cover", "code_compliance", "ada_compliance"
  ];
  if (SKIP_TYPES.includes(contentType)) return null;

  const PROMPT_MAP: Partial<Record<SheetContentType, PromptConfig>> = {
    floor_plan: FLOOR_PLAN_PROMPT,
    demolition_plan: DEMOLITION_PROMPT,
    rcp: RCP_PROMPT,
    elevation: ELEVATION_PROMPT,
    section: ELEVATION_PROMPT,        // Similar extraction needs
    detail: DETAIL_PROMPT,
    door_schedule: DOOR_SCHEDULE_PROMPT,
    window_schedule: WINDOW_SCHEDULE_PROMPT,
    finish_schedule: FINISH_SCHEDULE_PROMPT,
    fixture_schedule: FIXTURE_SCHEDULE_PROMPT,
    equipment_schedule: EQUIPMENT_SCHEDULE_PROMPT,
    panel_schedule: PANEL_SCHEDULE_PROMPT,
    plumbing_plan: PLUMBING_PROMPT,
    mechanical_plan: MECHANICAL_PROMPT,
    electrical_plan: ELECTRICAL_PROMPT,
    structural_plan: STRUCTURAL_PROMPT,
    site_plan: SITE_PLAN_PROMPT,
    egress: EGRESS_PROMPT,
  };

  return PROMPT_MAP[contentType] ?? GENERIC_FALLBACK_PROMPT;
}
```

## Token Optimization

```typescript
// Strategies to minimize token spend:

// 1. Use "low" image detail for text-heavy sheets (schedules, code, egress)
// 2. Use "high" detail only for plans with geometric content
// 3. Set tight maxTokens per sheet type (schedules need fewer output tokens)
// 4. Skip sheets that have no quantities (code, ADA, cover)
// 5. Cache by image hash (existing feature in parse/route.ts)
// 6. Use vector extraction first (free), AI only for what vector can't handle
```

## Files to Create/Modify

| File | Action |
|------|--------|
| `lib/ai/construction-prompts.ts` | **CREATE** — all sheet-type prompts |
| `lib/ai/prompt-router.ts` | **CREATE** — route sheet type → prompt config |
| `lib/ai/model-router.ts` | **CREATE** — route to best AI model |
| `lib/ai/parse-prompt.ts` | **MODIFY** — import from construction-prompts for backward compat |
| `app/api/estimates/parse/route.ts` | **MODIFY** — use prompt router |
| `app/api/estimates/extract/route.ts` | **MODIFY** — use prompt router for AI fallback |

## Few-Shot Examples

Each prompt should include 1-2 few-shot examples from real extractions. Store these in:
```
lib/ai/examples/
  floor-plan-example.json
  rcp-example.json
  schedule-door-example.json
  mep-mechanical-example.json
  ...
```

Load examples dynamically based on sheet type. Keep examples small (<500 tokens each) to minimize prompt size.
