import "server-only";

import { Plan, Prisma, UsageMetric } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { metricLimit } from "./plans";

export class QuotaExceededError extends Error {
  constructor(
    public readonly metric: UsageMetric,
    public readonly limit: number,
  ) {
    super(`Monthly ${metric.toLowerCase().replaceAll("_", " ")} limit reached. Upgrade to Pro for more usage.`);
    this.name = "QuotaExceededError";
  }
}

export function currentUsagePeriod() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

export async function reserveUsage(userId: string, metric: UsageMetric) {
  const periodStart = currentUsagePeriod();

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await prisma.$transaction(
        async (tx) => {
          const user = await tx.user.findUnique({
            where: { id: userId },
            select: { plan: true },
          });
          if (!user) throw new Error("User not found");

          const limit = metricLimit(user.plan, metric);
          await tx.usageRecord.upsert({
            where: { userId_metric_periodStart: { userId, metric, periodStart } },
            create: { userId, metric, periodStart },
            update: {},
          });

          const updated = await tx.usageRecord.updateMany({
            where: { userId, metric, periodStart, count: { lt: limit } },
            data: { count: { increment: 1 } },
          });

          if (updated.count === 0) throw new QuotaExceededError(metric, limit);
          return { limit, periodStart };
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    } catch (error) {
      const retryable = error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034";
      if (!retryable || attempt === 2) throw error;
    }
  }

  throw new Error("Unable to reserve usage");
}

export async function releaseUsage(userId: string, metric: UsageMetric, periodStart: Date) {
  await prisma.usageRecord.updateMany({
    where: { userId, metric, periodStart, count: { gt: 0 } },
    data: { count: { decrement: 1 } },
  });
}

export async function withUsage<T>(userId: string, metric: UsageMetric, operation: () => Promise<T>) {
  const reservation = await reserveUsage(userId, metric);
  try {
    return await operation();
  } catch (error) {
    await releaseUsage(userId, metric, reservation.periodStart).catch((releaseError) => {
      console.error("Failed to release usage reservation:", releaseError);
    });
    throw error;
  }
}

export async function withUsageResponse(
  userId: string,
  metric: UsageMetric,
  operation: () => Promise<Response>,
) {
  const reservation = await reserveUsage(userId, metric);
  try {
    const response = await operation();
    if (!response.ok) await releaseUsage(userId, metric, reservation.periodStart);
    return response;
  } catch (error) {
    await releaseUsage(userId, metric, reservation.periodStart).catch((releaseError) => {
      console.error("Failed to release usage reservation:", releaseError);
    });
    throw error;
  }
}

export async function getBillingOverview(userId: string) {
  const periodStart = currentUsagePeriod();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      plan: true,
      stripeCustomerId: true,
      subscription: true,
      usageRecords: {
        where: { periodStart },
        select: { metric: true, count: true },
      },
    },
  });
  if (!user) throw new Error("User not found");

  const usage = Object.fromEntries(user.usageRecords.map((record) => [record.metric, record.count])) as Partial<
    Record<UsageMetric, number>
  >;

  return {
    ...user,
    usage: {
      UPLOAD: usage.UPLOAD ?? 0,
      AI_GENERATE: usage.AI_GENERATE ?? 0,
      AI_EXPLAIN: usage.AI_EXPLAIN ?? 0,
      AI_SOLVE: usage.AI_SOLVE ?? 0,
    },
    limits: {
      UPLOAD: metricLimit(user.plan, UsageMetric.UPLOAD),
      AI_GENERATE: metricLimit(user.plan, UsageMetric.AI_GENERATE),
      AI_EXPLAIN: metricLimit(user.plan, UsageMetric.AI_EXPLAIN),
      AI_SOLVE: metricLimit(user.plan, UsageMetric.AI_SOLVE),
    },
  };
}

export function planLabel(plan: Plan) {
  return plan === Plan.PRO ? "Pro" : "Free";
}
