"use client";
import Link from "next/link";
import {
  CloudSun,
  Sun,
  CloudRain,
  CloudLightning,
  ArrowUpRight,
  LoaderCircle,
  TriangleAlert,
} from "lucide-react";
import type { Weather, Evidence } from "@/types";
import { dayLabel, timeLabel } from "@/lib/locations";
export function Logo() {
  return (
    <Link href="/" className="logo">
      <span className="logo-icon">
        <CloudSun size={25} />
      </span>
      <span>
        WeatherGPT <b>BHARAT</b>
      </span>
    </Link>
  );
}
export function WeatherIcon({
  code = 2,
  size = 30,
}: {
  code?: number;
  size?: number;
}) {
  const Icon =
    code === 0
      ? Sun
      : code >= 95
        ? CloudLightning
        : code >= 51
          ? CloudRain
          : CloudSun;
  return <Icon size={size} strokeWidth={1.6} aria-hidden="true" />;
}
export function Badge({
  children,
  tone = "blue",
}: {
  children: React.ReactNode;
  tone?: string;
}) {
  return (
    <span className={`badge ${tone}`}>
      <span className="badge-dot" />
      {children}
    </span>
  );
}
export function SectionTitle({
  eyebrow,
  title,
  children,
}: {
  eyebrow?: string;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="section-title">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h2>{title}</h2>
      </div>
      {children}
    </div>
  );
}
export function Loading() {
  return (
    <div className="loading-state" role="status">
      <LoaderCircle className="spin" />
      <span>Checking the latest information…</span>
      <div className="skeleton" />
      <div className="skeleton" />
    </div>
  );
}
export function ErrorState({
  message,
  retry,
}: {
  message: string;
  retry?: () => void;
}) {
  return (
    <div className="empty-state" role="alert">
      <TriangleAlert />
      <h2>We couldn’t load this information</h2>
      <p>{message}</p>
      {retry && (
        <button className="btn" onClick={retry}>
          Try again
        </button>
      )}
    </div>
  );
}
export function Empty({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="empty-state">
      <CloudSun />
      <h3>{title}</h3>
      <p>{description}</p>
      {children}
    </div>
  );
}
export function SourceBadge({ weather }: { weather: Weather }) {
  return (
    <div className="source-line">
      <Badge
        tone={
          weather.isDemo ? "amber" : weather.state === "stale" ? "red" : "teal"
        }
      >
        {weather.state === "demo"
          ? "Demo data"
          : weather.state === "live"
            ? "Live model data"
            : weather.state === "stale"
              ? "Stale data"
              : "Cached data"}
      </Badge>
      <span>
        {weather.provider} · Retrieved {timeLabel(weather.retrievedAt)}
      </span>
    </div>
  );
}
export function EvidenceCard({ evidence }: { evidence: Evidence }) {
  return (
    <details className="evidence">
      <summary>
        Evidence & sources <ArrowUpRight size={15} />
        <Badge tone={evidence.state === "demo" ? "amber" : "teal"}>
          {evidence.state}
        </Badge>
      </summary>
      <dl>
        <div>
          <dt>Location</dt>
          <dd>{evidence.location}</dd>
        </div>
        <div>
          <dt>Provider</dt>
          <dd>
            <a href={evidence.sourceUrl} target="_blank" rel="noreferrer">
              {evidence.source}
            </a>
          </dd>
        </div>
        <div>
          <dt>Retrieved</dt>
          <dd>
            {dayLabel(evidence.retrievedAt)} · {timeLabel(evidence.retrievedAt)}
          </dd>
        </div>
        <div>
          <dt>Valid period</dt>
          <dd>
            {dayLabel(evidence.validFrom)} {timeLabel(evidence.validFrom)} –{" "}
            {dayLabel(evidence.validTo)} {timeLabel(evidence.validTo)}
          </dd>
        </div>
        <div>
          <dt>Issue time</dt>
          <dd>
            {evidence.issuedAt
              ? timeLabel(evidence.issuedAt)
              : "Not supplied by provider"}
          </dd>
        </div>
        <div>
          <dt>Confidence</dt>
          <dd>
            {evidence.confidence} · {evidence.reasons.join(" ")}
          </dd>
        </div>
        <div>
          <dt>Rules</dt>
          <dd>{evidence.ruleVersion}</dd>
        </div>
      </dl>
    </details>
  );
}
