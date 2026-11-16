import { describe, it, expect } from "vitest";
import { buildMediaUrl, buildThumbnailUrl, getBodyTypeFallback } from "./media";

describe("Media URL and Thumbnail Resolution", () => {
  const supabaseUrl = "https://xyzcompany.supabase.co";

  describe("buildMediaUrl", () => {
    it("constructs standard storage URL for relative storage key", () => {
      const url = buildMediaUrl(supabaseUrl, "vehicles/photo-123.webp");
      expect(url).toBe("https://xyzcompany.supabase.co/storage/v1/object/public/media/vehicles/photo-123.webp");
    });

    it("leaves absolute HTTP and HTTPS URLs untouched", () => {
      expect(buildMediaUrl(supabaseUrl, "https://images.unsplash.com/photo-123")).toBe("https://images.unsplash.com/photo-123");
      expect(buildMediaUrl(supabaseUrl, "http://example.com/car.jpg")).toBe("http://example.com/car.jpg");
    });

    it("encodes special characters in storage key", () => {
      const url = buildMediaUrl(supabaseUrl, "vehicles/photo with space.webp");
      expect(url).toBe("https://xyzcompany.supabase.co/storage/v1/object/public/media/vehicles/photo%20with%20space.webp");
    });
  });

  describe("buildThumbnailUrl", () => {
    it("returns empty string when storageKey is missing or null", () => {
      expect(buildThumbnailUrl(supabaseUrl, null)).toBe("");
      expect(buildThumbnailUrl(supabaseUrl, undefined)).toBe("");
      expect(buildThumbnailUrl(supabaseUrl, "")).toBe("");
    });

    it("leaves absolute URLs untouched", () => {
      expect(buildThumbnailUrl(supabaseUrl, "https://images.unsplash.com/thumb")).toBe("https://images.unsplash.com/thumb");
    });

    it("resolves from explicit renditions.thumb when present", () => {
      const renditions = { thumb: "vehicles/thumbs/custom-thumb.webp" };
      const url = buildThumbnailUrl(supabaseUrl, "vehicles/custom-detail.webp", renditions);
      expect(url).toBe("https://xyzcompany.supabase.co/storage/v1/object/public/media/vehicles/thumbs/custom-thumb.webp");
    });

    it("deterministically derives thumbnail URL for new _detail.webp assets when renditions is absent", () => {
      const url = buildThumbnailUrl(supabaseUrl, "vehicles/abc-123_detail.webp");
      expect(url).toBe("https://xyzcompany.supabase.co/storage/v1/object/public/media/vehicles/thumbs/abc-123_thumb.webp");
    });

    it("gracefully falls back to full-size URL for historical legacy images", () => {
      const url = buildThumbnailUrl(supabaseUrl, "vehicles/legacy-photo-999.jpg");
      expect(url).toBe("https://xyzcompany.supabase.co/storage/v1/object/public/media/vehicles/legacy-photo-999.jpg");
    });
  });

  describe("getBodyTypeFallback", () => {
    it("returns dedicated image for known body types", () => {
      expect(getBodyTypeFallback("suv")).toContain("images.unsplash.com");
      expect(getBodyTypeFallback("sedan")).toContain("images.unsplash.com");
    });

    it("returns generic fallback when body type is unknown or null", () => {
      expect(getBodyTypeFallback(null)).toContain("images.unsplash.com");
      expect(getBodyTypeFallback(undefined)).toContain("images.unsplash.com");
    });
  });
});
