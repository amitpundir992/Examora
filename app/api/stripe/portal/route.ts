import { prisma } from "@/lib/prisma";
import { getAppUrl, getStripe } from "@/lib/stripe";
import { requireAuth } from "@/lib/auth-helpers";
import { fail, guard, requireSameOrigin } from "@/lib/api";

export async function POST(req: Request) {
  const originError = requireSameOrigin(req);
  if (originError) return originError;

  const limited = guard(req, "stripe:portal", 20);
  if (limited) return limited;

  const { error, user: sessionUser } = await requireAuth();
  if (error || !sessionUser) return error;

  try {
    const user = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: { stripeCustomerId: true },
    });
    if (!user?.stripeCustomerId) return fail("No billing account found", 404);

    const session = await getStripe().billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${getAppUrl()}/billing`,
    });

    return Response.json({ url: session.url });
  } catch (error) {
    console.error("Stripe Portal error:", error);
    return fail("Unable to open billing management. Please try again.", 502);
  }
}
