/**
 * Business-hours selection for the WhatsApp auto-responder.
 *
 * Determines whether an inbound message arrived inside the configured operating
 * hours (so the in-hours acknowledgement is used) or outside them (so the away
 * message is used). All timezone math is delegated to {@link Intl.DateTimeFormat}
 * with the configured IANA `timeZone`, which is inherently DST-correct because it
 * honours the zone's offset at the given instant.
 *
 * Every exported function is total: it never throws. An invalid timezone or an
 * unconfigured weekday resolves to the "away" variant rather than raising.
 */

/** Which acknowledgement variant to send. */
export type ReplyVariant = "in_hours" | "away";

/** Open/close times for a single weekday in 24-hour "HH:MM" format. */
export interface DayHours {
  /** Opening time, "HH:MM" 24h (e.g. "09:00"). */
  open: string;
  /** Closing time, "HH:MM" 24h (e.g. "17:30"). Must be after `open`. */
  close: string;
}

/**
 * Weekday keys. Lowercase full names matching the DB seed for
 * `whatsapp_auto_responder_config.business_hours.days`.
 */
export type Weekday =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

/**
 * Ordered list of weekday keys, Monday-first. The order is used when scanning
 * forward for the next opening time.
 */
export const WEEKDAYS: readonly Weekday[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

/** Per-weekday business hours plus the IANA timezone they are expressed in. */
export interface BusinessHours {
  /** IANA timezone identifier, e.g. "Australia/Sydney". */
  timezone: string;
  /** Open/close per weekday; `null` means the business is closed that day. */
  days: Record<Weekday, DayHours | null>;
}

/** Map of `Intl` weekday output to our lowercase weekday keys. */
const INTL_WEEKDAY_TO_KEY: Record<string, Weekday> = {
  Monday: "monday",
  Tuesday: "tuesday",
  Wednesday: "wednesday",
  Thursday: "thursday",
  Friday: "friday",
  Saturday: "saturday",
  Sunday: "sunday",
};

/** Human-friendly weekday labels for the away message. */
const WEEKDAY_LABELS: Record<Weekday, string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

/** Minutes in a day, used as the upper bound for a parsed time. */
const MINUTES_PER_DAY = 24 * 60;

/**
 * The local weekday and minutes-of-day for an instant in a given timezone.
 * `null` when the timezone is invalid or the parts could not be derived.
 */
interface LocalTime {
  weekday: Weekday;
  minutes: number;
  /** Zero-padded "HH:MM" of the local time, for display. */
  clock: string;
}

/**
 * Parse an "HH:MM" 24-hour string into minutes-of-day.
 *
 * @returns minutes in [0, 1440], or `null` when the value is malformed.
 */
function parseTimeToMinutes(value: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) {
    return null;
  }

  const hours = Number(match[1]);
  const mins = Number(match[2]);

  if (
    !Number.isInteger(hours) ||
    !Number.isInteger(mins) ||
    hours < 0 ||
    hours > 24 ||
    mins < 0 ||
    mins > 59
  ) {
    return null;
  }

  const total = hours * 60 + mins;
  return total > MINUTES_PER_DAY ? null : total;
}

/**
 * Derive the local weekday and minutes-of-day for `now` in `timezone`.
 *
 * Uses {@link Intl.DateTimeFormat} so daylight-saving offsets are applied
 * automatically. Returns `null` (rather than throwing) for an invalid timezone.
 */
function getLocalTime(now: Date, timezone: string): LocalTime | null {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      weekday: "long",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    const parts = formatter.formatToParts(now);

    let weekdayLabel: string | undefined;
    let hourStr: string | undefined;
    let minuteStr: string | undefined;

    for (const part of parts) {
      if (part.type === "weekday") {
        weekdayLabel = part.value;
      } else if (part.type === "hour") {
        hourStr = part.value;
      } else if (part.type === "minute") {
        minuteStr = part.value;
      }
    }

    if (weekdayLabel === undefined || hourStr === undefined || minuteStr === undefined) {
      return null;
    }

    const weekday = INTL_WEEKDAY_TO_KEY[weekdayLabel];
    if (!weekday) {
      return null;
    }

    // `hour12: false` can emit "24" for midnight in some engines; normalise it.
    let hours = Number(hourStr);
    if (hours === 24) {
      hours = 0;
    }
    const mins = Number(minuteStr);

    if (!Number.isInteger(hours) || !Number.isInteger(mins)) {
      return null;
    }

    const clock = `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
    return { weekday, minutes: hours * 60 + mins, clock };
  } catch {
    return null;
  }
}

/**
 * Select the acknowledgement variant for an inbound message.
 *
 * A timestamp strictly inside the day's `[open, close)` interval (evaluated in
 * the configured timezone) yields `"in_hours"`. A timestamp before open, at or
 * after close, on an unconfigured (`null`) weekday, or under an invalid
 * timezone yields `"away"`. The function is total and deterministic.
 *
 * @param now - The instant the message arrived (any timezone).
 * @param hours - The configured business hours.
 */
export function selectReplyVariant(now: Date, hours: BusinessHours): ReplyVariant {
  const local = getLocalTime(now, hours.timezone);
  if (!local) {
    return "away";
  }

  const day = hours.days?.[local.weekday] ?? null;
  if (!day) {
    return "away";
  }

  const open = parseTimeToMinutes(day.open);
  const close = parseTimeToMinutes(day.close);
  if (open === null || close === null || close <= open) {
    return "away";
  }

  return local.minutes >= open && local.minutes < close ? "in_hours" : "away";
}

/**
 * Human-readable description of the next time the business will be open,
 * for inclusion in the away message.
 *
 * Scans from `now` (in the configured timezone) up to seven days ahead for the
 * next configured opening. If the business is open later today it reports that;
 * otherwise it names the next open weekday. Returns a generic fallback when no
 * weekday is configured or the timezone is invalid.
 *
 * @param now - The instant the message arrived (any timezone).
 * @param hours - The configured business hours.
 */
export function describeNextOpen(now: Date, hours: BusinessHours): string {
  const fallback = "We'll get back to you as soon as we're open.";

  const local = getLocalTime(now, hours.timezone);
  if (!local) {
    return fallback;
  }

  const startIndex = WEEKDAYS.indexOf(local.weekday);
  if (startIndex < 0) {
    return fallback;
  }

  for (let offset = 0; offset < 7; offset += 1) {
    const weekday = WEEKDAYS[(startIndex + offset) % 7];
    const day = hours.days?.[weekday] ?? null;
    if (!day) {
      continue;
    }

    const open = parseTimeToMinutes(day.open);
    const close = parseTimeToMinutes(day.close);
    if (open === null || close === null || close <= open) {
      continue;
    }

    // Today: only valid if we are still before opening time.
    if (offset === 0) {
      if (local.minutes < open) {
        return `We're open again today at ${day.open}.`;
      }
      continue;
    }

    if (offset === 1) {
      return `We're open again tomorrow at ${day.open}.`;
    }

    return `We're open again on ${WEEKDAY_LABELS[weekday]} at ${day.open}.`;
  }

  return fallback;
}
