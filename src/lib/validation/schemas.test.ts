import { describe, expect, it } from "vitest";
import {
  autoResponderConfigSchema,
  leadSchema,
  onboardingSchema,
  whatsappInboundSchema,
} from "./schemas";

describe("marketplace validation", () => {
  it("requires an 11 digit ABN and legal agreement acceptance", () => {
    expect(() =>
      onboardingSchema.parse({
        businessName: "Harbour Fleet Rentals",
        abn: "123",
        contactName: "Asha Patel",
        phone: "0400000000",
        city: "Melbourne",
        state: "VIC",
        address: "1 Collins Street",
        acceptedAgreement: true,
      }),
    ).toThrow();
  });

  it("rejects lead submissions without consent", () => {
    expect(() =>
      leadSchema.parse({
        vehicleId: "11111111-1111-4111-8111-111111111111",
        vendorId: "22222222-2222-4222-8222-222222222222",
        name: "Jordan Lee",
        email: "jordan@example.com",
        phone: "0412345678",
        pickupCity: "Sydney",
        startDate: "2026-07-01",
        endDate: "2026-07-05",
        consent: false,
      }),
    ).toThrow();
  });
});

describe("whatsappInboundSchema", () => {
  const validInbound = {
    messageId: "wamid.HBgLMTIzNDU2Nzg5MA==",
    from: "447911123456",
    senderName: "Jordan Lee",
    text: "Hi, is the Tesla available next week?",
    type: "text",
    timestamp: 1717000000,
  };

  it("accepts a well-formed inbound message", () => {
    const parsed = whatsappInboundSchema.parse(validInbound);
    expect(parsed.from).toBe("447911123456");
    expect(parsed.text).toBe("Hi, is the Tesla available next week?");
  });

  it("applies defaults for text and type when omitted", () => {
    const parsed = whatsappInboundSchema.parse({
      messageId: "wamid.abc",
      from: "447911123456",
      timestamp: 1717000000,
    });
    expect(parsed.text).toBe("");
    expect(parsed.type).toBe("text");
  });

  it("rejects a non-digit sender phone", () => {
    expect(() =>
      whatsappInboundSchema.parse({ ...validInbound, from: "+44 7911 123456" }),
    ).toThrow();
  });

  it("rejects an empty messageId", () => {
    expect(() => whatsappInboundSchema.parse({ ...validInbound, messageId: "" })).toThrow();
  });

  it("rejects oversized text", () => {
    expect(() =>
      whatsappInboundSchema.parse({ ...validInbound, text: "a".repeat(4097) }),
    ).toThrow();
  });

  it("rejects a negative timestamp", () => {
    expect(() => whatsappInboundSchema.parse({ ...validInbound, timestamp: -1 })).toThrow();
  });
});

describe("autoResponderConfigSchema", () => {
  const validConfig = {
    enabled: true,
    cooldownMinutes: 60,
    inHoursMessage: "Thanks for your message, we'll reply shortly.",
    awayMessage: "We're currently closed and will respond when we reopen.",
    routingDefaultEmail: "support@example.com",
    businessHours: {
      timezone: "Australia/Sydney",
      days: {
        monday: { open: "09:00", close: "17:00" },
        tuesday: { open: "09:00", close: "17:00" },
        wednesday: { open: "09:00", close: "17:00" },
        thursday: { open: "09:00", close: "17:00" },
        friday: { open: "09:00", close: "17:00" },
        saturday: null,
        sunday: null,
      },
    },
  };

  it("accepts a well-formed config", () => {
    const parsed = autoResponderConfigSchema.parse(validConfig);
    expect(parsed.businessHours.timezone).toBe("Australia/Sydney");
    expect(parsed.businessHours.days.saturday).toBeNull();
  });

  it("rejects an invalid timezone", () => {
    expect(() =>
      autoResponderConfigSchema.parse({
        ...validConfig,
        businessHours: { ...validConfig.businessHours, timezone: "Mars/Olympus" },
      }),
    ).toThrow();
  });

  it("rejects day hours where close is not after open", () => {
    expect(() =>
      autoResponderConfigSchema.parse({
        ...validConfig,
        businessHours: {
          ...validConfig.businessHours,
          days: { ...validConfig.businessHours.days, monday: { open: "17:00", close: "09:00" } },
        },
      }),
    ).toThrow();
  });

  it("rejects equal open and close times", () => {
    expect(() =>
      autoResponderConfigSchema.parse({
        ...validConfig,
        businessHours: {
          ...validConfig.businessHours,
          days: { ...validConfig.businessHours.days, monday: { open: "09:00", close: "09:00" } },
        },
      }),
    ).toThrow();
  });

  it("rejects an empty in-hours message", () => {
    expect(() =>
      autoResponderConfigSchema.parse({ ...validConfig, inHoursMessage: "   " }),
    ).toThrow();
  });

  it("rejects a cooldown above the daily maximum", () => {
    expect(() =>
      autoResponderConfigSchema.parse({ ...validConfig, cooldownMinutes: 1441 }),
    ).toThrow();
  });

  it("rejects an invalid routing email", () => {
    expect(() =>
      autoResponderConfigSchema.parse({ ...validConfig, routingDefaultEmail: "not-an-email" }),
    ).toThrow();
  });
});
