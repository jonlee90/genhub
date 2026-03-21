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
  // MEP mechanical sub_type mappings
  "mechanical-ductwork": "hvac",
  "mechanical-flex_duct": "hvac",
  "mechanical-diffuser": "hvac",
  "mechanical-grille": "hvac",
  "mechanical-return_air": "hvac",
  "mechanical-exhaust_fan": "hvac",
  "mechanical-rtu": "hvac",
  "mechanical-split_system": "hvac",
  "mechanical-thermostat": "hvac",
  "mechanical-kitchen_hood": "hvac",
  "mechanical-fire_damper": "hvac",
  "mechanical-smoke_damper": "hvac",
  "mechanical-duct_insulation": "insulation",
  // MEP electrical sub_type mappings
  "electrical-receptacle_duplex": "electrical",
  "electrical-receptacle_gfi": "electrical",
  "electrical-receptacle_wp": "electrical",
  "electrical-receptacle_dedicated": "electrical",
  "electrical-receptacle_220v": "electrical",
  "electrical-switch_single": "electrical",
  "electrical-switch_3way": "electrical",
  "electrical-switch_dimmer": "electrical",
  "electrical-switch_occupancy": "electrical",
  "electrical-light_fixture": "electrical",
  "electrical-panel": "electrical",
  "electrical-junction_box": "electrical",
  "electrical-conduit": "electrical",
  "electrical-wire": "electrical",
  "electrical-exit_sign": "electrical",
  "electrical-emergency_light": "electrical",
  "electrical-disconnect": "electrical",
  "electrical-smoke_detector": "fire_alarm",
  "electrical-pull_station": "fire_alarm",
  "electrical-horn_strobe": "fire_alarm",
  // MEP plumbing sub_type mappings
  "plumbing-lavatory": "plumbing",
  "plumbing-water_closet": "plumbing",
  "plumbing-urinal": "plumbing",
  "plumbing-floor_drain": "plumbing",
  "plumbing-floor_sink": "plumbing",
  "plumbing-mop_sink": "plumbing",
  "plumbing-hand_sink": "plumbing",
  "plumbing-three_comp_sink": "plumbing",
  "plumbing-prep_sink": "plumbing",
  "plumbing-grease_trap": "plumbing",
  "plumbing-water_heater": "plumbing",
  "plumbing-backflow_preventer": "plumbing",
  "plumbing-hose_bibb": "plumbing",
  "plumbing-cleanout": "plumbing",
  "plumbing-valve_gate": "plumbing",
  "plumbing-valve_ball": "plumbing",
  "plumbing-valve_check": "plumbing",
  "plumbing-prv": "plumbing",
  "plumbing-mixing_valve": "plumbing",
  "plumbing-expansion_tank": "plumbing",
  "plumbing-pipe_cold_water": "plumbing",
  "plumbing-pipe_hot_water": "plumbing",
  "plumbing-pipe_waste": "plumbing",
  "plumbing-pipe_vent": "plumbing",
  "plumbing-pipe_gas": "plumbing",
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
  // MEP trades
  hvac: 0.1, // 10%
  insulation: 0.15, // 15%
  fire_alarm: 0.05, // 5%
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
  // MEP mechanical keywords
  if (
    lower.includes("diffuser") ||
    lower.includes("grille") ||
    lower.includes("rtu") ||
    lower.includes("thermostat") ||
    lower.includes("damper") ||
    lower.includes("exhaust") ||
    lower.includes("kitchen_hood")
  )
    return "hvac";
  if (lower.includes("duct_insulation")) return "insulation";
  // MEP electrical keywords
  if (
    lower.includes("receptacle") ||
    lower.includes("switch") ||
    lower.includes("light_fixture") ||
    lower.includes("panel") ||
    lower.includes("junction_box") ||
    lower.includes("conduit") ||
    lower.includes("exit_sign") ||
    lower.includes("emergency_light") ||
    lower.includes("disconnect")
  )
    return "electrical";
  if (
    lower.includes("smoke_detector") ||
    lower.includes("pull_station") ||
    lower.includes("horn_strobe")
  )
    return "fire_alarm";
  // MEP plumbing keywords
  if (
    lower.includes("lavatory") ||
    lower.includes("water_closet") ||
    lower.includes("urinal") ||
    lower.includes("floor_drain") ||
    lower.includes("floor_sink") ||
    lower.includes("sink") ||
    lower.includes("grease_trap") ||
    lower.includes("water_heater") ||
    lower.includes("backflow") ||
    lower.includes("hose_bibb") ||
    lower.includes("cleanout") ||
    lower.includes("valve") ||
    lower.includes("gas")
  )
    return "plumbing";

  return "general";
}

export function getWasteFactor(trade: string): number {
  return WASTE_FACTORS[trade.toLowerCase()] || 0;
}

export function normalizeTakeoffItem(item: TakeoffItemAI) {
  const trade = inferTrade(item.category, item.sub_type);
  const wasteFactor = getWasteFactor(trade);
  const adjustedQuantity = item.quantity * (1 + wasteFactor);

  // Generate ID if OpenAI didn't provide one
  const aiItemId =
    item.id || `ai-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  return {
    ai_item_id: aiItemId,
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
