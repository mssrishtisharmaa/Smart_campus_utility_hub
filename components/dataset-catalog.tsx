"use client";
import { useState } from "react";
import Link from "next/link";
import { ExternalLink, Download, Database, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { datasets } from "@/lib/datasets";
import { Logo, Badge } from "@/components/ui";
import { api } from "@/components/providers";
import { places } from "@/lib/locations";
import { ThemeToggle } from "./theme-toggle";
export function DatasetCatalog() {
  const [filter, setFilter] = useState("All");
  const [place, setPlace] = useState(places[0].id);
  const [busy, setBusy] = useState("");
  const [results, setResults] = useState<
    Record<string, Record<string, unknown>>
  >({});
  const categories = [
    "All",
    "Public API adapter",
    "Official alerts",
    "Climate",
    "Forecast",
    "Satellite",
    "Marine",
  ];
  async function sample(id: string) {
    setBusy(id);
    const p = places.find((p) => p.id === place)!;
    try {
      const result = await api<Record<string, unknown>>(
        `/api/datasets/${id}?lat=${p.latitude}&lon=${p.longitude}`,
      );
      setResults((prev) => ({ ...prev, [id]: result }));
      toast.success(
        "Source responded. Inspect or download the retrieved data.",
      );
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy("");
    }
  }
  function download(id: string) {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(results[id], null, 2)], {
        type: "application/json",
      }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `weathergpt-${id}-${place}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
  return (
    <main className="dataset-page">
      <div className="public-topbar"><Logo /><ThemeToggle /></div>
      <div className="page-heading">
        <div>
          <p className="eyebrow">THE EVIDENCE BEHIND THE INTELLIGENCE</p>
          <h1>A transparent data foundation.</h1>
        </div>
        <Link className="btn secondary" href="/dashboard">
          Open workspace
        </Link>
      </div>
      <p className="muted">
        Explore {datasets.length} scientific and public-interest sources. Six
        public API adapters can retrieve real samples below. Sources needing
        agreements remain explicitly unconnected. A catalogue entry is not a
        claim of ingestion or partnership.
      </p>
      <div className="notice">
        <Database size={20} /> Every retrieved sample keeps its provider,
        retrieval time, raw metadata and source reference. Data availability and
        licensing differ by product.
      </div>
      <div className="toolbar">
        <label htmlFor="dataset-city">Sample location</label>
        <select
          id="dataset-city"
          value={place}
          onChange={(e) => {
            setPlace(e.target.value);
            setResults({});
          }}
        >
          {places.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <span className="muted" style={{ fontSize: 11 }}>
          Marine samples use a fixed offshore point near Mumbai.
        </span>
      </div>
      <div className="dataset-tabs">
        {categories.map((c) => (
          <button
            className={filter === c ? "active" : ""}
            key={c}
            onClick={() => setFilter(c)}
          >
            {c === "Public API adapter" ? "Working adapters" : c}
          </button>
        ))}
      </div>
      <div className="dataset-grid">
        {datasets
          .filter(
            (d) =>
              filter === "All" || d.category === filter || d.status === filter,
          )
          .map((d) => (
            <article className="card dataset-card" key={d.id}>
              <div className="source-line">
                <Badge
                  tone={
                    d.status === "Public API adapter"
                      ? "teal"
                      : d.status === "Approval required"
                        ? "amber"
                        : "blue"
                  }
                >
                  {d.status}
                </Badge>
              </div>
              <h3>{d.name}</h3>
              <p>{d.description}</p>
              <dl>
                <dt>Provider</dt>
                <dd>{d.organization}</dd>
                <dt>Variables</dt>
                <dd>{d.variables}</dd>
                <dt>Coverage</dt>
                <dd>{d.coverage}</dd>
                <dt>Access & attribution</dt>
                <dd>{d.license}</dd>
              </dl>
              <a
                href={d.url}
                target="_blank"
                rel="noreferrer"
                className="text-link"
              >
                Official reference <ExternalLink size={13} />
              </a>
              {d.status === "Public API adapter" && (
                <button
                  className="btn secondary"
                  disabled={Boolean(busy)}
                  onClick={() => void sample(d.id)}
                >
                  <RefreshCw
                    size={15}
                    className={busy === d.id ? "spin" : ""}
                  />
                  {busy === d.id
                    ? "Retrieving source…"
                    : "Retrieve live sample"}
                </button>
              )}
              {results[d.id] && (
                <div style={{ marginTop: 15 }}>
                  <Badge tone="teal">
                    {String(results[d.id].state)} ·{" "}
                    {new Date(
                      String(results[d.id].retrievedAt),
                    ).toLocaleTimeString()}
                  </Badge>
                  <details style={{ marginTop: 10, fontSize: 11 }}>
                    <summary>Inspect raw evidence</summary>
                    <pre
                      style={{
                        maxHeight: 280,
                        overflow: "auto",
                        fontSize: 10,
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {JSON.stringify(results[d.id], null, 2)}
                    </pre>
                  </details>
                  <button className="text-link" onClick={() => download(d.id)}>
                    <Download size={14} /> Download sourced JSON
                  </button>
                </div>
              )}
            </article>
          ))}
      </div>
      <p className="muted" style={{ marginTop: 30, fontSize: 12 }}>
        Artwork: original AI-generated monsoon landscape created for WeatherGPT
        Bharat. It is illustrative and does not depict a verified weather event.
        Motion references:{" "}
        <a href="https://gsap.com/docs/v3/" target="_blank" rel="noreferrer">
          GSAP documentation
        </a>{" "}
        and{" "}
        <a
          href="https://motion.dev/docs/react"
          target="_blank"
          rel="noreferrer"
        >
          Motion for React documentation
        </a>
        .
      </p>
    </main>
  );
}
