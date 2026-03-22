import type { ScheduleExtractionResult } from "@/lib/extraction/schedule-types";
import {
  DoorScheduleEntrySchema,
  FinishScheduleEntrySchema,
  FixtureScheduleEntrySchema,
  EquipmentScheduleEntrySchema,
} from "@/lib/extraction/schedule-types";

export interface ScheduleTakeoffItem {
  category: string;
  sub_type: string;
  trade: string;
  quantity: number;
  unit: string;
  confidence: number;
  extraction_method: string;
  needs_review: boolean;
  notes: string;
}

export function convertScheduleToTakeoffItems(
  result: ScheduleExtractionResult,
): ScheduleTakeoffItem[] {
  switch (result.scheduleType) {
    case "door":
    case "window":
      return convertDoorSchedule(result);
    case "finish":
      return convertFinishSchedule(result);
    case "fixture":
      return convertFixtureSchedule(result);
    case "equipment":
      return convertEquipmentSchedule(result);
    case "panel":
      return convertPanelSchedule(result);
    default:
      return [];
  }
}

function convertDoorSchedule(
  result: ScheduleExtractionResult,
): ScheduleTakeoffItem[] {
  const items: ScheduleTakeoffItem[] = [];
  for (const raw of result.entries) {
    try {
      const entry = DoorScheduleEntrySchema.parse(raw);
      if (entry.isRemoved) continue;
      const label = result.scheduleType === "window" ? "Window" : "Door";
      const subType = `${label} Type ${entry.mark}${entry.size ? " - " + entry.size : ""}${entry.material ? " (" + entry.material + ")" : ""}`;
      items.push({
        category: "architectural",
        sub_type: subType,
        trade: result.scheduleType === "window" ? "window" : "door",
        quantity: entry.quantity,
        unit: "EA",
        confidence: 0.9,
        extraction_method: "labeled",
        needs_review: false,
        notes: [entry.fireRated ? "Fire rated" : "", entry.remarks ?? ""]
          .filter(Boolean)
          .join("; "),
      });
    } catch {
      // skip unparseable entries
    }
  }
  return items;
}

function convertFinishSchedule(
  result: ScheduleExtractionResult,
): ScheduleTakeoffItem[] {
  const finishCounts = new Map<string, number>();
  for (const raw of result.entries) {
    try {
      const entry = FinishScheduleEntrySchema.parse(raw);
      const finishes = [
        entry.floorFinish,
        entry.wallFinish,
        entry.baseFinish,
        entry.ceilingFinish,
      ].filter(Boolean) as string[];
      for (const finish of finishes) {
        finishCounts.set(finish, (finishCounts.get(finish) ?? 0) + 1);
      }
    } catch {
      // skip unparseable entries
    }
  }
  return Array.from(finishCounts.entries()).map(([finish, roomCount]) => ({
    category: "architectural",
    sub_type: finish,
    trade: "flooring",
    quantity: roomCount,
    unit: "ROOMS",
    confidence: 0.7,
    extraction_method: "labeled",
    needs_review: true,
    notes: "Finish from schedule — verify SF with floor plan measurements",
  }));
}

function convertFixtureSchedule(
  result: ScheduleExtractionResult,
): ScheduleTakeoffItem[] {
  const items: ScheduleTakeoffItem[] = [];
  for (const raw of result.entries) {
    try {
      const entry = FixtureScheduleEntrySchema.parse(raw);
      items.push({
        category: "electrical",
        sub_type: `Fixture: ${entry.description}${entry.catalogNumber ? " (" + entry.catalogNumber + ")" : ""}`,
        trade: "electrical",
        quantity: entry.quantity,
        unit: "EA",
        confidence: 0.9,
        extraction_method: "labeled",
        needs_review: false,
        notes: [
          entry.manufacturer,
          entry.wattage ? entry.wattage + "W" : "",
          entry.location ?? "",
        ]
          .filter(Boolean)
          .join(", "),
      });
    } catch {
      // skip unparseable entries
    }
  }
  return items;
}

function convertEquipmentSchedule(
  result: ScheduleExtractionResult,
): ScheduleTakeoffItem[] {
  const items: ScheduleTakeoffItem[] = [];
  for (const raw of result.entries) {
    try {
      const entry = EquipmentScheduleEntrySchema.parse(raw);
      items.push({
        category: "mechanical",
        sub_type: `${entry.tag}: ${entry.description}${entry.capacity ? " - " + entry.capacity : ""}`,
        trade: "hvac",
        quantity: entry.quantity,
        unit: "EA",
        confidence: 0.85,
        extraction_method: "labeled",
        needs_review: false,
        notes: [
          entry.manufacturer,
          entry.model,
          entry.electrical,
          entry.location,
        ]
          .filter(Boolean)
          .join(", "),
      });
    } catch {
      // skip unparseable entries
    }
  }
  return items;
}

function convertPanelSchedule(
  result: ScheduleExtractionResult,
): ScheduleTakeoffItem[] {
  const items: ScheduleTakeoffItem[] = [];
  for (const raw of result.entries) {
    try {
      const panel = raw as {
        panel?: string;
        totalCircuits?: number;
        voltage?: string;
        notes?: string;
      };
      if (!panel.panel) continue;
      items.push({
        category: "electrical",
        sub_type: `Electrical Panel ${panel.panel}${panel.voltage ? " - " + panel.voltage : ""}`,
        trade: "electrical",
        quantity: 1,
        unit: "EA",
        confidence: 0.85,
        extraction_method: "labeled",
        needs_review: false,
        notes: panel.totalCircuits ? `${panel.totalCircuits} circuits` : "",
      });
    } catch {
      // skip unparseable entries
    }
  }
  return items;
}
