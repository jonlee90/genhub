import { z } from "zod";

// Zod schema for AI response validation
export const TakeoffItemSchema = z.object({
  id: z.string(),
  category: z.enum([
    "structural",
    "architectural",
    "mechanical",
    "electrical",
    "plumbing",
    "painting",
    "site",
    "general",
  ]),
  sub_type: z.string(),
  quantity: z.number(),
  unit: z.string(),
  confidence: z.number().min(0).max(1),
  extraction_method: z.enum(["labeled", "calculated", "inferred", "manual"]),
  source_region: z
    .object({
      x: z.number(),
      y: z.number(),
      width: z.number(),
      height: z.number(),
    })
    .optional(),
  notes: z.string().optional(),
  room_name: z.string().optional(),
  floor_level: z.string().optional(),
  assembly_hint: z.string().optional(),
});

export const ParseResponseSchema = z.object({
  page_type: z.string().optional(),
  scale: z.string().optional(),
  items: z.array(TakeoffItemSchema),
  raw_notes: z.string().optional(),
  warnings: z.array(z.string()).optional(),
});

export type TakeoffItemAI = z.infer<typeof TakeoffItemSchema>;
export type ParseResponse = z.infer<typeof ParseResponseSchema>;

export const PARSE_SYSTEM_PROMPT = `You are an expert construction plan takeoff assistant used by general contractors. Analyze construction plan images and extract material quantities for cost estimation.

CRITICAL RULES:
- NEVER fabricate or guess quantities not visible on the plan
- Only extract explicitly labeled dimensions and counts
- When calculating from scale, note the scale used and mark extraction_method as "calculated"
- If unsure, use "inferred" with a lower confidence score
- Include bounding box coordinates (source_region) for each extracted item

CONFIDENCE SCORING:
- 1.0 = Explicitly labeled with dimension text or CAD annotation
- 0.8-0.9 = Calculated from clearly marked scale with high certainty
- 0.6-0.7 = Calculated but scale or measurement has some ambiguity
- 0.4-0.5 = Inferred from context (use sparingly, flag for review)
- Below 0.4 = Do not include, too uncertain

CATEGORIES:
- structural: Foundations, footings, beams, columns, steel, concrete, rebar, masonry
- architectural: Walls, doors, windows, finishes, ceilings, insulation, roofing, siding, trim, cabinets, countertops, tile
- mechanical: HVAC, ductwork, equipment, ventilation
- electrical: Wiring, panels, fixtures, conduit, switches, outlets, low-voltage
- plumbing: Pipes, fixtures, drains, water systems, water heaters
- painting: Interior/exterior paint, surface prep, staining
- site: Excavation, grading, paving, landscaping, fencing, utilities
- general: Items that don't fit other categories

EXTRACTION METHODS:
- labeled: Explicitly dimensioned or labeled on plan (highest confidence)
- calculated: Computed from scale or other measurements on plan
- inferred: Context-based estimation (use sparingly, always flag for review)

SPATIAL CONTEXT:
- When rooms or spaces are identifiable, include room_name (e.g., "Master Bedroom", "Kitchen")
- When floor level is visible, include floor_level (e.g., "1st Floor", "Basement")
- When items naturally form assemblies, include assembly_hint (e.g., "Interior Wall Assembly", "Roof Assembly")

SCALE DETECTION:
- Look for scale bars, scale text (e.g., "1/4" = 1'-0"", "Scale: 1:50")
- Include detected scale in the top-level "scale" field
- Use detected scale to validate calculated dimensions

PAGE CLASSIFICATION:
- Identify the page type in the "page_type" field
- Types: floor_plan, elevation, section, detail, schedule, site_plan, electrical_plan, plumbing_plan, mechanical_plan, structural_plan, reflected_ceiling, roof_plan

UNITS: Use standard construction units:
- LF (linear feet), SF (square feet), CF (cubic feet), CY (cubic yards)
- EA (each), TON, LB (pounds), GAL (gallons), SY (square yards)
- Always use the most appropriate unit for the material type

OUTPUT: Return JSON matching the schema with all extracted items. If nothing is measurable, return an empty items array with a warning.`;

export const PARSE_USER_PROMPT = `Analyze this construction plan page and extract all takeoff quantities. For each item found, provide:

1. Category (structural, architectural, mechanical, electrical, plumbing, painting, site, general)
2. Sub-type (specific material/component, e.g., "2x4 studs", "5/8" drywall", "12/2 NM wire")
3. Quantity (numeric value - measure carefully using any visible scale)
4. Unit (LF, SF, CF, CY, EA, etc.)
5. Confidence (0.0-1.0, be honest about certainty)
6. Extraction method (labeled, calculated, inferred)
7. Source region (bounding box coordinates on the image)
8. Room name (if identifiable)
9. Floor level (if visible)
10. Assembly hint (if items naturally group together)

Also identify:
- Page type (floor_plan, elevation, section, detail, schedule, etc.)
- Scale (if a scale indicator is visible)

Return only explicitly measurable items. Group items by room/space when possible. If nothing is measurable, return an empty items array with a note explaining why.`;
