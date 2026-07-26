import "server-only";

import type { Plan, UsageMetric } from "@prisma/client";

export const PLAN_LIMITS: Record<
  Plan,
  { uploads: number; aiGenerations: number; aiExplanations: number; aiSolutions: number; maxFileBytes: number }
> = {
  FREE: {
    uploads: 3,
    aiGenerations: 2,
    aiExplanations: 20,
    aiSolutions: 20,
    maxFileBytes: 10 * 1024 * 1024,
  },
  PRO: {
    uploads: 50,
    aiGenerations: 50,
    aiExplanations: 500,
    aiSolutions: 500,
    maxFileBytes: 50 * 1024 * 1024,
  },
};

export const PLAN_PRICES = {
  monthly: {
    label: "Monthly",
    amount: "$5",
    cadence: "month",
    priceId: () => process.env.STRIPE_PRICE_PRO_MONTHLY,
  },
  yearly: {
    label: "Yearly",
    amount: "$30",
    cadence: "year",
    priceId: () => process.env.STRIPE_PRICE_PRO_YEARLY,
  },
} as const;

export type BillingInterval = keyof typeof PLAN_PRICES;

export function getPriceId(interval: BillingInterval) {
  const priceId = PLAN_PRICES[interval].priceId();
  if (!priceId) throw new Error(`Stripe ${interval} Price ID is not configured`);
  return priceId;
}

export function isProPrice(priceId: string) {
  return [process.env.STRIPE_PRICE_PRO_MONTHLY, process.env.STRIPE_PRICE_PRO_YEARLY].includes(priceId);
}

export function metricLimit(plan: Plan, metric: UsageMetric) {
  const limits = PLAN_LIMITS[plan];
  const values: Record<UsageMetric, number> = {
    UPLOAD: limits.uploads,
    AI_GENERATE: limits.aiGenerations,
    AI_EXPLAIN: limits.aiExplanations,
    AI_SOLVE: limits.aiSolutions,
  };
  return values[metric];
}
