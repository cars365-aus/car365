import { FormField } from "./form-field";
import type { FormData, FormErrors } from "./validation";

interface StepBusinessDetailsProps {
  formData: FormData;
  errors: FormErrors;
  onChange: (field: keyof FormData, value: string) => void;
  onBlurValidate: (field: keyof FormData) => void;
}

export function StepBusinessDetails({
  formData,
  errors,
  onChange,
  onBlurValidate,
}: StepBusinessDetailsProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <FormField
        id="businessName"
        label="Business name"
        value={formData.businessName}
        error={errors.businessName}
        onChange={(v) => onChange("businessName", v)}
        onBlur={() => onBlurValidate("businessName")}
      />
      <FormField
        id="abn"
        label="ABN"
        value={formData.abn}
        error={errors.abn}
        inputMode="numeric"
        onChange={(v) => onChange("abn", v)}
        onBlur={() => onBlurValidate("abn")}
      />
    </div>
  );
}
