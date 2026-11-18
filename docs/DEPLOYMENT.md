# Published release

Live app: [WeatherGPT Bharat](https://weathergpt-bharat-theta.vercel.app)

Current deployment: `dpl_4SYYDHhZ9yyJLmxcTAXfYwUHKBxt`, published September 27, 2026, on Vercel in Mumbai. Vercel reported Ready and assigned the live domain to this deployment.

## September 27 alert update

Demo and personal alert feeds are separated in the API, user interface, database read policies and persisted alert-notification delivery. Demo scenarios rotate every 15 minutes. Personal accounts receive advisories from fresh weather forecasts, with explicit source/coverage checks and no synthetic fallback. Both feeds refresh every minute while visible, with a manual refresh control and in-app popups. See [ALERTS.md](ALERTS.md) for limits and rules.

All **55 automated tests** passed, along with lint and TypeScript checks. The cloud migration succeeded; a rolled-back hosted database test confirmed that a personal account could see a real-source fixture and zero demo rows despite spoofed editable metadata. The actual Supabase realtime delivery/deduplication check passed after migration. The two new alert browser journeys passed on the live domain, and desktop/mobile screenshots are included.

The expanded live browser regression run passed 18 of 20 journeys on its first run. Citizen sign-in and farmer advisory encountered loading timeouts; each passed its targeted rerun (9.8 seconds and 9.5 seconds respectively). All 20 journeys were therefore verified, with those two timing failures retained here rather than reported as a clean single run.

## September 27 account update

All seven account browser checks passed on the public domain: citizen/farmer/admin login and logout, reload persistence, role restrictions, wrong-password handling, Remember me cookie lifetime, safe invalid-link recovery, and unavailable-email states. All **38 automated unit/component/database tests**, lint and TypeScript checks passed; the production build succeeded. Authentication API tests include mocked signup, confirmation and recovery contracts and do not claim actual email delivery.

The complete expanded browser suite also passed against the earlier account-update deployment: **18 tests passed**, including the original weather, chat, map, private photo, review and realtime journeys. A local test helper was corrected to wait for sign-out before starting another login.

The release adds matching password confirmation, consistent new-password rules, address normalization, confirmation resend, safe callback handling, hosted session-cookie preferences and clean logout. Public email flows are explicitly gated until delivery is configured. See [AUTHENTICATION.md](AUTHENTICATION.md) for exact setup and remaining verification.

## Previous release verification

### Verified behavior

The complete Chromium browser suite passed against the public domain: **11 tests passed**, completed September 25, 2026 at 02:32 UTC. It covered:

- Real forecast and ERA5 historical data responses.
- Private photo upload and viewing by the owner; another account is denied access.
- Responsive landing, persona tabs and mobile navigation.
- Citizen sign-in, sourced chat and saved conversation history.
- Farmer advisory generation and saved-location persistence.
- Report submission, administrator review and audit history.
- Rejection of citizen access to administrator pages and endpoints.
- Theme persistence and map controls.
- A report-review notification appearing in a separate citizen session without reloading.

The same 11 journeys passed locally against the hosted database. Lint, TypeScript checks and all **21 unit/component/database tests** passed. The Vercel production build succeeded. Desktop and mobile captures of the published UI are included in this directory.

Separate dated evidence files record six successful public-data adapter checks, eight hosted database permission checks, and four realtime delivery/deduplication checks. See `source-verification.json`, `hosted-database-verification.json`, and `realtime-verification.json`.

## Release changes

The landing page and workspace share a persistent light/dark theme, self-hosted typography and responsive styling. Forecasts refresh every 60 seconds in a visible tab, or every five minutes in low-bandwidth mode. Account changes and notifications use authenticated database subscriptions with reconnection recovery. Provider timestamps distinguish a refreshed request from newly published weather-model data.

Sign-in and observation forms wait until their browser handlers are ready before accepting input, preventing a form-loading race. Observation times use the device timezone. Account record caches are keyed by user identity.

## Source package

The archive includes application code, locked dependencies, database migrations, demo seeds, tests, artwork, screenshots and setup/deployment instructions. It excludes installed packages, build output, real environment files, authentication tokens, local databases and browser traces. Copy `.env.example` to `.env.local` and follow the root README.

## Remaining public-service setup

This is a functional SIH demonstration with shared demo accounts. Official warning-feed ingestion, verified email delivery, expert validation of agricultural rules and operational rollout requirements remain documented in [PRODUCTION.md](PRODUCTION.md). Remove shared accounts before collecting real user data. The app does not claim official real-time sensor or satellite coverage.
