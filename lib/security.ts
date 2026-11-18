import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import type { User } from "@/types";
const buckets = new Map<string, { count: number; reset: number }>();
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export function rateLimit(key: string, max = 60) {
  const now = Date.now();
  if (buckets.size > 10000)
    for (const [k, v] of buckets) if (v.reset < now) buckets.delete(k);
  let b = buckets.get(key);
  if (!b || b.reset < now) {
    b = { count: 0, reset: now + 60000 };
    buckets.set(key, b);
  }
  if (++b.count > max)
    throw new ApiError(
      429,
      "Too many requests. Please wait a minute and try again.",
    );
}
export function sameOrigin(request: Request) {
  if (!["GET", "HEAD", "OPTIONS"].includes(request.method)) {
    const origin = request.headers.get("origin");
    const expected = new URL(request.url).origin;
    const configured = process.env.NEXT_PUBLIC_APP_URL;
    const port=new URL(request.url).port||'3000';
    const localOrigins=process.env.NODE_ENV!=='production'?[`http://127.0.0.1:${port}`,`http://localhost:${port}`]:[];
    if(request.headers.get('sec-fetch-site')==='cross-site')throw new ApiError(403,'Cross-site request not permitted.');
    if (origin && origin !== expected && origin !== configured && !localOrigins.includes(origin))
      throw new ApiError(403, "Request origin not permitted.");
  }
}
export async function apiUser(request: Request, admin = false): Promise<User> {
  sameOrigin(request);
  const user = await getUser();
  if (!user) throw new ApiError(401, "Please sign in to continue.");
  if (admin && user.role !== "admin")
    throw new ApiError(403, "Administrator role required.");
  rateLimit(user.id);
  return user;
}
export async function route(handler: () => Promise<unknown>) {
  const requestId = crypto.randomUUID();
  try {
    return NextResponse.json(await handler(), {
      headers: {
        "X-Request-ID": requestId,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (e) {
    const status =
      e instanceof ApiError
        ? e.status
        : e instanceof Error && e.name === "ZodError"
          ? 400
          : 500;
    return NextResponse.json(
      {
        error:
          status === 500
            ? "The request could not be completed. Please retry."
            : e instanceof Error
              ? e.message
              : "Invalid request",
        requestId,
      },
      { status, headers: { "X-Request-ID": requestId } },
    );
  }
}
