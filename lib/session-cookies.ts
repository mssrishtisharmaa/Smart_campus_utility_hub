import type { CookieOptions } from "@supabase/ssr";

export const REMEMBER_COOKIE = "wg-remember";
export function sessionCookieOptions(options: CookieOptions, remember: boolean): CookieOptions {
  // Deletion instructions must retain their expiry, including chunk cleanup.
  if (remember || options.maxAge === 0) return options;
  const sessionOptions = { ...options };
  delete sessionOptions.maxAge;
  delete sessionOptions.expires;
  return sessionOptions;
}
