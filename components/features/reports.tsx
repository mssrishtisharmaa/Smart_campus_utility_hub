"use client";
import { useState } from "react";
import { useHydrated } from "@/components/use-hydrated";
import { Radio, Send } from "lucide-react";
import { toast } from "sonner";
import { useApp, useClock } from "@/components/providers";
import { useRecords } from "@/components/records";
import { Badge, Empty } from "@/components/ui";
export function ReportsPage() {
  const hydrated = useHydrated();
  const now = useClock();
  const localTime = hydrated ? new Date(now - new Date(now).getTimezoneOffset() * 60000).toISOString().slice(0,16) : '';
  const { location, user } = useApp();
  const records = useRecords("community_reports");
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const values = new FormData(form);
    setBusy(true);
    try {
      let photo_path;
      const file = values.get("photo");
      if (file instanceof File && file.size) {
        const payload = new FormData();
        payload.append("file", file);
        const res = await fetch("/api/upload", {
          method: "POST",
          body: payload,
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error);
        photo_path = result.path;
      }
      await records.save.mutateAsync({
        payload: {
          type: String(values.get("type")),
          description: String(values.get("description")),
          location: location.name,
          latitude: location.latitude,
          longitude: location.longitude,
          observed_at: new Date(
            String(values.get("observed_at")),
          ).toISOString(),
          severity: String(values.get("severity")),
          consent: values.get("consent") === "on",
          public_display: values.get("public_display") === "on",
          status: "submitted",
          ...(photo_path ? { photo_path } : {}),
        },
      });
      toast.success("Report submitted for review. Thank you.");
      form.reset();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">LOCAL KNOWLEDGE. SHARED RESPONSIBILITY.</p>
          <h1>What’s happening around you?</h1>
          <p>Submit a local weather observation for review.</p>
        </div>
      </div>
      <div className="notice">
        <Radio size={19} /> Community observations do not replace official
        warnings. Reports may be delayed or inaccurate.
      </div>
      <div className="content-grid">
        <div className="card content-card">
          <h2>Report conditions in {location.name}</h2>
          <form className="form-stack" onSubmit={submit}>
            <fieldset disabled={!hydrated || busy} style={{ display: "contents" }}>
            <div className="form-grid">
              <label>
                Observation type
                <select name="type">
                  {[
                    "Heavy rain",
                    "Flooding",
                    "Hail",
                    "Strong wind",
                    "Lightning",
                    "Fog",
                    "Heat impact",
                    "Road obstruction",
                    "Crop damage",
                  ].map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </label>
              <label>
                Severity
                <select name="severity">
                  <option>Minor</option>
                  <option>Moderate</option>
                  <option>Severe</option>
                </select>
              </label>
            </div>
            <label>
              Observed at (your device time)
              <input
                key={hydrated ? 'device-time' : 'pending-time'}
                name="observed_at"
                type="datetime-local"
                required
                max={localTime}
                defaultValue={localTime}
              />
            </label>
            <label>
              Description
              <textarea
                name="description"
                minLength={10}
                maxLength={2000}
                required
                placeholder="Describe what you observed. Avoid personal information."
              />
            </label>
            <label>
              Photo (optional, maximum 5 MB)
              <input
                name="photo"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                disabled={user.mode !== "supabase"}
              />
              {user.mode !== "supabase" && (
                <small className="muted">
                  Photo upload requires private Supabase Storage setup.
                </small>
              )}
            </label>
            <label className="checkbox">
              <input name="public_display" type="checkbox" /> Allow anonymous
              public display after verification
            </label>
            <label className="checkbox">
              <input name="consent" type="checkbox" required /> I consent to
              storing this observation and understand it will be reviewed.
            </label>
            <button className="btn" disabled={busy || !hydrated}>
              {busy ? "Submitting…" : "Submit observation"}
              <Send size={16} />
            </button>
            </fieldset>
          </form>
        </div>
        <div className="stack">
          <h2>Your observations</h2>
          {records.data?.length === 0 && (
            <div className="card">
              <Empty
                title="Your first report can help."
                description="Only report what you have directly observed, and stay out of danger."
              />
            </div>
          )}
          {records.data?.map((r) => (
            <article className="card record-card" key={r.id}>
              <Radio size={20} />
              <div>
                <div className="record-meta">
                  <Badge
                    tone={r.payload.status === "verified" ? "teal" : "amber"}
                  >
                    {String(r.payload.status).replace("_", " ")}
                  </Badge>
                  <span>{String(r.payload.location)}</span>
                </div>
                <h3>{String(r.payload.type)}</h3>
                <p>{String(r.payload.description)}</p>
                {r.payload.photo_path ? <a className="text-link" href={`/api/report-photo?id=${r.id}`} target="_blank" rel="noopener noreferrer">View attached photo</a> : null}
                {r.payload.reviewer_note ? (
                  <p>Review note: {String(r.payload.reviewer_note)}</p>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </div>
    </>
  );
}
