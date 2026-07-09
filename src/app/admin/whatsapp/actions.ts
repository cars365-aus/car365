"use server";

import { requireAdmin } from "@/lib/security/auth";
import { autoResponderConfigSchema } from "@/lib/validation/schemas";
import {
  updateAutoResponderConfig,
  type AutoResponderConfig,
} from "@/lib/whatsapp/config";
import { revalidatePath } from "next/cache";

export interface SaveConfigState {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

/**
 * Server action invoked by the admin auto-responder config form.
 *
 * Validates the admin session, parses/validates config via the Zod schema,
 * persists via `updateAutoResponderConfig`, and returns a result the client
 * can use to display success or inline validation errors.
 *
 * The `admin-bypass` id is not a valid UUID (the audit_logs.actor_user_id
 * column is uuid), so we pass `null` for the adminId in that case to avoid
 * a DB constraint violation.
 */
export async function saveAutoResponderConfig(
  _prevState: SaveConfigState,
  formData: FormData,
): Promise<SaveConfigState> {
  // Re-authenticate inside the action (never trust the caller)
  const admin = await requireAdmin();

  // Parse the form data into the expected config shape
  const raw = extractConfigFromFormData(formData);

  // Validate with Zod
  const result = autoResponderConfigSchema.safeParse(raw);
  if (!result.success) {
    return {
      success: false,
      error: "Validation failed. Please fix the highlighted fields.",
      fieldErrors: result.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const validated = result.data as AutoResponderConfig;

  // Handle non-UUID admin-bypass id safely
  const isValidUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      admin.id,
    );
  const adminId = isValidUuid ? admin.id : null;

  try {
    await updateAutoResponderConfig(validated, adminId as string);
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : "Failed to save configuration. Please try again.",
    };
  }

  revalidatePath("/admin/whatsapp");

  return { success: true };
}

/**
 * Extract the auto-responder config fields from FormData into the shape
 * expected by `autoResponderConfigSchema`.
 */
function extractConfigFromFormData(formData: FormData): unknown {
  const enabled = formData.get("enabled") === "true";
  const cooldownMinutes = Number(formData.get("cooldownMinutes") ?? 60);
  const inHoursMessage = formData.get("inHoursMessage") as string;
  const awayMessage = formData.get("awayMessage") as string;
  const routingDefaultEmail = formData.get("routingDefaultEmail") as string;
  const timezone = formData.get("timezone") as string;

  const weekdays = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ] as const;

  const days: Record<string, { open: string; close: string } | null> = {};
  for (const day of weekdays) {
    const closed = formData.get(`${day}_closed`) === "true";
    if (closed) {
      days[day] = null;
    } else {
      days[day] = {
        open: (formData.get(`${day}_open`) as string) || "09:00",
        close: (formData.get(`${day}_close`) as string) || "17:00",
      };
    }
  }

  return {
    enabled,
    cooldownMinutes,
    inHoursMessage,
    awayMessage,
    routingDefaultEmail,
    businessHours: {
      timezone,
      days,
    },
  };
}
