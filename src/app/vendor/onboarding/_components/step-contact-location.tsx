import { FormField } from "./form-field";
import type { FormData, FormErrors } from "./validation";

interface StepProps {
  formData: FormData;
  errors: FormErrors;
  onChange: (field: keyof FormData, value: string) => void;
  onBlurValidate: (field: keyof FormData) => void;
}

export function StepContactLocation({
  formData,
  errors,
  onChange,
  onBlurValidate,
}: StepProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <FormField
        id="contactName"
        label="Contact name"
        value={formData.contactName}
        error={errors.contactName}
        autoComplete="name"
        onChange={(v) => onChange("contactName", v)}
        onBlur={() => onBlurValidate("contactName")}
      />
      <FormField
        id="phone"
        label="Phone"
        value={formData.phone}
        error={errors.phone}
        inputMode="tel"
        type="tel"
        autoComplete="tel"
        onChange={(v) => onChange("phone", v)}
        onBlur={() => onBlurValidate("phone")}
      />
      <FormField
        id="city"
        label="City"
        value={formData.city}
        error={errors.city}
        autoComplete="address-level2"
        onChange={(v) => onChange("city", v)}
        onBlur={() => onBlurValidate("city")}
      />
      <FormField
        id="state"
        label="State"
        value={formData.state}
        error={errors.state}
        autoComplete="address-level1"
        onChange={(v) => onChange("state", v)}
        onBlur={() => onBlurValidate("state")}
      />
      <div className="md:col-span-2">
        <FormField
          id="address"
          label="Address"
          value={formData.address}
          error={errors.address}
          autoComplete="street-address"
          onChange={(v) => onChange("address", v)}
          onBlur={() => onBlurValidate("address")}
        />
      </div>
    </div>
  );
}
