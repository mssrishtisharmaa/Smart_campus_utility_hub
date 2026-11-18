# Account access and email setup

Citizen, farmer and administrator demo buttons fill real hosted demo credentials. Login is verified by Supabase; administrator access comes from database roles. A failed login does not create a session. Signing out revokes the current session and reloads the public login page, discarding the authenticated browser cache. Unauthenticated users cannot open the workspace.

## Implemented account flows

- Login accepts existing passwords of at least eight characters. New account and replacement passwords require 12–128 characters and matching confirmation in the form.
- Email addresses are trimmed and normalized; passwords are never trimmed.
- Registration accepts only citizen, farmer, disaster-manager or researcher personas. None confers administration privileges.
- Hosted Remember me persists the auth cookies. Unchecked uses session cookies, including subsequent server and browser refreshes. A browser configured to restore sessions may restore session cookies; always sign out on a shared device.
- Signup confirmation, resend confirmation and recovery have distinct screens, consistent validation and actionable provider errors.
- A password update requires a validated signed-in account. The app disallows changing the shared demonstration passwords through its password endpoint. Shared demo accounts must still be removed before real-world rollout; this app rule is not a substitute for securing the underlying Auth service.
- The callback supports PKCE codes and email token hashes, permits only internal destinations, hides provider error details and disables caching. Failed links lead to a screen for requesting a fresh link.

## External prerequisite still required

Public email signup, confirmation resend and recovery are gated by the server-only `AUTH_EMAIL_ENABLED=true` flag. It is false by default. The live demonstration has no verified custom email service, so these pages clearly explain the unavailable delivery and link to demo sign-in. They do not claim to have sent a message. Local SQLite registration remains available in local demo mode; local recovery does not send email.

To enable public accounts:

1. Configure and verify a sender with an email provider. Enter its SMTP credentials privately in [this project's Supabase email settings](https://supabase.com/dashboard/project/nsuvfphvpfolzvmitcsa/auth/smtp). Do not put SMTP secrets in public environment variables or source code.
2. In [Auth URL settings](https://supabase.com/dashboard/project/nsuvfphvpfolzvmitcsa/auth/url-configuration), set the Site URL to `https://weathergpt-bharat-theta.vercel.app` and allow `https://weathergpt-bharat-theta.vercel.app/auth/callback` and `https://weathergpt-bharat-theta.vercel.app/auth/callback?next=/reset-password`. Keep email confirmation enabled.
3. Standard PKCE email links work in the requesting browser. For cross-device confirmation, customize the confirmation template link to `{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=email`. The recovery template can use `{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=recovery`.
4. Set the Vercel production environment variable `AUTH_EMAIL_ENABLED=true`, then redeploy. The flag enables the forms; it does not itself configure or verify SMTP.
5. With a mailbox you control, verify signup, confirmation, sign-in, sign-out, forgotten password, recovery, replacement-password login, rejection of the previous password and an expired link. This delivery check remains outstanding until an email service and test mailbox are available.
6. Apply the remaining real-user rollout requirements in [PRODUCTION.md](PRODUCTION.md), including removing shared demo accounts.

References: [Supabase SMTP restrictions and configuration](https://supabase.com/docs/guides/auth/auth-smtp), [server-rendered authentication](https://supabase.com/docs/guides/auth/server-side/nextjs), [resending confirmation](https://supabase.com/docs/reference/javascript/auth-resend).

Supabase's security advisor still reports [leaked-password protection disabled](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection). No other security findings were returned during this account-flow update.

## Verification

`tests/unit/auth.test.ts` checks validation, persona restrictions, cookie persistence and safe errors. `tests/unit/auth-routes.test.ts` exercises mocked provider contracts, email-readiness gating, password authorization, callback validation, cross-site rejection and logout failure handling. These tests prove application behavior, not actual inbox delivery.

`tests/e2e/auth.spec.ts` verifies all three hosted demo roles, wrong passwords, session persistence, logout, administrator isolation, Remember me cookie lifetimes, invalid-link recovery and truthful unavailable-email states. Set `E2E_EMAIL_ENABLED=true` only after enabling email; it skips the unavailable-email assertions and does not send mail automatically.
