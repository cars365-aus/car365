/**
 * WhatsApp helpers — phone normalisation and click-to-chat link building.
 */

/**
 * Normalise a phone number into the digits-only format wa.me expects.
 * Handles Australian local numbers (leading 0 → +61) and strips all
 * non-digit characters (spaces, dashes, parentheses, +).
 *
 * Examples:
 *   "0412 345 678"   → "61412345678"
 *   "+61 412 345 678"→ "61412345678"
 *   "02 1234 5678"   → "61212345678"
 */
export function normaliseWhatsAppNumber(raw: string): string {
  const digits = raw.replace(/\D/g, "");

  // Already has country code (61...)
  if (digits.startsWith("61")) {
    return digits;
  }

  // Australian local number starting with 0 → replace with 61
  if (digits.startsWith("0")) {
    return "61" + digits.slice(1);
  }

  // Otherwise assume it already includes a country code
  return digits;
}

/**
 * Build a wa.me click-to-chat URL with an optional pre-filled message.
 */
export function buildWhatsAppUrl(phone: string, message?: string): string {
  const number = normaliseWhatsAppNumber(phone);
  const base = `https://wa.me/${number}`;
  if (!message) return base;
  return `${base}?text=${encodeURIComponent(message)}`;
}
