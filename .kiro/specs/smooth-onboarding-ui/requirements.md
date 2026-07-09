# Requirements Document

## Introduction

Upgrade the vendor onboarding UI from a single-page form to a multi-step wizard with a progress indicator, inline real-time validation, and shadcn component consistency. The goal is to reduce cognitive load for new vendors by breaking registration into guided steps and providing immediate feedback on input errors.

## Glossary

- **Onboarding_Wizard**: The multi-step form component that guides vendors through business registration, replacing the current single-page form at `/vendor/onboarding`.
- **Progress_Indicator**: A visual element displaying the current step number, total steps, and step labels so vendors know where they are in the flow.
- **Inline_Validation**: Client-side field validation that triggers on blur or change events, displaying error messages directly beneath the relevant input field.
- **Step**: A discrete section of the wizard containing a subset of onboarding fields. The wizard contains exactly three steps.
- **Vendor**: An authenticated user completing business registration to list vehicles on the platform.
- **Onboarding_Schema**: The existing Zod validation schema (`onboardingSchema`) defining all field constraints including ABN checksum validation.

## Requirements

### Requirement 1: Multi-Step Wizard Structure

**User Story:** As a vendor, I want the onboarding form broken into guided steps, so that I am not overwhelmed by a wall of fields.

#### Acceptance Criteria

1. WHEN the Vendor navigates to `/vendor/onboarding`, THE Onboarding_Wizard SHALL render Step 1 as the initial view.
2. THE Onboarding_Wizard SHALL divide the onboarding fields into exactly three steps: Step 1 (Business Details: businessName, abn), Step 2 (Contact & Location: contactName, phone, city, state, address), and Step 3 (Extras & Agreement: website, acceptedAgreement).
3. WHEN the Vendor completes Step 1 and activates the next action, THE Onboarding_Wizard SHALL advance to Step 2.
4. WHEN the Vendor completes Step 2 and activates the next action, THE Onboarding_Wizard SHALL advance to Step 3.
5. WHEN the Vendor activates the back action on Step 2 or Step 3, THE Onboarding_Wizard SHALL return to the previous step and preserve all previously entered field values.
6. THE Onboarding_Wizard SHALL retain all entered field data across step transitions without data loss.

### Requirement 2: Progress Indicator

**User Story:** As a vendor, I want to see where I am in the onboarding process, so that I know how much is left.

#### Acceptance Criteria

1. THE Progress_Indicator SHALL display the current step number, total step count (3), and a label for each step.
2. WHEN the Vendor advances to a new step, THE Progress_Indicator SHALL update to reflect the current active step.
3. THE Progress_Indicator SHALL visually distinguish completed steps, the active step, and upcoming steps using distinct styling.

### Requirement 3: Inline Real-Time Validation

**User Story:** As a vendor, I want to see validation errors as I fill in each field, so that I can fix mistakes before submitting.

#### Acceptance Criteria

1. WHEN the Vendor leaves a required field empty and moves focus away, THE Inline_Validation SHALL display an error message beneath that field within 300ms.
2. WHEN the Vendor enters an invalid value in a field (per Onboarding_Schema constraints), THE Inline_Validation SHALL display a descriptive error message beneath that field.
3. WHEN the Vendor corrects a field that previously showed an error, THE Inline_Validation SHALL remove the error message once the value satisfies the Onboarding_Schema constraint.
4. THE Inline_Validation SHALL apply a red border to any field currently in an error state.
5. WHEN the Vendor enters an ABN that fails the 11-digit format or checksum validation, THE Inline_Validation SHALL display a specific error message indicating the ABN is invalid.
6. WHEN the Vendor attempts to advance to the next step, THE Onboarding_Wizard SHALL validate all fields in the current step and prevent advancement if any field is invalid.

### Requirement 4: Shadcn Component Adoption

**User Story:** As a vendor, I want the onboarding form to look consistent with the rest of the portal, so that the experience feels cohesive.

#### Acceptance Criteria

1. THE Onboarding_Wizard SHALL use the shadcn Input component for all text input fields.
2. THE Onboarding_Wizard SHALL use the shadcn Label component for all field labels.
3. THE Onboarding_Wizard SHALL use the shadcn Card component as the container for each step content area.
4. THE Onboarding_Wizard SHALL use the shadcn Button component for all navigation and submission actions.
5. THE Onboarding_Wizard SHALL maintain the existing Tailwind CSS styling approach for custom layout and spacing.

### Requirement 5: Form Submission Behaviour

**User Story:** As a vendor, I want the form to submit all my data at once on the final step, so that partial submissions do not create incomplete records.

#### Acceptance Criteria

1. WHEN the Vendor activates the submit action on Step 3, THE Onboarding_Wizard SHALL validate all fields across all three steps against the Onboarding_Schema.
2. IF validation fails on submission, THEN THE Onboarding_Wizard SHALL navigate the Vendor to the first step containing an error and display Inline_Validation messages for all invalid fields.
3. WHEN all fields pass validation, THE Onboarding_Wizard SHALL invoke the existing `submitVendorOnboarding` server action with the complete form data.
4. WHILE the form submission is in progress, THE Onboarding_Wizard SHALL disable the submit button and display a loading indicator.
5. IF the server action returns an error, THEN THE Onboarding_Wizard SHALL display the error message to the Vendor using a toast notification.

### Requirement 6: Accessibility

**User Story:** As a vendor using assistive technology, I want the wizard to be navigable and understandable, so that I can complete onboarding independently.

#### Acceptance Criteria

1. THE Onboarding_Wizard SHALL associate each input field with its label using matching `htmlFor` and `id` attributes.
2. WHEN a field enters an error state, THE Inline_Validation SHALL associate the error message with the field using `aria-describedby`.
3. THE Onboarding_Wizard SHALL indicate the current step to screen readers using `aria-current="step"` on the active progress indicator item.
4. THE Onboarding_Wizard SHALL ensure all interactive elements are reachable via keyboard navigation in logical tab order.
