# Live updates and premium interface

The live site is https://weathergpt-bharat-theta.vercel.app . Public and signed-in pages share a persistent light/dark theme, self-hosted Manrope typography, navy/sage tokens, consistent focus states and responsive layouts. The map now includes a forecast detail panel, saved-place shortcuts, recenter/fullscreen controls, explicit layer empty states and a verified-public-observation feed.

## Updates that are implemented

Demo and personal weather-alert feeds are now separate. See [ALERTS.md](ALERTS.md) for audience rules, current forecast thresholds, outage behavior, coverage limits and notification delivery.

| Data | Update mechanism |
|---|---|
| Forecasts and map metrics | Automatic retrieval every 60 seconds in a visible online tab; 5 minutes in low-bandwidth mode. Server provider cache lasts 60 seconds. |
| Alerts and report reviews | Supabase Postgres Changes websocket; queries are invalidated and reread under row-level security. |
| Saved places, farms, subscriptions, preferences, conversation lists and advisories | Ownership-filtered database subscriptions and reconnect/focus synchronization. |
| Report-review notifications | Database trigger creates an owned notification in the same transaction as the review; realtime delivers it to the signed-in owner. |
| Subscribed alert notifications | On first publication of an unexpired platform alert, a database trigger matches location, hazard and enabled in-app preference. Unique event keys suppress duplicate delivery. |
| Recovery | Alerts, reports and notifications also refetch periodically; focus, online reconnection and replication readiness refetch current records. |

The connection indicator changes to **Live updates** after the replication-ready system event. A websocket connection acknowledgement alone is insufficient to establish database-stream readiness. The implementation follows [Supabase's replication-readiness guidance](https://supabase.com/docs/guides/troubleshooting/realtime-postgres-changes-troubleshooting) and reconciles records after reconnects because realtime events are not a durable message queue.

The forecast's **last checked** timestamp describes the app's request, while the provider retrieval and model-validity timestamps remain visible. Polling once per minute does not imply that a weather model publishes new values every minute. This app does not stream live satellite imagery, sensor observations or official IMD warning feeds.

## Reproduce the verification

```sh
node --env-file=.env.local scripts/verify-realtime.mjs
```

This uses only the dedicated demo citizen and administrator accounts. It verifies an authenticated subscription, private report-review delivery, matching alert publication and deduplication. Results are saved in `realtime-verification.json`; tokens are never written to that artifact. Fixtures are labelled as automated demonstrations, the temporary alert is unpublished/expired and the temporary subscription is removed.

The browser tests additionally use two independent signed-in sessions to review a report and observe its notification without reloading the citizen's page. They check theme persistence, map controls, mobile overflow and the device/server timezone boundary in report forms.

Public demonstration credentials are shared. Remove them before collecting real data. See `PRODUCTION.md` for email, official-feed and operational rollout requirements.
