/**
 * CSI MasterFormat Division Mapper
 *
 * Maps extracted takeoff items to CSI divisions for organized estimate output.
 * Handles deduplication of items extracted from multiple sheets.
 */

// ---------------------------------------------------------------------------
// CSI Division definitions
// ---------------------------------------------------------------------------

export interface CsiDivision {
  code: string;
  name: string;
  trades: string[];
}

export const CSI_DIVISIONS: Record<string, CsiDivision> = {
  "01": { code: "01", name: "General Requirements", trades: ["general"] },
  "02": {
    code: "02",
    name: "Existing Conditions",
    trades: ["demolition", "demo"],
  },
  "03": { code: "03", name: "Concrete", trades: ["concrete"] },
  "04": { code: "04", name: "Masonry", trades: ["masonry"] },
  "05": {
    code: "05",
    name: "Metals",
    trades: ["steel", "misc_metals", "metals"],
  },
  "06": {
    code: "06",
    name: "Wood, Plastics, Composites",
    trades: ["framing", "millwork", "casework", "lumber"],
  },
  "07": {
    code: "07",
    name: "Thermal & Moisture Protection",
    trades: ["insulation", "waterproofing", "roofing"],
  },
  "08": {
    code: "08",
    name: "Openings",
    trades: ["door", "window", "glazing", "hardware"],
  },
  "09": {
    code: "09",
    name: "Finishes",
    trades: ["drywall", "flooring", "painting", "paint", "ceiling", "tile"],
  },
  "10": {
    code: "10",
    name: "Specialties",
    trades: ["signage", "accessories", "toilet_accessories"],
  },
  "12": {
    code: "12",
    name: "Furnishings",
    trades: ["countertops", "window_treatments"],
  },
  "21": {
    code: "21",
    name: "Fire Suppression",
    trades: ["fire_sprinkler", "fire_suppression"],
  },
  "22": { code: "22", name: "Plumbing", trades: ["plumbing"] },
  "23": { code: "23", name: "HVAC", trades: ["hvac", "mechanical"] },
  "26": { code: "26", name: "Electrical", trades: ["electrical"] },
  "28": {
    code: "28",
    name: "Electronic Safety & Security",
    trades: ["fire_alarm", "security"],
  },
};

// ---------------------------------------------------------------------------
// Trade → CSI Division mapping
// ---------------------------------------------------------------------------

/** Build reverse lookup: trade name → CSI division code */
function buildTradeIndex(): Map<string, string> {
  const index = new Map<string, string>();
  for (const [code, div] of Object.entries(CSI_DIVISIONS)) {
    for (const trade of div.trades) {
      index.set(trade, code);
    }
  }
  return index;
}

const TRADE_TO_CSI = buildTradeIndex();

/**
 * Map a trade name to its CSI division code.
 * Returns "01" (General) if no match found.
 */
export function tradeToCsiDivision(trade: string): string {
  // Direct lookup
  const direct = TRADE_TO_CSI.get(trade.toLowerCase());
  if (direct) return direct;

  // Fuzzy matching: check if trade contains any known trade keyword
  for (const [knownTrade, code] of TRADE_TO_CSI) {
    if (trade.toLowerCase().includes(knownTrade)) {
      return code;
    }
  }

  return "01"; // Default to General Requirements
}

/**
 * Map a category + sub_type to a CSI division code.
 * Uses sub_type first (more specific), falls back to category.
 */
