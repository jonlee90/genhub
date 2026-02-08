import type { TakeoffItemAI } from "./parse-prompt";

// Trade mapping based on category and sub_type
const TRADE_MAPPING: Record<string, string> = {
  "structural-concrete": "concrete",
  "structural-steel": "steel",
  "structural-lumber": "framing",
  "architectural-framing": "framing",
  "architectural-drywall": "drywall",
  "architectural-door": "carpentry",
  "architectural-window": "glazing",
  "architectural-flooring": "flooring",
  "architectural-paint": "painting",
  "mechanical-hvac": "hvac",
  "electrical-wiring": "electrical",
  "plumbing-pipe": "plumbing",
  "painting-interior": "painting",
  "painting-exterior": "painting",
  "site-excavation": "sitework",
  "site-paving": "sitework",
};

// Waste factors by trade
const WASTE_FACTORS: Record<string, number> = {
  drywall: 0.1, // 10%
  flooring: 0.15, // 15%
  framing: 0.05, // 5%
  concrete: 0.02, // 2%
  lumber: 0.05, // 5%
  electrical: 0.1, // 10%
  plumbing: 0.1, // 10%
  painting: 0.05, // 5%
  sitework: 0.02, // 2%
};

export function inferTrade(category: string, subType: string): string {
  const key = `${category}-${subType.toLowerCase().split(" ")[0]}`;
  const mappedTrade = TRADE_MAPPING[key];
  if (mappedTrade) return mappedTrade;

  // Fallback: use subType keywords
  const lower = subType.toLowerCase();
  if (lower.includes("drywall") || lower.includes("gypsum")) return "drywall";
  if (lower.includes("stud") || lower.includes("framing")) return "framing";
  if (lower.includes("concrete") || lower.includes("foundation"))
    return "concrete";
  if (lower.includes("paint")) return "painting";
  if (lower.includes("electric") || lower.includes("wire")) return "electrical";
  if (lower.includes("plumb") || lower.includes("pipe")) return "plumbing";
  if (lower.includes("hvac") || lower.includes("duct")) return "hvac";

  return "general";
}

export function getWasteFactor(trade: string): number {
  return WASTE_FACTORS[trade.toLowerCase()] || 0;
}

export function normalizeTakeoffItem(item: TakeoffItemAI) {
  const trade = inferTrade(item.category, item.sub_type);
  const wasteFactor = getWasteFactor(trade);
  const adjustedQuantity = item.quantity * (1 + wasteFactor);

  return {
    ai_item_id: item.id,
    category: item.category,
    trade,
    sub_type: item.sub_type,
    quantity: item.quantity,
    unit: item.unit,
    waste_factor: wasteFactor,
    adjusted_quantity: adjustedQuantity,
    extraction_method: item.extraction_method,
    confidence: item.confidence,
    source_region: item.source_region || null,
    needs_review: item.confidence < 0.7,
    review_status: "pending" as const,
    notes: item.notes || null,
  };
}
