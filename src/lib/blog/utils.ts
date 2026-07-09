/** Strip HTML tags and count words for reading time. */
export function countWordsFromHtml(html: string): number {
  const text = html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!text) return 0;
  return text.split(" ").length;
}

export function computeReadingTimeMinutes(html: string): number {
  const words = countWordsFromHtml(html);
  return Math.max(1, Math.ceil(words / 200));
}

/** Start of today in UTC for idempotency checks. */
export function startOfUtcDay(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString();
}
