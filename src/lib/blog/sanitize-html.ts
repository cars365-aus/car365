/** Allowed tags in AI-generated blog HTML. */
const ALLOWED_TAGS = new Set([
  "h2", "h3", "p", "ul", "ol", "li", "blockquote", "a", "strong", "em", "br",
]);

/** Strip dangerous content from AI-generated HTML before persistence/render. */
export function sanitizeBlogHtml(raw: string): string {
  if (!raw) return "";

  let html = raw
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, "")
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/javascript:/gi, "");

  // Remove disallowed tags but keep inner text for block-level replacements
  html = html.replace(/<\/?([a-z0-9]+)([^>]*)>/gi, (match, tag: string, attrs: string) => {
    const lower = tag.toLowerCase();
    if (!ALLOWED_TAGS.has(lower)) {
      return "";
    }

    if (lower === "a") {
      const hrefMatch = attrs.match(/\shref\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i);
      const href = hrefMatch?.[2] ?? hrefMatch?.[3] ?? hrefMatch?.[4] ?? "";
      if (!href.startsWith("/") || href.startsWith("//")) {
        return match.startsWith("</") ? "</a>" : "<a>";
      }
      const safeHref = href.replace(/"/g, "&quot;");
      return match.startsWith("</") ? "</a>" : `<a href="${safeHref}">`;
    }

    return match.startsWith("</") ? `</${lower}>` : `<${lower}>`;
  });

  return html.trim();
}
