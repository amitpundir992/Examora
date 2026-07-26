import { UsageMetric } from "@prisma/client";
import { explainInputSchema } from "@/lib/types";
import { explain } from "@/lib/ai/service";
import { ok, fail, parseBody, guard } from "@/lib/api";
import { requireAuth } from "@/lib/auth-helpers";
import { QuotaExceededError, withUsage } from "@/lib/billing/usage";

export async function POST(req: Request) {
  const { error, user } = await requireAuth();
  if (error || !user) return error;

  const limited = guard(req, "ai:explain", 30);
  if (limited) return limited;

  const parsed = await parseBody(req, explainInputSchema);
  if ("res" in parsed) return parsed.res;

  try {
    const explanation = await withUsage(user.id, UsageMetric.AI_EXPLAIN, () => explain(parsed.data));
    return ok({ explanation });
  } catch (error) {
    if (error instanceof QuotaExceededError) return fail(error.message, 429);
    return fail("AI explanation failed. Check your API key or try again.", 502);
  }
}
