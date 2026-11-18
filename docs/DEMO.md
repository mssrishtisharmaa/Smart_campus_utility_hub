# SIH demonstration walkthrough

## Five-minute story

1. **A farmer's question (30 seconds).** Show the landing page, switch persona tabs and open the farmer demo. Frame the problem as choosing an activity time from understandable weather evidence.
2. **Live evidence (45 seconds).** Select a city. Show provider, retrieval time, seven-day forecast and risk explanation. Explicitly distinguish a model forecast from an official warning.
3. **Ask and verify (60 seconds).** Ask “Can I spray tomorrow morning?” Open evidence and sources. Explain that risk rules calculate values before the optional language model sees them. Reload to show persisted conversation history.
4. **Action windows (45 seconds).** Open agriculture advisories, choose activity and farm, generate ranked three-hour windows. Show why a window is Suitable, Caution or Avoid. State that regional expert validation is the next field milestone.
5. **Community loop (60 seconds).** Submit a clearly labelled demonstration observation, then use the admin account to review it and show the audit entry. A citizen submission does not automatically become an official alert.
6. **Research and inclusion (40 seconds).** Retrieve an ERA5 year, export CSV, show sources and the 2020 comparison label. Resize to mobile, show low-bandwidth mode and Hindi navigation.
7. **Close (20 seconds).** State measurable pilot targets rather than invented impact: task completion, comprehension of evidence, forecast freshness, failed-provider recovery and advisory agreement with agronomists.

## Honest answers for judges

- **Is this IMD data?** The operational forecast is Open-Meteo. Restricted IMD integration is documented and requires authorization.
- **Is the chat hallucinating values?** Numbers come from normalized provider responses and deterministic calculations. Optional model output is constrained to ordering approved sentences.
- **Does “no alert” mean safe?** No. It means no matching platform alert is stored; users are directed to official channels.
- **Are all catalogue sources connected?** No. Six public adapters work; the catalogue labels reference-only and approval-required sources separately.
- **What survives refresh?** Supabase stores accounts, saved locations, farms, conversations, advisories, observations, preferences, alerts and review history.
- **Can anyone become an admin?** Persona selection never changes roles. Database policies reject role escalation; the published admin account belongs only to the shared demonstration environment.
- **What remains before rollout?** Verified email delivery, official feeds, expert-reviewed rules, durable ingestion/delivery workers, operational hardening and field validation.
