import { onboardingSchema } from "@/lib/validation/schemas";

/**
 * Typed form data matching the onboarding schema fields.
 */
export interface FormData {
  businessName: string;
  abn: string;
  contactName: string;
  phone: string;
  city: string;
  state: string;
  address: string;
  website: string;
  acceptedAgreement: boolean;
}

/**
 * Partial record of field-level error messages.
 */
export type FormErrors = Partial<Record<keyof FormData, string>>;

/**
 * Maps each wizard step index to its associated field keys.
 */
export const STEP_FIELDS: Record<number, (keyof FormData)[]> = {
  0: ["businessName", "abn"],
  1: ["contactName", "phone", "city", "state", "address"],
  2: ["website", "acceptedAgreement"],
};

/**
 * Validate a single field against the onboarding schema.
 * Returns the error message string or undefined if valid.
 */
export function validateField(
  field: keyof FormData,
  value: unknown
): string | undefined {
  const subSchema = onboardingSchema.pick({ [field]: true } as Record<
    keyof FormData,
    true
  >);
  const result = subSchema.safeParse({ [field]: value });
  if (result.success) return undefined;
  const issue = result.error.issues.find((i) => i.path.includes(field));
  return issue?.message ?? result.error.issues[0]?.message;
}

/**
 * Validate all fields belonging to a given step.
 * Returns an object with error messages for each invalid field in that step.
 */
export function validateStep(step: number, data: FormData): FormErrors {
  const fields = STEP_FIELDS[step];
  if (!fields) return {};

  const pickKeys = Object.fromEntries(fields.map((f) => [f, true])) as Record<
    keyof FormData,
    true
  >;
  const subSchema = onboardingSchema.pick(pickKeys);

  const subset = Object.fromEntries(
    fields.map((f) => [f, data[f]])
  );

  const result = subSchema.safeParse(subset);
  if (result.success) return {};

  const errors: FormErrors = {};
  for (const issue of result.error.issues) {
    const fieldName = issue.path[0] as keyof FormData | undefined;
    if (fieldName && fields.includes(fieldName) && !errors[fieldName]) {
      errors[fieldName] = issue.message;
    }
  }
  return errors;
}

/**
 * Validate the entire form against the full onboarding schema.
 * Returns all errors across all steps.
 */
export function validateAll(data: FormData): FormErrors {
  const result = onboardingSchema.safeParse(data);
  if (result.success) return {};

  const errors: FormErrors = {};
  for (const issue of result.error.issues) {
    const fieldName = issue.path[0] as keyof FormData | undefined;
    if (fieldName && !errors[fieldName]) {
      errors[fieldName] = issue.message;
    }
  }
  return errors;
}

/**
 * Given a set of errors, find the index of the first step that contains an error.
 * Returns 0 if no step can be determined.
 */
export function findFirstErrorStep(errors: FormErrors): number {
  const errorFields = Object.keys(errors) as (keyof FormData)[];
  for (let step = 0; step <= 2; step++) {
    const fields = STEP_FIELDS[step];
    if (fields.some((f) => errorFields.includes(f))) {
      return step;
    }
  }
  return 0;
}

/**
 * Returns a fresh FormData object with empty defaults.
 */
export function initialFormData(): FormData {
  return {
    businessName: "",
    abn: "",
    contactName: "",
    phone: "",
    city: "",
    state: "",
    address: "",
    website: "",
    acceptedAgreement: false,
  };
}

/**
 * Converts the typed FormData object into a browser FormData instance
 * suitable for passing to the server action.
 */
export function toFormDataObject(data: FormData): globalThis.FormData {
  const fd = new globalThis.FormData();
  fd.set("businessName", data.businessName);
  fd.set("abn", data.abn);
  fd.set("contactName", data.contactName);
  fd.set("phone", data.phone);
  fd.set("city", data.city);
  fd.set("state", data.state);
  fd.set("address", data.address);
  fd.set("website", data.website);
  if (data.acceptedAgreement) {
    fd.set("acceptedAgreement", "on");
  }
  return fd;
}
