// @vitest-environment jsdom

/**
 * Unit tests for ImageWithFallback (Task 10.2 — Mobile accessibility compliance)
 *
 * Verifies that when an image fails to load, the alt text description is
 * surfaced inside the placeholder area so screen readers and sighted users
 * still get the meaning of the image.
 *
 * Validates: Requirements 12.5
 */

import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { ImageWithFallback } from "./image-with-fallback";

// Mock next/image to render a plain img element. The next-specific props
// (fill/priority/sizes) are stripped so they aren't forwarded to the DOM,
// but onError is preserved so we can simulate a load failure.
vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { fill, priority, sizes, ...rest } = props;
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text -- test mock for next/image
    return <img {...(rest as React.ImgHTMLAttributes<HTMLImageElement>)} />;
  },
}));

describe("ImageWithFallback", () => {
  const baseProps = {
    src: "/broken.jpg",
    alt: "A silver Toyota Corolla parked at the beach",
    fill: true,
    sizes: "100vw",
  } as const;

  it("renders the image normally before any error", () => {
    const { container } = render(<ImageWithFallback {...baseProps} />);
    const img = container.querySelector("img");
    expect(img).not.toBeNull();
    expect(img?.getAttribute("alt")).toBe(baseProps.alt);
    // No fallback role=img element yet
    expect(container.querySelector('[role="img"]')).toBeNull();
  });

  it("shows the alt text in the placeholder area when the image fails to load", () => {
    const { container } = render(<ImageWithFallback {...baseProps} />);
    const img = container.querySelector("img");
    expect(img).not.toBeNull();

    fireEvent.error(img!);

    const fallback = container.querySelector('[role="img"]');
    expect(fallback).not.toBeNull();
    expect(fallback?.getAttribute("aria-label")).toBe(baseProps.alt);
    expect(fallback?.textContent).toContain(baseProps.alt);
    // The actual <img> is replaced by the fallback
    expect(container.querySelector("img")).toBeNull();
  });

  it("still calls a caller-provided onError handler", () => {
    const onError = vi.fn();
    const { container } = render(
      <ImageWithFallback {...baseProps} onError={onError} />
    );
    fireEvent.error(container.querySelector("img")!);
    expect(onError).toHaveBeenCalledTimes(1);
  });

  it("renders an empty alt as a decorative placeholder without text", () => {
    const { container } = render(
      <ImageWithFallback {...baseProps} alt="" />
    );
    fireEvent.error(container.querySelector("img")!);
    const fallback = container.querySelector('[role="img"]');
    expect(fallback).not.toBeNull();
    // No descriptive text span for an intentionally empty alt
    expect(fallback?.querySelector("span")).toBeNull();
  });
});
