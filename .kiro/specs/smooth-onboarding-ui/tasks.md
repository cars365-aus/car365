# Implementation Plan: Smooth Onboarding UI

## Overview

Convert the single-page vendor onboarding form into a 3-step wizard with progress indicator, inline Zod validation, and shadcn components. The existing server action remains unchanged — the wizard collects data across steps and submits once on the final step.

## Tasks

- [x] 1. Create validation module and shared types
  - [x] 1.1 Create the validation helper module at `src/app/vendor/onboarding/_components/validation.ts`
    - Define `FormData` interface and `FormErrors` type
    - Define `STEP_FIELDS` mapping (step index → field keys)
    - Implement `validateField` using Zod `pick()` from `onboardingSchema`
    - Implement `validateStep` that validates all fields for a given step
    - Implement `validateAll` that validates the full form
    - Implement `findFirstErrorStep` that returns the first step index containing an error
    - Export `initialFormData()` helper returning empty defaults
    - Export `toFormDataObject()` that converts typed form data to a browser `FormData` instance
    - _Requirements: 1.2, 3.1, 3.2, 3.6, 5.1, 5.2_

  - [x]* 1.2 Write property tests for the validation module
    - **Property 1: Step advancement with valid data** — valid fields for step N produce zero errors from `validateStep`
    - **Property 6: Step validation gates advancement** — at least one invalid field for step N produces non-empty errors from `validateStep`
    - **Property 7: Full-form validation gates submission** — invalid form data from `validateAll` returns errors and `findFirstErrorStep` points to the correct step
    - **Validates: Requirements 1.3, 1.4, 3.6, 5.1, 5.2**

- [x] 2. Create the FormField component
  - [x] 2.1 Create `src/app/vendor/onboarding/_components/form-field.tsx`
    - Use shadcn `Label` and `Input` components
    - Accept `id`, `label`, `value`, `error`, `onChange`, `onBlur`, `required`, `type`, and `inputMode` props
    - Render error message in a `<p>` with `role="alert"` when error is present
    - Set `aria-invalid` on the input when error exists
    - Set `aria-describedby` pointing to the error message element id (`{id}-error`)
    - Connect `Label` `htmlFor` to `Input` `id`
    - Apply red border class (`border-destructive`) when error exists
    - _Requirements: 3.4, 4.1, 4.2, 6.1, 6.2_

- [x] 3. Create the ProgressIndicator component
  - [x] 3.1 Create `src/app/vendor/onboarding/_components/progress-indicator.tsx`
    - Accept `currentStep` (number) and `steps` (array of `{ label: string }`) props
    - Render an ordered list with step circles and labels
    - Visually distinguish completed steps (green), active step (bold/dark), and upcoming steps (muted)
    - Set `aria-current="step"` on the active step `<li>`
    - Wrap in a `<nav aria-label="Onboarding progress">`
    - Show step labels on `sm:` breakpoint and above
    - _Requirements: 2.1, 2.2, 2.3, 6.3_

- [x] 4. Create step content components
  - [x] 4.1 Create `src/app/vendor/onboarding/_components/step-business-details.tsx`
    - Render FormField for `businessName` and `abn` in a 2-column grid
    - Pass `inputMode="numeric"` for ABN field
    - Wire `onChange` and `onBlur` props for inline validation
    - _Requirements: 1.2, 3.1, 3.5, 4.1, 4.2_

  - [x] 4.2 Create `src/app/vendor/onboarding/_components/step-contact-location.tsx`
    - Render FormField for `contactName`, `phone`, `city`, `state`, `address`
    - Use 2-column grid with `address` spanning full width
    - Wire `onChange` and `onBlur` props for inline validation
    - _Requirements: 1.2, 3.1, 4.1, 4.2_

  - [x] 4.3 Create `src/app/vendor/onboarding/_components/step-extras-agreement.tsx`
    - Render FormField for `website` (optional, type="url")
    - Render checkbox for `acceptedAgreement` with vendor agreement link text
    - Show error for unchecked agreement on validation
    - Wire `onChange` and `onBlur` props
    - _Requirements: 1.2, 3.1, 4.1, 4.4_

