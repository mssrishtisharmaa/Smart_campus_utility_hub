# Architecture and data flow

The browser runs React within Next.js App Router. Server components protect the workspace and administrator layouts. Same-origin route handlers validate inputs with Zod, verify the Supabase identity, enforce roles and return request IDs on failures. TanStack Query coordinates requests and realtime invalidation; charts and maps load in the client.

## Weather and explanations

Location → provider adapter → validated normalized forecast → versioned risk rules → approved answer sentences → evidence panel.

Open-Meteo responses are normalized to ISO instants, with latitude, longitude, timezone, retrieval time, validity, provider and content hash. Requests have bounded retries/timeouts. A process-local one-minute cache can provide explicitly stale results. Synthetic fallback is restricted to demonstration mode and remains labelled. A serverless instance restart loses the cache; it is not a distributed cache.

The optional compatible AI endpoint can order already-approved sentences. Its JSON output must be a permutation of four indices; it cannot inject new weather facts. Without model credentials the standard explanation mode works completely. It is intentionally a deterministic assistant, not an unrestricted research agent. Historical queries point to the actual ERA5 workspace rather than inventing a trend from forecast data.

## Persistence and authorization

Supabase Auth issues sessions, the Next.js proxy refreshes cookies, and server identity checks use `getUser`. Roles live in `user_roles`. User-editable metadata and interest personas are never authorization inputs.

Database groups:

| Group | Tables |
|---|---|
| Identity | profiles, user_roles, user_preferences |
| Locations | locations, saved_locations, farms |
| Weather | weather_snapshots, climate_series, provider_health, advisory_rules |
| Guidance | generated_advisories, conversations, messages, message_sources |
| Community and alerts | community_reports, alerts, alert_subscriptions, notifications, feedback |
| Accountability | audit_logs |

All exposed tables have row-level security. Owned records require `auth.uid()`. Messages and source rows inherit conversation ownership; even administrators cannot read another user's private conversation. Public readers see only published, unexpired alerts and verified reports opted into public display. Citizens cannot publish alerts, verify reports, forge notifications or append audit records. Audit writes run through a narrowly scoped private trigger after administrator report/alert changes. Application writes never use a service-role key.

Flexible payloads hold feature data, while ownership, timestamps and important authorization fields have relational constraints or generated columns. Conversations materialize messages/source rows through a database trigger. Future large-scale analytics should normalize remaining query-heavy payload fields as access patterns become measurable.

Report photos use a private bucket, owner-prefixed paths, MIME and signature checks and a five-megabyte limit. Storage policies restrict access to owner or administrator. No sensitive session pages or API responses enter the service-worker cache.

Local demonstration mode uses SQLite and signed HTTP-only cookies. It is a convenience for offline development, not the deployed storage strategy.

## Operational limitations

Rate limiting and provider health are process-local. Database triggers deliver review notifications and matching published platform alerts transactionally, with an event-key uniqueness constraint. Websocket events invalidate caches and periodic queries recover missed events. Add a distributed limiter/cache, scheduled official-feed ingestion, external-channel delivery, monitoring and retention jobs before scaling. No claims of calibrated probability, official government integration, field validation or guaranteed availability are made by this build.

