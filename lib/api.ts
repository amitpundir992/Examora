import { NextResponse } from "next/server";
import type { z } from "zod";
import { limit } from "./ai/rate-limit";

export function ok<T>(data: T, init?: number) {
  return NextResponse.json(data, { status: init ?? 200 });
}

export function fail(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

/** Validate a JSON body against a schema; returns data or a 400 response. */
export async function parseBody<T>(req: Request, schema: z.ZodType<T>): Promise<{ data: T } | { res: NextResponse }> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return { res: fail("Invalid JSON body") };
  }
  const result = schema.safeParse(body);
  if (!result.success) {
    return { res: fail(result.error.issues.map((i) => i.message).join("; ")) };
  }
  return { data: result.data };
}

/** Simple per-IP guard for AI/mutating endpoints. */
export function guard(req: Request, key: string, max = 20): NextResponse | null {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const { ok: allowed } = limit(`${key}:${ip}`, max);
  return allowed ? null : fail("Rate limit exceeded. Please slow down.", 429);
}

/** Reject cross-site mutations that could abuse an authenticated session cookie. */
export function requireSameOrigin(req: Request): NextResponse | null {
  const origin = req.headers.get("origin");
  if (!origin) return null;

  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL;
  if (!configuredUrl) return fail("Application URL is not configured", 500);

  try {
    return new URL(origin).origin === new URL(configuredUrl).origin
      ? null
      : fail("Invalid request origin", 403);
  } catch {
    return fail("Invalid request origin", 403);
  }
}
