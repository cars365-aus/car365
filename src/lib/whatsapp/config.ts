/**
 * Auto-responder configuration access.
 *
 * The auto-responder is driven by a single-row `whatsapp_auto_responder_config`
 * table. Reads happen on every inbound webhook event so configuration changes
 * apply without a redeploy (Req 7.4 hot-reload); writes come from the admin
 * console server action.
 *
 * {@link getAutoResponderConfig} maps the snake_case DB columns to the camelCase
 * {@link AutoResponderConfig} shape and falls back to typed defaults when no row
 * exists, so callers always receive a usable configuration.
 *
 * {@link updateAutoResponderConfig} validates the patch with
 * {@link autoResponderConfigSchema}, upserts the single row (id = true), and
 * records the change in `audit_logs` with the acting admin id. Secrets are never
 * read or written here, so nothing sensitive can leak into logs or the audit
 * trail.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { autoResponderConfigSchema } from "@/lib/validation/schemas";
import type { BusinessHours, DayHours, Weekday } from "@/lib/whatsapp/business-hours";

/**
 * Admin-editable auto-responder configuration in application (camelCase) shape.
 */
export interface AutoResponderConfig {
  /** Master on/off switch for sending acknowledgements. */
  enabled: boolean;
  /** Minutes to suppress repeat acknowledgements per conversation (0-1440). */
  cooldownMinutes: number;
  /** Acknowledgement text used inside business hours. */
  inHoursMessage: string;
  /** Acknowledgement text used outside business hours. */
  awayMessage: string;
  /** Per-weekday operating hours plus the IANA timezone they are expressed in. */
  businessHours: BusinessHours;
  /** Fallback notification recipient when no vendor association exists. */
  routingDefaultEmail: string;
}

/** The single-row primary key value for `whatsapp_auto_responder_config`. */
const CONFIG_ROW_ID = true;

/**
 * Resolve the default routing email from environment, mirroring the precedence
 * used by the Resend integration (`CONTACT_EMAIL_TO` → `EMAIL_FROM` → constant).
 */
function defaultRoutingEmail(): string {
  return (
    process.env.CONTACT_EMAIL_TO ??
    process.env.EMAIL_FROM ??
    "support@hirecarmarketplace.com.au"
  );
}

/** Standard Monday-Friday 09:00-17:00 trading day. */
const STANDARD_DAY: DayHours = { open: "09:00", close: "17:00" };

/**
 * Build the typed configuration used when no row exists yet. Defaults to a
 * Perth-timezone business open weekdays 09:00-17:00 and closed on weekends.
 */
function buildDefaultConfig(): AutoResponderConfig {
  const days: Record<Weekday, DayHours | null> = {
    monday: { ...STANDARD_DAY },
    tuesday: { ...STANDARD_DAY },
    wednesday: { ...STANDARD_DAY },
    thursday: { ...STANDARD_DAY },
    friday: { ...STANDARD_DAY },
    saturday: null,
    sunday: null,
  };

  return {
    enabled: true,
    cooldownMinutes: 60,
    inHoursMessage:
      "Thanks for messaging Hire Car! We've received your enquiry and a member of our team will be in touch shortly.",
    awayMessage:
      "Thanks for messaging Hire Car! We're currently closed but we've received your enquiry and will reply as soon as we're open.",
    businessHours: {
      timezone: "Australia/Perth",
      days,
    },
    routingDefaultEmail: defaultRoutingEmail(),
  };
}

/**
 * Coerce a stored `business_hours` JSON value into a {@link BusinessHours}.
 *
 * Falls back to the default business hours when the stored value is missing or
 * structurally unusable, so a malformed row never crashes the webhook path.
 */
function mapBusinessHours(raw: unknown): BusinessHours {
  const fallback = buildDefaultConfig().businessHours;

  if (!raw || typeof raw !== "object") {
    return fallback;
  }

  const value = raw as { timezone?: unknown; days?: unknown };
  const timezone =
    typeof value.timezone === "string" && value.timezone.trim() !== ""
      ? value.timezone
      : fallback.timezone;
  const days =
    value.days && typeof value.days === "object"
      ? (value.days as BusinessHours["days"])
      : fallback.days;

  return { timezone, days };
}

