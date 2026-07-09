# Requirements Document

## Introduction

This feature adds a WhatsApp auto-responder to the Hire Car platform, modeled on the automated WhatsApp Business experiences common to UK and AU businesses. Today the platform only supports outbound click-to-chat (`wa.me`) links and click tracking. This feature introduces a genuine two-way integration with the **Meta WhatsApp Business Cloud API**: an inbound webhook receives customer messages, the system replies automatically (instant acknowledgement, business-hours vs away messaging), the inbound message is captured as a lead in Supabase, and the relevant recipient is notified. Outbound notifications use Meta-approved message templates. The integration must respect Meta's 24-hour customer service window, WhatsApp messaging policy, rate limits, and the platform's existing security architecture (webhook signature verification, rate limiting, RBAC).

This is the MVP scope: instant auto-acknowledgement, business-hours/away routing, inbound lead capture, and recipient notification. FAQ keyword auto-replies and richer conversational flows are explicitly deferred to a later phase but the design must not preclude them.

## Glossary

- **Cloud_API**: Meta's WhatsApp Business Platform Cloud API, the official hosted API used to send and receive WhatsApp messages via a registered business phone number.
- **WABA**: WhatsApp Business Account — the Meta Business asset that owns the registered phone number and approved message templates.
- **Inbound_Webhook**: The platform HTTP endpoint registered with Meta that receives webhook event callbacks (incoming messages, status updates) from the Cloud_API.
- **Inbound_Message**: A WhatsApp message sent by a customer to the business number and delivered to the platform via the Inbound_Webhook.
- **Auto_Reply**: An automated outbound WhatsApp message the system sends in response to an Inbound_Message without human intervention.
- **Acknowledgement_Message**: The first Auto_Reply confirming the business received the customer's message.
- **Business_Hours**: The configured operating hours (per platform timezone) during which the "in-hours" Auto_Reply is used; outside these hours the "away" Auto_Reply is used.
- **Away_Message**: The Auto_Reply variant sent when an Inbound_Message arrives outside Business_Hours.
- **Customer_Service_Window**: Meta's 24-hour window, opened by an Inbound_Message, during which the business may send free-form (non-template) messages to that customer.
- **Message_Template**: A Meta-approved, pre-registered outbound message format required to initiate or continue conversations outside the Customer_Service_Window.
- **WhatsApp_Lead**: A record persisted in Supabase representing an Inbound_Message captured for follow-up, including sender, message body, timestamp, and routing metadata.
- **Lead_Recipient**: The party notified of a new WhatsApp_Lead — the platform support team and/or a matched vendor.
- **Conversation**: The ordered set of Inbound_Messages and Auto_Replies exchanged with a single customer phone number.
- **Webhook_Verification**: Meta's two-part webhook security: the GET `hub.challenge` subscription handshake and the `X-Hub-Signature-256` HMAC signature on POST callbacks.
- **Auto_Responder_Config**: The admin-editable settings controlling auto-responder behavior — enabled flag, Business_Hours, timezone, message text variants, and recipient routing rules.
- **Admin_Console**: The existing platform administrator area (`src/app/admin`).
- **Rate_Limiter**: The existing Redis-backed rate limiting layer (`src/lib/security/rate-limit-redis.ts`).

## Requirements

### Requirement 1: Inbound Webhook Verification and Receipt

**User Story:** As a platform operator, I want the WhatsApp webhook to securely verify and receive Meta callbacks, so that only legitimate Cloud_API events are processed.

#### Acceptance Criteria

1. THE Inbound_Webhook SHALL expose a GET endpoint that, WHEN Meta sends a subscription verification request, validates the `hub.verify_token` query parameter against the configured verify token and responds with the `hub.challenge` value and HTTP 200 only when the token matches.
2. IF the GET verification `hub.verify_token` does not match the configured verify token, THEN THE Inbound_Webhook SHALL respond with HTTP 403 and SHALL NOT echo the challenge.
3. THE Inbound_Webhook SHALL expose a POST endpoint that validates the `X-Hub-Signature-256` HMAC-SHA256 signature against the raw request body using the configured app secret before processing any event payload.
4. IF the `X-Hub-Signature-256` signature is missing or does not match the computed HMAC, THEN THE Inbound_Webhook SHALL respond with HTTP 401 and SHALL NOT process the payload.
5. WHEN a valid POST callback is received, THE Inbound_Webhook SHALL respond with HTTP 200 within 5 seconds regardless of downstream processing outcome, so that Meta does not retry due to timeout.
6. THE Inbound_Webhook SHALL parse only the supported event types (incoming text messages and message status updates) and SHALL ignore unrecognized event types without error.
7. WHEN the same Inbound_Message (identified by the Cloud_API message id) is delivered more than once, THE Inbound_Webhook SHALL process it idempotently and SHALL NOT send a duplicate Auto_Reply or create a duplicate WhatsApp_Lead.
8. THE Inbound_Webhook POST endpoint SHALL be protected by the Rate_Limiter, and IF the per-source request rate is exceeded, THEN it SHALL respond with HTTP 429.

