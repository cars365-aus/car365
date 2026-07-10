import { z } from "zod";
import { VEHICLE_FEATURES } from "@/lib/vehicle-badges";

// NOTE: this whole file is superseded in Phase 2 (split into vehicle/lead/content
// validation modules for the used-car pivot). WEEKDAYS was previously imported from
// the now-removed WhatsApp bot subsystem; inlined here to keep the tree compiling
// until the Phase 2 rewrite deletes the WhatsApp-bot schemas below.
const WEEKDAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

/**
 * Validates an Australian Business Number (ABN) using the ATO checksum algorithm.
 * Algorithm: Subtract 1 from first digit, multiply each digit by its weight, sum and divide by 89.
 * Weights: [10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19]
 */
export function isValidABN(abn: string): boolean {
  // Check format: 11 digits
  if (!/^\d{11}$/.test(abn)) {
    return false;
  }

  const weights = [10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19];
  const digits = abn.split("").map((d) => parseInt(d, 10));

  // Subtract 1 from the first digit
  digits[0] -= 1;

  // Calculate weighted sum
  let sum = 0;
  for (let i = 0; i < 11; i++) {
    sum += digits[i] * weights[i];
  }

  // Valid if divisible by 89
  return sum % 89 === 0;
}

export const abnSchema = z
  .string()
  .trim()
  .regex(/^\d{11}$/, "ABN must be 11 digits")
  .refine(isValidABN, "Invalid ABN checksum - please enter a valid Australian Business Number");

export const onboardingSchema = z.object({
  businessName: z.string().trim().min(2).max(160),
  abn: abnSchema,
  contactName: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(8).max(30),
  city: z.string().trim().min(2).max(80),
  state: z.string().trim().min(2).max(40),
  address: z.string().trim().min(6).max(240),
  website: z.string().url().optional().or(z.literal("")),
  acceptedAgreement: z.literal(true),
});

export const vehicleSchema = z.object({
  branchId: z.string().uuid(),
  title: z.string().trim().min(3).max(140),
  make: z.string().trim().min(2).max(80),
  model: z.string().trim().min(1).max(80),
  year: z.coerce.number().int().min(1990).max(2030),
  seats: z.coerce.number().int().min(2).max(12),
  fuel: z.enum(["Petrol", "Diesel", "Hybrid", "Electric"]),
  transmission: z.enum(["Automatic", "Manual"]),
  category: z.enum(["Sedan", "SUV", "People mover", "Van", "Ute", "Luxury"]),
  pricePerDayAud: z.coerce.number().int().min(20).max(2000),
  dailyDistanceLimitKm: z.preprocess((val) => (val === "" || val === null || val === undefined ? null : Number(val)), z.number().int().min(50).max(1000).nullable().optional()),
  extraDistanceFeeAud: z.preprocess((val) => (val === "" || val === null || val === undefined ? null : Number(val)), z.number().min(0.1).max(5.0).nullable().optional()),
  instantBook: z.boolean().default(false),
  vin: z.preprocess((val) => (val === "" || val === null || val === undefined ? null : String(val)), z.string().trim().max(100).nullable().optional()),
  licensePlate: z.preprocess((val) => (val === "" || val === null || val === undefined ? null : String(val)), z.string().trim().max(40).nullable().optional()),
  color: z.preprocess((val) => (val === "" || val === null || val === undefined ? null : String(val)), z.string().trim().max(60).nullable().optional()),
  hourlyRateAud: z.preprocess((val) => (val === "" || val === null || val === undefined ? null : Number(val)), z.number().int().min(0).max(500).nullable().optional()),
  weeklyRateAud: z.preprocess((val) => (val === "" || val === null || val === undefined ? null : Number(val)), z.number().int().min(0).max(10000).nullable().optional()),
  monthlyRateAud: z.preprocess((val) => (val === "" || val === null || val === undefined ? null : Number(val)), z.number().int().min(0).max(30000).nullable().optional()),
  weekendRateAud: z.preprocess((val) => (val === "" || val === null || val === undefined ? null : Number(val)), z.number().int().min(0).max(5000).nullable().optional()),
  notes: z.preprocess((val) => (val === "" || val === null || val === undefined ? null : String(val)), z.string().trim().max(1000).nullable().optional()),
  features: z.preprocess(
    (val) => (Array.isArray(val) ? val : val === undefined || val === null ? [] : [val]),
    z.array(z.enum(VEHICLE_FEATURES)).max(20).transform((arr) => Array.from(new Set(arr))),
  ).optional(),
  freeDelivery: z.boolean().default(false),
  freeCancellation: z.boolean().default(false),
  noHiddenFees: z.boolean().default(false),
});

