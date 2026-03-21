import { z } from "zod";

// Door schedule entry
export const DoorScheduleEntrySchema = z.object({
  mark: z.string(),
  quantity: z.number().default(1),
  size: z.string().optional(),
  type: z.string().optional(),
  material: z.string().optional(),
  frame: z.string().optional(),
  hardware: z.array(z.string()).default([]),
  fireRated: z.boolean().default(false),
  remarks: z.string().optional(),
  isExisting: z.boolean().default(false),
  isRemoved: z.boolean().default(false),
});

// Finish schedule entry
export const FinishScheduleEntrySchema = z.object({
  roomName: z.string(),
  roomNumber: z.string().optional(),
  floorFinish: z.string().optional(),
  wallFinish: z.string().optional(),
  baseFinish: z.string().optional(),
  ceilingFinish: z.string().optional(),
  ceilingHeight: z.string().optional(),
  notes: z.string().optional(),
});

// Fixture schedule entry
export const FixtureScheduleEntrySchema = z.object({
  symbol: z.string().optional(),
  description: z.string(),
  manufacturer: z.string().optional(),
  catalogNumber: z.string().optional(),
  wattage: z.number().optional(),
  location: z.string().optional(),
  quantity: z.number().default(1),
  notes: z.string().optional(),
});

// Equipment schedule entry
export const EquipmentScheduleEntrySchema = z.object({
  tag: z.string(),
  description: z.string(),
  manufacturer: z.string().optional(),
  model: z.string().optional(),
  capacity: z.string().optional(),
  electrical: z.string().optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
  quantity: z.number().default(1),
});

// Panel schedule entry
export const PanelScheduleEntrySchema = z.object({
  panel: z.string(),
  voltage: z.string().optional(),
  phase: z.string().optional(),
  mainBreaker: z.number().optional(),
  totalCircuits: z.number().optional(),
  spareCircuits: z.number().optional(),
  connectedLoad: z.string().optional(),
  notes: z.string().optional(),
});

// Wrapper for all schedule types
export const ScheduleExtractionResultSchema = z.object({
  scheduleType: z.enum([
    "door",
    "finish",
    "fixture",
    "equipment",
    "panel",
    "window",
  ]),
  entries: z.array(z.record(z.unknown())),
  rawNotes: z.string().optional(),
  warnings: z.array(z.string()).optional(),
});

export type DoorScheduleEntry = z.infer<typeof DoorScheduleEntrySchema>;
export type FinishScheduleEntry = z.infer<typeof FinishScheduleEntrySchema>;
export type FixtureScheduleEntry = z.infer<typeof FixtureScheduleEntrySchema>;
export type EquipmentScheduleEntry = z.infer<
  typeof EquipmentScheduleEntrySchema
>;
export type PanelScheduleEntry = z.infer<typeof PanelScheduleEntrySchema>;
export type ScheduleExtractionResult = z.infer<
  typeof ScheduleExtractionResultSchema
>;
