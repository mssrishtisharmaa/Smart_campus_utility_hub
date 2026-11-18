import { z } from "zod";
import { route, apiUser } from "@/lib/security";
import { placeSchema } from "@/lib/validation";
import { getWeather } from "@/lib/weather/provider";
import { actionWindows, calculateRisk } from "@/lib/risk/engine";
import { saveRecord } from "@/lib/repository";
export async function POST(req: Request) {
  return route(async () => {
    const user = await apiUser(req);
    const input = z
      .object({
        location: placeSchema,
        activity: z.string().min(3).max(80),
        crop: z.string().min(2).max(80),
        stage: z.string().max(80),
        day: z.enum(["today", "tomorrow", "next48"]),
      })
      .parse(await req.json());
    const w = await getWeather(input.location);
    const now = new Date();
    const target = new Intl.DateTimeFormat("en-CA", {
      timeZone: input.location.timezone,
    }).format(new Date(+now + (input.day === "tomorrow" ? 86400000 : 0)));
    const hours = w.hourly.filter((h) =>
      input.day === "next48"
        ? new Date(h.time).getTime() < Date.now() + 48 * 3600000
        : new Intl.DateTimeFormat("en-CA", {
            timeZone: input.location.timezone,
          }).format(new Date(h.time)) === target,
    );
    const windows = actionWindows(hours, input.activity);
    const result = {
      ...input,
      windows,
      evidence: {
        source: w.provider,
        state: w.state,
        retrievedAt: w.retrievedAt,
        confidence: calculateRisk(w).confidence,
      },
      notice:
        "Demonstration agronomic rules; regional expert validation is required. Follow the product label and local agronomist guidance.",
    };
    await saveRecord(user, "generated_advisories", result);
    return result;
  });
}
