/**
 * Unit tests for the WhatsApp observability + sanitization helpers.
 *
 * Covers:
 *   - sanitizeInboundText: control-char stripping, whitespace collapse, length
 *     cap, and empty input.
 *   - reportWhatsAppError: never throws even when Sentry is uninitialized, and
 *     never includes secrets in the structured fallback log (Property 8).
 *   - logProcessedMessage: emits one structured line with only safe fields.
 */
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  logProcessedMessage,
  reportWhatsAppError,
  sanitizeInboundText,
} from "@/lib/whatsapp/observability";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("sanitizeInboundText", () => {
  it("returns empty string for empty input", () => {
    expect(sanitizeInboundText("")).toBe("");
  });

  it("strips control characters and collapses whitespace", () => {
    expect(sanitizeInboundText("hello\n\tworld\u0000  again")).toBe(
      "hello world again",
    );
  });

  it("trims leading and trailing whitespace", () => {
    expect(sanitizeInboundText("   padded   ")).toBe("padded");
  });

  it("caps length at 1000 characters", () => {
    const result = sanitizeInboundText("a".repeat(5000));
    expect(result).toHaveLength(1000);
  });
});

describe("reportWhatsAppError", () => {
  it("never throws and emits a structured fallback log line", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() =>
      reportWhatsAppError(new Error("boom"), {
        stage: "process.persist",
        leadId: "lead-1",
        messageId: "wamid.1",
        variant: "in_hours",
        messageLength: 42,
      }),
    ).not.toThrow();

    expect(spy).toHaveBeenCalledTimes(1);
    const logged = spy.mock.calls[0][0] as string;
    expect(logged).toContain("whatsapp_error");
    expect(logged).toContain("process.persist");
    expect(logged).toContain("boom");
  });

  it("does not include secrets or full message bodies in the log", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    reportWhatsAppError(new Error("send failed"), {
      stage: "process.acknowledge",
      messageId: "wamid.2",
      errorCode: "131047",
      messageLength: 10,
    });

    const logged = spy.mock.calls[0][0] as string;
    expect(logged).not.toMatch(/ACCESS_TOKEN/i);
    expect(logged).not.toMatch(/APP_SECRET/i);
    // Only the length is recorded, never the body.
    expect(logged).toContain("\"messageLength\":10");
  });
});

describe("logProcessedMessage", () => {
  it("emits one structured line with only safe fields", () => {
    const spy = vi.spyOn(console, "info").mockImplementation(() => {});

    logProcessedMessage({
      messageId: "wamid.3",
      variant: "away",
      leadId: "lead-9",
      notified: "sent",
    });

    expect(spy).toHaveBeenCalledTimes(1);
    const logged = spy.mock.calls[0][0] as string;
    expect(logged).toContain("whatsapp_message_processed");
    expect(logged).toContain("wamid.3");
    expect(logged).toContain("away");
    expect(logged).toContain("lead-9");
    expect(logged).toContain("sent");
  });
});
