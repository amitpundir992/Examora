import { Check, Crown } from "lucide-react";
import { auth } from "@/lib/auth";
import { getBillingOverview, planLabel } from "@/lib/billing/usage";
import { PLAN_LIMITS } from "@/lib/billing/plans";
import { Badge, Card } from "@/components/ui";
import { CheckoutButton, ManageBillingButton } from "@/components/billing-actions";

export const dynamic = "force-dynamic";

const USAGE_LABELS = {
  UPLOAD: "Exam imports",
  AI_GENERATE: "AI exam generations",
  AI_EXPLAIN: "AI explanations",
  AI_SOLVE: "AI solutions",
} as const;

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "UTC" }).format(value);
}

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>;
}) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;

  const billing = await getBillingOverview(userId);
  const query = await searchParams;
  const isPro = billing.plan === "PRO";

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Billing</h1>
          <p className="text-sm text-muted-foreground">Plan, usage, invoices, and payment details.</p>
        </div>
        <Badge className={isPro ? "border-success text-success" : ""}>{planLabel(billing.plan)} plan</Badge>
      </div>

      {query.checkout === "success" && (
        <div className="rounded-md border border-success bg-[color-mix(in_srgb,var(--success)_10%,transparent)] p-4 text-sm">
          Payment received. Your Pro access will appear as soon as Stripe confirms the subscription.
        </div>
      )}

      <section>
        <div className="mb-3 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Current plan</h2>
            {billing.subscription && (
              <p className="text-sm text-muted-foreground">
                {billing.subscription.cancelAtPeriodEnd ? "Access ends" : "Renews"}{" "}
                {formatDate(billing.subscription.currentPeriodEnd)}
              </p>
            )}
          </div>
          {billing.stripeCustomerId && <ManageBillingButton />}
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Object.entries(USAGE_LABELS).map(([metric, label]) => {
            const key = metric as keyof typeof billing.usage;
            const used = billing.usage[key];
            const limit = billing.limits[key];
            const percent = Math.min(100, Math.round((used / limit) * 100));
            return (
              <Card key={metric} className="p-4">
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="mt-1 text-2xl font-bold">{used} <span className="text-sm font-normal text-muted-foreground">/ {limit}</span></p>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div className="h-full bg-primary" style={{ width: `${percent}%` }} />
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {!isPro && (
        <section>
          <div className="mb-4">
            <h2 className="text-lg font-semibold">Upgrade to Pro</h2>
            <p className="text-sm text-muted-foreground">Choose a billing interval. Both options include the same Pro limits.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Pro Monthly</h3>
                <Crown className="h-5 w-5 text-primary" />
              </div>
              <p className="mt-3 text-3xl font-bold">$3 <span className="text-sm font-normal text-muted-foreground">/ month</span></p>
              <PlanFeatures />
              <CheckoutButton interval="monthly">Upgrade monthly</CheckoutButton>
            </Card>

            <Card className="border-primary p-6">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Pro Yearly</h3>
                <Badge className="border-success text-success">Save 50%</Badge>
              </div>
              <p className="mt-3 text-3xl font-bold">$30 <span className="text-sm font-normal text-muted-foreground">/ year</span></p>
              <PlanFeatures />
              <CheckoutButton interval="yearly">Upgrade yearly</CheckoutButton>
            </Card>
          </div>
        </section>
      )}
    </div>
  );
}

function PlanFeatures() {
  const limits = PLAN_LIMITS.PRO;
  const features = [
    `${limits.uploads} exam imports per month`,
    `${limits.aiGenerations} AI exam generations per month`,
    `${limits.aiExplanations} AI explanations per month`,
    `${limits.aiSolutions} AI solutions per month`,
    `${Math.round(limits.maxFileBytes / 1024 / 1024)} MB file uploads`,
  ];

  return (
    <ul className="my-6 space-y-2 text-sm">
      {features.map((feature) => (
        <li key={feature} className="flex items-center gap-2">
          <Check className="h-4 w-4 text-success" />
          {feature}
        </li>
      ))}
    </ul>
  );
}