export const branchSchema = z.object({
  organizationId: z.string().uuid(),
  name: z.string().trim().min(2).max(120),
  city: z.string().trim().min(2).max(80),
  state: z.string().trim().min(2).max(40),
  address: z.string().trim().min(6).max(240),
  phone: z.string().trim().min(8).max(30).optional().or(z.literal("")),
  whatsapp: z.string().trim().min(8).max(30).optional().or(z.literal("")),
});

/**
 * Admin "spin-off" form: transfer an existing branch out of its current
 * (holding) organization and into a brand-new independent vendor owned by
 * `email`. `businessName`/`abn` describe the new legal entity; `phone`/
 * `address` fall back to the branch's own details when omitted.
 */
export const transferBranchSchema = z.object({
  branchId: z.string().uuid(),
  email: z.string().trim().toLowerCase().email().max(160),
  businessName: z.string().trim().min(2).max(160),
  abn: abnSchema,
  phone: z.string().trim().min(8).max(30).optional().or(z.literal("")),
  address: z.string().trim().min(6).max(240).optional().or(z.literal("")),
  website: z.string().url().optional().or(z.literal("")),
  approveImmediately: z.boolean().optional().default(false),
});

export const leadSchema = z
  .object({
    vehicleId: z.string().uuid(),
    vendorId: z.string().uuid(),
    name: z.string().trim().min(2).max(120),
    email: z.string().trim().email().max(160),
    phone: z.string().trim().min(8).max(30),
    pickupCity: z.string().trim().min(2).max(80),
    startDate: z.string().date(),
    endDate: z.string().date(),
    message: z.string().trim().max(1000).optional().default(""),
    consent: z.literal(true),
    turnstileToken: z.string().optional(),
  })
  .refine((data) => new Date(data.endDate) >= new Date(data.startDate), {
    message: "End date must be on or after start date",
    path: ["endDate"],
  });

export const contactEventSchema = z.object({
  vehicleId: z.string().uuid(),
  vendorId: z.string().uuid(),
  channel: z.enum(["phone", "whatsapp"]),
});

export const contactMessageSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(160),
  topic: z.enum(["vendor_onboarding", "enterprise", "support", "legal_privacy"]),
  message: z.string().trim().min(10).max(2000),
  turnstileToken: z.string().optional(),
});

export const checkoutSchema = z.object({
  plan: z.enum(["starter", "growth", "pro"]),
  interval: z.enum(["monthly", "annual"]).optional(),
  organizationId: z.string().uuid(),
});

/**
 * Public API (`POST /api/v1/vehicles`) vehicle creation payload. JSON body with
 * camelCase fields. Optional fields default to the same values the route
 * previously hardcoded, preserving backward compatibility while enforcing
 * types/ranges. `branchId` ownership is verified separately against the
 * authenticated API key's organization.
 */
export const apiVehicleCreateSchema = z.object({
  branchId: z.string().uuid(),
  slug: z.string().trim().min(1).max(200).optional(),
  title: z.string().trim().min(3).max(140),
  make: z.string().trim().min(2).max(80),
  model: z.string().trim().min(1).max(80),
  year: z.coerce.number().int().min(1990).max(2030),
  seats: z.coerce.number().int().min(2).max(12).default(5),
  fuel: z.enum(["Petrol", "Diesel", "Hybrid", "Electric"]).default("Petrol"),
  transmission: z.enum(["Automatic", "Manual"]).default("Automatic"),
  category: z
    .enum(["Sedan", "SUV", "People mover", "Van", "Ute", "Luxury"])
    .default("Sedan"),
  pricePerDayAud: z.coerce.number().int().min(20).max(2000),
});