### Requirement 2: Instant Auto-Acknowledgement

**User Story:** As a customer messaging the business on WhatsApp, I want an immediate acknowledgement, so that I know my message was received and a response is coming.

#### Acceptance Criteria

1. WHEN a valid Inbound_Message is received and the Auto_Responder_Config enabled flag is true, THE system SHALL send an Acknowledgement_Message to the sender via the Cloud_API.
2. THE Acknowledgement_Message SHALL be sent within the Customer_Service_Window as a free-form message and SHALL contain the configured acknowledgement text.
3. WHEN multiple Inbound_Messages arrive from the same sender within a configurable cooldown window (default 60 minutes), THE system SHALL send the Acknowledgement_Message only once and SHALL suppress repeat acknowledgements for that Conversation until the cooldown elapses.
4. IF the Auto_Responder_Config enabled flag is false, THEN THE system SHALL still capture the WhatsApp_Lead but SHALL NOT send any Auto_Reply.
5. IF the Cloud_API send request fails, THEN THE system SHALL record the failure with the error reason and SHALL NOT block capture of the WhatsApp_Lead.

### Requirement 3: Business-Hours and Away Messaging

**User Story:** As a business owner, I want different automated replies inside and outside business hours, so that customers have accurate expectations about response times.

#### Acceptance Criteria

1. THE Auto_Responder_Config SHALL store Business_Hours as a per-weekday set of open and close times and a single IANA timezone identifier.
2. WHEN an Inbound_Message arrives and the current time in the configured timezone falls within Business_Hours, THE system SHALL select the in-hours Acknowledgement_Message variant.
3. WHEN an Inbound_Message arrives and the current time in the configured timezone falls outside Business_Hours, THE system SHALL select the Away_Message variant.
4. THE Away_Message SHALL communicate the next time the business will be available based on the configured Business_Hours.
5. IF Business_Hours are not configured for a given weekday, THEN THE system SHALL treat that weekday as fully closed and use the Away_Message.
6. THE system SHALL compute Business_Hours boundaries correctly across daylight-saving transitions for the configured timezone.

### Requirement 4: Inbound Lead Capture

**User Story:** As a vendor or support agent, I want every inbound WhatsApp message captured as a lead, so that no enquiry is lost and follow-up is possible.

#### Acceptance Criteria

1. WHEN a valid Inbound_Message is received, THE system SHALL persist a WhatsApp_Lead in Supabase containing the sender phone number, sender display name when provided, message body, Cloud_API message id, received timestamp, and the selected reply variant (in-hours or away).
2. THE WhatsApp_Lead SHALL be associated with an existing Conversation for the sender phone number when one exists, and otherwise SHALL create a new Conversation.
3. WHERE an Inbound_Message contains a referral or context referencing a known vehicle or vendor (for example via a click-to-chat deep link payload), THE system SHALL store that vehicle and/or vendor association on the WhatsApp_Lead.
4. THE WhatsApp_Lead persistence SHALL validate and sanitize all stored fields using a Zod schema before writing to the database.
5. THE WhatsApp_Lead records SHALL be protected by row-level security such that vendors can read only WhatsApp_Leads routed to them and admins can read all WhatsApp_Leads.
6. IF persistence of a WhatsApp_Lead fails, THEN THE system SHALL log the error with the Cloud_API message id and SHALL return HTTP 200 to Meta to avoid retries while flagging the failure for monitoring.

### Requirement 5: Lead Routing and Recipient Notification

**User Story:** As a Lead_Recipient, I want to be notified when a new WhatsApp lead arrives, so that I can follow up promptly through existing channels.

#### Acceptance Criteria

1. WHEN a WhatsApp_Lead is created, THE system SHALL determine the Lead_Recipient using the Auto_Responder_Config routing rules, defaulting to the platform support team when no vendor association exists.
2. WHERE a WhatsApp_Lead is associated with a vendor, THE system SHALL route the notification to that vendor.
3. WHEN a Lead_Recipient is determined, THE system SHALL send an email notification via the existing Resend integration containing the sender details, message body, and a link to view the lead.
4. THE WhatsApp_Lead SHALL be visible in the recipient's existing leads view alongside other enquiry leads, distinguished by a WhatsApp channel indicator.
5. IF notification delivery fails, THEN THE system SHALL retry up to a configured maximum and SHALL record the final delivery status without affecting the persisted WhatsApp_Lead.

### Requirement 6: Outbound Template Messaging and Window Compliance

**User Story:** As a platform operator, I want outbound messages to comply with Meta's messaging policy, so that the WABA is not penalized or rate-limited.

#### Acceptance Criteria

