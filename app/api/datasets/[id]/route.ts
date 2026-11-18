import { route, rateLimit, ApiError } from "@/lib/security";
import { fetchJson } from "@/lib/weather/provider";
import { datasets } from "@/lib/datasets";
import { z } from "zod";
const cache = new Map<string, { at: number; data: unknown }>();
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return route(async () => {
    rateLimit(`dataset:${req.headers.get("x-forwarded-for") || "local"}`, 15);
    const { id } = await params;
    const dataset = datasets.find((d) => d.id === id);
    if (!dataset || dataset.status !== "Public API adapter")
      throw new ApiError(
        400,
        "This source is not connected. See the catalogue for its access requirements.",
      );
    const url = new URL(req.url);
    const lat = z.coerce
      .number()
      .min(-90)
      .max(90)
      .parse(url.searchParams.get("lat") || 28.6139);
    const lon = z.coerce
      .number()
      .min(-180)
      .max(180)
      .parse(url.searchParams.get("lon") || 77.209);
    const coords = `latitude=${lat}&longitude=${lon}`;
    const key = `${id}:${lat}:${lon}`;
    const existing = cache.get(key);
    if (existing && Date.now() - existing.at < 3600000)
      return { ...(existing.data as object), state: "cached" };
    const endpoints: Record<string, string> = {
      forecast: `https://api.open-meteo.com/v1/forecast?${coords}&hourly=temperature_2m,precipitation_probability,wind_speed_10m&forecast_days=2&timezone=Asia%2FKolkata`,
      gfs: `https://api.open-meteo.com/v1/gfs?${coords}&hourly=temperature_2m,precipitation_probability,wind_speed_10m&forecast_days=2&timezone=Asia%2FKolkata`,
      era5: `https://archive-api.open-meteo.com/v1/archive?${coords}&start_date=2025-01-01&end_date=2025-12-31&daily=temperature_2m_mean,precipitation_sum&models=era5&timezone=Asia%2FKolkata`,
      "air-quality": `https://air-quality-api.open-meteo.com/v1/air-quality?${coords}&hourly=pm10,pm2_5,european_aqi&forecast_days=1&timezone=Asia%2FKolkata`,
      marine:
        "https://marine-api.open-meteo.com/v1/marine?latitude=18.8&longitude=72.5&hourly=wave_height,wave_direction,wave_period&forecast_days=2&timezone=Asia%2FKolkata",
      "nasa-power": `https://power.larc.nasa.gov/api/temporal/daily/point?parameters=T2M,RH2M,PRECTOTCORR,ALLSKY_SFC_SW_DWN&community=AG&longitude=${lon}&latitude=${lat}&start=20250101&end=20250131&format=JSON`,
    };
    try {
      const raw = await fetchJson(endpoints[id]);
      const result = {
        dataset: dataset.name,
        organization: dataset.organization,
        source: dataset.url,
        retrievedAt: new Date().toISOString(),
        state: "live",
        isDemo: false,
        location:
          id === "marine"
            ? "Mumbai coastal sample (18.8 N, 72.5 E)"
            : { latitude: lat, longitude: lon },
        data: raw,
      };
      if (cache.size > 100) cache.delete(cache.keys().next().value!);
      cache.set(key, { at: Date.now(), data: result });
      return result;
    } catch {
      throw new ApiError(
        502,
        "The public source did not respond successfully. Retry later; no demonstration values have been substituted.",
      );
    }
  });
}
