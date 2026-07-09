import { describe, it, expect } from "vitest";
import { sanitizeBlogHtml } from "@/lib/blog/sanitize-html";

describe("sanitizeBlogHtml", () => {
  it("strips script tags", () => {
    const input = '<p>Hello</p><script>alert("x")</script>';
    expect(sanitizeBlogHtml(input)).toBe("<p>Hello</p>");
  });

  it("allows safe internal links", () => {
    const input = '<p>See <a href="/search">cars</a></p>';
    expect(sanitizeBlogHtml(input)).toContain('href="/search"');
  });

  it("blocks external javascript links", () => {
    const input = '<a href="javascript:alert(1)">bad</a>';
    expect(sanitizeBlogHtml(input)).not.toContain("javascript:");
  });

  it("blocks external hrefs", () => {
    const input = '<a href="https://evil.com">bad</a>';
    const out = sanitizeBlogHtml(input);
    expect(out).not.toContain("evil.com");
  });
});
