import { z } from "zod";

// MEP discipline type
export type MepDiscipline = "mechanical" | "electrical" | "plumbing";

// Mechanical item types
export const MechanicalItemSchema = z.object({
  itemType: z.enum([
    "ductwork",
    "flex_duct",
    "diffuser",
    "grille",
    "return_air",
    "exhaust_fan",
    "rtu",
    "split_system",
    "thermostat",
    "fire_damper",
    "smoke_damper",
    "kitchen_hood",
    "duct_insulation",
  ]),
  description: z.string(),
  size: z.string().optional(),
  capacity: z.string().optional(), // CFM, tonnage, BTU
  quantity: z.number(),
  unit: z.string(), // EA, LF, SF
  specifications: z.record(z.string()).optional(),
});

// Electrical item types
export const ElectricalItemSchema = z.object({
  itemType: z.enum([
    "receptacle_duplex",
    "receptacle_gfi",
    "receptacle_wp",
    "receptacle_dedicated",
    "receptacle_220v",
    "switch_single",
    "switch_3way",
    "switch_dimmer",
    "switch_occupancy",
    "light_fixture",
    "panel",
    "junction_box",
    "exit_sign",
    "emergency_light",
    "smoke_detector",
    "pull_station",
    "horn_strobe",
    "disconnect",
    "conduit",
    "wire",
  ]),
  description: z.string(),
  size: z.string().optional(),
  circuit: z.string().optional(),
  panel: z.string().optional(),
  quantity: z.number(),
  unit: z.string(),
  specifications: z.record(z.string()).optional(),
});

// Plumbing item types
export const PlumbingItemSchema = z.object({
  itemType: z.enum([
    "lavatory",
    "water_closet",
    "urinal",
    "floor_drain",
    "floor_sink",
    "mop_sink",
    "hand_sink",
    "three_comp_sink",
    "prep_sink",
    "grease_trap",
    "water_heater",
    "backflow_preventer",
    "hose_bibb",
    "cleanout",
    "valve_gate",
    "valve_ball",
    "valve_check",
    "prv",
    "mixing_valve",
    "expansion_tank",
    "pipe_cold_water",
    "pipe_hot_water",
    "pipe_waste",
    "pipe_vent",
    "pipe_gas",
  ]),
  description: z.string(),
  size: z.string().optional(),
  material: z.string().optional(),
  quantity: z.number(),
  unit: z.string(),
  specifications: z.record(z.string()).optional(),
});

export type MechanicalItem = z.infer<typeof MechanicalItemSchema>;
export type ElectricalItem = z.infer<typeof ElectricalItemSchema>;
export type PlumbingItem = z.infer<typeof PlumbingItemSchema>;
