/**
 * Infers trade_specialization from vendor_name and/or task_name.
 * Pure function — safe to use on client and server.
 * vendor_name takes priority when both match.
 */

type TradeSpecialization =
  | "plumbing"
  | "hvac"
  | "drywall"
  | "electrical"
  | "concrete"
  | "glass_glazing"
  | "fire_protection"
  | "steel_work"
  | "painting"
  | "roofing"
  | "carpentry"
  | "other";

function matchTrade(text: string): TradeSpecialization | null {
  const t = text.toLowerCase();
  if (t.includes("plumb")) return "plumbing";
  if (t.includes("hvac") || t.includes("heat") || t.includes("air"))
    return "hvac";
  if (t.includes("drywall") || t.includes("dry wall")) return "drywall";
  if (t.includes("electric")) return "electrical";
  if (t.includes("concrete") || t.includes("floor")) return "concrete";
  if (t.includes("glass") || t.includes("glaz")) return "glass_glazing";
  if (t.includes("fire") || t.includes("sprinkler")) return "fire_protection";
  if (t.includes("alarm") || t.includes("security")) return "fire_protection";
  if (t.includes("steel") || t.includes("metal") || t.includes("fabricat"))
    return "steel_work";
  if (t.includes("paint")) return "painting";
  if (t.includes("roof")) return "roofing";
  if (
    t.includes("carpet") ||
    t.includes("cabinet") ||
    t.includes("wood") ||
    t.includes("carpent")
  )
    return "carpentry";
  return null;
}

export function inferTrade(
  vendorName: string | null | undefined,
  taskName: string | null | undefined,
): TradeSpecialization {
  // vendor_name takes priority
  if (vendorName) {
    const fromVendor = matchTrade(vendorName);
    if (fromVendor) return fromVendor;
  }
  if (taskName) {
    const fromTask = matchTrade(taskName);
    if (fromTask) return fromTask;
  }
  return "other";
}
