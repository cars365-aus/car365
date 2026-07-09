# Runbook: Lead Spam Attack

1. Raise Cloudflare WAF sensitivity and Turnstile enforcement for lead/contact endpoints.
2. Lower application rate limits temporarily.
3. Review `fraud_flags`, `leads`, and `contact_clicks` for affected vendors.
4. Pause suspicious source networks at Cloudflare where appropriate.
5. Notify affected vendors if bad leads were delivered.
6. Add detection rules before restoring normal limits.
