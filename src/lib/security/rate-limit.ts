/**
 * PULL-IA — Rate Limiter
 *
 * Uses Upstash Redis for distributed rate limiting across Vercel serverless
 * functions. Protects public API endpoints from abuse.
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextRequest, NextResponse } from "next/server";

const isRedisConfigured = Boolean(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
);

// Different limits for different endpoints (only initialized if Redis credentials exist)
const limits = isRedisConfigured
  ? {
      subscribe: new Ratelimit({
        redis: Redis.fromEnv(),
        limiter: Ratelimit.slidingWindow(5, "1 h"), // 5 subscribe attempts per hour per IP
        analytics: true,
        prefix: "pull-ia:subscribe",
      }),
      api: new Ratelimit({
        redis: Redis.fromEnv(),
        limiter: Ratelimit.slidingWindow(60, "1 m"), // 60 requests per minute
        analytics: true,
        prefix: "pull-ia:api",
      }),
    }
  : null;

type LimitType = "subscribe" | "api";

/**
 * Apply rate limiting to a request.
 * Returns a 429 response if the limit is exceeded, null otherwise.
 */
export async function applyRateLimit(
  request: NextRequest,
  type: LimitType = "api"
): Promise<NextResponse | null> {
  if (!limits) {
    return null; // Bypass rate limiting if Redis credentials are not configured
  }

  // Get client IP (Vercel provides X-Forwarded-For)
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    "anonymous";

  const { success, limit, remaining, reset } = await limits[type].limit(ip);

  if (!success) {
    return NextResponse.json(
      {
        success: false,
        error: "Too many requests. Please try again later.",
      },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": limit.toString(),
          "X-RateLimit-Remaining": remaining.toString(),
          "X-RateLimit-Reset": reset.toString(),
          "Retry-After": Math.ceil((reset - Date.now()) / 1000).toString(),
        },
      }
    );
  }

  return null;
}

/**
 * Verify cron secret to protect internal endpoints.
 * Call this at the start of every /api/cron/* route.
 */
export function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error("CRON_SECRET is not configured");
    return false;
  }

  return authHeader === `Bearer ${cronSecret}`;
}
