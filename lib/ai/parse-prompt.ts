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
});

export const ParseResponseSchema = z.object({
  page_type: z.string().optional(),
  items: z.array(TakeoffItemSchema),
  raw_notes: z.string().optional(),
  warnings: z.array(z.string()).optional(),
});

export type TakeoffItemAI = z.infer<typeof TakeoffItemSchema>;
export type ParseResponse = z.infer<typeof ParseResponseSchema>;

export const PARSE_SYSTEM_PROMPT = `You are an expert construction plan takeoff assistant. Analyze construction plan images and extract quantities for estimation.

CRITICAL RULES:
- NEVER fabricate or guess quantities
- Only extract explicitly labeled dimensions and counts
- Use confidence scores: 1.0 = explicitly labeled, 0.7-0.9 = calculated from scale, 0.5-0.6 = inferred from context
- Categorize items accurately using the provided categories
- Include bounding box coordinates for each item

CATEGORIES:
- structural: Foundations, beams, columns, steel, concrete
- architectural: Walls, doors, windows, finishes, ceilings
- mechanical: HVAC, ductwork, equipment
- electrical: Wiring, panels, fixtures, conduit
- plumbing: Pipes, fixtures, drains, water systems
- painting: Interior/exterior paint, surface prep
- site: Excavation, grading, paving, landscaping
- general: Items that don't fit other categories

EXTRACTION METHODS:
- labeled: Explicitly dimensioned/labeled on plan
- calculated: Computed from scale/measurements
- inferred: Context-based estimation (use sparingly)

UNITS: Use standard construction units (LF, SF, CF, CY, EA, TON, etc.)

OUTPUT: Return JSON matching the schema with all extracted items.`;

export const PARSE_USER_PROMPT = `Analyze this construction plan page and extract all takeoff quantities. For each item, provide:
1. Category (structural, architectural, mechanical, electrical, plumbing, painting, site, general)
2. Sub-type (specific material/component, e.g., "2x4 studs", "5/8\\" drywall")
3. Quantity (numeric value)
4. Unit (LF, SF, CF, CY, EA, etc.)
5. Confidence (0.0-1.0)
6. Extraction method (labeled, calculated, inferred)
7. Source region (bounding box coordinates)

Return only explicitly measurable items. If nothing is measurable, return an empty items array.`;
