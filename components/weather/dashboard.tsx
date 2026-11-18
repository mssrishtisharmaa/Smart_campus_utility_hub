"use client";
import Link from "next/link";
import { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  ArrowRight,
  ArrowUpRight,
  ArrowDown,
  Wind,
  Droplets,
  Eye,
  Gauge,
  Sunrise,
  Sunset,
  MapPin,
  ShieldCheck,
  CloudRain,
  Sparkles,
  Leaf,
  Navigation,
  CalendarDays,
  RefreshCw,
} from "lucide-react";
import { useApp, useWeather } from "@/components/providers";
import {
  Badge,
  WeatherIcon,
  SourceBadge,
  SectionTitle,
  Loading,
  ErrorState,
} from "@/components/ui";
import { condition, timeLabel, dayLabel, temperature } from "@/lib/locations";
import { actionWindows } from "@/lib/risk/engine";
import type { Weather } from "@/types";
export function ForecastChart({ weather }: { weather: Weather }) {
  const [metric, setMetric] = useState<
    "temperature" | "rainProbability" | "wind"
  >("temperature");
  const { unit, lowBandwidth } = useApp();
  const data = weather.hourly
    .slice(0, 24)
    .map((h) => ({
      ...h,
      label: timeLabel(h.time),
      temperature: temperature(h.temperature, unit),
    }));
  return (
    <div className="card forecast-card">
      <SectionTitle title="The next 24 hours">
        <div className="segmented">
          {(["temperature", "rainProbability", "wind"] as const).map((m) => (
            <button
              key={m}
              className={metric === m ? "active" : ""}
              onClick={() => setMetric(m)}
            >
              {m === "temperature"
                ? "Temperature"
                : m === "wind"
                  ? "Wind"
                  : "Rain"}
            </button>
          ))}
        </div>
      </SectionTitle>
      {lowBandwidth ? (
        <div className="compact-forecast">
          {data
            .filter((_, i) => i % 3 === 0)
            .map((h) => (
              <div key={h.time}>
                <strong>{h.label}</strong>
                <span>
                  {h[metric]}{" "}
                  {metric === "temperature"
                    ? "°"
                    : metric === "wind"
                      ? "km/h"
                      : "%"}
                </span>
              </div>
            ))}
        </div>
      ) : (
        <div
          className="chart"
          role="img"
          aria-label={`${metric} forecast for the next 24 hours. Range ${Math.min(...data.map((h) => h[metric]))} to ${Math.max(...data.map((h) => h[metric]))}.`}
        >
          <ResponsiveContainer width="100%" height={210}>
            <AreaChart
              data={data}
              margin={{ top: 12, right: 10, left: -26, bottom: 0 }}
            >
              <defs>
                <linearGradient id="tempFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2c97ca" stopOpacity={0.24} />
                  <stop offset="100%" stopColor="#2c97ca" stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 5"
                vertical={false}
                stroke="#e9edf2"
              />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                minTickGap={35}
                tick={{ fontSize: 12, fill: "#748392" }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 12, fill: "#748392" }}
                domain={
                  metric === "rainProbability" ? [0, 100] : ["auto", "auto"]
                }
              />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: "1px solid #dce5ec" }}
              />
              <Area
                type="monotone"
                dataKey={metric}
                stroke="#278fbe"
                strokeWidth={2.5}
                fill="url(#tempFill)"
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
      <div className="chart-footer">
        <span>
          <span className="legend-dot" />{" "}
          {metric === "temperature"
            ? `Temperature (°${unit.toUpperCase()})`
            : metric === "wind"
              ? "Wind speed (km/h)"
              : "Rain probability (%)"}
        </span>
        <span>Times shown in IST</span>
      </div>
    </div>
  );
}
export function Dashboard() {
  const { user, location, unit, setUnit, language, lowBandwidth } = useApp();
  const { data, isPending, error, refetch, isFetching, dataUpdatedAt } = useWeather();
  if (isPending) return <Loading />;
  if (error || !data)
    return (
      <ErrorState
        message={error?.message || "No forecast available."}
        retry={() => void refetch()}
      />
    );
  const { weather: w, risk } = data;
  const best = actionWindows(w.hourly.slice(0, 48))[0];
  const tomorrow = w.daily[1];
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">YOUR DAY, A LITTLE CLEARER</p>
          <h1>
            {language === "hi"
              ? "आपका मौसम, एक नज़र में।"
              : "A clearer outlook for your day."}
          </h1>
          <p>
            {language === "hi"
              ? `नमस्ते, ${user.name}।`
              : `Welcome back, ${user.name.split(" ")[0]}.`}{" "}
            Here’s what the weather means for you.
          </p>
        </div>
        <div className="heading-date">
          <CalendarDays size={17} />
          {new Intl.DateTimeFormat("en-IN", {
            weekday: "short",
            day: "numeric",
            month: "long",
            timeZone: "Asia/Kolkata",
          }).format(new Date())}
          <button
            className="icon-button"
            aria-label="Refresh forecast"
            disabled={isFetching}
            onClick={() => void refetch()}
          >
            <RefreshCw size={16} className={isFetching ? "spin" : ""} />
          </button>
        </div>
      </div>
      <div className="forecast-live-bar"><span><i className={isFetching?'refreshing':''}/>{isFetching?'Checking the provider…':`Auto-refresh every ${lowBandwidth?'5 minutes':'60 seconds'}`}</span><span>Last checked {dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'}) : '—'} · Model forecasts update at the provider’s cadence</span></div>
      {w.error && (
        <div className="notice amber">
          <CloudRain size={19} />
          {w.error}
        </div>
      )}
      <div className="dashboard-top">
        <div className="weather-hero">
          <div className="hero-top">
            <div>
              <div className="hero-location">
                <MapPin size={17} />
                {location.name}, {location.state}
              </div>
              <span className="hero-observation">
                Model conditions · {timeLabel(w.current.time)} IST
              </span>
            </div>
            <div className="temperature-toggle">
              <button
                className={unit === "c" ? "active" : ""}
                onClick={() => setUnit("c")}
              >
                °C
              </button>
              <button
                className={unit === "f" ? "active" : ""}
                onClick={() => setUnit("f")}
              >
                °F
              </button>
            </div>
          </div>
          <div className="current-main">
            <div>
              <div className="big-temperature">
                {temperature(w.current.temperature, unit)}
                <span>°</span>
              </div>
              <h2>{condition(w.current.code)}</h2>
              <p>
                Feels like {temperature(w.current.apparent, unit)}°{" "}
                <span>·</span> H: {temperature(w.daily[0].high, unit)}° L:{" "}
                {temperature(w.daily[0].low, unit)}°
              </p>
            </div>
            <div className="atmosphere-art">
              <div className="sun-orb" />
              <div className="cloud cloud-back" />
              <div className="cloud cloud-front" />
              <div className="sun-ray ray-one" />
              <div className="sun-ray ray-two" />
            </div>
          </div>
          <div className="hero-metrics">
            {[
              [Droplets, "Humidity", `${w.current.humidity}%`],
              [Wind, "Wind", `${w.current.wind} km/h`],
              [
                Eye,
                "Visibility",
                w.current.visibility === null
                  ? "Unavailable"
                  : `${(w.current.visibility / 1000).toFixed(1)} km`,
              ],
              [Gauge, "Pressure", `${Math.round(w.current.pressure)} hPa`],
            ].map(([Icon, label, value]) => {
              const I = Icon as typeof Wind;
              return (
                <div key={String(label)}>
                  <I size={18} />
                  <span>{String(label)}</span>
                  <strong>{String(value)}</strong>
                </div>
              );
            })}
          </div>
          <div className="hero-bottom">
            <SourceBadge weather={w} />
            <span>
              <Sunrise size={15} />
              {timeLabel(w.daily[0].sunrise)}
              <Sunset size={15} />
              {timeLabel(w.daily[0].sunset)}
            </span>
          </div>
        </div>
        <div className="outlook-card card">
          <div className="outlook-icon">
            <ShieldCheck size={24} />
          </div>
          <div className="eyebrow">YOUR WEATHER OUTLOOK</div>
          <h2>
            {risk.level === "Safe"
              ? "A good day to plan ahead."
              : `${risk.level}: stay weather-aware.`}
          </h2>
          <p>{risk.actions[0]}</p>
          <Badge tone={risk.level === "Safe" ? "teal" : "amber"}>
            {risk.level === "Safe" ? "No derived hazard detected" : risk.level}
          </Badge>
          <div className="outlook-divider" />
          <div className="outlook-foot">
            <strong>{risk.confidence} confidence</strong>
            <span>Single provider · deterministic rules</span>
          </div>
          <Link className="text-link" href="/alerts">
            View alerts & guidance <ArrowRight size={16} />
          </Link>
        </div>
      </div>
      <div className="dashboard-middle">
        <ForecastChart weather={w} />
        <div className="card ai-card">
          <div className="ai-icon">
            <Sparkles size={22} />
          </div>
          <span className="eyebrow">LESS GUESSWORK. BETTER DECISIONS.</span>
          <h2>Just ask the weather.</h2>
          <p>
            Real questions. Clear answers.
            <br />
            Backed by weather data.
          </p>
          <div className="prompt-list">
            {[
              "Will it rain this evening?",
              "Can I spray my crops tomorrow?",
              "Best time for outdoor work?",
            ].map((q) => (
              <Link key={q} href={`/chat?q=${encodeURIComponent(q)}`}>
                {q}
                <ArrowUpRight size={16} />
              </Link>
            ))}
          </div>
          <Link href="/chat" className="btn wide">
            Ask WeatherGPT <Sparkles size={16} />
          </Link>
          <small>Standard explanation mode · no AI key required</small>
        </div>
      </div>
      <div className="dashboard-lower">
        <div className="card seven-day">
          <SectionTitle title="Your week at a glance">
            <span className="muted">7-day forecast</span>
          </SectionTitle>
          <div className="daily-grid">
            {w.daily.map((d, i) => (
              <details key={d.date} className={i === 0 ? "today" : ""}>
                <summary>
                  <span>{i === 0 ? "Today" : dayLabel(d.date)}</span>
                  <WeatherIcon code={d.code} size={31} />
                  <strong>
                    {temperature(d.high, unit)}°{" "}
                    <small>{temperature(d.low, unit)}°</small>
                  </strong>
                  <span className="rain-chance">
                    <Droplets size={12} />
                    {d.rainProbability}%
                  </span>
                </summary>
                <p>
                  {condition(d.code)}
                  <br />
                  {d.precipitation} mm
                  <br />
                  {d.wind} km/h
                </p>
              </details>
            ))}
          </div>
          <div className="forecast-note">
            <CalendarDays size={14} /> Planning ahead? Forecasts become less
            certain further into the week.
          </div>
        </div>
        <div className="card action-card">
          <SectionTitle title="A little preparation goes a long way" />
          <div className="recommendation">
            <span className="recommend-icon blue">
              <Navigation size={20} />
            </span>
            <div>
              <strong>For your next journey</strong>
              <p>
                {tomorrow.rainProbability >= 40
                  ? "Keep an umbrella handy tomorrow."
                  : "Check your route forecast before you leave."}
              </p>
            </div>
          </div>
          <div className="recommendation">
            <span className="recommend-icon teal">
              <Leaf size={20} />
            </span>
            <div>
              <strong>Your next farm-work window</strong>
              <p>
                {best
                  ? `${dayLabel(best.start)}, ${timeLabel(best.start)}–${timeLabel(best.end)} · ${best.status}`
                  : "Check the farm advisory for available windows."}
              </p>
            </div>
          </div>
          <Link className="text-link" href="/advisories">
            Explore farm advisory <ArrowRight size={16} />
          </Link>
        </div>
      </div>
      <div className="bottom-source">
        <ShieldCheck size={15} />
        <p>
          WeatherGPT provides decision support and does not replace official
          emergency instructions.{" "}
          <Link href="/data-sources">
            Understand our data <ArrowUpRight size={12} />
          </Link>
        </p>
        <ArrowDown size={14} />
      </div>
    </>
  );
}
