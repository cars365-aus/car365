// @vitest-environment jsdom

/**
 * Unit tests for LocationCard (Task 4.5 — Popular locations grid)
 *
 * Verifies the card renders a city image (next/image), vehicle count,
 * starting price, and links to the location page.
 *
 * Validates: Requirements 3.5
 */

import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { LocationCard } from "./location-card";

// Mock next/image to render a plain img element. The next-specific props
// (fill/priority/sizes) are stripped so they aren't forwarded to the DOM.
vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { fill, priority, sizes, ...rest } = props;
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text -- test mock for next/image
    return <img {...(rest as React.ImgHTMLAttributes<HTMLImageElement>)} />;
  },
}));

// Mock next/link to render a plain anchor
vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe("LocationCard", () => {
  const baseProps = {
    name: "Sydney",
    imageUrl: "/perth.png",
    vehicleCount: 42,
    startingPrice: 35,
    href: "/locations/sydney",
  };

  it("renders the city name", () => {
    const { container } = render(<LocationCard {...baseProps} />);
    expect(container.textContent).toContain("Sydney");
  });

  it("renders a city image with descriptive alt text", () => {
    const { container } = render(<LocationCard {...baseProps} />);
    const img = container.querySelector("img");
    expect(img).not.toBeNull();
    expect(img?.getAttribute("src")).toBe("/perth.png");
    expect(img?.getAttribute("alt")).toContain("Sydney");
  });

  it("renders the vehicle count", () => {
    const { container } = render(<LocationCard {...baseProps} />);
    expect(container.textContent).toContain("42 vehicles available");
  });

  it("renders the starting price", () => {
    const { container } = render(<LocationCard {...baseProps} />);
    expect(container.textContent).toContain("$35");
  });

  it("links to the location page", () => {
    const { container } = render(<LocationCard {...baseProps} />);
    const link = container.querySelector('a[href="/locations/sydney"]');
    expect(link).not.toBeNull();
  });

  it("shows 'coming soon' and hides the price when there are no vehicles", () => {
    const { container } = render(
      <LocationCard {...baseProps} vehicleCount={0} startingPrice={0} />
    );
    expect(container.textContent).toContain("Vehicles coming soon");
    expect(container.textContent).not.toContain("$0");
    expect(container.textContent).not.toContain("/day");
  });

  it("hides the price line when the starting price is zero even with vehicles", () => {
    const { container } = render(
      <LocationCard {...baseProps} vehicleCount={5} startingPrice={0} />
    );
    expect(container.textContent).toContain("5 vehicles available");
    expect(container.textContent).not.toContain("/day");
  });
});