export function itemToCsiDivision(
  category: string,
  subType: string,
  trade?: string,
): string {
  // Use trade if available (already inferred by normalize-takeoff)
  if (trade) {
    const fromTrade = tradeToCsiDivision(trade);
    if (fromTrade !== "01") return fromTrade;
  }

  // Check sub_type for demo indicators
  const subLower = subType.toLowerCase();
  if (
    subLower.startsWith("demo") ||
    subLower.includes("demolition") ||
    subLower.includes("remove")
  ) {
    return "02";
  }

  // Map category to CSI
  const categoryMap: Record<string, string> = {
    structural: "05",
    architectural: "09", // Default arch to finishes; door/window override below
    mechanical: "23",
    electrical: "26",
    plumbing: "22",
    painting: "09",
    site: "02",
    general: "01",
  };

  // Sub_type overrides for architectural items
  if (category === "architectural") {
    if (subLower.includes("door")) return "08";
    if (subLower.includes("window")) return "08";
    if (subLower.includes("glazing")) return "08";
    if (subLower.includes("hardware")) return "08";
    if (subLower.includes("framing") || subLower.includes("stud")) return "06";
    if (subLower.includes("concrete")) return "03";
    if (subLower.includes("masonry")) return "04";
    if (subLower.includes("insulation")) return "07";
    if (subLower.includes("roofing")) return "07";
    if (subLower.includes("waterproof")) return "07";
    if (subLower.includes("casework")) return "12";
    if (subLower.includes("countertop")) return "12";
    if (subLower.includes("signage")) return "10";
  }

  return categoryMap[category] ?? "01";
}

// ---------------------------------------------------------------------------
// Deduplication
// ---------------------------------------------------------------------------

export interface DeduplicatedItem {
  /** Merged description */
  description: string;
  /** Final quantity (after dedup strategy) */
  quantity: number;
  unit: string;
  /** CSI division code */
  csiDivision: string;
  /** Source sheets this item came from */
  sourceSheets: string[];
  /** Whether this is demolition */
  isDemo: boolean;
  /** Lowest confidence among merged items */
  confidence: number;
  /** Whether any source item needs review */
  needsReview: boolean;
  /** Original item IDs that were merged */
  mergedItemIds: string[];
}

interface TakeoffItemForDedup {
  id: string;
  category: string;
  sub_type: string;
  trade?: string;
  quantity: number;
  unit: string;
  confidence: number;
  needs_review: boolean;
  source_sheet?: string;
}

/**
 * Deduplicate items that were extracted from multiple sheets.
 * Uses trade + sub_type + unit as the dedup key.
 */
export function deduplicateItems(
  items: TakeoffItemForDedup[],
): DeduplicatedItem[] {
  const groups = new Map<string, TakeoffItemForDedup[]>();

  for (const item of items) {
    const key = `${item.trade ?? item.category}|${item.sub_type.toLowerCase()}|${item.unit}`;
    const group = groups.get(key) ?? [];
    group.push(item);
    groups.set(key, group);
  }

  const results: DeduplicatedItem[] = [];

  for (const [, group] of groups) {
    const first = group[0];
    const isDemo =
      first.sub_type.toLowerCase().startsWith("demo") ||
      first.category === "demolition";

    // Dedup strategy: take the maximum quantity (most accurate source wins)
    const maxQuantity = Math.max(...group.map((g) => g.quantity));
    const minConfidence = Math.min(...group.map((g) => g.confidence));
    const anyNeedsReview = group.some((g) => g.needs_review);
    const sourceSheets = [
      ...new Set(group.map((g) => g.source_sheet).filter(Boolean)),
    ] as string[];

    results.push({
      description: first.sub_type,
      quantity: maxQuantity,
      unit: first.unit,
      csiDivision: itemToCsiDivision(
        first.category,
        first.sub_type,
        first.trade,
      ),
      sourceSheets,
      isDemo,
      confidence: minConfidence,
      needsReview: anyNeedsReview,
      mergedItemIds: group.map((g) => g.id),
    });
  }

  // Sort by CSI division, then description
  results.sort((a, b) => {
    const divCmp = a.csiDivision.localeCompare(b.csiDivision);
    if (divCmp !== 0) return divCmp;
    return a.description.localeCompare(b.description);
  });

  return results;
}

/**
 * Group deduplicated items by CSI division for estimate output.
 */
export function groupByCsiDivision(
  items: DeduplicatedItem[],
): Map<string, { division: CsiDivision; items: DeduplicatedItem[] }> {
  const groups = new Map<
    string,
    { division: CsiDivision; items: DeduplicatedItem[] }
  >();

  for (const item of items) {
    const div = CSI_DIVISIONS[item.csiDivision];
    if (!div) continue;

    const existing = groups.get(item.csiDivision);
    if (existing) {
      existing.items.push(item);
    } else {
      groups.set(item.csiDivision, { division: div, items: [item] });
    }
  }

  return groups;
}
