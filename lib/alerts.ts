import type { Alert, Place, User, Weather } from "@/types";

export const isDemoAccount = (user: User) => user.mode === "local-demo" || user.demoAccount === true;
export type AlertCheck = { location: string; state: "checked" | "demo" | "unavailable"; retrievedAt: string | null; message: string };
export type AlertFeed = { audience: "demo" | "personal"; alerts: Alert[]; notificationIds: string[]; checks: AlertCheck[]; checkedAt: string; omittedLocations: number };
export const ALERT_RULES = { version: "weather-alerts-1", rain24h: 30, windKmh: 40, apparentC: 38, visibilityM: 1000 };

export function forecastAlerts(weather: Weather, now = Date.now()): Alert[] {
  const age = now - Date.parse(weather.retrievedAt);
  if (weather.isDemo || !["live", "cached"].includes(weather.state) || !Number.isFinite(age) || age < -60000 || age > 600000) return [];
  const hour = Math.floor(now / 3600000) * 3600000;
  const hours = weather.hourly.filter(h => Date.parse(h.time) >= hour && Date.parse(h.time) < hour + 24 * 3600000);
  const alerts: Alert[] = [];
  const add = (hazard: string, title: string, description: string, instructions: string, start = hour, end = hour + 3600000) => {
    if (end <= now) return;
    alerts.push({id:`forecast:${weather.location.latitude.toFixed(3)}:${weather.location.longitude.toFixed(3)}:${hazard}:${start}`,title,description:`${description} Forecast-based guidance; not an official warning.`,instructions,severity:"Advisory",origin:"derived",hazard_type:hazard,source_name:weather.provider,source_url:"https://open-meteo.com/en/docs",issued_at:weather.retrievedAt,valid_from:new Date(start).toISOString(),valid_to:new Date(end).toISOString(),location_name:weather.location.name,latitude:weather.location.latitude,longitude:weather.location.longitude,is_demo:false,published:true});
  };
  const currentTime = Date.parse(weather.current.time);
  const currentFresh = Number.isFinite(currentTime) && currentTime <= now + 900000 && currentTime > now - 5400000;
  if (currentFresh && weather.current.apparent >= ALERT_RULES.apparentC) add("Heat wave","High feels-like temperature",`Feels like ${weather.current.apparent.toFixed(1)} °C; the platform threshold is ${ALERT_RULES.apparentC} °C.`,"Reduce strenuous outdoor activity, stay hydrated and follow local guidance.");
  if (currentFresh && weather.current.visibility !== null && weather.current.visibility < ALERT_RULES.visibilityM) add("Fog","Reduced visibility",`Model visibility is ${Math.round(weather.current.visibility)} m; the platform threshold is ${ALERT_RULES.visibilityM} m.`,"Allow extra travel time, reduce speed and check local conditions.");
  const wind = hours.find(h=>h.wind >= ALERT_RULES.windKmh);
  if (wind) add("Strong wind","Strong wind forecast",`Wind of ${wind.wind.toFixed(1)} km/h is forecast; the platform threshold is ${ALERT_RULES.windKmh} km/h.`,"Secure loose objects and avoid exposed outdoor work.",Date.parse(wind.time),Date.parse(wind.time)+3600000);
  const storm = hours.find(h=>[95,96,99].includes(h.code));
  if (storm) add("Thunderstorm","Thunderstorm potential",`The forecast weather code indicates a thunderstorm during this hour. This is not lightning detection.`,"Move indoors if you hear thunder; avoid open fields and isolated trees.",Date.parse(storm.time),Date.parse(storm.time)+3600000);
  const contiguous = hours.length === 24 && hours.every((h,i)=>Date.parse(h.time)===hour+i*3600000);
  const rain = hours.reduce((total,h)=>total+h.precipitation,0);
  if (contiguous && rain >= ALERT_RULES.rain24h) add("Heavy rain","Heavy rainfall potential",`${rain.toFixed(1)} mm is forecast over the next 24 hourly periods; the platform threshold is ${ALERT_RULES.rain24h} mm.`,"Avoid waterlogged roads and monitor official local warnings.",hour,hour+24*3600000);
  return alerts;
}

export function demoAlerts(location: Place, now = Date.now()): Alert[] {
  const slot = Math.floor(now / 900000) * 900000;
  const scenarios = [
    ["Heavy rain", "Heavy rain demonstration", "Practice responding to rainfall and waterlogging.", "Avoid waterlogged roads in this exercise."],
    ["Strong wind", "Strong wind demonstration", "Practice securing loose outdoor items.", "Move lightweight objects indoors in this exercise."],
    ["Heat wave", "Heat precaution demonstration", "Practice planning a safer afternoon routine.", "Plan rest, shade and hydration in this exercise."],
  ];
  return [0,1].map(offset=>{
    const [hazard,title,description,instructions] = scenarios[(Math.floor(slot/900000)+offset)%scenarios.length];
    return {id:`demo:${location.latitude.toFixed(3)}:${location.longitude.toFixed(3)}:${slot}:${offset}`,title,description:`Simulated scenario only. ${description} This does not describe current weather.`,instructions,severity:offset ? "Watch" : "Advisory",origin:"derived",hazard_type:hazard,source_name:"WeatherGPT demonstration simulator",source_url:"",issued_at:new Date(slot).toISOString(),valid_from:new Date(slot+offset*900000).toISOString(),valid_to:new Date(slot+(offset+1)*900000).toISOString(),location_name:location.name,latitude:location.latitude,longitude:location.longitude,is_demo:true,published:true} satisfies Alert;
  });
}
