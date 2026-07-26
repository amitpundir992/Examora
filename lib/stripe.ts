import "server-only";

import Stripe from "stripe";

let stripeClient: Stripe | undefined;

export function getStripe() {
  if (stripeClient) return stripeClient;

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }

  stripeClient = new Stripe(secretKey, {
    appInfo: {
      name: "Examora",
      version: "0.1.0",
    },
    maxNetworkRetries: 2,
    timeout: 20_000,
  });

  return stripeClient;
}

export function getAppUrl() {
  const value = process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL;
  if (!value) throw new Error("NEXT_PUBLIC_APP_URL or NEXTAUTH_URL is not configured");
  return value.replace(/\/$/, "");
}
