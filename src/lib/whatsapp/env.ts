/**
 * WhatsApp Cloud API environment accessor.
 *
 * Centralises access to the Meta WhatsApp Business Cloud API credentials.
 * All secrets are read here via the existing `requireEnv`/`optionalEnv`
 * helpers and are referenced by key name only — never logged, echoed, or
 * surfaced in error messages or the admin UI.
 */
import { optionalEnv, requireEnv } from "@/lib/config";

/** Default Graph API version used when `WHATSAPP_API_VERSION` is unset. */
export const DEFAULT_WHATSAPP_API_VERSION = "v21.0";

/** Required WhatsApp environment variable names, in documentation order. */
const REQUIRED_WHATSAPP_ENV_VARS = [
  "WHATSAPP_ACCESS_TOKEN",
  "WHATSAPP_PHONE_NUMBER_ID",
  "WHATSAPP_WABA_ID",
  "WHATSAPP_WEBHOOK_VERIFY_TOKEN",
  "WHATSAPP_APP_SECRET",
] as const;

/**
 * Error thrown when one or more required WhatsApp environment variables are
 * missing. The message lists only the missing variable *names* (never values),
 * so it is safe to surface in logs and monitoring.
 */
export class WhatsAppEnvError extends Error {
  readonly missing: string[];

  constructor(missing: string[]) {
    super(
      `Missing required WhatsApp environment variable(s): ${missing.join(", ")}`,
    );
    this.name = "WhatsAppEnvError";
    this.missing = missing;
  }
}

/** Validated WhatsApp Cloud API configuration. */
export interface WhatsAppEnv {
  /** Cloud API bearer token (secret). */
  accessToken: string;
  /** Sender phone number id. */
  phoneNumberId: string;
  /** WhatsApp Business Account id. */
  wabaId: string;
  /** GET handshake verify token (secret). */
  webhookVerifyToken: string;
  /** HMAC signing secret used to verify `X-Hub-Signature-256` (secret). */
  appSecret: string;
  /** Graph API version, defaults to {@link DEFAULT_WHATSAPP_API_VERSION}. */
  apiVersion: string;
}

/**
 * Read and validate the WhatsApp Cloud API environment.
 *
 * Collects every missing required variable and throws a single
 * {@link WhatsAppEnvError} naming all of them, so misconfiguration fails fast
 * with a complete picture rather than one variable at a time.
 *
 * @throws {WhatsAppEnvError} if any required variable is missing.
 */
export function getWhatsAppEnv(): WhatsAppEnv {
  const missing = REQUIRED_WHATSAPP_ENV_VARS.filter(
    (name) => !process.env[name],
  );

  if (missing.length > 0) {
    throw new WhatsAppEnvError([...missing]);
  }

  return {
    accessToken: requireEnv("WHATSAPP_ACCESS_TOKEN"),
    phoneNumberId: requireEnv("WHATSAPP_PHONE_NUMBER_ID"),
    wabaId: requireEnv("WHATSAPP_WABA_ID"),
    webhookVerifyToken: requireEnv("WHATSAPP_WEBHOOK_VERIFY_TOKEN"),
    appSecret: requireEnv("WHATSAPP_APP_SECRET"),
    apiVersion: optionalEnv("WHATSAPP_API_VERSION") ?? DEFAULT_WHATSAPP_API_VERSION,
  };
}
