import "server-only";
import type { Alert, Place, User } from "@/types";
import { demoAlerts, forecastAlerts, isDemoAccount, type AlertFeed } from "@/lib/alerts";
import { listRecords } from "@/lib/repository";
import { placeSchema } from "@/lib/validation";
import { getWeather } from "@/lib/weather/provider";

export async function buildAlertFeed(user: User, selected: Place): Promise<AlertFeed> {
  const demo = isDemoAccount(user);
  const [saved, stored, subscriptions] = await Promise.all([listRecords(user,"saved_locations"),listRecords(user,"alerts"),listRecords(user,"alert_subscriptions")]);
  const places = [selected];
  for (const row of saved) {
    const place = placeSchema.safeParse(row.payload);
    if (place.success && !places.some(p=>Math.abs(p.latitude-place.data.latitude)<0.001 && Math.abs(p.longitude-place.data.longitude)<0.001)) places.push(place.data);
  }
  const monitored = places.slice(0,5);
  const now = Date.now();
  const result: AlertFeed = {audience:demo?"demo":"personal",alerts:[],notificationIds:[],checks:[],checkedAt:new Date(now).toISOString(),omittedLocations:Math.max(0,places.length-monitored.length)};
  const notificationIds = (alerts:Alert[]) => alerts.filter(a=>{
    const matching = subscriptions.filter(s=>String(s.payload.location).toLowerCase()===a.location_name.toLowerCase());
    return !matching.length || matching.some(s=>s.payload.in_app_enabled===true && Array.isArray(s.payload.hazard_types) && s.payload.hazard_types.includes(a.hazard_type));
  }).map(a=>a.id);
  const persisted = stored.map(r=>({id:r.id,...r.payload}) as Alert).filter(a=>a.published && a.is_demo===demo && Date.parse(a.valid_to)>now && monitored.some(p=>Math.abs(p.latitude-a.latitude)<0.1&&Math.abs(p.longitude-a.longitude)<0.1));
  if (demo) {
    result.alerts = [...demoAlerts(selected,now),...persisted];
    result.notificationIds = notificationIds(result.alerts);
    result.checks = [{location:selected.name,state:"demo",retrievedAt:null,message:"Examples rotate every 15 minutes; checked every minute while the app is open."}];
    return result;
  }
  const outcomes = await Promise.all(monitored.map(async place=>{
    try {
      const weather = await getWeather(place);
      const age = now - Date.parse(weather.retrievedAt);
      if (weather.isDemo || !["live","cached"].includes(weather.state) || !Number.isFinite(age) || age>600000 || age< -60000 || !weather.hourly.some(h=>Date.parse(h.time)>=Math.floor(now/3600000)*3600000)) throw new Error("Fresh forecast unavailable");
      return {alerts:forecastAlerts(weather,now),check:{location:place.name,state:"checked" as const,retrievedAt:weather.retrievedAt,message:"Fresh forecast checked against platform thresholds. Not an official warning feed."}};
    } catch {
      return {alerts:[],check:{location:place.name,state:"unavailable" as const,retrievedAt:null,message:"Fresh weather data is unavailable. No simulated data is used for personal alerts."}};
    }
  }));
  result.alerts = [...persisted,...outcomes.flatMap(o=>o.alerts)];
  result.notificationIds = notificationIds(result.alerts);
  result.checks = outcomes.map(o=>o.check);
  return result;
}
