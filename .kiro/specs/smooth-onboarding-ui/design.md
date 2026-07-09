# Design Document

## Overview

This document describes the architecture for converting the vendor onboarding form at `/vendor/onboarding` into a 3-step wizard. The wizard uses React client-side state to manage step navigation, per-step Zod validation on blur and on advancement, and shadcn components for visual consistency.

## Architecture

The implementation follows a client-component pattern with a shared state object. The existing server action (`submitVendorOnboarding`) remains unchanged — the wizard collects data across three steps and submits it all at once on the final step.

```
┌─────────────────────────────────────────────────────┐
│  page.tsx (Server Component — layout only)          │
│  └─ <OnboardingWizard />                            │
│       ├─ <ProgressIndicator step={current} />       │
│       ├─ <StepBusinessDetails />   (step 1)         │
│       ├─ <StepContactLocation />   (step 2)         │
│       ├─ <StepExtrasAgreement />   (step 3)         │
│       └─ Navigation buttons (Back / Next / Submit)  │
└─────────────────────────────────────────────────────┘
         │                            ▲
         │ formData on submit         │ redirect / error
         ▼                            │
┌────────────────────────────┐        │
│ actions.ts (Server Action) │────────┘
│ submitVendorOnboarding()   │
└────────────────────────────┘
```

## Components and Interfaces

### OnboardingWizard (Client Component)

The top-level `"use client"` component that owns all wizard state.

**File:** `src/app/vendor/onboarding/_components/onboarding-wizard.tsx`

```tsx
"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProgressIndicator } from "./progress-indicator";
import { StepBusinessDetails } from "./step-business-details";
import { StepContactLocation } from "./step-contact-location";
import { StepExtrasAgreement } from "./step-extras-agreement";
import { submitVendorOnboarding } from "../actions";
import { validateStep, validateAll, type FormData, type FormErrors } from "./validation";
import { toast } from "sonner";

const STEPS = [
  { label: "Business Details" },
  { label: "Contact & Location" },
  { label: "Extras & Agreement" },
] as const;

export function OnboardingWizard() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<FormData>(initialFormData());
  const [errors, setErrors] = useState<FormErrors>({});
  const [isPending, startTransition] = useTransition();

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
        await submitVendorOnboarding(fd);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Submission failed");
      }
    });
  }

  // ... render logic
}
```

### ProgressIndicator

**File:** `src/app/vendor/onboarding/_components/progress-indicator.tsx`

```tsx
import { cn } from "@/lib/utils";

interface ProgressIndicatorProps {
  currentStep: number;
  steps: readonly { label: string }[];
}

export function ProgressIndicator({ currentStep, steps }: ProgressIndicatorProps) {
  return (
    <nav aria-label="Onboarding progress">
      <ol className="flex items-center gap-2">
        {steps.map((step, index) => (
          <li
            key={step.label}
            aria-current={index === currentStep ? "step" : undefined}
            className={cn(
              "flex items-center gap-2",
              index < currentStep && "text-green-600",
              index === currentStep && "text-slate-900 font-semibold",
              index > currentStep && "text-slate-400"
            )}
          >
            <StepCircle index={index} currentStep={currentStep} />
            <span className="hidden sm:inline text-sm">{step.label}</span>
          </li>
        ))}
      </ol>
    </nav>
  );
}
```

### Step Components

Each step component receives `formData`, `errors`, `onChange`, and `onBlurValidate` props.

**File pattern:** `src/app/vendor/onboarding/_components/step-*.tsx`

```tsx
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface StepProps {
  formData: FormData;
  errors: FormErrors;
  onChange: (field: string, value: string) => void;
  onBlurValidate: (field: string) => void;
}

export function StepBusinessDetails({ formData, errors, onChange, onBlurValidate }: StepProps) {
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
```

### FormField (Shared)

**File:** `src/app/vendor/onboarding/_components/form-field.tsx`

A reusable field wrapper that connects shadcn `Label` + `Input` with error display and accessibility attributes.

```tsx
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface FormFieldProps {
  id: string;
  label: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  required?: boolean;
  type?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
}

export function FormField({ id, label, value, error, onChange, onBlur, required = true, ...props }: FormFieldProps) {
  const errorId = `${id}-error`;
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        name={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
        aria-required={required}
        {...props}
      />
      {error && (
        <p id={errorId} role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
```

## Data Models

### FormData

```typescript
interface FormData {
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
```

### FormErrors

```typescript
type FormErrors = Partial<Record<keyof FormData, string>>;
```

### Step Field Mapping

```typescript
const STEP_FIELDS: Record<number, (keyof FormData)[]> = {
  0: ["businessName", "abn"],
  1: ["contactName", "phone", "city", "state", "address"],
  2: ["website", "acceptedAgreement"],
};
```

## Interfaces

### Validation Module

**File:** `src/app/vendor/onboarding/_components/validation.ts`

