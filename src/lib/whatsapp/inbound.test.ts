import { describe, expect, it } from "vitest";

import { dedupeByMessageId, parseWebhookPayload, type ParsedInboundMessage } from "./inbound";

/**
 * Build a minimal well-formed Meta webhook payload around the given `value`
 * object (the body of a single `entry[].changes[].value`).
 */
function wrap(value: unknown) {
  return {
    object: "whatsapp_business_account",
    entry: [
      {
        id: "123456789",
        changes: [{ field: "messages", value }],
      },
    ],
  };
}

/**
 * Inbound webhook payload parsing.
 *
 * Covers well-formed text messages, referral extraction, status-only payloads,
 * malformed/garbage inputs (must never throw), and duplicate-delivery dedupe
 * supporting idempotent processing.
 *
 * **Validates: Requirements 1.6, 4.3, 10.5**
 */
describe("parseWebhookPayload", () => {
  it("parses a well-formed text message", () => {
    const payload = wrap({
      messaging_product: "whatsapp",
      metadata: { display_phone_number: "15550000000", phone_number_id: "PN1" },
      contacts: [{ profile: { name: "Jane Doe" }, wa_id: "447700900123" }],
      messages: [
        {
          id: "wamid.ABC123",
          from: "447700900123",
          timestamp: "1700000000",
          type: "text",
          text: { body: "Hi, is the van available?" },
        },
      ],
    });

    const { messages, statuses } = parseWebhookPayload(payload);

    expect(statuses).toEqual([]);
    expect(messages).toHaveLength(1);
    expect(messages[0]).toEqual<ParsedInboundMessage>({
      messageId: "wamid.ABC123",
      from: "447700900123",
      senderName: "Jane Doe",
      text: "Hi, is the van available?",
      type: "text",
      timestamp: 1700000000,
    });
  });

  it("coerces a string timestamp to a number", () => {
    const payload = wrap({
      messages: [
        { id: "wamid.T", from: "447700900123", timestamp: "1699999999", type: "text", text: { body: "hi" } },
      ],
    });

    const { messages } = parseWebhookPayload(payload);
    expect(messages[0].timestamp).toBe(1699999999);
    expect(typeof messages[0].timestamp).toBe("number");
  });

  it("uses empty text for non-text message types", () => {
    const payload = wrap({
      messages: [
        { id: "wamid.IMG", from: "447700900123", timestamp: "1700000001", type: "image", image: { id: "media1" } },
      ],
    });

    const { messages } = parseWebhookPayload(payload);
    expect(messages).toHaveLength(1);
    expect(messages[0].type).toBe("image");
    expect(messages[0].text).toBe("");
  });

  it("extracts vehicle slug and vendor id from a click-to-chat referral", () => {
    const payload = wrap({
      contacts: [{ profile: { name: "Referral User" }, wa_id: "447700900999" }],
      messages: [
        {
          id: "wamid.REF",
          from: "447700900999",
          timestamp: "1700000002",
          type: "text",
          text: { body: "I'm interested in this car" },
          referral: {
            source_url: "https://hirecar.example/cars/toyota-hiace-2022?vendor=org_42",
            source_type: "ad",
            headline: "Toyota HiAce",
          },
        },
      ],
    });

    const { messages } = parseWebhookPayload(payload);
    expect(messages).toHaveLength(1);
    expect(messages[0].referral?.vehicleSlug).toBe("toyota-hiace-2022");
    expect(messages[0].referral?.vendorId).toBe("org_42");
    expect(messages[0].referral?.raw).toMatchObject({ source_type: "ad" });
  });

  it("extracts a vehicle slug from a /vehicles/ path without query params", () => {
    const payload = wrap({
      messages: [
        {
          id: "wamid.REF2",
          from: "447700900999",
          timestamp: "1700000003",
          type: "text",
          text: { body: "hi" },
          referral: { source_url: "https://hirecar.example/vehicles/ford-transit-lwb" },
        },
      ],
    });

    const { messages } = parseWebhookPayload(payload);
    expect(messages[0].referral?.vehicleSlug).toBe("ford-transit-lwb");
    expect(messages[0].referral?.vendorId).toBeUndefined();
  });

  it("retains a referral with raw payload even when no slug/vendor is extractable", () => {
    const payload = wrap({
      messages: [
        {
          id: "wamid.REF3",
          from: "447700900999",
          timestamp: "1700000004",
          type: "text",
          text: { body: "hi" },
          referral: { source_url: "https://hirecar.example/about", source_type: "ad" },
        },
      ],
    });

    const { messages } = parseWebhookPayload(payload);
    expect(messages[0].referral).toBeDefined();
    expect(messages[0].referral?.vehicleSlug).toBeUndefined();
    expect(messages[0].referral?.raw).toMatchObject({ source_type: "ad" });
  });

  it("returns statuses populated and messages empty for a status-only payload", () => {
    const payload = wrap({
      messaging_product: "whatsapp",
      metadata: { display_phone_number: "15550000000", phone_number_id: "PN1" },
      statuses: [
        { id: "wamid.ABC123", status: "delivered", timestamp: "1700000010", recipient_id: "447700900123" },
      ],
    });

    const { messages, statuses } = parseWebhookPayload(payload);
    expect(messages).toEqual([]);
    expect(statuses).toHaveLength(1);
    expect((statuses[0] as { status: string }).status).toBe("delivered");
  });

  describe("malformed and garbage inputs never throw and return empty arrays", () => {
    const cases: Array<[string, unknown]> = [
      ["null", null],
      ["undefined", undefined],
      ["empty object", {}],
      ["number", 42],
      ["string", "not a payload"],
      ["array", [1, 2, 3]],
      ["entry not an array", { entry: "nope" }],
      ["changes wrong type", { entry: [{ changes: 123 }] }],
      ["value missing", { entry: [{ changes: [{ field: "messages" }] }] }],
      ["messages wrong type", { entry: [{ changes: [{ value: { messages: "x" } }] }] }],
      ["message entries not objects", { entry: [{ changes: [{ value: { messages: [1, "a", null] } }] }] }],
      ["message missing id", { entry: [{ changes: [{ value: { messages: [{ from: "447" }] } }] }] }],
    ];

    for (const [name, input] of cases) {
      it(`handles ${name}`, () => {
        expect(() => parseWebhookPayload(input)).not.toThrow();
        const result = parseWebhookPayload(input);
        expect(result.messages).toEqual([]);
        expect(result.statuses).toEqual([]);
      });
    }
  });

  it("skips messages lacking a stable id or sender but keeps valid ones", () => {
    const payload = wrap({
      messages: [
        { from: "447700900123", timestamp: "1", type: "text", text: { body: "no id" } },
        { id: "wamid.OK", from: "447700900123", timestamp: "2", type: "text", text: { body: "ok" } },
        { id: "wamid.NOFROM", timestamp: "3", type: "text", text: { body: "no from" } },
      ],
    });

    const { messages } = parseWebhookPayload(payload);
    expect(messages).toHaveLength(1);
    expect(messages[0].messageId).toBe("wamid.OK");
  });

  it("parses the same messageId identically across two deliveries (caller can dedupe)", () => {
    const delivery = wrap({
      contacts: [{ profile: { name: "Jane Doe" }, wa_id: "447700900123" }],
      messages: [
        { id: "wamid.DUP", from: "447700900123", timestamp: "1700000000", type: "text", text: { body: "hello" } },
      ],
    });

    const first = parseWebhookPayload(delivery).messages;
    const second = parseWebhookPayload(delivery).messages;

    expect(first).toHaveLength(1);
    expect(second).toHaveLength(1);
    // Same delivery always yields the same dedupe key.
    expect(first[0].messageId).toBe(second[0].messageId);
    expect(first[0]).toEqual(second[0]);

    // The caller dedupes on messageId across the combined deliveries.
    const deduped = dedupeByMessageId([...first, ...second]);
    expect(deduped).toHaveLength(1);
    expect(deduped[0].messageId).toBe("wamid.DUP");
  });
});

/**
 * The dedupe helper used by the caller to collapse duplicate deliveries before
 * the authoritative DB claim layer runs.
 *
 * **Validates: Requirements 10.5**
 */
describe("dedupeByMessageId", () => {
  function msg(messageId: string): ParsedInboundMessage {
    return { messageId, from: "447700900123", text: "hi", type: "text", timestamp: 1 };
  }

  it("returns an empty array unchanged", () => {
    expect(dedupeByMessageId([])).toEqual([]);
  });

  it("keeps the first occurrence and preserves order", () => {
    const result = dedupeByMessageId([msg("a"), msg("b"), msg("a"), msg("c"), msg("b")]);
    expect(result.map((m) => m.messageId)).toEqual(["a", "b", "c"]);
  });

  it("is idempotent when applied twice", () => {
    const once = dedupeByMessageId([msg("a"), msg("a"), msg("b")]);
    const twice = dedupeByMessageId(once);
    expect(twice).toEqual(once);
  });
});
