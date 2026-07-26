import "server-only";

import type Stripe from "stripe";
import { Plan, SubscriptionStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isProPrice } from "./plans";

const STATUS_MAP: Record<Stripe.Subscription.Status, SubscriptionStatus> = {
  incomplete: SubscriptionStatus.INCOMPLETE,
  incomplete_expired: SubscriptionStatus.INCOMPLETE_EXPIRED,
  trialing: SubscriptionStatus.TRIALING,
  active: SubscriptionStatus.ACTIVE,
  past_due: SubscriptionStatus.PAST_DUE,
  canceled: SubscriptionStatus.CANCELED,
  unpaid: SubscriptionStatus.UNPAID,
  paused: SubscriptionStatus.PAUSED,
};

function stripeId(value: string | { id: string } | null) {
  return typeof value === "string" ? value : value?.id ?? null;
}

export async function syncSubscription(subscription: Stripe.Subscription, explicitUserId?: string) {
  const customerId = stripeId(subscription.customer);
  const userId =
    explicitUserId ??
    subscription.metadata.userId ??
    (
      await prisma.user.findFirst({
        where: customerId ? { stripeCustomerId: customerId } : { id: "__missing__" },
        select: { id: true },
      })
    )?.id;

  if (!userId) {
    throw new Error(`No Examora user found for Stripe subscription ${subscription.id}`);
  }

  const item = subscription.items.data[0];
  if (!item) throw new Error(`Stripe subscription ${subscription.id} has no price item`);

  const status = STATUS_MAP[subscription.status];
  const periodEnd = new Date(item.current_period_end * 1000);
  const grantsAccess =
    isProPrice(item.price.id) &&
    (status === SubscriptionStatus.ACTIVE ||
      status === SubscriptionStatus.TRIALING ||
      (status === SubscriptionStatus.PAST_DUE && periodEnd > new Date()));

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: {
        plan: grantsAccess ? Plan.PRO : Plan.FREE,
        ...(customerId ? { stripeCustomerId: customerId } : {}),
      },
    }),
    prisma.subscription.upsert({
      where: { userId },
      create: {
        userId,
        stripeSubscriptionId: subscription.id,
        stripePriceId: item.price.id,
        status,
        currentPeriodStart: new Date(item.current_period_start * 1000),
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
      },
      update: {
        stripeSubscriptionId: subscription.id,
        stripePriceId: item.price.id,
        status,
        currentPeriodStart: new Date(item.current_period_start * 1000),
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
      },
    }),
  ]);
}
