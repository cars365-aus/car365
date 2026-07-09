import { describe, expect, it } from "vitest";
import {
  FormData,
  FormErrors,
  STEP_FIELDS,
  validateField,
  validateStep,
  validateAll,
  findFirstErrorStep,
  initialFormData,
  toFormDataObject,
} from "./validation";

/** A valid ABN that passes checksum: 51 824 753 556 (Australian Taxation Office) */
const VALID_ABN = "51824753556";

function validFormData(): FormData {
  return {
    businessName: "Test Business",
    abn: VALID_ABN,
    contactName: "Jane Smith",
    phone: "0400000000",
    city: "Melbourne",
    state: "VIC",
    address: "123 Collins Street",
    website: "",
    acceptedAgreement: true,
  };
}

describe("validation module", () => {
  describe("STEP_FIELDS", () => {
    it("maps step 0 to businessName and abn", () => {
      expect(STEP_FIELDS[0]).toEqual(["businessName", "abn"]);
    });

    it("maps step 1 to contact and location fields", () => {
      expect(STEP_FIELDS[1]).toEqual(["contactName", "phone", "city", "state", "address"]);
    });

    it("maps step 2 to website and acceptedAgreement", () => {
      expect(STEP_FIELDS[2]).toEqual(["website", "acceptedAgreement"]);
    });
  });

  describe("validateField", () => {
    it("returns undefined for a valid field", () => {
      expect(validateField("businessName", "My Business")).toBeUndefined();
    });

    it("returns error message for a field that is too short", () => {
      const error = validateField("businessName", "A");
      expect(error).toBeDefined();
      expect(typeof error).toBe("string");
    });

    it("returns error for invalid ABN format", () => {
      const error = validateField("abn", "123");
      expect(error).toBeDefined();
    });

    it("returns undefined for valid ABN", () => {
      expect(validateField("abn", VALID_ABN)).toBeUndefined();
    });

    it("returns undefined for empty website (optional field)", () => {
      expect(validateField("website", "")).toBeUndefined();
    });

    it("returns error for invalid URL in website", () => {
      const error = validateField("website", "not-a-url");
      expect(error).toBeDefined();
    });

    it("returns error when acceptedAgreement is false", () => {
      const error = validateField("acceptedAgreement", false);
      expect(error).toBeDefined();
    });

    it("returns undefined when acceptedAgreement is true", () => {
      expect(validateField("acceptedAgreement", true)).toBeUndefined();
    });
  });

  describe("validateStep", () => {
    it("returns empty errors for valid step 0 data", () => {
      const data = validFormData();
      expect(validateStep(0, data)).toEqual({});
    });

    it("returns errors for invalid step 0 data", () => {
      const data = { ...validFormData(), businessName: "", abn: "bad" };
      const errors = validateStep(0, data);
      expect(errors.businessName).toBeDefined();
      expect(errors.abn).toBeDefined();
    });

    it("returns empty errors for valid step 1 data", () => {
      const data = validFormData();
      expect(validateStep(1, data)).toEqual({});
    });

    it("returns errors for invalid step 1 data", () => {
      const data = { ...validFormData(), phone: "", city: "A" };
      const errors = validateStep(1, data);
      expect(errors.phone).toBeDefined();
      expect(errors.city).toBeDefined();
    });

    it("returns empty errors for valid step 2 data", () => {
      const data = validFormData();
      expect(validateStep(2, data)).toEqual({});
    });

    it("returns errors when agreement not accepted", () => {
      const data = { ...validFormData(), acceptedAgreement: false as unknown as true };
      const errors = validateStep(2, data);
      expect(errors.acceptedAgreement).toBeDefined();
    });

    it("returns empty object for unknown step", () => {
      expect(validateStep(99, validFormData())).toEqual({});
    });
  });

  describe("validateAll", () => {
    it("returns empty errors for fully valid data", () => {
      expect(validateAll(validFormData())).toEqual({});
    });

    it("returns errors across multiple steps", () => {
      const data = { ...validFormData(), businessName: "", phone: "1" };
      const errors = validateAll(data);
      expect(errors.businessName).toBeDefined();
      expect(errors.phone).toBeDefined();
    });
  });

  describe("findFirstErrorStep", () => {
    it("returns 0 when step 0 field has error", () => {
      const errors: FormErrors = { abn: "Invalid ABN" };
      expect(findFirstErrorStep(errors)).toBe(0);
    });

    it("returns 1 when only step 1 fields have errors", () => {
      const errors: FormErrors = { phone: "Too short" };
      expect(findFirstErrorStep(errors)).toBe(1);
    });

    it("returns 2 when only step 2 fields have errors", () => {
      const errors: FormErrors = { acceptedAgreement: "Must accept" };
      expect(findFirstErrorStep(errors)).toBe(2);
    });

    it("returns 0 when errors span multiple steps", () => {
      const errors: FormErrors = { abn: "bad", phone: "short" };
      expect(findFirstErrorStep(errors)).toBe(0);
    });

    it("returns 0 for empty errors", () => {
      expect(findFirstErrorStep({})).toBe(0);
    });
  });

  describe("initialFormData", () => {
    it("returns empty defaults", () => {
      const data = initialFormData();
      expect(data.businessName).toBe("");
      expect(data.abn).toBe("");
      expect(data.contactName).toBe("");
      expect(data.phone).toBe("");
      expect(data.city).toBe("");
      expect(data.state).toBe("");
      expect(data.address).toBe("");
      expect(data.website).toBe("");
      expect(data.acceptedAgreement).toBe(false);
    });
  });

  describe("toFormDataObject", () => {
    it("converts typed data to browser FormData", () => {
      const data = validFormData();
      const fd = toFormDataObject(data);
      expect(fd.get("businessName")).toBe("Test Business");
      expect(fd.get("abn")).toBe(VALID_ABN);
      expect(fd.get("contactName")).toBe("Jane Smith");
      expect(fd.get("phone")).toBe("0400000000");
      expect(fd.get("city")).toBe("Melbourne");
      expect(fd.get("state")).toBe("VIC");
      expect(fd.get("address")).toBe("123 Collins Street");
      expect(fd.get("website")).toBe("");
      expect(fd.get("acceptedAgreement")).toBe("on");
    });

    it("omits acceptedAgreement when false", () => {
      const data = { ...validFormData(), acceptedAgreement: false };
      const fd = toFormDataObject(data);
      expect(fd.get("acceptedAgreement")).toBeNull();
    });
  });
});