- [x] 5. Create the OnboardingWizard orchestrator
  - [x] 5.1 Create `src/app/vendor/onboarding/_components/onboarding-wizard.tsx`
    - Mark as `"use client"`
    - Manage `currentStep`, `formData`, and `errors` state with `useState`
    - Use `useTransition` for pending submit state
    - Render `ProgressIndicator` with current step and step labels
    - Render active step component inside a shadcn `Card` (with `CardHeader` and `CardContent`)
    - Implement `handleFieldChange` to update `formData` state
    - Implement `handleBlurValidate` using `validateField` — set or clear errors on blur
    - Implement `handleNext` — call `validateStep`, block on errors, advance if clean
    - Implement `handleBack` — decrement step (data preserved in state)
    - Implement `handleSubmit` — call `validateAll`, navigate to first error step if invalid, otherwise call `submitVendorOnboarding` via `startTransition`
    - On server action error, display toast via `sonner`
    - Render shadcn `Button` for Back (step > 0), Next (step < 2), Submit (step === 2)
    - Disable Submit button and show loading indicator while `isPending`
    - _Requirements: 1.1, 1.3, 1.4, 1.5, 1.6, 3.3, 3.6, 4.3, 4.4, 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 6. Update the page server component
  - [x] 6.1 Update `src/app/vendor/onboarding/page.tsx`
    - Remove the existing inline form and `Field` component
    - Import and render `<OnboardingWizard />` inside the existing layout wrapper
    - Keep the heading and description text
    - Maintain the existing outer styling (`mx-auto max-w-3xl`, glass card container)
    - _Requirements: 1.1, 4.3, 4.5_

- [x] 7. Checkpoint — Verify wizard renders and navigates
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Integration tests and property tests
  - [x]* 8.1 Write property test for data preservation across step transitions
    - **Property 2: Data preservation across step transitions**
    - Generate arbitrary valid form data, perform forward/backward navigation sequence, assert all values unchanged
    - **Validates: Requirements 1.5, 1.6**

  - [x]* 8.2 Write property test for progress indicator state
    - **Property 3: Progress indicator reflects wizard state**
    - For any step N, verify completed/active/upcoming styling and `aria-current` attribute
    - **Validates: Requirements 2.2, 2.3, 6.3**

  - [x]* 8.3 Write property test for error display on invalid fields
    - **Property 4: Invalid fields display errors**
    - For any field with schema-violating value, assert error message shown and `aria-invalid="true"`
    - **Validates: Requirements 3.1, 3.2, 3.4**

  - [x]* 8.4 Write property test for error clearing on valid input
    - **Property 5: Error clears when field becomes valid**
    - Set invalid value, trigger blur, then set valid value, trigger blur, assert error removed
    - **Validates: Requirements 3.3**

  - [x]* 8.5 Write property test for accessibility associations
    - **Property 9: Accessibility associations for form fields**
    - For any rendered field, verify `htmlFor` matches `id` and error state links `aria-describedby`
    - **Validates: Requirements 6.1, 6.2**

  - [x]* 8.6 Write unit tests for submit flow
    - Test that valid form data calls `submitVendorOnboarding` with correct `FormData`
    - Test that server action error triggers toast notification
    - Test that submit button is disabled during pending state
    - **Validates: Requirements 5.3, 5.4, 5.5**

- [x] 9. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The existing server action (`submitVendorOnboarding`) is NOT modified — only the client-side UI changes
- shadcn components (Input, Label, Card, Button) are already available in the project

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "3.1"] },
    { "id": 1, "tasks": ["1.2", "2.1"] },
    { "id": 2, "tasks": ["4.1", "4.2", "4.3"] },
    { "id": 3, "tasks": ["5.1"] },
    { "id": 4, "tasks": ["6.1"] },
    { "id": 5, "tasks": ["8.1", "8.2", "8.3", "8.4", "8.5", "8.6"] }
  ]
}
```
