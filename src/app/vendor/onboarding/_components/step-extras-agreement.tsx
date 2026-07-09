import { FormField } from "./form-field";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { FormData, FormErrors } from "./validation";

interface StepProps {
  formData: FormData;
  errors: FormErrors;
  onChange: (field: keyof FormData, value: string | boolean) => void;
  onBlurValidate: (field: keyof FormData) => void;
}

export function StepExtrasAgreement({
  formData,
  errors,
  onChange,
  onBlurValidate,
}: StepProps) {
  const agreementErrorId = "acceptedAgreement-error";

  return (
    <div className="grid gap-6">
      <FormField
        id="website"
        label="Website"
        value={formData.website}
        error={errors.website}
        onChange={(v) => onChange("website", v)}
        onBlur={() => onBlurValidate("website")}
        required={false}
        type="url"
      />

      <div className="grid gap-2">
        <Label htmlFor="acceptedAgreement">Vendor Agreement</Label>
        <label className="flex items-start gap-3 text-sm text-slate-600">
          <input
            id="acceptedAgreement"
            name="acceptedAgreement"
            type="checkbox"
            checked={formData.acceptedAgreement}
            onChange={(e) => onChange("acceptedAgreement", e.target.checked)}
            onBlur={() => onBlurValidate("acceptedAgreement")}
            aria-invalid={!!errors.acceptedAgreement}
            aria-describedby={
              errors.acceptedAgreement ? agreementErrorId : undefined
            }
            aria-required
            className={cn(
              "mt-1 h-5 w-5 rounded border-slate-300 text-slate-950 focus:ring-slate-950",
              errors.acceptedAgreement && "border-destructive"
            )}
          />
          <span>
            I accept the{" "}
            <a
              href="/legal/vendor-agreement"
              className="text-slate-900 underline hover:text-slate-700"
              target="_blank"
              rel="noopener noreferrer"
            >
              vendor agreement
            </a>{" "}
            and confirm all business details provided are accurate and legally
            binding.
          </span>
        </label>
        {errors.acceptedAgreement && (
          <p
            id={agreementErrorId}
            role="alert"
            className="text-sm text-destructive"
          >
            {errors.acceptedAgreement}
          </p>
        )}
      </div>
    </div>
  );
}