/**
 * Admin edit form for an existing blog article (auto-posted or manual).
 * Mirrors the `blog_articles` table CHECK constraints so invalid data is
 * rejected before it reaches Postgres.
 */
export const blogArticleUpdateSchema = z.object({
  title: z.string().trim().min(3).max(150),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .max(180)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase letters, numbers, and hyphens"),
  excerpt: z.string().trim().min(1).max(300),
  body: z.string().trim().min(1),
  status: z.enum(["draft", "published", "archived"]),
  categoryId: z.string().uuid().nullable().optional(),
  featuredImageUrl: z.string().trim().url().nullable().optional().or(z.literal("")),
  featuredImageAlt: z.string().trim().max(125).nullable().optional(),
  metaTitle: z.string().trim().max(70).nullable().optional(),
  metaDescription: z.string().trim().max(160).nullable().optional(),
  tags: z.array(z.string().trim().min(1).max(40)).max(20).default([]),
});

export const moderationSchema = z.object({
  resourceType: z.enum(["vendor", "branch", "vehicle", "review", "fraud_flag"]),
  resourceId: z.string().uuid(),
  action: z.enum(["approve", "reject", "suspend", "restore", "verify"]),
  reason: z.string().trim().min(3).max(500),
});

// ---------------------------------------------------------------------------
// WhatsApp auto-responder schemas
// ---------------------------------------------------------------------------

/**
 * Validates an IANA timezone identifier (e.g. "Australia/Sydney").
 * Prefers `Intl.supportedValuesOf("timeZone")` when available, falling back to
 * a `try/catch` around `Intl.DateTimeFormat` for engines that lack it.
 */
export function isValidTimezone(timezone: string): boolean {
  if (typeof timezone !== "string" || timezone.trim() === "") {
    return false;
  }

  try {
    const supported = (
      Intl as unknown as {
        supportedValuesOf?: (key: string) => string[];
      }
    ).supportedValuesOf;

    if (typeof supported === "function") {
      return supported("timeZone").includes(timezone);
    }
  } catch {
    // Fall through to the DateTimeFormat probe below.
  }

  try {
    new Intl.DateTimeFormat("en-US", { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}

/** "HH:MM" 24-hour time string, e.g. "09:00" or "17:30". */
const timeStringSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Time must be in 24-hour HH:MM format");

/** Convert a validated "HH:MM" string to minutes-of-day. */
function timeToMinutes(value: string): number {
  const [hours, mins] = value.split(":").map(Number);
  return hours * 60 + mins;
}

/**
 * Open/close times for a single weekday. Refined so that `close` is strictly
 * after `open`.
 */
export const dayHoursSchema = z
  .object({
    open: timeStringSchema,
    close: timeStringSchema,
  })
  .refine((value) => timeToMinutes(value.close) > timeToMinutes(value.open), {
    message: "Close time must be after open time",
    path: ["close"],
  });

/**
 * Inbound WhatsApp message payload, validated and sanitised before persistence.
 */
export const whatsappInboundSchema = z.object({
  messageId: z.string().min(1).max(200),
  from: z
    .string()
    .min(6)
    .max(20)
    .regex(/^\d+$/, "Sender phone must be digits only"),
  senderName: z.string().trim().max(160).optional(),
  text: z.string().max(4096).default(""),
  type: z.string().max(40).default("text"),
  timestamp: z.number().int().nonnegative(),
  interactive: z.object({
    id: z.string().max(200),
    title: z.string().max(200).optional()
  }).optional(),
});

/**
 * Admin-editable auto-responder configuration.
 */
export const autoResponderConfigSchema = z.object({
  enabled: z.boolean(),
  cooldownMinutes: z.number().int().min(0).max(1440),
  inHoursMessage: z.string().trim().min(1).max(1000),
  awayMessage: z.string().trim().min(1).max(1000),
  routingDefaultEmail: z.string().trim().email(),
  businessHours: z.object({
    timezone: z.string().refine(isValidTimezone, "Invalid IANA timezone"),
    days: z.record(z.enum(WEEKDAYS), dayHoursSchema.nullable()),
  }),
});
