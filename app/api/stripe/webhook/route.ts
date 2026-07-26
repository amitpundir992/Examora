import type Stripe from "stripe";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { syncSubscription } from "@/lib/billing/subscriptions";

export const runtime = "nodejs";

async function processEvent(event: Stripe.Event) {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const subscriptionId =
        typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
      if (!subscriptionId) return;

      const subscription = await getStripe().subscriptions.retrieve(subscriptionId);
      await syncSubscription(subscription, session.metadata?.userId ?? session.client_reference_id ?? undefined);
      return;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      await syncSubscription(event.data.object);
      return;
    case "invoice.paid":
    case "invoice.payment_failed":
      // Subscription lifecycle events carry the authoritative access state.
      return;
    default:
      return;
  }
}

export async function POST(req: Request) {
  const signature = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !webhookSecret) {
    return new Response("Webhook signature is not configured", { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const rawBody = await req.text();
    event = getStripe().webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (error) {
    console.error("Stripe webhook signature verification failed:", error);
    return new Response("Invalid webhook signature", { status: 400 });
  }

  const existing = await prisma.stripeEvent.findUnique({
    where: { id: event.id },
    select: { processedAt: true, createdAt: true },
  });
  if (existing?.processedAt) return Response.json({ received: true, duplicate: true });
  if (existing && Date.now() - existing.createdAt.getTime() < 5 * 60_000) {
    return Response.json({ received: true, processing: true });
  }

  let ownsEventRecord = false;
  if (!existing) {
    try {
      await prisma.stripeEvent.create({ data: { id: event.id, type: event.type } });
      ownsEventRecord = true;
    } catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") {
        throw error;
      }
      return Response.json({ received: true, duplicate: true });
    }
  } else {
    await prisma.stripeEvent.update({
      where: { id: event.id },
      data: { createdAt: new Date() },
    });
    ownsEventRecord = true;
  }

  try {
    await processEvent(event);
    await prisma.stripeEvent.update({
      where: { id: event.id },
      data: { processedAt: new Date() },
    });
    return Response.json({ received: true });
  } catch (error) {
    console.error(`Stripe webhook ${event.id} failed:`, error);
    if (ownsEventRecord) {
      await prisma.stripeEvent.delete({ where: { id: event.id } }).catch(() => undefined);
    }
    return new Response("Webhook processing failed", { status: 500 });
  }
}
