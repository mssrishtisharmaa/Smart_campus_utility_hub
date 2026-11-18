# Demo and personal alert feeds

The `/alerts` screen, map markers and weather popups use an authenticated `/api/alerts` feed. The server chooses its audience from the account; request fields cannot select a different audience.

## Demo accounts

The three hosted demo accounts have `account_mode: demo` in trusted Supabase app metadata. The local SQLite environment is also treated as demonstration mode. Editable user metadata, email text and persona selection cannot grant this flag.

Demo accounts receive explicitly simulated current/upcoming scenarios for their selected location. The scenarios rotate every 15 minutes, have fixed expiry times and stable IDs within each interval, and are checked every 60 seconds while the app is visible. Administrator-published demo alerts for monitored coordinates can also appear. Scenario cards, popups, sharing and audio identify their demonstration status.

## Personal accounts

All other hosted accounts use fresh Open-Meteo model data for their selected location and up to four other saved places. Additional saved places are disclosed in the interface; selecting one checks it immediately. Server-side rules identify high feels-like temperature, reduced model visibility, strong forecast wind, forecast thunderstorm codes and accumulated forecast rainfall. These are **forecast-based platform advisories**, not official IMD/NDMA warnings, sensor detections or validated impact forecasts.

The current rules are 38 °C apparent temperature, 40 km/h wind, 1,000 m visibility, thunderstorm codes 95/96/99 and 30 mm rainfall over 24 contiguous hourly periods. The thresholds are transparent platform rules; they are not official warning-category definitions. Past forecast hours are excluded, current conditions require a recent model-valid time, and incomplete rainfall coverage does not create a 24-hour rain alert.

Synthetic weather, explicitly stale responses and retrievals older than ten minutes cannot generate personal alerts. If a provider is unavailable, the affected location shows **Updates unavailable**, rather than a simulated alert or an assurance of safety. When no rules match, the screen explains that no platform thresholds matched; it does not assert the absence of official warnings.

## Updates and notification behavior

- The open app checks every 60 seconds, or every five minutes in low-bandwidth mode; hidden tabs pause polling and reconnect/focus refreshes the feed.
- Active new alerts can show an in-app popup. IDs are remembered per account on the device to suppress repeat popups. Saved alert interests control popup topics; the feed itself retains all detected conditions.
- Forecast-derived cards are recomputed from current data. They are not persisted as an incident history. The notifications page links to the current weather feed.
- Administrator-published alert notifications remain transactional, persisted and delivered over Supabase Realtime. Their recipients must match both subscription interests and demo/personal audience. Report-review notifications are unchanged.
- Database policies restrict alert reads and notification reads by audience, including direct database clients. Administrators retain management access, while the ordinary app feed still filters their account audience.

This update does not add closed-browser push, SMS, email delivery, unattended scheduled ingestion or an official warning feed. Public email registration still needs the setup described in [AUTHENTICATION.md](AUTHENTICATION.md).

## Verification

Unit tests cover audience assignment, stable demo scenarios, fresh real hazards, no-hazard conditions, stale/synthetic rejection, past-hour exclusion, rainfall completeness, saved-place limits, popup preferences and outage behavior. PostgreSQL tests apply all migrations and verify audience-specific reads, notification delivery, rejection of editable-metadata spoofing and restricted writes.

A transaction on the hosted database also verified that a personal account with spoofed editable metadata sees zero demo rows and can see an eligible real-source fixture. The transaction was rolled back, leaving no test account or alert behind. Hosted realtime checks confirmed delivery and deduplication after the migration. Browser tests cover labelled current/upcoming demos, manual refresh, mobile layout and rejection of caller-selected audience fields.

Source reference: [Open-Meteo forecast API](https://open-meteo.com/en/docs). Follow official [IMD](https://mausam.imd.gov.in/) and local-authority guidance for dangerous weather.
