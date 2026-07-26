import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAppUrl, getStripe } from "@/lib/stripe";
import { getPriceId } from "@/lib/billing/plans";
import { requireAuth } from "@/lib/auth-helpers";
import { fail, guard, parseBody, requireSameOrigin } from "@/lib/api";

const checkoutSchema = z.object({
  interval: z.enum(["monthly", "yearly"]),
});

export async function POST(req: Request) {
  const originError = requireSameOrigin(req);
  if (originError) return originError;

  const limited = guard(req, "stripe:checkout", 10);
  if (limited) return limited;

  const { error, user: sessionUser } = await requireAuth();
  if (error || !sessionUser) return error;

  const parsed = await parseBody(req, checkoutSchema);
  if ("res" in parsed) return parsed.res;

  try {
    const user = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      include: { subscription: true },
    });
    if (!user) return fail("User not found", 404);

    if (
      user.subscription &&
      ["ACTIVE", "TRIALING", "PAST_DUE"].includes(user.subscription.status)
    ) {
      return fail("You already have a subscription. Use Manage billing to change it.", 409);
    }

    const stripe = getStripe();
    let customerId = user.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create(
        {
          email: user.email,
          name: user.name ?? undefined,
          metadata: { userId: user.id, app: "examora" },
        },
        { idempotencyKey: `examora-customer-${user.id}` },
      );
      customerId = customer.id;
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: customerId },
      });
    }

    const appUrl = getAppUrl();
    const priceId = getPriceId(parsed.data.interval);
    const idempotencyWindow = Math.floor(Date.now() / 600_000);
    const checkout = await stripe.checkout.sessions.create(
      {
        mode: "subscription",
        customer: customerId,
        line_items: [{ price: priceId, quantity: 1 }],
        client_reference_id: user.id,
        metadata: { userId: user.id, app: "examora" },
        subscription_data: { metadata: { userId: user.id, app: "examora" } },
        allow_promotion_codes: true,
        success_url: `${appUrl}/billing?checkout=success`,
        cancel_url: `${appUrl}/billing?checkout=canceled`,
      },
      {
        idempotencyKey: `examora-checkout-${user.id}-${parsed.data.interval}-${idempotencyWindow}`,
      },
    );

    if (!checkout.url) return fail("Stripe did not return a Checkout URL", 502);
    return Response.json({ url: checkout.url });
  } catch (error) {
    console.error("Stripe Checkout error:", error);
    return fail("Unable to start Checkout. Please try again.", 502);
  }
}
