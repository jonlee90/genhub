/**
 * Sheet-type-specific AI prompts for construction plan extraction.
 *
 * Each prompt is optimized for a specific sheet type, with appropriate
 * extraction instructions, model selection, and token budgets.
 */

import type { SheetContentType } from "@/lib/extraction/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AiModel =
  | "gpt-4o"
  | "gemini-2.5-pro"
  | "claude-opus"
  | "claude-sonnet";

export interface PromptConfig {
  systemPrompt: string;
  userPrompt: string;
  preferredModel: AiModel;
  fallbackModel: AiModel;
  maxTokens: number;
  temperature: number;
  imageDetail: "low" | "high";
}

// ---------------------------------------------------------------------------
// Floor Plan
// ---------------------------------------------------------------------------

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

CATEGORIES:
- structural: Foundations, beams, columns, steel, concrete
- architectural: Walls, doors, windows, finishes, ceilings
- mechanical: HVAC, ductwork, equipment
- electrical: Wiring, panels, fixtures, conduit
- plumbing: Pipes, fixtures, drains, water systems
- painting: Interior/exterior paint, surface prep
- site: Excavation, grading, paving, landscaping
- general: Items that don't fit other categories

EXTRACTION:
- Walls (by type, with linear feet)
- Doors (by type mark, count)
- Windows (by type mark, count)
- Room areas (if dimensions given)
- Floor finishes (from callouts or legend)
- Casework/countertops (linear feet)
- Equipment locations (count)
- Partition types (reference wall type legend)

UNITS: LF, SF, CF, CY, EA, TON, etc.`,

  userPrompt: `Extract all measurable quantities from this floor plan.
Focus on: walls, doors, windows, rooms, finishes, equipment.
For each item provide: category, sub_type, quantity, unit, confidence (0.0-1.0), extraction_method (labeled/calculated/inferred), source_region ({x,y,width,height} as % of image), and notes.
Return JSON with: { page_type, items: [...], raw_notes, warnings, extraction_notes }`,

  preferredModel: "gpt-4o",
  fallbackModel: "claude-sonnet",
  maxTokens: 4000,
  temperature: 0.0,
  imageDetail: "high",
};

// ---------------------------------------------------------------------------
// RCP (Reflected Ceiling Plan)
// ---------------------------------------------------------------------------

const RCP_PROMPT: PromptConfig = {
  systemPrompt: `You are extracting quantities from a REFLECTED CEILING PLAN.

RULES:
1. NEVER fabricate quantities
2. Use confidence: 1.0 = labeled, 0.7-0.9 = calculated, 0.5-0.6 = inferred

