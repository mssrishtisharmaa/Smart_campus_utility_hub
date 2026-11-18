# Release status and rollout gates

The application code, cloud database schema, hosted demo authentication, real public-data adapters, browser workflows and administrator review flow are implemented. A hackathon demo and a dependable public weather service have different release requirements.

Before collecting real user data:

1. Remove public demonstration accounts from Supabase Auth, disable `NEXT_PUBLIC_DEMO_MODE`, delete synthetic seed content, and provision named administrators. Disabling the UI flag alone does not revoke direct Supabase access for existing demo accounts.
2. Configure Supabase Auth Site URL and allowlisted `/auth/callback` URLs for the final domain. Configure verified SMTP, email confirmation/recovery templates, abuse protection and appropriate session lifetimes. This deployment's demo password logins are verified; delivery to arbitrary real email addresses is not configured or verified.
3. Enable leaked-password protection where supported. Supabase's hosted security advisor reported this warning; see https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection . No missing-RLS or exposed-definer-function issues were returned by that check.
4. Agree data rights and quotas with each provider. The free public endpoints are useful for evaluation, but are not an SLA or unlimited commercial entitlement. Integrate authorized IMD/NDMA warning feeds before presenting official alerts.
5. Obtain regional agronomist review of wind/rain/heat thresholds, crop-stage applicability, pesticide labels and wording. Current action windows are explainable demonstration rules, not validated agricultural prescriptions.
6. Add scheduled, idempotent ingestion and subscription matching with delivery deduplication, retries and expiry. In-app delivery of administrator-published alerts and report-review decisions is implemented with database triggers and deduplication. Continuous official alert ingestion, SMS, WhatsApp, push and email delivery are not connected.
7. Use a distributed cache/rate limiter, provider circuit breakers, workload/load tests, tracing, uptime/error alerts, database backup/restore exercises and a retention/deletion process. Set provider budgets and alerts before increasing usage.
8. Complete native-language review beyond the supplied Hindi navigation and browser speech, accessibility auditing with assistive technology, privacy/legal review and real field usability sessions.

Later product extensions: validated nowcasting/radar layers, station observations, calibrated multi-model uncertainty, PostGIS boundaries, district aggregation, comprehensive multilingual content, remote sensing ingestion, offline map packs and external delivery providers. Do not present these as shipped functionality.

The implementation has defense in depth and automated checks; it has not undergone independent penetration testing, formal safety validation or a production load certification.

