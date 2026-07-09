// @vitest-environment jsdom

/**
 * Unit tests for mobile form helpers (Task 10.1 — Mobile form input optimisation).
 *
 * Verifies that on validation failure the first invalid field is scrolled into
 * view and focused, guiding mobile users to the field that needs attention.
 *
 * Validates: Requirements 4.5
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { scrollIntoViewAndFocus, focusFirstInvalidField } from "./form-utils";

describe("scrollIntoViewAndFocus", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    document.body.innerHTML = "";
  });

  it("scrolls the element into view and focuses it", () => {
    const input = document.createElement("input");
    document.body.appendChild(input);

    const scrollSpy = vi.fn();
    const focusSpy = vi.spyOn(input, "focus");
    input.scrollIntoView = scrollSpy;

    scrollIntoViewAndFocus(input);

    expect(scrollSpy).toHaveBeenCalledWith({ behavior: "smooth", block: "center" });

    // Focus is deferred so the smooth scroll can begin first.
    expect(focusSpy).not.toHaveBeenCalled();
    vi.runAllTimers();
    expect(focusSpy).toHaveBeenCalled();
  });

  it("does nothing when the element is null", () => {
    expect(() => scrollIntoViewAndFocus(null)).not.toThrow();
  });
});

describe("focusFirstInvalidField", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    document.body.innerHTML = "";
  });

  it("focuses the first invalid control in document order", () => {
    const form = document.createElement("form");
    form.innerHTML = `
      <input name="name" type="text" required value="Ada" />
      <input name="email" type="email" required value="" />
      <input name="phone" type="tel" required value="" />
    `;
    document.body.appendChild(form);

    const inputs = form.querySelectorAll("input");
    inputs.forEach((el) => {
      el.scrollIntoView = vi.fn();
    });

    // email (index 1) is the first invalid field.
    const emailFocus = vi.spyOn(inputs[1], "focus");

    const handled = focusFirstInvalidField(form);
    expect(handled).toBe(true);

    expect(inputs[1].scrollIntoView).toHaveBeenCalled();
    vi.runAllTimers();
    expect(emailFocus).toHaveBeenCalled();
  });

  it("returns false when all fields are valid", () => {
    const form = document.createElement("form");
    form.innerHTML = `
      <input name="name" type="text" required value="Ada" />
      <input name="email" type="email" required value="ada@example.com" />
    `;
    document.body.appendChild(form);

    expect(focusFirstInvalidField(form)).toBe(false);
  });

  it("returns false when the form is null", () => {
    expect(focusFirstInvalidField(null)).toBe(false);
  });
});
