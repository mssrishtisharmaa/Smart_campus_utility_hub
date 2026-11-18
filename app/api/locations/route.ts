import { z } from "zod";
import { route, rateLimit } from "@/lib/security";
import { resolvePlace } from "@/lib/weather/provider";
export async function GET(req: Request) {
  return route(async () => {
    rateLimit(`geocode:${req.headers.get("x-forwarded-for") || "local"}`, 60);
    const q = z
      .string()
      .min(2)
      .max(120)
      .parse(new URL(req.url).searchParams.get("q"));
    return resolvePlace(q);
  });
}