1. WHEN the system sends an outbound message to a customer and the Customer_Service_Window for that customer is open, THE system SHALL be permitted to send free-form message content.
2. IF the system needs to send an outbound message to a customer and the Customer_Service_Window for that customer is closed, THEN THE system SHALL send only an approved Message_Template and SHALL NOT attempt a free-form message.
3. THE system SHALL track, per customer phone number, the timestamp of the most recent Inbound_Message in order to determine whether the Customer_Service_Window is open.
4. WHEN the Cloud_API returns a messaging policy or rate-limit error, THE system SHALL record the error code and SHALL NOT retry in a way that exceeds the Cloud_API documented retry guidance.
5. THE system SHALL store the identifiers of approved Message_Templates in configuration and SHALL reference templates by name and language code when sending.

### Requirement 7: Admin Configuration

**User Story:** As a platform admin, I want to configure the auto-responder behavior, so that I can control messaging without code changes.

#### Acceptance Criteria

1. THE Admin_Console SHALL provide a page, accessible only to authenticated admins via the existing `requireAdmin()` guard, for editing the Auto_Responder_Config.
2. THE Admin_Console Auto_Responder_Config page SHALL allow editing the enabled flag, the acknowledgement cooldown window, the in-hours and away message text, the Business_Hours per weekday, the timezone, and the lead routing default.
3. WHEN an admin saves the Auto_Responder_Config, THE system SHALL validate the input with a Zod schema, rejecting invalid timezones, malformed time ranges (close before open), and empty message text, and SHALL display inline validation errors for invalid fields.
4. WHEN the Auto_Responder_Config is saved successfully, THE system SHALL apply the new configuration to subsequent Inbound_Messages without requiring a redeploy.
5. THE Admin_Console SHALL display the current Cloud_API connection status (configured phone number id and webhook subscription state) in a read-only section.
6. WHEN an admin changes the Auto_Responder_Config, THE system SHALL record the change in the existing admin audit log with the acting admin id and timestamp.

### Requirement 8: Configuration, Secrets, and Environment

**User Story:** As a developer, I want all Cloud_API credentials managed as validated environment variables, so that secrets are never hard-coded and misconfiguration fails fast.

#### Acceptance Criteria

1. THE system SHALL read the Cloud_API access token, phone number id, WABA id, webhook verify token, and app secret from environment variables validated through the existing `@t3-oss/env-nextjs` configuration.
2. IF any required WhatsApp environment variable is missing at build or startup, THEN the environment validation SHALL fail with an error naming the missing variable.
3. THE system SHALL NOT log or echo the Cloud_API access token or app secret in any log output, error message, or admin UI.
4. THE `.env.example` file SHALL document every new WhatsApp environment variable with a non-secret placeholder and a comment describing its purpose.
5. THE Cloud_API access token and app secret SHALL be referenced by key name only in code and documentation, never by literal value.

### Requirement 9: Reliability, Observability, and Security

**User Story:** As a platform operator, I want the integration to be observable and resilient, so that failures are detected and the system degrades gracefully.

#### Acceptance Criteria

1. WHEN any Cloud_API request or webhook processing error occurs, THE system SHALL report the error to the existing Sentry integration with contextual metadata excluding secrets and excluding full customer message bodies.
2. THE system SHALL treat all Inbound_Message content as untrusted input and SHALL sanitize it before persistence, rendering in the Admin_Console, or inclusion in notification emails.
3. WHEN the Cloud_API is unreachable or returns 5xx errors, THE system SHALL still persist the WhatsApp_Lead and SHALL queue or record the failed Auto_Reply for later inspection rather than crashing the webhook handler.
4. THE Inbound_Webhook SHALL enforce a maximum accepted payload size and SHALL reject payloads exceeding it with HTTP 413.
5. THE system SHALL record a structured log entry for each processed Inbound_Message containing the message id, selected reply variant, lead id, and notification outcome, without logging secrets.

### Requirement 10: Testing and Build Integrity

**User Story:** As a developer, I want the integration covered by automated tests and to not break the existing build, so that it ships safely.

#### Acceptance Criteria

1. THE feature SHALL include unit tests for webhook signature verification covering valid signatures, invalid signatures, and missing signatures.
2. THE feature SHALL include unit tests for Business_Hours selection covering in-hours, out-of-hours, unconfigured-weekday, and daylight-saving boundary cases.
3. THE feature SHALL include unit tests for the acknowledgement cooldown logic covering first message, repeat message within cooldown, and message after cooldown elapses.
4. THE feature SHALL include unit tests for the WhatsApp_Lead Zod validation covering valid payloads and rejection of malformed payloads.
5. THE feature SHALL include a test verifying idempotent processing of a duplicate Cloud_API message id.
6. THE feature SHALL NOT break existing functionality, verified by `next build` succeeding, `eslint` passing, and `vitest run` passing for the full suite.
