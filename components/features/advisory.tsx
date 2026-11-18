"use client";
import { useState } from "react";
import { Leaf, ArrowRight, ShieldCheck, Clock } from "lucide-react";
import { toast } from "sonner";
import { api, useApp } from "@/components/providers";
import { Badge, Empty } from "@/components/ui";
import { dayLabel, timeLabel } from "@/lib/locations";
import type { Advisory } from "@/types";
type Result = {
  windows: Advisory[];
  evidence: {
    source: string;
    state: string;
    retrievedAt: string;
    confidence: string;
  };
  notice: string;
};
export function AdvisoryPage() {
  const { location } = useApp();
  const [result, setResult] = useState<Result>();
  const [busy, setBusy] = useState(false);
  async function generate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget));
    setBusy(true);
    try {
      setResult(await api<Result>("/api/advisory", { ...data, location }));
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
          <p className="eyebrow">RIGHT ACTIVITY. RIGHT WEATHER.</p>
          <h1>Make the most of your next field day.</h1>
          <p>
            Weather-informed action windows for your farm in {location.name}.
          </p>
        </div>
        <Badge tone="teal">Farm advisory</Badge>
      </div>
      <div className="notice amber">
        <ShieldCheck size={19} /> Demonstration agronomic rules. Regional expert
        validation is required before real-world use.
      </div>
      <div className="content-grid">
        <section className="card content-card">
          <h2>
            <Leaf size={19} style={{ display: "inline", marginRight: 8 }} />{" "}
            Tell us about your plan
          </h2>
          <form className="form-stack" onSubmit={generate}>
            <div className="form-grid">
              <label>
                Crop
                <select name="crop">
                  <option>Tomato</option>
                  <option>Rice</option>
                  <option>Wheat</option>
                  <option>Cotton</option>
                  <option>Maize</option>
                  <option>Groundnut</option>
                </select>
              </label>
              <label>
                Growth stage
                <select name="stage">
                  <option>Flowering</option>
                  <option>Seedling</option>
                  <option>Vegetative</option>
                  <option>Fruiting</option>
                  <option>Ready for harvest</option>
                </select>
              </label>
            </div>
            <label>
              Planned activity
              <select name="activity">
                {[
                  "Pesticide spraying",
                  "Fertilizer application",
                  "Irrigation",
                  "Harvesting",
                  "Sowing",
                  "Transplanting",
                  "Livestock protection",
                ].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
            <label>
              Planning window
              <select name="day">
                <option value="tomorrow">Tomorrow</option>
                <option value="today">Today</option>
                <option value="next48">Next 48 hours</option>
              </select>
            </label>
            <button className="btn" disabled={busy}>
              {busy ? "Evaluating forecast windows…" : "Find my action windows"}
              <ArrowRight size={17} />
            </button>
          </form>
          <p style={{ fontSize: 11, marginTop: 22 }}>
            Your crop and growth stage are recorded for context. These
            demonstration weather thresholds are not crop-specific. Follow
            product labels and regional agronomist advice.
          </p>
        </section>
        <section>
          {!result ? (
            <div className="card">
              <Empty
                title="A better time starts with a forecast."
                description="Choose your crop and planned activity. We’ll rank available three-hour windows by rain, wind, and heat risk."
              />
            </div>
          ) : (
            <div className="stack">
              {result.windows.length ? (
                result.windows.map((w, i) => (
                  <article className="card advisory-result" key={w.start}>
                    <div className="section-title">
                      <span className="eyebrow">
                        {i === 0 ? "BEST EVALUATED WINDOW" : `ALTERNATIVE ${i}`}
                      </span>
                      <Badge
                        tone={
                          w.status === "Suitable"
                            ? "teal"
                            : w.status === "Caution"
                              ? "amber"
                              : "red"
                        }
                      >
                        {w.status}
                      </Badge>
                    </div>
                    <h3>
                      <Clock
                        size={19}
                        style={{ display: "inline", marginRight: 8 }}
                      />
                      {timeLabel(w.start)} – {timeLabel(w.end)}
                    </h3>
                    <p className="muted">
                      {dayLabel(w.start)} · {location.name}
                    </p>
                    <div className="advisory-stats">
                      <div>
                        <strong>{w.rainProbability}%</strong>Max rain
                        probability
                      </div>
                      <div>
                        <strong>{w.wind}</strong>Max wind · km/h
                      </div>
                      <div>
                        <strong>{w.temperature}°</strong>Max temperature · C
                      </div>
                    </div>
                    <ul>
                      {w.reasons.map((x) => (
                        <li key={x}>{x}</li>
                      ))}
                    </ul>
                    <div className="source-line">
                      <Badge tone="amber">{result.evidence.state}</Badge>
                      <span>
                        {result.evidence.source} · {result.evidence.confidence}{" "}
                        confidence
                      </span>
                    </div>
                  </article>
                ))
              ) : (
                <div className="card">
                  <Empty
                    title="No complete window available"
                    description="Try tomorrow or the next 48 hours to find three consecutive forecast hours."
                  />
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