EXTRACT:
1. Ceiling types by area: ACT (acoustic ceiling tile), GWB (gypsum wallboard), exposed, specialty
2. Ceiling heights for each zone (noted as ±XX'-XX")
3. Light fixtures: count each type symbol, note symbol description
4. HVAC diffusers/grilles visible on ceiling: count by type/size
5. Access panels: count and size
6. Soffits and bulkheads: linear feet
7. Decorative elements: faux beams, reveals

CEILING TYPE PATTERNS:
- Dashed grid = ACT (usually 2x2 or 2x4)
- Solid boundary = GWB (drywall ceiling)
- "EXPOSED CEILING" label = no finish ceiling
- Hatched area = soffit or bulkhead

CATEGORIES: architectural (ceiling, soffit), electrical (light fixtures), mechanical (diffusers)
UNITS: SF for areas, LF for linear, EA for counts`,

  userPrompt: `Extract all ceiling-related quantities from this reflected ceiling plan.
Count each light fixture type separately. Note ceiling type zones and heights.
For each item provide: category, sub_type, quantity, unit, confidence, extraction_method, source_region, notes.
Return JSON with: { page_type: "reflected_ceiling_plan", items: [...], raw_notes, warnings, extraction_notes }`,

  preferredModel: "gpt-4o",
  fallbackModel: "claude-sonnet",
  maxTokens: 3000,
  temperature: 0.0,
  imageDetail: "high",
};

// ---------------------------------------------------------------------------
// Elevation
// ---------------------------------------------------------------------------

const ELEVATION_PROMPT: PromptConfig = {
  systemPrompt: `You are extracting quantities from a BUILDING ELEVATION or INTERIOR ELEVATION.

RULES:
1. NEVER fabricate quantities
2. Focus on materials, dimensions, and countable elements visible in elevation view

EXTRACT:
1. Wall materials/finishes (stone, brick, stucco, metal panel, glass, paint)
2. Window/storefront: dimensions, type, count
3. Doors visible in elevation: dimensions, type
4. Signage: locations, sizes
5. Heights and floor-to-floor dimensions
6. Material transitions and trim
7. Roof elements (parapet, coping, scupper)

FOR KITCHEN/SERVICE COUNTER ELEVATIONS:
- Equipment dimensions and specifications
- Backsplash material and area (SF)
- Shelving linear feet
- Hood dimensions

FOR RESTROOM ELEVATIONS:
- Tile height and area (SF)
- Fixture mounting heights
- Accessory locations and count

CATEGORIES: architectural (finishes, openings), mechanical (equipment)
UNITS: SF for area, LF for linear, EA for count`,

  userPrompt: `Extract all measurable quantities from this elevation drawing.
Focus on: materials, finishes, openings, equipment, dimensions.
For each item provide: category, sub_type, quantity, unit, confidence, extraction_method, source_region, notes.
Return JSON with: { page_type: "elevation", items: [...], raw_notes, warnings, extraction_notes }`,

  preferredModel: "gpt-4o",
  fallbackModel: "claude-sonnet",
  maxTokens: 3000,
  temperature: 0.0,
  imageDetail: "high",
};

// ---------------------------------------------------------------------------
// Detail
// ---------------------------------------------------------------------------

const DETAIL_PROMPT: PromptConfig = {
  systemPrompt: `You are extracting SPECIFICATION data from a CONSTRUCTION DETAIL drawing.

Details show HOW things are built. Extract material specifications, not area quantities.

EXTRACT:
1. Materials specified: stud size/gauge, gypsum board type/layers, insulation type/R-value
2. Assembly components: each layer (e.g., "5/8\" Type X GYP BD both sides")
3. Fastener/connection specifications
4. Dimensions: thickness, spacing, clearances
5. Product callouts: manufacturer, model if noted
6. Code references noted on detail

COMMON DETAIL TYPES:
- Wall/partition section: studs + GWB + insulation + finish layers
- Ceiling detail: suspension system + tile/GWB
- Soffit/bulkhead: framing + finish
- Glazing header/sill/mullion: frame profiles + glass type

IMPORTANT: Return items as material specifications that enrich floor plan quantities.
Use sub_type to describe the full material spec (e.g., "3-5/8\" MTS, 25 GA @ 16\" O.C. w/ 5/8\" GYP BD").

CATEGORIES: architectural, structural
UNITS: Use specification units (EA for assemblies, or describe in notes)`,

  userPrompt: `Extract material specifications and assembly details from this construction detail.
Focus on: material types, sizes, gauges, spacing, layers, manufacturers.
For each item provide: category, sub_type (full material description), quantity (1 if spec), unit, confidence, extraction_method, source_region, notes.
Return JSON with: { page_type: "detail", items: [...], raw_notes, warnings, extraction_notes }`,

  preferredModel: "gpt-4o",
  fallbackModel: "claude-sonnet",
  maxTokens: 2000,
  temperature: 0.0,
  imageDetail: "high",
};

// ---------------------------------------------------------------------------
// Demolition Plan
// ---------------------------------------------------------------------------

const DEMOLITION_PROMPT: PromptConfig = {
  systemPrompt: `You are extracting DEMOLITION scope from a construction drawing.

RULES:
1. NEVER fabricate quantities
2. Clearly distinguish: DEMOLISH vs EXISTING TO REMAIN vs NEW

EXTRACT:
1. Walls to be removed: linear feet, type, height
2. Doors/windows to be removed: count, size
3. Ceiling to be removed: square feet, type
4. Flooring to be removed: square feet, type
5. Equipment to be removed: count, description
6. MEP to be removed/rerouted: scope description
7. Items marked "EXISTING TO REMAIN" — note but do NOT count as demo

DRAWING CONVENTIONS:
- Dashed/lighter lines = existing to remain
- Bold/heavy lines = new construction
- Hatched/cross-hatched = demolition
- "(E)" prefix = existing, "(N)" = new, "(D)" = demolish

CATEGORIES: Use "architectural" for demo items, note "demolition" in sub_type prefix
UNITS: LF, SF, EA as appropriate`,

  userPrompt: `Extract all demolition quantities from this plan.
Identify everything marked for removal. Do NOT include items marked "existing to remain".
For each item provide: category, sub_type (prefix with "demo: "), quantity, unit, confidence, extraction_method, source_region, notes.
Return JSON with: { page_type: "demolition_plan", items: [...], raw_notes, warnings, extraction_notes }`,

  preferredModel: "gpt-4o",
  fallbackModel: "claude-sonnet",
  maxTokens: 3000,
  temperature: 0.0,
  imageDetail: "high",
};

// ---------------------------------------------------------------------------
// Door Schedule
// ---------------------------------------------------------------------------

const DOOR_SCHEDULE_PROMPT: PromptConfig = {
  systemPrompt: `You are extracting a DOOR SCHEDULE from a construction drawing.

A door schedule is a TABLE listing all doors in the project. Extract EVERY row.

EXPECTED COLUMNS (may vary):
- Mark/Number: door identifier (1, 2, 3 or A, B, C)
- Quantity: how many of this type
- Size: width x height (e.g., 3'-0"x7'-0")
- Type: door type letter/number
- Material/Description: what the door is made of
- Frame: frame type
- Hardware: hardware set codes (A, B, C, D, etc.)
- Fire Rating: rated/non-rated
- Remarks/Notes

RULES:
1. Extract EVERY row including partial data
2. Preserve exact text (do not paraphrase materials)
3. Note (E)=Existing, (R)=Removed, (S)=Switch tags
4. Look for hardware legend/key that explains codes

For each door, create a takeoff item with:
- category: "architectural"
- sub_type: full description (e.g., "Door Type A - 3'-0\"x7'-0\" tempered glass in metal frame")
- quantity: from Qty column or count of marks on floor plan
- unit: "EA"

CATEGORIES: architectural
UNITS: EA`,

  userPrompt: `Extract the complete door schedule from this drawing.
Return every row as a separate item with full description.
For each item provide: category ("architectural"), sub_type (full door description), quantity, unit ("EA"), confidence, extraction_method ("labeled"), source_region, notes (hardware codes, fire rating, remarks).
Return JSON with: { page_type: "door_schedule", items: [...], raw_notes, warnings, extraction_notes }`,

  preferredModel: "gpt-4o",
  fallbackModel: "claude-sonnet",
  maxTokens: 3000,
  temperature: 0.0,
  imageDetail: "high",
};

// ---------------------------------------------------------------------------
// Finish Schedule
// ---------------------------------------------------------------------------

const FINISH_SCHEDULE_PROMPT: PromptConfig = {
  systemPrompt: `You are extracting a FINISH SCHEDULE from a construction drawing.

A finish schedule lists room-by-room finishes. Extract EVERY row.

EXPECTED COLUMNS:
- Room Name/Number
- Floor Finish (VCT, ceramic tile, epoxy, carpet, etc.)
- Wall Finish (paint, FRP, ceramic tile, etc.)
- Base/Wainscot (rubber base, tile base, etc.)
- Ceiling Type (ACT, GWB, exposed, etc.)
- Ceiling Height
- Notes

For each room, create multiple items (one per finish type):
- Floor: category "architectural", sub_type "flooring: [material]"
- Wall: category "painting" or "architectural", sub_type "[finish type]"
- Ceiling: category "architectural", sub_type "ceiling: [type]"

CATEGORIES: architectural, painting
UNITS: Note room name in notes (quantities calculated from floor plan areas)`,

  userPrompt: `Extract the complete finish schedule from this drawing.
Create separate items for each finish type per room (floor, wall, base, ceiling).
For each item provide: category, sub_type (include finish material), quantity (1 per room entry), unit ("EA"), confidence, extraction_method ("labeled"), source_region, notes (room name, ceiling height).
Return JSON with: { page_type: "finish_schedule", items: [...], raw_notes, warnings, extraction_notes }`,

  preferredModel: "gpt-4o",
  fallbackModel: "claude-sonnet",
  maxTokens: 3000,
  temperature: 0.0,
  imageDetail: "high",
};

// ---------------------------------------------------------------------------
// Fixture Schedule (Lighting/Ceiling)
// ---------------------------------------------------------------------------

const FIXTURE_SCHEDULE_PROMPT: PromptConfig = {
  systemPrompt: `You are extracting a FIXTURE SCHEDULE or LIGHTING SCHEDULE from a construction drawing.

EXPECTED COLUMNS:
- Symbol: graphic symbol or letter
- Description: fixture type description
- Manufacturer: maker name
- Catalog/Model: model number
- Wattage/Lamp: light source
- Location: where used
- Notes/Remarks

For each fixture type, create an item:
- category: "electrical"
- sub_type: full description with manufacturer if available
- quantity: count from schedule or "TBD" if only spec
- unit: "EA"

CATEGORIES: electrical
UNITS: EA`,

  userPrompt: `Extract the complete fixture/lighting schedule from this drawing.
Include symbol description, manufacturer, model, and location for each type.
For each item provide: category ("electrical"), sub_type (full description), quantity, unit ("EA"), confidence, extraction_method ("labeled"), source_region, notes (manufacturer, location).
Return JSON with: { page_type: "fixture_schedule", items: [...], raw_notes, warnings, extraction_notes }`,

  preferredModel: "gpt-4o",
  fallbackModel: "claude-sonnet",
  maxTokens: 2500,
  temperature: 0.0,
  imageDetail: "high",
};

// ---------------------------------------------------------------------------
// Equipment Schedule
// ---------------------------------------------------------------------------

const EQUIPMENT_SCHEDULE_PROMPT: PromptConfig = {
  systemPrompt: `You are extracting an EQUIPMENT SCHEDULE from a construction drawing.

EXPECTED COLUMNS:
- Tag/Mark: equipment identifier (RTU-1, EF-1, etc.)
- Description: equipment type
- Manufacturer/Model
- Capacity: tonnage, CFM, GPM, HP, BTU
- Electrical: voltage/phase/amps
- Location
- Notes

For each equipment item:
- category: "mechanical" for HVAC, "electrical" for electrical equipment, "plumbing" for plumbing equipment
- sub_type: full description with capacity
- quantity: from schedule
- unit: "EA"

CATEGORIES: mechanical, electrical, plumbing
UNITS: EA`,

  userPrompt: `Extract the complete equipment schedule from this drawing.
Include all specifications: capacity, electrical requirements, manufacturer.
For each item provide: category, sub_type (full spec), quantity, unit ("EA"), confidence, extraction_method ("labeled"), source_region, notes (capacity, electrical, location).
Return JSON with: { page_type: "equipment_schedule", items: [...], raw_notes, warnings, extraction_notes }`,

  preferredModel: "gpt-4o",
  fallbackModel: "claude-sonnet",
  maxTokens: 3000,
  temperature: 0.0,
  imageDetail: "high",
};

// ---------------------------------------------------------------------------
// Panel Schedule
// ---------------------------------------------------------------------------

const PANEL_SCHEDULE_PROMPT: PromptConfig = {
  systemPrompt: `You are extracting a PANEL SCHEDULE from an electrical drawing.

EXPECTED DATA:
- Panel name/designation (LP-1, MDP, etc.)
- Voltage/Phase (208V/3PH, 120/208V, etc.)
- Main breaker size (amps)
- Circuit list: circuit number, breaker size, poles, load description, wire/conduit size

For the panel itself:
- category: "electrical"
- sub_type: "panel [name] - [voltage] [main breaker]A"
- quantity: 1
- unit: "EA"

For circuits (summarize, don't list each one):
- Count total circuits by breaker size
- Note total connected load if shown
- Note spare circuits count

CATEGORIES: electrical
UNITS: EA for panel, note circuit counts in notes`,

  userPrompt: `Extract panel schedule data from this electrical drawing.
Include panel specs and summarize circuits (total count, spares, connected load).
For each item provide: category ("electrical"), sub_type, quantity, unit, confidence, extraction_method ("labeled"), source_region, notes (voltage, phase, circuit summary).
Return JSON with: { page_type: "panel_schedule", items: [...], raw_notes, warnings, extraction_notes }`,

  preferredModel: "gpt-4o",
  fallbackModel: "claude-sonnet",
  maxTokens: 3000,
  temperature: 0.0,
  imageDetail: "high",
};

// ---------------------------------------------------------------------------
// MEP: Mechanical Plan
// ---------------------------------------------------------------------------

const MECHANICAL_PROMPT: PromptConfig = {
  systemPrompt: `You are extracting MECHANICAL/HVAC quantities from a construction drawing.

EXTRACT:
1. DUCTWORK: Trace each duct run, note size (WxH or diameter), estimate length from scale
2. FLEX DUCT: Note connections, size
3. DIFFUSERS/GRILLES: Count each supply/return air device by type and size
4. EQUIPMENT: List all HVAC equipment (RTU, split, exhaust fan) with capacity if noted
5. THERMOSTATS: Count
6. INSULATION: Note if duct insulation is called out
7. FIRE/SMOKE DAMPERS: Count

SYMBOL PATTERNS:
- Rectangle with diagonal = diffuser/grille (size noted nearby)
- Double lines = rectangular duct (WxH nearby)
- Circle with line = round duct (diameter nearby)
- Diamond = thermostat
- Circle with X = exhaust fan

RULES:
1. NEVER fabricate quantities
2. If duct length not dimensioned, estimate from scale with confidence < 0.5
3. Count each diffuser/grille individually

CATEGORIES: mechanical
UNITS: LF for duct, EA for devices/equipment, SF for insulation`,

  userPrompt: `Extract all mechanical/HVAC quantities from this drawing.
Count diffusers, grilles, and equipment. Trace duct runs with sizes.
For each item provide: category ("mechanical"), sub_type (include size), quantity, unit, confidence, extraction_method, source_region, notes (capacity, CFM if noted).
Return JSON with: { page_type: "mechanical_plan", items: [...], raw_notes, warnings, extraction_notes }`,

  preferredModel: "gpt-4o",
  fallbackModel: "claude-sonnet",
  maxTokens: 4000,
  temperature: 0.0,
  imageDetail: "high",
};

// ---------------------------------------------------------------------------
// MEP: Electrical Plan
// ---------------------------------------------------------------------------

const ELECTRICAL_PROMPT: PromptConfig = {
  systemPrompt: `You are extracting ELECTRICAL quantities from a construction drawing.

EXTRACT:
1. RECEPTACLES: Count by type (duplex, GFI, weatherproof, dedicated, 220V)
2. SWITCHES: Count by type (single-pole S, 3-way S3, dimmer SD, occupancy sensor)
3. LIGHT FIXTURES: Count by type symbol (cross-reference fixture schedule)
4. PANELS: Note panel name, voltage, phase, main breaker
5. JUNCTION BOXES: Count
6. EXIT SIGNS: Count (illuminated, battery backup)
7. EMERGENCY LIGHTS: Count
8. FIRE ALARM DEVICES: Count (smoke detectors, pull stations, horns/strobes)
9. CONDUIT: Note sizes if called out on plan

SYMBOL PATTERNS:
- ◎ = duplex receptacle
- ◎WP = weatherproof receptacle
- ◎GFI = GFI receptacle
- S = single-pole switch
- S3 = three-way switch
- SD = dimmer switch
- ▣ = junction box

RULES:
1. Count every device symbol individually
2. Group by type in the output
3. Note circuit/panel assignments if visible

CATEGORIES: electrical
UNITS: EA for devices, LF for conduit/wire`,

  userPrompt: `Extract all electrical quantities from this drawing.
Count every receptacle, switch, fixture, and device individually by type.
For each item provide: category ("electrical"), sub_type (device type), quantity, unit ("EA"), confidence, extraction_method, source_region, notes (circuit/panel if noted).
Return JSON with: { page_type: "electrical_plan", items: [...], raw_notes, warnings, extraction_notes }`,

  preferredModel: "gpt-4o",
  fallbackModel: "claude-sonnet",
  maxTokens: 4000,
  temperature: 0.0,
  imageDetail: "high",
};

// ---------------------------------------------------------------------------
// MEP: Plumbing Plan
// ---------------------------------------------------------------------------

const PLUMBING_PROMPT: PromptConfig = {
  systemPrompt: `You are extracting PLUMBING quantities from a construction drawing.

EXTRACT:
1. FIXTURES: Count each type (lavatory, water closet, urinal, floor drain, floor sink, mop sink, hand sink, 3-comp sink, grease trap)
2. EQUIPMENT: Water heater (size/type), backflow preventer, PRV
3. PIPING: Note pipe sizes, material, and type (CW=cold water, HW=hot water, W=waste, V=vent, G=gas)
4. CLEANOUTS: Count and note size
5. VALVES: Count by type (gate, ball, check) and size
6. HOSE BIBBS: Count
7. SPECIALTIES: Vacuum breakers, mixing valves, expansion tanks

PIPE SIZING: Note where pipe size changes (e.g., "2\" CW reduces to 3/4\" at branch")

RULES:
1. Count every fixture individually
2. Note fixture specifications if called out
3. For pipe runs: note size, material, and run direction

CATEGORIES: plumbing
UNITS: EA for fixtures/valves, LF for piping`,

  userPrompt: `Extract all plumbing quantities from this drawing.
Count every fixture and note pipe sizes.
For each item provide: category ("plumbing"), sub_type (fixture/pipe type with size), quantity, unit, confidence, extraction_method, source_region, notes (specifications).
Return JSON with: { page_type: "plumbing_plan", items: [...], raw_notes, warnings, extraction_notes }`,

  preferredModel: "gpt-4o",
  fallbackModel: "claude-sonnet",
  maxTokens: 3500,
  temperature: 0.0,
  imageDetail: "high",
};

// ---------------------------------------------------------------------------
// Site Plan
// ---------------------------------------------------------------------------

const SITE_PLAN_PROMPT: PromptConfig = {
  systemPrompt: `You are extracting quantities from a SITE PLAN.

EXTRACT:
1. Building footprint area
2. Parking spaces count (regular, ADA, EV)
3. Paving/concrete areas (driveways, walkways, patios)
4. Landscaping areas
5. Fencing/walls linear feet
6. Site utilities (noted on plan)
7. Signage locations

RULES:
1. Site plans are typically at smaller scale (1/32"=1'-0" or similar)
2. Focus on countable and labeled items
3. Note ADA requirements if called out

CATEGORIES: site, general
UNITS: SF for areas, LF for linear, EA for count`,

  userPrompt: `Extract site-related quantities from this plan.
Focus on: parking, paving, landscaping, utilities, signage.
For each item provide: category, sub_type, quantity, unit, confidence, extraction_method, source_region, notes.
Return JSON with: { page_type: "site_plan", items: [...], raw_notes, warnings, extraction_notes }`,

  preferredModel: "gpt-4o",
  fallbackModel: "claude-sonnet",
  maxTokens: 2500,
  temperature: 0.0,
  imageDetail: "high",
};

// ---------------------------------------------------------------------------
// Egress Plan (metadata only)
// ---------------------------------------------------------------------------

const EGRESS_PROMPT: PromptConfig = {
  systemPrompt: `You are extracting OCCUPANCY and EGRESS data from an egress plan.

EXTRACT (metadata for code compliance):
1. Occupant load table: room name, area (SF), load factor, occupant count
2. Total indoor occupancy
3. Required vs actual exits
4. Path of travel lengths
5. Emergency fixture list (exit signs, emergency lights)
6. ADA seating requirements (total, required ADA count)

This is REFERENCE data, not direct construction quantities.
Emergency fixture counts may inform electrical estimates.

CATEGORIES: general (occupancy data), electrical (exit signs, emergency lights)
UNITS: EA for fixtures, note occupancy counts in notes`,

  userPrompt: `Extract occupancy load and egress data from this plan.
Include the occupant load table and emergency fixture requirements.
For each item provide: category, sub_type, quantity, unit, confidence, extraction_method, source_region, notes.
Return JSON with: { page_type: "egress_plan", items: [...], raw_notes, warnings, extraction_notes }`,

  preferredModel: "gpt-4o",
  fallbackModel: "claude-sonnet",
  maxTokens: 2000,
  temperature: 0.0,
  imageDetail: "low",
};

// ---------------------------------------------------------------------------
// Window Schedule
// ---------------------------------------------------------------------------

const WINDOW_SCHEDULE_PROMPT: PromptConfig = {
  systemPrompt: `You are extracting a WINDOW SCHEDULE from a construction drawing.

EXPECTED COLUMNS:
- Mark/Type: window identifier
- Size: width x height
- Material: aluminum, vinyl, wood, steel
- Glazing: single, double, tempered, laminated, low-e
- Operation: fixed, casement, sliding, awning, hung
- Quantity
- Notes/Remarks

For each window type:
- category: "architectural"
- sub_type: full description (e.g., "Window Type A - 4'-0\"x5'-0\" fixed aluminum w/ tempered glass")
- quantity: from schedule
- unit: "EA"

CATEGORIES: architectural
UNITS: EA`,

  userPrompt: `Extract the complete window schedule from this drawing.
Return every window type with full specifications.
For each item provide: category ("architectural"), sub_type (full description), quantity, unit ("EA"), confidence, extraction_method ("labeled"), source_region, notes.
Return JSON with: { page_type: "window_schedule", items: [...], raw_notes, warnings, extraction_notes }`,

  preferredModel: "gpt-4o",
  fallbackModel: "claude-sonnet",
  maxTokens: 2500,
  temperature: 0.0,
  imageDetail: "high",
};

// ---------------------------------------------------------------------------
// Generic fallback (same as original parse-prompt.ts)
// ---------------------------------------------------------------------------

const GENERIC_FALLBACK_PROMPT: PromptConfig = {
  systemPrompt: `You are an expert construction plan takeoff assistant. Analyze construction plan images and extract quantities for estimation.

CRITICAL RULES:
- NEVER fabricate or guess quantities
- Only extract explicitly labeled dimensions and counts
- Use confidence scores: 1.0 = explicitly labeled, 0.7-0.9 = calculated from scale, 0.5-0.6 = inferred from context

CATEGORIES:
- structural: Foundations, beams, columns, steel, concrete
- architectural: Walls, doors, windows, finishes, ceilings
- mechanical: HVAC, ductwork, equipment
- electrical: Wiring, panels, fixtures, conduit
- plumbing: Pipes, fixtures, drains, water systems
- painting: Interior/exterior paint, surface prep
- site: Excavation, grading, paving, landscaping
- general: Items that don't fit other categories

UNITS: Use standard construction units (LF, SF, CF, CY, EA, TON, etc.)`,

  userPrompt: `Analyze this construction plan page and extract all takeoff quantities.
For each item provide: category, sub_type, quantity, unit, confidence (0.0-1.0), extraction_method (labeled/calculated/inferred), source_region ({x,y,width,height}), notes.
Return JSON with: { page_type, items: [...], raw_notes, warnings, extraction_notes }`,

  preferredModel: "gpt-4o",
  fallbackModel: "claude-sonnet",
  maxTokens: 2000,
  temperature: 0.0,
  imageDetail: "high",
};

// ---------------------------------------------------------------------------
// Prompt lookup map
// ---------------------------------------------------------------------------

const PROMPT_MAP: Partial<Record<SheetContentType, PromptConfig>> = {
  floor_plan: FLOOR_PLAN_PROMPT,
  demolition_plan: DEMOLITION_PROMPT,
  rcp: RCP_PROMPT,
  roof_plan: FLOOR_PLAN_PROMPT,
  elevation: ELEVATION_PROMPT,
  section: ELEVATION_PROMPT,
  detail: DETAIL_PROMPT,
  site_plan: SITE_PLAN_PROMPT,
  egress: EGRESS_PROMPT,
  door_schedule: DOOR_SCHEDULE_PROMPT,
  window_schedule: WINDOW_SCHEDULE_PROMPT,
  finish_schedule: FINISH_SCHEDULE_PROMPT,
  fixture_schedule: FIXTURE_SCHEDULE_PROMPT,
  equipment_schedule: EQUIPMENT_SCHEDULE_PROMPT,
  panel_schedule: PANEL_SCHEDULE_PROMPT,
  mechanical_plan: MECHANICAL_PROMPT,
  electrical_plan: ELECTRICAL_PROMPT,
  plumbing_plan: PLUMBING_PROMPT,
};

// Content types that should be skipped (no AI call needed)
const SKIP_TYPES = new Set<SheetContentType>([
  "cover",
  "code_compliance",
  "ada_compliance",
]);

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Get the optimal prompt configuration for a given sheet content type.
 * Returns null for sheet types that should be skipped.
 */
export function getPromptForContentType(
  contentType: SheetContentType,
): PromptConfig | null {
  if (SKIP_TYPES.has(contentType)) return null;
  return PROMPT_MAP[contentType] ?? GENERIC_FALLBACK_PROMPT;
}

/**
 * Get the generic fallback prompt (backward-compatible with existing parse flow).
 */
export function getGenericPrompt(): PromptConfig {
  return GENERIC_FALLBACK_PROMPT;
}
