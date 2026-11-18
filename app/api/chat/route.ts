import { z } from "zod";
import { route, apiUser, rateLimit } from "@/lib/security";
import { placeSchema } from "@/lib/validation";
import { answerQuery } from "@/lib/ai/chat";
export async function POST(req: Request) {
  return route(async () => {
    const user = await apiUser(req);
    rateLimit(`chat:${user.id}`, 20);
    const { query, location } = z
      .object({ query: z.string().min(2).max(2000), location: placeSchema })
      .parse(await req.json());
    return answerQuery(user, query, location);
  });
}
