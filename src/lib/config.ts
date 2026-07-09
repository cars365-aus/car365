let warnedMissingAppUrl = false;

export function getAppUrl() {
  const url = process.env.NEXT_PUBLIC_APP_URL;

  if (!url) {
    // In production, silently using localhost breaks every absolute link in
    // emails (enquiry confirmations, chat, WhatsApp lead alerts). Warn once.
    if (process.env.NODE_ENV === "production" && !warnedMissingAppUrl) {
      warnedMissingAppUrl = true;
      console.error(
        "[config] NEXT_PUBLIC_APP_URL is not set in production. Falling back to " +
          "http://localhost:3000, which will produce broken links in emails and " +
          "redirects. Set NEXT_PUBLIC_APP_URL to your public site URL.",
      );
    }
    return "http://localhost:3000";
  }

  return url;
}

export function requireEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value.trim();
}

export function optionalEnv(name: string) {
  return process.env[name] || undefined;
}
