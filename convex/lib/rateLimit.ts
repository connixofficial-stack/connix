import type { MutationCtx, QueryCtx } from "../_generated/server";
import { HOUR, MINUTE, RateLimiter } from "@convex-dev/rate-limiter";
import { components } from "../_generated/api";

export const RATE_LIMITS = {
  contactSubmit: { kind: "token bucket", rate: 3, period: MINUTE, capacity: 5 },
  dangerous: { kind: "token bucket", rate: 1, period: MINUTE, capacity: 10 },
  mutation: { kind: "token bucket", rate: 10, period: MINUTE, capacity: 100 },
  query: { kind: "token bucket", rate: 50, period: MINUTE, capacity: 500 },
  auth: { kind: "token bucket", rate: 5, period: HOUR, capacity: 5 },
  aiChat: { kind: "token bucket", rate: 6, period: MINUTE, capacity: 12 },
  pageViewTrack: { kind: "token bucket", rate: 30, period: MINUTE, capacity: 120 },
  publicBooking: { kind: "token bucket", rate: 3, period: MINUTE, capacity: 10 },
  usageTrack: { kind: "token bucket", rate: 20, period: MINUTE, capacity: 60 },
} as const;

type RateLimitType = keyof typeof RATE_LIMITS;
type RateLimitResult = { allowed: boolean; remaining: number; resetIn: number };

const rateLimiter = new RateLimiter(components.rateLimiter, RATE_LIMITS);

// Dangerous mutations list
const DANGEROUS_MUTATIONS = [
  "seedAll", "clearAll", "bulkRemove", "remove",
  "clearPostsData", "clearProductsData", "clearPromotionsData",
  "seedPostsModule", "seedProductsModule", "seedPromotionsModule",
];

export function getRateLimitType(mutationName: string): RateLimitType {
  if (DANGEROUS_MUTATIONS.some(d => mutationName.includes(d))) {
    return "dangerous";
  }
  if (mutationName.includes("Login") || mutationName.includes("verify")) {
    return "auth";
  }
  return "mutation";
}

export async function checkRateLimit(
  ctx: MutationCtx | QueryCtx,
  identifier: string,
  type: RateLimitType = "mutation"
): Promise<RateLimitResult> {
  const status = await rateLimiter.check(ctx, type, { key: identifier });
  return {
    allowed: status.ok,
    remaining: status.ok ? 1 : 0,
    resetIn: status.retryAfter ?? 0,
  };
}

export async function consumeRateLimit(
  ctx: MutationCtx,
  identifier: string,
  type: RateLimitType = "mutation"
): Promise<RateLimitResult> {
  const status = await rateLimiter.limit(ctx, type, { key: identifier });
  return {
    allowed: status.ok,
    remaining: status.ok ? 1 : 0,
    resetIn: status.retryAfter ?? 0,
  };
}

export async function resetRateLimit(
  ctx: MutationCtx,
  identifier: string,
  type: RateLimitType = "mutation"
) {
  await rateLimiter.reset(ctx, type, { key: identifier });
}

export function getClientIdentifier(): string {
  return "global";
}
