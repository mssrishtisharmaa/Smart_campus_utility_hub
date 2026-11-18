import { cookies } from "next/headers";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { route, sameOrigin, rateLimit, ApiError } from "@/lib/security";
import { connected, serverClient } from "@/lib/supabase/server";
import { db, demoEnabled, hashPassword, verifyPassword } from "@/lib/local-db";
import { demoSession, getUser } from "@/lib/auth";
import { authErrorMessage, credentialsSchema, emailRequestSchema, EMAIL_UNAVAILABLE, newPasswordSchema, registrationSchema } from "@/lib/auth-validation";
import { REMEMBER_COOKIE } from "@/lib/session-cookies";
export async function POST(
  req: Request,
  { params }: { params: Promise<{ action: string }> },
) {
  return route(async () => {
    sameOrigin(req);
    rateLimit(`auth:${req.headers.get("x-forwarded-for") || "local"}`, 30);
    const { action } = await params;
    if (action === "logout") {
      if (connected()) {
        const {error} = await (await serverClient()).auth.signOut({scope:"local"});
        if (error && error.status !== 401 && error.status !== 403) throw new ApiError(503,"Sign-out could not complete. Please try again.");
      }
      (await cookies()).delete("wg-demo");
      (await cookies()).delete(REMEMBER_COOKIE);
      return { ok: true };
    }
    if (action === "reset" || action === "resend") {
      const { email } = emailRequestSchema.parse(await req.json());
      if (!connected())
        throw new ApiError(
          503,
          "Password recovery requires connected Supabase and an email provider. Demo accounts are available below.",
        );
      if (process.env.AUTH_EMAIL_ENABLED !== "true") throw new ApiError(503, EMAIL_UNAVAILABLE);
      rateLimit(`auth-email:${email}`, 3);
      const client = await serverClient();
      const callback = `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`;
      const { error } = action === "reset"
        ? await client.auth.resetPasswordForEmail(email, {redirectTo: `${callback}?next=/reset-password`})
        : await client.auth.resend({type:"signup", email, options:{emailRedirectTo:callback}});
      if (error) throw new ApiError(error.status === 429 ? 429 : 400, authErrorMessage(error,"Unable to send the email. Please try again later."));
      return { ok: true };
    }
    if (action === "update-password") {
      const user = await getUser();
      if (!connected() || !user)
        throw new ApiError(
          401,
          "Open the recovery link from your email first.",
        );
      const { password } = z
        .object({ password: newPasswordSchema })
        .parse(await req.json());
      if (user.email.endsWith("@weathergpt.demo")) throw new ApiError(403,"Shared demo passwords cannot be changed in this app. Use a personal account.");
      const { error } = await (
        await serverClient()
      ).auth.updateUser({ password });
      if (error) throw new ApiError(400, authErrorMessage(error,"Your password could not be changed. Open a fresh recovery link and try again."));
      return { ok: true };
    }
    if (!["login", "register"].includes(action))
      throw new ApiError(404, "Unknown authentication action.");
    const body = await req.json();
    const v = action === "register" ? registrationSchema.parse(body) : credentialsSchema.parse(body);
    if(v.email.toLowerCase().endsWith('@weathergpt.demo')&&!demoEnabled())throw new ApiError(403,'Demonstration accounts are disabled on this deployment.');
    if (connected()) {
      if (action === "register" && process.env.AUTH_EMAIL_ENABLED !== "true") throw new ApiError(503, EMAIL_UNAVAILABLE);
      const jar = await cookies();
      jar.set(REMEMBER_COOKIE, v.remember ? "1" : "0", {path:"/",sameSite:"lax",secure:process.env.NODE_ENV === "production",...(v.remember ? {maxAge:604800} : {})});
      const s = await serverClient();
      if (action === "register") {
        const registration = registrationSchema.parse(body);
        const { data, error } = await s.auth.signUp({
          email: v.email,
          password: v.password,
          options: {
            data: {
              display_name: registration.name,
              persona: registration.persona,
            },
            emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
          },
        });
        if (error) throw new ApiError(error.status === 429 ? 429 : 400, authErrorMessage(error,"Unable to create the account. Try signing in or requesting a new confirmation email."));
        return { ok: true, confirmation: !data.session };
      }
      const { error } = await s.auth.signInWithPassword({
        email: v.email,
        password: v.password,
      });
      if (error) throw new ApiError(error.status === 429 ? 429 : 401, authErrorMessage(error,"Email or password is incorrect."));
      return { ok: true };
    }
    if (!demoEnabled())
      throw new ApiError(503, "Configure Supabase before signing in.");
    if (action === "register") {
      const registration = registrationSchema.parse(body);
      if (
        db()
          .prepare("SELECT id FROM users WHERE email=?")
          .get(v.email.toLowerCase())
      )
        throw new ApiError(409, "An account with this email already exists.");
      const id = randomUUID();
      db()
        .prepare("INSERT INTO users VALUES(?,?,?,?,?,?)")
        .run(
          id,
          v.email.toLowerCase(),
          hashPassword(v.password),
          registration.name,
          "citizen",
          registration.persona,
        );
      await demoSession(id, Boolean(v.remember));
      return { ok: true };
    }
    const row = db()
      .prepare("SELECT * FROM users WHERE email=?")
      .get(v.email.toLowerCase());
    if (!row || !verifyPassword(v.password, String(row.password)))
      throw new ApiError(401, "Email or password is incorrect.");
    await demoSession(String(row.id), Boolean(v.remember));
    return { ok: true };
  });
}
