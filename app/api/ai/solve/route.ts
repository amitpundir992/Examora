import { UsageMetric } from "@prisma/client";
import { solveInputSchema } from "@/lib/types";
import { solve } from "@/lib/ai/service";
import { ok, fail, parseBody, guard } from "@/lib/api";
import { requireAuth } from "@/lib/auth-helpers";
import { QuotaExceededError, withUsage } from "@/lib/billing/usage";

export async function POST(req: Request) {
  const { error, user } = await requireAuth();
  if (error || !user) return error;

  const limited = guard(req, "ai:solve", 30);
  if (limited) return limited;

  const parsed = await parseBody(req, solveInputSchema);
  if ("res" in parsed) return parsed.res;

  try {
    return ok(await withUsage(user.id, UsageMetric.AI_SOLVE, () => solve(parsed.data)));
  } catch (error) {
    if (error instanceof QuotaExceededError) return fail(error.message, 429);
    return fail("AI solve failed. Check your API key or try again.", 502);
  }
}
