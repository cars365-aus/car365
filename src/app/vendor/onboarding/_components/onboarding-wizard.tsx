"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ProgressIndicator } from "./progress-indicator";
import { StepBusinessDetails } from "./step-business-details";
import { StepContactLocation } from "./step-contact-location";
import { StepExtrasAgreement } from "./step-extras-agreement";
import { submitVendorOnboarding } from "../actions";
import {
  validateField,
  validateStep,
  validateAll,
  findFirstErrorStep,
  initialFormData,
  toFormDataObject,
  type FormData,
  type FormErrors,
} from "./validation";

const STEPS = [
  { label: "Business Details" },
  { label: "Contact & Location" },
  { label: "Extras & Agreement" },
] as const;

export function OnboardingWizard({ plan }: { plan?: string }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<FormData>(initialFormData());
  const [errors, setErrors] = useState<FormErrors>({});
  const [isPending, startTransition] = useTransition();

  function handleFieldChange(field: keyof FormData, value: string | boolean) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  function handleBlurValidate(field: keyof FormData) {
    const error = validateField(field, formData[field]);
    setErrors((prev) => {
      const next = { ...prev };
      if (error) {
        next[field] = error;
      } else {
        delete next[field];
      }
      return next;
    });
  }

  function handleNext() {
    const stepErrors = validateStep(currentStep, formData);
    if (Object.keys(stepErrors).length > 0) {
      setErrors((prev) => ({ ...prev, ...stepErrors }));
      return;
    }
    setCurrentStep((s) => Math.min(s + 1, 2));
  }

  function handleBack() {
    setCurrentStep((s) => Math.max(s - 1, 0));
  }

  function handleSubmit() {
    const allErrors = validateAll(formData);
    if (Object.keys(allErrors).length > 0) {
      setErrors(allErrors);
      const firstErrorStep = findFirstErrorStep(allErrors);
      setCurrentStep(firstErrorStep);
      return;
    }
    startTransition(async () => {
      try {
        const fd = toFormDataObject(formData);
        if (plan) fd.set("plan", plan);
        const result = await submitVendorOnboarding(fd);
        if (result?.error) {
          toast.error(result.error);
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Submission failed");
      }
    });
  }

  return (
    <div className="space-y-6">
      <ProgressIndicator currentStep={currentStep} steps={STEPS} />

      <Card>
        <CardHeader>
          <CardTitle>{STEPS[currentStep].label}</CardTitle>
        </CardHeader>
        <CardContent>
          {currentStep === 0 && (
            <StepBusinessDetails
              formData={formData}
              errors={errors}
              onChange={handleFieldChange}
              onBlurValidate={handleBlurValidate}
            />
          )}
          {currentStep === 1 && (
            <StepContactLocation
              formData={formData}
              errors={errors}
              onChange={handleFieldChange}
              onBlurValidate={handleBlurValidate}
            />
          )}
          {currentStep === 2 && (
            <StepExtrasAgreement
              formData={formData}
              errors={errors}
              onChange={handleFieldChange}
              onBlurValidate={handleBlurValidate}
            />
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <div>
          {currentStep > 0 && (
            <Button type="button" variant="outline" onClick={handleBack}>
              Back
            </Button>
          )}
        </div>
        <div>
          {currentStep < 2 && (
            <Button type="button" onClick={handleNext}>
              Next
            </Button>
          )}
          {currentStep === 2 && (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isPending}
            >
              {isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isPending ? "Submitting…" : "Submit"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
