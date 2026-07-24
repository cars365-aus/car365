import { z } from "zod";

/** Vehicle admin validation (SRS §13.1 field dictionary). */

export const fuelTypes = ["petrol", "diesel", "hybrid", "phev", "electric", "lpg"] as const;
export const transmissionTypes = ["automatic", "manual", "cvt", "dct"] as const;
export const bodyTypes = [
  "sedan", "hatch", "suv", "ute", "wagon", "coupe", "convertible", "van", "people_mover",
] as const;
export const driveTypes = ["fwd", "rwd", "awd", "four_wd"] as const;
export const vehicleStatuses = ["draft", "available", "reserved", "sold", "archived"] as const;

const currentYear = new Date().getFullYear();

export const vehicleCreateSchema = z.object({
  stockId: z.string().trim().max(40).optional().or(z.literal("")),
  makeId: z.string().uuid().optional().or(z.literal("")),
  modelId: z.string().uuid().optional().or(z.literal("")),
  variant: z.string().trim().max(80).optional().or(z.literal("")),
  year: z.preprocess((v) => (v === "" ? undefined : v), z.coerce.number().int().min(1980).max(currentYear + 1).optional()),
  mileageKm: z.preprocess((v) => (v === "" ? undefined : v), z.coerce.number().int().min(0).max(1_000_000).optional()),
  fuelType: z.enum(fuelTypes).optional().or(z.literal("")),
  transmission: z.enum(transmissionTypes).optional().or(z.literal("")),
  bodyType: z.enum(bodyTypes).optional().or(z.literal("")),
  driveType: z.enum(driveTypes).optional().or(z.literal("")),
  engine: z.string().trim().max(80).optional().or(z.literal("")),
  powerKw: z.preprocess((v) => (v === "" ? undefined : v), z.coerce.number().int().min(1).max(2000).optional()),
  seats: z.preprocess((v) => (v === "" ? undefined : v), z.coerce.number().int().min(1).max(12).optional()),
  doors: z.preprocess((v) => (v === "" ? undefined : v), z.coerce.number().int().min(1).max(6).optional()),
  exteriorColor: z.string().trim().max(60).optional().or(z.literal("")),
  interior: z.string().trim().max(120).optional().or(z.literal("")),
  vin: z.string().trim().length(17).optional().or(z.literal("")),
  registration: z.string().trim().max(20).optional().or(z.literal("")),
  regoExpiry: z.string().date().optional().or(z.literal("")),
  price: z.preprocess((v) => (v === "" ? undefined : v), z.coerce.number().positive().max(100_000_000).optional()),
  weeklyEstimate: z.preprocess((v) => (v === "" ? undefined : v), z.coerce.number().nonnegative().optional()),
  description: z.string().trim().max(3000).optional().or(z.literal("")),
  safetyRating: z.string().trim().max(80).optional().or(z.literal("")),
  warrantyText: z.string().trim().max(300).optional().or(z.literal("")),
  roadworthyIncluded: z.boolean().optional().default(false),
  financeAvailable: z.boolean().optional().default(true),
  tradeInWelcome: z.boolean().optional().default(true),
  inspectionAvailable: z.boolean().optional().default(true),
  status: z.enum(vehicleStatuses).optional().default("draft"),
  isFeatured: z.boolean().optional().default(false),
  featuredOrder: z.preprocess((v) => (v === "" ? undefined : v), z.coerce.number().int().optional()),
  locationId: z.string().uuid().optional(),
  dealerNotes: z.string().trim().max(2000).optional().or(z.literal("")),
  featureIds: z.array(z.string().uuid()).optional().default([]),
});

// Update: same fields, all optional (partial patch), plus id.
export const vehicleUpdateSchema = vehicleCreateSchema.partial().extend({
  id: z.string().uuid(),
});

const mapEnum = (val: any, validValues: readonly string[], mappings: Record<string, string> = {}) => {
  if (typeof val !== "string") return undefined;
  const s = val.toLowerCase().trim();
  if (!s) return undefined;
  if (validValues.includes(s as any)) return s;
  for (const [key, mappedValue] of Object.entries(mappings)) {
    if (s.includes(key)) return mappedValue;
  }
  return undefined;
};

const safeNum = (v: any) => {
  if (v === "" || v === undefined || v === null) return undefined;
  const n = Number(v);
  return isNaN(n) ? undefined : n;
};

/**
 * One CSV import row (SRS §15.2). Everything arrives as strings; makes/models
 * are matched by slug/name server-side, so those are plain strings here rather
 * than UUIDs. Coercion is intentionally lenient; the import validator reports
 * row-level errors.
 */
export const vehicleCsvRowSchema = z.object({
  stock_id: z.string().trim().optional(),
  make: z.string().trim().optional().or(z.literal("")),
  model: z.string().trim().optional().or(z.literal("")),
  variant: z.string().trim().optional(),
  year: z.preprocess(safeNum, z.number().int().min(1980).max(currentYear + 1).optional()),
  mileage_km: z.preprocess(safeNum, z.number().int().min(0).optional()),
  fuel_type: z.preprocess((v) => mapEnum(v, fuelTypes), z.enum(fuelTypes).optional()),
  transmission: z.preprocess((v) => mapEnum(v, transmissionTypes, { "auto": "automatic", "speed a": "automatic", "speed m": "manual" }), z.enum(transmissionTypes).optional()),
  body_type: z.preprocess((v) => mapEnum(v, bodyTypes, { "van": "van", "wagon": "wagon", "station": "wagon", "ute": "ute", "utility": "ute", "hatchback": "hatch" }), z.enum(bodyTypes).optional()),
  drive_type: z.preprocess((v) => mapEnum(v, driveTypes, { "4wd": "four_wd", "4x4": "four_wd" }), z.enum(driveTypes).optional()),
  price: z.preprocess(safeNum, z.number().positive().optional()),
  exterior_color: z.string().trim().optional(),
  description: z.string().trim().optional(),
  engine: z.string().trim().optional(),
  power_kw: z.preprocess(safeNum, z.number().int().optional()),
  seats: z.preprocess(safeNum, z.number().int().optional()),
  doors: z.preprocess(safeNum, z.number().int().optional()),
  interior: z.string().trim().optional(),
  vin: z.string().trim().optional(),
  registration: z.string().trim().optional(),
  rego_expiry: z.string().trim().optional(),
  weekly_estimate: z.preprocess(safeNum, z.number().nonnegative().optional()),
  safety_rating: z.string().trim().optional(),
  warranty_text: z.string().trim().optional(),
  roadworthy_included: z.preprocess((val) => val === true || val === "true" || val === "TRUE" || val === 1 || val === "1", z.boolean()).optional(),
  finance_available: z.preprocess((val) => val === true || val === "true" || val === "TRUE" || val === 1 || val === "1", z.boolean()).optional(),
  trade_in_welcome: z.preprocess((val) => val === true || val === "true" || val === "TRUE" || val === 1 || val === "1", z.boolean()).optional(),
  inspection_available: z.preprocess((val) => val === true || val === "true" || val === "TRUE" || val === 1 || val === "1", z.boolean()).optional(),
  dealer_notes: z.string().trim().optional(),
});

export type VehicleCreateInput = z.infer<typeof vehicleCreateSchema>;
export type VehicleUpdateInput = z.infer<typeof vehicleUpdateSchema>;
export type VehicleCsvRow = z.infer<typeof vehicleCsvRowSchema>;
