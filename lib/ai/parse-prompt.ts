import { z } from "zod";

// Zod schema for AI response validation
export const TakeoffItemSchema = z.object({
  id: z.string().optional(), // OpenAI doesn't generate IDs, we'll create them
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
    .union([
      z.object({
        x: z.number(),
        y: z.number(),
        width: z.number(),
        height: z.number(),
      }),
      z.array(z.number()).length(4), // Accept [x, y, width, height]
    ])
    .optional()
    .transform((val) => {
      // Convert array to object if needed
      if (Array.isArray(val)) {
        return { x: val[0], y: val[1], width: val[2], height: val[3] };
      }
      return val;
    }),
  notes: z.string().optional(),
});

export const ParseResponseSchema = z.object({
  page_type: z.string().optional(),
  items: z.array(TakeoffItemSchema),
  raw_notes: z.string().optional(),
  warnings: z.array(z.string()).optional(),
  extraction_notes: z.string().optional(), // Why items were/weren't extracted
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
7. Source region (bounding box coordinates if visible)

Extract items that are:
- Explicitly labeled with dimensions/quantities (confidence 1.0)
- Calculable from scale bars or dimension strings (confidence 0.7-0.9)
- Countable elements like doors, windows, fixtures (confidence 0.8-1.0)

If this appears to be a construction plan but has no extractable quantities, return empty items array with:
- page_type: what type of plan it is (e.g., "site plan", "floor plan", "elevation", "detail")
- extraction_notes: brief explanation of why no items were extracted (e.g., "No labeled dimensions visible", "Plan shows only property boundaries", "Text too small to read clearly")

This helps the user understand whether the plan lacks quantities or if there was an extraction issue.`;
