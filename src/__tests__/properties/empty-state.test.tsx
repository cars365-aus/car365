// Feature: elite-ui-overhaul, Property 8: Empty State Display for Zero-Item Collections
// @vitest-environment jsdom

/**
 * Property Test: Empty State Display for Zero-Item Collections
 *
 * For any list/grid rendered with zero items, output SHALL contain
 * an icon element, a descriptive message, and a CTA element (button or link).
 *
 * **Validates: Requirements 12.3**
 */

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { render } from "@testing-library/react";
import { PBT_CONFIG } from "./setup";
import { EmptyState } from "@/components/empty-state";

// ─── Arbitraries ─────────────────────────────────────────────────────────────

/**
 * Generates random non-empty title strings for the empty state heading.
 */
const titleArb = fc
  .string({ minLength: 1, maxLength: 100 })
  .filter((s) => s.trim().length > 0);

/**
 * Generates random non-empty description strings for the empty state message.
 */
const descriptionArb = fc
  .string({ minLength: 1, maxLength: 200 })
  .filter((s) => s.trim().length > 0);

/**
 * Generates random CTA label strings.
 */
const actionLabelArb = fc
  .string({ minLength: 1, maxLength: 50 })
  .filter((s) => s.trim().length > 0);

/**
 * Generates random href paths for link-based CTAs.
 */
const actionHrefArb = fc.constantFrom(
  "/search",
  "/",
  "/vehicles",
  "/dashboard",
  "/settings",
  "/contact"
);

/**
 * Generates valid EmptyState props with actionHref (link CTA variant).
 */
const emptyStatePropsWithHrefArb = fc.record({
  title: titleArb,
  description: descriptionArb,
  actionLabel: actionLabelArb,
  actionHref: actionHrefArb,
});

/**
 * Generates valid EmptyState props with onAction (button CTA variant).
 */
const emptyStatePropsWithActionArb = fc.record({
  title: titleArb,
  description: descriptionArb,
  actionLabel: actionLabelArb,
});

describe("Property 8: Empty State Display for Zero-Item Collections", () => {
  it("rendered EmptyState with link CTA SHALL contain an icon, message, and CTA element for any valid props", () => {
    fc.assert(
      fc.property(emptyStatePropsWithHrefArb, (props) => {
        const { container } = render(
          <EmptyState
            title={props.title}
            description={props.description}
            actionLabel={props.actionLabel}
            actionHref={props.actionHref}
          />
        );

        // SHALL contain an icon element (svg within the icon container)
        const iconContainer = container.querySelector(
          "div.flex.h-16.w-16"
        );
        expect(iconContainer).not.toBeNull();
        const svgIcon = iconContainer?.querySelector("svg");
        expect(svgIcon).not.toBeNull();

        // SHALL contain a descriptive message (the description paragraph)
        const message = container.querySelector("p");
        expect(message).not.toBeNull();
        expect(message!.textContent).toBe(props.description);

        // SHALL contain a CTA element (link with button inside)
        const ctaLink = container.querySelector("a");
        expect(ctaLink).not.toBeNull();
        const ctaButton = ctaLink?.querySelector("button");
        expect(ctaButton).not.toBeNull();
        expect(ctaButton!.textContent).toBe(props.actionLabel);
      }),
      PBT_CONFIG
    );
  });

  it("rendered EmptyState with button CTA SHALL contain an icon, message, and CTA element for any valid props", () => {
    const onAction = () => {};

    fc.assert(
      fc.property(emptyStatePropsWithActionArb, (props) => {
        const { container } = render(
          <EmptyState
            title={props.title}
            description={props.description}
            actionLabel={props.actionLabel}
            onAction={onAction}
          />
        );

        // SHALL contain an icon element (svg within the icon container)
        const iconContainer = container.querySelector(
          "div.flex.h-16.w-16"
        );
        expect(iconContainer).not.toBeNull();
        const svgIcon = iconContainer?.querySelector("svg");
        expect(svgIcon).not.toBeNull();

        // SHALL contain a descriptive message (the description paragraph)
        const message = container.querySelector("p");
        expect(message).not.toBeNull();
        expect(message!.textContent).toBe(props.description);

        // SHALL contain a CTA element (button)
        const ctaButton = container.querySelector("button");
        expect(ctaButton).not.toBeNull();
        expect(ctaButton!.textContent).toBe(props.actionLabel);
      }),
      PBT_CONFIG
    );
  });

  it("rendered EmptyState SHALL always display a heading with the title text", () => {
    fc.assert(
      fc.property(emptyStatePropsWithHrefArb, (props) => {
        const { container } = render(
          <EmptyState
            title={props.title}
            description={props.description}
            actionLabel={props.actionLabel}
            actionHref={props.actionHref}
          />
        );

        // SHALL contain a heading element with the title
        const heading = container.querySelector("h3");
        expect(heading).not.toBeNull();
        expect(heading!.textContent).toBe(props.title);
      }),
      PBT_CONFIG
    );
  });
});
