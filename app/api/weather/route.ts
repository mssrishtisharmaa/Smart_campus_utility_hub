import { route, apiUser } from "@/lib/security";
import { getWeather } from "@/lib/weather/provider";
import { placeSchema } from "@/lib/validation";
import { calculateRisk } from "@/lib/risk/engine";
export async function POST(req: Request) {
  return route(async () => {
    await apiUser(req);
    const location = placeSchema.parse(await req.json());
    const weather = await getWeather(location);
    return { weather, risk: calculateRisk(weather) };
  });
}