```typescript
import { onboardingSchema } from "@/lib/validation/schemas";

/** Validate only the fields belonging to a given step. Returns errors for invalid fields. */
export function validateStep(step: number, data: FormData): FormErrors;

/** Validate a single field. Returns the error message or undefined. */
export function validateField(field: keyof FormData, value: unknown): string | undefined;

/** Validate the entire form. Returns all errors across all steps. */
export function validateAll(data: FormData): FormErrors;

/** Given errors, find the index of the first step that contains an error. */
export function findFirstErrorStep(errors: FormErrors): number;
```

The validation functions use Zod's `safeParse` against sub-schemas extracted from `onboardingSchema` using `pick()`. This ensures client-side validation rules stay in sync with the server-side schema.

### Step Navigation Logic

```typescript
/** Compute the next valid step index, clamped to [0, 2]. */
export function nextStep(current: number): number {
  return Math.min(current + 1, 2);
}

/** Compute the previous step index, clamped to [0, 2]. */
export function prevStep(current: number): number {
  return Math.max(current - 1, 0);
}
```

## Error Handling

| Scenario | Handling |
|----------|----------|
| Field-level validation failure | Display error message below field via `FormField` component. Set `aria-invalid` on the input. |
| Step-level validation on "Next" | Validate all fields in the current step. Block advancement and display all errors for invalid fields. |
| Full-form validation on "Submit" | Validate all fields. Navigate to the first step with an error and display all error messages. |
| Server action throws | Catch in `startTransition`, display error via `toast.error()` (sonner). |
| Network failure | Caught by the same try/catch, displayed as toast. |

## File Structure

```
src/app/vendor/onboarding/
├── page.tsx                     (Server Component — imports OnboardingWizard)
├── actions.ts                   (Existing server action — unchanged)
└── _components/
    ├── onboarding-wizard.tsx    (Client Component — wizard state & orchestration)
    ├── progress-indicator.tsx   (Progress bar with step labels)
    ├── step-business-details.tsx (Step 1 fields)
    ├── step-contact-location.tsx (Step 2 fields)
    ├── step-extras-agreement.tsx (Step 3 fields)
    ├── form-field.tsx           (Reusable Label+Input+Error wrapper)
    └── validation.ts            (Client-side Zod validation helpers)
```

## Testing Strategy

- **Unit tests (vitest + jsdom):** Verify specific rendering (e.g., correct fields per step), component integration (e.g., loading state on submit), and error scenarios (e.g., server action failure shows toast).
- **Property tests (vitest + fast-check):** Verify universal invariants listed in the Correctness Properties section — data preservation, validation gating, progress indicator state consistency, and accessibility associations across all possible input combinations.
- Tests target the validation module and component behavior through React Testing Library. The existing server action is mocked in tests.

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Step advancement with valid data

*For any* wizard step N (where N ∈ {0, 1}) and *for any* set of field values that satisfy the `onboardingSchema` constraints for that step's fields, activating the "Next" action SHALL advance the wizard to step N+1.

**Validates: Requirements 1.3, 1.4**

### Property 2: Data preservation across step transitions

*For any* set of form field values and *for any* sequence of forward and backward step transitions, all field values SHALL remain identical to their originally entered values after the transitions complete.

**Validates: Requirements 1.5, 1.6**

### Property 3: Progress indicator reflects wizard state

*For any* active step N, the progress indicator SHALL mark all steps with index < N as "completed", the step with index = N as "active" (with `aria-current="step"`), and all steps with index > N as "upcoming", each with visually distinct styling.

**Validates: Requirements 2.2, 2.3, 6.3**

### Property 4: Invalid fields display errors

*For any* form field and *for any* value that violates the field's constraint in the `onboardingSchema`, the field SHALL display an error message beneath it and be marked with `aria-invalid="true"`.

**Validates: Requirements 3.1, 3.2, 3.4**

### Property 5: Error clears when field becomes valid

*For any* form field currently displaying an error, when the value is changed to a value satisfying the `onboardingSchema` constraint for that field, the error message SHALL be removed and `aria-invalid` SHALL be unset.

**Validates: Requirements 3.3**

### Property 6: Step validation gates advancement

*For any* wizard step containing at least one field with an invalid value, activating the "Next" action SHALL NOT change the current step index, and error messages SHALL be displayed for all invalid fields in that step.

**Validates: Requirements 3.6**

### Property 7: Full-form validation gates submission

*For any* form data that fails the full `onboardingSchema` validation, activating the "Submit" action SHALL navigate the wizard to the first step containing an invalid field and SHALL NOT invoke the server action.

**Validates: Requirements 5.1, 5.2**

### Property 8: Valid form data invokes server action

*For any* form data that passes the full `onboardingSchema` validation, activating the "Submit" action SHALL invoke `submitVendorOnboarding` with a `FormData` object containing all field values.

**Validates: Requirements 5.3**

### Property 9: Accessibility associations for form fields

*For any* form field in the wizard, the `Label` component's `htmlFor` attribute SHALL match the `Input` component's `id` attribute, and when the field is in an error state its `aria-describedby` SHALL reference the error message element's `id`.

**Validates: Requirements 6.1, 6.2**
