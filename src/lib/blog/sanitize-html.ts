/** Allowed tags in AI-generated blog HTML. */
const ALLOWED_TAGS = new Set([
  "h1", "h2", "h3", "h4", "h5", "h6", "p", "ul", "ol", "li", "blockquote", "a", "strong", "b", "em", "i", "br",
  "img", "figure", "figcaption", "table", "thead", "tbody", "tfoot", "tr", "td", "th"
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
      if (!href.startsWith("/") && !href.startsWith("http://") && !href.startsWith("https://")) {
        return match.startsWith("</") ? "</a>" : "<a>";
      }
      const safeHref = href.replace(/"/g, "&quot;");
      return match.startsWith("</") ? "</a>" : `<a href="${safeHref}">`;
    }

    if (lower === "img") {
      let res = "<img";
      const safeAttrs = ["src", "alt", "width", "height", "class", "style", "srcset", "sizes"];
      let hasValidSrc = false;
      for (const attr of safeAttrs) {
        const matchStr = attrs.match(new RegExp(`\\s${attr}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, "i"));
        const val = matchStr?.[2] ?? matchStr?.[3] ?? matchStr?.[4];
        if (val) {
          if (attr === "src") {
             if (!val.startsWith("/") && !val.startsWith("http://") && !val.startsWith("https://")) {
               continue;
             }
             hasValidSrc = true;
          }
          res += ` ${attr}="${val.replace(/"/g, "&quot;")}"`;
        }
      }
      if (!hasValidSrc) return "";
      res += ">";
      return res;
    }

    if (["table", "thead", "tbody", "tfoot", "tr", "td", "th"].includes(lower)) {
      let res = `<${lower}`;
      const safeAttrs = ["colspan", "rowspan", "class", "style", "border", "cellpadding", "cellspacing", "width", "height"];
      for (const attr of safeAttrs) {
        const matchStr = attrs.match(new RegExp(`\\s${attr}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, "i"));
        const val = matchStr?.[2] ?? matchStr?.[3] ?? matchStr?.[4];
        if (val) {
          res += ` ${attr}="${val.replace(/"/g, "&quot;")}"`;
        }
      }
      res += ">";
      return match.startsWith("</") ? `</${lower}>` : res;
    }

    // Keep classes for figure to support CKEditor image alignment
    if (lower === "figure") {
      let res = `<${lower}`;
      const safeAttrs = ["class", "style"];
      for (const attr of safeAttrs) {
        const matchStr = attrs.match(new RegExp(`\\s${attr}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, "i"));
        const val = matchStr?.[2] ?? matchStr?.[3] ?? matchStr?.[4];
        if (val) {
          const safeVal = val.replace(/"/g, "&quot;").replace(/[^\w\s-]/g, "");
          res += ` ${attr}="${safeVal}"`;
        }
      }
      res += ">";
      return match.startsWith("</") ? `</${lower}>` : res;
    }

    return match.startsWith("</") ? `</${lower}>` : `<${lower}>`;
  });

  return html.trim();
}
