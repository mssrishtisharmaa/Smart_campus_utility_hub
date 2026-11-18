import "server-only";
import { createHash } from "node:crypto";
import { z } from "zod";
import type { Weather, Place, Hour, Day, Alert } from "@/types";
import { places } from "@/lib/locations";
export interface WeatherProvider {
  getWeather(location: Place): Promise<Weather>;
}
export interface AlertProvider {
  getAlerts(area: string): Promise<Alert[]>;
}
export interface ClimateProvider {
  getClimateSeries(location: Place, year: number): Promise<ClimatePoint[]>;
}
export type ClimatePoint = {
  month: string;
  temperature: number;
  rainfall: number;
  baseline: number;
  extremeDays: number;
  isDemo: boolean;
};
const currentSchema = z.object({
  temperature_2m: z.number(),
  relative_humidity_2m: z.number(),
  apparent_temperature: z.number(),
  weather_code: z.number(),
  wind_speed_10m: z.number(),
  wind_direction_10m: z.number(),
  surface_pressure: z.number(),
  time: z.number(),
});
const schema = z.object({
  current: currentSchema,
  hourly: z.object({
    time: z.array(z.number()),
    temperature_2m: z.array(z.number()),
    precipitation_probability: z.array(z.number()),
    precipitation: z.array(z.number()),
    wind_speed_10m: z.array(z.number()),
    weather_code: z.array(z.number()),
    visibility: z.array(z.number().nullable()),
  }),
  daily: z.object({
    time: z.array(z.number()),
    temperature_2m_max: z.array(z.number()),
    temperature_2m_min: z.array(z.number()),
    precipitation_probability_max: z.array(z.number()),
    precipitation_sum: z.array(z.number()),
    wind_speed_10m_max: z.array(z.number()),
    weather_code: z.array(z.number()),
    sunrise: z.array(z.number()),
    sunset: z.array(z.number()),
  }),
});
const iso = (n: number) => new Date(n * 1000).toISOString();
const cache = new Map<string, { value: Weather; at: number }>();
export const providerHealth = {
  lastSuccess: null as string | null,
  lastFailure: null as string | null,
  latencyMs: 0,
  failures: 0,
};
export async function fetchJson(url: string) {
  let last: unknown;
  for (let i = 0; i < 2; i++) {
    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(8000),
        cache: "no-store",
      });
      if (!response.ok) throw new Error(`Provider returned ${response.status}`);
      return await response.json();
    } catch (e) {
      last = e;
      if (i === 0) await new Promise((r) => setTimeout(r, 300));
    }
  }
  throw last;
}
export class OpenMeteoProvider implements WeatherProvider {
  async getWeather(location: Place): Promise<Weather> {
    const params = new URLSearchParams({
      latitude: String(location.latitude),
      longitude: String(location.longitude),
      current:
        "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m,surface_pressure",
      hourly:
        "temperature_2m,precipitation_probability,precipitation,wind_speed_10m,weather_code,visibility",
      daily:
        "weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_sum,precipitation_probability_max,wind_speed_10m_max",
      timezone: location.timezone,
      forecast_days: "7",
      timeformat: "unixtime",
    });
    const raw = await fetchJson(
      `${process.env.OPEN_METEO_BASE_URL || "https://api.open-meteo.com"}/v1/forecast?${params}`,
    );
    const d = schema.parse(raw);
    const now = Date.now();
    const hourly: Hour[] = d.hourly.time
      .map((t, i) => ({
        time: iso(t),
        temperature: d.hourly.temperature_2m[i],
        rainProbability: d.hourly.precipitation_probability[i],
        precipitation: d.hourly.precipitation[i],
        wind: d.hourly.wind_speed_10m[i],
        code: d.hourly.weather_code[i],
      }))
      .filter((h) => new Date(h.time).getTime() >= now - 3600000);
    const daily: Day[] = d.daily.time.map((t, i) => ({
      date: iso(t),
      high: d.daily.temperature_2m_max[i],
      low: d.daily.temperature_2m_min[i],
      rainProbability: d.daily.precipitation_probability_max[i],
      precipitation: d.daily.precipitation_sum[i],
      wind: d.daily.wind_speed_10m_max[i],
      code: d.daily.weather_code[i],
      sunrise: iso(d.daily.sunrise[i]),
      sunset: iso(d.daily.sunset[i]),
    }));
    const hi = d.hourly.time.findIndex((t) => t * 1000 >= now - 3600000);
    return {
      location,
      current: {
        temperature: d.current.temperature_2m,
        apparent: d.current.apparent_temperature,
        humidity: d.current.relative_humidity_2m,
        wind: d.current.wind_speed_10m,
        windDirection: d.current.wind_direction_10m,
        pressure: d.current.surface_pressure,
        visibility: d.hourly.visibility[hi] ?? null,
        code: d.current.weather_code,
        time: iso(d.current.time),
      },
      hourly,
      daily,
      provider: "Open-Meteo",
      retrievedAt: new Date().toISOString(),
      issuedAt: null,
      validFrom: hourly[0].time,
      validTo: hourly.at(-1)!.time,
      state: "live",
      isDemo: false,
      hash: createHash("sha256").update(JSON.stringify(raw)).digest("hex"),
      unit: "°C",
    };
  }
}
export class DemoWeatherProvider implements WeatherProvider {
  async getWeather(location: Place): Promise<Weather> {
    const now = new Date();
    now.setMinutes(0, 0, 0);
    const base = 26 + (Math.round(location.latitude) % 7);
    const hourly: Hour[] = Array.from({ length: 168 }, (_, i) => {
      const t = new Date(+now + i * 3600000);
      const h = (t.getUTCHours() + 5.5) % 24;
      return {
        time: t.toISOString(),
        temperature:
          Math.round((base + 4 * Math.sin(((h - 8) * Math.PI) / 12)) * 10) / 10,
        rainProbability: h > 15 && h < 21 ? 65 : 15,
        precipitation: h > 16 && h < 20 ? 2.4 : 0,
        wind: h > 12 && h < 18 ? 17 : 9,
        code: h > 15 && h < 21 ? 61 : 2,
      };
    });
    const daily: Day[] = Array.from({ length: 7 }, (_, i) => {
      const t = new Date(+now + i * 86400000);
      return {
        date: t.toISOString(),
        high: base + 4 + (i % 3),
        low: base - 4,
        rainProbability: i % 2 ? 35 : 65,
        precipitation: i % 2 ? 1 : 9.6,
        wind: 17,
        code: i % 2 ? 2 : 61,
        sunrise: new Date(
          Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate(), 0, 30),
        ).toISOString(),
        sunset: new Date(
          Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate(), 12, 30),
        ).toISOString(),
      };
    });
    return {
      location,
      current: {
        temperature: hourly[0].temperature,
        apparent: hourly[0].temperature + 2,
        humidity: 74,
        wind: hourly[0].wind,
        windDirection: 225,
        pressure: 1008,
        visibility: 8000,
        code: hourly[0].code,
        time: now.toISOString(),
      },
      hourly,
      daily,
      provider: "Deterministic demonstration",
      retrievedAt: new Date().toISOString(),
      issuedAt: null,
      validFrom: hourly[0].time,
      validTo: hourly.at(-1)!.time,
      state: "demo",
      isDemo: true,
      hash: createHash("sha256").update(JSON.stringify(hourly)).digest("hex"),
      unit: "°C",
    };
  }
}
export async function getWeather(location: Place): Promise<Weather> {
  const key = `${location.latitude.toFixed(3)},${location.longitude.toFixed(3)}`;
  const cached = cache.get(key);
  const age = cached ? Date.now() - cached.at : Infinity;
  if (cached && age < 60000)
    return { ...cached.value, state: cached.value.isDemo ? "demo" : "cached" };
  if (process.env.WEATHER_PROVIDER === "demo")
    return new DemoWeatherProvider().getWeather(location);
  const start = Date.now();
  try {
    const value = await new OpenMeteoProvider().getWeather(location);
    providerHealth.lastSuccess = new Date().toISOString();
    providerHealth.latencyMs = Date.now() - start;
    providerHealth.failures = 0;
    if (cache.size > 500) cache.delete(cache.keys().next().value!);
    cache.set(key, { value, at: Date.now() });
    return value;
  } catch {
    providerHealth.failures++;
    providerHealth.lastFailure = new Date().toISOString();
    if (cached)
      return {
        ...cached.value,
        state: "stale",
        error:
          "Weather provider unavailable. Showing the last successful forecast.",
      };
    if (process.env.NEXT_PUBLIC_DEMO_MODE === "true")
      return {
        ...(await new DemoWeatherProvider().getWeather(location)),
        error: "Live provider unavailable. Showing demonstration data.",
      };
    throw new Error("Weather provider unavailable. Please retry shortly.");
  }
}
export async function resolvePlace(query: string): Promise<Place[]> {
  const local = places.filter((p) =>
    `${p.name} ${p.state}`.toLowerCase().includes(query.toLowerCase()),
  );
  if (local.length) return local;
  const data = await fetchJson(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=8&language=en&format=json`,
  );
  const result = z
    .object({
      results: z
        .array(
          z.object({
            id: z.number(),
            name: z.string(),
            admin1: z.string().optional(),
            country: z.string().optional(),
            latitude: z.number(),
            longitude: z.number(),
            timezone: z.string().optional(),
          }),
        )
        .optional(),
    })
    .parse(data);
  return (result.results || []).map((p) => ({
    id: String(p.id),
    name: p.name,
    state: p.admin1 || p.country || "",
    latitude: p.latitude,
    longitude: p.longitude,
    timezone: p.timezone || "Asia/Kolkata",
  }));
}
export class DemoClimateProvider implements ClimateProvider {
  async getClimateSeries(location: Place, year: number) {
    return Array.from({ length: 12 }, (_, i) => ({
      month: new Date(year, i).toLocaleString("en", { month: "short" }),
      temperature:
        Math.round(
          (24 +
            8 * Math.sin(((i - 2) / 12) * Math.PI * 2) +
            location.latitude / 30 +
            (year - 2020) * 0.1) *
            10,
        ) / 10,
      baseline:
        Math.round(
          (24 +
            8 * Math.sin(((i - 2) / 12) * Math.PI * 2) +
            location.latitude / 30) *
            10,
        ) / 10,
      rainfall: [12, 15, 18, 25, 65, 180, 280, 250, 160, 70, 20, 8][i],
      extremeDays: i > 3 && i < 7 ? 4 : 0,
      isDemo: true,
    }));
  }
}
export class ImdAlertProvider implements AlertProvider {
  async getAlerts(): Promise<Alert[]> {
    throw new Error(
      "IMD adapter requires an authorized data agreement and feed configuration.",
    );
  }
}
