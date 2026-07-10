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
  stockId: z.string().trim().min(1).max(40),
  makeId: z.string().uuid(),
  modelId: z.string().uuid(),
  variant: z.string().trim().max(80).optional().or(z.literal("")),
  year: z.coerce.number().int().min(1980).max(currentYear + 1),
  mileageKm: z.coerce.number().int().min(0).max(1_000_000),
  fuelType: z.enum(fuelTypes),
  transmission: z.enum(transmissionTypes),
  bodyType: z.enum(bodyTypes),
  driveType: z.enum(driveTypes).optional(),
  engine: z.string().trim().max(80).optional().or(z.literal("")),
  powerKw: z.coerce.number().int().min(1).max(2000).optional(),
  seats: z.coerce.number().int().min(1).max(12).optional(),
  doors: z.coerce.number().int().min(1).max(6).optional(),
  exteriorColor: z.string().trim().max(60).optional().or(z.literal("")),
  interior: z.string().trim().max(120).optional().or(z.literal("")),
  vin: z.string().trim().length(17).optional().or(z.literal("")),
  registration: z.string().trim().max(20).optional().or(z.literal("")),
  regoExpiry: z.string().date().optional().or(z.literal("")),
  price: z.coerce.number().positive().max(100_000_000),
  weeklyEstimate: z.coerce.number().nonnegative().optional(),
  description: z.string().trim().max(3000).optional().or(z.literal("")),
  safetyRating: z.string().trim().max(80).optional().or(z.literal("")),
  warrantyText: z.string().trim().max(300).optional().or(z.literal("")),
  roadworthyIncluded: z.boolean().optional().default(false),
  financeAvailable: z.boolean().optional().default(true),
  tradeInWelcome: z.boolean().optional().default(true),
  inspectionAvailable: z.boolean().optional().default(true),
  status: z.enum(vehicleStatuses).optional().default("draft"),
  isFeatured: z.boolean().optional().default(false),
  featuredOrder: z.coerce.number().int().optional(),
  locationId: z.string().uuid().optional(),
  dealerNotes: z.string().trim().max(2000).optional().or(z.literal("")),
  seoTitle: z.string().trim().max(160).optional().or(z.literal("")),
  seoDescription: z.string().trim().max(320).optional().or(z.literal("")),
  featureIds: z.array(z.string().uuid()).optional().default([]),
});

// Update: same fields, all optional (partial patch), plus id.
export const vehicleUpdateSchema = vehicleCreateSchema.partial().extend({
  id: z.string().uuid(),
});

/**
 * One CSV import row (SRS §15.2). Everything arrives as strings; makes/models
 * are matched by slug/name server-side, so those are plain strings here rather
 * than UUIDs. Coercion is intentionally lenient; the import validator reports
 * row-level errors.
 */
export const vehicleCsvRowSchema = z.object({
  stock_id: z.string().trim().min(1),
  make: z.string().trim().min(1),
  model: z.string().trim().min(1),
  variant: z.string().trim().optional(),
  year: z.coerce.number().int().min(1980).max(currentYear + 1),
  mileage_km: z.coerce.number().int().min(0),
  fuel_type: z.enum(fuelTypes),
  transmission: z.enum(transmissionTypes),
  body_type: z.enum(bodyTypes),
  drive_type: z.enum(driveTypes).optional(),
  price: z.coerce.number().positive(),
  exterior_color: z.string().trim().optional(),
  description: z.string().trim().optional(),
});

export type VehicleCreateInput = z.infer<typeof vehicleCreateSchema>;
export type VehicleUpdateInput = z.infer<typeof vehicleUpdateSchema>;
export type VehicleCsvRow = z.infer<typeof vehicleCsvRowSchema>;
