import { route, apiUser } from "@/lib/security";
import { placeSchema } from "@/lib/validation";
import { buildAlertFeed } from "@/lib/alert-feed";

export async function POST(req: Request) {
  return route(async()=>{
    const user = await apiUser(req);
    const location = placeSchema.parse(await req.json());
    return buildAlertFeed(user,location);
  });
}
