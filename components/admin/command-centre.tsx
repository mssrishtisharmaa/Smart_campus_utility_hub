"use client";
import { useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Check,
  X,
  Copy,
  Plus,
  Radio,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { api, useClock } from "@/components/providers";
import { Loading, ErrorState, Badge, Empty } from "@/components/ui";
import type { RecordItem } from "@/types";
type AdminData = {
  alerts: RecordItem[];
  reports: RecordItem[];
  conversations: RecordItem[];
  audit: RecordItem[];
  users: {
    id: string;
    display_name: string;
    persona: string;
    role?: string;
    email?: string;
  }[];
  health: {
    lastSuccess: string | null;
    lastFailure: string | null;
    latencyMs: number;
    failures: number;
  };
  mode: string;
};
const tabs = [
  ["", "Overview"],
  ["alerts", "Alert management"],
  ["community-reports", "Report review"],
  ["data-sources", "Data sources"],
  ["users", "Users"],
  ["audit-log", "Audit log"],
  ["system-health", "System health"],
];
export function CommandCentre({ section = "" }: { section?: string }) {
  const now = useClock();
  const client = useQueryClient();
  const { data, isPending, error, refetch } = useQuery({
    queryKey: ["admin"],
    queryFn: () => api<AdminData>("/api/admin"),
  });
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);
  async function update(
    kind: string,
    row: RecordItem,
    payload: Record<string, unknown>,
  ) {
    try {
      await api(`/api/records/${kind}`, {
        id: row.id,
        payload: { ...row.payload, ...payload },
      });
      toast.success("Change saved and audited.");
      void client.invalidateQueries({ queryKey: ["admin"] });
    } catch (e) {
      toast.error((e as Error).message);
    }
  }
  async function createAlert(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const v = Object.fromEntries(new FormData(e.currentTarget));
    setBusy(true);
    try {
      await api("/api/records/alerts", {
        payload: {
          ...v,
          published: false,
          is_demo: true,
          origin: "derived",
          source_name: "WeatherGPT demonstration",
          source_url: "",
          hazard_type: v.hazard_type,
          issued_at: new Date().toISOString(),
          valid_from: new Date().toISOString(),
          valid_to: new Date(String(v.valid_to)).toISOString(),
          latitude: 28.6139,
          longitude: 77.209,
        },
      });
      setCreating(false);
      toast.success("Demonstration alert draft created.");
      void refetch();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  if (isPending) return <Loading />;
  if (error || !data)
    return (
      <ErrorState
        message={error?.message || "Command centre unavailable"}
        retry={() => void refetch()}
      />
    );
  const pending = data.reports.filter((r) =>
    ["submitted", "under_review"].includes(String(r.payload.status)),
  );
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">WEATHERGPT OPERATIONS</p>
          <h1>Command centre</h1>
          <p>
            Review observations, manage demonstration alerts, and trace
            decisions.
          </p>
        </div>
        <Badge tone="teal">Authorized administrator</Badge>
      </div>
      <nav className="tabs" aria-label="Admin sections">
        {tabs.map(([href, label]) => (
          <Link
            key={href}
            href={`/admin${href ? "/" + href : ""}`}
            className={section === href ? "active" : ""}
          >
            {label}
          </Link>
        ))}
      </nav>
      {!section && (
        <>
          <div className="metric-grid">
            {[
              [
                "Published alerts",
                data.alerts.filter(
                  (a) =>
                    a.payload.published &&
                  Date.parse(String(a.payload.valid_to)) > now,
                ).length,
              ],
              ["Registered users", data.users.length],
              ["Awaiting review", pending.length],
              ["Your conversations", data.conversations.length],
            ].map(([label, value]) => (
              <div className="card metric-card" key={String(label)}>
                <span>{label}</span>
                <strong>{value}</strong>
                <small>Current database records</small>
              </div>
            ))}
          </div>
          <div className="content-grid">
            <div className="card content-card">
              <h2>Community review queue</h2>
              <p>
                {pending.length} observations need review. Verification is a
                human responsibility; reports do not become official warnings.
              </p>
              <Link href="/admin/community-reports" className="btn">
                <Radio size={16} /> Open review queue
              </Link>
            </div>
            <div className="card content-card">
              <h2>Source health</h2>
              <p>
                Open-Meteo:{" "}
                {data.health.lastSuccess
                  ? "Last successful request recorded"
                  : "No successful request in this process yet"}
                .
              </p>
              <p>
                {data.health.latencyMs} ms last successful latency ·{" "}
                {data.health.failures} consecutive failures.
              </p>
              <Badge tone="amber">Official IMD feed not connected</Badge>
            </div>
          </div>
        </>
      )}
      {section === "community-reports" && (
        <div className="stack">
          {data.reports.length === 0 && (
            <Empty
              title="No reports awaiting review"
              description="Submitted observations will appear here."
            />
          )}
          {data.reports.map((r) => (
            <article key={r.id} className="card record-card">
              <Radio size={22} />
              <div>
                <div className="record-meta">
                  <Badge
                    tone={r.payload.status === "verified" ? "teal" : "amber"}
                  >
                    {String(r.payload.status)}
                  </Badge>
                  <span>{String(r.payload.location)}</span>
                  {r.payload.is_demo ? (
                    <Badge tone="amber">Demo report</Badge>
                  ) : null}
                </div>
                <h3>{String(r.payload.type)}</h3>
                <p>{String(r.payload.description)}</p>{r.payload.photo_path ? <a className="text-link" href={`/api/report-photo?id=${r.id}`} target="_blank" rel="noopener noreferrer">View attached photo</a> : null}
                <p>
                  Public display consent:{" "}
                  {r.payload.public_display ? "Yes" : "No"}
                </p>
                <div className="record-actions">
                  {[
                    ["verified", "Verify", Check],
                    ["rejected", "Reject", X],
                    ["duplicate", "Duplicate", Copy],
                  ].map(([status, label, Icon]) => {
                    const I = Icon as typeof Check;
                    return (
                      <button
                        key={String(status)}
                        className="btn secondary"
                        onClick={() => {
                          const note = prompt(`Reviewer note for ${label}`);
                          if (note !== null)
                            void update("community_reports", r, {
                              status,
                              reviewer_note: note,
                            });
                        }}
                      >
                        <I size={15} />
                        {String(label)}
                      </button>
                    );
                  })}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
      {section === "alerts" && (
        <>
          <button
            className="btn"
            style={{ marginBottom: 20 }}
            onClick={() => setCreating(!creating)}
          >
            <Plus size={16} />
            {creating ? "Close draft form" : "Create demo alert"}
          </button>
          {creating && (
            <form
              className="card content-card form-stack"
              onSubmit={createAlert}
              style={{ marginBottom: 20 }}
            >
              <h2>New demonstration alert</h2>
              <label>
                Title
                <input name="title" minLength={5} maxLength={200} required />
              </label>
              <div className="form-grid">
                <label>
                  Affected area
                  <input
                    name="location_name"
                    defaultValue="New Delhi"
                    required
                  />
                </label>
                <label>
                  Hazard
                  <select name="hazard_type">
                    <option>Heavy rain</option>
                    <option>Thunderstorm</option>
                    <option>Heat wave</option>
                    <option>Strong wind</option>
                  </select>
                </label>
                <label>
                  Severity
                  <select name="severity">
                    <option>Advisory</option>
                    <option>Watch</option>
                    <option>Alert</option>
                    <option>Warning</option>
                    <option>Emergency</option>
                  </select>
                </label>
                <label>
                  Expires at
                  <input name="valid_to" type="datetime-local" required />
                </label>
              </div>
              <label>
                Description
                <textarea name="description" minLength={10} required />
              </label>
              <label>
                Instructions
                <textarea name="instructions" minLength={10} required />
              </label>
              <button className="btn" disabled={busy}>
                Save draft
              </button>
            </form>
          )}
          <div className="stack">
            {data.alerts.map((r) => (
              <article key={r.id} className="card record-card">
                <AlertTriangle size={22} />
                <div>
                  <h3>{String(r.payload.title)}</h3>
                  <p>{String(r.payload.description)}</p>
                  <div className="record-meta">
                    <Badge tone="amber">Demo alert</Badge>
                    <Badge>{r.payload.published ? "Published" : "Draft"}</Badge>
                    <span>{String(r.payload.severity)}</span>
                  </div>
                  <div className="record-actions">
                    <button
                      className="btn secondary"
                      onClick={() => {
                        const title = prompt(
                          "Edit alert title",
                          String(r.payload.title),
                        );
                        if (title && title.length >= 5)
                          void update("alerts", r, { title });
                      }}
                    >
                      Edit title
                    </button>
                    <button
                      className="btn"
                      onClick={() => {
                        if (
                          confirm(
                            `${r.payload.published ? "Unpublish" : "Publish"} this demonstration alert?`,
                          )
                        )
                          void update("alerts", r, {
                            published: !r.payload.published,
                          });
                      }}
                    >
                      {r.payload.published ? "Unpublish" : "Publish"}
                    </button>
                    <button
                      className="btn secondary"
                      onClick={() => {
                        if (confirm("Expire this demonstration alert now?"))
                          void update("alerts", r, {
                            valid_to: new Date().toISOString(),
                          });
                      }}
                    >
                      Expire
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </>
      )}
      {["data-sources", "system-health"].includes(section) && (
        <div className="card content-card">
          <h2>Provider status & operational limits</h2>
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Source</th>
                  <th>Status</th>
                  <th>Latest evidence</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Open-Meteo forecast</td>
                  <td>
                    {data.health.lastSuccess
                      ? "Successful fetch recorded"
                      : "Not yet checked"}
                  </td>
                  <td>{data.health.lastSuccess || "—"}</td>
                </tr>
                <tr>
                  <td>Provider latency</td>
                  <td>{data.health.latencyMs} ms</td>
                  <td>Last successful request in this server process</td>
                </tr>
                <tr>
                  <td>Consecutive failures</td>
                  <td>{data.health.failures}</td>
                  <td>{data.health.lastFailure || "None recorded"}</td>
                </tr>
                <tr>
                  <td>Database</td>
                  <td>{data.mode}</td>
                  <td>Read verified by this page</td>
                </tr>
                <tr>
                  <td>IMD authoritative feed</td>
                  <td>Not connected</td>
                  <td>Authorized integration required</td>
                </tr>
                <tr>
                  <td>AI explanation</td>
                  <td>Deterministic fallback available</td>
                  <td>Optional compatible provider</td>
                </tr>
                <tr>
                  <td>Circuit breaker / distributed metrics</td>
                  <td>Coming in Phase 2</td>
                  <td>
                    Current requests use timeouts, retries and cached fallback
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <Link href="/data-sources" className="text-link">
            Explore the dataset catalogue
          </Link>
        </div>
      )}
      {section === "users" && (
        <div className="card content-card">
          <h2>Registered profiles</h2>
          <input
            aria-label="Search users"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or persona…"
            style={{ marginBottom: 18 }}
          />
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Persona</th>
                  <th>Role</th>
                </tr>
              </thead>
              <tbody>
                {data.users
                  .filter((u) =>
                    `${u.display_name} ${u.persona}`
                      .toLowerCase()
                      .includes(search.toLowerCase()),
                  )
                  .map((u) => (
                    <tr key={u.id}>
                      <td>{u.display_name}</td>
                      <td>{u.persona}</td>
                      <td>{u.role || "Database-managed"}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          <p>
            Role changes are restricted to trusted database administration.
            In-app role editing is Coming in Phase 2.
          </p>
        </div>
      )}
      {section === "audit-log" && (
        <div className="card content-card">
          <h2>Append-only audit trail</h2>
          {!data.audit.length && (
            <Empty
              title="No administrator changes recorded yet"
              description="Publishing an alert or reviewing a report records an audit entry."
            />
          )}
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Actor</th>
                  <th>Action</th>
                  <th>Entity</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {data.audit.map((r) => (
                  <tr key={r.id}>
                    <td>{new Date(r.created_at).toLocaleString()}</td>
                    <td>{String(r.payload.actor || r.user_id)}</td>
                    <td>{String(r.payload.action)}</td>
                    <td>{String(r.payload.entity)}</td>
                    <td>
                      <details>
                        <summary>View change</summary>
                        <pre style={{ whiteSpace: "pre-wrap", maxWidth: 400 }}>
                          {JSON.stringify(r.payload, null, 2)}
                        </pre>
                      </details>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}

