"use client";
import { createBrowserClient, parseCookieHeader, serializeCookieHeader } from "@supabase/ssr";
import { REMEMBER_COOKIE, sessionCookieOptions } from "@/lib/session-cookies";
export function browserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { cookies: {
      getAll: () => parseCookieHeader(document.cookie),
      setAll(items) {
        const remember = !parseCookieHeader(document.cookie).some(c => c.name === REMEMBER_COOKIE && c.value === "0");
        for (const {name, value, options} of items) document.cookie = serializeCookieHeader(name, value, sessionCookieOptions(options, remember));
      },
    } },
  );
}
