"use client";
import { useState } from "react";
import Link from "next/link";
import {
  TriangleAlert,
  Check,
  Share2,
  Bookmark,
  Volume2,
  MessageSquare,
  Bell,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { useRecords } from "@/components/records";
import { Badge, Loading, ErrorState, Empty } from "@/components/ui";
import { useAlertFeed } from "@/components/alert-feed";
import { dayLabel, timeLabel } from "@/lib/locations";
import {useApp, useClock, useOnline} from '@/components/providers';
export function AlertsPage() {
  const records = useAlertFeed();
  const {lowBandwidth} = useApp();
  const online = useOnline();
  const subscriptions = useRecords("alert_subscriptions");
  const events = useRecords("feedback");
  const [tab, setTab] = useState("Active");
  const [severity, setSeverity] = useState("All severities");
  const [location, setLocation] = useState("All locations");
  const [hazard, setHazard] = useState("All hazards");
  const [read, setRead] = useState<string[]>([]);
  const now = useClock();
  if (records.isPending) return <Loading />;
  if (records.error)
    return (
      <ErrorState
        message={records.error.message}
        retry={() => void records.refetch()}
      />
    );
  const alerts = (records.data?.alerts || [])
    .filter((a) => a.published);
  const filtered = alerts.filter(
    (a) =>
      (severity === "All severities" || a.severity === severity) &&
      (location === "All locations" || a.location_name === location) &&
      (hazard === "All hazards" || a.hazard_type === hazard) &&
      (tab === "All" ||
        (tab === "Active" &&
          Date.parse(a.valid_from) <= now &&
          Date.parse(a.valid_to) > now) ||
        (tab === "Upcoming" && Date.parse(a.valid_from) > now) ||
        (tab === "Expired" && Date.parse(a.valid_to) <= now)),
  );
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">AWARENESS IS YOUR FIRST LINE OF PREPARATION</p>
          <h1>Alerts & warnings</h1>
          <p>Know the affected area, the source, and your next step.</p>
        </div>
        <Link href="/settings" className="btn secondary">
          <Bell size={16} /> Preferences
        </Link>
      </div>
      <div className="notice amber">
        <TriangleAlert size={19} /> {records.data?.audience === "demo" ? "Demo account: simulated scenarios rotate every 15 minutes. They do not describe current weather." : "Personal account: alerts use fresh weather forecasts for your selected and saved places. These are platform advisories, not official warnings."} Follow IMD and local-authority directions during dangerous weather.
      </div>
      <div className="toolbar" aria-label="Alert update status">
        <Badge tone={online ? "teal" : "amber"}>{online ? (records.data?.audience === "demo" ? "Demo alert feed" : "Live forecast alerts") : "Offline — updates paused"}</Badge>
        <span className="muted">Auto-check: {lowBandwidth ? "5 minutes" : "60 seconds"} while open · Last checked {records.data ? timeLabel(records.data.checkedAt) : "—"}</span>
        <button className="btn secondary" onClick={()=>void records.refetch()} disabled={records.isFetching || !online}><RefreshCw size={15}/> {records.isFetching ? "Checking…" : "Check alerts now"}</button>
      </div>
      <div className="stack" style={{marginBottom:20}}>
        {records.data?.checks.map(check=><div className="notice" key={check.location}><div><strong>{check.location} · {check.state === "checked" ? "Forecast checked" : check.state === "demo" ? "Simulated" : "Updates unavailable"}</strong><p>{check.message}{check.retrievedAt ? ` Retrieved ${timeLabel(check.retrievedAt)}.` : ""}</p></div></div>)}
        {!!records.data?.omittedLocations && <p className="muted">Monitoring your selected place and four saved places. Select another saved place to check it now.</p>}
      </div>
      <div className="toolbar">
        <div className="segmented">
          {["Active", "Upcoming", "Expired", "All"].map((x) => (
            <button
              key={x}
              className={tab === x ? "active" : ""}
              onClick={() => setTab(x)}
            >
              {x}
            </button>
          ))}
        </div>
        <select
          aria-label="Filter by severity"
          value={severity}
          onChange={(e) => setSeverity(e.target.value)}
        >
          {[
            "All severities",
            "Advisory",
            "Watch",
            "Alert",
            "Warning",
            "Emergency",
          ].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <select
          aria-label="Filter by location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        >
          {[
            "All locations",
            ...new Set(alerts.map((a) => a.location_name)),
          ].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <select
          aria-label="Filter by hazard"
          value={hazard}
          onChange={(e) => setHazard(e.target.value)}
        >
          {["All hazards", ...new Set(alerts.map((a) => a.hazard_type))].map(
            (s) => (
              <option key={s}>{s}</option>
            ),
          )}
        </select>
      </div>
      <div className="stack">
        {!filtered.length && (
          <div className="card">
            <Empty
              title="No alerts in this view"
              description={records.data?.checks.some(c=>c.state==='unavailable') ? "Some locations could not be checked. Retry when the provider is available; consult official sources." : "No forecast thresholds matched this view. This does not mean an area is free of official warnings."}
            />
          </div>
        )}
        {filtered.map((a) => (
          <article key={a.id} className="card record-card">
            <span className="alert-icon">
              <TriangleAlert size={22} />
            </span>
            <div>
              <div className="record-meta">
                <Badge
                  tone={
                    a.severity === "Warning" || a.severity === "Emergency"
                      ? "red"
                      : "amber"
                  }
                >
                  {a.severity}
                </Badge>
                <span>{a.location_name}</span>
                <Badge tone="blue">{a.is_demo ? "Demo scenario" : a.origin === "official" ? "Official source" : "Forecast advisory"}</Badge>
                {(read.includes(a.id) || events.data?.some(r=>r.payload.alert_id===a.id&&r.payload.understood)) && <span>Read</span>}
              </div>
              <h3>{a.title}</h3>
              <p>{a.description}</p>
              <div className="record-meta">
                <span>
                  Valid: {dayLabel(a.valid_from)} {timeLabel(a.valid_from)} –{" "}
                  {dayLabel(a.valid_to)} {timeLabel(a.valid_to)}
                </span>
              </div>
              <details>
                <summary className="text-link">
                  Recommended actions & source
                </summary>
                <p>{a.instructions}</p>
                <p style={{ fontSize: 11, marginTop: 10 }}>
                  Source: {a.source_name} · Issued {dayLabel(a.issued_at)},{" "}
                  {timeLabel(a.issued_at)}
                </p>
                {(a.source_url || "").startsWith("https://") && <a className="text-link" href={a.source_url} target="_blank" rel="noopener noreferrer">View source documentation</a>}
                {a.is_demo && (
                  <Badge tone="amber">
                    Demonstration alert — not an official warning
                  </Badge>
                )}
              </details>
              <div className="record-actions">
                <Link
                  className="btn secondary"
                  href={`/chat?q=${encodeURIComponent(`Explain the ${a.title} warning in ${a.location_name} simply.`)}`}
                >
                  <MessageSquare size={14} /> Explain simply
                </Link>
                <button
                  className="btn secondary"
                  onClick={() => {
                    events.save.mutate(
                      {
                        payload: {
                          type: "alert_comprehension",
                          alert_id: a.id,
                          understood: true,
                        },
                      },
                      {
                        onSuccess: () => {
                          setRead([...read, a.id]);
                          toast.success("Understanding recorded.");
                        },
                      },
                    );
                  }}
                >
                  <Check size={14} /> I understand
                </button>
                <button
                  className="btn secondary"
                  onClick={() =>
                    subscriptions.save.mutate(
                      {
                        payload: {
                          alert_id: a.id,
                          location: a.location_name,
                          hazard_types: [a.hazard_type],
                          in_app_enabled: true,
                        },
                      },
                      {
                        onSuccess: () =>
                          toast.success("Alert saved to your subscriptions."),
                      },
                    )
                  }
                >
                  <Bookmark size={14} /> Save
                </button>
                <button
                  className="icon-button"
                  aria-label="Play alert audio"
                  onClick={() => {
                    if ("speechSynthesis" in window) {
                      speechSynthesis.cancel();
                      speechSynthesis.speak(
                        new SpeechSynthesisUtterance(
                          `${a.is_demo ? "Demonstration alert. " : "Forecast-based advisory. "}Not an official warning. ${a.title}. ${a.instructions}`,
                        ),
                      );
                    } else toast.info("Audio is unavailable in this browser.");
                  }}
                >
                  <Volume2 size={17} />
                </button>
                <button
                  className="icon-button"
                  aria-label="Share alert"
                  onClick={async () => {
                    const text = `${a.is_demo ? "Demonstration alert" : "Forecast-based advisory"} — not an official warning. ${a.title}: ${a.instructions}`;
                    try {
                      if (navigator.share)
                        await navigator.share({ title: a.title, text });
                      else {
                        await navigator.clipboard.writeText(text);
                        toast.success("Alert copied for sharing.");
                      }
                    } catch {
                      toast.info("Sharing cancelled or unavailable.");
                    }
                  }}
                >
                  <Share2 size={17} />
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
