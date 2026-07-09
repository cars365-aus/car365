# Runbook: Compromised Admin Account

1. Disable the user in Supabase Auth and revoke platform role access.
2. Review `audit_logs` and `security_events` for actions taken by the account.
3. Rotate service credentials if secret exposure is suspected.
4. Suspend affected listings/vendors only if customer or vendor data exposure is plausible.
5. Force MFA re-enrollment for platform admins.
6. Prepare breach notification steps with legal counsel if personal information was exposed.
