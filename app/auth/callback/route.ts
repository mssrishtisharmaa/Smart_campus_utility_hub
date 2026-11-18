import { NextResponse } from "next/server";
import { connected, serverClient } from "@/lib/supabase/server";
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");
  const recovery = type === "recovery" || url.searchParams.get("next") === "/reset-password";
  let destination = recovery ? "/forgot-password?error=link" : "/login?error=link";
  try {
    if (connected() && !url.searchParams.has("error")) {
      const client = await serverClient();
      const result = code ? await client.auth.exchangeCodeForSession(code)
        : tokenHash && (type === "email" || type === "signup" || type === "recovery")
          ? await client.auth.verifyOtp({ token_hash: tokenHash, type }) : null;
      if (result && !result.error) destination = recovery ? "/reset-password" : "/onboarding";
    }
  } catch {
    // Never reflect provider errors or token values into the redirect.
  }
  const response = NextResponse.redirect(new URL(destination, url.origin));
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}
