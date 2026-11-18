import { route, apiUser } from "@/lib/security";
import { listRecords } from "@/lib/repository";
import { providerHealth } from "@/lib/weather/provider";
import { serverClient } from "@/lib/supabase/server";
import { db } from "@/lib/local-db";
export async function GET(req: Request) {
  return route(async () => {
    const user = await apiUser(req, true);
    const [alerts, reports, conversations, audit] = await Promise.all([
      listRecords(user, "alerts", true),
      listRecords(user, "community_reports", true),
      listRecords(user, "conversations", true),
      listRecords(user, "audit_logs", true),
    ]);
    let users: unknown[] = [];
    if (user.mode === "supabase") {
      const { data, error } = await (
        await serverClient()
      )
        .from("profiles")
        .select("id,display_name,persona,created_at");
      if (error) throw error;
      users = data || [];
    } else
      users = db()
        .prepare("SELECT id,email,name AS display_name,role,persona FROM users")
        .all();
    return {
      alerts,
      reports,
      conversations,
      audit,
      users,
      health: providerHealth,
      mode: user.mode,
    };
  });
}