/**
 * Read the current auto-responder configuration.
 *
 * Reads the single `whatsapp_auto_responder_config` row via the service-role
 * client and maps snake_case columns to the camelCase {@link AutoResponderConfig}
 * shape. When no row exists (or the read fails), typed defaults are returned so
 * the caller always has a usable configuration.
 *
 * @returns the current configuration, or sensible defaults.
 */
export async function getAutoResponderConfig(): Promise<AutoResponderConfig> {
  const defaults = buildDefaultConfig();
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("whatsapp_auto_responder_config")
    .select(
      "enabled, cooldown_minutes, in_hours_message, away_message, business_hours, routing_default_email",
    )
    .eq("id", CONFIG_ROW_ID)
    .maybeSingle();

  if (error || !data) {
    return defaults;
  }

  return {
    enabled: typeof data.enabled === "boolean" ? data.enabled : defaults.enabled,
    cooldownMinutes:
      typeof data.cooldown_minutes === "number"
        ? data.cooldown_minutes
        : defaults.cooldownMinutes,
    inHoursMessage:
      typeof data.in_hours_message === "string" && data.in_hours_message.length > 0
        ? data.in_hours_message
        : defaults.inHoursMessage,
    awayMessage:
      typeof data.away_message === "string" && data.away_message.length > 0
        ? data.away_message
        : defaults.awayMessage,
    businessHours: mapBusinessHours(data.business_hours),
    routingDefaultEmail:
      typeof data.routing_default_email === "string" &&
      data.routing_default_email.length > 0
        ? data.routing_default_email
        : defaults.routingDefaultEmail,
  };
}

/**
 * Validate and persist the auto-responder configuration.
 *
 * Validates `patch` with {@link autoResponderConfigSchema}, upserts the single
 * config row (id = true) mapping camelCase fields to snake_case columns, stamps
 * `updated_at`/`updated_by`, and records the change in `audit_logs` against the
 * acting admin. New configuration applies to subsequent inbound messages without
 * a redeploy because the webhook reads the row per event.
 *
 * @param patch - The new configuration. Validated before any write.
 * @param adminId - The id of the admin performing the change (audit trail).
 * @throws when validation fails or the upsert errors.
 */
export async function updateAutoResponderConfig(
  patch: AutoResponderConfig,
  adminId: string,
): Promise<void> {
  // Validate before any write — schema is the source of truth for constraints
  // (valid timezone, close > open, non-empty messages, cooldown bounds).
  const validated = autoResponderConfigSchema.parse(patch);

  const supabase = createAdminClient();
  const updatedAt = new Date().toISOString();

  const { error: upsertError } = await supabase
    .from("whatsapp_auto_responder_config")
    .upsert(
      {
        id: CONFIG_ROW_ID,
        enabled: validated.enabled,
        cooldown_minutes: validated.cooldownMinutes,
        in_hours_message: validated.inHoursMessage,
        away_message: validated.awayMessage,
        business_hours: validated.businessHours,
        routing_default_email: validated.routingDefaultEmail,
        updated_at: updatedAt,
        updated_by: adminId,
      },
      { onConflict: "id" },
    );

  if (upsertError) {
    throw new Error(
      `Failed to update auto-responder config: ${upsertError.message}`,
    );
  }

  // Record the change in the admin audit log. The config row uses a boolean
  // primary key, so resource_id (a uuid column) is left null and identifying
  // detail is captured in metadata instead. No secrets are recorded.
  await supabase.from("audit_logs").insert({
    actor_user_id: adminId,
    action: "whatsapp_auto_responder_config_updated",
    resource_type: "whatsapp_auto_responder_config",
    metadata: {
      enabled: validated.enabled,
      cooldown_minutes: validated.cooldownMinutes,
      timezone: validated.businessHours.timezone,
      routing_default_email: validated.routingDefaultEmail,
      updated_at: updatedAt,
    },
  });
}
