# Requirements Document

## Introduction

This feature updates the Carhire platform's pricing plans to refine vehicle limits, restructure support tiers with differentiated routing (email, phone, dedicated account manager), and fully remove the GPS verification badge from all UI surfaces, admin controls, and feature-flag code.

## Glossary

- **Platform**: The Carhire Next.js web application including public pages, vendor dashboard, and admin panel
- **Starter_Plan**: The free tier plan ($0/month) for small local operators
- **Growth_Plan**: The mid-tier paid plan ($49/month) for growing rental shops
- **Pro_Plan**: The highest self-serve paid plan ($99/month) for established fleets
- **Vendor**: A registered car rental operator who lists vehicles on the Platform
- **Vehicle_Limit**: The maximum number of active vehicle listings allowed for a given plan
- **Support_Router**: The in-app component that displays support contact options based on the Vendor's active plan
- **GPS_Badge**: The "GPS Verified" trust badge previously shown on vehicle listings and pricing pages
- **Feature_Flag_System**: The plan-features.ts module that gates functionality by plan code
- **Billing_Page**: The vendor billing dashboard at /vendor/billing
- **Pricing_Page**: The public-facing pricing page at /pricing
- **Admin_Panel**: The administrative interface at /admin for managing vendors

## Requirements

### Requirement 1: Starter Plan Vehicle Limit Reduction

**User Story:** As a platform operator, I want the Starter plan vehicle limit reduced to 5, so that free-tier usage is contained and vendors are incentivized to upgrade.

#### Acceptance Criteria

1. THE Platform SHALL enforce a maximum of 5 active vehicle listings for Vendor accounts on Starter_Plan.
2. WHEN a Vendor on Starter_Plan attempts to add a vehicle beyond the 5-vehicle limit, THE Platform SHALL reject the addition and display a message instructing the Vendor to upgrade.
3. WHEN the new limit takes effect, THE Platform SHALL auto-archive vehicles exceeding the 5-vehicle limit for existing Starter_Plan Vendors, retaining the 5 most recently updated listings as active.
4. THE Pricing_Page SHALL display "5 vehicles" as the listing allowance for Starter_Plan.
5. THE Billing_Page SHALL display "5 vehicles" as the listing allowance for Starter_Plan Vendors.

### Requirement 2: Starter Plan Support Downgrade

**User Story:** As a platform operator, I want the Starter plan to have no phone support, so that phone support resources are reserved for paying customers.

#### Acceptance Criteria

1. THE Support_Router SHALL display only email support contact options for Vendors on Starter_Plan.
2. THE Support_Router SHALL NOT display a phone number for Vendors on Starter_Plan.
3. THE Pricing_Page SHALL display "Email support" as the support level for Starter_Plan.
4. THE Billing_Page SHALL display "Email support" as the support tier label for Vendors on Starter_Plan.

### Requirement 3: Growth Plan Support Tier

**User Story:** As a Growth plan vendor, I want priority email support and phone support, so that I can get faster assistance through multiple channels.

#### Acceptance Criteria

1. THE Support_Router SHALL display a priority email support option for Vendors on Growth_Plan.
2. THE Support_Router SHALL display a phone support contact number for Vendors on Growth_Plan.
3. THE Pricing_Page SHALL display "Priority email + Phone support" as the support level for Growth_Plan.
4. THE Billing_Page SHALL display "Priority email + Phone support" as the support tier label for Vendors on Growth_Plan.
5. WHEN a Vendor on Growth_Plan accesses in-app support, THE Support_Router SHALL show the phone number visibly alongside the priority email option.

### Requirement 4: Pro Plan Support Tier

**User Story:** As a Pro plan vendor, I want dedicated phone support, priority email, a dedicated account manager, and same-day response priority, so that I receive the highest level of assistance.

#### Acceptance Criteria

1. THE Support_Router SHALL display a dedicated phone support contact number for Vendors on Pro_Plan.
2. THE Support_Router SHALL display a priority email support option for Vendors on Pro_Plan.
3. THE Support_Router SHALL display dedicated account manager contact information for Vendors on Pro_Plan.
4. THE Support_Router SHALL display a "Same-Day Response Priority" label for Vendors on Pro_Plan.
5. THE Pricing_Page SHALL display "Dedicated Phone, Priority Email, Account Manager, Same-Day Response" as the support level for Pro_Plan.
6. THE Billing_Page SHALL display the full support tier description for Vendors on Pro_Plan.

### Requirement 5: GPS Badge Removal from Public UI

**User Story:** As a platform operator, I want the GPS Verified badge removed from all public-facing pages, so that the feature is fully deprecated from the user experience.

#### Acceptance Criteria

1. THE Platform SHALL NOT render the GPS_Badge on individual vehicle listing pages.
2. THE Pricing_Page SHALL NOT list "GPS Verified badge" as a feature for any plan.
3. THE Platform SHALL NOT render the GPS_Badge on any public-facing page or component.

### Requirement 6: GPS Badge Removal from Vendor and Admin UI

**User Story:** As a platform operator, I want the GPS Verified badge removed from the vendor billing page and admin panel, so that no internal or vendor-facing surface references the deprecated feature.

#### Acceptance Criteria

1. THE Billing_Page SHALL NOT display "GPS Verified badge" as a plan feature.
2. THE Admin_Panel SHALL NOT display the GPS_Badge or any GPS verification status for vendors.
3. THE Admin_Panel SHALL NOT display a toggle or control for enabling GPS verification on vendor accounts.

### Requirement 7: GPS Feature Flag Cleanup

**User Story:** As a developer, I want the gpsVerified feature flag removed from the codebase, so that dead code is eliminated and the feature-gating system remains clean.

#### Acceptance Criteria

1. THE Feature_Flag_System SHALL NOT include "gpsVerified" in the list of available plan features.
2. THE Feature_Flag_System SHALL NOT reference "gpsVerified" in any plan's feature array.
3. WHEN code references the "gpsVerified" feature flag, THE Platform SHALL treat the reference as a compile-time error (type removal).

### Requirement 8: Support Tier Display on Pricing and Billing Pages

**User Story:** As a vendor, I want to see my plan's support tier clearly on pricing and billing pages, so that I understand what support channels are available to me.

#### Acceptance Criteria

1. THE Pricing_Page SHALL display distinct support tier labels for each plan in the feature comparison table.
2. THE Billing_Page SHALL display the active plan's support tier label reflecting the Vendor's current support entitlements.
3. WHEN a Vendor upgrades or downgrades, THE Billing_Page SHALL update the displayed support tier label to match the new plan within the same page load or refresh.

### Requirement 9: In-App Support Routing by Plan

**User Story:** As a vendor, I want in-app support routing to match my plan's entitlements, so that I can access the correct support channels without confusion.

#### Acceptance Criteria

1. WHEN a Vendor on Starter_Plan accesses in-app support, THE Support_Router SHALL present only email support contact information.
2. WHEN a Vendor on Growth_Plan accesses in-app support, THE Support_Router SHALL present priority email support and a phone support number.
3. WHEN a Vendor on Pro_Plan accesses in-app support, THE Support_Router SHALL present priority email support, a dedicated phone number, account manager details, and a same-day response priority indicator.
4. IF a Vendor's subscription status is not active or trialing, THEN THE Support_Router SHALL default to Starter_Plan support routing (email only).
