import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import { db, demoEnabled, sessionSecret } from "./local-db";
import { connected, serverClient } from "./supabase/server";
import type { User } from "@/types";
export async function getUser(): Promise<User | null> {
  if (connected()) {
    const s = await serverClient();
    const {
      data: { user },
    } = await s.auth.getUser();
    if (!user) return null;
    const [{ data: p }, { data: r }, {data:pref}] = await Promise.all([
      s.from("profiles").select("*").eq("id", user.id).single(),
      s.from("user_roles").select("role").eq("user_id", user.id),
      s.from('user_preferences').select('payload').eq('user_id',user.id).maybeSingle(),
    ]);
    return {
      id: user.id,
      email: user.email || "",
      name: p?.display_name || "Weather explorer",
      persona: ['citizen','farmer','disaster_manager','researcher'].includes(pref?.payload?.persona)?pref!.payload.persona:p?.persona || "citizen",
      role: r?.some((x) => x.role === "admin") ? "admin" : "citizen",
      mode: "supabase",
      demoAccount: user.app_metadata?.account_mode === "demo",
      preferences:pref?.payload||{},
    };
  }
  if (!demoEnabled()) return null;
  const token = (await cookies()).get("wg-demo")?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(sessionSecret()),
      { issuer: "weathergpt-demo", audience: "weathergpt" },
    );
    const row = db()
      .prepare("SELECT id,email,name,role,persona FROM users WHERE id=?")
      .get(String(payload.sub)) as Omit<User, "mode"> | undefined;
    if(!row)return null;
    const pref=db().prepare("SELECT payload FROM records WHERE kind='user_preferences' AND user_id=? LIMIT 1").get(row.id);
    const preferences=pref?JSON.parse(String(pref.payload)):{};
    return {...row,mode:'local-demo',preferences,persona:['citizen','farmer','disaster_manager','researcher'].includes(preferences.persona)?preferences.persona:row.persona};
  } catch {
    return null;
  }
}
export async function requireUser(admin = false) {
  const user = await getUser();
  if (!user) redirect("/login");
  if (admin && user.role !== "admin") redirect("/dashboard?denied=1");
  return user;
}
export async function demoSession(id: string, remember: boolean) {
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(id)
    .setIssuer("weathergpt-demo")
    .setAudience("weathergpt")
    .setIssuedAt()
    .setExpirationTime(remember ? "7d" : "8h")
    .sign(new TextEncoder().encode(sessionSecret()));
  (await cookies()).set("wg-demo", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    ...(remember ? { maxAge: 604800 } : {}),
  });
}
