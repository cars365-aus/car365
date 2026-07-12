import { z } from "zod";

/** Newsletter signup (SRS §9.22, §19.2). Idempotent on email. */
export const newsletterSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(160),
  consent: z.literal(true),
  source: z.string().trim().max(80).optional(),
  // Anti-spam honeypot — accepted (any value); the route silently quarantines
  // a filled honeypot rather than returning a validation error.
  website: z.string().optional(), // honeypot
  turnstileToken: z.string().optional(),
});

export type NewsletterInput = z.infer<typeof newsletterSchema>;
