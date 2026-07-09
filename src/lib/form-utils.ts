/**
 * Mobile form helpers (Mobile Optimisation — Requirement 4.5).
 *
 * On validation failure we want to guide mobile users to the first field that
 * needs attention by scrolling it into the visible viewport and focusing it.
 * These helpers are framework-agnostic DOM utilities so they can be shared
 * across every form (enquiry widget, contact form, etc.).
 */

/**
 * Scrolls the given element into the centre of the viewport and focuses it.
 *
 * Focus is deferred a tick so that the smooth-scroll animation is not
 * interrupted on iOS Safari (which would otherwise jump instantly to the
 * focused control). `preventScroll` avoids a competing native scroll.
 */
export function scrollIntoViewAndFocus(el: HTMLElement | null): void {
  if (!el || typeof el.scrollIntoView !== "function") return;

  el.scrollIntoView({ behavior: "smooth", block: "center" });

  // Defer focus so the smooth scroll can begin first.
  const focusNow = () => {
    try {
      el.focus({ preventScroll: true });
    } catch {
      el.focus();
    }
  };

  if (typeof window !== "undefined" && typeof window.setTimeout === "function") {
    window.setTimeout(focusNow, 50);
  } else {
    focusNow();
  }
}

/**
 * Finds the first invalid form control within `form`, scrolls it into view and
 * focuses it. Returns `true` when an invalid field was found and handled.
 *
 * Relies on the native Constraint Validation API (`:invalid`) so any control
 * with `required`, `type="email"`, `min`/`max`, pattern, etc. is covered.
 */
export function focusFirstInvalidField(form: HTMLFormElement | null): boolean {
  if (!form) return false;

  let invalid: HTMLElement | null = null;
  try {
    invalid = form.querySelector<HTMLElement>(":invalid");
  } catch {
    invalid = null;
  }

  if (invalid) {
    scrollIntoViewAndFocus(invalid);
    return true;
  }
  return false;
}
